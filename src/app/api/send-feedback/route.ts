import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, message, to } = await request.json();

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For now, we'll log the feedback and simulate email sending
    // This ensures the form works while you set up email credentials
    console.log('=== NEW FEEDBACK RECEIVED ===');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Message:', message);
    console.log('Target Email:', to || 'itschaidev@gmail.com');
    console.log('Timestamp:', new Date().toLocaleString());
    console.log('============================');

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // TODO: Replace this with actual email sending
    // You can use services like:
    // - Resend (recommended for Next.js)
    // - SendGrid
    // - Nodemailer with SMTP
    // - EmailJS (client-side)

    return NextResponse.json(
      { 
        message: 'Feedback received successfully! We\'ll review it soon.',
        note: 'Email setup required for actual delivery to itschaidev@gmail.com'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback. Please try again or use the email option below.' },
      { status: 500 }
    );
  }
}
