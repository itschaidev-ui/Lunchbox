/**
 * Timezone utilities for handling user timezones in notifications
 */

/**
 * Get the user's timezone offset in minutes
 */
export function getUserTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}

/**
 * Convert a UTC date to user's local time
 */
export function utcToLocal(utcDate: Date): Date {
  const offset = getUserTimezoneOffset();
  return new Date(utcDate.getTime() - (offset * 60 * 1000));
}

/**
 * Convert a local date to UTC
 */
export function localToUtc(localDate: Date): Date {
  const offset = getUserTimezoneOffset();
  return new Date(localDate.getTime() + (offset * 60 * 1000));
}

/**
 * Get the current time in user's timezone
 */
export function getCurrentLocalTime(): Date {
  return new Date();
}

/**
 * Check if a task is due in the user's local timezone
 */
export function isTaskDueInLocalTime(taskDueDate: string): boolean {
  const dueDate = new Date(taskDueDate);
  const now = new Date();
  
  // Compare in local time
  return dueDate <= now;
}

/**
 * Get the time difference in minutes between now and due date in local time
 */
export function getMinutesUntilDue(taskDueDate: string): number {
  const dueDate = new Date(taskDueDate);
  const now = new Date();
  
  return Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60));
}

/**
 * Format a date for display in user's timezone
 */
export function formatDateForUser(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString();
}

/**
 * Create a date in user's local timezone
 */
export function createLocalDate(year: number, month: number, day: number, hours: number = 0, minutes: number = 0): Date {
  return new Date(year, month, day, hours, minutes);
}
