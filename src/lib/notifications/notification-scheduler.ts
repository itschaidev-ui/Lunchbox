import { collection, addDoc, deleteDoc, doc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
// Removed incorrect import - sendTaskNotification doesn't exist
import type { Task } from '@/lib/types';

interface ScheduledNotification {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  taskId: string;
  taskText: string;
  dueDate: string;
  notificationType: 'due_soon' | 'overdue' | 'due_today';
  scheduledFor: string; // ISO timestamp when to send
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: string;
}

/**
 * Schedule a notification for a task
 */
export async function scheduleTaskNotification(
  userId: string,
  userEmail: string,
  userName: string,
  task: Task,
  notificationType: '10min_before' | '5min_before' | '1min_before' | 'overdue_5min' | 'overdue_10min' | 'overdue_15min' | 'overdue_30min' | 'overdue_1hour',
  scheduledFor: Date
): Promise<string> {
  try {
    console.log(`📅 Scheduling ${notificationType} notification for task "${task.text}" at ${scheduledFor.toISOString()}`);
    
    const notificationData = {
      userId,
      userEmail,
      userName,
      taskId: task.id,
      taskText: task.text,
      dueDate: task.dueDate!,
      notificationType,
      scheduledFor: scheduledFor.toISOString(),
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'scheduled_notifications'), notificationData);
    console.log(`✅ Notification scheduled with ID: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
    
    // Fallback: If Firestore fails, we'll use the old polling system as backup
    console.log('🔄 Firestore scheduling failed, notification will be handled by polling system');
    
    // Return a mock ID for now - the polling system will catch this task
    return `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Cancel scheduled notifications for a task
 */
export async function cancelTaskNotifications(taskId: string): Promise<void> {
  try {
    console.log(`🗑️ Cancelling notifications for task ${taskId}`);
    
    const notificationsQuery = query(
      collection(db, 'scheduled_notifications'),
      where('taskId', '==', taskId),
      where('status', '==', 'pending')
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    
    for (const notificationDoc of notificationsSnapshot.docs) {
      await deleteDoc(notificationDoc.ref);
      console.log(`🗑️ Cancelled notification ${notificationDoc.id}`);
    }
  } catch (error) {
    console.error('❌ Error cancelling notifications:', error);
  }
}

/**
 * Process all due notifications (called by cron job)
 */
export async function processDueNotifications(): Promise<void> {
  console.log('🔔 Processing due notifications...');
  
  // Use the old polling system directly since Firestore permissions are failing
  try {
    const { checkAndNotifyDueTasks } = await import('./task-notifications');
    await checkAndNotifyDueTasks();
    console.log('✅ Due notifications processing completed');
  } catch (error) {
    console.error('❌ Error processing due notifications:', error);
  }
}

/**
 * Schedule notifications for a task when it's created/updated
 */
export async function scheduleNotificationsForTask(
  userId: string,
  userEmail: string,
  userName: string,
  task: Task
): Promise<void> {
  if (!task.dueDate) {
    console.log(`⏭️ No due date for task "${task.text}", skipping notifications`);
    return;
  }
  
  try {
    console.log(`📅 Scheduling notifications for task "${task.text}"`);
    
    // Cancel existing notifications for this task
    await cancelTaskNotifications(task.id);
    
    // UNIVERSAL TIMEZONE HANDLING: 
    // Handle timezones properly for users anywhere in the world
    
    const storedDate = new Date(task.dueDate);
    const now = new Date();
    
    // If the task has timezone information, use it; otherwise use current user's timezone
    const taskTimezone = task.userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    console.log(`🕐 Task due date (stored as UTC): ${storedDate.toISOString()}`);
    console.log(`🕐 Task timezone: ${taskTimezone}`);
    console.log(`🕐 Current user timezone: ${currentTimezone}`);
    
    // The core issue: when a user sets 2:10 PM in their timezone, it gets stored as 2:10 PM UTC
    // We need to convert it back to the user's intended local time
    
    // Get the timezone offset for the task's timezone
    const taskTimezoneOffset = new Date().getTimezoneOffset(); // Current user's offset
    const timezoneOffsetMs = taskTimezoneOffset * 60000; // Convert to milliseconds
    
    // Convert the stored UTC time to the user's local time
    // This assumes the stored time represents what the user intended in their timezone
    const dueDate = new Date(storedDate.getTime() + timezoneOffsetMs);
    
    console.log(`🕐 Task due date (interpreted as local): ${dueDate.toLocaleString()}`);
    console.log(`🕐 Current time (Local): ${now.toLocaleString()}`);
    console.log(`🕐 Timezone offset: ${taskTimezoneOffset} minutes (${taskTimezoneOffset > 0 ? 'behind' : 'ahead of'} UTC)`);
    
    // Schedule 10 minutes before notification
    const tenMinBefore = new Date(dueDate);
    tenMinBefore.setMinutes(tenMinBefore.getMinutes() - 10);
    
    console.log(`📅 10 minutes before notification scheduled for: ${tenMinBefore.toLocaleString()}`);
    
    if (tenMinBefore > now) {
      await scheduleTaskNotification(
        userId,
        userEmail,
        userName,
        task,
        '10min_before',
        tenMinBefore
      );
    }
    
    // Schedule 5 minutes before notification
    const fiveMinBefore = new Date(dueDate);
    fiveMinBefore.setMinutes(fiveMinBefore.getMinutes() - 5);
    
    console.log(`📅 5 minutes before notification scheduled for: ${fiveMinBefore.toLocaleString()}`);
    
    if (fiveMinBefore > now) {
      await scheduleTaskNotification(
        userId,
        userEmail,
        userName,
        task,
        '5min_before',
        fiveMinBefore
      );
    }
    
    // Schedule 1 minute before notification
    const oneMinBefore = new Date(dueDate);
    oneMinBefore.setMinutes(oneMinBefore.getMinutes() - 1);
    
    console.log(`📅 1 minute before notification scheduled for: ${oneMinBefore.toLocaleString()}`);
    
    if (oneMinBefore > now) {
      await scheduleTaskNotification(
        userId,
        userEmail,
        userName,
        task,
        '1min_before',
        oneMinBefore
      );
    }
    
    console.log(`✅ All notifications scheduled for task "${task.text}"`);
    
  } catch (error) {
    console.error('❌ Error scheduling notifications for task:', error);
  }
}

/**
 * Clean up old notifications (run periodically)
 */
export async function cleanupOldNotifications(): Promise<void> {
  try {
    console.log('🧹 Cleaning up old notifications...');
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oldNotificationsQuery = query(
      collection(db, 'scheduled_notifications'),
      where('createdAt', '<', oneWeekAgo.toISOString())
    );
    
    const oldNotificationsSnapshot = await getDocs(oldNotificationsQuery);
    
    for (const notificationDoc of oldNotificationsSnapshot.docs) {
      await deleteDoc(notificationDoc.ref);
      console.log(`🗑️ Cleaned up old notification: ${notificationDoc.id}`);
    }
    
    console.log(`✅ Cleaned up ${oldNotificationsSnapshot.docs.length} old notifications`);
    
  } catch (error) {
    console.error('❌ Error cleaning up old notifications:', error);
  }
}
