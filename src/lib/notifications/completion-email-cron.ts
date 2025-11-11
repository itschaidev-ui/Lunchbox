import { getDb } from '@/lib/firebase-admin';
import { sendCompletionStateEmail } from './completion-emails';

type AnyObj = Record<string, any>;

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  try {
    return new Date(value);
  } catch {
    return null;
  }
}

export async function checkTaskCompletionEmails(): Promise<void> {
  // Get Admin SDK dynamically (handles module caching)
  const adminDb = getDb();
  
  // Skip if Admin SDK isn't available
  if (!adminDb) {
    console.warn('⚠️ Firebase Admin not available, skipping completion email check');
    return;
  }

  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // Load all tasks; filter in code for updated within last minute
    const tasksSnap = await adminDb.collection('tasks').get();
    const tasks: AnyObj[] = [];
    tasksSnap.forEach((d) => tasks.push({ id: d.id, ...d.data() }));

    // Group per user
    const byUser = new Map<string, AnyObj[]>();
    for (const t of tasks) {
      const updatedAt = toDate(t.updatedAt);
      if (!updatedAt || updatedAt < oneMinuteAgo) continue;
      if (!t.userId) continue;
      if (!byUser.has(t.userId)) byUser.set(t.userId, []);
      byUser.get(t.userId)!.push(t);
    }

    if (byUser.size === 0) return;

    for (const [userId, userTasks] of byUser.entries()) {
      // Get user information to show who completed the task
      let completedByName: string | undefined = undefined;
      try {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data() as AnyObj;
          // Use display name, email, or fallback to userId
          completedByName = userData?.displayName || userData?.email || userData?.name || `User (${userId.substring(0, 8)}...)`;
        } else {
          // Fallback if user doc doesn't exist
          completedByName = userTasks[0]?.userName || `User (${userId.substring(0, 8)}...)`;
        }
      } catch (err) {
        // If we can't get user info, use task userName or fallback
        completedByName = userTasks[0]?.userName || `User (${userId.substring(0, 8)}...)`;
      }
      
      // Read user settings doc by id
      const settingsRef = adminDb.collection('user_settings').doc(userId);
      const settingsSnap = await settingsRef.get();
      const settings = settingsSnap.exists ? (settingsSnap.data() as AnyObj) : {};
      let emails: string[] = Array.isArray(settings.taskCompletionEmails) ? settings.taskCompletionEmails : [];
      emails = Array.from(new Set((emails || []).map((e) => e.trim().toLowerCase()))).filter((e) => e.includes('@') && e.includes('.'));
      if (emails.length === 0) continue;

      for (const task of userTasks) {
        const updatedAt = toDate(task.updatedAt) || now;
        const isCompleted = !!task.completed;
        const taskRef = adminDb.collection('tasks').doc(task.id);

        if (isCompleted) {
          const lastRaw = task.lastCompletionEmailAt;
          const last = toDate(lastRaw);
          if (!last || last < updatedAt) {
            await sendCompletionStateEmail({
              to: emails,
              userName: task.userName || 'User',
              task: task as any,
              action: 'completed',
              completedBy: completedByName, // Show who completed the task
            });
            await taskRef.update({ lastCompletionEmailAt: updatedAt.toISOString() });
          }
        } else {
          const lastRaw = task.lastUncompleteEmailAt;
          const last = toDate(lastRaw);
          if (!last || last < updatedAt) {
            await sendCompletionStateEmail({
              to: emails,
              userName: task.userName || 'User',
              task: task as any,
              action: 'uncompleted',
              completedBy: completedByName, // Show who uncompleted the task
            });
            await taskRef.update({ lastUncompleteEmailAt: updatedAt.toISOString() });
          }
        }
      }
    }
  } catch (error) {
    // If Admin SDK fails (e.g., missing credentials), log and skip
    console.error('❌ Error in completion email check:', error instanceof Error ? error.message : error);
    console.warn('⚠️ Skipping completion email check due to error');
    return;
  }
}


