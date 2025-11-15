import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { Achievement, UserAchievements } from './types';
import { getUserCredits, updateCredits, logCreditTransaction } from './firebase-credits';
import { getUserTasks } from './firebase-tasks';
import { getUserRoutines } from './firebase-routines';

// Define all achievements
export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_task',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: '🎯',
    requirement: 1,
    category: 'tasks',
  },
  {
    id: 'task_master_10',
    name: 'Task Master',
    description: 'Complete 10 tasks',
    icon: '⭐',
    requirement: 10,
    category: 'tasks',
  },
  {
    id: 'task_master_50',
    name: 'Task Expert',
    description: 'Complete 50 tasks',
    icon: '🏆',
    requirement: 50,
    category: 'tasks',
  },
  {
    id: 'task_master_100',
    name: 'Task Legend',
    description: 'Complete 100 tasks',
    icon: '👑',
    requirement: 100,
    category: 'tasks',
  },
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Complete all tasks in a week',
    icon: '📅',
    requirement: 1,
    category: 'special',
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 10 tasks before noon',
    icon: '🌅',
    requirement: 10,
    category: 'special',
  },
  {
    id: 'routine_master',
    name: 'Routine Master',
    description: 'Complete 10 routines',
    icon: '🔄',
    requirement: 10,
    category: 'routines',
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    requirement: 7,
    category: 'streak',
  },
  {
    id: 'streak_30',
    name: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: '💪',
    requirement: 30,
    category: 'streak',
  },
];

/**
 * Get user achievements
 */
export async function getUserAchievements(userId: string): Promise<UserAchievements | null> {
  try {
    const achievementsRef = doc(db, 'user_achievements', userId);
    const achievementsSnap = await getDoc(achievementsRef);

    if (achievementsSnap.exists()) {
      return {
        ...achievementsSnap.data(),
        userId,
      } as UserAchievements;
    }

    return null;
  } catch (error) {
    console.error('Error getting user achievements:', error);
    throw error;
  }
}

/**
 * Initialize user achievements
 */
export async function initializeUserAchievements(userId: string): Promise<UserAchievements> {
  try {
    const now = new Date().toISOString();
    const initialAchievements: UserAchievements = {
      userId,
      unlockedAchievements: [],
      allAchievementsCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const achievementsRef = doc(db, 'user_achievements', userId);
    await setDoc(achievementsRef, initialAchievements);

    console.log(`✅ Initialized achievements for user ${userId}`);
    return initialAchievements;
  } catch (error) {
    console.error('Error initializing user achievements:', error);
    throw error;
  }
}

/**
 * Check and unlock achievements based on user progress
 */
export async function checkAndUnlockAchievements(userId: string): Promise<{
  newlyUnlocked: string[];
  allCompleted: boolean;
}> {
  try {
    // Get or initialize user achievements
    let userAchievements = await getUserAchievements(userId);
    if (!userAchievements) {
      userAchievements = await initializeUserAchievements(userId);
    }

    // Get user data for checking achievements
    let tasks: any[] = [];
    let routines: any[] = [];
    let credits = null;
    
    try {
      tasks = await getUserTasks(userId);
    } catch (error: any) {
      console.error('Error fetching tasks for achievements:', error);
      // If it's an index error, try a simpler query
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        try {
          // Fallback: query without orderBy
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const { db } = await import('./firebase');
          const tasksQuery = query(
            collection(db, 'tasks'),
            where('userId', '==', userId)
          );
          const snapshot = await getDocs(tasksQuery);
          tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          tasks = [];
        }
      } else {
        tasks = [];
      }
    }
    
    try {
      routines = await getUserRoutines(userId);
    } catch (error: any) {
      console.error('Error fetching routines for achievements:', error);
      // If it's an index error, try a simpler query
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        try {
          // Fallback: query without orderBy
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const { db } = await import('./firebase');
          const routinesQuery = query(
            collection(db, 'routines'),
            where('userId', '==', userId)
          );
          const snapshot = await getDocs(routinesQuery);
          routines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          routines = [];
        }
      } else {
        routines = [];
      }
    }
    
    try {
      credits = await getUserCredits(userId);
    } catch (error) {
      console.error('Error fetching credits for achievements:', error);
      // Continue with null credits
    }

    const completedTasks = tasks.filter(t => t.completed);
    const completedTasksCount = completedTasks.length;

    // Check for early bird (tasks completed before noon)
    const earlyBirdCount = completedTasks.filter(task => {
      const taskAny = task as any;
      if (!taskAny.updatedAt) return false;
      const completedAt = taskAny.updatedAt?.toDate ? taskAny.updatedAt.toDate() : new Date(taskAny.updatedAt);
      return completedAt.getHours() < 12;
    }).length;

    // Check for perfect week (all tasks completed in a week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const tasksThisWeek = completedTasks.filter(task => {
      const taskAny = task as any;
      if (!taskAny.updatedAt) return false;
      const completedAt = taskAny.updatedAt?.toDate ? taskAny.updatedAt.toDate() : new Date(taskAny.updatedAt);
      return completedAt >= oneWeekAgo;
    });
    const allTasksThisWeek = tasks.filter(task => {
      const taskAny = task as any;
      const createdOrUpdated = taskAny.updatedAt || taskAny.createdAt;
      if (!createdOrUpdated) return false;
      const date = createdOrUpdated?.toDate ? createdOrUpdated.toDate() : new Date(createdOrUpdated);
      return date >= oneWeekAgo;
    });
    const perfectWeek = allTasksThisWeek.length > 0 && allTasksThisWeek.every(t => t.completed);

    // Get routine completions (simplified - would need proper tracking)
    const completedRoutinesCount = routines.filter(r => r.isActive).length;

    // Get streak from credits
    const streak = credits?.dailyStreak || 0;

    // Check each achievement
    const newlyUnlocked: string[] = [];
    const currentUnlocked = new Set(userAchievements.unlockedAchievements);

    for (const achievement of ALL_ACHIEVEMENTS) {
      // Skip if already unlocked
      if (currentUnlocked.has(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.id) {
        case 'first_task':
          shouldUnlock = completedTasksCount >= 1;
          break;
        case 'task_master_10':
          shouldUnlock = completedTasksCount >= 10;
          break;
        case 'task_master_50':
          shouldUnlock = completedTasksCount >= 50;
          break;
        case 'task_master_100':
          shouldUnlock = completedTasksCount >= 100;
          break;
        case 'perfect_week':
          shouldUnlock = perfectWeek;
          break;
        case 'early_bird':
          shouldUnlock = earlyBirdCount >= 10;
          break;
        case 'routine_master':
          shouldUnlock = completedRoutinesCount >= 10;
          break;
        case 'streak_7':
          shouldUnlock = streak >= 7;
          break;
        case 'streak_30':
          shouldUnlock = streak >= 30;
          break;
      }

      if (shouldUnlock) {
        newlyUnlocked.push(achievement.id);
        currentUnlocked.add(achievement.id);
      }
    }

    // Check if all achievements are completed
    const allCompleted = currentUnlocked.size === ALL_ACHIEVEMENTS.length;
    const wasAllCompleted = userAchievements.allAchievementsCompleted;

    // Update user achievements
    const updatedAchievements: Partial<UserAchievements> = {
      unlockedAchievements: Array.from(currentUnlocked),
      allAchievementsCompleted: allCompleted,
      lastCheckedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If all achievements just completed, mark the timestamp
    if (allCompleted && !wasAllCompleted) {
      updatedAchievements.allAchievementsCompletedAt = new Date().toISOString();
    }

    const achievementsRef = doc(db, 'user_achievements', userId);
    
    // Use a transaction to atomically check and update achievements
    // This prevents duplicate credit awards if checkAndUnlockAchievements is called multiple times
    const { runTransaction } = await import('firebase/firestore');
    
    try {
      await runTransaction(db, async (transaction) => {
        // Re-read the document in the transaction to get the latest state
        const currentSnap = await transaction.get(achievementsRef);
        const currentData = currentSnap.exists() ? currentSnap.data() : null;
        
        // Check if all achievements were already completed (atomic check)
        const alreadyCompleted = currentData?.allAchievementsCompleted === true;
        
        // Only award credits if this is the first time completing all achievements
        if (allCompleted && !wasAllCompleted && !alreadyCompleted) {
          // Mark as completed in the transaction
          const transactionData = {
            ...updatedAchievements,
            allAchievementsCompletedAt: new Date().toISOString(),
          };
          
          if (currentSnap.exists()) {
            transaction.update(achievementsRef, transactionData);
          } else {
            transaction.set(achievementsRef, transactionData);
          }
        } else {
          // Just update achievements without awarding credits
          if (currentSnap.exists()) {
            transaction.update(achievementsRef, updatedAchievements);
          } else {
            transaction.set(achievementsRef, updatedAchievements);
          }
        }
      });
      
      // Award credits OUTSIDE the transaction (after atomic check)
      // This ensures we only award once even if called multiple times
      if (allCompleted && !wasAllCompleted) {
        // Double-check one more time before awarding (extra safety)
        const finalCheck = await getUserAchievements(userId);
        const alreadyAwarded = finalCheck?.allAchievementsCompletedAt !== undefined;
        
        if (!alreadyAwarded) {
          try {
            const currentCredits = credits?.totalCredits || 0;
            const newTotal = currentCredits + 500;
            
            await updateCredits(
              userId,
              newTotal,
              credits?.dailyStreak || 0,
              credits?.bonusMultiplier || 1.0
            );

            await logCreditTransaction(
              userId,
              500,
              'bonus',
              'Completed all achievements!',
              undefined,
              undefined
            );

            console.log(`🎉 User ${userId} completed all achievements and earned 500 credits!`);
          } catch (error) {
            console.error('Error awarding credits for all achievements:', error);
          }
        } else {
          console.log(`⚠️ All achievements already completed for user ${userId}, skipping credit award`);
        }
      }
    } catch (transactionError) {
      // Fallback to non-transactional update if transaction fails
      console.warn('Transaction failed, using fallback update:', transactionError);
      await setDoc(achievementsRef, updatedAchievements, { merge: true });
    }

    return {
      newlyUnlocked,
      allCompleted,
    };
  } catch (error) {
    console.error('Error checking achievements:', error);
    throw error;
  }
}

/**
 * Get achievement progress for a user
 */
export async function getAchievementProgress(userId: string): Promise<{
  achievements: (Achievement & { unlocked: boolean; progress: number; maxProgress: number })[];
  totalUnlocked: number;
  totalAchievements: number;
  allCompleted: boolean;
}> {
  try {
    const userAchievements = await getUserAchievements(userId) || await initializeUserAchievements(userId);
    const unlockedSet = new Set(userAchievements.unlockedAchievements);

    // Get user data for progress calculation
    let tasks: any[] = [];
    let routines: any[] = [];
    let credits = null;
    
    try {
      tasks = await getUserTasks(userId);
    } catch (error: any) {
      console.error('Error fetching tasks for achievement progress:', error);
      // If it's an index error, try a simpler query
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        try {
          // Fallback: query without orderBy
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const { db } = await import('./firebase');
          const tasksQuery = query(
            collection(db, 'tasks'),
            where('userId', '==', userId)
          );
          const snapshot = await getDocs(tasksQuery);
          tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          tasks = [];
        }
      } else {
        tasks = [];
      }
    }
    
    try {
      routines = await getUserRoutines(userId);
    } catch (error: any) {
      console.error('Error fetching routines for achievement progress:', error);
      // If it's an index error, try a simpler query
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        try {
          // Fallback: query without orderBy
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const { db } = await import('./firebase');
          const routinesQuery = query(
            collection(db, 'routines'),
            where('userId', '==', userId)
          );
          const snapshot = await getDocs(routinesQuery);
          routines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          routines = [];
        }
      } else {
        routines = [];
      }
    }
    
    try {
      credits = await getUserCredits(userId);
    } catch (error) {
      console.error('Error fetching credits for achievement progress:', error);
      // Continue with null credits
    }

    const completedTasks = tasks.filter(t => t.completed);
    const completedTasksCount = completedTasks.length;
    const earlyBirdCount = completedTasks.filter(task => {
      const taskAny = task as any;
      if (!taskAny.updatedAt) return false;
      const completedAt = taskAny.updatedAt?.toDate ? taskAny.updatedAt.toDate() : new Date(taskAny.updatedAt);
      return completedAt.getHours() < 12;
    }).length;
    const completedRoutinesCount = routines.filter(r => r.isActive).length;
    const streak = credits?.dailyStreak || 0;

    const achievementsWithProgress = ALL_ACHIEVEMENTS.map(achievement => {
      const unlocked = unlockedSet.has(achievement.id);
      let progress = 0;
      let maxProgress = achievement.requirement;

      if (!unlocked) {
        switch (achievement.id) {
          case 'first_task':
          case 'task_master_10':
          case 'task_master_50':
          case 'task_master_100':
            progress = Math.min(completedTasksCount, maxProgress);
            break;
          case 'perfect_week':
            // This is binary - either achieved or not
            progress = 0;
            break;
          case 'early_bird':
            progress = Math.min(earlyBirdCount, maxProgress);
            break;
          case 'routine_master':
            progress = Math.min(completedRoutinesCount, maxProgress);
            break;
          case 'streak_7':
          case 'streak_30':
            progress = Math.min(streak, maxProgress);
            break;
        }
      } else {
        progress = maxProgress;
      }

      return {
        ...achievement,
        unlocked,
        progress,
        maxProgress,
      };
    });

    return {
      achievements: achievementsWithProgress,
      totalUnlocked: unlockedSet.size,
      totalAchievements: ALL_ACHIEVEMENTS.length,
      allCompleted: userAchievements.allAchievementsCompleted,
    };
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    throw error;
  }
}

