import type { Task } from '@/lib/types';

export interface ExportOptions {
  includeCompleted?: boolean;
  includeMetadata?: boolean;
  format?: 'json' | 'csv';
}

export function exportTasks(tasks: Task[], options: ExportOptions = {}): string {
  const {
    includeCompleted = true,
    includeMetadata = true,
    format = 'json',
  } = options;

  let filteredTasks = tasks;
  if (!includeCompleted) {
    filteredTasks = tasks.filter(t => !t.completed);
  }

  if (format === 'csv') {
    return exportToCSV(filteredTasks, includeMetadata);
  }

  return exportToJSON(filteredTasks, includeMetadata);
}

function exportToJSON(tasks: Task[], includeMetadata: boolean): string {
  const data = tasks.map(task => {
    const base = {
      text: task.text,
      description: task.description || '',
      completed: task.completed,
      dueDate: task.dueDate || '',
      tags: task.tags || [],
      starred: task.starred || false,
    };

    if (includeMetadata) {
      return {
        ...base,
        id: task.id,
        createdAt: task.createdAt?.toISOString() || '',
        updatedAt: task.updatedAt?.toISOString() || '',
      };
    }

    return base;
  });

  return JSON.stringify(data, null, 2);
}

function exportToCSV(tasks: Task[], includeMetadata: boolean): string {
  const headers = ['Text', 'Description', 'Completed', 'Due Date', 'Tags', 'Starred'];
  if (includeMetadata) {
    headers.push('ID', 'Created At', 'Updated At');
  }

  const rows = tasks.map(task => {
    const row = [
      `"${task.text.replace(/"/g, '""')}"`,
      `"${(task.description || '').replace(/"/g, '""')}"`,
      task.completed ? 'Yes' : 'No',
      task.dueDate || '',
      (task.tags || []).join('; '),
      task.starred ? 'Yes' : 'No',
    ];

    if (includeMetadata) {
      row.push(
        task.id,
        task.createdAt?.toISOString() || '',
        task.updatedAt?.toISOString() || ''
      );
    }

    return row.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function importTasks(jsonData: string): Task[] {
  try {
    const data = JSON.parse(jsonData);
    const tasks = Array.isArray(data) ? data : [data];

    return tasks.map((task, index) => ({
      id: task.id || `imported-${Date.now()}-${index}`,
      text: task.text || '',
      description: task.description || '',
      completed: task.completed || false,
      dueDate: task.dueDate || undefined,
      tags: task.tags || [],
      starred: task.starred || false,
      createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
      updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
    }));
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

