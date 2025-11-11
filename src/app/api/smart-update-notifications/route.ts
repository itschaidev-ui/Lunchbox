import { NextRequest, NextResponse } from 'next/server';
import { smartUpdateTaskNotifications } from '@/lib/notifications/rescheduling-alerts';
import { scheduleNotificationsForTask } from '@/lib/notifications/notification-scheduler';

/**
 * POST /api/smart-update-notifications
 * Smart update notifications for a task with due date changes
 */
export async function POST(request: NextRequest) {
  try {
    const { taskId, userId, userEmail, userName, oldTask, updatedTask } = await request.json();

    if (!taskId || !userId || !userEmail || !oldTask || !updatedTask) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: taskId, userId, userEmail, oldTask, updatedTask'
      }, { status: 400 });
    }

    console.log(`🔄 Smart updating notifications for task: ${updatedTask.text}`);

    // Perform smart update
    await smartUpdateTaskNotifications(taskId, { uid: userId, email: userEmail, displayName: userName }, oldTask, updatedTask);

    // Schedule new notifications for the updated task
    if (updatedTask.dueDate) {
      await scheduleNotificationsForTask(userId, userEmail, userName, updatedTask);
    }

    return NextResponse.json({
      success: true,
      message: 'Smart notification update completed successfully',
      taskId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in smart update notifications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to smart update notifications',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
