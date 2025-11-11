// Client-side scheduler that calls the cron endpoint every minute
// This ensures notifications are processed even if the server-side scheduler isn't running

class ClientScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(): void {
    if (this.isRunning) {
      console.log('📅 Client scheduler is already running');
      return;
    }

    console.log('🚀 Starting client-side notification scheduler...');
    
    // Call the cron endpoint every minute
    this.intervalId = setInterval(async () => {
      try {
        const response = await fetch('/api/cron');
        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Client scheduler processed notifications successfully');
        } else {
          console.error('❌ Client scheduler failed:', result.error);
        }
      } catch (error) {
        console.error('❌ Error calling cron endpoint:', error);
      }
    }, 60 * 1000); // 1 minute

    this.isRunning = true;
    console.log('✅ Client scheduler started (checking every 1 minute)');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Client scheduler stopped');
  }

  getStatus() {
    return {
      running: this.isRunning,
      interval: 60 * 1000 // 1 minute in milliseconds
    };
  }
}

// Export singleton instance
export const clientScheduler = new ClientScheduler();

// Auto-start the client scheduler when the module is loaded (client-side only)
if (typeof window !== 'undefined') {
  console.log('🚀 Auto-starting client scheduler...');
  clientScheduler.start();
}
