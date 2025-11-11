import { checkAndProcessNotifications } from '@/lib/notifications/simple-task-notifications';

class SimpleScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private keepAliveInterval: NodeJS.Timeout | null = null;

  start(): void {
    if (this.isRunning) {
      console.log('📅 Simple scheduler is already running');
      return;
    }

    console.log('🚀 Starting simple notification scheduler...');
    
    // Check every 1 minute for due notifications
    this.intervalId = setInterval(async () => {
      try {
        await checkAndProcessNotifications();
      } catch (error) {
        console.error('❌ Error in simple notification check:', error);
      }
    }, 60 * 1000); // 1 minute

    this.isRunning = true;
    
    // Keep-alive mechanism: restart if stopped unexpectedly
    this.keepAliveInterval = setInterval(() => {
      if (!this.isRunning) {
        console.log('🔄 Scheduler stopped unexpectedly, restarting...');
        this.start();
      }
    }, 30 * 1000); // Check every 30 seconds
    
    console.log('✅ Simple scheduler started (checking every 1 minute)');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Simple scheduler stopped');
  }

  getStatus() {
    return {
      running: this.isRunning,
      interval: 60 * 1000 // 1 minute in milliseconds
    };
  }

  /**
   * Run immediate check
   */
  async runImmediateCheck(): Promise<void> {
    console.log('🔔 Running immediate simple notification check...');
    try {
      await checkAndProcessNotifications();
      console.log('✅ Immediate simple notification check completed');
    } catch (error) {
      console.error('❌ Error in immediate simple notification check:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const simpleScheduler = new SimpleScheduler();

// Auto-start the scheduler when the module is loaded
if (typeof window === 'undefined') { // Only on server-side
  console.log('🚀 Auto-starting simple scheduler...');
  simpleScheduler.start();
}
