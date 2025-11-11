'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { ChevronRight, ChevronDown, Brain, Loader2, Sparkles } from 'lucide-react';
import { Badge } from './badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ReasoningStep {
  id: string;
  title: string;
  description: string;
  status: 'thinking' | 'completed' | 'error';
  details?: string;
}

interface ReasoningDisplayProps {
  isActive: boolean;
  steps: ReasoningStep[];
  currentStep?: string;
  className?: string;
  initialExpandedState?: boolean;
  collapsedText?: string;
}

export function ReasoningDisplay({
  isActive,
  steps,
  currentStep,
  className = '',
  initialExpandedState = true,
  collapsedText = 'View reasoning process'
}: ReasoningDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpandedState);

  useEffect(() => {
    setIsExpanded(initialExpandedState);
  }, [initialExpandedState]);

  if (!isActive || steps.length === 0) return null;

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const totalSteps = steps.length;
  const isThinking = steps.some(s => s.status === 'thinking');

  const getStepIcon = (step: ReasoningStep) => {
    switch (step.status) {
      case 'thinking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'completed':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="h-4 w-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
          >
            ✓
          </motion.div>
        );
      case 'error':
        return <div className="h-4 w-4 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white text-[10px] font-bold">!</div>;
      default:
        return null;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.4, 
        ease: [0.23, 1, 0.32, 1] // Custom easing for smooth effect
      } 
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.98,
      transition: { duration: 0.2 }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto',
      transition: { 
        duration: 0.3,
        ease: 'easeOut',
        when: 'beforeChildren',
        staggerChildren: 0.05
      } 
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.2 }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          className={cn(
            "relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-4 shadow-2xl backdrop-blur-sm",
            "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-purple-500/10 before:via-transparent before:to-blue-500/10 before:pointer-events-none",
            className
          )}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between cursor-pointer group" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Brain className="h-5 w-5 text-purple-400" />
                {isThinking && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -inset-1 bg-purple-400/20 rounded-full blur-sm"
                  />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-semibold text-white">
                    {isExpanded ? 'AI Reasoning Process' : collapsedText}
                  </h3>
                  {isThinking && (
                    <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30 px-2 py-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                {!isExpanded && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {completedSteps}/{totalSteps} steps completed
                  </p>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          {/* Progress Bar */}
          {!isExpanded && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 h-1.5 bg-gray-700/50 rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500"
              />
            </motion.div>
          )}

          {/* Steps Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={contentVariants}
                className="mt-4 space-y-3"
              >
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    variants={stepVariants}
                    className={cn(
                      "flex items-start space-x-3 p-3 rounded-lg transition-all",
                      currentStep === step.id 
                        ? "bg-blue-500/10 border border-blue-500/20" 
                        : "bg-gray-800/30 border border-transparent"
                    )}
                  >
                    <div className="mt-0.5 flex-shrink-0">{getStepIcon(step)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className={cn(
                          "text-sm font-semibold",
                          currentStep === step.id ? "text-blue-300" : "text-gray-200"
                        )}>
                          {step.title}
                        </p>
                        {currentStep === step.id && (
                          <Badge variant="secondary" className="text-[10px] bg-blue-500/20 text-blue-300 border-blue-500/30 px-1.5 py-0">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        {step.description}
                      </p>
                      {step.details && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-gray-500 mt-2 pl-3 border-l-2 border-gray-700"
                        >
                          {step.details}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}