import nodemailer from 'nodemailer';
import type { Task } from '@/lib/types';

interface EmailConfig {
  user: string;
  password: string;
  from: string;
}

interface TaskReminderEmail {
  to: string;
  task: Task;
  reminderType: 'due_soon' | 'overdue' | 'daily_summary';
  dueTime?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class GmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // For now, we'll use a generic Gmail service account
    // In production, you'd want to use OAuth2 or a service account
    const user = process.env.GMAIL_USER || 'lunchbox-ai@yourdomain.com';
    const password = process.env.GMAIL_APP_PASSWORD;

    if (!password) {
      console.warn('Gmail app password not configured. Email notifications will be disabled.');
      return;
    }

    this.config = {
      user,
      password,
      from: `"Lunchbox AI" <${user}>`
    };

    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: this.config.user,
        pass: this.config.password
      }
    });

    console.log('Gmail service initialized successfully');
  }

  /**
   * Send a task reminder email
   */
  async sendTaskReminder(emailData: TaskReminderEmail): Promise<boolean> {
    if (!this.transporter || !this.config) {
      console.error('Gmail service not initialized');
      return false;
    }

    try {
      const template = this.generateEmailTemplate(emailData);
      
      const mailOptions = {
        from: this.config.from,
        to: emailData.to,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Task reminder email sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending task reminder email:', error);
      return false;
    }
  }

  /**
   * Send a daily task summary email
   */
  async sendDailySummary(
    to: string,
    tasks: Task[],
    completedTasks: Task[]
  ): Promise<boolean> {
    if (!this.transporter || !this.config) {
      console.error('Gmail service not initialized');
      return false;
    }

    try {
      const template = this.generateDailySummaryTemplate(tasks, completedTasks);
      
      const mailOptions = {
        from: this.config.from,
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Daily summary email sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending daily summary email:', error);
      return false;
    }
  }

  /**
   * Generate email template for task reminders
   */
  private generateEmailTemplate(emailData: TaskReminderEmail): EmailTemplate {
    const { task, reminderType, dueTime } = emailData;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    
    let subject: string;
    let urgencyColor: string;
    let urgencyText: string;

    switch (reminderType) {
      case 'due_soon':
        subject = `⏰ Task Due Soon: ${task.text}`;
        urgencyColor = '#f59e0b'; // amber
        urgencyText = 'Due Soon';
        break;
      case 'overdue':
        subject = `🚨 Overdue Task: ${task.text}`;
        urgencyColor = '#ef4444'; // red
        urgencyText = 'Overdue';
        break;
      case 'daily_summary':
        subject = `📋 Daily Task Summary`;
        urgencyColor = '#3b82f6'; // blue
        urgencyText = 'Daily Summary';
        break;
      default:
        subject = `📝 Task Reminder: ${task.text}`;
        urgencyColor = '#6b7280'; // gray
        urgencyText = 'Reminder';
    }

    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date';
    const taskUrl = `${baseUrl}/tasks`;
    const markDoneUrl = `${baseUrl}/api/tasks/${task.id}/complete`;
    const snoozeUrl = `${baseUrl}/api/tasks/${task.id}/snooze`;

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
        .btn-secondary { background: #6b7280; color: white; }
        .btn-success { background: #10b981; color: white; }
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
          <div class="task-card">
            <div class="task-title">${task.text}</div>
            <div class="task-details">📅 Due: ${dueDate}</div>
            ${task.description ? `<div class="task-details">📝 ${task.description}</div>` : ''}
          </div>
          
          <div class="actions">
            <a href="${markDoneUrl}" class="btn btn-success">✅ Mark as Done</a>
            <a href="${snoozeUrl}" class="btn btn-secondary">⏰ Snooze 30min</a>
            <a href="${taskUrl}" class="btn btn-primary">📋 View All Tasks</a>
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

Task: ${task.text}
Due: ${dueDate}
${task.description ? `Description: ${task.description}` : ''}

Quick Actions:
- Mark as Done: ${markDoneUrl}
- Snooze 30 minutes: ${snoozeUrl}
- View all tasks: ${taskUrl}

This email was sent by Lunchbox AI.
    `;

    return { subject, html, text };
  }

  /**
   * Generate daily summary email template
   */
  private generateDailySummaryTemplate(tasks: Task[], completedTasks: Task[]): EmailTemplate {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    const today = new Date().toLocaleDateString();
    
    const pendingTasks = tasks.filter(task => !task.completed);
    const overdueTasks = pendingTasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < new Date();
    });
    
    const upcomingTasks = pendingTasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return dueDate <= tomorrow;
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Task Summary</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 24px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: #f8fafc; padding: 16px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: 600; color: #1f2937; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1f2937; }
        .task-list { list-style: none; padding: 0; margin: 0; }
        .task-item { background: #f8fafc; padding: 12px; margin-bottom: 8px; border-radius: 6px; border-left: 4px solid #3b82f6; }
        .task-item.overdue { border-left-color: #ef4444; }
        .task-item.upcoming { border-left-color: #f59e0b; }
        .task-text { font-weight: 500; margin-bottom: 4px; }
        .task-due { font-size: 12px; color: #6b7280; }
        .actions { text-align: center; margin-top: 24px; }
        .btn { display: inline-block; padding: 12px 24px; margin: 0 8px; text-decoration: none; border-radius: 8px; font-weight: 500; background: #3b82f6; color: white; }
        .footer { background: #f8fafc; padding: 16px; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Daily Task Summary</h1>
          <p>${today}</p>
        </div>
        
        <div class="content">
          <div class="stats">
            <div class="stat-card">
              <div class="stat-number">${completedTasks.length}</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${pendingTasks.length}</div>
              <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${overdueTasks.length}</div>
              <div class="stat-label">Overdue</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${upcomingTasks.length}</div>
              <div class="stat-label">Due Soon</div>
            </div>
          </div>
          
          ${overdueTasks.length > 0 ? `
          <div class="section">
            <div class="section-title">🚨 Overdue Tasks</div>
            <ul class="task-list">
              ${overdueTasks.map(task => `
                <li class="task-item overdue">
                  <div class="task-text">${task.text}</div>
                  <div class="task-due">Due: ${task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date'}</div>
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${upcomingTasks.length > 0 ? `
          <div class="section">
            <div class="section-title">⏰ Due Soon</div>
            <ul class="task-list">
              ${upcomingTasks.map(task => `
                <li class="task-item upcoming">
                  <div class="task-text">${task.text}</div>
                  <div class="task-due">Due: ${task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date'}</div>
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}
          
          <div class="actions">
            <a href="${baseUrl}/tasks" class="btn">📋 View All Tasks</a>
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
Daily Task Summary - ${today}

📊 Statistics:
- Completed: ${completedTasks.length}
- Pending: ${pendingTasks.length}
- Overdue: ${overdueTasks.length}
- Due Soon: ${upcomingTasks.length}

${overdueTasks.length > 0 ? `
🚨 Overdue Tasks:
${overdueTasks.map(task => `- ${task.text} (Due: ${task.dueDate || 'No due date'})`).join('\n')}
` : ''}

${upcomingTasks.length > 0 ? `
⏰ Due Soon:
${upcomingTasks.map(task => `- ${task.text} (Due: ${task.dueDate || 'No due date'})`).join('\n')}
` : ''}

View all tasks: ${baseUrl}/tasks

This email was sent by Lunchbox AI.
    `;

    return {
      subject: `📋 Daily Task Summary - ${today}`,
      html,
      text
    };
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('Gmail connection verified successfully');
      return true;
    } catch (error) {
      console.error('Gmail connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const gmailService = new GmailService();
export default gmailService;


