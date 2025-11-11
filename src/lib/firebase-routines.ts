import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import type { Routine, Task } from './types';

/**
 * Get all routines for a user
 */
export async function getUserRoutines(userId: string): Promise<Routine[]> {
  try {
    const routinesRef = collection(db, 'routines');
    const q = query(
      routinesRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const routines: Routine[] = [];

    querySnapshot.forEach((doc) => {
      routines.push({
        id: doc.id,
        ...doc.data(),
      } as Routine);
    });

    return routines;
  } catch (error) {
    console.error('Error getting user routines:', error);
    throw error;
  }
}

/**
 * Get a single routine by ID
 */
export async function getRoutine(routineId: string): Promise<Routine | null> {
  try {
    const routineRef = doc(db, 'routines', routineId);
    const routineSnap = await getDoc(routineRef);

    if (routineSnap.exists()) {
      return {
        id: routineSnap.id,
        ...routineSnap.data(),
      } as Routine;
    }

    return null;
  } catch (error) {
    console.error('Error getting routine:', error);
    throw error;
  }
}

/**
 * Create a new routine
 */
export async function createRoutine(
  userId: string,
  name: string,
  description: string,
  taskIds: string[]
): Promise<string> {
  try {
    const now = new Date().toISOString();
    const routineData = {
      userId,
      name,
      description,
      taskIds,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    const routinesRef = collection(db, 'routines');
    const docRef = await addDoc(routinesRef, routineData);
    
    console.log(`✅ Created routine: ${name}`);
    return docRef.id;
  } catch (error) {
    console.error('Error creating routine:', error);
    throw error;
  }
}

/**
 * Update a routine
 */
export async function updateRoutine(
  routineId: string,
  updates: Partial<Omit<Routine, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  try {
    const routineRef = doc(db, 'routines', routineId);
    await updateDoc(routineRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Updated routine: ${routineId}`);
  } catch (error) {
    console.error('Error updating routine:', error);
    throw error;
  }
}

/**
 * Delete a routine
 */
export async function deleteRoutine(routineId: string): Promise<void> {
  try {
    const routineRef = doc(db, 'routines', routineId);
    await deleteDoc(routineRef);

    console.log(`✅ Deleted routine: ${routineId}`);
  } catch (error) {
    console.error('Error deleting routine:', error);
    throw error;
  }
}

/**
 * Toggle routine active status
 */
export async function toggleRoutineActive(routineId: string, isActive: boolean): Promise<void> {
  try {
    const routineRef = doc(db, 'routines', routineId);
    await updateDoc(routineRef, {
      isActive,
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Toggled routine ${routineId} to ${isActive ? 'active' : 'inactive'}`);
  } catch (error) {
    console.error('Error toggling routine:', error);
    throw error;
  }
}

/**
 * Add tasks to a routine
 */
export async function addTasksToRoutine(routineId: string, taskIds: string[]): Promise<void> {
  try {
    const routine = await getRoutine(routineId);
    if (!routine) {
      throw new Error('Routine not found');
    }

    const updatedTaskIds = [...new Set([...routine.taskIds, ...taskIds])];
    await updateRoutine(routineId, { taskIds: updatedTaskIds });

    console.log(`✅ Added ${taskIds.length} tasks to routine ${routineId}`);
  } catch (error) {
    console.error('Error adding tasks to routine:', error);
    throw error;
  }
}

/**
 * Remove tasks from a routine
 */
export async function removeTasksFromRoutine(routineId: string, taskIds: string[]): Promise<void> {
  try {
    const routine = await getRoutine(routineId);
    if (!routine) {
      throw new Error('Routine not found');
    }

    const updatedTaskIds = routine.taskIds.filter(id => !taskIds.includes(id));
    await updateRoutine(routineId, { taskIds: updatedTaskIds });

    console.log(`✅ Removed ${taskIds.length} tasks from routine ${routineId}`);
  } catch (error) {
    console.error('Error removing tasks from routine:', error);
    throw error;
  }
}

/**
 * Get routine completion status for today
 */
export async function getRoutineCompletionStatus(
  routine: Routine,
  tasks: Task[]
): Promise<{ completed: number; total: number; percentage: number; completedTaskIds: string[] }> {
  const routineTasks = tasks.filter(task => routine.taskIds.includes(task.id));
  const completedTasks = routineTasks.filter(task => task.completed);

  return {
    completed: completedTasks.length,
    total: routineTasks.length,
    percentage: routineTasks.length > 0 ? (completedTasks.length / routineTasks.length) * 100 : 0,
    completedTaskIds: completedTasks.map(task => task.id),
  };
}

