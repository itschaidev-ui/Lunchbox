import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';

/**
 * Track routine completions to prevent credit farming exploits
 */

export interface RoutineCompletion {
  routineId: string;
  userId: string;
  completedAt: string;
  creditsAwarded: number;
  completionDate: string; // YYYY-MM-DD format for easy querying
}

/**
 * Check if a routine has been completed today
 */
export async function hasCompletedRoutineToday(
  userId: string,
  routineId: string
): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const completionId = `${userId}_${routineId}_${today}`;
    
    const completionRef = doc(db, 'routine_completions', completionId);
    const completionSnap = await getDoc(completionRef);
    
    return completionSnap.exists();
  } catch (error) {
    console.error('Error checking routine completion:', error);
    return false;
  }
}

/**
 * Mark a routine as completed for today
 */
export async function markRoutineCompleted(
  userId: string,
  routineId: string,
  creditsAwarded: number
): Promise<void> {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const completionId = `${userId}_${routineId}_${today}`;
    
    const completion: RoutineCompletion = {
      routineId,
      userId,
      completedAt: now.toISOString(),
      creditsAwarded,
      completionDate: today,
    };
    
    const completionRef = doc(db, 'routine_completions', completionId);
    await setDoc(completionRef, completion);
    
    console.log(`✅ Marked routine ${routineId} as completed for ${today}`);
  } catch (error) {
    console.error('Error marking routine completed:', error);
    throw error;
  }
}

/**
 * Get all routines completed by user today
 */
export async function getTodayCompletedRoutines(userId: string): Promise<string[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const completionsRef = collection(db, 'routine_completions');
    const q = query(
      completionsRef,
      where('userId', '==', userId),
      where('completionDate', '==', today)
    );
    
    const querySnapshot = await getDocs(q);
    const completedRoutineIds: string[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as RoutineCompletion;
      completedRoutineIds.push(data.routineId);
    });
    
    return completedRoutineIds;
  } catch (error) {
    console.error('Error getting today completed routines:', error);
    return [];
  }
}

/**
 * Clean up old routine completions (older than 7 days)
 * This should be called periodically by a cron job
 */
export async function cleanupOldCompletions(): Promise<void> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
    
    const completionsRef = collection(db, 'routine_completions');
    const q = query(
      completionsRef,
      where('completionDate', '<', cutoffDate)
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
    console.log(`🧹 Cleaned up ${deletePromises.length} old routine completions`);
  } catch (error) {
    console.error('Error cleaning up old completions:', error);
  }
}


