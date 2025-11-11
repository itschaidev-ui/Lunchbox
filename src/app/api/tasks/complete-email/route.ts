import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { sendCompletionStateEmail } from '@/lib/notifications/completion-emails';

/**
 * API endpoint to immediately send completion email when a task is toggled
 * This works without Admin SDK by using the client Firebase SDK
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, userId, completed } = body;

    if (!taskId || !userId || completed === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: taskId, userId, completed' },
        { status: 400 }
      );
    }

    // Get Admin SDK (has elevated permissions)
    const adminDb = getDb();
    
    if (!adminDb) {
      console.warn('⚠️ Completion email skipped: Firebase Admin SDK not initialized.');
      // Return success but indicate it was skipped (non-critical feature)
      return NextResponse.json(
        { 
          success: true, 
          skipped: true,
          message: 'Email notification skipped - Admin SDK not configured' 
        },
        { status: 200 } // Return 200 instead of 503 so it doesn't show as error
      );
    }

    // Get task details
    const taskDoc = await adminDb.collection('tasks').doc(taskId).get();
    
    if (!taskDoc.exists) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const task = taskDoc.data();
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task data not found' },
        { status: 404 }
      );
    }
    
    // Get user information to show who completed the task
    let completedByName: string | undefined = undefined;
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        // Use display name, email, or fallback to userId
        completedByName = userData?.displayName || userData?.email || userData?.name || `User (${userId.substring(0, 8)}...)`;
      } else {
        // Fallback if user doc doesn't exist
        completedByName = task.userName || `User (${userId.substring(0, 8)}...)`;
      }
    } catch (err) {
      // If we can't get user info, use task userName or fallback
      completedByName = task.userName || `User (${userId.substring(0, 8)}...)`;
    }
    
    // Get user settings for email addresses
    const settingsDoc = await adminDb.collection('user_settings').doc(userId).get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    
    let emails: string[] = Array.isArray(settings?.taskCompletionEmails) 
      ? settings.taskCompletionEmails 
      : [];
    
    // Normalize and validate emails
    emails = Array.from(new Set(emails.map((e: string) => e.trim().toLowerCase())))
      .filter((e: string) => e.includes('@') && e.includes('.'));
    
    if (emails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No email addresses configured',
        emailsSent: 0
      });
    }

    // Check if we should send email (prevent duplicates)
    const now = new Date();
    const updatedAt = task.updatedAt?.toDate ? task.updatedAt.toDate() : new Date(task.updatedAt || now);
    
    if (completed) {
      // Check if we already sent completion email for this update
      const lastEmailedRaw = task.lastCompletionEmailAt;
      const lastEmailed = lastEmailedRaw?.toDate 
        ? lastEmailedRaw.toDate() 
        : lastEmailedRaw 
          ? new Date(lastEmailedRaw) 
          : null;
      
      if (lastEmailed && lastEmailed >= updatedAt) {
        return NextResponse.json({
          success: true,
          message: 'Email already sent for this completion',
          emailsSent: 0
        });
      }

      // Send completion email
      await sendCompletionStateEmail({
        to: emails,
        userName: task.userName || 'User',
        task: { ...task, id: taskId } as any,
        action: 'completed',
        completedBy: completedByName, // Show who completed the task
      });

      // Update task to mark email as sent (non-blocking - if it fails, email still sent)
      try {
        await adminDb.collection('tasks').doc(taskId).update({
          lastCompletionEmailAt: updatedAt.toISOString(),
        });
      } catch (updateError) {
        // Log but don't fail - email was already sent
        console.warn('⚠️ Failed to update task email timestamp (non-critical):', updateError);
      }
    } else {
      // Check if we already sent uncompletion email for this update
      const lastEmailedRaw = task.lastUncompleteEmailAt;
      const lastEmailed = lastEmailedRaw?.toDate 
        ? lastEmailedRaw.toDate() 
        : lastEmailedRaw 
          ? new Date(lastEmailedRaw) 
          : null;
      
      if (lastEmailed && lastEmailed >= updatedAt) {
        return NextResponse.json({
          success: true,
          message: 'Email already sent for this uncompletion',
          emailsSent: 0
        });
      }

      // Send uncompletion email
      await sendCompletionStateEmail({
        to: emails,
        userName: task.userName || 'User',
        task: { ...task, id: taskId } as any,
        action: 'uncompleted',
        completedBy: completedByName, // Show who uncompleted the task
      });

      // Update task to mark email as sent (non-blocking - if it fails, email still sent)
      try {
        await adminDb.collection('tasks').doc(taskId).update({
          lastUncompleteEmailAt: updatedAt.toISOString(),
        });
      } catch (updateError) {
        // Log but don't fail - email was already sent
        console.warn('⚠️ Failed to update task email timestamp (non-critical):', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Email sent to ${emails.length} recipient(s)`,
      emailsSent: emails.length,
      recipients: emails
    });

  } catch (error) {
    console.error('❌ Error in complete-email API:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

