import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
// Note: sendTaskNotification is not exported from task-notifications
// We'll use the notification-sender instead
import { sendReminderNotification } from '../notification-sender';
import type { Task } from '@/lib/types';

interface OverdueNotification {
  taskId: string;
  userId: string;
  userEmail: string;
  userName: string;
  minutesOverdue: number;
  lastSentAt: string;
}

/**
 * Check overdue tasks every 5 minutes and send notifications
 */
export async function checkOverdueTasks(): Promise<void> {
  console.log('🔕 Overdue notification system disabled - no notifications will be sent');
  return; // DISABLED - No overdue notifications
  
  try {
    console.log('🔍 Checking for overdue tasks...');
    
    const now = new Date();
    const nowISO = now.toISOString();
    
    // Get all tasks that are overdue and not completed
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('dueDate', '<', nowISO),
      where('completed', '==', false)
    );
    
    const tasksSnapshot = await getDocs(tasksQuery);
    const overdueTasks: Task[] = [];
    
    tasksSnapshot.forEach((doc) => {
      const taskData = doc.data();
      const task: Task = {
        id: doc.id,
        ...taskData
      } as Task;
      
      // Double-check that task is not completed
      if (task.completed) {
        console.log(`⏭️ Skipping completed task: "${task.text}"`);
        return;
      }
      
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const minutesOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60));
        
        if (minutesOverdue > 0) {
          overdueTasks.push(task);
          console.log(`🚨 Found overdue task: "${task.text}" (${minutesOverdue} minutes overdue)`);
        }
      }
    });
    
    if (overdueTasks.length === 0) {
      console.log('✅ No overdue tasks found');
      return;
    }
    
    console.log(`📋 Processing ${overdueTasks.length} overdue tasks`);
    
    // Process each overdue task (filter out invalid emails)
    const validEmailTasks = overdueTasks.filter(task => {
      const email = task.userEmail || '';
      return email.includes('@') && !email.includes('discord.local') && !email.includes('@discord');
    });
    
    console.log(`📧 Processing ${validEmailTasks.length} overdue tasks with valid email addresses`);
    
    for (const task of validEmailTasks) {
      try {
        await processOverdueTask(task);
      } catch (error) {
        console.error(`❌ Error processing overdue task ${task.id}:`, error);
      }
    }
    
    console.log('✅ Overdue task processing completed');
    
  } catch (error) {
    console.error('❌ Error checking overdue tasks:', error);
  }
}

/**
 * Process a single overdue task
 */
async function processOverdueTask(task: Task): Promise<void> {
  if (!task.dueDate) return;
  
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const minutesOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60));
  
  // Determine notification type based on how overdue
  let notificationType: 'overdue_5min' | 'overdue_10min' | 'overdue_15min' | 'overdue_30min' | 'overdue_1hour' | null = null;
  
  if (minutesOverdue >= 60) {
    notificationType = 'overdue_1hour';
  } else if (minutesOverdue >= 30) {
    notificationType = 'overdue_30min';
  } else if (minutesOverdue >= 15) {
    notificationType = 'overdue_15min';
  } else if (minutesOverdue >= 10) {
    notificationType = 'overdue_10min';
  } else if (minutesOverdue >= 5) {
    notificationType = 'overdue_5min';
  }
  
  if (!notificationType) {
    console.log(`⏭️ Task "${task.text}" is only ${minutesOverdue} minutes overdue, skipping notification`);
    return;
  }
  
  // Check if we've already sent this type of notification recently
  const recentNotification = await checkRecentOverdueNotification(task.id, notificationType);
  if (recentNotification) {
    console.log(`⏭️ Recent ${notificationType} notification already sent for task "${task.text}", skipping`);
    return;
  }
  
  // Get user info from task or use defaults
  const userId = task.userId || 'unknown';
  const userEmail = task.userEmail || 'unknown@example.com';
  const userName = task.userName || 'User';
  
  console.log(`📧 Sending ${notificationType} notification for task "${task.text}"`);
  
  // Send the overdue notification using the reminder system
  const reminderData = {
    taskId: task.id,
    userId,
    userEmail,
    userName,
    remindAtTime: new Date().toISOString(),
    message: `Are you completing task? You are ${minutesOverdue} minutes overdue!`,
    sentStatus: false,
    createdAt: new Date().toISOString(),
    reminderType: notificationType
  };
  
  await sendReminderNotification(reminderData);
  
  // Record that we sent this notification
  await recordOverdueNotification(task.id, notificationType, minutesOverdue);
  
  console.log(`✅ ${notificationType} notification sent for task "${task.text}"`);
}

/**
 * Check if we've sent a recent overdue notification of this type
 */
async function checkRecentOverdueNotification(taskId: string, notificationType: string): Promise<boolean> {
  try {
    const recentTime = new Date();
    recentTime.setMinutes(recentTime.getMinutes() - 30); // Check last 30 minutes (longer cooldown)
    
    const notificationsQuery = query(
      collection(db, 'scheduled_notifications'),
      where('taskId', '==', taskId),
      where('notificationType', '==', notificationType),
      where('status', '==', 'sent'),
      where('sentAt', '>', recentTime.toISOString())
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    return !notificationsSnapshot.empty;
    
  } catch (error) {
    console.error('❌ Error checking recent overdue notification:', error);
    return false;
  }
}

/**
 * Record that we sent an overdue notification
 */
async function recordOverdueNotification(taskId: string, notificationType: string, minutesOverdue: number): Promise<void> {
  try {
    const notificationData = {
      taskId,
      notificationType,
      minutesOverdue,
      status: 'sent',
      sentAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };
    
    await addDoc(collection(db, 'scheduled_notifications'), notificationData);
    
  } catch (error) {
    console.error('❌ Error recording overdue notification:', error);
  }
}
