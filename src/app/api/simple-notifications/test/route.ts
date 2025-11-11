import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/notifications/simple-email-service';

export async function POST(request: NextRequest) {
  try {
    const { email, subject, message } = await request.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: email'
      }, { status: 400 });
    }

    const testSubject = subject || 'Test Notification from Lunchbox AI';
    const testMessage = message || 'This is a test notification to verify the email system is working correctly.';

    console.log(`📧 Sending test email to: ${email}`);
    
    await sendTestEmail(email, testSubject, testMessage);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      email
    });

  } catch (error) {
    console.error('❌ Error sending test email:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
