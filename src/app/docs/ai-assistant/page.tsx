'use client';

import { TopNavbar } from '@/components/layout/top-navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Sparkles, 
  Lightbulb,
  ArrowRight,
  Copy,
  CheckCircle
} from 'lucide-react';

export default function AIAssistantPage() {
  return (
    <>
      <TopNavbar />
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 pt-16">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 animate-pulse-gentle">
              AI Assistant Guide
            </Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Master the AI Assistant
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn how to use natural language to create, manage, and organize your tasks with our intelligent AI.
            </p>
          </div>

          {/* How It Works */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>How It Works</span>
              </CardTitle>
              <CardDescription>
                Our AI understands natural language and converts it into organized tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">1. Speak Naturally</h3>
                  <p className="text-sm text-muted-foreground">Tell the AI what you need to do in your own words</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">2. AI Processing</h3>
                  <p className="text-sm text-muted-foreground">Our AI analyzes and understands your intent</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">3. Task Creation</h3>
                  <p className="text-sm text-muted-foreground">Tasks are automatically created and organized</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Conversations */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Example Conversations</CardTitle>
                <CardDescription>See how to interact with the AI assistant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-sm font-bold">You</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">"I need to study for my math exam tomorrow and also buy groceries for dinner"</p>
                    </div>
                  </div>
                </div>
                <div className="bg-primary/5 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">"I've created two tasks for you: 📚 Study for math exam (Due: Tomorrow) and 🛒 Buy groceries (Priority: High). Would you like me to set reminders for these tasks?"</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pro Tips</CardTitle>
                <CardDescription>Get the most out of your AI assistant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">Be specific about deadlines</p>
                    <p className="text-xs text-muted-foreground">"Study for exam by Friday" vs "Study for exam"</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">Mention priorities</p>
                    <p className="text-xs text-muted-foreground">"This is urgent" or "Low priority task"</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">Ask for updates</p>
                    <p className="text-xs text-muted-foreground">"What's my progress today?" or "Show me my tasks"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Try It?</h2>
            <p className="text-muted-foreground mb-6">Start a conversation with our AI assistant</p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Start Chatting
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
