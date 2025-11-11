'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Coins } from 'lucide-react';
import { useCredits } from '@/context/credits-context';
import { Button } from '@/components/ui/button';
import { CreditsDialog } from './credits-dialog';

export function CreditsDisplay() {
  const { credits, loading } = useCredits();
  const [showDialog, setShowDialog] = useState(false);
  const [displayCredits, setDisplayCredits] = useState(0);
  const prevCreditsRef = useRef(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Update display credits with animation
  useEffect(() => {
    if (credits && credits.totalCredits !== undefined) {
      const currentCredits = credits.totalCredits;
      const prevCredits = prevCreditsRef.current;
      
      if (currentCredits !== prevCredits && prevCredits > 0) {
        setIsAnimating(true);
        // Reset animation state after animation completes
        setTimeout(() => setIsAnimating(false), 1500);
      }
      
      setDisplayCredits(currentCredits);
      prevCreditsRef.current = currentCredits;
    }
  }, [credits?.totalCredits]);

  if (loading) {
    return null;
  }

  if (!credits) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="relative h-9 px-3 hover:bg-gray-800 transition-colors group"
      >
        <motion.div
          className="flex items-center gap-2"
          animate={isAnimating ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Coins className="h-4 w-4 text-yellow-400" />
          <span className="font-semibold text-yellow-400">
            <CountUp
              start={prevCreditsRef.current}
              end={displayCredits}
              duration={1.2}
              separator=","
              decimals={0}
            />
          </span>
        </motion.div>

        {/* Streak indicator */}
        {credits.dailyStreak > 0 && (
          <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {credits.dailyStreak}
          </div>
        )}

        {/* Hover effect */}
        <div className="absolute inset-0 bg-yellow-400/10 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
      </Button>

      <CreditsDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
      />
    </>
  );
}

