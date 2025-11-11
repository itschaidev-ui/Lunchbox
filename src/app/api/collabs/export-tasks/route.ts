import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import type { Task } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { userId, tasks } = await request.json();

    if (!userId || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. userId and tasks array required.' },
        { status: 400 }
      );
    }

    const adminDb = getDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    const results = [];
    const now = new Date().toISOString();

    for (const task of tasks) {
      try {
        // Create task in user's personal tasks collection
        const taskRef = adminDb.collection('tasks').doc();
        
        // Remove undefined values (Firestore doesn't allow undefined)
        const cleanTask: any = {
          text: task.text,
          completed: task.completed || false,
          userId,
          createdAt: now,
          updatedAt: now,
        };
        
        // Only add optional fields if they're defined
        if (task.dueDate !== undefined && task.dueDate !== null) {
          cleanTask.dueDate = task.dueDate;
        }
        if (task.description !== undefined && task.description !== null) {
          cleanTask.description = task.description;
        }
        if (task.tags !== undefined && task.tags !== null && task.tags.length > 0) {
          cleanTask.tags = task.tags;
        }
        if (task.tagColors !== undefined && task.tagColors !== null) {
          cleanTask.tagColors = task.tagColors;
        }
        if (task.starred !== undefined) {
          cleanTask.starred = task.starred;
        }
        
        await taskRef.set(cleanTask);

        results.push({ taskId: taskRef.id, text: task.text, status: 'exported' });
      } catch (error: any) {
        console.error(`Error exporting task ${task.text}:`, error);
        results.push({ text: task.text, status: 'error', error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Exported ${results.filter(r => r.status === 'exported').length} task(s)`,
    });
  } catch (error: any) {
    console.error('Error exporting tasks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export tasks' },
      { status: 500 }
    );
  }
}

