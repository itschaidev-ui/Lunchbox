import { NextRequest, NextResponse } from 'next/server';
import { checkAndProcessNotifications } from '@/lib/notifications/simple-task-notifications';
import { checkAndResetRoutines } from '@/lib/routine-scheduler';
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
