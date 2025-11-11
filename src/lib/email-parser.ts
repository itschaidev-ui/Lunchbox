/**
 * Parse incoming email replies to extract task actions
 */

export interface EmailAction {
  action: 'complete' | 'in_progress' | 'reschedule' | 'no_action';
  taskId?: string;
  rescheduleTime?: string;
  originalMessage?: string;
}

/**
 * Parse email content to extract task actions
 */
export function parseEmailReply(emailContent: string, subject: string): EmailAction {
  const content = emailContent.toLowerCase().trim();
  const subjectLower = subject.toLowerCase();
  
  // Extract task ID from subject or content
  const taskIdMatch = content.match(/task-([a-zA-Z0-9]+)/) || subjectLower.match(/task-([a-zA-Z0-9]+)/);
  const taskId = taskIdMatch ? taskIdMatch[1] : undefined;
  
  // Check for completion actions
  if (content.includes('yes') || content.includes('completed') || content.includes('done') || content.includes('finished')) {
    return {
      action: 'complete',
      taskId,
      originalMessage: emailContent
    };
  }
  
  // Check for in-progress actions
  if (content.includes('working') || content.includes('in progress') || content.includes('almost done') || content.includes('getting there')) {
    return {
      action: 'in_progress',
      taskId,
      originalMessage: emailContent
    };
  }
  
  // Check for reschedule actions
  const rescheduleMatch = content.match(/reschedule\s+(?:to\s+)?(\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\/\d{1,2}|\d{1,2}:\d{2})/i);
  if (rescheduleMatch) {
    return {
      action: 'reschedule',
      taskId,
      rescheduleTime: rescheduleMatch[1],
      originalMessage: emailContent
    };
  }
  
  // Check for time-based reschedule (e.g., "4pm", "2:30", "tomorrow")
  const timeMatch = content.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}:\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\/\d{1,2})/i);
  if (timeMatch && (content.includes('reschedule') || content.includes('move') || content.includes('change'))) {
    return {
      action: 'reschedule',
      taskId,
      rescheduleTime: timeMatch[1],
      originalMessage: emailContent
    };
  }
  
  // Check for "no" or "not yet" responses
  if (content.includes('no') || content.includes('not yet') || content.includes('not ready') || content.includes('later')) {
    return {
      action: 'no_action',
      taskId,
      originalMessage: emailContent
    };
  }
  
  // Default to no action if we can't parse anything
  return {
    action: 'no_action',
    taskId,
    originalMessage: emailContent
  };
}

/**
 * Extract task ID from email headers or content
 */
export function extractTaskId(fromEmail: string, subject: string, content: string): string | null {
  // Try to extract from reply-to header format: reply+task-{taskId}@domain.com
  const replyToMatch = fromEmail.match(/reply\+task-([a-zA-Z0-9]+)@/);
  if (replyToMatch) {
    return replyToMatch[1];
  }
  
  // Try to extract from subject line
  const subjectMatch = subject.match(/task-([a-zA-Z0-9]+)/i);
  if (subjectMatch) {
    return subjectMatch[1];
  }
  
  // Try to extract from email content
  const contentMatch = content.match(/task-([a-zA-Z0-9]+)/i);
  if (contentMatch) {
    return contentMatch[1];
  }
  
  return null;
}

/**
 * Parse reschedule time from user input
 */
export function parseRescheduleTime(timeString: string): Date | null {
  const now = new Date();
  const time = timeString.toLowerCase().trim();
  
  // Handle "tomorrow"
  if (time.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  // Handle "today"
  if (time.includes('today')) {
    return now;
  }
  
  // Handle time formats like "4pm", "2:30", "14:30"
  const timeMatch = time.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const ampm = timeMatch[3];
    
    // Convert to 24-hour format
    if (ampm === 'pm' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'am' && hours === 12) {
      hours = 0;
    }
    
    const rescheduleDate = new Date(now);
    rescheduleDate.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (rescheduleDate.getTime() < now.getTime()) {
      rescheduleDate.setDate(rescheduleDate.getDate() + 1);
    }
    
    return rescheduleDate;
  }
  
  // Handle date formats like "12/25", "12/25/2024"
  const dateMatch = time.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]) - 1; // JavaScript months are 0-indexed
    const day = parseInt(dateMatch[2]);
    const year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();
    
    return new Date(year, month, day);
  }
  
  return null;
}

/**
 * Generate reply instructions for email notifications
 */
export function generateReplyInstructions(taskId: string, taskText: string): string {
  return `
Reply to this email with one of the following actions:

✅ YES - Mark task as in progress
❌ NO - Not ready yet  
✅ COMPLETED - Mark task as done
📅 RESCHEDULE [TIME] - Move to different time

Examples:
- "YES" (mark in progress)
- "COMPLETED" (mark done)
- "RESCHEDULE 4pm" (move to 4pm today)
- "RESCHEDULE tomorrow" (move to tomorrow)

Task: ${taskText}
Task ID: ${taskId}
`;
}
