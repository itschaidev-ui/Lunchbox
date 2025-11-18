/**
 * Hook to manage daily completions for repeating tasks
 */

import { useState, useEffect } from 'react';
import { isTaskCompletedForDate } from '@/lib/firebase-task-daily-completions';
import type { Task } from '@/lib/types';

export function useTaskDailyCompletions(tasks: Task[], date: Date) {
  const [completions, setCompletions] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    const checkCompletions = async () => {
      const dateStr = date.toISOString().split('T')[0];
      const newCompletions = new Map<string, boolean>();

      // Check completion status for all repeating tasks
      for (const task of tasks) {
        if (task.availableDays && task.availableDays.length > 0) {
          const isCompleted = await isTaskCompletedForDate(task.id, date);
          newCompletions.set(`${task.id}_${dateStr}`, isCompleted);
        }
      }

      setCompletions(newCompletions);
    };

    checkCompletions();
  }, [tasks, date]);

  const isTaskCompletedForDateLocal = (taskId: string, checkDate: Date): boolean => {
    const dateStr = checkDate.toISOString().split('T')[0];
    return completions.get(`${taskId}_${dateStr}`) || false;
  };

  return { isTaskCompletedForDateLocal, completions };
}

