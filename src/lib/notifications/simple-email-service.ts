import nodemailer from 'nodemailer';
import type { SimpleNotification } from './simple-scheduler';

// Check if email credentials are configured
const isEmailConfigured = (): boolean => {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
};

// Create transporter only if credentials are available
let transporter: any = null;
if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

/**
 * Send a simple notification email
 */
export async function sendSimpleNotification(notification: SimpleNotification): Promise<void> {
  // Skip if email is not configured
  if (!isEmailConfigured()) {
    console.log(`⏭️ Email not configured - skipping notification for task: "${notification.taskTitle}"`);
    return;
  }

  try {
    console.log(`📧 Sending ${notification.notificationType} notification to ${notification.userName} (${notification.userEmail}) for task: "${notification.taskTitle}"`);
    
    const { taskTitle, userEmail, userName, notificationType, dueDate } = notification;
    const dueDateFormatted = new Date(dueDate).toLocaleString();
    
    let subject: string;
    let message: string;
    
    if (notificationType === 'reminder') {
      subject = `⏰ Reminder: ${taskTitle} is due soon`;
      message = `Hello ${userName},\n\nYour task "${taskTitle}" is due at ${dueDateFormatted}.\n\nThis is a friendly reminder to help you stay on track!\n\nBest regards,\nLunchbox AI`;
    } else {
      subject = `🚨 Overdue: ${taskTitle} needs attention`;
      message = `Hello ${userName},\n\nYour task "${taskTitle}" was due at ${dueDateFormatted} and is now overdue.\n\nPlease complete this task as soon as possible.\n\nBest regards,\nLunchbox AI`;
    }
    
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: userEmail,
      subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Lunchbox AI</h1>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #333;">${subject}</h2>
            <p>Hello ${userName},</p>
            <p>Your task "<strong>${taskTitle}</strong>" ${notificationType === 'reminder' ? 'is due at' : 'was due at'} <strong>${dueDateFormatted}</strong>.</p>
            <p>${notificationType === 'reminder' ? 'This is a friendly reminder to help you stay on track!' : 'Please complete this task as soon as possible.'}</p>
            <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/tasks" style="color: #667eea; text-decoration: none;">View your tasks</a> | 
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/settings" style="color: #667eea; text-decoration: none;">Manage notifications</a>
              </p>
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px;">
            <p>This notification was sent by Lunchbox AI</p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${result.messageId}`);
    
  } catch (error: any) {
    // Handle authentication errors gracefully
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.log(`⚠️ Email authentication failed - please check GMAIL_USER and GMAIL_APP_PASSWORD in .env`);
      console.log(`⏭️ Skipping email notification for task: "${notification.taskTitle}"`);
      return; // Don't throw, just skip silently
    }
    
    console.error('❌ Failed to send notification email:', error);
    throw error;
  }
}

/**
 * Test email sending
 */
export async function sendTestEmail(to: string, subject: string, message: string): Promise<void> {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Lunchbox AI - Test</h1>
          </div>
          <div style="padding: 20px;">
            <h2>${subject}</h2>
            <p>${message}</p>
            <p>If you received this email, the notification system is working correctly!</p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Test email sent successfully: ${result.messageId}`);
    
  } catch (error: any) {
    // Handle authentication errors gracefully
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.log(`⚠️ Email authentication failed - please check GMAIL_USER and GMAIL_APP_PASSWORD in .env`);
      return; // Don't throw, just skip silently
    }
    
    console.error('❌ Failed to send test email:', error);
    throw error;
  }
}
