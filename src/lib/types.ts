
export type Task = {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  availableDays?: number[]; // Days of week when task is available (0=Sunday, 1=Monday, ..., 6=Saturday)
  availableDaysTime?: string; // Time for day-of-week tasks (HH:mm format, e.g., "09:00")
  repeatWeeks?: number; // Number of weeks to repeat (e.g., 1, 2, 3). If undefined, repeats indefinitely
  repeatStartDate?: string; // ISO date string when the repeat period started (used to calculate if repeat limit is reached)
  description?: string;
  tags?: string[]; // Tags for categorizing tasks
  tagColors?: Record<string, string>; // Map of tag -> color (e.g., {"work": "blue", "urgent": "red"})
  starred?: boolean; // Star important tasks
  userTimezone?: string; // User's timezone when task was created
  userId?: string; // User ID who owns the task
  userEmail?: string; // User email for notifications
  userName?: string; // User name for notifications
  columnId?: string; // Custom column ID for the task
  attachments?: TaskAttachment[]; // File attachments
  isRoutine?: boolean; // Whether this task is part of a routine
  routineId?: string; // ID of the routine this task belongs to
};

export type TaskAttachment = {
  id: string;
  fileName: string;
  fileType: string; // MIME type
  fileUrl: string; // Data URL or Firebase Storage URL
  fileSize: number; // in bytes
  uploadedAt: string;
};

export type KanbanColumn = {
  id: string;
  title: string;
  icon: string; // Icon name from lucide-react
  color: string; // Tailwind color class (e.g., 'text-blue-500')
  order: number; // Display order
  isDefault?: boolean; // Cannot be deleted if true
};

export type TaskFile = {
  id: string;
  taskId: string;
  fileName: string;
  fileType: string; // 'image', 'pdf', 'doc', etc.
  fileUrl: string; // Firebase Storage URL
  uploadedAt: string;
  extractedText?: string; // OCR/parsed content
  tags?: string[]; // AI-generated tags
  summary?: string; // AI-generated summary
};

export type UserPreferences = {
  userId: string;
  notificationChannels: ('email' | 'discord')[];
  preferredReminderTime?: string; // e.g., "1 hour before"
  workPatterns?: {
    averageCompletionTime: number;
    preferredWorkHours: { start: number; end: number };
    taskCategories: Record<string, number>; // category -> frequency
  };
};

export type AIMemory = {
  userId: string;
  conversationHistory: Message[];
  contextSummary: string; // Periodic summary of recent conversations
  ongoingProjects: string[]; // List of active project names
  lastUpdated: string;
};

export type Message = {
  role: 'user' | 'assistant';
  content: string | { text: string }[];
};

export type GeneratedCode = {
  html: string;
  css: string;
  js: string;
};

export type Tool = {
  id:string;
  name: string;
  code: GeneratedCode;
  isPremade?: boolean;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  isFavorite: boolean;
};

// Routines System Types
export type Routine = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  taskIds: string[]; // IDs of tasks in this routine
  createdAt: string;
  updatedAt: string;
  isActive: boolean; // Can be temporarily disabled
};

export type RoutineTask = Task & {
  routineId: string;
  completedToday: boolean;
  lastCompletedAt?: string;
  resetTime: string; // Time when task resets (default "00:00")
  completedBeforeBonus?: boolean; // Completed before 7 AM bonus time
};

// Credits System Types
export type UserCredits = {
  userId: string;
  totalCredits: number;
  dailyStreak: number; // Consecutive days of routine completion
  lastEarnedAt?: string;
  bonusMultiplier: number; // Multiplier based on streak
  createdAt: string;
  updatedAt: string;
};

export type CreditTransaction = {
  id: string;
  userId: string;
  amount: number; // Positive for earning, negative for spending
  type: 'earn' | 'spend' | 'bonus' | 'streak';
  reason: string; // Description of why credits were earned/spent
  taskId?: string; // Related task if applicable
  routineId?: string; // Related routine if applicable
  timestamp: string;
};

// Tutorial System Types
export type Tutorial = {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  steps: TutorialStep[];
  targetPage: string; // Page where tutorial runs (e.g., '/tasks', '/assistant')
  estimatedTime: string; // e.g., "2 min"
  category: 'getting-started' | 'features' | 'advanced';
};

export type TutorialStep = {
  id: string;
  title: string;
  description: string;
  targetElement?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'; // Tooltip position
  action?: 'click' | 'input' | 'scroll' | 'wait'; // Required action to proceed
  highlightPadding?: number; // Padding around highlighted element
  showSkip?: boolean; // Allow skipping this step
};

export type UserTutorialProgress = {
  userId: string;
  completedTutorials: string[]; // Array of completed tutorial IDs
  currentTutorial?: string; // Currently active tutorial
  currentStep?: number; // Current step in active tutorial
  lastTutorialAt?: string;
  hasCompletedOnboarding: boolean;
};

// Achievements System Types
export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number; // Number needed to unlock (e.g., 1 task, 100 tasks)
  category: 'tasks' | 'routines' | 'streak' | 'special';
  unlockedAt?: string; // Timestamp when unlocked
};

export type UserAchievements = {
  userId: string;
  unlockedAchievements: string[]; // Array of achievement IDs
  allAchievementsCompleted: boolean; // True when all achievements are unlocked
  allAchievementsCompletedAt?: string; // Timestamp when all achievements were completed
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
};

// Collaboration System Types
export type Collaboration = {
  id: string;
  name: string;
  description?: string;
  ownerId: string; // Creator is always owner
  createdAt: string;
  updatedAt: string;
  companion?: CollabCompanion; // Optional AI companion
  settings?: CollabSettings;
};

export type CollabCompanion = {
  enabled: boolean;
  personality?: string; // User-defined personality description
  icon?: string; // Custom icon URL (default: lunchbox-ai-logo)
  name?: string; // Custom name for the companion
};

export type CollabSettings = {
  privacy: 'private' | 'public'; // Who can join
  allowInvites: boolean; // Can members invite others
  defaultRole: string; // Default role for new members
};

export type CollabMember = {
  id: string;
  collabId: string;
  userId: string;
  email: string;
  displayName?: string;
  discordUsername?: string;
  roleId: string; // Reference to role
  joinedAt: string;
  invitedBy?: string; // User ID who invited
  status: 'pending' | 'active' | 'left'; // Invitation status
};

export type CollabInvite = {
  id: string;
  collabId: string;
  code: string; // Unique invite code (e.g., "abc123")
  createdBy: string; // User ID who created the invite
  createdAt: string;
  expiresAt?: string; // Optional expiration date
  maxUses?: number; // Optional max number of uses
  uses: number; // Current number of uses
  roleId: string; // Role to assign when joining via this invite
  isActive: boolean; // Can be revoked
};

export type CollabRole = {
  id: string;
  collabId: string;
  name: string;
  description?: string;
  permissions: CollabPermission[];
  isTemplate: boolean; // If true, it's a template role
  isDefault: boolean; // Default role for new members
  createdAt: string;
  createdBy: string;
};

export type CollabPermission = 
  | 'view_tasks'
  | 'create_tasks'
  | 'edit_tasks'
  | 'delete_tasks'
  | 'view_projects'
  | 'create_projects'
  | 'edit_projects'
  | 'delete_projects'
  | 'manage_members'
  | 'manage_roles'
  | 'manage_settings'
  | 'view_chat'
  | 'send_messages'
  | 'manage_companion';

export type CollabTask = Task & {
  collabId: string;
  createdBy: string; // User ID who created
  assignedTo?: string[]; // Array of user IDs
  isShared: boolean; // If true, appears in main task list with marker
  sharedAt?: string; // When it was shared to main list
};

export type CollabProject = Project & {
  collabId: string;
  createdBy: string;
  members: string[]; // User IDs
};

export type CollabMessage = {
  id: string;
  collabId: string;
  userId: string; // null if from companion
  userName: string;
  userAvatar?: string;
  content: string;
  isCompanion: boolean; // If true, message is from AI companion
  createdAt: string;
  editedAt?: string;
  attachments?: CollabMessageAttachment[];
};

export type CollabMessageAttachment = {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
};

// Role Templates
export const ROLE_TEMPLATES: Omit<CollabRole, 'id' | 'collabId' | 'createdAt' | 'createdBy'>[] = [
  {
    name: 'Owner',
    description: 'Full access to everything',
    permissions: [
      'view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks',
      'view_projects', 'create_projects', 'edit_projects', 'delete_projects',
      'manage_members', 'manage_roles', 'manage_settings',
      'view_chat', 'send_messages', 'manage_companion'
    ],
    isTemplate: true,
    isDefault: false,
  },
  {
    name: 'Admin',
    description: 'Can manage members and tasks',
    permissions: [
      'view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks',
      'view_projects', 'create_projects', 'edit_projects', 'delete_projects',
      'manage_members',
      'view_chat', 'send_messages'
    ],
    isTemplate: true,
    isDefault: false,
  },
  {
    name: 'Member',
    description: 'Can create and edit tasks',
    permissions: [
      'view_tasks', 'create_tasks', 'edit_tasks',
      'view_projects', 'create_projects', 'edit_projects',
      'view_chat', 'send_messages'
    ],
    isTemplate: true,
    isDefault: true,
  },
  {
    name: 'Viewer',
    description: 'Read-only access',
    permissions: [
      'view_tasks',
      'view_projects',
      'view_chat'
    ],
    isTemplate: true,
    isDefault: false,
  },
];
