import nodemailer from 'nodemailer';
import type { Task } from '@/lib/types';

const isConfigured = (): boolean => !!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function sendCompletionStateEmail(opts: {
  to: string[];
  userName: string;
  task: Task;
  action: 'completed' | 'uncompleted';
  completedBy?: string; // User who completed the task (name or email)
}): Promise<void> {
  if (!isConfigured()) {
    console.log('⏭️ Email not configured, skipping completion email');
    return;
  }

  const { to, userName, task, action, completedBy } = opts;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const actionLabel = action === 'completed' ? '✅ Task Completed' : '↩️ Task Marked Incomplete';
  const tagsText = (task.tags || []).map((t) => `#${t}`).join(', ') || 'No tags';
  const dueText = task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date';
  const updatedRaw: any = (task as any).updatedAt;
  const updatedText = updatedRaw ? new Date(updatedRaw?.toDate ? updatedRaw.toDate() : updatedRaw).toLocaleString() : new Date().toLocaleString();

  const subject = `${actionLabel}: ${task.text}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
  // Show who completed/uncompleted the task if provided (useful when watching multiple users)
  const actionByLabel = action === 'completed' ? 'Completed by:' : 'Uncompleted by:';
  const completedByText = completedBy ? `<p style="margin:0 0 8px 0;"><strong>${actionByLabel}</strong> ${completedBy}</p>` : '';

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding:16px;">
      <h2 style="margin:0 0 12px 0;">${actionLabel}</h2>
      <p style="margin:0 0 10px 0;">Hello ${userName},</p>
      <p style="margin:0 0 10px 0;">The task <strong>${task.text}</strong> was <strong>${action}</strong>.</p>
      ${completedByText}
      ${task.description ? `<p style="margin:0 0 8px 0;"><strong>Description:</strong> ${task.description}</p>` : ''}
      <p style="margin:0 0 8px 0;"><strong>Tags:</strong> ${tagsText}</p>
      <p style="margin:0 0 8px 0;"><strong>Due:</strong> ${dueText}</p>
      <p style="margin:0 0 8px 0;"><strong>Updated:</strong> ${updatedText}</p>
      <p style="margin-top:16px;"><a href="${baseUrl}/tasks" style="color:#3b82f6;">View your tasks</a></p>
      <hr style="margin:16px 0; border:none; border-top:1px solid #eee;" />
      <p style="color:#666; font-size:12px;">Manage who receives completion emails: Settings → Accessibility</p>
    </div>
  `;

  const mailOptions = {
    from: `"Lunchbox AI" <${process.env.GMAIL_USER}>`,
    to: to.map(normalizeEmail).join(','),
    subject,
    html,
    text: `${subject}\n\nTask: ${task.text}\nAction: ${action}${completedBy ? `\n${actionByLabel} ${completedBy}` : ''}\nTags: ${tagsText}\nDue: ${dueText}\nUpdated: ${updatedText}\n\nManage in Settings → Accessibility`,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('📧 Completion state email sent:', result.messageId);
  } catch (err: any) {
    console.error('❌ Error sending completion state email:', err?.message || err);
  }
}


