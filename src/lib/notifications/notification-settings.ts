/**
 * Notification settings utility
 * Check if user has notifications enabled
 */

/**
 * Check if notifications are enabled for the user
 * @param userId - User ID or email
 * @returns boolean - true if notifications are enabled
 */
export function isNotificationsEnabled(userId?: string): boolean {
  if (typeof window === 'undefined') {
    // Server-side: return true by default (respects user settings via API)
    return true;
  }
  
  // Client-side: check localStorage
  const notificationsEnabled = localStorage.getItem('lunchbox-notifications');
  
  // Default to true if not set
  if (notificationsEnabled === null) {
    return true;
  }
  
  return notificationsEnabled === 'true';
}

/**
 * Enable notifications for the user
 */
export function enableNotifications(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lunchbox-notifications', 'true');
}

/**
 * Disable notifications for the user
 */
export function disableNotifications(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lunchbox-notifications', 'false');
}

/**
 * Get notification preferences from server
 * This is used by API routes to check user preferences
 */
export async function getUserNotificationPreference(userId: string): Promise<boolean> {
  try {
    // Try to get from Firestore user settings
    const { db } = await import('@/lib/firebase');
    const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore');
    
    // First try to get from user document
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.notificationsEnabled !== false; // Default to true unless explicitly false
    }
    
    return true; // Default to enabled
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    return true; // Default to enabled on error
  }
}

