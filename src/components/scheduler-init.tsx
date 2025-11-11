'use client';

import { useEffect } from 'react';

export default function SchedulerInit() {
  useEffect(() => {
    console.log('🚀 Initializing client scheduler...');
    
    // Start the scheduler immediately
    const startScheduler = () => {
      console.log('📅 Starting client-side notification scheduler...');
      
      // Call the cron endpoint every minute
      const intervalId = setInterval(async () => {
        try {
          console.log('🕐 Client scheduler: Checking for notifications...');
          const response = await fetch('/api/cron');
          const result = await response.json();
          
          if (result.success) {
            console.log('✅ Client scheduler: Notifications processed successfully');
          } else {
            console.error('❌ Client scheduler failed:', result.error);
          }
        } catch (error) {
          console.error('❌ Error calling cron endpoint:', error);
        }
      }, 60 * 1000); // 1 minute

      // Also run immediately
      fetch('/api/cron')
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            console.log('✅ Initial notification check completed');
          }
        })
        .catch(error => console.error('❌ Initial notification check failed:', error));

      return () => {
        clearInterval(intervalId);
        console.log('🛑 Client scheduler stopped');
      };
    };

    const cleanup = startScheduler();
    
    return cleanup;
  }, []);

  return null; // This component doesn't render anything
}
