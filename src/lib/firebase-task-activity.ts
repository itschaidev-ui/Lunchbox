/**
 * Task Activity Logging System
 * Tracks all changes and actions performed on tasks
 */

import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';

export type TaskActivityType = 
  | 'created'
  | 'completed'
  | 'uncompleted'
  | 'edited'
  | 'deleted'
  | 'starred'
  | 'unstarred'
  | 'tag_added'
  | 'tag_removed'
  | 'due_date_set'
  | 'due_date_changed'
  | 'due_date_removed'
  | 'repeating_scheduled'
  | 'repeating_updated'
  | 'reset';

export interface TaskActivity {
  id?: string;
  taskId: string;
  userId: string;
  activityType: TaskActivityType;
  timestamp: string;
  details?: {
    field?: string;
    oldValue?: any;
    newValue?: any;
    description?: string;
  };
}

const ACTIVITY_COLLECTION = 'task_activities';

/**
 * Log a task activity
 */
export async function logTaskActivity(
  taskId: string,
  userId: string,
  activityType: TaskActivityType,
  details?: TaskActivity['details']
): Promise<string> {
  try {
    const activityData = {
      taskId,
      userId,
      activityType,
      timestamp: serverTimestamp(),
      details: details || {},
    };

    const docRef = await addDoc(collection(db, ACTIVITY_COLLECTION), activityData);
    return docRef.id;
  } catch (error) {
    console.error('Error logging task activity:', error);
    throw error;
  }
}

/**
 * Get activity log for a specific task
 */
export async function getTaskActivityLog(taskId: string, limitCount: number = 50): Promise<TaskActivity[]> {
  try {
    const activitiesQuery = query(
      collection(db, ACTIVITY_COLLECTION),
      where('taskId', '==', taskId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(activitiesQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        taskId: data.taskId,
        userId: data.userId,
        activityType: data.activityType,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp || new Date().toISOString(),
        details: data.details || {},
      } as TaskActivity;
    });
  } catch (error) {
    console.error('Error fetching task activity log:', error);
    return [];
  }
}

/**
 * Get activity log for all user's tasks
 */
export async function getUserTaskActivityLog(userId: string, limitCount: number = 100): Promise<TaskActivity[]> {
  try {
    const activitiesQuery = query(
      collection(db, ACTIVITY_COLLECTION),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(activitiesQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        taskId: data.taskId,
        userId: data.userId,
        activityType: data.activityType,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp || new Date().toISOString(),
        details: data.details || {},
      } as TaskActivity;
    });
  } catch (error) {
    console.error('Error fetching user task activity log:', error);
    return [];
  }
}

