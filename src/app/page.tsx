'use client';

import Link from 'next/link';
import { MessageSquare, CheckSquare, Sparkles, Calendar, ArrowRight, PanelLeft, PanelRight } from 'lucide-react';
import { LeftSidebar } from '@/components/layout/left-sidebar';
import { TaskFeed } from '@/components/dashboard/task-feed';
import { Changelog } from '@/components/dashboard/changelog';
import { useAuth } from '@/context/auth-context';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LandingPage } from '@/components/landing/landing-page';
import { Roadmap } from '@/components/dashboard/roadmap';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <LoadingScreen 
        message="Loading Lunchbox AI..." 
        size="lg"
      />
    );
  }

  // Show landing page if user is not signed in
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Header with Sheet Triggers */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <PanelLeft className="h-4 w-4" />
              <span className="sr-only">Open Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <LeftSidebar />
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <PanelRight className="h-4 w-4" />
              <span className="sr-only">Open Changelog</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-80 overflow-y-auto">
            <div className="p-4 space-y-6">
              <TaskFeed />
              <Changelog />
              <Roadmap />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Left Sidebar - Desktop only */}
      <div className="hidden md:block">
        <LeftSidebar />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0 pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                Lunchbox
              </span>{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
                AI
              </span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Your intelligent productivity companion
            </p>
          </div>

          {/* Quick Actions */}
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700/50">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
              <h2 className="text-lg sm:text-xl font-semibold">Chat with AI Assistant</h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Ask me anything, or give me a task to do. I'm here to help with productivity, planning, and problem-solving.
            </p>
            <Link href="/assistant">
              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                <Sparkles className="h-4 w-4 mr-2" />
                Start Conversation
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </Card>

          {/* Quick Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link href="/tasks" className="group">
              <Card className="p-4 sm:p-5 hover:bg-gray-800/50 transition-all duration-200 border-gray-700/50 hover:border-gray-600">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
                      <h3 className="font-semibold text-sm sm:text-base">Tasks</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Manage your to-do list
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                </div>
              </Card>
            </Link>

            <Link href="/docs" className="group">
              <Card className="p-4 sm:p-5 hover:bg-gray-800/50 transition-all duration-200 border-gray-700/50 hover:border-gray-600">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
                      <h3 className="font-semibold text-sm sm:text-base">Events</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      View event details
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </main>

      {/* Right Sidebar - Task Feed, Changelog & Roadmap - Hidden on mobile and tablet */}
      <aside className="hidden xl:block w-80 min-w-0 border-l border-border bg-gray-900/30 overflow-y-auto overflow-x-hidden">
        <div className="p-6 space-y-6 min-w-0">
          <TaskFeed />
          <Changelog />
          <Roadmap />
        </div>
      </aside>
    </div>
  );
}