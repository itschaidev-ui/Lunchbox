/**
 * Routine Scheduler
 * Handles daily routine resets at midnight in user's timezone
 */

import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';

import type { Routine } from './types';
import { getLastReset, updateLastReset, needsReset } from './firebase-last-reset';
import { getRoutineSettings } from './firebase-routine-settings';
import { getUserRoutines } from './firebase-routines';

/**
 * Reset routines for a specific user
 * Also unchecks all routine tasks
 */
export async function resetUserRoutines(userId: string): Promise<number> {
  try {
    console.log(`🔄 Resetting routines for user: ${userId}`);
    
    // 1. Delete all routine completions
    const completionsRef = collection(db, 'routine_completions');
    const completionsQuery = query(completionsRef, where('userId', '==', userId));
    const completionsSnapshot = await getDocs(completionsQuery);
    
    const deletePromises: Promise<void>[] = [];
    completionsSnapshot.forEach((docSnap) => {
      deletePromises.push(deleteDoc(docSnap.ref));
    });
    
    await Promise.all(deletePromises);
    
    // 2. Get all routines for this user and collect all task IDs
    const routines = await getUserRoutines(userId);
    const allRoutineTaskIds = new Set<string>();
    
    routines.forEach((routine) => {
      routine.taskIds.forEach((taskId) => {
        allRoutineTaskIds.add(taskId);
      });
    });
    
    // 3. Uncheck all tasks that are part of routines (set completed = false)
    const updatePromises: Promise<void>[] = [];
    
    if (allRoutineTaskIds.size > 0) {
      // Get all tasks for this user
      const tasksRef = collection(db, 'tasks');
      const tasksQuery = query(tasksRef, where('userId', '==', userId));
      const tasksSnapshot = await getDocs(tasksQuery);
      
      tasksSnapshot.forEach((docSnap) => {
        const taskId = docSnap.id;
        // If this task is part of any routine, mark it as incomplete
        if (allRoutineTaskIds.has(taskId)) {
          const taskRef = doc(db, 'tasks', taskId);
          updatePromises.push(
            setDoc(taskRef, { completed: false }, { merge: true })
          );
        }
      });
    }
    
    await Promise.all(updatePromises);
    
    console.log(`✅ Reset ${deletePromises.length} completions and unchecked ${updatePromises.length} routine tasks for user ${userId}`);
    console.log(`📋 Routines found: ${routines.length}, Total unique task IDs: ${allRoutineTaskIds.size}`);
    return deletePromises.length;
  } catch (error) {
    console.error(`❌ Error resetting routines for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Reset all routine completions for a new day
 * This should be called at midnight (00:00) in the user's timezone
 */
export async function resetDailyRoutines(): Promise<void> {
  try {
    console.log('🔄 Starting daily routine reset...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    
    // Get all routine completions from yesterday or earlier
    const completionsRef = collection(db, 'routine_completions');
    const q = query(
      completionsRef,
      where('completionDate', '<=', yesterdayDate)
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises: Promise<void>[] = [];
    
    querySnapshot.forEach((docSnap) => {
      deletePromises.push(deleteDoc(docSnap.ref));
    });
    
    await Promise.all(deletePromises);
    
    console.log(`✅ Reset ${deletePromises.length} routine completions`);
  } catch (error) {
    console.error('❌ Error resetting daily routines:', error);
    throw error;
  }
}

/**
 * Check if it's time to reset routines based on user settings
 * This checks if reset time has passed since last reset
 */
export async function checkAndResetRoutines(): Promise<void> {
  try {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    console.log(`⏰ Checking routines reset at ${currentTime}...`);
    
    // Get all users with custom reset times
    const settingsRef = collection(db, 'routine_settings');
    const settingsSnapshot = await getDocs(settingsRef);
    
    let resetCount = 0;
    
    for (const docSnap of settingsSnapshot.docs) {
      const settings = docSnap.data();
      const userId = settings.userId;
      const resetTime = settings.resetTime || '00:00';
      
      // Get last reset record
      const lastReset = await getLastReset(userId);
      
      // Check if reset is needed (time has passed since last reset)
      if (needsReset(resetTime, lastReset)) {
        console.log(`🔄 Reset needed for user ${userId} (reset time: ${resetTime})`);
        
        // Reset the user's routines
        await resetUserRoutines(userId);
        
        // Update last reset record
        await updateLastReset(userId);
        
        resetCount++;
      }
    }
    
    if (resetCount > 0) {
      console.log(`✅ Reset ${resetCount} user routines`);
    } else {
      console.log(`⏭️ No resets needed at ${currentTime}`);
    }
  } catch (error) {
    console.error('Error in routine reset check:', error);
  }
}

/**
 * Manual reset for testing or admin purposes
 * Resets all completions regardless of date
 */
export async function manualResetAllRoutines(): Promise<number> {
  try {
    console.log('🔧 Manual reset initiated...');
    
    const completionsRef = collection(db, 'routine_completions');
    const querySnapshot = await getDocs(completionsRef);
    
    const deletePromises: Promise<void>[] = [];
    const userIds = new Set<string>();
    
    // Collect all user IDs from completions
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.userId) {
        userIds.add(data.userId);
      }
      deletePromises.push(deleteDoc(docSnap.ref));
    });
    
    await Promise.all(deletePromises);
    
    // Reset tasks for all users
    let totalTasksReset = 0;
    for (const userId of userIds) {
      try {
        const routines = await getUserRoutines(userId);
        const allRoutineTaskIds = new Set<string>();
        
        routines.forEach((routine) => {
          routine.taskIds.forEach((taskId) => {
            allRoutineTaskIds.add(taskId);
          });
        });
        
        if (allRoutineTaskIds.size > 0) {
          const tasksRef = collection(db, 'tasks');
          const tasksQuery = query(tasksRef, where('userId', '==', userId));
          const tasksSnapshot = await getDocs(tasksQuery);
          
          const taskUpdatePromises: Promise<void>[] = [];
          tasksSnapshot.forEach((docSnap) => {
            const taskId = docSnap.id;
            if (allRoutineTaskIds.has(taskId)) {
              const taskRef = doc(db, 'tasks', taskId);
              taskUpdatePromises.push(
                setDoc(taskRef, { completed: false }, { merge: true })
              );
            }
          });
          
          await Promise.all(taskUpdatePromises);
          totalTasksReset += taskUpdatePromises.length;
        }
      } catch (error) {
        console.error(`Error resetting tasks for user ${userId}:`, error);
      }
    }
    
    console.log(`✅ Manually reset ${deletePromises.length} routine completions and ${totalTasksReset} tasks`);
    return deletePromises.length;
  } catch (error) {
    console.error('❌ Error in manual reset:', error);
    throw error;
  }
}

/**
 * Get statistics about routine completions
 */
export async function getRoutineStats(): Promise<{
  totalCompletions: number;
  uniqueUsers: number;
  completionsToday: number;
}> {
  try {
    const completionsRef = collection(db, 'routine_completions');
    const allCompletions = await getDocs(completionsRef);
    
    const today = new Date().toISOString().split('T')[0];
    const todayQuery = query(
      completionsRef,
      where('completionDate', '==', today)
    );
    const todayCompletions = await getDocs(todayQuery);
    
    const uniqueUsers = new Set<string>();
    allCompletions.forEach((doc) => {
      const data = doc.data();
      uniqueUsers.add(data.userId);
    });
    
    return {
      totalCompletions: allCompletions.size,
      uniqueUsers: uniqueUsers.size,
      completionsToday: todayCompletions.size,
    };
  } catch (error) {
    console.error('Error getting routine stats:', error);
    throw error;
  }
}

