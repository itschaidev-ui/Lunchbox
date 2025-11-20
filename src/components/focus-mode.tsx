'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTasks } from '@/context/task-context';
import { TaskTimer } from '@/components/task-timer';
import { Focus, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string;
}

export function FocusMode({ isOpen, onClose, taskId }: FocusModeProps) {
  const { tasks, toggleTask } = useTasks();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(taskId);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const activeTasks = tasks.filter(t => !t.completed);
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;

  useEffect(() => {
    if (taskId) {
      setSelectedTaskId(taskId);
    }
  }, [taskId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && isOpen) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isOpen]);

  const handleTaskComplete = async (taskId: string) => {
    await toggleTask(taskId);
    setCompletedTasks(prev => new Set([...prev, taskId]));
    
    // Auto-select next task
    const remainingTasks = activeTasks.filter(t => 
      !t.completed && !completedTasks.has(t.id) && t.id !== taskId
    );
    if (remainingTasks.length > 0) {
      setSelectedTaskId(remainingTasks[0].id);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = activeTasks.length > 0 
    ? (completedTasks.size / activeTasks.length) * 100 
    : 0;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Focus className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Focus Mode</h2>
              <p className="text-sm text-muted-foreground">
                {formatTime(timeElapsed)} • {completedTasks.size} of {activeTasks.length} completed
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-gray-700">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Selected Task */}
            {selectedTask ? (
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{selectedTask.text}</h3>
                    {selectedTask.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {selectedTask.description}
                      </p>
                    )}
                    {selectedTask.tags && selectedTask.tags.length > 0 && (
                      <div className="flex gap-2 mb-4">
                        {selectedTask.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleTaskComplete(selectedTask.id)}
                    className="ml-4"
                    size="lg"
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Complete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Focus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a task to focus on</p>
              </div>
            )}

            {/* Task List */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm mb-3">Active Tasks</h4>
              {activeTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  All tasks completed! 🎉
                </div>
              ) : (
                activeTasks.map(task => (
                  <div
                    key={task.id}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all",
                      selectedTaskId === task.id
                        ? "bg-blue-500/20 border-blue-500/50"
                        : "bg-gray-800/30 border-gray-700 hover:bg-gray-800/50",
                      completedTasks.has(task.id) && "opacity-50"
                    )}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium">{task.text}</h5>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      {completedTasks.has(task.id) && (
                        <CheckCircle2 className="h-5 w-5 text-green-400 ml-4" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isRunning ? "destructive" : "default"}
              onClick={() => setIsRunning(!isRunning)}
              size="lg"
            >
              {isRunning ? 'Pause' : 'Start Focus'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTimeElapsed(0);
                setIsRunning(false);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

