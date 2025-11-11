'use client';

import { Map, Clock, Zap, Users, Globe, Smartphone, Brain, Shield, Bell, FileText, BarChart3, Settings, MessageSquare, Calendar, CheckSquare, Mic, Image as ImageIcon, Workflow, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Roadmap() {
  const roadmap = [
    {
      phase: 'Coming Soon',
      status: 'in-progress',
      features: [
        { icon: Mic, text: 'Voice message support in Discord bot', color: 'text-purple-400' },
        { icon: ImageIcon, text: 'Image analysis in AI conversations', color: 'text-blue-400' },
        { icon: Users, text: 'Multi-user collaborative task threads', color: 'text-green-400' },
        { icon: Brain, text: 'Custom AI personalities for Discord bot', color: 'text-pink-400' },
        { icon: BarChart3, text: 'Advanced task analytics and insights', color: 'text-cyan-400' },
      ]
    },
    {
      phase: 'Q1 2026',
      status: 'planned',
      features: [
        { icon: Globe, text: 'Multi-server Discord bot support', color: 'text-indigo-400' },
        { icon: Smartphone, text: 'Mobile app (iOS & Android)', color: 'text-orange-400' },
        { icon: Calendar, text: 'Recurring tasks with smart scheduling', color: 'text-teal-400' },
        { icon: Users, text: 'Team workspaces and collaboration', color: 'text-emerald-400' },
        { icon: Bell, text: 'Push notifications for mobile', color: 'text-yellow-400' },
      ]
    },
    {
      phase: 'Q2 2026',
      status: 'planned',
      features: [
        { icon: Shield, text: 'Advanced security and permissions', color: 'text-red-400' },
        { icon: Workflow, text: 'Custom workflow automation builder', color: 'text-violet-400' },
        { icon: TrendingUp, text: 'Productivity reports and trends', color: 'text-blue-400' },
        { icon: FileText, text: 'Document templates and snippets', color: 'text-green-400' },
        { icon: Users, text: 'Task sharing and delegation', color: 'text-cyan-400' },
      ]
    },
    {
      phase: 'Future Ideas',
      status: 'ideas',
      features: [
        { icon: Globe, text: 'Third-party integrations (Slack, Teams, etc.)', color: 'text-gray-400' },
        { icon: Brain, text: 'AI-powered task prioritization', color: 'text-purple-400' },
        { icon: Calendar, text: 'Calendar sync with Google/Outlook', color: 'text-blue-400' },
        { icon: BarChart3, text: 'Time tracking and productivity metrics', color: 'text-teal-400' },
        { icon: Settings, text: 'Custom notification rules and triggers', color: 'text-yellow-400' },
      ]
    },
  ];

  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-700/50 sticky top-0 bg-gray-800/50 backdrop-blur-sm z-10">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Map className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">Roadmap</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-1 break-words">
          Upcoming features and improvements
        </p>
      </div>
      
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="p-4 space-y-6">
          {roadmap.map((phase, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-[10px] px-2 py-0.5 ${
                    phase.status === 'in-progress' 
                      ? 'border-yellow-600 text-yellow-400 bg-yellow-500/10' 
                      : phase.status === 'planned'
                      ? 'border-blue-600 text-blue-400 bg-blue-500/10' 
                      : 'border-gray-600 text-gray-400'
                  }`}
                >
                  {phase.phase}
                </Badge>
                {phase.status === 'in-progress' && (
                  <Clock className="h-3 w-3 text-yellow-400" />
                )}
              </div>
              <div className="space-y-1.5">
                {phase.features.map((feature, featureIdx) => (
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
