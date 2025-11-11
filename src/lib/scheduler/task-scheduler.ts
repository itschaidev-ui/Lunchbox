import { processDueNotifications } from '@/lib/notifications/notification-scheduler';
import { checkOverdueTasks } from '@/lib/notifications/overdue-scheduler';

/**
 * Task Scheduler for automatic due task notifications
 */
class TaskScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the task scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('📅 Task scheduler is already running');
      return;
    }

    console.log('🚀 Starting task scheduler...');
    
    // NOTIFICATION SYSTEM DISABLED - No automatic notifications
    console.log('🔕 Notification system disabled - no automatic notifications will be sent');
    
    // Check every 1 minute for due notifications (DISABLED)
    this.intervalId = setInterval(async () => {
      console.log('⏰ Notification check skipped (system disabled)');
      // await processDueNotifications(); // DISABLED
    }, 1 * 60 * 1000); // 1 minute

    // Check every 5 minutes for overdue tasks (DISABLED)
    setInterval(async () => {
      console.log('🔍 Overdue check skipped (system disabled)');
      // await checkOverdueTasks(); // DISABLED
    }, 5 * 60 * 1000); // 5 minutes

    this.isRunning = true;
    console.log('✅ Task scheduler started (processing notifications every 1 minute)');
  }

  /**
   * Stop the task scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Task scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus(): { running: boolean; interval: number } {
    return {
      running: this.isRunning,
      interval: 1 * 60 * 1000 // 1 minute in milliseconds
    };
  }

  /**
   * Run immediate check (DISABLED)
   */
  async runImmediateCheck(): Promise<void> {
    console.log('🔔 Notification processing disabled - no notifications will be sent');
    console.log('✅ Immediate notification processing skipped (system disabled)');
    // await processDueNotifications(); // DISABLED
  }
}

// Export singleton instance
export const taskScheduler = new TaskScheduler();

/**
 * Initialize the task scheduler
 */
export function initializeTaskScheduler(): void {
  // Always start the scheduler
  console.log('🚀 Initializing task scheduler...');
  taskScheduler.start();
  console.log('✅ Task scheduler initialized and running');
}

/**
 * Check if a task is due soon (within 24 hours)
 */
export function isTaskDueSoon(dueDate: string): boolean {
  const now = new Date();
  const due = new Date(dueDate);
  const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return diffHours <= 24 && diffHours > 0;
}

/**
 * Check if a task is overdue
 */
export function isTaskOverdue(dueDate: string): boolean {
  const now = new Date();
  const due = new Date(dueDate);
  
  return due.getTime() < now.getTime();
}

/**
 * Check if a task is due today
 */
export function isTaskDueToday(dueDate: string): boolean {
  const now = new Date();
  const due = new Date(dueDate);
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  
  return dueDateOnly.getTime() === today.getTime();
}
