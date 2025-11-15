import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { markRoutineCompleted } from '@/lib/firebase-routine-completions';

export async function POST(request: NextRequest) {
  try {
    const { userId, routineId, creditsAwarded } = await request.json();

    if (!userId || !routineId || creditsAwarded === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, routineId, creditsAwarded' },
        { status: 400 }
      );
    }

    const adminDb = getDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    // Use server-side function to mark routine as completed
    // This uses Admin SDK which has proper permissions
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const completionId = `${userId}_${routineId}_${today}`;
    
    // Check if already completed (atomic check-and-set)
    const completionRef = adminDb.collection('routine_completions').doc(completionId);
    const existingCompletion = await completionRef.get();
    
    if (existingCompletion.exists) {
      // Already completed today - return success but indicate it was already done
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        message: `Routine ${routineId} was already marked as completed for ${today}`,
      });
    }
    
    // Atomically set the completion (prevents duplicate awards)
    await completionRef.set({
      routineId,
      userId,
      completedAt: now.toISOString(),
      creditsAwarded,
      completionDate: today,
    });

    return NextResponse.json({
      success: true,
      alreadyCompleted: false,
      message: `Routine ${routineId} marked as completed for ${today}`,
    });
  } catch (error: any) {
    console.error('Error marking routine completed:', error);
    return NextResponse.json(
      { error: `Failed to mark routine completed: ${error.message}` },
      { status: 500 }
    );
  }
}

