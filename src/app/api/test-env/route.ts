import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    return NextResponse.json({
      gmailUser: gmailUser ? 'Set' : 'Not set',
      gmailPassword: gmailPassword ? 'Set' : 'Not set',
      emailUser: emailUser ? 'Set' : 'Not set',
      emailPassword: emailPassword ? 'Set' : 'Not set',
      gmailUserValue: gmailUser,
      gmailPasswordLength: gmailPassword ? gmailPassword.length : 0,
      allEnvVars: Object.keys(process.env).filter(key => key.includes('GMAIL') || key.includes('EMAIL'))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check environment variables' });
  }
}
