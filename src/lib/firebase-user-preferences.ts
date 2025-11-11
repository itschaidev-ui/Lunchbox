import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { KanbanColumn } from './types';

export interface UserPreferences {
  kanbanColumns?: KanbanColumn[];
  theme?: 'light' | 'dark' | 'system';
  userId: string;
  updatedAt: Date;
  unlockedAnimations?: string[]; // Array of unlocked animation IDs (e.g., 'bounce', 'pulse', 'rotate')
}

/**
 * Get user preferences from Firebase
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const docRef = doc(db, 'userPreferences', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const prefs = {
        ...data,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserPreferences;
      
      // Debug logging
      if (prefs.unlockedAnimations) {
        console.log(`[getUserPreferences] Found unlocked animations for ${userId}:`, prefs.unlockedAnimations);
      } else {
        console.log(`[getUserPreferences] No unlocked animations found for ${userId}`);
      }
      
      return prefs;
    }

    console.log(`[getUserPreferences] Document does not exist for ${userId}`);
    return null;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }
}

/**
 * Save Kanban columns to Firebase
 */
export async function saveKanbanColumns(userId: string, columns: KanbanColumn[]): Promise<void> {
  try {
    const docRef = doc(db, 'userPreferences', userId);
    const docSnap = await getDoc(docRef);

    const data = {
      kanbanColumns: columns,
      userId,
      updatedAt: new Date(),
    };

    if (docSnap.exists()) {
      await updateDoc(docRef, data);
    } else {
      await setDoc(docRef, data);
    }

    console.log('✅ Kanban columns saved to Firebase');
  } catch (error) {
    console.error('❌ Error saving Kanban columns:', error);
    throw error;
  }
}

/**
 * Save theme preference to Firebase
 */
export async function saveThemePreference(userId: string, theme: 'light' | 'dark' | 'system'): Promise<void> {
  try {
    const docRef = doc(db, 'userPreferences', userId);
    const docSnap = await getDoc(docRef);

    const data = {
      theme,
      userId,
      updatedAt: new Date(),
    };

    if (docSnap.exists()) {
      await updateDoc(docRef, data);
    } else {
      await setDoc(docRef, data);
    }

    console.log('✅ Theme preference saved to Firebase');
  } catch (error) {
    console.error('❌ Error saving theme preference:', error);
    throw error;
  }
}

/**
 * Save all user preferences to Firebase
 */
export async function saveUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
  try {
    const docRef = doc(db, 'userPreferences', userId);
    const docSnap = await getDoc(docRef);

    const data = {
      ...preferences,
      userId,
      updatedAt: new Date(),
    };

    if (docSnap.exists()) {
      await updateDoc(docRef, data);
    } else {
      await setDoc(docRef, data);
    }

    console.log('✅ User preferences saved to Firebase');
  } catch (error) {
    console.error('❌ Error saving user preferences:', error);
    throw error;
  }
}

