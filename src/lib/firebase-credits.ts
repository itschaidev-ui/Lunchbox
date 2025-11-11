import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import type { UserCredits, CreditTransaction } from './types';

/**
 * Get user credits
 */
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  try {
    const creditsRef = doc(db, 'user_credits', userId);
    const creditsSnap = await getDoc(creditsRef);

    if (creditsSnap.exists()) {
      return {
        ...creditsSnap.data(),
        userId,
      } as UserCredits;
    }

    return null;
  } catch (error) {
    console.error('Error getting user credits:', error);
    throw error;
  }
}

/**
 * Initialize user credits for new users
 */
export async function initializeUserCredits(userId: string): Promise<UserCredits> {
  try {
    const now = new Date().toISOString();
    const initialCredits: UserCredits = {
      userId,
      totalCredits: 0,
      dailyStreak: 0,
      bonusMultiplier: 1.0,
      createdAt: now,
      updatedAt: now,
    };

    const creditsRef = doc(db, 'user_credits', userId);
    await setDoc(creditsRef, initialCredits);

    console.log(`✅ Initialized credits for user ${userId}`);
    return initialCredits;
  } catch (error) {
    console.error('Error initializing user credits:', error);
    throw error;
  }
}

/**
 * Update user credits
 */
export async function updateCredits(
  userId: string,
  totalCredits: number,
  dailyStreak: number,
  bonusMultiplier: number
): Promise<void> {
  try {
    const creditsRef = doc(db, 'user_credits', userId);
    await updateDoc(creditsRef, {
      totalCredits,
      dailyStreak,
      bonusMultiplier,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating credits:', error);
    throw error;
  }
}

/**
 * Update daily streak
 */
export async function updateDailyStreak(userId: string, newStreak: number): Promise<void> {
  try {
    const creditsRef = doc(db, 'user_credits', userId);
    
    // Calculate bonus multiplier based on streak
    // Every 7 days adds 0.1x multiplier (max 2.0x at 70 days)
    const bonusMultiplier = Math.min(1.0 + Math.floor(newStreak / 7) * 0.1, 2.0);
    
    await updateDoc(creditsRef, {
      dailyStreak: newStreak,
      bonusMultiplier,
      updatedAt: new Date().toISOString(),
    });

    console.log(`🔥 Updated streak to ${newStreak} days (${bonusMultiplier}x multiplier)`);
  } catch (error) {
    console.error('Error updating daily streak:', error);
    throw error;
  }
}

/**
 * Log a credit transaction
 */
export async function logCreditTransaction(
  userId: string,
  amount: number,
  type: 'earn' | 'spend' | 'bonus' | 'streak',
  reason: string,
  taskId?: string,
  routineId?: string
): Promise<string> {
  try {
    const transaction: Omit<CreditTransaction, 'id'> = {
      userId,
      amount,
      type,
      reason,
      taskId,
      routineId,
      timestamp: new Date().toISOString(),
    };

    const transactionsRef = collection(db, 'credit_transactions');
    const docRef = await addDoc(transactionsRef, transaction);

    return docRef.id;
  } catch (error) {
    console.error('Error logging credit transaction:', error);
    throw error;
  }
}

/**
 * Get credit transaction history
 */
export async function getCreditTransactions(
  userId: string,
  limitCount: number = 50
): Promise<CreditTransaction[]> {
  try {
    const transactionsRef = collection(db, 'credit_transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const transactions: CreditTransaction[] = [];

    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
      } as CreditTransaction);
    });

    return transactions;
  } catch (error) {
    console.error('Error getting credit transactions:', error);
    throw error;
  }
}

/**
 * Calculate credits for routine task completion
 */
export function calculateRoutineTaskCredits(
  completedBeforeBonus: boolean,
  streakDays: number
): { baseCredits: number; bonusCredits: number; streakBonus: number; total: number } {
  const baseCredits = 10; // Base reward for completing a routine task
  const bonusCredits = completedBeforeBonus ? 5 : 0; // Bonus for completing before 7 AM
  const streakBonus = Math.min(streakDays * 2, 20); // +2 per day, max 20

  return {
    baseCredits,
    bonusCredits,
    streakBonus,
    total: baseCredits + bonusCredits + streakBonus,
  };
}

/**
 * Calculate credits for full routine completion
 */
export function calculateFullRoutineBonus(taskCount: number): number {
  return 20 + (taskCount * 2); // Base 20 + 2 per task
}

/**
 * Award credits for task completion (client-side version)
 * Awards 10-20 randomized credits the first time a task is completed.
 * Uses Firestore transactions to ensure atomicity.
 */
export async function awardTaskCompletionCredits(
  userId: string,
  taskId: string
): Promise<{ success: boolean; amount?: number; alreadyAwarded?: boolean; error?: string }> {
  try {
    const { runTransaction } = await import('firebase/firestore');
    const { doc } = await import('firebase/firestore');
    
    // Random credits between 10 and 20 inclusive
    const amount = Math.floor(Math.random() * 11) + 10;
    
    const result = await runTransaction(db, async (transaction) => {
      // Get task to check if already awarded
      const taskRef = doc(db, 'tasks', taskId);
      const taskSnap = await transaction.get(taskRef);
      
      if (!taskSnap.exists()) {
        throw new Error('Task not found');
      }
      
      const task = taskSnap.data();
      
      // Check if task is completed
      if (!task.completed) {
        throw new Error('Task is not completed');
      }
      
      // Check if already awarded
      if (task.completionCreditAwarded) {
        return { success: true, alreadyAwarded: true, amount: task.completionCreditAmount || 0 };
      }
      
      // Get user credits
      const creditsRef = doc(db, 'user_credits', userId);
      const creditsSnap = await transaction.get(creditsRef);
      
      const now = new Date().toISOString();
      let newTotal = amount;
      
      if (creditsSnap.exists()) {
        const existing = creditsSnap.data() || {};
        newTotal = (existing.totalCredits || 0) + amount;
        transaction.update(creditsRef, {
          totalCredits: newTotal,
          updatedAt: now,
          lastEarnedAt: now,
        });
      } else {
        transaction.set(creditsRef, {
          userId,
          totalCredits: amount,
          dailyStreak: 0,
          bonusMultiplier: 1,
          createdAt: now,
          updatedAt: now,
          lastEarnedAt: now,
        });
      }
      
      // Mark task as awarded
      transaction.update(taskRef, {
        completionCreditAwarded: true,
        completionCreditAmount: amount,
        completionCreditAwardedAt: now,
      });
      
      return { success: true, amount, totalCredits: newTotal };
    });
    
    // Log transaction outside of the main transaction (non-blocking)
    if (result.success && result.amount) {
      try {
        await logCreditTransaction(userId, result.amount, 'earn', 'task_completion', taskId);
      } catch (logError) {
        console.warn('Failed to log credit transaction (non-critical):', logError);
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('Error awarding task completion credits:', error);
    return { 
      success: false, 
      error: error?.message || 'Failed to award credits' 
    };
  }
}

