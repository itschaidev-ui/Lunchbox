import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    
    return NextResponse.json({
      success: true,
      credentials: {
        user: gmailUser ? `${gmailUser.substring(0, 3)}***@gmail.com` : 'Not set',
        password: gmailPass ? `${gmailPass.substring(0, 4)}***` : 'Not set',
        userLength: gmailUser?.length || 0,
        passLength: gmailPass?.length || 0
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check credentials',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
