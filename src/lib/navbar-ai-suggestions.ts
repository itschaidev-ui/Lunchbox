'use client';

export interface NavbarSuggestion {
  text: string;
  type: 'task' | 'message' | 'greeting' | 'reminder';
  priority: 'high' | 'medium' | 'low';
}

export function generateTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 6) {
    return 'Good night!';
  } else if (hour < 12) {
    return 'Good morning!';
  } else if (hour < 17) {
    return 'Good afternoon!';
  } else if (hour < 22) {
    return 'Good evening!';
  } else {
    return 'Good night!';
  }
}

export function getTimeBasedColors() {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) {
    // Morning: Blue-purple gradients
    return {
      primary: 'from-blue-400 to-purple-500',
      secondary: 'from-blue-300 to-purple-400',
      accent: 'from-blue-500 to-purple-600'
    };
  } else if (hour >= 12 && hour < 18) {
    // Afternoon: Orange-pink gradients
    return {
      primary: 'from-orange-400 to-pink-500',
      secondary: 'from-orange-300 to-pink-400',
      accent: 'from-orange-500 to-pink-600'
    };
  } else if (hour >= 18 && hour < 24) {
    // Evening: Purple-indigo gradients
    return {
      primary: 'from-purple-400 to-indigo-500',
      secondary: 'from-purple-300 to-indigo-400',
      accent: 'from-purple-500 to-indigo-600'
    };
  } else {
    // Night: Dark blue-teal gradients
    return {
      primary: 'from-blue-600 to-teal-500',
      secondary: 'from-blue-500 to-teal-400',
      accent: 'from-blue-700 to-teal-600'
    };
  }
}

export function generateSmartSuggestions(
  dueTasks: number,
  incompleteTasks: number,
  savedChats: number
): NavbarSuggestion[] {
  const suggestions: NavbarSuggestion[] = [];

  if (dueTasks > 0) {
    suggestions.push({
      text: `${dueTasks} tasks due today`,
      type: 'task',
      priority: 'high'
    });
  }

  if (incompleteTasks > 5) {
    suggestions.push({
      text: `${incompleteTasks} pending tasks`,
      type: 'task',
      priority: 'medium'
    });
  }

  if (savedChats > 0) {
    suggestions.push({
      text: `${savedChats} saved conversations`,
      type: 'message',
      priority: 'low'
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      text: generateTimeBasedGreeting(),
      type: 'greeting',
      priority: 'low'
    });
  }

  return suggestions;
}
