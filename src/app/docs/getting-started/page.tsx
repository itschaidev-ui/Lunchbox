'use client';

import { TopNavbar } from '@/components/layout/top-navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  MessageSquare, 
  CheckSquare, 
  BarChart3, 
  Bell,
  ArrowRight,
  Play,
  BookOpen
} from 'lucide-react';

export default function GettingStartedPage() {
  return (
    <>
      <TopNavbar />
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 pt-16">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 animate-pulse-gentle">
              Getting Started
            </Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Welcome to Lunchbox AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your intelligent productivity companion that transforms how you manage tasks and boost your productivity.
            </p>
          </div>

          {/* Quick Start */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-primary" />
                <span>Quick Start Guide</span>
              </CardTitle>
              <CardDescription>
                Get up and running with Lunchbox AI in just a few minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-4 bg-primary/5 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Sign Up</h3>
                    <p className="text-sm text-muted-foreground">Create your account with Google, Discord, or email</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-primary/5 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Start Chatting</h3>
                    <p className="text-sm text-muted-foreground">Begin a conversation with our AI assistant</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-primary/5 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Create Tasks</h3>
                    <p className="text-sm text-muted-foreground">Tell the AI what you need to do in natural language</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-primary/5 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Stay Organized</h3>
                    <p className="text-sm text-muted-foreground">Track progress and get smart reminders</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Core Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>AI Assistant</CardTitle>
                <CardDescription>
                  Natural language task creation and management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Simply tell our AI what you need to do, and it will create organized tasks with priorities and deadlines.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                  <CheckSquare className="w-6 h-6 text-green-500" />
                </div>
                <CardTitle>Smart Tasks</CardTitle>
                <CardDescription>
                  Intelligent task organization and tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our AI understands context and automatically categorizes and prioritizes your tasks.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>
                  Real-time insights and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track your productivity with detailed analytics and progress reports.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started Actions */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-6">Join thousands of students already using Lunchbox AI</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="hover:bg-primary/10 transition-all duration-300"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
