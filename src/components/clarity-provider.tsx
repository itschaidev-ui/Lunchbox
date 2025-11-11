'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTasks } from '@/context/task-context';
import { 
  initializeClarity, 
  trackUser, 
  setTag, 
  trackEvent, 
  encodeBackwards 
} from '@/lib/clarity';

export function ClarityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { tasks } = useTasks();

  useEffect(() => {
    // Initialize Clarity
    initializeClarity();
  }, []);

  useEffect(() => {
    if (user) {
      // Track user with encoded email
      const encodedEmail = encodeBackwards(user.email || '');
      trackUser(encodedEmail, undefined, undefined, user.displayName || 'User');
      
      // Set user tags
      setTag('user_type', user.email === 'itschaidev@gmail.com' ? 'admin' : 'user');
      setTag('login_method', 'google');
      
      // Track login event
      trackEvent('user_login');
    }
  }, [user]);

  useEffect(() => {
    if (tasks.length > 0) {
      // Track task-related events
      setTag('total_tasks', tasks.length.toString());
      setTag('completed_tasks', tasks.filter(t => t.completed).length.toString());
      
      // Track task creation/completion events
      const completedTasks = tasks.filter(t => t.completed).length;
      const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
      
      setTag('completion_rate', completionRate.toFixed(1));
      
      if (completionRate > 80) {
        trackEvent('high_completion_rate');
      }
    }
  }, [tasks]);

  return <>{children}</>;
}
