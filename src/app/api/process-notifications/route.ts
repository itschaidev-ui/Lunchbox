import { NextResponse } from 'next/server';
import { processDueNotifications, cleanupOldNotifications } from '@/lib/notifications/notification-scheduler';

/**
 * POST /api/process-notifications
 * Process all due notifications (called by cron job)
 */
export async function POST() {
  try {
    console.log('🔔 Processing due notifications...');
    
    // Process due notifications
    await processDueNotifications();
    
    // Clean up old notifications (run occasionally)
    const shouldCleanup = Math.random() < 0.1; // 10% chance to cleanup
    if (shouldCleanup) {
      await cleanupOldNotifications();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Due notifications processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing due notifications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process due notifications',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/process-notifications
 * Get status of notification processing
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Notification processing endpoint is active',
      endpoints: {
        process: 'POST /api/process-notifications',
        status: 'GET /api/process-notifications'
      },
      features: [
        'Process due notifications',
        'Clean up old notifications',
        'Scheduled notification system'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get notification status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
