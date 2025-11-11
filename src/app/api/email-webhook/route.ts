import { NextRequest, NextResponse } from 'next/server';
import { parseEmailReply, extractTaskId, parseRescheduleTime } from '@/lib/email-parser';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendReminderNotification } from '@/lib/notification-sender';

/**
 * POST /api/email-webhook
 * Handle incoming email replies for task management
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract email data (this would come from your email service provider)
    const {
      from,
      subject,
      content,
      replyTo,
      messageId
    } = body;
    
    console.log(`📧 Processing email reply from: ${from}`);
    console.log(`📧 Subject: ${subject}`);
    
    // Extract task ID from email
    const taskId = extractTaskId(replyTo || from, subject, content);
    if (!taskId) {
      console.log('❌ No task ID found in email');
      return NextResponse.json({
        success: false,
        error: 'No task ID found in email'
      }, { status: 400 });
    }
    
    console.log(`📋 Processing reply for task: ${taskId}`);
    
    // Parse the email content to determine action
    const emailAction = parseEmailReply(content, subject);
    console.log(`🎯 Detected action: ${emailAction.action}`);
    
    // Get the task from database
    const taskRef = doc(db, 'tasks', taskId);
    const taskSnap = await getDoc(taskRef);
    
    if (!taskSnap.exists()) {
      console.log(`❌ Task ${taskId} not found`);
      return NextResponse.json({
        success: false,
        error: 'Task not found'
      }, { status: 404 });
    }
    
    const task = taskSnap.data();
    
    // Execute the action
    let result: any = { success: true };
    
    switch (emailAction.action) {
      case 'complete':
        result = await handleTaskCompletion(taskId, task, from);
        break;
        
      case 'in_progress':
        result = await handleTaskInProgress(taskId, task, from);
        break;
        
      case 'reschedule':
        result = await handleTaskReschedule(taskId, task, emailAction.rescheduleTime, from);
        break;
        
      case 'no_action':
        result = await handleNoAction(taskId, task, from);
        break;
        
      default:
        result = { success: false, error: 'Unknown action' };
    }
    
    // Send confirmation email
    await sendConfirmationEmail(from, task, emailAction.action, result);
    
    return NextResponse.json({
      success: true,
      action: emailAction.action,
      taskId,
      result
    });
    
  } catch (error) {
    console.error('❌ Error processing email webhook:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process email reply',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Handle task completion
 */
async function handleTaskCompletion(taskId: string, task: any, userEmail: string): Promise<any> {
  try {
    console.log(`✅ Marking task ${taskId} as completed`);
    
    // Update task status
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      completed: true,
      completedAt: serverTimestamp(),
      completedBy: userEmail
    });
    
    // Log the action
    await addDoc(collection(db, 'task_actions'), {
      taskId,
      action: 'completed',
      userEmail,
      timestamp: serverTimestamp(),
      source: 'email_reply'
    });
    
    return { message: 'Task marked as completed' };
    
  } catch (error) {
    console.error('❌ Error completing task:', error);
    throw error;
  }
}

/**
 * Handle task in progress
 */
async function handleTaskInProgress(taskId: string, task: any, userEmail: string): Promise<any> {
  try {
    console.log(`🔄 Marking task ${taskId} as in progress`);
    
    // Update task status
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      inProgress: true,
      inProgressAt: serverTimestamp(),
      inProgressBy: userEmail
    });
    
    // Log the action
    await addDoc(collection(db, 'task_actions'), {
      taskId,
      action: 'in_progress',
      userEmail,
      timestamp: serverTimestamp(),
      source: 'email_reply'
    });
    
    return { message: 'Task marked as in progress' };
    
  } catch (error) {
    console.error('❌ Error marking task in progress:', error);
    throw error;
  }
}

/**
 * Handle task rescheduling
 */
async function handleTaskReschedule(taskId: string, task: any, rescheduleTime: string | undefined, userEmail: string): Promise<any> {
  try {
    if (!rescheduleTime) {
      throw new Error('No reschedule time provided');
    }
    
    console.log(`📅 Rescheduling task ${taskId} to: ${rescheduleTime}`);
    
    const newDueDate = parseRescheduleTime(rescheduleTime);
    if (!newDueDate) {
      throw new Error('Invalid reschedule time format');
    }
    
    // Update task due date
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      dueDate: newDueDate.toISOString(),
      rescheduledAt: serverTimestamp(),
      rescheduledBy: userEmail,
      rescheduledFrom: task.dueDate
    });
    
    // Cancel old notifications and create new ones
    // This would call the notification scheduling system
    // await cancelTaskNotifications(taskId);
    // await scheduleNotificationsForTask(task.userId, task.userEmail, task.userName, { ...task, dueDate: newDueDate.toISOString() });
    
    // Log the action
    await addDoc(collection(db, 'task_actions'), {
      taskId,
      action: 'rescheduled',
      userEmail,
      rescheduleTime,
      newDueDate: newDueDate.toISOString(),
      timestamp: serverTimestamp(),
      source: 'email_reply'
    });
    
    return { 
      message: 'Task rescheduled successfully',
      newDueDate: newDueDate.toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error rescheduling task:', error);
    throw error;
  }
}

/**
 * Handle no action
 */
async function handleNoAction(taskId: string, task: any, userEmail: string): Promise<any> {
  try {
    console.log(`📝 Recording no action for task ${taskId}`);
    
    // Log the response
    await addDoc(collection(db, 'task_actions'), {
      taskId,
      action: 'no_action',
      userEmail,
      timestamp: serverTimestamp(),
      source: 'email_reply'
    });
    
    return { message: 'Response recorded, no action taken' };
    
  } catch (error) {
    console.error('❌ Error recording no action:', error);
    throw error;
  }
}

/**
 * Send confirmation email to user
 */
async function sendConfirmationEmail(userEmail: string, task: any, action: string, result: any): Promise<void> {
  try {
    const subject = `✅ Task Action Confirmed: ${task.text}`;
    
    const confirmationData = {
      taskId: task.id,
      userId: task.userId,
      userEmail: userEmail,
      userName: task.userName || 'User',
      remindAtTime: new Date().toISOString(),
      message: `Your action "${action}" has been processed for task: ${task.text}`,
      sentStatus: false,
      createdAt: new Date().toISOString(),
      reminderType: 'confirmation'
    };
    
    await sendReminderNotification(confirmationData);
    
    console.log(`📧 Confirmation email sent to ${userEmail}`);
    
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
  }
}
