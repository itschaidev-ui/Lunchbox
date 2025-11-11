/**
 * Daily Claim System
 * Allows users to claim credits once per day
 */

import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface DailyClaimRecord {
  userId: string;
  lastClaimAt: string; // ISO timestamp
  lastClaimDate: string; // YYYY-MM-DD
  totalClaims: number;
  currentStreak: number;
}

const DAILY_CLAIM_AMOUNT = 10; // Base daily claim
const STREAK_BONUS_AMOUNT = 5; // Bonus per streak day
const SEVENTH_DAY_BONUS = 100; // Special 7th day reward
const MAX_STREAK_BONUS_DAYS = 7; // Max days for streak bonus calculation

/**
 * Get user's daily claim record
 */
export async function getDailyClaimRecord(userId: string): Promise<DailyClaimRecord | null> {
  try {
    const claimRef = doc(db, 'daily_claims', userId);
    const claimSnap = await getDoc(claimRef);

    if (claimSnap.exists()) {
      return claimSnap.data() as DailyClaimRecord;
    }

    return null;
  } catch (error) {
    console.error('Error getting daily claim record:', error);
    return null;
  }
}

/**
 * Check if user can claim today
 */
export async function canClaimToday(userId: string): Promise<boolean> {
  try {
    const record = await getDailyClaimRecord(userId);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // If no record, can claim
    if (!record) {
      return true;
    }

    // If last claim was not today, can claim
    return record.lastClaimDate !== today;
  } catch (error) {
    console.error('Error checking claim eligibility:', error);
    return false;
  }
}

/**
 * Calculate streak bonus
 */
function calculateStreak(lastClaimDate: string | null): number {
  if (!lastClaimDate) return 1; // First claim

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastClaim = new Date(lastClaimDate);
  lastClaim.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - lastClaim.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // If claimed yesterday, increment streak
  if (diffDays === 1) {
    return 1; // Will be added to current streak
  }
  
  // If more than 1 day, streak is broken
  if (diffDays > 1) {
    return 0; // Reset streak
  }

  // Same day (shouldn't happen if checks work)
  return 0;
}

/**
 * Claim daily credits
 */
export async function claimDailyCredits(userId: string): Promise<{
  success: boolean;
  credits: number;
  streak: number;
  message: string;
}> {
  try {
    const canClaim = await canClaimToday(userId);
    
    if (!canClaim) {
      return {
        success: false,
        credits: 0,
        streak: 0,
        message: 'Already claimed today! Come back tomorrow.',
      };
    }

    const record = await getDailyClaimRecord(userId);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Calculate new streak
    const streakIncrement = calculateStreak(record?.lastClaimDate || null);
    const newStreak = record ? (streakIncrement > 0 ? record.currentStreak + 1 : 1) : 1;
    
    // Check if this is the 7th day (or multiple of 7)
    const isSeventhDay = newStreak % 7 === 0 && newStreak > 0;
    
    // Calculate credits
    const baseCredits = DAILY_CLAIM_AMOUNT;
    const streakBonus = Math.min(newStreak - 1, MAX_STREAK_BONUS_DAYS) * STREAK_BONUS_AMOUNT;
    const seventhDayBonus = isSeventhDay ? SEVENTH_DAY_BONUS : 0;
    const totalCredits = baseCredits + streakBonus + seventhDayBonus;

    // Update record
    const newRecord: DailyClaimRecord = {
      userId,
      lastClaimAt: now,
      lastClaimDate: today,
      totalClaims: record ? record.totalClaims + 1 : 1,
      currentStreak: newStreak,
    };

    const claimRef = doc(db, 'daily_claims', userId);
    await setDoc(claimRef, newRecord);

    console.log(`✅ User ${userId} claimed ${totalCredits} credits (streak: ${newStreak})`);

    // Create custom message based on streak
    let message = '';
    if (isSeventhDay) {
      message = `🎉 7 DAY STREAK! Claimed ${totalCredits} credits! (+${SEVENTH_DAY_BONUS} MEGA BONUS!) 🎁`;
    } else if (streakBonus > 0) {
      message = `Claimed ${totalCredits} credits! 🔥 ${newStreak} day streak (+${streakBonus} bonus)!`;
    } else {
      message = `Claimed ${totalCredits} credits! Come back tomorrow to start a streak!`;
    }

    return {
      success: true,
      credits: totalCredits,
      streak: newStreak,
      message,
    };
  } catch (error) {
    console.error('Error claiming daily credits:', error);
    return {
      success: false,
      credits: 0,
      streak: 0,
      message: 'Failed to claim credits. Please try again.',
    };
  }
}

/**
 * Get time until next claim
 */
export function getTimeUntilNextClaim(lastClaimDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastClaim = new Date(lastClaimDate);
  lastClaim.setHours(0, 0, 0, 0);
  
  const nextClaim = new Date(lastClaim);
  nextClaim.setDate(nextClaim.getDate() + 1);
  
  const diffTime = nextClaim.getTime() - today.getTime();
  const hours = Math.floor(diffTime / (1000 * 60 * 60));
  const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours <= 0 && minutes <= 0) {
    return 'Available now!';
  }
  
  return `${hours}h ${minutes}m`;
}

