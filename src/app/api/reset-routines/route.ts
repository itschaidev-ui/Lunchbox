import { NextRequest, NextResponse } from 'next/server';
import {
  manualResetAllRoutines,
  resetUserRoutines,
  getRoutineStats,
} from '@/lib/routine-scheduler';

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
      // Reset specific user's routines
      console.log(`🔄 Resetting routines for user: ${userId}`);
      resetCount = await resetUserRoutines(userId);
      
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

