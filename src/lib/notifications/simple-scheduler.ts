import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { sendSimpleNotification } from './simple-email-service';

export interface SimpleNotification {
  id?: string;
  taskId: string;
  userId: string;
  userEmail: string;
  userName: string;
  taskTitle: string;
  dueDate: string;
  notificationType: 'reminder' | 'overdue';
  scheduledFor: string;
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: string;
}

/**
 * Schedule a simple notification for a task
 */
export async function scheduleTaskNotification(
  taskId: string,
  userId: string,
  userEmail: string,
  userName: string,
  taskTitle: string,
  dueDate: string,
  notificationType: 'reminder' | 'overdue',
  scheduledFor: Date
): Promise<string> {
  try {
    console.log(`📅 Scheduling ${notificationType} notification for task: ${taskTitle}`);

    // Idempotency: if an identical pending notification already exists, reuse it
    const existingQuery = query(
      collection(db, 'simple_notifications'),
      where('taskId', '==', taskId),
      where('notificationType', '==', notificationType),
      where('scheduledFor', '==', scheduledFor.toISOString()),
      where('status', '==', 'pending')
    );

    const existingSnapshot = await getDocs(existingQuery);
    if (!existingSnapshot.empty) {
      const existingId = existingSnapshot.docs[0].id;
      console.log(`↩️ Pending notification already exists (idempotent): ${existingId}`);
      return existingId;
    }

    const notificationData = {
      taskId,
      userId,
      userEmail,
      userName,
      taskTitle,
      dueDate,
      notificationType,
      scheduledFor: scheduledFor.toISOString(),
      status: 'pending',
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'simple_notifications'), notificationData);
    console.log(`✅ Notification scheduled with ID: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
    throw error;
  }
}

/**
 * Cancel all notifications for a task
 */
export async function cancelTaskNotifications(taskId: string): Promise<void> {
  try {
    console.log(`🗑️ Cancelling notifications for task: ${taskId}`);
    
    const q = query(
      collection(db, 'simple_notifications'),
      where('taskId', '==', taskId),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(docSnapshot => 
      deleteDoc(doc(db, 'simple_notifications', docSnapshot.id))
    );
    
    await Promise.all(deletePromises);
    console.log(`✅ Cancelled ${deletePromises.length} notifications for task ${taskId}`);
  } catch (error) {
    console.error('❌ Error cancelling notifications:', error);
    throw error;
  }
}

/**
 * Check and send due notifications
 */
export async function processDueNotifications(): Promise<void> {
  try {
    console.log('🔔 Checking for due notifications...');
    
    const now = new Date();
    const nowISO = now.toISOString();
    
    // First, check for scheduled notifications that are due
    const scheduledQuery = query(
      collection(db, 'simple_notifications'),
      where('status', '==', 'pending'),
      where('scheduledFor', '<=', nowISO)
    );
    
    const scheduledSnapshot = await getDocs(scheduledQuery);
    const scheduledNotifications: SimpleNotification[] = [];
    
    scheduledSnapshot.forEach((doc) => {
      scheduledNotifications.push({
        id: doc.id,
        ...doc.data()
      } as SimpleNotification);
    });
    
    // Process scheduled notifications
    if (scheduledNotifications.length > 0) {
      console.log(`📧 Processing ${scheduledNotifications.length} scheduled notifications`);
      
      for (const notification of scheduledNotifications) {
        try {
          await sendSimpleNotification(notification);
          
          // Mark as sent (only if email was actually sent, not skipped)
          await deleteDoc(doc(db, 'simple_notifications', notification.id!));
          console.log(`✅ Scheduled notification sent and removed: ${notification.taskTitle}`);
        } catch (error: any) {
          // Only log non-auth errors
          if (error.code !== 'EAUTH' && error.responseCode !== 535) {
            console.error(`❌ Failed to send scheduled notification for task ${notification.taskTitle}:`, error);
          }
        }
      }
    }
    
    // Now check for overdue tasks in real-time with multiple intervals
    console.log('🔍 Checking for overdue tasks in real-time...');
    
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('completed', '==', false),
      where('dueDate', '!=', null)
    );
    
    const tasksSnapshot = await getDocs(tasksQuery);
    const overdueTasks: any[] = [];
    
    tasksSnapshot.forEach((doc) => {
      const taskData = doc.data();
      const dueDate = new Date(taskData.dueDate);
      
      // Check if task is overdue (due date is in the past)
      if (dueDate < now) {
        const minutesOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60));
        
        // Check if we should notify for this specific overdue interval
        const overdueIntervals = [15, 30, 60]; // 15min, 30min, 1hr
        let shouldNotify = false;
        let intervalLabel = '';
        
        for (const interval of overdueIntervals) {
          // Check if we're within 5 minutes of this interval (to catch the cron window)
          if (minutesOverdue >= interval - 5 && minutesOverdue <= interval + 5) {
            shouldNotify = true;
            intervalLabel = `${interval}min`;
            break;
          }
        }
        
        if (shouldNotify) {
          overdueTasks.push({
            id: doc.id,
            ...taskData,
            minutesOverdue,
            intervalLabel
          });
        }
      }
    });
    
    if (overdueTasks.length > 0) {
      console.log(`🚨 Found ${overdueTasks.length} overdue tasks`);
      
      for (const task of overdueTasks) {
        // Check if we already sent an overdue notification for this specific interval
        const existingOverdueQuery = query(
          collection(db, 'simple_notifications'),
          where('taskId', '==', task.id),
          where('notificationType', '==', 'overdue'),
          where('status', '==', 'sent')
        );
        
        const existingOverdueSnapshot = await getDocs(existingOverdueQuery);
        
        // Check if we've already notified for this specific interval
        let alreadyNotifiedForInterval = false;
        existingOverdueSnapshot.forEach((doc) => {
          const notification = doc.data();
          const sentAt = new Date(notification.sentAt || notification.scheduledFor);
          const minutesSinceDue = Math.floor((sentAt.getTime() - new Date(task.dueDate).getTime()) / (1000 * 60));
          
          // Check if notification was sent for the same interval (within 10 min window)
          const targetInterval = parseInt(task.intervalLabel.replace('min', ''));
          if (Math.abs(minutesSinceDue - targetInterval) < 10) {
            alreadyNotifiedForInterval = true;
          }
        });
        
        if (!alreadyNotifiedForInterval) {
          // Send overdue notification
          const email = task.userEmail || '';
          const userName = task.userName || 'User';
          const userId = task.userId || 'unknown';
          
          if (email.includes('@') && !email.includes('discord.local') && !email.includes('@discord')) {
            try {
              console.log(`📧 Sending ${task.intervalLabel} overdue notification to: ${userName} (${email}) for task: "${task.text}"`);
              
              const overdueNotification: SimpleNotification = {
                taskId: task.id,
                userId: userId,
                userEmail: email,
                userName: userName,
                taskTitle: task.text,
                dueDate: task.dueDate,
                notificationType: 'overdue',
                scheduledFor: now.toISOString(),
                status: 'pending',
                createdAt: now.toISOString()
              };
              
              await sendSimpleNotification(overdueNotification);
              
              // Mark as sent in database
              await addDoc(collection(db, 'simple_notifications'), {
                ...overdueNotification,
                status: 'sent',
                sentAt: now.toISOString(),
                intervalLabel: task.intervalLabel
              });
              
              console.log(`✅ Overdue notification sent successfully to ${userName} (${email}) for task: "${task.text}"`);
            } catch (error: any) {
              if (error.code !== 'EAUTH' && error.responseCode !== 535) {
                console.error(`❌ Failed to send overdue notification to ${userName} (${email}) for task "${task.text}":`, error);
              }
            }
          } else {
            console.log(`⏭️ Skipping task "${task.text}" - invalid email: ${email}`);
          }
        } else {
          console.log(`⏭️ Skipping task "${task.text}" - ${task.intervalLabel} overdue notification already sent`);
        }
      }
    }
    
    if (scheduledNotifications.length === 0 && overdueTasks.length === 0) {
      console.log('✅ No notifications due at this time');
    } else {
      console.log('✅ All notifications processed');
    }
  } catch (error) {
    console.error('❌ Error processing due notifications:', error);
  }
}

/**
 * Schedule notifications for a new task
 */
export async function scheduleNotificationsForTask(
  taskId: string,
  userId: string,
  userEmail: string,
  userName: string,
  taskTitle: string,
  dueDate: string
): Promise<void> {
  if (!dueDate) {
    console.log(`⏭️ No due date for task "${taskTitle}", skipping notifications`);
    return;
  }
  
  try {
    console.log(`📅 Scheduling notifications for task: ${taskTitle}`);
    
    const dueDateObj = new Date(dueDate);
    const now = new Date();
    
    // Schedule reminders BEFORE due date: 1hr 45min, 30min, 15min, 5min
    const reminderTimes = [
      { minutes: 105, label: '1hr 45min' }, // 1 hour 45 minutes = 105 minutes
      { minutes: 30, label: '30min' },
      { minutes: 15, label: '15min' },
      { minutes: 5, label: '5min' }
    ];
    
    for (const { minutes, label } of reminderTimes) {
      const reminderTime = new Date(dueDateObj);
      reminderTime.setMinutes(reminderTime.getMinutes() - minutes);
      
      if (reminderTime > now) {
        await scheduleTaskNotification(
          taskId,
          userId,
          userEmail,
          userName,
          taskTitle,
          dueDate,
          'reminder',
          reminderTime
        );
        console.log(`✅ Scheduled ${label} reminder for task: ${taskTitle}`);
      }
    }
    
    // Schedule overdue notifications AFTER due date: 15min, 30min, 1hr
    const overdueTimes = [
      { minutes: 15, label: '15min' },
      { minutes: 30, label: '30min' },
      { minutes: 60, label: '1hr' }
    ];
    
    for (const { minutes, label } of overdueTimes) {
      const overdueTime = new Date(dueDateObj);
      overdueTime.setMinutes(overdueTime.getMinutes() + minutes);
      
      await scheduleTaskNotification(
        taskId,
        userId,
        userEmail,
        userName,
        taskTitle,
        dueDate,
        'overdue',
        overdueTime
      );
      console.log(`✅ Scheduled ${label} overdue notification for task: ${taskTitle}`);
    }
    
    console.log(`✅ All notifications scheduled for task: ${taskTitle}`);
  } catch (error) {
    console.error('❌ Error scheduling notifications for task:', error);
  }
}

/**
 * Schedule notifications for a day-of-week task
 * Notifications: 1hr before, 30min, 15min, 10min, 5min, exact time, 10min overdue, 30min, 1hr, 1.5hr
 */
export async function scheduleDayOfWeekTaskNotifications(
  taskId: string,
  userId: string,
  userEmail: string,
  userName: string,
  taskTitle: string,
  availableDays: number[],
  availableDaysTime: string,
  userTimezone: string,
  repeatWeeks?: number,
  repeatStartDate?: string
): Promise<void> {
  if (!availableDays || availableDays.length === 0) {
    console.log(`⏭️ No available days for task "${taskTitle}", skipping notifications`);
    return;
  }
  
  // If no time is specified, skip notifications (user can complete task anytime during the day)
  if (!availableDaysTime || availableDaysTime.trim() === '') {
    console.log(`⏭️ No time specified for task "${taskTitle}", skipping notifications (task available all day)`);
    return;
  }
  
  try {
    console.log(`📅 Scheduling day-of-week notifications for task: ${taskTitle}`);
    console.log(`   Days: ${availableDays.join(', ')}, Time: ${availableDaysTime}, Timezone: ${userTimezone}`);
    if (repeatWeeks) {
      console.log(`   Repeat limit: ${repeatWeeks} weeks${repeatStartDate ? ` (started: ${repeatStartDate})` : ''}`);
    }
    
    const now = new Date();
    const startDate = repeatStartDate ? new Date(repeatStartDate) : now;
    const endDate = repeatWeeks ? new Date(startDate.getTime() + repeatWeeks * 7 * 24 * 60 * 60 * 1000) : null;
    
    // Parse time (HH:mm format)
    const [hours, minutes] = availableDaysTime.split(':').map(Number);
    
    // For each available day, schedule notifications for occurrences within the repeat limit
    for (const dayOfWeek of availableDays) {
      // Calculate all occurrences within the repeat period (or just next occurrence if no limit)
      let weekOffset = 0;
      let hasMoreOccurrences = true;
      
      while (hasMoreOccurrences) {
        // Calculate occurrence for this week offset
        const occurrence = getNextDayOfWeekWithOffset(dayOfWeek, hours, minutes, userTimezone, weekOffset, startDate);
        
        if (!occurrence) {
          hasMoreOccurrences = false;
          break;
        }
        
        // Check if this occurrence is within the repeat limit
        if (endDate && occurrence > endDate) {
          console.log(`   ⏭️ Occurrence ${occurrence.toISOString()} is beyond repeat limit (${endDate.toISOString()}), stopping`);
          hasMoreOccurrences = false;
          break;
        }
        
        // Only schedule if occurrence is in the future
        if (occurrence <= now) {
          weekOffset++;
          continue;
        }
        
        console.log(`   Next occurrence for day ${dayOfWeek} (week ${weekOffset}): ${occurrence.toISOString()}`);
        
        // Schedule reminders BEFORE: 1hr, 30min, 15min, 10min, 5min
        const reminderTimes = [
          { minutes: 60, label: '1hr' },
          { minutes: 30, label: '30min' },
          { minutes: 15, label: '15min' },
          { minutes: 10, label: '10min' },
          { minutes: 5, label: '5min' }
        ];
        
        for (const { minutes: mins, label } of reminderTimes) {
          const reminderTime = new Date(occurrence);
          reminderTime.setMinutes(reminderTime.getMinutes() - mins);
          
          if (reminderTime > now) {
            await scheduleTaskNotification(
              taskId,
              userId,
              userEmail,
              userName,
              taskTitle,
              occurrence.toISOString(),
              'reminder',
              reminderTime
            );
            console.log(`   ✅ Scheduled ${label} reminder for day ${dayOfWeek} (week ${weekOffset})`);
          }
        }
        
        // Schedule exact time notification
        if (occurrence > now) {
          await scheduleTaskNotification(
            taskId,
            userId,
            userEmail,
            userName,
            taskTitle,
            occurrence.toISOString(),
            'reminder',
            occurrence
          );
          console.log(`   ✅ Scheduled exact time notification for day ${dayOfWeek} (week ${weekOffset})`);
        }
        
        // Schedule overdue notifications AFTER: 10min, 30min, 1hr, 1.5hr
        const overdueTimes = [
          { minutes: 10, label: '10min' },
          { minutes: 30, label: '30min' },
          { minutes: 60, label: '1hr' },
          { minutes: 90, label: '1.5hr' }
        ];
        
        for (const { minutes: mins, label } of overdueTimes) {
          const overdueTime = new Date(occurrence);
          overdueTime.setMinutes(overdueTime.getMinutes() + mins);
          
          await scheduleTaskNotification(
            taskId,
            userId,
            userEmail,
            userName,
            taskTitle,
            occurrence.toISOString(),
            'overdue',
            overdueTime
          );
          console.log(`   ✅ Scheduled ${label} overdue notification for day ${dayOfWeek} (week ${weekOffset})`);
        }
        
        // If no repeat limit, only schedule the next occurrence
        if (!repeatWeeks) {
          hasMoreOccurrences = false;
        } else {
          weekOffset++;
          // Stop if we've scheduled enough weeks (limit to prevent infinite loops)
          if (weekOffset >= repeatWeeks * 2) {
            hasMoreOccurrences = false;
          }
        }
      }
    }
    
    console.log(`✅ All day-of-week notifications scheduled for task: ${taskTitle}`);
  } catch (error) {
    console.error('❌ Error scheduling day-of-week notifications for task:', error);
  }
}

/**
 * Get the next occurrence of a specific day of week at a specific time in user's timezone
 */
function getNextDayOfWeek(dayOfWeek: number, hours: number, minutes: number, userTimezone: string): Date | null {
  return getNextDayOfWeekWithOffset(dayOfWeek, hours, minutes, userTimezone, 0, new Date());
}

/**
 * Get occurrence of a specific day of week with a week offset from a start date
 */
function getNextDayOfWeekWithOffset(
  dayOfWeek: number, 
  hours: number, 
  minutes: number, 
  userTimezone: string,
  weekOffset: number,
  startDate: Date
): Date | null {
  try {
    // Get the day of week for the start date
    const startDay = startDate.getDay();
    
    // Calculate days until the target day of week in the target week
    let daysUntil = dayOfWeek - startDay;
    if (daysUntil < 0) {
      daysUntil += 7; // Next week
    }
    
    // Add the week offset
    daysUntil += weekOffset * 7;
    
    // Create date for the occurrence
    const occurrenceDate = new Date(startDate);
    occurrenceDate.setDate(occurrenceDate.getDate() + daysUntil);
    occurrenceDate.setHours(hours, minutes, 0, 0);
    
    return occurrenceDate;
  } catch (error) {
    console.error('❌ Error calculating day of week with offset:', error);
    return null;
  }
}
