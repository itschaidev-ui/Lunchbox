'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Sparkles, 
  CheckSquare, 
  MessageSquare, 
  Zap, 
  Shield, 
  Rocket,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { AuthModal } from '@/components/auth/auth-modal';

export function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleGetStarted = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img 
                src="/images/lunchbox-ai-logo.png" 
                alt="Lunchbox AI" 
                className="h-10 w-auto rounded-lg shadow-lg"
              />
              <span className="text-xl font-bold">
                <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Lunchbox
                </span>{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
                  AI
                </span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#about" className="text-gray-300 hover:text-white transition-colors">
                About
              </Link>
              <Button 
                variant="ghost" 
                onClick={handleSignIn}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                Sign In
              </Button>
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t border-gray-800">
              <Link 
                href="#features" 
                className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="#about" 
                className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Button 
                variant="ghost" 
                onClick={() => { handleSignIn(); setIsMobileMenuOpen(false); }}
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => { handleGetStarted(); setIsMobileMenuOpen(false); }}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-full mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-gray-300">Your Intelligent Productivity Companion</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Supercharge Your
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              Productivity
            </span>{' '}
            with{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto">
            Manage tasks, chat with AI, and organize your life—all in one beautiful, intelligent platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg"
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-lg px-8 py-6 h-auto"
            >
              <Rocket className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={handleSignIn}
              className="border-gray-700 hover:bg-gray-800 text-lg px-8 py-6 h-auto"
            >
              Sign In
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Stay Organized
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Powerful features designed to boost your productivity
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="p-8 bg-gray-800/50 border-gray-700 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">AI Assistant</h3>
              <p className="text-gray-400">
                Chat with an intelligent AI that helps you plan, organize, and solve problems in real-time.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-8 bg-gray-800/50 border-gray-700 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-6">
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Task Management</h3>
              <p className="text-gray-400">
                Organize your tasks with lists, kanban boards, and calendar views. Never miss a deadline.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-8 bg-gray-800/50 border-gray-700 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Smart Automation</h3>
              <p className="text-gray-400">
                Let AI handle the repetitive work. Automate reminders, scheduling, and task prioritization.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Built for{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Modern Productivity
                </span>
              </h2>
              <p className="text-lg text-gray-400 mb-6">
                Lunchbox AI combines the power of artificial intelligence with intuitive design to create 
                the ultimate productivity platform. Whether you're managing personal tasks or collaborating 
                with a team, we've got you covered.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-primary mt-1 shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Secure & Private</h4>
                    <p className="text-gray-400">Your data is encrypted and protected with industry-leading security.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="h-6 w-6 text-primary mt-1 shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Lightning Fast</h4>
                    <p className="text-gray-400">Optimized performance ensures you can work at the speed of thought.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="h-6 w-6 text-primary mt-1 shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">AI-Powered</h4>
                    <p className="text-gray-400">Advanced AI helps you work smarter, not harder.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl border border-gray-700 p-8">
                <div className="w-full h-full bg-gray-800/50 rounded-xl flex items-center justify-center overflow-hidden">
                  <video 
                    src="/images/demo.mp4" 
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-lg"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 to-accent/10 border-y border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Productivity?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Join thousands of users who are already working smarter with Lunchbox AI.
          </p>
          <Button 
            size="lg"
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-lg px-8 py-6 h-auto"
          >
            <Rocket className="mr-2 h-5 w-5" />
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="/images/lunchbox-ai-logo.png" 
                alt="Lunchbox AI" 
                className="h-8 w-auto rounded-lg"
              />
              <span className="font-semibold text-gray-400">
                © 2024 Lunchbox AI. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="#features" className="text-gray-400 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#about" className="text-gray-400 hover:text-white transition-colors">
                About
              </Link>
              <button onClick={handleSignIn} className="text-gray-400 hover:text-white transition-colors">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}

