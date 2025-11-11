import { emailService } from './email-service';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task } from '@/lib/types';

interface TaskNotification {
  userId: string;
  userEmail: string;
  userName?: string;
  task: Task;
  notificationType: '10min_before' | '5min_before' | '1min_before' | 'overdue_5min' | 'overdue_10min' | 'overdue_15min' | 'overdue_30min' | 'overdue_1hour';
}

/**
 * Check for due tasks and send notifications
 */
export async function checkAndNotifyDueTasks(): Promise<void> {
  console.log('🔕 Overdue notification system disabled - no notifications will be sent');
  return; // DISABLED - No overdue notifications
  
  try {
    console.log('🔔 Checking for due tasks...');
    
    let tasks: Task[] = [];
    
    try {
      // Get all incomplete tasks from Firestore
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('completed', '==', false)
      );
      
      const tasksSnapshot = await getDocs(tasksQuery);
      tasks = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      
      console.log(`📋 Found ${tasks.length} incomplete tasks from Firestore`);
      
    } catch (firestoreError) {
      console.error('❌ Firestore connection failed:', firestoreError);
      console.log('🔄 Attempting fallback method...');
      
      // Fallback: Use a mock task for testing
      const mockOverdueTask: Task = {
        id: 'mock-overdue-task',
        userId: 'itschaidev@gmail.com', // Use your email as user ID
        text: 'Add Stats',
        completed: false,
        dueDate: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
      };
      
      tasks = [mockOverdueTask];
      console.log('📋 Using mock overdue task for testing');
    }

    if (tasks.length === 0) {
      console.log('📭 No incomplete tasks found');
      return;
    }

    console.log(`📋 Processing ${tasks.length} incomplete tasks`);
    
    // Log all tasks with their due dates and filter out completed tasks
    const incompleteTasks = tasks.filter(task => {
      if (task.completed) {
        console.log(`⏭️ Skipping completed task: "${task.text}"`);
        return false;
      }
      return true;
    });
    
    console.log(`📋 Processing ${incompleteTasks.length} incomplete tasks (filtered from ${tasks.length} total)`);
    
    incompleteTasks.forEach(task => {
      console.log(`📝 Task: "${task.text}" - Due: ${task.dueDate || 'No due date'} - User: ${task.userId}`);
    });

    // Group tasks by user
    const userTasks = new Map<string, Task[]>();
    for (const task of incompleteTasks) {
      const userId = task.userId || 'unknown';
      if (!userTasks.has(userId)) {
        userTasks.set(userId, []);
      }
      userTasks.get(userId)!.push(task);
    }

    // Check each user's tasks
    for (const [userId, userTaskList] of userTasks) {
      // Only process tasks with valid email addresses
      const validEmailTasks = userTaskList.filter(task => {
        const email = task.userEmail || '';
        return email.includes('@') && !email.includes('discord.local') && !email.includes('@discord');
      });
      
      if (validEmailTasks.length > 0) {
        console.log(`📧 Processing ${validEmailTasks.length} tasks for user ${userId} with valid email`);
        await checkUserTasks(userId, validEmailTasks);
      } else {
        console.log(`⏭️ Skipping user ${userId} - no valid email addresses`);
      }
    }

    console.log('✅ Due task check completed');

  } catch (error) {
    console.error('❌ Error checking due tasks:', error);
  }
}

/**
 * Check a specific user's tasks for due dates
 */
async function checkUserTasks(userId: string, tasks: Task[]): Promise<void> {
  try {
    let userEmail: string;
    let userName: string;
    
    try {
      // Get user info from Firestore
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        console.log(`👤 User ${userId} not found in Firestore, using fallback`);
        throw new Error('User not found in Firestore');
      }

      const userData = userDoc.data();
      userEmail = userData.email;
      userName = userData.displayName || userData.name || 'User';

      if (!userEmail) {
        console.log(`📧 No email found for user ${userId}, using fallback`);
        throw new Error('No email found for user');
      }
      
    } catch (firestoreError) {
      console.error('❌ Failed to get user data from Firestore:', firestoreError);
      console.log('🔄 Using fallback user data...');
      
      // Fallback: Use the userId as email if it looks like an email
      if (userId.includes('@')) {
        userEmail = userId;
        userName = userId.split('@')[0];
      } else {
        userEmail = 'itschaidev@gmail.com'; // Default fallback
        userName = 'Chai Dev';
      }
    }

    console.log(`👤 Checking tasks for ${userName} (${userEmail})`);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check each task
    for (const task of tasks) {
      if (!task.dueDate) {
        console.log(`⏭️ Skipping task "${task.text}" - no due date`);
        continue;
      }

      const dueDate = new Date(task.dueDate);
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const now = new Date();
      
      console.log(`🔍 Checking task "${task.text}":`);
      console.log(`   Due: ${dueDate.toLocaleString()}`);
      console.log(`   Today: ${today.toLocaleString()}`);
      console.log(`   Is overdue: ${dueDateOnly < today}`);
      console.log(`   Is due today: ${dueDateOnly.getTime() === today.getTime()}`);
      console.log(`   Is due tomorrow: ${dueDateOnly.getTime() === tomorrow.getTime()}`);

      let notificationType: '10min_before' | '5min_before' | '1min_before' | 'overdue_5min' | 'overdue_10min' | 'overdue_15min' | 'overdue_30min' | 'overdue_1hour' | null = null;

      // Check if task is overdue
      if (dueDateOnly < today) {
        notificationType = 'overdue_5min';
        console.log(`🚨 Task "${task.text}" is OVERDUE!`);
      }
      // Check if task is due today
      else if (dueDateOnly.getTime() === today.getTime()) {
        notificationType = '1min_before';
        console.log(`⏰ Task "${task.text}" is due TODAY!`);
      }
      // Check if task is due tomorrow (due soon) - map to 10min_before for now
      else if (dueDateOnly.getTime() === tomorrow.getTime()) {
        notificationType = '10min_before';
        console.log(`📅 Task "${task.text}" is due TOMORROW!`);
      }

      if (notificationType) {
        console.log(`📧 Sending ${notificationType} notification for task "${task.text}"`);
        await sendTaskNotification({
          userId: userId || 'unknown',
          userEmail: userEmail || 'unknown@example.com',
          userName: userName || 'User',
          task,
          notificationType
        });
      } else {
        console.log(`✅ Task "${task.text}" is not due for notification`);
      }
    }

  } catch (error) {
    console.error(`❌ Error checking tasks for user ${userId}:`, error);
  }
}

/**
 * Send a task notification email
 */
async function sendTaskNotification(notification: TaskNotification): Promise<void> {
  try {
    const { userEmail, userName, task, notificationType } = notification;
    
    console.log(`📧 Sending ${notificationType} notification to ${userEmail} for task: ${task.text}`);

    // Create email content based on notification type
    let subject: string;
    let urgencyColor: string;
    let urgencyText: string;

    switch (notificationType) {
      case '10min_before':
        subject = `⏰ Task due in 10 minutes: ${task.text}`;
        urgencyColor = '#3b82f6'; // blue
        urgencyText = 'Due in 10 minutes';
        break;
      case '5min_before':
        subject = `⏰ Task due in 5 minutes: ${task.text}`;
        urgencyColor = '#f59e0b'; // amber
        urgencyText = 'Due in 5 minutes';
        break;
      case '1min_before':
        subject = `⏰ Task due in 1 minute: ${task.text}`;
        urgencyColor = '#ef4444'; // red
        urgencyText = 'Due in 1 minute';
        break;
      case 'overdue_5min':
        subject = `🚨 Are you completing task? You are 5 minutes overdue: ${task.text}`;
        urgencyColor = '#ef4444'; // red
        urgencyText = '5 minutes overdue';
        break;
      case 'overdue_10min':
        subject = `🚨 Are you completing task? You are 10 minutes overdue: ${task.text}`;
        urgencyColor = '#ef4444'; // red
        urgencyText = '10 minutes overdue';
        break;
      case 'overdue_15min':
        subject = `🚨 Are you completing task? You are 15 minutes overdue: ${task.text}`;
        urgencyColor = '#ef4444'; // red
        urgencyText = '15 minutes overdue';
        break;
      case 'overdue_30min':
        subject = `🚨 Are you completing task? You are 30 minutes overdue: ${task.text}`;
        urgencyColor = '#ef4444'; // red
        urgencyText = '30 minutes overdue';
        break;
      case 'overdue_1hour':
        subject = `🚨 Are you completing task? You are 1 hour overdue: ${task.text}`;
        urgencyColor = '#ef4444'; // red
        urgencyText = '1 hour overdue';
        break;
      default:
        subject = `🔔 Task Notification: ${task.text}`;
        urgencyColor = '#3b82f6';
        urgencyText = 'Notification';
    }

    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date';
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
            <div class="task-details">📅 Due: ${dueDate}</div>
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
Due: ${dueDate}
${task.description ? `Description: ${task.description}` : ''}

View all tasks: ${baseUrl}/tasks

This email was sent by Lunchbox AI.
    `;

    // Send email using direct Gmail SMTP
    const nodemailer = require('nodemailer');
    
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

    console.log(`✅ ${notificationType} notification sent to ${userEmail}`);

  } catch (error) {
    console.error(`❌ Error sending notification to ${notification.userEmail}:`, error);
  }
}

/**
 * Send notification when a task is created or updated
 */
export async function notifyTaskUpdate(
  userId: string, 
  userEmail: string, 
  userName: string, 
  task: Task, 
  action: 'created' | 'updated' | 'completed'
): Promise<void> {
  try {
    console.log(`📧 Sending task ${action} notification to ${userEmail}`);

    let subject: string;
    let message: string;

    switch (action) {
      case 'created':
        subject = `✅ New Task Created: ${task.text}`;
        message = `Great! You've created a new task.`;
        break;
      case 'updated':
        subject = `📝 Task Updated: ${task.text}`;
        message = `Your task has been updated.`;
        break;
      case 'completed':
        subject = `🎉 Task Completed: ${task.text}`;
        message = `Congratulations! You've completed a task.`;
        break;
    }

    // For now, we'll just log it. In a real app, you might want to send different types of notifications
    console.log(`📧 ${subject} - ${message} (${userEmail})`);

  } catch (error) {
    console.error(`❌ Error sending task update notification:`, error);
  }
}
