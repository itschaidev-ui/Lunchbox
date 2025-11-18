import { NextRequest, NextResponse } from 'next/server';
import { scheduleNotificationsForTask, scheduleDayOfWeekTaskNotifications } from '@/lib/notifications/simple-scheduler';

export async function POST(request: NextRequest) {
  try {
    const { taskId, userId, userEmail, userName, taskTitle, dueDate, availableDays, availableDaysTime, userTimezone, repeatWeeks, repeatStartDate } = await request.json();

    if (!taskId || !userId || !userEmail || !taskTitle) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: taskId, userId, userEmail, taskTitle'
      }, { status: 400 });
    }

    console.log(`📅 Scheduling notifications for task: ${taskTitle}`);
    
    // Check if this is a day-of-week task
    if (availableDays && availableDays.length > 0) {
      // Only schedule notifications if time is specified (time is optional)
      if (availableDaysTime && availableDaysTime.trim() !== '') {
        await scheduleDayOfWeekTaskNotifications(
          taskId,
          userId,
          userEmail,
          userName || 'User',
          taskTitle,
          availableDays,
          availableDaysTime,
          userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          repeatWeeks,
          repeatStartDate
        );
      } else {
        // Task has days but no time - skip notifications (available all day)
        console.log(`⏭️ Day-of-week task without time - skipping notifications (available all day)`);
      }
    } else if (dueDate) {
      // Regular task with due date
      await scheduleNotificationsForTask(
        taskId,
        userId,
        userEmail,
        userName || 'User',
        taskTitle,
        dueDate
      );
    } else {
      return NextResponse.json({
        success: false,
        error: 'Task must have either dueDate or availableDays'
      }, { status: 400 });
    }

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
