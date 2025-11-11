import { NextRequest, NextResponse } from 'next/server';
import { continueConversation, Message } from '@/ai/flows/chat';
import { multiProviderAI } from '@/lib/ai/multi-provider';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, activeTab, advancedAI, taskContext, companionContext, selectedModel } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Convert messages to the format expected by continueConversation
    const formattedMessages: Message[] = messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // Build enhanced task context with companion context if provided
    let enhancedTaskContext = taskContext;
    if (companionContext && taskContext) {
      enhancedTaskContext = `${companionContext}\n\n${taskContext}`;
    } else if (companionContext) {
      enhancedTaskContext = companionContext;
    }
    
    // Call the AI chat function
    const responses = await continueConversation(
      formattedMessages,
      undefined,
      activeTab || 'message',
      advancedAI !== undefined ? advancedAI : false,
      enhancedTaskContext || undefined,
      selectedModel || 'auto'
    );

    // Extract token usage from the first response (all responses share the same token usage)
    const tokenUsage = responses[0]?.tokenUsage || null;

    return NextResponse.json({
      responses,
      success: true,
      tokenUsage: tokenUsage
    });

  } catch (error: any) {
    console.error('AI chat API error:', error);
    
    // Check if this is a rate limit error with retry info
    const rateLimitInfo = error?.rateLimitInfo;
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        rateLimitInfo: rateLimitInfo || null
      },
      { status: error?.rateLimitInfo ? 429 : 500 }
    );
  }
}

// Allow GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Lunchbox AI Chat API',
    version: '1.0.0'
  });
}

