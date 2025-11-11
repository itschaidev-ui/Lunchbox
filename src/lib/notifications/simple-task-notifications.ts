import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { processDueNotifications } from './simple-scheduler';
import type { Task } from '@/lib/types';

/**
 * Check for tasks that need notifications and process them
 */
export async function checkAndProcessNotifications(): Promise<void> {
  try {
    console.log('🔍 Checking for tasks that need notifications...');
    
    // Get all incomplete tasks
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('completed', '==', false)
    );
    
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks: Task[] = [];
    
    tasksSnapshot.forEach((doc) => {
      const taskData = doc.data();
      tasks.push({
        id: doc.id,
        ...taskData
      } as Task);
    });
    
    console.log(`📋 Found ${tasks.length} incomplete tasks`);
    
    // Filter tasks with valid email addresses
    const validEmailTasks = tasks.filter(task => {
      const email = task.userEmail || '';
      return email.includes('@') && 
             !email.includes('discord.local') && 
             !email.includes('@discord') &&
             email !== 'unknown@example.com';
    });
    
    console.log(`📧 Processing ${validEmailTasks.length} tasks with valid email addresses`);
    
    if (validEmailTasks.length === 0) {
      console.log('⏭️ No tasks with valid email addresses found');
      return;
    }
    
    // Process due notifications
    await processDueNotifications();
    
    console.log('✅ Notification check completed');
    
  } catch (error) {
    console.error('❌ Error checking notifications:', error);
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(): Promise<{
  totalTasks: number;
  validEmailTasks: number;
  pendingNotifications: number;
}> {
  try {
    // Get all incomplete tasks
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('completed', '==', false)
    );
    
    const tasksSnapshot = await getDocs(tasksQuery);
    const totalTasks = tasksSnapshot.size;
    
    // Count tasks with valid emails
    let validEmailTasks = 0;
    tasksSnapshot.forEach((doc) => {
      const taskData = doc.data();
      const email = taskData.userEmail || '';
      if (email.includes('@') && 
          !email.includes('discord.local') && 
          !email.includes('@discord') &&
          email !== 'unknown@example.com') {
        validEmailTasks++;
      }
    });
    
    // Get pending notifications
    const notificationsQuery = query(
      collection(db, 'simple_notifications'),
      where('status', '==', 'pending')
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    const pendingNotifications = notificationsSnapshot.size;
    
    return {
      totalTasks,
      validEmailTasks,
      pendingNotifications
    };
    
  } catch (error) {
    console.error('❌ Error getting notification stats:', error);
    return {
      totalTasks: 0,
      validEmailTasks: 0,
      pendingNotifications: 0
    };
  }
}
