import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/notifications/email-service';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task } from '@/lib/types';
import { getUserNotificationPreference } from '@/lib/notifications/notification-settings';

interface SendNotificationRequest {
  userId: string;
  userEmail: string;
  type: 'task_reminder' | 'daily_summary' | 'overdue_alert';
  taskId?: string;
}

/**
 * POST /api/notifications/send
 * Send notification to user's email
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, type, taskId }: SendNotificationRequest = await request.json();

    if (!userId || !userEmail) {
      return NextResponse.json({ 
        error: 'User ID and email are required' 
      }, { status: 400 });
    }

    // Check if user has notifications enabled
    const notificationsEnabled = await getUserNotificationPreference(userId);
    if (!notificationsEnabled) {
      console.log(`🔕 Notifications disabled for user ${userId}, skipping notification`);
      return NextResponse.json({ 
        message: 'Notifications disabled by user',
        skipped: true
      }, { status: 200 });
    }

    let success = false;

    switch (type) {
      case 'task_reminder':
        if (!taskId) {
          return NextResponse.json({ 
            error: 'Task ID is required for task reminders' 
          }, { status: 400 });
        }
        success = await sendTaskReminder(userId, userEmail, taskId);
        break;
        
      case 'daily_summary':
        success = await sendDailySummary(userId, userEmail);
        break;
        
      case 'overdue_alert':
        success = await sendOverdueAlert(userId, userEmail);
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
        userEmail
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to send notification' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Send task reminder email
 */
async function sendTaskReminder(userId: string, userEmail: string, taskId: string): Promise<boolean> {
  try {
    // Get task from Firestore
    const taskDoc = await getDoc(doc(db, 'tasks', taskId));
    if (!taskDoc.exists()) {
      console.error('Task not found:', taskId);
      return false;
    }

    const task = { id: taskId, ...taskDoc.data() } as Task;

    // Determine reminder type based on due date
    let reminderType: 'due_soon' | 'overdue' | 'daily_summary' = 'due_soon';
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      if (dueDate < now) {
        reminderType = 'overdue';
      }
    }

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

    // Send overdue alert for each task
    let allSent = true;
    for (const task of overdueTasks) {
      const sent = await emailService.sendTaskReminder({
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
