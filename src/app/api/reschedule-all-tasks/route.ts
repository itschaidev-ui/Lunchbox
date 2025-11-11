import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { scheduleNotificationsForTask } from '@/lib/notifications/notification-scheduler';
import type { Task } from '@/lib/types';

/**
 * POST /api/reschedule-all-tasks
 * Reschedule notifications for all existing tasks
 */
export async function POST() {
  try {
    console.log('🔄 Rescheduling notifications for all existing tasks...');
    
    // Get all tasks from Firestore
    const tasksQuery = query(collection(db, 'tasks'));
    const tasksSnapshot = await getDocs(tasksQuery);
    
    console.log(`📋 Found ${tasksSnapshot.docs.length} tasks to reschedule`);
    
    const results = [];
    
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
          
          await scheduleNotificationsForTask(
            task.userId,
            task.userEmail || 'itschaidev@gmail.com', // Fallback email
            task.userName || 'User', // Fallback name
            task
          );
          
          results.push({
            taskId: task.id,
            taskText: task.text,
            dueDate: task.dueDate,
            status: 'scheduled'
          });
          
        } catch (error) {
          console.error(`❌ Failed to reschedule task ${task.id}:`, error);
          results.push({
            taskId: task.id,
            taskText: task.text,
            dueDate: task.dueDate,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      } else {
        console.log(`⏭️ Skipping task "${task.text}" - no due date`);
        results.push({
          taskId: task.id,
          taskText: task.text,
          dueDate: null,
          status: 'skipped'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Rescheduled notifications for ${results.length} tasks`,
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error rescheduling tasks:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to reschedule tasks',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
