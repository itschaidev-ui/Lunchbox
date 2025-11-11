import { NextResponse } from 'next/server';
import { checkAndNotifyDueTasks } from '@/lib/notifications/task-notifications';

/**
 * POST /api/notifications/check-due-tasks
 * Manually trigger due task check and send notifications
 */
export async function POST() {
  try {
    console.log('🔔 Manual due task check triggered');
    
    await checkAndNotifyDueTasks();
    
    return NextResponse.json({
      success: true,
      message: 'Due task check completed successfully'
    });

  } catch (error) {
    console.error('❌ Error in due task check:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check due tasks',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * GET /api/notifications/check-due-tasks
 * Get status of due task checking system
 */
export async function GET() {
  try {
    return NextResponse.json({
      message: 'Due task notification system is ready',
      endpoints: {
        check: 'POST /api/notifications/check-due-tasks',
        test: 'POST /api/notifications/user'
      },
      features: [
        'Automatic due task detection',
        'Email notifications for overdue tasks',
        'Email notifications for tasks due today',
        'Email notifications for tasks due tomorrow',
        'Integration with Google sign-in email'
      ]
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get system status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
