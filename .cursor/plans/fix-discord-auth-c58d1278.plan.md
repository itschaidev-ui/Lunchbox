<!-- c58d1278-25de-4066-bdd8-148150f9d67d 8a05e684-43ee-4df4-ae36-f1adc900b51a -->
# AI Task Management & Upload System - Implementation Plan

## Overview

Transform the existing Lunchbox AI assistant into an intelligent task management system that understands file uploads, asks smart follow-up questions, sends notifications via Gmail/Discord, and learns from user behavior.

## Phase 1: Core Infrastructure & File Upload System

### 1.1 Database Schema Extensions

**Files to modify:**

- `src/lib/types.ts` - Add new types for files, user preferences, and AI memory
- `src/lib/firebase-tasks.ts` - Add Firebase Storage integration

**New types needed:**

```typescript
type TaskFile = {
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

type UserPreferences = {
  userId: string;
  notificationChannels: ('email' | 'discord')[];
  preferredReminderTime?: string; // e.g., "1 hour before"
  workPatterns?: {
    averageCompletionTime: number;
    preferredWorkHours: { start: number; end: number };
    taskCategories: Record<string, number>; // category -> frequency
  };
};

type AIMemory = {
  userId: string;
  conversationHistory: Message[];
  contextSummary: string; // Periodic summary of recent conversations
  ongoingProjects: string[]; // List of active project names
  lastUpdated: string;
};
```

### 1.2 Firebase Storage Setup

**New file:** `src/lib/firebase-storage.ts`

- Initialize Firebase Storage
- Upload file function with progress tracking
- Download/retrieve file URLs
- Delete file function
- File type validation (max 10MB, allowed types: images, PDFs, docs)

### 1.3 File Upload UI Component

**New file:** `src/components/assistant/file-upload.tsx`

- Drag-and-drop zone
- File preview (images, PDF thumbnails)
- Upload progress indicator
- File list with remove option
- Integration with chat interface

## Phase 2: Intelligent Content Analysis

### 2.1 OCR & Document Parsing Service

**New file:** `src/lib/ai/document-analyzer.ts`

- Use Google Cloud Vision API for OCR (already have Gemini API)
- PDF text extraction using `pdf-parse` library
- Image analysis using Gemini Vision
- Document summarization
- Auto-tagging based on content

**Key functions:**

```typescript
async function analyzeUploadedFile(fileUrl: string, fileType: string): Promise<{
  extractedText: string;
  summary: string;
  suggestedTags: string[];
  detectedTaskItems?: string[]; // e.g., "homework due Friday"
}>;
```

### 2.2 Enhanced AI Chat Flow

**Files to modify:**

- `src/ai/flows/chat.ts` - Extend to handle file context

**New capabilities:**

- Include uploaded file content in conversation context
- Reference files by name in conversation
- Suggest tasks based on file content
- Ask clarifying questions about uploaded documents

## Phase 3: Context-Aware Task Creation

### 3.1 Smart Task Creation Logic

**New file:** `src/lib/ai/task-intelligence.ts`

**Features:**

- **Missing Info Detection:** Check if task has title, due date, description
- **Contextual Follow-ups:** Generate relevant questions based on task type
- **Smart Scheduling:** Parse natural language dates ("next Friday", "in 3 days")
- **Workload Balancing:** Check existing tasks and suggest better dates
- **Task Clarity Check:** Summarize and confirm task details before saving

**Example flow:**

```typescript
async function createIntelligentTask(
  userInput: string,
  uploadedFiles: TaskFile[],
  conversationHistory: Message[],
  existingTasks: Task[]
): Promise<{
  task: Partial<Task>;
  followUpQuestions?: string[];
  suggestions?: string[];
}>;
```

### 3.2 AI Conversation Memory

**New file:** `src/lib/ai/memory-manager.ts`

- Store conversation summaries in Firestore
- Retrieve relevant context for new conversations
- Track ongoing projects and references
- Clean up old memories (keep last 30 days)

## Phase 4: Notification System

### 4.1 Gmail Integration

**New files:**

- `src/lib/notifications/gmail-service.ts`
- `src/app/api/notifications/email/route.ts`

**Setup:**

- Use `nodemailer` (already installed) with Gmail SMTP
- Create email templates for reminders
- Add "mark as done" and "snooze" links in emails
- Handle email webhook responses

**Email template example:**

```
Subject: ⏰ Task Due Soon: [Task Name]

Hey there!

Your task "[Task Name]" is due today at [Time].

[Task Description]

Quick Actions:
- Mark as Done: [link]
- Snooze 30 minutes: [link]
- View all tasks: [link]

- Lunchbox AI
```

### 4.2 Discord Bot Integration

**New files:**

- `src/lib/notifications/discord-service.ts`
- `src/app/api/notifications/discord/route.ts`

**Setup:**

- Use Discord webhook or bot API
- Send DM reminders to users
- Allow slash commands: `/tasks`, `/done [task]`, `/snooze [time]`
- Interactive buttons for task actions

### 4.3 Smart Reminder Scheduler

**New file:** `src/lib/notifications/reminder-scheduler.ts`

- Cron job or scheduled function to check due tasks
- Learn user patterns (when they usually complete tasks)
- Adjust reminder timing based on urgency and user behavior
- Batch notifications to avoid spam

## Phase 5: Intelligence & Learning Features

### 5.1 User Pattern Analysis

**New file:** `src/lib/ai/pattern-analyzer.ts`

**Track and learn:**

- Preferred reminder times (analyze when users mark tasks as done)
- Task completion patterns (how long different task types take)
- Common task categories (auto-suggest categories)
- Deadline preferences (morning/evening)

### 5.2 Adaptive Questioning

**Enhance:** `src/ai/flows/chat.ts`

**Add logic for:**

- Direct questions when info is clearly missing
- Suggestive questions when info is uncertain
- Learn from user corrections and preferences
- Adjust tone based on urgency detection

### 5.3 Multi-Modal Understanding

**Enhance:** `src/lib/ai/document-analyzer.ts`

**Capabilities:**

- Understand tables and charts in images
- Extract structured data (dates, names, numbers)
- Connect visual content to text conversations
- Auto-create tasks from screenshot content

### 5.4 Emotional Awareness (Optional)

**New file:** `src/lib/ai/sentiment-analyzer.ts`

- Detect urgency/stress in user messages
- Adjust AI tone accordingly
- Offer to break down overwhelming tasks
- Provide encouraging messages

## Phase 6: UI/UX Enhancements

### 6.1 Enhanced Assistant Interface

**Files to modify:**

- `src/app/assistant/page.tsx`
- `src/components/assistant/assistant-sidebar.tsx`
- `src/components/assistant/prompt-form.tsx`

**Add:**

- File upload button and drag-drop zone
- File preview cards in chat
- "AI is analyzing..." loading state for uploads
- Smart suggestion chips (e.g., "Set reminder", "Add to calendar")

### 6.2 Task Detail View

**New component:** `src/components/tasks/task-detail-modal.tsx`

- Show attached files
- Display AI-generated summary
- Show related tasks
- Notification preferences per task

### 6.3 Settings Page Extensions

**Modify:** `src/app/settings/page.tsx`

**Add sections:**

- Notification preferences (email/Discord setup)
- AI behavior settings (tone, verbosity)
- Privacy settings (data retention)
- Connected accounts (Gmail, Discord)

## Phase 7: API Routes & Webhooks

### 7.1 File Upload API

**New file:** `src/app/api/upload/route.ts`

- Handle file uploads to Firebase Storage
- Trigger document analysis
- Return file metadata and analysis results

### 7.2 Notification Webhook Handlers

**New files:**

- `src/app/api/webhooks/email-action/route.ts` - Handle email link clicks
- `src/app/api/webhooks/discord-command/route.ts` - Handle Discord bot commands

### 7.3 AI Analysis API

**New file:** `src/app/api/ai/analyze/route.ts`

- Endpoint for on-demand file analysis
- Batch analysis for multiple files
- Re-analyze with different parameters

## Implementation Priority (MVP First)

### MVP Features (Start Here):

1. **File Upload System** (Phase 1.2, 1.3)

   - Basic upload to Firebase Storage
   - Display uploaded files in chat

2. **Simple OCR/Text Extraction** (Phase 2.1 - basic version)

   - Use Gemini Vision for images
   - Basic PDF text extraction

3. **Context-Aware Task Creation** (Phase 3.1 - core features)

   - Ask for missing due date
   - Parse natural language dates
   - Confirm task details before saving

4. **Email Notifications** (Phase 4.1 - basic version)

   - Simple reminder emails
   - No interactive links initially

### Future Enhancements:

5. Discord integration (Phase 4.2)
6. Advanced learning/patterns (Phase 5)
7. Emotional awareness (Phase 5.4)
8. Full interactive notifications (Phase 4 - complete)

## Technical Dependencies

### New packages to install:

```bash
npm install pdf-parse sharp discord.js node-cron
```

### Environment variables needed:

```
GEMINI_API_KEY=<existing>
GMAIL_USER=<your-email>
GMAIL_APP_PASSWORD=<app-specific-password>
DISCORD_BOT_TOKEN=<bot-token>
DISCORD_WEBHOOK_URL=<webhook-url>
```

## Database Collections

### New Firestore collections:

- `task_files` - Uploaded files metadata
- `user_preferences` - Notification and AI settings
- `ai_memory` - Conversation context and summaries
- `notification_queue` - Pending notifications to send
- `user_patterns` - Learned behavior patterns

## Success Metrics

After implementation, the system should:

- ✅ Accept and analyze uploaded files (images, PDFs, docs)
- ✅ Extract text and suggest tasks from uploads
- ✅ Ask intelligent follow-up questions when task info is incomplete
- ✅ Send timely email notifications with task reminders
- ✅ Parse natural language dates ("tomorrow", "next Friday")
- ✅ Remember conversation context across sessions
- ✅ Learn user patterns over time (future enhancement)
- ✅ Integrate with Discord (future enhancement)

### To-dos

- [ ] Create use-media-query and use-navbar-ai hooks for responsive sizing and AI suggestions
- [ ] Create BadgeIndicator component for notification badges
- [ ] Reduce button sizes and padding for more compact navbar
- [ ] Add gradient colors to navbar container and buttons with animations
- [ ] Implement time-based dynamic color schemes
- [ ] Integrate AI-powered context-aware suggestions and badges
- [ ] Add notification badges to Tasks and Message buttons
- [ ] Create navbar customization panel in Settings page
- [ ] Create navbar settings context and persistence layer
- [ ] Optimize with memoization, debouncing, and CSS optimizations
- [ ] 