// Auto-start the scheduler when this module is imported
import { simpleScheduler } from './simple-scheduler';

// Only run on server-side
if (typeof window === 'undefined') {
  console.log('🚀 Auto-starting simple scheduler from auto-start module...');
  simpleScheduler.start();
  
  // Also run an immediate check
  setTimeout(async () => {
    try {
      await simpleScheduler.runImmediateCheck();
    } catch (error) {
      console.error('❌ Error in auto-start immediate check:', error);
    }
  }, 2000); // Wait 2 seconds then run immediate check
}
