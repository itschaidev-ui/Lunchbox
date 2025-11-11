import { NextResponse } from 'next/server';
import { scheduleNotificationsForTask } from '@/lib/notifications/notification-scheduler';
import type { Task } from '@/lib/types';

/**
 * POST /api/test-timing
 * Test notification timing with a task due in 2 minutes
 */
export async function POST() {
  try {
    console.log('🧪 Testing notification timing...');
    
    // Create a test task due in 2 minutes
    const now = new Date();
    const dueIn2Minutes = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now
    
    const testTask: Task = {
      id: 'test-timing-task',
      userId: 'itschaidev@gmail.com',
      text: 'Test Timing Task',
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: dueIn2Minutes.toISOString()
    };
    
    console.log(`📅 Test task due at: ${dueIn2Minutes.toLocaleString()}`);
    console.log(`📅 Notification should be sent at: ${new Date(dueIn2Minutes.getTime() - 60000).toLocaleString()}`);
    
    // Schedule notifications for the test task
    await scheduleNotificationsForTask(
      'itschaidev@gmail.com',
      'itschaidev@gmail.com',
      'Chai Dev',
      testTask
    );
    
    return NextResponse.json({
      success: true,
      message: 'Test timing notification scheduled',
      taskDue: dueIn2Minutes.toLocaleString(),
      notificationTime: new Date(dueIn2Minutes.getTime() - 60000).toLocaleString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error testing timing:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test timing',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
