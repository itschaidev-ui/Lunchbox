'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import {
  getUserCredits,
  updateCredits,
  logCreditTransaction,
  initializeUserCredits,
} from '@/lib/firebase-credits';
import type { UserCredits, CreditTransaction } from '@/lib/types';

interface CreditsContextType {
  credits: UserCredits | null;
  loading: boolean;
  earnCredits: (amount: number, reason: string, type?: 'earn' | 'bonus' | 'streak', taskId?: string, routineId?: string) => Promise<void>;
  spendCredits: (amount: number, reason: string) => Promise<void>;
  refreshCredits: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user credits on mount
  useEffect(() => {
    if (user?.uid) {
      loadCredits();
    } else {
      setCredits(null);
      setLoading(false);
    }
  }, [user?.uid]);

  // Listen for credits update events
  useEffect(() => {
    const handleCreditsUpdate = () => {
      if (user?.uid) {
        loadCredits();
      }
    };

    window.addEventListener('credits-updated', handleCreditsUpdate);
    return () => {
      window.removeEventListener('credits-updated', handleCreditsUpdate);
    };
  }, [user?.uid]);

  const loadCredits = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      let userCredits = await getUserCredits(user.uid);
      
      // Initialize if doesn't exist
      if (!userCredits) {
        userCredits = await initializeUserCredits(user.uid);
      }
      
      setCredits(userCredits);
    } catch (error) {
      console.error('Error loading credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const earnCredits = async (
    amount: number,
    reason: string,
    type: 'earn' | 'bonus' | 'streak' = 'earn',
    taskId?: string,
    routineId?: string
  ) => {
    if (!user?.uid || !credits) return;

    try {
      // Update credits in Firebase
      const newTotal = credits.totalCredits + amount;
      await updateCredits(user.uid, newTotal, credits.dailyStreak, credits.bonusMultiplier);

      // Log transaction
      await logCreditTransaction(user.uid, amount, type, reason, taskId, routineId);

      // Update local state
      setCredits({
        ...credits,
        totalCredits: newTotal,
        lastEarnedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(`✨ Earned ${amount} credits: ${reason}`);
    } catch (error) {
      console.error('Error earning credits:', error);
    }
  };

  const spendCredits = async (amount: number, reason: string) => {
    if (!user?.uid || !credits) return;

    if (credits.totalCredits < amount) {
      throw new Error('Insufficient credits');
    }

    try {
      // Update credits in Firebase
      const newTotal = credits.totalCredits - amount;
      await updateCredits(user.uid, newTotal, credits.dailyStreak, credits.bonusMultiplier);

      // Log transaction
      await logCreditTransaction(user.uid, -amount, 'spend', reason);

      // Update local state
      setCredits({
        ...credits,
        totalCredits: newTotal,
        updatedAt: new Date().toISOString(),
      });

      console.log(`💸 Spent ${amount} credits: ${reason}`);
    } catch (error) {
      console.error('Error spending credits:', error);
      throw error;
    }
  };

  const refreshCredits = async () => {
    await loadCredits();
  };

  return (
    <CreditsContext.Provider
      value={{
        credits,
        loading,
        earnCredits,
        spendCredits,
        refreshCredits,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    // Return a safe default instead of throwing - prevents runtime errors during SSR or before provider mounts
    console.warn('useCredits called outside CreditsProvider - returning default values');
    return {
      credits: null,
      loading: true,
      earnCredits: async () => {},
      spendCredits: async () => {},
      refreshCredits: async () => {},
    };
  }
  return context;
}

