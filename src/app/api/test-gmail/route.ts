import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    const user = process.env.GMAIL_USER;
    const password = process.env.GMAIL_APP_PASSWORD;

    if (!user || !password) {
      return NextResponse.json({
        error: 'Gmail credentials not found',
        user: user ? 'Set' : 'Not set',
        password: password ? 'Set' : 'Not set'
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: password
      }
    });

    // Test connection
    try {
      await transporter.verify();
      return NextResponse.json({
        success: true,
        message: 'Gmail connection successful',
        user: user,
        passwordLength: password.length
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        user: user,
        passwordLength: password.length
      });
    }

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to test Gmail',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
