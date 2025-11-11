import type { Task } from '@/lib/types';

interface NotificationData {
  userId: string;
  userEmail: string;
  userName?: string;
  type: 'task_reminder' | 'daily_summary' | 'overdue_alert';
  task?: Task;
  tasks?: Task[];
  completedTasks?: Task[];
}

interface WebhookResponse {
  success: boolean;
  message: string;
  notificationId?: string;
}

class WebhookNotificationService {
  private webhookUrl: string | null = null;

  constructor() {
    this.initializeWebhook();
  }

  private initializeWebhook() {
    // Try to get webhook URL from environment
    this.webhookUrl = process.env.WEBHOOK_URL || null;
    
    if (!this.webhookUrl) {
      console.warn('Webhook URL not configured. Notifications will be logged only.');
    } else {
      console.log('Webhook notification service initialized');
    }
  }

  /**
   * Send notification via webhook or log it
   */
  async sendNotification(data: NotificationData): Promise<boolean> {
    try {
      if (this.webhookUrl) {
        return await this.sendWebhookNotification(data);
      } else {
        return await this.logNotification(data);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send notification via webhook
   */
  private async sendWebhookNotification(data: NotificationData): Promise<boolean> {
    try {
      const response = await fetch(this.webhookUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
          source: 'lunchbox-ai'
        })
      });

      if (response.ok) {
        const result: WebhookResponse = await response.json();
        console.log('Webhook notification sent:', result);
        return result.success;
      } else {
        console.error('Webhook request failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Webhook request error:', error);
      return false;
    }
  }

  /**
   * Log notification (fallback when no webhook)
   */
  private async logNotification(data: NotificationData): Promise<boolean> {
    const notification = this.formatNotification(data);
    console.log('📧 NOTIFICATION:', notification);
    
    // In a real app, you might want to store this in a database
    // or send to a logging service
    return true;
  }

  /**
   * Format notification for display/logging
   */
  private formatNotification(data: NotificationData): string {
    const { userEmail, userName, type, task, tasks, completedTasks } = data;
    const user = userName || userEmail.split('@')[0];
    
    switch (type) {
      case 'task_reminder':
        if (!task) return `Reminder for ${user} (${userEmail})`;
        return `📧 Task Reminder for ${user} (${userEmail}): "${task.text}" - Due: ${task.dueDate || 'No due date'}`;
        
      case 'daily_summary':
        const pendingCount = tasks?.filter(t => !t.completed).length || 0;
        const completedCount = completedTasks?.length || 0;
        return `📧 Daily Summary for ${user} (${userEmail}): ${completedCount} completed, ${pendingCount} pending tasks`;
        
      case 'overdue_alert':
        const overdueCount = tasks?.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length || 0;
        return `📧 Overdue Alert for ${user} (${userEmail}): ${overdueCount} overdue tasks`;
        
      default:
        return `📧 Notification for ${user} (${userEmail}): ${type}`;
    }
  }

  /**
   * Test webhook connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.webhookUrl) {
      console.log('Webhook not configured - using log-only mode');
      return true; // Log-only mode is always "working"
    }

    try {
      const testData: NotificationData = {
        userId: 'test',
        userEmail: 'test@example.com',
        type: 'daily_summary',
        tasks: [],
        completedTasks: []
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testData,
          timestamp: new Date().toISOString(),
          source: 'lunchbox-ai',
          test: true
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Webhook test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const webhookNotificationService = new WebhookNotificationService();
export default webhookNotificationService;
