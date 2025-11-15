import { NextRequest, NextResponse } from 'next/server';
import {
  manualResetAllRoutines,
  resetUserRoutines,
  getRoutineStats,
} from '@/lib/routine-scheduler';
import { getDb } from '@/lib/firebase-admin';
import { getUserRoutines } from '@/lib/firebase-routines';
import admin from 'firebase-admin';

/**
 * Reset user routines using Admin SDK (bypasses security rules)
 */
async function resetUserRoutinesWithAdmin(adminDb: any, userId: string): Promise<number> {
  try {
    console.log(`🔄 Resetting routines for user: ${userId} (Admin SDK)`);
    
    // 1. Delete all routine completions
    const completionsSnapshot = await adminDb.collection('routine_completions')
      .where('userId', '==', userId)
      .get();
    
    const deletePromises: Promise<void>[] = [];
    completionsSnapshot.forEach((docSnap: any) => {
      deletePromises.push(docSnap.ref.delete());
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
    
    // 3. Uncheck ALL tasks that are part of routines (set completed = false and clear completedAt)
    const updatePromises: Promise<void>[] = [];
    
    if (allRoutineTaskIds.size > 0) {
      console.log(`📋 Found ${allRoutineTaskIds.size} unique task IDs across ${routines.length} routines`);
      
      // Get all tasks for this user
      const tasksSnapshot = await adminDb.collection('tasks')
        .where('userId', '==', userId)
        .get();
      
      let tasksFound = 0;
      let tasksUpdated = 0;
      
      tasksSnapshot.forEach((docSnap: any) => {
        const taskId = docSnap.id;
        const taskData = docSnap.data();
        tasksFound++;
        
        // If this task is part of any routine, mark it as incomplete (pending)
        if (allRoutineTaskIds.has(taskId)) {
          // Update task to set completed = false and clear completedAt
          const updateData: any = {
            completed: false,
          };
          
          // Clear completedAt if it exists
          if (taskData.completedAt) {
            updateData.completedAt = admin.firestore.FieldValue.delete();
          }
          
          updatePromises.push(
            docSnap.ref.update(updateData)
          );
          tasksUpdated++;
          console.log(`  ✓ Marking task ${taskId} as pending (was ${taskData.completed ? 'completed' : 'pending'})`);
        }
      });
      
      console.log(`📊 Tasks found: ${tasksFound}, Tasks in routines: ${tasksUpdated}`);
    } else {
      console.log(`⚠️ No routine tasks found to reset`);
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
 * API endpoint for manual routine resets
 * 
 * Usage:
 * - GET /api/reset-routines?stats=true - Get routine statistics
 * - POST /api/reset-routines - Reset all routines (admin only)
 * - POST /api/reset-routines?userId=xxx - Reset specific user's routines
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showStats = searchParams.get('stats') === 'true';

    if (showStats) {
      const stats = await getRoutineStats();
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Use POST to reset routines, or add ?stats=true to see statistics',
    });
  } catch (error) {
    console.error('Error in routine reset GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get routine stats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const clearTimer = searchParams.get('clearTimer') === 'true';

    // Clear reset timer (for testing)
    if (clearTimer && userId) {
      console.log(`🧪 Clearing reset timer for user: ${userId}`);
      const { deleteDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const resetRef = doc(db, 'last_resets', userId);
      await deleteDoc(resetRef);
      
      return NextResponse.json({
        success: true,
        message: `Cleared reset timer for user ${userId}`,
        userId,
      });
    }

    let resetCount: number;

    if (userId) {
      // Reset specific user's routines using Admin SDK
      console.log(`🔄 Resetting routines for user: ${userId}`);
      
      const adminDb = getDb();
      if (!adminDb) {
        return NextResponse.json(
          { success: false, error: 'Firebase Admin not initialized' },
          { status: 500 }
        );
      }

      // Use Admin SDK to reset routines (bypasses security rules)
      resetCount = await resetUserRoutinesWithAdmin(adminDb, userId);
      
      return NextResponse.json({
        success: true,
        message: `Reset ${resetCount} routine completions for user ${userId}`,
        resetCount,
        userId,
      });
    } else {
      // Reset all routines (admin function)
      console.log('🔄 Resetting all routines...');
      resetCount = await manualResetAllRoutines();
      
      return NextResponse.json({
        success: true,
        message: `Reset ${resetCount} routine completions for all users`,
        resetCount,
      });
    }
  } catch (error) {
    console.error('Error in routine reset POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset routines' },
      { status: 500 }
    );
  }
}

