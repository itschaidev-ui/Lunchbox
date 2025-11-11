'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useNavbar } from '@/context/navbar-context';
import { AuthModal } from '@/components/auth/auth-modal';
import Image from 'next/image';
import { 
  Menu, 
  X, 
  BookOpen, 
  HelpCircle, 
  Settings, 
  UserPlus,
  Sparkles,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function TopNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const { user } = useAuth();
  const { isNavbarVisible } = useNavbar();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle landing page buttons
  useEffect(() => {
    const handleLandingPageButtons = () => {
      const signUpBtn = document.querySelector('[data-signup-btn]');
      const signInBtn = document.querySelector('[data-signin-btn]');
      
      if (signUpBtn) {
        signUpBtn.addEventListener('click', () => {
          setAuthMode('signup');
          setIsAuthModalOpen(true);
        });
      }
      
      if (signInBtn) {
        signInBtn.addEventListener('click', () => {
          setAuthMode('login');
          setIsAuthModalOpen(true);
        });
      }
    };

    // Run after component mounts
    setTimeout(handleLandingPageButtons, 100);
  }, []);

  const documentationItems = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of Lunchbox AI',
      href: '/docs/getting-started',
      icon: Sparkles
    },
    {
      title: 'AI Assistant Guide',
      description: 'Master natural language task creation',
      href: '/docs/ai-assistant',
      icon: BookOpen
    },
    {
      title: 'Task Management',
      description: 'Organize and track your productivity',
      href: '/docs/task-management',
      icon: Settings
    },
    {
      title: 'FAQ & Support',
      description: 'Get help and find answers',
      href: '/docs/faq',
      icon: HelpCircle
    }
  ];

  // Hide navbar on root, tasks, home, assistant, collabs, and settings pages unless explicitly shown
  const shouldShowNavbar = isNavbarVisible && pathname !== '/' && pathname !== '/tasks' && pathname !== '/home' && pathname !== '/assistant' && pathname !== '/collabs' && !pathname.startsWith('/settings');

  if (!shouldShowNavbar) {
    return null;
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-background/95 backdrop-blur-md border-b border-border/50 shadow-lg' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => router.push('/')}>
              <Image
                src="/images/lunchbox-ai-logo.png"
                alt="Lunchbox AI Logo"
                width={32}
                height={32}
                className="object-contain group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <Badge variant="secondary" className="hidden sm:flex animate-pulse-gentle">
              Beta
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Documentation Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-primary/10 transition-all duration-300">
                  <BookOpen className="w-4 h-4" />
                  <span>Documentation</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 p-2" align="start">
                {documentationItems.map((item, index) => (
                  <div key={index}>
                    <DropdownMenuItem 
                      className="flex items-start space-x-3 p-3 hover:bg-primary/5 transition-colors duration-200"
                      onClick={() => router.push(item.href)}
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    </DropdownMenuItem>
                    {index < documentationItems.length - 1 && <DropdownMenuSeparator />}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Features */}
            <Button 
              variant="ghost" 
              className="hover:bg-primary/10 transition-all duration-300"
              onClick={() => router.push('/#features')}
            >
              Features
            </Button>

            {/* Pricing */}
            <Button 
              variant="ghost" 
              className="hover:bg-primary/10 transition-all duration-300"
              onClick={() => router.push('/#pricing')}
            >
              Pricing
            </Button>

            {/* About */}
            <Button 
              variant="ghost" 
              className="hover:bg-primary/10 transition-all duration-300"
              onClick={() => router.push('/#about')}
            >
              About
            </Button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/tasks')}
                  className="hidden sm:flex hover:bg-primary/10 transition-all duration-300"
                >
                  Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/settings')}
                  className="hidden sm:flex hover:bg-primary/10 transition-all duration-300"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="hidden sm:flex hover:bg-primary/10 transition-all duration-300"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => {
                    setAuthMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {documentationItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left p-3 hover:bg-primary/10 transition-all duration-300"
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                </Button>
              ))}
              <div className="pt-2 border-t border-border/50">
                <Button
                  variant="ghost"
                  className="w-full justify-start p-3 hover:bg-primary/10 transition-all duration-300"
                  onClick={() => {
                    router.push('/#features');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Features
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-3 hover:bg-primary/10 transition-all duration-300"
                  onClick={() => {
                    router.push('/#pricing');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Pricing
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-3 hover:bg-primary/10 transition-all duration-300"
                  onClick={() => {
                    router.push('/#about');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  About
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </nav>
  );
}
