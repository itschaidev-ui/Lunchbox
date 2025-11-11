'use client';

import { useTasks } from '@/context/task-context';
import { useMemo } from 'react';
import { isPast, isWithinInterval, addDays, parseISO, formatDistanceToNow } from 'date-fns';
import { AlertCircle, Calendar, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '../ui/button';

export function TaskFeed() {
  const { tasks } = useTasks();

  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const nextWeek = addDays(now, 7);

    return tasks
      .filter(task => !task.completed && task.dueDate)
      .map(task => ({
        ...task,
        dueDate: parseISO(task.dueDate!),
      }))
      .filter(task => {
        const isOverdue = isPast(task.dueDate) && !task.completed;
        const isUpcoming = isWithinInterval(task.dueDate, { start: now, end: nextWeek });
        return isOverdue || isUpcoming;
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [tasks]);

  if (upcomingTasks.length === 0) {
    return (
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckSquare className="h-6 w-6 text-green-500" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">All caught up!</h3>
        <p className="text-xs text-muted-foreground mb-3">No tasks due in the next 7 days.</p>
        <Button variant="ghost" size="sm" className="text-xs h-8" asChild>
            <Link href="/tasks">View Tasks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-700/50">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">Your Week Ahead</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1 break-words">Upcoming and overdue tasks for the next 7 days.</p>
        </div>
        <div className="divide-y divide-gray-700/30">
            {upcomingTasks.map(task => {
                 const isOverdue = isPast(task.dueDate) && !task.completed;
                 return (
                    <div key={task.id} className="p-3 hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-start justify-between gap-2 min-w-0">
                            <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="text-sm font-medium text-foreground truncate break-all">{task.text}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {formatDistanceToNow(task.dueDate, { addSuffix: true })}
                                </p>
                            </div>
                            {isOverdue && (
                                <Badge variant="destructive" className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 h-5 shrink-0 whitespace-nowrap">
                                    <AlertCircle className="h-2.5 w-2.5 shrink-0" />
                                    Overdue
                                </Badge>
                            )}
                        </div>
                    </div>
                 )
            })}
        </div>
        <div className="p-2 border-t border-gray-700/30 text-center">
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground hover:text-foreground" asChild>
                <Link href="/tasks">View all tasks →</Link>
            </Button>
        </div>
    </div>
  );
}
