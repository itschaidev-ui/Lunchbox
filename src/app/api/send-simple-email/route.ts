import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json();
    
    // Create transporter with your credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'lunchboxai.official@gmail.com',
        pass: 'weinnvogeunvlmscxd' // Your app password
      }
    });
    
    const mailOptions = {
      from: 'lunchboxai.official@gmail.com',
      to,
      subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Lunchbox AI</h1>
          </div>
          <div style="padding: 20px;">
            <h2>${subject}</h2>
            <p>${message}</p>
            <p>This is a test email from your notification system!</p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId
    });
    
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
