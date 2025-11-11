import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/notifications/email-service';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task } from '@/lib/types';

interface EmailNotificationRequest {
  type: 'task_reminder' | 'daily_summary' | 'overdue_alert';
  userId: string;
  userEmail: string;
  taskId?: string;
  reminderType?: 'due_soon' | 'overdue' | 'daily_summary';
}

/**
 * POST /api/notifications/email
 * Send email notifications for tasks
 */
export async function POST(request: NextRequest) {
  try {
    const body: EmailNotificationRequest = await request.json();
    const { type, userId, userEmail, taskId, reminderType } = body;

    // Validate required fields
    if (!type || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: type, userId, userEmail' },
        { status: 400 }
      );
    }

    let success = false;

    switch (type) {
      case 'task_reminder':
        if (!taskId || !reminderType) {
          return NextResponse.json(
            { error: 'Missing required fields for task reminder: taskId, reminderType' },
            { status: 400 }
          );
        }
        success = await sendTaskReminder(userId, userEmail, taskId, reminderType);
        break;

      case 'daily_summary':
        success = await sendDailySummary(userId, userEmail);
        break;

      case 'overdue_alert':
        success = await sendOverdueAlert(userId, userEmail);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `${type} email sent successfully` 
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email notification' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in email notification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Send a task reminder email
 */
async function sendTaskReminder(
  userId: string,
  userEmail: string,
  taskId: string,
  reminderType: 'due_soon' | 'overdue' | 'daily_summary'
): Promise<boolean> {
  try {
    // Get task details from Firestore
    const taskDoc = await getDoc(doc(db, 'tasks', taskId));
    if (!taskDoc.exists()) {
      console.error('Task not found:', taskId);
      return false;
    }

    const task = { id: taskId, ...taskDoc.data() } as Task;

    // Send email using email service
    return await emailService.sendTaskReminder({
      to: userEmail,
      task,
      reminderType,
      dueTime: task.dueDate
    });

  } catch (error) {
    console.error('Error sending task reminder:', error);
    return false;
  }
}

/**
 * Send daily summary email
 */
async function sendDailySummary(userId: string, userEmail: string): Promise<boolean> {
  try {
    // Get user's tasks from Firestore
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
    const pendingTasks = tasks.filter(task => !task.completed);

    // Send daily summary email
    return await emailService.sendDailySummary(userEmail, pendingTasks, completedTasks);

  } catch (error) {
    console.error('Error sending daily summary:', error);
    return false;
  }
}

/**
 * Send overdue tasks alert
 */
async function sendOverdueAlert(userId: string, userEmail: string): Promise<boolean> {
  try {
    // Get overdue tasks
    const now = new Date();
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', userId),
      where('completed', '==', false)
    );
    
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Task[];

    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < now;
    });

    if (overdueTasks.length === 0) {
      console.log('No overdue tasks found');
      return true; // Not an error, just no overdue tasks
    }

    // Send email for each overdue task
    let allSent = true;
    for (const task of overdueTasks) {
      const sent = await gmailService.sendTaskReminder({
        to: userEmail,
        task,
        reminderType: 'overdue',
        dueTime: task.dueDate
      });
      if (!sent) allSent = false;
    }

    return allSent;

  } catch (error) {
    console.error('Error sending overdue alert:', error);
    return false;
  }
}

/**
 * GET /api/notifications/email
 * Test email configuration
 */
export async function GET() {
  try {
    const isConfigured = await emailService.testConnection();
    
    return NextResponse.json({
      configured: isConfigured,
      message: isConfigured 
        ? 'Email service is properly configured' 
        : 'Email service is not configured or has connection issues'
    });

  } catch (error) {
    console.error('Error testing email configuration:', error);
    return NextResponse.json(
      { 
        configured: false, 
        error: 'Failed to test email configuration' 
      },
      { status: 500 }
    );
  }
}


