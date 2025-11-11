/**
 * User Routine Settings
 * Allows users to customize routine reset time and notification preferences
 */

import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface RoutineSettings {
  userId: string;
  resetTime: string; // HH:MM format (e.g., "00:00" for midnight, "06:00" for 6 AM)
  notificationTime: string; // HH:MM format for daily reminder
  timezone: string; // User's timezone (e.g., "America/New_York")
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_RESET_TIME = '00:00'; // Midnight
const DEFAULT_NOTIFICATION_TIME = '07:00'; // 7 AM

/**
 * Get user's routine settings
 */
export async function getRoutineSettings(userId: string): Promise<RoutineSettings> {
  try {
    const settingsRef = doc(db, 'routine_settings', userId);
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      return settingsSnap.data() as RoutineSettings;
    }

    // Return default settings if none exist
    const defaultSettings: RoutineSettings = {
      userId,
      resetTime: DEFAULT_RESET_TIME,
      notificationTime: DEFAULT_NOTIFICATION_TIME,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notificationsEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return defaultSettings;
  } catch (error) {
    console.error('Error getting routine settings:', error);
    throw error;
  }
}

/**
 * Save user's routine settings
 */
export async function saveRoutineSettings(
  userId: string,
  settings: Partial<RoutineSettings>
): Promise<void> {
  try {
    const settingsRef = doc(db, 'routine_settings', userId);
    const existingSettings = await getRoutineSettings(userId);

    const updatedSettings: RoutineSettings = {
      ...existingSettings,
      ...settings,
      userId,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(settingsRef, updatedSettings);
    console.log(`✅ Saved routine settings for user ${userId}`);
  } catch (error) {
    console.error('Error saving routine settings:', error);
    throw error;
  }
}

/**
 * Update reset time
 */
export async function updateResetTime(userId: string, resetTime: string): Promise<void> {
  try {
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(resetTime)) {
      throw new Error('Invalid time format. Use HH:MM (e.g., "00:00", "18:30")');
    }

    await saveRoutineSettings(userId, { resetTime });
    console.log(`✅ Updated reset time to ${resetTime} for user ${userId}`);
  } catch (error) {
    console.error('Error updating reset time:', error);
    throw error;
  }
}

/**
 * Update notification time
 */
export async function updateNotificationTime(userId: string, notificationTime: string): Promise<void> {
  try {
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(notificationTime)) {
      throw new Error('Invalid time format. Use HH:MM (e.g., "07:00", "09:30")');
    }

    await saveRoutineSettings(userId, { notificationTime });
    console.log(`✅ Updated notification time to ${notificationTime} for user ${userId}`);
  } catch (error) {
    console.error('Error updating notification time:', error);
    throw error;
  }
}

/**
 * Update timezone
 */
export async function updateTimezone(userId: string, timezone: string): Promise<void> {
  try {
    await saveRoutineSettings(userId, { timezone });
    console.log(`✅ Updated timezone to ${timezone} for user ${userId}`);
  } catch (error) {
    console.error('Error updating timezone:', error);
    throw error;
  }
}

/**
 * Toggle notifications
 */
export async function toggleNotifications(userId: string, enabled: boolean): Promise<void> {
  try {
    await saveRoutineSettings(userId, { notificationsEnabled: enabled });
    console.log(`✅ ${enabled ? 'Enabled' : 'Disabled'} notifications for user ${userId}`);
  } catch (error) {
    console.error('Error toggling notifications:', error);
    throw error;
  }
}

