import { NextRequest, NextResponse } from 'next/server';
import { checkAndProcessNotifications } from '@/lib/notifications/simple-task-notifications';
import { checkAndResetRoutines, resetDayOfWeekTasks } from '@/lib/routine-scheduler';
import { checkTaskCompletionEmails } from '@/lib/notifications/completion-email-cron';

export async function GET(request: NextRequest) {
  try {
    console.log('🕐 Cron job triggered - processing notifications and routines...');
    
    // Process task notifications
    await checkAndProcessNotifications();
    // Process completion/uncompletion emails (website cron)
    await checkTaskCompletionEmails();
    
    // Check and reset routines if it's midnight
    await checkAndResetRoutines();
    
    // Reset day-of-week tasks at midnight (uncheck completed tasks so they're fresh for the new day)
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Run at midnight (00:00) or within the first minute of each hour (for testing)
    if (currentMinute === 0 || (currentHour === 0 && currentMinute < 1)) {
      console.log('🔄 Resetting day-of-week tasks...');
      const resetCount = await resetDayOfWeekTasks();
      console.log(`✅ Reset ${resetCount} day-of-week tasks`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cron job completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in cron job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
