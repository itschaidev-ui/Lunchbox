import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { sendReminderNotification } from '@/lib/notification-sender';

/**
 * Send rescheduling alert when task is rescheduled within 10 minutes of due time
 */
export async function sendReschedulingAlert(
  user: any,
  oldTask: any,
  newDueDate: string
): Promise<void> {
  try {
    console.log(`📧 Sending rescheduling alert for task: ${oldTask.text}`);
    
    const oldDueDate = oldTask.dueDate ? new Date(oldTask.dueDate) : null;
    const newDueDateObj = new Date(newDueDate);
    
    const alertData = {
      taskId: oldTask.id,
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || 'User',
      remindAtTime: new Date().toISOString(),
      message: `Your task "${oldTask.text}" got rescheduled within last 10 minutes of completion time. New due time: ${newDueDateObj.toLocaleString()}`,
      sentStatus: false,
      createdAt: new Date().toISOString(),
      reminderType: 'rescheduling_alert'
    };
    
    await sendReminderNotification(alertData);
    
    console.log(`✅ Rescheduling alert sent for task: ${oldTask.text}`);
    
  } catch (error) {
    console.error('❌ Error sending rescheduling alert:', error);
    throw error;
  }
}

/**
 * Get sent notifications for a task
 */
export async function getSentNotifications(taskId: string): Promise<string[]> {
  try {
    console.log(`📋 Getting sent notifications for task: ${taskId}`);
    
    const notificationsQuery = query(
      collection(db, 'scheduled_notifications'),
      where('taskId', '==', taskId),
      where('status', '==', 'sent')
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    const sentNotificationIds: string[] = [];
    
    notificationsSnapshot.forEach((doc) => {
      sentNotificationIds.push(doc.id);
    });
    
    console.log(`📋 Found ${sentNotificationIds.length} sent notifications for task: ${taskId}`);
    return sentNotificationIds;
    
  } catch (error) {
    console.error('❌ Error getting sent notifications:', error);
    return [];
  }
}

/**
 * Cancel only unsent notifications for a task
 */
export async function cancelUnsentNotifications(taskId: string): Promise<void> {
  try {
    console.log(`🗑️ Cancelling unsent notifications for task: ${taskId}`);
    
    const notificationsQuery = query(
      collection(db, 'scheduled_notifications'),
      where('taskId', '==', taskId),
      where('status', '==', 'pending')
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    
    const deletePromises = notificationsSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
    
    console.log(`✅ Cancelled ${notificationsSnapshot.docs.length} unsent notifications for task: ${taskId}`);
    
  } catch (error) {
    console.error('❌ Error cancelling unsent notifications:', error);
    throw error;
  }
}

/**
 * Check if rescheduling is within 10 minutes of due time
 */
export function isReschedulingWithin10Minutes(oldDueDate: string, newDueDate: string): boolean {
  const oldDate = new Date(oldDueDate);
  const newDate = new Date(newDueDate);
  const now = new Date();
  
  // Check if the old due date is within 10 minutes of now
  const timeDiff = Math.abs(oldDate.getTime() - now.getTime());
  const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
  
  return timeDiff <= tenMinutes;
}

/**
 * Smart update logic for task notifications
 */
export async function smartUpdateTaskNotifications(
  taskId: string,
  user: any,
  oldTask: any,
  updatedTask: any
): Promise<void> {
  try {
    console.log(`🔄 Smart updating notifications for task: ${taskId}`);
    
    const dueDateChanged = oldTask.dueDate !== updatedTask.dueDate;
    
    if (!dueDateChanged) {
      console.log(`⏭️ Due date unchanged for task ${taskId}, no notification updates needed`);
      return;
    }
    
    const now = new Date();
    const oldDueDate = oldTask.dueDate ? new Date(oldTask.dueDate) : null;
    const newDueDate = new Date(updatedTask.dueDate);
    
    // Check if rescheduling within 10 minutes of due time
    if (oldDueDate && isReschedulingWithin10Minutes(oldTask.dueDate, updatedTask.dueDate)) {
      console.log(`🚨 Rescheduling within 10 minutes of due time for task: ${oldTask.text}`);
      await sendReschedulingAlert(user, oldTask, updatedTask.dueDate);
    }
    
    // Get sent notifications to preserve them
    const sentNotifications = await getSentNotifications(taskId);
    console.log(`📋 Preserving ${sentNotifications.length} sent notifications`);
    
    // Cancel only unsent notifications
    await cancelUnsentNotifications(taskId);
    
    // Create new notifications for the new due date
    // This would call the notification scheduling system
    // await scheduleNotificationsForTask(user.uid, user.email, user.displayName, { ...updatedTask, id: taskId });
    
    console.log(`✅ Smart update completed for task: ${taskId}`);
    
  } catch (error) {
    console.error('❌ Error in smart update:', error);
    throw error;
  }
}
