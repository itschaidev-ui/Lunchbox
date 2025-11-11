import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';

/**
 * Check if user owns a specific theme
 */
export async function checkThemeOwnership(
  userId: string,
  themeId: string
): Promise<boolean> {
  try {
    const redemptionsRef = collection(db, 'redemptions');
    const q = query(
      redemptionsRef,
      where('uid', '==', userId),
      where('rewardId', '==', themeId),
      where('status', '==', 'completed')
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking theme ownership:', error);
    return false;
  }
}

/**
 * Get all themes user owns
 */
export async function getUserOwnedThemes(userId: string): Promise<string[]> {
  try {
    const redemptionsRef = collection(db, 'redemptions');
    const q = query(
      redemptionsRef,
      where('uid', '==', userId),
      where('status', '==', 'completed'),
      where('rewardType', '==', 'theme')
    );

    const querySnapshot = await getDocs(q);
    const ownedThemes: string[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.rewardId) {
        ownedThemes.push(data.rewardId);
      }
    });

    return ownedThemes;
  } catch (error) {
    console.error('Error getting user owned themes:', error);
    return [];
  }
}

/**
 * Real-time listener for theme ownership changes (refunds, new redemptions)
 */
export function subscribeToThemeChanges(
  userId: string,
  callback: (themes: string[]) => void
): () => void {
  try {
    const redemptionsRef = collection(db, 'redemptions');
    const q = query(
      redemptionsRef,
      where('uid', '==', userId),
      where('rewardType', '==', 'theme')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const ownedThemes: string[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Only include completed redemptions (not refunded)
          if (data.status === 'completed' && data.rewardId) {
            ownedThemes.push(data.rewardId);
          }
        });

        callback(ownedThemes);
      },
      (error) => {
        console.error('Error in theme subscription:', error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up theme subscription:', error);
    return () => {}; // Return empty unsubscribe function
  }
}

/**
 * Get theme details for display
 */
export interface ThemeDetails {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export const PREMIUM_THEMES: Record<string, ThemeDetails> = {
  'dark-premium': {
    id: 'dark-premium',
    name: 'Better Dark',
    description: 'Premium dark theme with stunning blue and purple accents',
    cost: 1200,
  },
  'neon-theme': {
    id: 'neon-theme',
    name: 'Neon',
    description: 'Vibrant cyberpunk neon theme with electric colors',
    cost: 2500,
  },
  'ocean-theme': {
    id: 'ocean-theme',
    name: 'Ocean',
    description: 'Calming ocean theme with deep blues and teals',
    cost: 4000,
  },
};

