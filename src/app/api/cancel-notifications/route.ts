import { NextRequest, NextResponse } from 'next/server';
import { cancelTaskNotifications } from '@/lib/notifications/notification-scheduler';

interface CancelNotificationRequest {
  taskId: string;
}

/**
 * POST /api/cancel-notifications
 * Cancel scheduled notifications for a task
 */
export async function POST(request: NextRequest) {
  try {
    const { taskId }: CancelNotificationRequest = await request.json();

    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: taskId'
      }, { status: 400 });
    }

    console.log(`🗑️ Cancelling notifications for task ${taskId}`);

    // Cancel notifications for the task
    await cancelTaskNotifications(taskId);

    return NextResponse.json({
      success: true,
      message: 'Notifications cancelled successfully',
      taskId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error cancelling notifications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel notifications',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
