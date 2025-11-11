import type { Task } from '@/lib/types';
import nodemailer from 'nodemailer';

/**
 * Simple notification system that sends emails directly
 * This bypasses Firestore permission issues for server-side operations
 */

/**
 * Send a task notification email directly
 */
export async function sendTaskNotificationEmail(
  userEmail: string,
  userName: string,
  task: Task,
  notificationType: 'due_soon' | 'overdue' | 'due_today'
): Promise<void> {
  try {
    console.log(`📧 Sending ${notificationType} notification to ${userEmail} for task: ${task.text}`);

    let subject: string;
    let urgencyColor: string;
    let urgencyText: string;

    switch (notificationType) {
      case 'overdue':
        subject = `🚨 Overdue Task: ${task.text}`;
        urgencyColor = '#ef4444'; // red
        urgencyText = 'Overdue';
        break;
      case 'due_today':
        subject = `⏰ Task Due Today: ${task.text}`;
        urgencyColor = '#f59e0b'; // amber
        urgencyText = 'Due Today';
        break;
      case 'due_soon':
        subject = `📅 Task Due Soon: ${task.text}`;
        urgencyColor = '#3b82f6'; // blue
        urgencyText = 'Due Soon';
        break;
      default:
        subject = `🔔 Task Notification: ${task.text}`;
        urgencyColor = '#3b82f6';
        urgencyText = 'Notification';
    }

    const formattedDueDate = task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, ${urgencyColor}, ${urgencyColor}dd); color: white; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 24px; }
        .task-card { background: #f8fafc; border-left: 4px solid ${urgencyColor}; padding: 16px; border-radius: 8px; margin: 16px 0; }
        .task-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #1f2937; }
        .task-details { color: #6b7280; font-size: 14px; margin-bottom: 4px; }
        .actions { margin-top: 24px; text-align: center; }
        .btn { display: inline-block; padding: 12px 24px; margin: 0 8px; text-decoration: none; border-radius: 8px; font-weight: 500; transition: all 0.2s; }
        .btn-primary { background: #3b82f6; color: white; }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }
        .footer { background: #f8fafc; padding: 16px; text-align: center; color: #6b7280; font-size: 12px; }
        .urgency-badge { display: inline-block; background: ${urgencyColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${subject}</h1>
          <div class="urgency-badge">${urgencyText}</div>
        </div>
        
        <div class="content">
          <p>Hello ${userName}!</p>
          
          <div class="task-card">
            <div class="task-title">${task.text}</div>
            <div class="task-details">📅 Due: ${formattedDueDate}</div>
            ${task.description ? `<div class="task-details">📝 ${task.description}</div>` : ''}
          </div>
          
          <div class="actions">
            <a href="${baseUrl}/tasks" class="btn btn-primary">📋 View All Tasks</a>
          </div>
        </div>
        
        <div class="footer">
          <p>This email was sent by Lunchbox AI. <a href="${baseUrl}/settings">Manage notifications</a></p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    ${subject}

    Hello ${userName}!

    Task: ${task.text}
    Due: ${formattedDueDate}
    ${task.description ? `Description: ${task.description}` : ''}

    View all tasks: ${baseUrl}/tasks

    This email was sent by Lunchbox AI.
    `;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: `"Lunchbox AI" <${process.env.GMAIL_USER}>`,
      to: userEmail,
      subject: subject,
      html: html,
      text: text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent with ID: ${result.messageId}`);

  } catch (error) {
    console.error(`❌ Error sending notification email to ${userEmail}:`, error);
    throw error;
  }
}

/**
 * Check if a task is due or overdue and send notification
 */
export async function checkAndNotifyTask(task: Task, userEmail: string, userName: string): Promise<void> {
  if (!task.dueDate) {
    return; // No due date, skip
  }

  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const timeDiff = dueDate.getTime() - now.getTime();
  const minutesDiff = Math.floor(timeDiff / (1000 * 60));

  console.log(`🔍 Checking task "${task.text}": ${minutesDiff} minutes until due`);

  // Send notification if task is overdue (more than 1 minute past due)
  if (minutesDiff < -1) {
    console.log(`🚨 Task "${task.text}" is overdue, sending notification`);
    await sendTaskNotificationEmail(userEmail, userName, task, 'overdue');
  }
  // Send notification if task is due within 1 minute
  else if (minutesDiff >= -1 && minutesDiff <= 1) {
    console.log(`⏰ Task "${task.text}" is due now, sending notification`);
    await sendTaskNotificationEmail(userEmail, userName, task, 'due_today');
  }
}
