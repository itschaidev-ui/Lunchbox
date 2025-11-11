import { NextRequest, NextResponse } from 'next/server';
import { webhookNotificationService } from '@/lib/notifications/webhook-service';
import { emailService } from '@/lib/notifications/email-service';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task } from '@/lib/types';

interface UserNotificationRequest {
  userId: string;
  userEmail: string;
  userName?: string;
  type: 'task_reminder' | 'daily_summary' | 'overdue_alert';
  taskId?: string;
}

/**
 * POST /api/notifications/user
 * Send notification to user using their email from Google sign-in
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, userName, type, taskId }: UserNotificationRequest = await request.json();

    if (!userId || !userEmail) {
      return NextResponse.json({ 
        error: 'User ID and email are required' 
      }, { status: 400 });
    }

    let success = false;
    let notificationData: any = {
      userId,
      userEmail,
      userName,
      type
    };

    switch (type) {
      case 'task_reminder':
        if (!taskId) {
          return NextResponse.json({ 
            error: 'Task ID is required for task reminders' 
          }, { status: 400 });
        }
        
        // Get task details
        const task = await getTaskById(taskId);
        if (!task) {
          return NextResponse.json({ 
            error: 'Task not found' 
          }, { status: 404 });
        }
        
        notificationData.task = task;
        success = await webhookNotificationService.sendNotification(notificationData);
        break;
        
      case 'daily_summary':
        // For testing, use mock data instead of Firebase
        const mockTasks: Task[] = [];
        const mockCompletedTasks: Task[] = [];
        notificationData.tasks = mockTasks;
        notificationData.completedTasks = mockCompletedTasks;
        
        // Send email using direct Gmail SMTP
        try {
          const nodemailer = require('nodemailer');
          
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASSWORD
            }
          });

          const subject = `📧 Test Notification from Lunchbox AI`;
          const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test Notification</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8fafc; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
              .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 24px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { padding: 24px; }
              .success { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 16px 0; }
              .footer { background: #f8fafc; padding: 16px; text-align: center; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Test Notification Working!</h1>
              </div>
              
              <div class="content">
                <p>Hello ${userName}!</p>
                
                <div class="success">
                  <h3>✅ Gmail SMTP is Working!</h3>
                  <p>This is a test email from your Lunchbox AI notification system.</p>
                  <p><strong>From:</strong> ${process.env.GMAIL_USER}</p>
                  <p><strong>To:</strong> ${userEmail}</p>
                  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <p>Your notification system is now fully functional!</p>
              </div>
              
              <div class="footer">
                <p>This email was sent by Lunchbox AI. <a href="http://localhost:9002/tasks">View Tasks</a></p>
              </div>
            </div>
          </body>
          </html>
          `;

          const text = `
          🎉 Test Notification Working!
          
          Hello ${userName}!
          
          ✅ Gmail SMTP is Working!
          This is a test email from your Lunchbox AI notification system.
          
          From: ${process.env.GMAIL_USER}
          To: ${userEmail}
          Time: ${new Date().toLocaleString()}
          
          Your notification system is now fully functional!
          
          This email was sent by Lunchbox AI.
          `;

          const mailOptions = {
            from: `"Lunchbox AI" <${process.env.GMAIL_USER}>`,
            to: userEmail,
            subject: subject,
            html: html,
            text: text
          };

          const result = await transporter.sendMail(mailOptions);
          console.log(`📧 Test notification sent with ID: ${result.messageId}`);
          success = true;
        } catch (error) {
          console.error('Gmail failed, using webhook:', error);
          success = await webhookNotificationService.sendNotification(notificationData);
        }
        break;
        
      case 'overdue_alert':
        // For testing, use mock data instead of Firebase
        const mockOverdueTasks: Task[] = [];
        notificationData.tasks = mockOverdueTasks;
        success = await webhookNotificationService.sendNotification(notificationData);
        break;
        
      default:
        return NextResponse.json({ 
          error: 'Invalid notification type' 
        }, { status: 400 });
    }

    if (success) {
      return NextResponse.json({ 
        message: 'Notification sent successfully',
        type,
        userEmail,
        userName
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to send notification' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending user notification:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * GET /api/notifications/user
 * Test notification service
 */
export async function GET() {
  try {
    const isWorking = await webhookNotificationService.testConnection();
    
    return NextResponse.json({
      working: isWorking,
      message: isWorking 
        ? 'Notification service is working' 
        : 'Notification service is not working',
      mode: process.env.WEBHOOK_URL ? 'webhook' : 'log-only'
    });

  } catch (error) {
    console.error('Error testing notification service:', error);
    return NextResponse.json({ 
      error: 'Failed to test notification service',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Get task by ID
 */
async function getTaskById(taskId: string): Promise<Task | null> {
  try {
    const taskDoc = await getDocs(query(collection(db, 'tasks'), where('__name__', '==', taskId)));
    if (taskDoc.empty) return null;
    
    const taskData = taskDoc.docs[0].data();
    return { id: taskId, ...taskData } as Task;
  } catch (error) {
    console.error('Error getting task:', error);
    return null;
  }
}

/**
 * Get user's tasks
 */
async function getUserTasks(userId: string): Promise<{ tasks: Task[]; completedTasks: Task[] }> {
  try {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', userId)
    );
    
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Task[];

    const completedTasks = tasks.filter(task => task.completed);
    
    return { tasks, completedTasks };
  } catch (error) {
    console.error('Error getting user tasks:', error);
    return { tasks: [], completedTasks: [] };
  }
}
