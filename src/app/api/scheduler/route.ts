import { NextRequest, NextResponse } from 'next/server';
import { taskScheduler, initializeTaskScheduler } from '@/lib/scheduler/task-scheduler';

// Initialize scheduler on first load
let initialized = false;
if (!initialized) {
  initializeTaskScheduler();
  initialized = true;
}

/**
 * GET /api/scheduler
 * Get scheduler status
 */
export async function GET() {
  try {
    const status = taskScheduler.getStatus();
    
    return NextResponse.json({
      success: true,
      scheduler: {
        running: status.running,
        interval: status.interval,
        intervalMinutes: status.interval / (1000 * 60),
        nextCheck: status.running ? 'Every 1 minute' : 'Not scheduled'
      },
      features: [
        'Scheduled notification system',
        'Notifications triggered at exact due times',
        'Automatic notification scheduling on task create/update',
        'Email notifications for overdue tasks',
        'Email notifications for tasks due today',
        'Integration with Google sign-in email'
      ],
      endpoints: {
        start: 'POST /api/scheduler/start',
        stop: 'POST /api/scheduler/stop',
        check: 'POST /api/scheduler/check',
        status: 'GET /api/scheduler'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get scheduler status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * POST /api/scheduler/start
 * Start the task scheduler
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    switch (action) {
      case 'start':
        taskScheduler.start();
        return NextResponse.json({
          success: true,
          message: 'Task scheduler started',
          status: taskScheduler.getStatus()
        });
        
      case 'stop':
        taskScheduler.stop();
        return NextResponse.json({
          success: true,
          message: 'Task scheduler stopped',
          status: taskScheduler.getStatus()
        });
        
      case 'check':
        await taskScheduler.runImmediateCheck();
        return NextResponse.json({
          success: true,
          message: 'Immediate task check completed'
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: start, stop, or check'
        }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to control scheduler',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
