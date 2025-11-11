import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Task } from '@/lib/types';

/**
 * Client-side function to reschedule notifications for all existing tasks
 * This should be called from the browser console or a client component
 */
export async function rescheduleAllTaskNotifications(userId: string, userEmail: string, userName: string): Promise<void> {
  try {
    console.log('🔄 Rescheduling notifications for all existing tasks...');
    
    // Get all tasks for the current user
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', userId)
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    
    console.log(`📋 Found ${tasksSnapshot.docs.length} tasks to reschedule`);
    
    for (const taskDoc of tasksSnapshot.docs) {
      const taskData = taskDoc.data();
      const task: Task = {
        id: taskDoc.id,
        ...taskData
      } as Task;
      
      // Only reschedule tasks with due dates
      if (task.dueDate) {
        try {
          console.log(`📅 Rescheduling notifications for task: "${task.text}" (due: ${task.dueDate})`);
          
          // Call the API to schedule notifications
          const response = await fetch('/api/schedule-notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId: task.id,
              userId: userId,
              userEmail: userEmail,
              userName: userName,
              task: task
            })
          });
          
          if (response.ok) {
            console.log(`✅ Notifications scheduled for task: "${task.text}"`);
          } else {
            const error = await response.json();
            console.error(`❌ Failed to schedule notifications for task ${task.id}:`, error);
          }
          
        } catch (error) {
          console.error(`❌ Failed to reschedule task ${task.id}:`, error);
        }
      } else {
        console.log(`⏭️ Skipping task "${task.text}" - no due date`);
      }
    }
    
    console.log('✅ Rescheduling completed!');
    
  } catch (error) {
    console.error('❌ Error rescheduling tasks:', error);
    throw error;
  }
}

/**
 * Reschedule notifications for a specific task
 */
export async function rescheduleTaskNotifications(
  userId: string, 
  userEmail: string, 
  userName: string, 
  task: Task
): Promise<void> {
  try {
    console.log(`📅 Rescheduling notifications for task: "${task.text}"`);
    
    // Call the API to schedule notifications
    const response = await fetch('/api/schedule-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: task.id,
        userId: userId,
        userEmail: userEmail,
        userName: userName,
        task: task
      })
    });
    
    if (response.ok) {
      console.log(`✅ Notifications scheduled for task: "${task.text}"`);
    } else {
      const error = await response.json();
      console.error(`❌ Failed to schedule notifications for task ${task.id}:`, error);
      throw new Error(error.error || 'Failed to schedule notifications');
    }
    
  } catch (error) {
    console.error(`❌ Failed to reschedule task ${task.id}:`, error);
    throw error;
  }
}
