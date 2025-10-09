
'use client';

import { useTimer } from '@/context/timer-context';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Minimize2, TimerIcon, X } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function TimerWidget() {
  const {
    isActive,
    isMinimized,
    displayTime,
    position,
    closeTimer,
    toggleMinimized,
    setPosition,
  } = useTimer();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove as any);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove as any);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);


  if (!isActive) {
    return null;
  }

  return (
    <div
      style={{
        left: position.x,
        top: position.y,
      }}
      className="absolute z-50"
    >
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={cn(
                "bg-card border-2 border-primary/50 rounded-lg shadow-2xl flex flex-col transition-all duration-300",
                isMinimized ? 'w-48' : 'w-64'
                )}
            >
                <div
                onMouseDown={handleMouseDown}
                className="p-1.5 flex items-center justify-between cursor-grab bg-card rounded-t-lg"
                >
                    <div className="flex items-center gap-1.5 text-primary">
                        <GripVertical className="h-5 w-5 text-muted-foreground/50" />
                        <TimerIcon className="h-5 w-5" />
                        <span className="font-headline text-sm font-semibold">Focus Timer</span>
                    </div>
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMinimized}>
                        <Minimize2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/80 hover:text-destructive" onClick={closeTimer}>
                        <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                
                <AnimatePresence>
                {!isMinimized && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="p-6 flex items-center justify-center">
                        <p className="text-5xl font-bold font-mono text-foreground tracking-tighter">
                            {displayTime}
                        </p>
                    </div>
                </motion.div>
                )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    </div>
  );
}
