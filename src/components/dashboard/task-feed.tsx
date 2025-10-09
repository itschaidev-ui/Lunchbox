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
      <div className="bg-card border border-dashed rounded-lg p-8 text-center">
        <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium text-foreground">All caught up!</h3>
        <p className="mt-1 text-sm text-muted-foreground">You have no overdue or upcoming tasks for the next 7 days.</p>
        <Button variant="outline" className="mt-4" asChild>
            <Link href="/tasks">Go to Tasks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
            <h2 className="text-lg font-headline font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Your Week Ahead
            </h2>
            <p className="text-sm text-muted-foreground">Overdue and upcoming tasks for the next 7 days.</p>
        </div>
        <div className="divide-y divide-border">
            {upcomingTasks.map(task => {
                 const isOverdue = isPast(task.dueDate) && !task.completed;
                 return (
                    <div key={task.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                        <div>
                            <p className="font-medium text-foreground">{task.text}</p>
                            <p className="text-sm text-muted-foreground">
                                Due {formatDistanceToNow(task.dueDate, { addSuffix: true })}
                            </p>
                        </div>
                        {isOverdue && (
                            <Badge variant="destructive" className="flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Overdue
                            </Badge>
                        )}
                    </div>
                 )
            })}
        </div>
        <div className="p-2 border-t text-center">
            <Button variant="link" asChild>
                <Link href="/tasks">View all tasks</Link>
            </Button>
        </div>
    </div>
  );
}
