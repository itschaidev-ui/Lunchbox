'use client';

import { useState, useEffect } from 'react';
import { useTasks } from '@/context/task-context';
import { useChat } from '@/context/chat-context';

export function useNavbarAI() {
  const { tasks } = useTasks();
  const { savedChats } = useChat();
  const [suggestion, setSuggestion] = useState<string>('');
  const [timeGreeting, setTimeGreeting] = useState<string>('');

  // Get time-based greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setTimeGreeting('Good morning!');
    } else if (hour < 17) {
      setTimeGreeting('Good afternoon!');
    } else {
      setTimeGreeting('Good evening!');
    }
  }, []);

  // Check for due tasks today
  const isDueToday = (dueDate?: string) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due.toDateString() === today.toDateString();
  };

  // Generate AI suggestions
  useEffect(() => {
    const dueTasks = tasks.filter(t => isDueToday(t.dueDate) && !t.completed).length;
    const incompleteTasks = tasks.filter(t => !t.completed).length;
    const unreadChats = savedChats.length; // Assuming all saved chats are "unread" for now

    if (dueTasks > 0) {
      setSuggestion(`${dueTasks} tasks due today`);
    } else if (incompleteTasks > 0) {
      setSuggestion(`${incompleteTasks} pending tasks`);
    } else if (unreadChats > 0) {
      setSuggestion(`${unreadChats} saved chats`);
    } else {
      setSuggestion(timeGreeting);
    }
  }, [tasks, savedChats, timeGreeting]);

  return { 
    suggestion, 
    timeGreeting,
    dueTasksCount: tasks.filter(t => isDueToday(t.dueDate) && !t.completed).length,
    incompleteTasksCount: tasks.filter(t => !t.completed).length,
    savedChatsCount: savedChats.length
  };
}
