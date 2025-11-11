'use client';

import { Sparkles, CheckSquare, Layout, Palette, Lock, Shield, Trash2, Eye, Video, MessageCircle, RotateCcw, Bell, Trophy, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Changelog() {
  const updates = [
    {
      date: 'November 11, 2025',
      features: [
        { icon: Trophy, text: 'Earn 10–20 randomized credits the first time you complete any task', color: 'text-amber-400' },
        { icon: CheckSquare, text: 'Credit awards are one-time per task (no farming by re-completing)', color: 'text-green-400' },
        { icon: Layout, text: 'Mobile responsiveness improvements across pages (spacing, overflow, touch targets)', color: 'text-teal-400' },
      ]
    },
    {
      date: 'November 6, 2025',
      features: [
        { icon: MessageCircle, text: 'Discord bot can answer task questions (latest completed, nearest deadline, etc.)', color: 'text-blue-400' },
        { icon: RotateCcw, text: 'Task status now cycles through all columns (Queue → In Progress → Done)', color: 'text-cyan-400' },
        { icon: Bell, text: 'Notification cooldown after task completion for reliable delivery', color: 'text-yellow-400' },
        { icon: Trophy, text: 'Achievement system with 500 credits reward for completing all achievements', color: 'text-amber-400' },
        { icon: Zap, text: 'Updated Groq AI model to GPT OSS Safeguard 20B for text generation', color: 'text-purple-400' },
      ]
    },
    {
      date: 'October 31, 2025',
      features: [
        { icon: Video, text: 'Added video demo on landing page', color: 'text-purple-400' },
        { icon: Eye, text: 'Real-time online status tracking', color: 'text-green-400' },
        { icon: Trash2, text: 'Multi-select user deletion in admin', color: 'text-red-400' },
        { icon: Shield, text: 'Voice command lock for specific users', color: 'text-yellow-400' },
      ]
    },
    {
      date: 'October 30, 2025',
      features: [
        { icon: Layout, text: 'Modern admin dashboard redesign', color: 'text-blue-400' },
        { icon: Palette, text: 'Bottom navbar customization (5 variants)', color: 'text-pink-400' },
        { icon: CheckSquare, text: 'Half-filled checkbox for in-progress tasks', color: 'text-orange-400' },
        { icon: Layout, text: 'Kanban board with mobile drag-and-drop', color: 'text-cyan-400' },
      ]
    },
    {
      date: 'October 29, 2025',
      features: [
        { icon: Sparkles, text: 'AI reasoning display in chat', color: 'text-purple-400' },
        { icon: Sparkles, text: 'Prompt enhancement feature', color: 'text-indigo-400' },
        { icon: Layout, text: 'Improved saved chats UI', color: 'text-blue-400' },
        { icon: CheckSquare, text: 'Task status indicators (in progress)', color: 'text-green-400' },
      ]
    },
    {
      date: 'October 28, 2025',
      features: [
        { icon: Layout, text: 'Removed /home page (merged with root)', color: 'text-gray-400' },
        { icon: Palette, text: 'Minimalistic bottom navigation bar', color: 'text-teal-400' },
        { icon: Layout, text: 'Improved task header UI', color: 'text-blue-400' },
        { icon: CheckSquare, text: 'Fixed Kanban drag-and-drop', color: 'text-green-400' },
      ]
    },
    {
      date: 'October 27, 2025',
      features: [
        { icon: Sparkles, text: 'Landing page for non-signed users', color: 'text-purple-400' },
        { icon: Layout, text: 'Removed top navbar from settings', color: 'text-gray-400' },
        { icon: CheckSquare, text: 'Fixed task scrolling issues', color: 'text-blue-400' },
        { icon: Layout, text: '3-dot menu in Kanban cards', color: 'text-indigo-400' },
      ]
    },
    {
      date: 'October 26-25, 2025',
      features: [
        { icon: CheckSquare, text: 'Mobile touch support for Kanban', color: 'text-cyan-400' },
        { icon: Layout, text: 'Fixed flickering animations', color: 'text-gray-400' },
        { icon: CheckSquare, text: 'Task calendar improvements', color: 'text-green-400' },
        { icon: Palette, text: 'Minimalistic UI updates across app', color: 'text-pink-400' },
      ]
    },
    {
      date: 'Early October 2025',
      features: [
        { icon: Sparkles, text: 'Multi-provider AI system', color: 'text-purple-400' },
        { icon: Layout, text: 'Task management with calendar/Kanban views', color: 'text-blue-400' },
        { icon: Shield, text: 'Firebase authentication integration', color: 'text-orange-400' },
        { icon: Layout, text: 'Responsive mobile design', color: 'text-teal-400' },
      ]
    },
  ];

  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-700/50 sticky top-0 bg-gray-800/50 backdrop-blur-sm z-10">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">What's New</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-1 break-words">
          Latest features and improvements
        </p>
      </div>
      
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="p-4 space-y-4">
          {updates.map((update, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-gray-600 text-gray-400">
                  {update.date}
                </Badge>
              </div>
              <div className="space-y-1.5">
                {update.features.map((feature, featureIdx) => (
                  <div 
                    key={featureIdx} 
                    className="flex items-start gap-2 text-xs p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                  >
                    <feature.icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${feature.color}`} />
                    <span className="text-gray-300 leading-relaxed">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

