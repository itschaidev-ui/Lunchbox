import nodemailer from 'nodemailer';
import { generateReplyInstructions } from './email-parser';

interface Reminder {
  taskId: string;
  userId: string;
  userEmail: string;
  userName: string;
  remindAtTime: string;
  message: string;
  sentStatus: boolean;
  createdAt: string;
  reminderType: string;
}

/**
 * Send reminder notification via email
 */
export async function sendReminderNotification(reminder: Reminder): Promise<void> {
  try {
    console.log(`📧 Sending reminder notification: ${reminder.message}`);
    
    const subject = `🔔 ${reminder.reminderType.toUpperCase()} Reminder: ${reminder.message}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    
    // Generate reply instructions
    const replyInstructions = generateReplyInstructions(reminder.taskId, reminder.message);
    
    // Create email content
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 20px; 
          background-color: #f8fafc; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
          overflow: hidden; 
        }
        .header { 
          background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
          color: white; 
          padding: 24px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 600; 
        }
        .content { 
          padding: 24px; 
        }
        .reminder-card { 
          background: #f8fafc; 
          border-left: 4px solid #3b82f6; 
          padding: 16px; 
          border-radius: 8px; 
          margin: 16px 0; 
        }
        .reminder-message { 
          font-size: 18px; 
          font-weight: 600; 
          margin-bottom: 8px; 
          color: #1f2937; 
        }
        .reminder-time { 
          color: #6b7280; 
          font-size: 14px; 
        }
        .actions { 
          margin-top: 24px; 
          text-align: center; 
        }
        .btn { 
          display: inline-block; 
          padding: 12px 24px; 
          margin: 0 8px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 500; 
          transition: all 0.2s; 
        }
        .btn-primary { 
          background: #3b82f6; 
          color: white; 
        }
        .btn:hover { 
          transform: translateY(-1px); 
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); 
        }
        .footer { 
          background: #f8fafc; 
          padding: 16px; 
          text-align: center; 
          color: #6b7280; 
          font-size: 12px; 
        }
        .urgency-badge { 
          display: inline-block; 
          background: #3b82f6; 
          color: white; 
          padding: 4px 12px; 
          border-radius: 20px; 
          font-size: 12px; 
          font-weight: 500; 
          margin-bottom: 16px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${subject}</h1>
          <div class="urgency-badge">${reminder.reminderType.toUpperCase()}</div>
        </div>
        
        <div class="content">
          <p>Hello ${reminder.userName}!</p>
          
          <div class="reminder-card">
            <div class="reminder-message">${reminder.message}</div>
            <div class="reminder-time">⏰ Reminder time: ${new Date(reminder.remindAtTime).toLocaleString()}</div>
          </div>
          
          <div class="actions">
            <a href="${baseUrl}/tasks" class="btn btn-primary">📋 View All Tasks</a>
          </div>
        </div>
        
            <div class="footer">
              <p>This reminder was sent by Lunchbox AI. <a href="${baseUrl}/settings">Manage notifications</a></p>
              <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 12px;">
                <strong>Reply to this email with:</strong><br/>
                ✅ YES - Mark as in progress<br/>
                ❌ NO - Not ready yet<br/>
                ✅ COMPLETED - Mark as done<br/>
                📅 RESCHEDULE [TIME] - Move to different time<br/><br/>
                <em>Examples: "YES", "COMPLETED", "RESCHEDULE 4pm"</em>
              </div>
            </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    ${subject}

    Hello ${reminder.userName}!

    ${reminder.message}
    
    Reminder time: ${new Date(reminder.remindAtTime).toLocaleString()}

    View all tasks: ${baseUrl}/tasks

    This reminder was sent by Lunchbox AI.
    `;

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: `"Lunchbox AI" <${process.env.GMAIL_USER}>`,
      to: reminder.userEmail,
      subject: subject,
      html: html,
      text: text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 Reminder email sent with ID: ${result.messageId}`);

  } catch (error) {
    console.error(`❌ Error sending reminder notification:`, error);
    throw error;
  }
}

/**
 * Send push notification (future implementation)
 */
export async function sendPushNotification(reminder: Reminder): Promise<void> {
  // TODO: Implement push notifications using Firebase Cloud Messaging
  console.log(`📱 Push notification (not implemented): ${reminder.message}`);
}

/**
 * Send in-app notification (future implementation)
 */
export async function sendInAppNotification(reminder: Reminder): Promise<void> {
  // TODO: Implement in-app notifications using WebSockets
  console.log(`🔔 In-app notification (not implemented): ${reminder.message}`);
}
