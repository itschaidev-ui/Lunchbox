'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingSaveButtonProps {
  onSave: () => void;
  hasChanges: boolean;
  isLoading?: boolean;
}

export function FloatingSaveButton({ onSave, hasChanges, isLoading = false }: FloatingSaveButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (hasChanges) {
      setIsVisible(true);
    } else {
      // Delay hiding to allow for smooth animation
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [hasChanges]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.3 
          }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Button
            onClick={onSave}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
