import { NextRequest, NextResponse } from 'next/server';
import { scheduleNotificationsForTask } from '@/lib/notifications/simple-scheduler';

export async function POST(request: NextRequest) {
  try {
    const { taskId, userId, userEmail, userName, taskTitle, dueDate } = await request.json();

    if (!taskId || !userId || !userEmail || !taskTitle || !dueDate) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: taskId, userId, userEmail, taskTitle, dueDate'
      }, { status: 400 });
    }

    console.log(`📅 Scheduling notifications for task: ${taskTitle}`);
    
    await scheduleNotificationsForTask(
      taskId,
      userId,
      userEmail,
      userName || 'User',
      taskTitle,
      dueDate
    );

    return NextResponse.json({
      success: true,
      message: 'Notifications scheduled successfully',
      taskId
    });

  } catch (error) {
    console.error('❌ Error scheduling notifications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to schedule notifications',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
