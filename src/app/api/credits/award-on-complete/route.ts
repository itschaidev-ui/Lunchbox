import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/credits/award-on-complete
 * body: { taskId: string, userId: string }
 * Awards 10-20 randomized credits the first time a task is completed.
 * Will not re-award if the task was already awarded before.
 */
export async function POST(request: NextRequest) {
  try {
    const { taskId, userId } = await request.json();
    if (!taskId || !userId) {
      return NextResponse.json({ success: false, error: 'Missing taskId or userId' }, { status: 400 });
    }

    const adminDb = getDb();
    if (!adminDb) {
      console.warn('⚠️ Credit award skipped: Firebase Admin SDK not initialized. Set FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL environment variables.');
      // Return success but indicate it was skipped (non-critical feature)
      return NextResponse.json({ 
        success: false, 
        skipped: true,
        error: 'Admin not initialized - credits will be awarded when Admin SDK is configured' 
      }, { status: 200 }); // Return 200 instead of 503 so it doesn't show as error
    }

    // Load task
    const taskRef = adminDb.collection('tasks').doc(taskId);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }
    const task = taskSnap.data() || {};

    // Only award if task is currently completed and not yet awarded
    if (!task.completed) {
      return NextResponse.json({ success: false, error: 'Task is not completed' }, { status: 400 });
    }
    if (task.completionCreditAwarded) {
      return NextResponse.json({
        success: true,
        alreadyAwarded: true,
        amount: task.completionCreditAmount || 0,
      });
    }

    // Random credits between 10 and 20 inclusive
    const amount = Math.floor(Math.random() * 11) + 10;

    // Update user credits and log transaction
    const userCreditsRef = adminDb.collection('user_credits').doc(userId);
    const creditsSnap = await userCreditsRef.get();
    const now = new Date().toISOString();

    let newTotal = amount;
    if (creditsSnap.exists) {
      const existing = creditsSnap.data() || {};
      newTotal = (existing.totalCredits || 0) + amount;
      await userCreditsRef.update({
        totalCredits: newTotal,
        updatedAt: now,
        lastEarnedAt: now,
      });
    } else {
      await userCreditsRef.set({
        userId,
        totalCredits: amount,
        dailyStreak: 0,
        bonusMultiplier: 1,
        createdAt: now,
        updatedAt: now,
        lastEarnedAt: now,
      });
    }

    // Log transaction
    await adminDb.collection('credit_transactions').add({
      userId,
      amount,
      type: 'earn',
      reason: 'task_completion',
      taskId,
      timestamp: now,
    });

    // Mark task as awarded
    await taskRef.update({
      completionCreditAwarded: true,
      completionCreditAmount: amount,
      completionCreditAwardedAt: now,
    });

    return NextResponse.json({
      success: true,
      amount,
      totalCredits: newTotal,
    });
  } catch (error: any) {
    console.error('award-on-complete error', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}


