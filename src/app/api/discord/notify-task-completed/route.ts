import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to trigger immediate Discord notification for task completion
 * Called by the website when a task is completed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Try to verify task exists and is completed (optional - bot will verify too)
    try {
      const { getDb } = await import('@/lib/firebase-admin');
      const adminDb = getDb();
      
      if (adminDb) {
        const taskDoc = await adminDb.collection('tasks').doc(taskId).get();
        
        if (taskDoc.exists) { // Admin SDK uses .exists as a property
          const task = taskDoc.data();
          
          if (!task?.completed) {
            return NextResponse.json(
              { error: 'Task is not completed' },
              { status: 400 }
            );
          }
        }
      } else {
        console.warn('⚠️ Firebase Admin not initialized, skipping task verification');
      }
    } catch (adminError) {
      // If Admin SDK isn't available, skip verification
      // The bot will verify the task when it processes the notification
      console.warn('⚠️ Firebase Admin not available, skipping task verification:', adminError);
    }

    // Call Discord bot's notification endpoint
    // The bot's OAuth server runs on port 3001 by default
    const botUrl = process.env.DISCORD_BOT_API_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${botUrl}/api/notify-task-completed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn('Bot API returned non-200 status, but notification may still be queued:', data);
        // Still return success - the bot will catch it on the next poll
        return NextResponse.json({
          success: true,
          message: 'Notification queued (bot will process on next check)',
          warning: data.warning || 'Bot API returned non-200 status',
        });
      }

      return NextResponse.json({
        success: true,
        message: data.message || 'Notification triggered',
      });
    } catch (error) {
      console.error('Failed to call Discord bot API:', error);
      // Still return success - the bot will catch it on the next poll
      return NextResponse.json({
        success: true,
        message: 'Notification queued (bot will process on next check)',
        warning: 'Bot API not available, will be processed on next scheduled check',
      });
    }

  } catch (error) {
    console.error('Error in notify-task-completed API:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

