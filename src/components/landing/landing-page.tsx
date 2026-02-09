'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  CheckSquare, 
  MessageSquare, 
  Zap, 
  Shield, 
  ArrowRight,
  Menu,
  X,
  Clock,
  TrendingUp,
  Infinity
} from 'lucide-react';
import { AuthModal } from '@/components/auth/auth-modal';
import { cn } from '@/lib/utils';
import Squares from '@/components/ui/squares';

export function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({
    'hero-badge': true,
    'hero-headline': true,
    'hero-subheadline': true,
    'hero-benefits': true,
    'hero-cta': true,
  });
  const navRef = useRef<HTMLElement>(null);

  // Scroll handler for navbar
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrollY(currentScrollY);

          // Navbar opacity on scroll
          if (navRef.current) {
            if (currentScrollY > 50) {
              navRef.current.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
              navRef.current.style.backdropFilter = 'blur(10px)';
            } else {
              navRef.current.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              navRef.current.style.backdropFilter = 'none';
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for fade-in animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-scroll-id');
          if (id) {
            setIsVisible((prev) => ({ ...prev, [id]: true }));
          }
        }
      });
    }, observerOptions);

    // Observe all elements with data-scroll-id
    const elements = document.querySelectorAll('[data-scroll-id]');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  const handleGetStarted = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Minimal Navigation */}
      <nav ref={navRef} className="fixed top-0 w-full z-50 bg-black/80 border-b border-gray-900 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img 
                src="/images/lunchbox-ai-logo.png" 
                alt="Lunchbox AI" 
                className="h-8 w-auto"
              />
            </div>

            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-gray-400 hover:text-white transition-colors font-medium text-sm">
                Features
              </Link>
              <Link href="#about" className="text-gray-400 hover:text-white transition-colors font-medium text-sm">
                About
              </Link>
              <Button 
                variant="ghost" 
                onClick={handleSignIn}
                className="text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
              >
                Sign In
              </Button>
              <Button 
                onClick={handleGetStarted}
                className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full px-6 py-2.5 font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 active:scale-95 border-0 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Sparkles className="mr-2 h-4 w-4 relative z-10 group-hover:rotate-180 transition-transform duration-500" />
                <span className="relative z-10">Get Started</span>
              </Button>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-900 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5 text-gray-400" /> : <Menu className="h-5 w-5 text-gray-400" />}
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t border-gray-900 bg-black">
              <Link 
                href="#features" 
                className="block px-4 py-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="#about" 
                className="block px-4 py-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Button 
                variant="ghost" 
                onClick={() => { handleSignIn(); setIsMobileMenuOpen(false); }}
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => { handleGetStarted(); setIsMobileMenuOpen(false); }}
                className="group w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 border-0"
              >
                <Sparkles className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                Get Started
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Immersive Hero Section - Full Screen */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Squares Background - Full Visibility */}
        <div className="absolute inset-0 z-0">
          <Squares 
            direction="diagonal"
            speed={0.5}
            borderColor="#271E37"
            squareSize={40}
            hoverFillColor="#1a0f2e"
          />
        </div>

        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

        {/* Ambient Background Particles */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                background: `rgba(${Math.random() > 0.5 ? '168, 85, 247' : '236, 72, 153'}, ${Math.random() * 0.3 + 0.2})`,
                borderRadius: '50%',
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${Math.random() * 10 + 15}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div 
              data-scroll-id="hero-badge"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-full transition-all duration-1000",
                isVisible['hero-badge'] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-gray-300">AI-Powered Productivity Platform</span>
            </div>
            
            {/* Hero Headline with Animated Gradient */}
            <h1 
              data-scroll-id="hero-headline"
              className={cn(
                "text-6xl sm:text-7xl lg:text-8xl font-bold leading-tight text-white transition-all duration-1000 delay-100",
                isVisible['hero-headline'] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              <span className="inline-block animate-float" style={{ animationDelay: '0s' }}>
                Transform Your Workflow
              </span>
              <br />
              <span 
                className="inline-block bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 bg-clip-text text-transparent animate-gradient-shift"
                style={{ backgroundSize: '200% 200%' }}
              >
                With AI Intelligence
              </span>
            </h1>
            
            {/* Subheadline */}
            <p 
              data-scroll-id="hero-subheadline"
              className={cn(
                "text-xl sm:text-2xl text-gray-400 leading-relaxed max-w-3xl mx-auto transition-all duration-1000 delay-200",
                isVisible['hero-subheadline'] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              Manage tasks effortlessly, collaborate with AI, and organize your entire life in one beautiful, 
              intelligent platform designed for modern productivity.
            </p>
            
            {/* Key Benefits - Minimal Pills */}
            <div 
              data-scroll-id="hero-benefits"
              className={cn(
                "flex flex-wrap justify-center gap-3 pt-4 transition-all duration-1000 delay-300",
                isVisible['hero-benefits'] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              {[
                { icon: CheckSquare, text: 'Smart Task Management' },
                { icon: MessageSquare, text: 'AI Assistant' },
                { icon: Zap, text: 'Automation' },
              ].map((benefit, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-4 py-2 hover:border-purple-500/50 hover:bg-gray-800 transition-all duration-300 hover:scale-105 cursor-default group"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <benefit.icon className="h-4 w-4 text-purple-400 group-hover:scale-110 group-hover:text-pink-400 transition-all duration-300" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">{benefit.text}</span>
                </div>
              ))}
            </div>
            
            {/* Primary CTA */}
            <div 
              data-scroll-id="hero-cta"
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 transition-all duration-1000 delay-400",
                isVisible['hero-cta'] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              <Button 
                size="lg"
                onClick={handleGetStarted}
                className="group relative bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 hover:from-purple-500 hover:via-purple-400 hover:to-pink-500 text-white rounded-full px-10 py-7 h-auto text-lg font-semibold shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95 border-0 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Sparkles className="mr-3 h-6 w-6 relative z-10 group-hover:rotate-180 transition-transform duration-500" />
                <span className="relative z-10">Get Started Free</span>
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={handleSignIn}
                className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm border-2 border-white/20 hover:border-white/40 text-white text-lg font-semibold px-10 py-7 h-auto rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Sign In
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section - Minimal */}
      <section id="features" className="relative py-32 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
        {/* Animated Squares Background */}
        <div className="absolute inset-0 opacity-60">
          <Squares 
            direction="right"
            speed={0.3}
            borderColor="#271E37"
            squareSize={50}
            hoverFillColor="#1a0f2e"
          />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div 
            data-scroll-id="features-header"
            className={cn(
              "text-center mb-20 transition-all duration-1000",
              isVisible['features-header'] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-white">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Stay Organized
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful features that deepen your reality without overwhelming it
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: 'AI Assistant',
                description: 'Engage with intelligence that understands context, anticipates needs, and weaves solutions into your workflow seamlessly.',
              },
              {
                icon: CheckSquare,
                title: 'Task Management',
                description: 'Organize with precision. Lists, kanban boards, and calendar views that adapt to how you think and work.',
              },
              {
                icon: Zap,
                title: 'Smart Automation',
                description: 'Let intelligence handle repetition. Automate reminders, scheduling, and prioritization with thoughtful precision.',
              },
              {
                icon: Clock,
                title: 'Time Tracking',
                description: 'Gain insights into your rhythms. Understand where time flows and where it pools, with clarity and depth.',
              },
              {
                icon: TrendingUp,
                title: 'Analytics Dashboard',
                description: 'Visualize patterns that matter. See your productivity landscape with comprehensive, actionable insights.',
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Your data rests in encrypted vaults, protected by industry-leading security that you can trust implicitly.',
              },
            ].map((feature, i) => (
              <div 
                key={i}
                data-scroll-id={`feature-${i}`}
                className={cn(
                  "group relative bg-gray-900 border border-gray-800 rounded-lg p-8 hover:border-purple-500/50 transition-all duration-500 hover:shadow-[0_8px_32px_rgba(168,85,247,0.2)] hover:-translate-y-2",
                  isVisible[`feature-${i}`] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-pink-500/5 group-hover:to-purple-500/5 rounded-lg transition-all duration-500" />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-6 group-hover:bg-gradient-to-br group-hover:from-purple-500/20 group-hover:to-pink-500/20 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="h-6 w-6 text-purple-400 group-hover:text-pink-400 group-hover:rotate-12 transition-all duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-purple-300 transition-colors duration-300">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section - Minimal */}
      <section id="about" className="relative py-32 px-4 sm:px-6 lg:px-8 bg-black border-t border-gray-900 overflow-hidden">
        {/* Animated Squares Background */}
        <div className="absolute inset-0 opacity-50">
          <Squares 
            direction="up"
            speed={0.4}
            borderColor="#271E37"
            squareSize={45}
            hoverFillColor="#1a0f2e"
          />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div 
              data-scroll-id="about-content"
              className={cn(
                "space-y-8 transition-all duration-1000",
                isVisible['about-content'] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              )}
            >
              <h2 className="text-5xl sm:text-6xl font-bold text-white">
                Built for
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Modern Productivity
                </span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Lunchbox AI pierces through the noise of modern work. We combine the power of artificial intelligence 
                with intuitive design to create a platform that doesn't just manage tasks—it transforms how you engage 
                with your work, your time, and your potential.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Shield, title: 'Secure & Private', desc: 'Your data rests in encrypted vaults, protected by industry-leading security.' },
                  { icon: Zap, title: 'Lightning Fast', desc: 'Optimized performance ensures you can work at the speed of thought.' },
                  { icon: Sparkles, title: 'AI-Powered', desc: 'Advanced intelligence that helps you work smarter, not harder.' },
                  { icon: Infinity, title: 'Unlimited Scale', desc: 'From personal workflows to enterprise collaboration, grow without limits.' },
                ].map((item, i) => (
                  <div 
                    key={i}
                    data-scroll-id={`about-item-${i}`}
                    className={cn(
                      "flex items-start gap-4 bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-all duration-500",
                      isVisible[`about-item-${i}`] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                    )}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div 
              data-scroll-id="about-video"
              className={cn(
                "relative transition-all duration-1000",
                isVisible['about-video'] ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              )}
            >
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                <video 
                  src="/images/demo.mp4" 
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Minimal */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-black border-t border-gray-900">
        <div className="max-w-4xl mx-auto">
          <div 
            data-scroll-id="cta-section"
            className={cn(
              "relative bg-gray-900 border border-gray-800 rounded-lg p-12 sm:p-16 text-center transition-all duration-1000",
              isVisible['cta-section'] ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
            )}
          >
            <div className="space-y-8">
              <h2 className="text-4xl sm:text-5xl font-bold text-white">
                Ready to Transform Your Productivity?
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Join thousands who have pierced the veil. Begin weaving your own tapestry of intelligent productivity today.
              </p>
              <Button 
                size="lg"
                onClick={handleGetStarted}
                className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full px-10 py-7 h-auto text-lg font-semibold shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95 border-0 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Sparkles className="mr-3 h-6 w-6 relative z-10 group-hover:rotate-180 transition-transform duration-500" />
                <span className="relative z-10">Begin Your Journey</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-900 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="/images/lunchbox-ai-logo.png" 
                alt="Lunchbox AI" 
                className="h-7 w-auto"
              />
              <span className="font-medium text-gray-500 text-sm">
                © 2024 Lunchbox AI. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="#features" className="text-gray-500 hover:text-white transition-colors text-sm">
                Features
              </Link>
              <Link href="#about" className="text-gray-500 hover:text-white transition-colors text-sm">
                About
              </Link>
              <button onClick={handleSignIn} className="text-gray-500 hover:text-white transition-colors text-sm">
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
