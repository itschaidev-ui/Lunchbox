import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    const user = process.env.GMAIL_USER;
    const password = process.env.GMAIL_APP_PASSWORD;

    if (!user || !password) {
      return NextResponse.json({ error: 'Gmail credentials not found' });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: password
      }
    });

    // Send test email
    const mailOptions = {
      from: `"Lunchbox AI" <${user}>`,
      to: 'mohammadomaradeel62@gmail.com',
      subject: '🎉 Test Email from Lunchbox AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4A90E2;">🎉 Gmail SMTP is Working!</h2>
          <p>Hello Mohammad Omar!</p>
          <p>This is a test email from your Lunchbox AI notification system.</p>
          <p><strong>Gmail SMTP Status:</strong> ✅ Working</p>
          <p><strong>From:</strong> ${user}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This email was sent by your Lunchbox AI notification system.
          </p>
        </div>
      `,
      text: `
        🎉 Gmail SMTP is Working!
        
        Hello Mohammad Omar!
        
        This is a test email from your Lunchbox AI notification system.
        
        Gmail SMTP Status: ✅ Working
        From: ${user}
        Time: ${new Date().toLocaleString()}
        
        This email was sent by your Lunchbox AI notification system.
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
      to: 'mohammadomaradeel62@gmail.com'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
