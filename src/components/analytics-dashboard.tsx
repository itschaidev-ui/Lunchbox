'use client';

import { useMemo } from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Calendar, Tag } from 'lucide-react';
import type { Task } from '@/lib/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

interface AnalyticsDashboardProps {
  tasks: Task[];
}

export function AnalyticsDashboard({ tasks }: AnalyticsDashboardProps) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = tasks.filter(t => !t.completed).length;
    const overdue = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && !t.completed
    ).length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Weekly completion trend
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const weeklyCompletions = weekDays.map(day => {
      // This would need to be calculated from daily completions in a real implementation
      return { date: day, count: 0 };
    });

    // Tag distribution
    const tagCounts: Record<string, number> = {};
    tasks.forEach(task => {
      if (task.tags) {
        task.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    return {
      total,
      completed,
      active,
      overdue,
      completionRate,
      weeklyCompletions,
      topTags,
    };
  }, [tasks]);

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-orange-500">{stats.active}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-red-500">{stats.overdue}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Completion Rate
          </h3>
          <span className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</span>
        </div>
        <Progress value={stats.completionRate} className="h-3" />
      </Card>

      {/* Top Tags */}
      {stats.topTags.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Most Used Tags
          </h3>
          <div className="space-y-2">
            {stats.topTags.map(({ tag, count }) => (
              <div key={tag} className="flex items-center justify-between">
                <span className="text-sm">{tag}</span>
                <span className="text-sm font-medium">{count} tasks</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

