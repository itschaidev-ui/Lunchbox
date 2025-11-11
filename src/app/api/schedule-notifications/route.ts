import { NextRequest, NextResponse } from 'next/server';
import { scheduleNotificationsForTask } from '@/lib/notifications/notification-scheduler';
import type { Task } from '@/lib/types';

interface ScheduleNotificationRequest {
  taskId: string;
  userId: string;
  userEmail: string;
  userName: string;
  task: Task;
}

/**
 * POST /api/schedule-notifications
 * Schedule notifications for a task
 */
export async function POST(request: NextRequest) {
  try {
    const { taskId, userId, userEmail, userName, task }: ScheduleNotificationRequest = await request.json();

    if (!taskId || !userId || !userEmail || !task) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: taskId, userId, userEmail, task'
      }, { status: 400 });
    }

    console.log(`📅 Scheduling notifications for task "${task.text}" (${taskId})`);

    // Schedule notifications for the task
    await scheduleNotificationsForTask(userId, userEmail, userName, task);

    return NextResponse.json({
      success: true,
      message: 'Notifications scheduled successfully',
      taskId,
      taskText: task.text,
      dueDate: task.dueDate,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error scheduling notifications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to schedule notifications',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
