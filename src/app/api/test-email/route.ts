import { NextRequest, NextResponse } from 'next/server';
import { sendReminderNotification } from '@/lib/notification-sender';

/**
 * POST /api/test-email
 * Test email sending functionality
 */
export async function POST() {
  try {
    console.log('📧 Testing email sending...');
    
    // Create a test reminder
    const testReminder = {
      id: 'test-email-123',
      taskId: 'test-task-123',
      userId: 'test-user',
      userEmail: 'itschaidev@gmail.com',
      userName: 'Test User',
      remindAtTime: new Date().toISOString(),
      message: '🧪 Test Email Notification',
      sentStatus: false,
      createdAt: new Date().toISOString(),
      reminderType: 'overdue' as const
    };
    
    // Send the test email
    await sendReminderNotification(testReminder);
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error sending test email:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
