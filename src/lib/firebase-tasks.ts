import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Task } from '@/lib/types';

const TASKS_COLLECTION = 'tasks';

export interface FirebaseTask extends Omit<Task, 'id'> {
  userId: string;
  userEmail: string;
  createdAt: any;
  updatedAt: any;
  description?: string;
  dueDate?: string;
  tags?: string[];
  tagColors?: Record<string, string>;
  starred?: boolean;
  userTimezone?: string;
  columnId?: string;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: string;
  }>;
}

export const saveTask = async (task: Omit<Task, 'id'>, userId: string, userEmail: string): Promise<string> => {
  try {
    const taskData: Omit<FirebaseTask, 'id'> = {
      text: task.text,
      completed: task.completed || false,
      userId,
      userEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Only add optional fields if they have values
    if (task.description) {
      taskData.description = task.description;
    }
    if (task.dueDate) {
      taskData.dueDate = task.dueDate;
    }
    if (task.tags && task.tags.length > 0) {
      (taskData as any).tags = task.tags;
    }
    if (task.tagColors) {
      (taskData as any).tagColors = task.tagColors;
    }
    if (task.starred !== undefined) {
      (taskData as any).starred = task.starred;
    }
    if (task.userTimezone) {
      (taskData as any).userTimezone = task.userTimezone;
    }
    if (task.availableDays && task.availableDays.length > 0) {
      (taskData as any).availableDays = task.availableDays;
    }
    if (task.availableDaysTime) {
      (taskData as any).availableDaysTime = task.availableDaysTime;
    }
    if (task.repeatWeeks !== undefined) {
      (taskData as any).repeatWeeks = task.repeatWeeks;
    }
    if (task.repeatStartDate) {
      (taskData as any).repeatStartDate = task.repeatStartDate;
    }
    if (task.columnId) {
      (taskData as any).columnId = task.columnId;
    }
    if (task.attachments && task.attachments.length > 0) {
      // Serialize attachments as plain objects for Firestore
      (taskData as any).attachments = task.attachments.map(att => ({
        id: att.id,
        fileName: att.fileName,
        fileType: att.fileType,
        fileUrl: att.fileUrl,
        fileSize: att.fileSize,
        uploadedAt: att.uploadedAt
      }));
    }
    
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving task:', error);
    throw error;
  }
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    
    // Filter out undefined values
    const cleanUpdates: any = {
      updatedAt: serverTimestamp()
    };
    
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    });
    
    await updateDoc(taskRef, cleanUpdates);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const getUserTasks = async (userId: string): Promise<Task[]> => {
  try {
    const tasksQuery = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(tasksQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    throw error;
  }
};

export const getAllTasks = async (): Promise<Array<Task & { userId: string; userEmail: string; createdAt: any; updatedAt: any }>> => {
  try {
    const tasksQuery = query(
      collection(db, TASKS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(tasksQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task & { userId: string; userEmail: string; createdAt: any; updatedAt: any }));
  } catch (error) {
    console.error('Error fetching all tasks:', error);
    throw error;
  }
};

export const subscribeToUserTasks = (userId: string, callback: (tasks: Task[]) => void, errorCallback?: (error: any) => void) => {
  console.log('Setting up Firebase subscription for user:', userId);
  
  // Check if user is authenticated
  if (!userId) {
    console.error('No userId provided for subscription');
    if (errorCallback) {
      errorCallback(new Error('No userId provided'));
    }
    return () => {}; // Return empty unsubscribe function
  }
  
  const tasksQuery = query(
    collection(db, TASKS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(tasksQuery, (querySnapshot) => {
    console.log('Firebase snapshot received:', querySnapshot.docs.length, 'tasks');
    const tasks = querySnapshot.docs.map(doc => {
      const taskData = doc.data();
      console.log('Task data from Firebase:', taskData);
      return {
        id: doc.id,
        ...taskData
      } as Task;
    });
    console.log('Processed tasks for callback:', tasks);
    callback(tasks);
  }, (error) => {
    console.error('Firebase subscription error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    
    if (errorCallback) {
      errorCallback(error);
    } else {
      // Still call callback with empty array to prevent hanging
      callback([]);
    }
  });
};

// Debug function to manually fetch tasks
export const fetchUserTasks = async (userId: string): Promise<Task[]> => {
  console.log('Manually fetching tasks for user:', userId);
  try {
    const tasksQuery = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(tasksQuery);
    console.log('Manual fetch - found', querySnapshot.docs.length, 'tasks');
    
    const tasks = querySnapshot.docs.map(doc => {
      const taskData = doc.data();
      console.log('Manual fetch - task data:', taskData);
      return {
        id: doc.id,
        ...taskData
      } as Task;
    });
    
    console.log('Manual fetch - processed tasks:', tasks);
    return tasks;
  } catch (error) {
    console.error('Manual fetch error:', error);
    return [];
  }
};
