import { NextRequest, NextResponse } from 'next/server';
import { simpleScheduler } from '@/lib/scheduler/simple-scheduler';
// Import auto-start to ensure scheduler starts
import '@/lib/scheduler/auto-start';

export async function GET(request: NextRequest) {
  try {
    const status = simpleScheduler.getStatus();
    
    return NextResponse.json({
      success: true,
      scheduler: status,
      features: [
        'Simple notification system',
        'Reminder notifications (1 hour before due)',
        'Overdue notifications (1 hour after due)',
        'Reliable email delivery',
        'Clean notification management'
      ],
      endpoints: {
        start: 'POST /api/simple-scheduler/start',
        stop: 'POST /api/simple-scheduler/stop',
        check: 'POST /api/simple-scheduler/check',
        status: 'GET /api/simple-scheduler'
      }
    });
  } catch (error) {
    console.error('❌ Error getting simple scheduler status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get scheduler status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        simpleScheduler.start();
        return NextResponse.json({
          success: true,
          message: 'Simple scheduler started successfully'
        });

      case 'stop':
        simpleScheduler.stop();
        return NextResponse.json({
          success: true,
          message: 'Simple scheduler stopped successfully'
        });

      case 'check':
        await simpleScheduler.runImmediateCheck();
        return NextResponse.json({
          success: true,
          message: 'Immediate simple notification check completed'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: start, stop, or check'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Error in simple scheduler action:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute scheduler action',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
