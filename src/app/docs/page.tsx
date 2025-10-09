
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Trophy, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DocsPage() {
  
  const docsContent = (
    <div className="flex flex-col bg-background p-4 md:p-8 overflow-y-auto">
      <header className="mb-8 shrink-0 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-headline font-bold text-foreground">
            🍱 Lunchbox Challenge + Game Event
          </h1>
          <p className="text-muted-foreground mt-2">
            Win Robux & a Game Pass!
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </header>
      
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <Card className="border-primary/50">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Trophy className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>Challenge 1: The Lunchbox Challenge</CardTitle>
                        <CardDescription>Use Lunchbox AI to create and complete as many tasks as possible in 30 minutes!</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p>Whoever shows the best use of Lunchbox — with the most completed and creative tasks — will win **500 Robux**!</p>
                <p className="text-sm text-primary mt-2">💡 **Tip:** The winner of this challenge will also gain a **bonus advantage** in the next event!</p>
            </CardContent>
        </Card>

         <Card className="border-accent/50">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Gamepad2 className="h-8 w-8 text-accent" />
                    <div>
                        <CardTitle>Challenge 2: The Game Event</CardTitle>
                        <CardDescription>Compete in a fun game challenge where the winner gets to choose a Game Pass of their choice!</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p>The **Lunchbox Challenge winner** will get a **special benefit or power-up** in this round.</p>
            </CardContent>
        </Card>
        
        <div className="bg-card/50 p-6 rounded-lg text-center">
            <h3 className="font-headline text-2xl font-bold mb-2">🔥 Event Info</h3>
            <p className="text-muted-foreground"><span className="font-bold">Where:</span> #lunchbox-challenge channel</p>
            <p className="text-muted-foreground"><span className="font-bold">When:</span> October 11th at 6:00 PM</p>
            <div className="mt-4">
                <p className="font-bold text-lg">🏆 Rewards:</p>
                <ul className="list-disc list-inside text-muted-foreground">
                    <li>500 Robux (Lunchbox Challenge)</li>
                    <li>Game Pass of choice (Game Event Winner)</li>
                </ul>
            </div>
        </div>

      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
       <main className="flex-1 overflow-auto">
          {docsContent}
       </main>
    </div>
  );
}
