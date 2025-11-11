'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Repeat,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Trash2,
  Edit,
  MoreVertical,
  Power,
  PowerOff,
  RotateCcw,
  Settings,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { useTasks } from '@/context/task-context';
import { useCredits } from '@/context/credits-context';
import { useRouter } from 'next/navigation';
import { getUserRoutines, deleteRoutine, toggleRoutineActive } from '@/lib/firebase-routines';
import { calculateFullRoutineBonus } from '@/lib/firebase-credits';
import type { Routine } from '@/lib/types';
import { RoutineFormDialog } from '@/components/routines/routine-form-dialog';
import { RoutineSettingsDialog } from '@/components/routines/routine-settings-dialog';
import { Header } from '@/components/layout/header';
import {
  hasCompletedRoutineToday,
  markRoutineCompleted,
  getTodayCompletedRoutines,
} from '@/lib/firebase-routine-completions';

export default function RoutinesPage() {
  const { user } = useAuth();
  const { tasks, toggleTask } = useTasks();
  const { earnCredits, refreshCredits } = useCredits();
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [completedRoutineIds, setCompletedRoutineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.uid) {
      loadRoutines();
      loadCompletedRoutines();
    }
  }, [user?.uid]);

  const loadCompletedRoutines = async () => {
    if (!user?.uid) return;
    try {
      const completed = await getTodayCompletedRoutines(user.uid);
      setCompletedRoutineIds(new Set(completed));
    } catch (error) {
      console.error('Error loading completed routines:', error);
    }
  };

  const loadRoutines = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const userRoutines = await getUserRoutines(user.uid);
      setRoutines(userRoutines);
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoutine = () => {
    setEditingRoutine(null);
    setIsFormOpen(true);
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setIsFormOpen(true);
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (!confirm('Are you sure you want to delete this routine? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteRoutine(routineId);
      setRoutines(routines.filter(r => r.id !== routineId));
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

  const handleToggleActive = async (routineId: string, isActive: boolean) => {
    try {
      await toggleRoutineActive(routineId, !isActive);
      setRoutines(routines.map(r => 
        r.id === routineId ? { ...r, isActive: !isActive } : r
      ));
    } catch (error) {
      console.error('Error toggling routine:', error);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingRoutine(null);
    loadRoutines();
  };

  const handleManualReset = async () => {
    if (!user?.uid) return;
    
    const confirmed = window.confirm(
      '⚠️ Manual Reset\n\n' +
      'This will:\n' +
      '• Reset all routine completions\n' +
      '• Uncheck all routine tasks\n' +
      '• Allow you to earn credits again\n\n' +
      'Are you sure?'
    );
    
    if (!confirmed) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/reset-routines?userId=${user.uid}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Clear local state
        setCompletedRoutineIds(new Set());
        
        // Reload completions and tasks
        await loadCompletedRoutines();
        
        // Reload page to refresh task states
        window.location.reload();
      } else {
        alert('❌ Failed to reset routines. Please try again.');
      }
    } catch (error) {
      console.error('Error resetting routines:', error);
      alert('❌ Error resetting routines. Please check the console.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearResetTimer = async () => {
    if (!user?.uid) return;
    
    const confirmed = window.confirm(
      '🧪 Clear Reset Timer (Testing)\n\n' +
      'This will clear your last reset record, allowing the automatic reset to trigger again immediately.\n\n' +
      'Use this to test if automatic resets are working.\n\n' +
      'Continue?'
    );
    
    if (!confirmed) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/reset-routines?userId=${user.uid}&clearTimer=true`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Reset timer cleared!\n\nThe next cron run (within 1 minute) will trigger an automatic reset if your reset time has passed.');
      } else {
        alert('❌ Failed to clear timer. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing timer:', error);
      alert('❌ Error clearing timer. Please check the console.');
    } finally {
      setLoading(false);
    }
  };

  // Check if routine is complete and award credits (ONCE per day - exploit prevention)
  useEffect(() => {
    if (!user?.uid) return;

    routines.forEach(async (routine) => {
      if (!routine.isActive) return;
      if (completedRoutineIds.has(routine.id)) return; // Already completed today

      const routineTasks = tasks.filter(task => routine.taskIds.includes(task.id));
      const allCompleted = routineTasks.length > 0 && routineTasks.every(task => task.completed);

      if (allCompleted) {
        // Double-check in Firebase to prevent race conditions
        const alreadyCompleted = await hasCompletedRoutineToday(user.uid, routine.id);
        if (alreadyCompleted) {
          console.log(`⚠️ Routine ${routine.name} already completed today, skipping credit award`);
          setCompletedRoutineIds(prev => new Set(prev).add(routine.id));
          return;
        }

        // Award credits
        const credits = calculateFullRoutineBonus(routineTasks.length);
        await earnCredits(credits, `Completed routine: ${routine.name}`, 'bonus', undefined, routine.id);
        
        // Mark as completed in Firebase (prevents exploit)
        await markRoutineCompleted(user.uid, routine.id, credits);
        
        // Update local state
        setCompletedRoutineIds(prev => new Set(prev).add(routine.id));

        // Refresh credits display
        setTimeout(() => {
          refreshCredits();
        }, 500);

        // Show celebration
        alert(`🎉 Routine Complete!\n\nYou earned ${credits} credits for completing "${routine.name}"!\n\nTasks are now locked until tomorrow.`);
      }
    });
  }, [tasks, routines, completedRoutineIds, earnCredits, user?.uid]);

  // Calculate overall stats
  const activeRoutines = routines.filter(r => r.isActive);
  const totalTasks = activeRoutines.reduce((sum, r) => sum + r.taskIds.length, 0);
  const completedTasks = activeRoutines.reduce((sum, routine) => {
    const routineTasks = tasks.filter(task => routine.taskIds.includes(task.id));
    const completed = routineTasks.filter(task => task.completed).length;
    return sum + completed;
  }, 0);
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/tasks')}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                  <Repeat className="h-8 w-8 text-blue-400" />
                  <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                    Daily Routines
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Build habits with recurring tasks that reset daily
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleCreateRoutine}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Routine</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>

          {/* Overall Progress */}
          {activeRoutines.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold">Today's Progress</h3>
                  <p className="text-sm text-gray-400">
                    {completedTasks} of {totalTasks} tasks completed
                  </p>
                </div>
                <div className="text-3xl font-bold text-blue-400">
                  {Math.round(overallProgress)}%
                </div>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </motion.div>
          )}

          {/* Routines List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-400">Loading routines...</div>
              </div>
            ) : routines.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-64 text-center"
              >
                <Repeat className="h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Routines Yet</h3>
                <p className="text-gray-400 mb-6 max-w-md">
                  Create your first routine to build daily habits and earn credits!
                </p>
                <Button
                  onClick={handleCreateRoutine}
                  className="bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Routine
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                {routines.map((routine, index) => {
                  const routineTasks = tasks.filter(task => routine.taskIds.includes(task.id));
                  const completedCount = routineTasks.filter(task => task.completed).length;
                  const totalCount = routineTasks.length;
                  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                  const isComplete = completedCount === totalCount && totalCount > 0;
                  const creditsAwarded = completedRoutineIds.has(routine.id);

                  return (
                    <motion.div
                      key={routine.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-gray-800/50 border rounded-lg p-5 hover:bg-gray-800 transition-colors ${
                        !routine.isActive ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">{routine.name}</h3>
                            {!routine.isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Paused
                              </Badge>
                            )}
                            {isComplete && routine.isActive && creditsAwarded && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                💰 Credits Earned
                              </Badge>
                            )}
                            {isComplete && routine.isActive && !creditsAwarded && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                ✓ Complete
                              </Badge>
                            )}
                          </div>
                          {routine.description && (
                            <p className="text-sm text-gray-400">{routine.description}</p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                            <DropdownMenuItem
                              onClick={() => handleEditRoutine(routine)}
                              className="cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(routine.id, routine.isActive)}
                              className="cursor-pointer"
                            >
                              {routine.isActive ? (
                                <>
                                  <PowerOff className="h-4 w-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-700" />
                            <DropdownMenuItem
                              onClick={() => handleDeleteRoutine(routine.id)}
                              className="cursor-pointer text-red-400 focus:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Progress */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Progress</span>
                          <span className="font-semibold">
                            {completedCount}/{totalCount}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>

                      {/* Task List Preview */}
                      <div className="space-y-2">
                        {routine.taskIds.map(taskId => {
                          const task = tasks.find(t => t.id === taskId);
                          if (!task) return null;

                          // Can't toggle if credits have been awarded
                          const canToggle = !creditsAwarded;

                          return (
                            <button
                              key={task.id}
                              onClick={() => canToggle && toggleTask(task.id)}
                              disabled={!canToggle}
                              className={`flex items-center gap-2 text-sm w-full text-left p-2 rounded hover:bg-gray-700/50 transition-colors ${
                                !canToggle ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                              }`}
                            >
                              {task.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-600 shrink-0" />
                              )}
                              <span className={task.completed ? 'line-through text-gray-500' : ''}>
                                {task.text}
                              </span>
                              {creditsAwarded && (
                                <span className="ml-auto text-xs text-yellow-400">🔒</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Routine Form Dialog */}
      <RoutineFormDialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRoutine(null);
        }}
        onSuccess={handleFormSuccess}
        routine={editingRoutine}
      />

      {/* Routine Settings Dialog */}
      <RoutineSettingsDialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

