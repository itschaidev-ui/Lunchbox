
import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { TaskProvider } from '@/context/task-context';
import { TimerProvider } from '@/context/timer-context';
import { TimerWidget } from '@/components/timer/timer-widget';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';
import { ChatProvider } from '@/context/chat-context';
import { NavbarSettingsProvider } from '@/context/navbar-settings-context';
import { CreditsProvider } from '@/context/credits-context';
import { TopNavbar } from '@/components/layout/top-navbar';
import { BottomNavbar } from '@/components/layout/bottom-navbar';
import { ClarityProvider } from '@/components/clarity-provider';
import { NavbarProvider } from '@/context/navbar-context';
import Script from 'next/script';
import SchedulerInit from '@/components/scheduler-init';
import { OnlineStatusTracker } from '@/components/online-status-tracker';
import { PWARegister } from '@/components/pwa-register';
import { CommandPaletteProvider } from '@/components/command-palette-provider';

export const metadata: Metadata = {
  title: 'Lunchbox AI',
  description: 'An AI-powered task manager for teens.',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lunchbox',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: '/images/lunchbox-ai-logo.png',
    apple: '/images/lunchbox-ai-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;600&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
        
        {/* KaTeX for LaTeX math rendering */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" crossOrigin="anonymous" />
        <Script
          src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"
          integrity="sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmUb0ZY0l8"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
          integrity="sha384-+VBxd3r6XgURycqtZ117nYw44OOcIax56Z4dCRWbxyPt0Koah1uHoK0o4+/RRE05"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        
        {/* Microsoft Clarity Analytics */}
        <Script
          id="clarity-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "tnongks79d");
            `,
          }}
        />
      </head>
      <body className="font-body antialiased mobile-safe-top mobile-safe-bottom">
        <div className="min-h-screen flex flex-col">
          <AuthProvider>
            <ThemeProvider>
              <ChatProvider>
                <NavbarSettingsProvider>
                  <TimerProvider>
                    <TaskProvider>
                      <CreditsProvider>
                        <NavbarProvider>
                          <ClarityProvider>
                            <CommandPaletteProvider>
                              <TopNavbar />
                              <main className="flex-1 pb-20 sm:pb-0">
                                {children}
                              </main>
                              <BottomNavbar />
                              <TimerWidget />
                              <Toaster />
                              <SchedulerInit />
                              <OnlineStatusTracker />
                              <PWARegister />
                            </CommandPaletteProvider>
                          </ClarityProvider>
                        </NavbarProvider>
                      </CreditsProvider>
                    </TaskProvider>
                  </TimerProvider>
                </NavbarSettingsProvider>
              </ChatProvider>
            </ThemeProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
