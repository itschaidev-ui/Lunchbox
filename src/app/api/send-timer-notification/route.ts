import { NextRequest, NextResponse } from 'next/server';
import { sendReminderNotification } from '@/lib/notification-sender';

/**
 * POST /api/send-timer-notification
 * Send a timer completion notification
 */
export async function POST(request: NextRequest) {
  try {
    const reminderData = await request.json();

    if (!reminderData.userEmail || !reminderData.message) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userEmail, message'
      }, { status: 400 });
    }

    console.log(`🔔 Sending timer notification: ${reminderData.message}`);

    // Send the timer notification
    await sendReminderNotification(reminderData);

    return NextResponse.json({
      success: true,
      message: 'Timer notification sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error sending timer notification:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send timer notification',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
