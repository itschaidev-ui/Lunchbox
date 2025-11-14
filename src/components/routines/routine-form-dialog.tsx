'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Search, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { useTasks } from '@/context/task-context';
import { createRoutine, updateRoutine } from '@/lib/firebase-routines';
import type { Routine } from '@/lib/types';

interface RoutineFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  routine?: Routine | null;
}

export function RoutineFormDialog({
  open,
  onClose,
  onSuccess,
  routine,
}: RoutineFormDialogProps) {
  const { user } = useAuth();
  const { tasks } = useTasks();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize form with routine data if editing
  useEffect(() => {
    if (routine) {
      setName(routine.name);
      setDescription(routine.description || '');
      setSelectedTaskIds(routine.taskIds);
    } else {
      setName('');
      setDescription('');
      setSelectedTaskIds([]);
    }
    setSearchTerm('');
  }, [routine, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !name.trim() || selectedTaskIds.length === 0) return;

    try {
      setLoading(true);

      if (routine) {
        // Update existing routine
        await updateRoutine(routine.id, {
          name: name.trim(),
          description: description.trim(),
          taskIds: selectedTaskIds,
        });
      } else {
        // Create new routine
        await createRoutine(
          user.uid,
          name.trim(),
          description.trim(),
          selectedTaskIds
        );
      }

      onSuccess();
      onClose(); // Ensure dialog closes after success
    } catch (error) {
      console.error('Error saving routine:', error);
      // Don't close on error - let user see the error
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task =>
    task.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate selected and unselected tasks
  const selectedTasks = filteredTasks.filter(task => selectedTaskIds.includes(task.id));
  const unselectedTasks = filteredTasks.filter(task => !selectedTaskIds.includes(task.id));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {routine ? 'Edit Routine' : 'Create New Routine'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Routine Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Routine Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Routine, Evening Checklist"
              required
              className="bg-gray-800 border-gray-700"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this routine for?"
              rows={2}
              className="bg-gray-800 border-gray-700 resize-none"
            />
          </div>

          {/* Task Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Select Tasks *</Label>
              <span className="text-sm text-gray-400">
                {selectedTaskIds.length} selected
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks..."
                className="pl-10 bg-gray-800 border-gray-700"
              />
            </div>

            {/* Selected Tasks Preview */}
            {selectedTaskIds.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                {selectedTasks.map(task => (
                  <Badge
                    key={task.id}
                    variant="secondary"
                    className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 border-blue-500/30 flex items-center gap-1"
                  >
                    {task.text}
                    <button
                      type="button"
                      onClick={() => toggleTaskSelection(task.id)}
                      className="ml-1 hover:opacity-70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Task List */}
            <ScrollArea className="h-64 rounded-lg border border-gray-700 bg-gray-800/30">
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                  <p className="text-sm">No tasks found</p>
                  {searchTerm && (
                    <p className="text-xs mt-1">Try a different search term</p>
                  )}
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {unselectedTasks.map(task => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() => toggleTaskSelection(task.id)}
                    >
                      <Checkbox
                        checked={selectedTaskIds.includes(task.id)}
                        onCheckedChange={() => toggleTaskSelection(task.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{task.text}</p>
                        {task.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {task.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {selectedTaskIds.length === 0 && (
              <p className="text-xs text-red-400">
                Please select at least one task for this routine
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-gray-600 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim() || selectedTaskIds.length === 0}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : routine ? 'Update Routine' : 'Create Routine'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

