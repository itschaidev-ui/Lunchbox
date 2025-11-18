/**
 * Track last reset times to determine if a reset is needed
 */

import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface LastResetRecord {
  userId: string;
  lastResetAt: string; // ISO timestamp
  lastResetDate: string; // YYYY-MM-DD
}

/**
 * Get the last reset record for a user
 * Uses Admin SDK if provided, otherwise falls back to client SDK
 */
export async function getLastReset(userId: string, adminDb?: any): Promise<LastResetRecord | null> {
  try {
    if (adminDb) {
      // Use Admin SDK
      const resetRef = adminDb.collection('last_resets').doc(userId);
      const resetSnap = await resetRef.get();
      
      if (resetSnap.exists) {
        return resetSnap.data() as LastResetRecord;
      }
      return null;
    } else {
      // Use client SDK
      const resetRef = doc(db, 'last_resets', userId);
      const resetSnap = await getDoc(resetRef);

      if (resetSnap.exists()) {
        return resetSnap.data() as LastResetRecord;
      }

      return null;
    }
  } catch (error) {
    console.error('Error getting last reset:', error);
    return null;
  }
}

/**
 * Update the last reset record for a user
 * Uses Admin SDK if provided, otherwise falls back to client SDK
 */
export async function updateLastReset(userId: string, adminDb?: any): Promise<void> {
  try {
    const now = new Date();
    const record: LastResetRecord = {
      userId,
      lastResetAt: now.toISOString(),
      lastResetDate: now.toISOString().split('T')[0], // YYYY-MM-DD
    };

    if (adminDb) {
      // Use Admin SDK
      const resetRef = adminDb.collection('last_resets').doc(userId);
      await resetRef.set(record);
    } else {
      // Use client SDK
      const resetRef = doc(db, 'last_resets', userId);
      await setDoc(resetRef, record);
    }
    
    console.log(`✅ Updated last reset for user ${userId}`);
  } catch (error) {
    console.error('Error updating last reset:', error);
    throw error;
  }
}

/**
 * Check if user needs a reset based on their reset time and last reset
 */
export function needsReset(
  resetTime: string, // HH:MM format
  lastReset: LastResetRecord | null
): boolean {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const [resetHour, resetMinute] = resetTime.split(':').map(Number);

  // If never reset before, needs reset
  if (!lastReset) {
    return true;
  }

  // If last reset was on a different day
  if (lastReset.lastResetDate !== currentDate) {
    // Check if we've passed the reset time today
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const resetTimeInMinutes = resetHour * 60 + resetMinute;

    // If current time is past reset time, we need to reset
    if (currentTimeInMinutes >= resetTimeInMinutes) {
      return true;
    }
  }

  return false;
}

