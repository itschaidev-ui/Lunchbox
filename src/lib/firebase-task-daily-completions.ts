/**
 * Task Daily Completions
 * Tracks which specific days repeating tasks were completed
 */

import { db } from './firebase';
import { collection, doc, setDoc, getDoc, deleteDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export interface TaskDailyCompletion {
  id?: string;
  taskId: string;
  userId: string;
  completionDate: string; // ISO date string (YYYY-MM-DD format)
  completedAt: string; // ISO timestamp
}

const COMPLETIONS_COLLECTION = 'task_daily_completions';

/**
 * Check if a repeating task is completed for a specific date
 */
export async function isTaskCompletedForDate(
  taskId: string,
  date: Date
): Promise<boolean> {
  try {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const completionId = `${taskId}_${dateStr}`;
    const completionRef = doc(db, COMPLETIONS_COLLECTION, completionId);
    const completionDoc = await getDoc(completionRef);
    return completionDoc.exists();
  } catch (error) {
    console.error('Error checking task completion for date:', error);
    return false;
  }
}

/**
 * Mark a repeating task as completed for a specific date
 */
export async function markTaskCompletedForDate(
  taskId: string,
  userId: string,
  date: Date
): Promise<void> {
  try {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const completionId = `${taskId}_${dateStr}`;
    const completionRef = doc(db, COMPLETIONS_COLLECTION, completionId);
    
    await setDoc(completionRef, {
      taskId,
      userId,
      completionDate: dateStr,
      completedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error marking task completed for date:', error);
    throw error;
  }
}

/**
 * Unmark a repeating task as completed for a specific date
 */
export async function unmarkTaskCompletedForDate(
  taskId: string,
  date: Date
): Promise<void> {
  try {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const completionId = `${taskId}_${dateStr}`;
    const completionRef = doc(db, COMPLETIONS_COLLECTION, completionId);
    await deleteDoc(completionRef);
  } catch (error) {
    console.error('Error unmarking task completed for date:', error);
    throw error;
  }
}

/**
 * Get all completion dates for a task
 */
export async function getTaskCompletionDates(taskId: string): Promise<string[]> {
  try {
    const completionsQuery = query(
      collection(db, COMPLETIONS_COLLECTION),
      where('taskId', '==', taskId)
    );
    const snapshot = await getDocs(completionsQuery);
    return snapshot.docs.map(doc => doc.data().completionDate);
  } catch (error) {
    console.error('Error getting task completion dates:', error);
    return [];
  }
}

