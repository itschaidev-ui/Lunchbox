'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  Coins,
  TrendingUp,
  Flame,
  Award,
  ArrowUp,
  ArrowDown,
  X,
  Gift,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useCredits } from '@/context/credits-context';
import { getCreditTransactions } from '@/lib/firebase-credits';
import { useAuth } from '@/context/auth-context';
import type { CreditTransaction } from '@/lib/types';
import {
  canClaimToday,
  claimDailyCredits,
  getDailyClaimRecord,
  getTimeUntilNextClaim,
} from '@/lib/firebase-daily-claim';

interface CreditsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreditsDialog({ open, onClose }: CreditsDialogProps) {
  const { user } = useAuth();
  const { credits, earnCredits, refreshCredits } = useCredits();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [claimStreak, setClaimStreak] = useState(0);
  const [timeUntilClaim, setTimeUntilClaim] = useState('');

  useEffect(() => {
    if (open && user?.uid) {
      loadTransactions();
      checkClaimStatus();
    }
  }, [open, user?.uid]);

  const loadTransactions = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const txns = await getCreditTransactions(user.uid, 20);
      setTransactions(txns);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkClaimStatus = async () => {
    if (!user?.uid) return;

    try {
      const canClaimNow = await canClaimToday(user.uid);
      setCanClaim(canClaimNow);

      const record = await getDailyClaimRecord(user.uid);
      if (record) {
        setClaimStreak(record.currentStreak);
        if (!canClaimNow) {
          setTimeUntilClaim(getTimeUntilNextClaim(record.lastClaimDate));
        }
      }
    } catch (error) {
      console.error('Error checking claim status:', error);
    }
  };

  const handleClaim = async () => {
    if (!user?.uid || claiming) return;

    try {
      setClaiming(true);
      const result = await claimDailyCredits(user.uid);

      if (result.success) {
        // Add credits to user account
        await earnCredits(result.credits, result.message, 'earn');
        
        // Refresh everything
        await refreshCredits();
        await loadTransactions();
        await checkClaimStatus();

        // Show success message
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error claiming daily credits:', error);
      alert('Failed to claim credits. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  if (!credits) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Coins className="h-6 w-6 text-yellow-400" />
            Your Credits
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Daily Claim Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 border-2 border-yellow-500/50 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                  <Gift className="h-6 w-6 text-yellow-400" />
                  Daily Claim
                </h3>
                <p className="text-sm text-gray-400">
                  {canClaim 
                    ? `Claim your daily credits! ${claimStreak > 0 ? `(${claimStreak} day streak 🔥)` : ''}`
                    : `Come back ${timeUntilClaim}`
                  }
                </p>
              </div>
              <Button
                onClick={handleClaim}
                disabled={!canClaim || claiming}
                size="lg"
                className={`${
                  canClaim
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {claiming ? 'Claiming...' : canClaim ? '🎁 Claim Now' : '⏰ Claimed'}
              </Button>
            </div>
            
            {/* Streak Progress - Show next milestone */}
            {claimStreak > 0 && claimStreak < 7 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Progress to 7-day bonus</span>
                  <span>{claimStreak}/7 days</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(claimStreak / 7) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                  />
                </div>
                <p className="text-xs text-orange-400 mt-1">
                  {7 - claimStreak} days until +100 bonus credits! 🎉
                </p>
              </div>
            )}

            {claimStreak >= 7 && (
              <div className="mt-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-3">
                <p className="text-sm text-purple-300 font-semibold text-center">
                  🌟 You're on a {claimStreak}+ day streak! Keep it going! 🌟
                </p>
              </div>
            )}
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Credits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-5 w-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Total Credits</span>
              </div>
              <div className="text-3xl font-bold text-yellow-400">
                <CountUp
                  end={credits.totalCredits}
                  duration={1.2}
                  separator=","
                  decimals={0}
                />
              </div>
            </motion.div>

            {/* Daily Streak */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="text-sm text-gray-400">Daily Streak</span>
              </div>
              <div className="text-3xl font-bold text-orange-400">
                {credits.dailyStreak} days
              </div>
            </motion.div>

            {/* Bonus Multiplier */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                <span className="text-sm text-gray-400">Multiplier</span>
              </div>
              <div className="text-3xl font-bold text-purple-400">
                {credits.bonusMultiplier.toFixed(1)}x
              </div>
            </motion.div>
          </div>

          {/* How to Earn Section */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-400" />
              How to Earn Credits
            </h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center justify-between">
                <span>📅 Daily Claim</span>
                <span className="text-yellow-400 font-semibold">+10</span>
              </div>
              <div className="flex items-center justify-between">
                <span>🔥 Daily Claim Streak (per day)</span>
                <span className="text-yellow-400 font-semibold">+5</span>
              </div>
              <div className="flex items-center justify-between">
                <span>🎉 7-Day Streak Bonus</span>
                <span className="text-yellow-400 font-semibold">+100</span>
              </div>
              <div className="flex items-center justify-between">
                <span>✅ Complete routine task</span>
                <span className="text-yellow-400 font-semibold">+10</span>
              </div>
              <div className="flex items-center justify-between">
                <span>⏰ Complete before 7 AM</span>
                <span className="text-yellow-400 font-semibold">+5 bonus</span>
              </div>
              <div className="flex items-center justify-between">
                <span>💪 Complete full routine</span>
                <span className="text-yellow-400 font-semibold">+20 bonus</span>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div>
            <h3 className="font-semibold mb-3">Recent Activity</h3>
            <ScrollArea className="h-64 rounded-lg border border-gray-700">
              {loading ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Loading...
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                  <Coins className="h-12 w-12 mb-2 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-xs mt-1">Complete routine tasks to earn credits!</p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {transactions.map((txn) => (
                    <motion.div
                      key={txn.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            txn.amount > 0
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {txn.amount > 0 ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{txn.reason}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(txn.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`font-semibold ${
                          txn.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {txn.amount > 0 ? '+' : ''}
                        {txn.amount}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Premium Button Animations - Discord Only */}
          <div className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 border-2 border-purple-500/50 rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5 text-purple-400" />
              Button Animations (Discord Only)
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              Unlock exclusive button animations for your bottom navbar! These premium animations can only be redeemed through Discord. Join our Discord server and use <code className="bg-gray-800 px-2 py-1 rounded text-purple-300">/rewards</code> to see all available rewards.
            </p>
            <div className="space-y-3">
              <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <h4 className="font-semibold text-purple-300">Bounce Animation</h4>
                      <p className="text-xs text-gray-400">Buttons bounce on hover and click</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-yellow-400">6,000</span>
                </div>
                <p className="text-xs text-purple-300 mt-2">⚠️ Redeem via Discord: <code className="bg-gray-900 px-2 py-1 rounded">/redeem animation-bounce</code></p>
              </div>
              
              <div className="bg-gray-800/50 border border-pink-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💫</span>
                    <div>
                      <h4 className="font-semibold text-pink-300">Pulse Animation</h4>
                      <p className="text-xs text-gray-400">Buttons pulse with a glowing effect</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-yellow-400">8,000</span>
                </div>
                <p className="text-xs text-pink-300 mt-2">⚠️ Redeem via Discord: <code className="bg-gray-900 px-2 py-1 rounded">/redeem animation-pulse</code></p>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌀</span>
                    <div>
                      <h4 className="font-semibold text-yellow-300">Rotate Animation</h4>
                      <p className="text-xs text-gray-400">Buttons rotate on hover and click</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-yellow-400">10,000</span>
                </div>
                <p className="text-xs text-yellow-300 mt-2">⚠️ Redeem via Discord: <code className="bg-gray-900 px-2 py-1 rounded">/redeem animation-rotate</code></p>
              </div>
            </div>
            <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-300 text-center">
                💬 Join our Discord server to redeem these premium button animations! All high-value rewards (6,000+ credits) are Discord-exclusive.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

