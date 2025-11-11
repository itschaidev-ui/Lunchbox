import { NextRequest, NextResponse } from 'next/server';
import { cancelTaskNotifications } from '@/lib/notifications/simple-scheduler';

export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: taskId'
      }, { status: 400 });
    }

    console.log(`🗑️ Cancelling notifications for task: ${taskId}`);
    
    await cancelTaskNotifications(taskId);

    return NextResponse.json({
      success: true,
      message: 'Notifications cancelled successfully',
      taskId
    });

  } catch (error) {
    console.error('❌ Error cancelling notifications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel notifications',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
