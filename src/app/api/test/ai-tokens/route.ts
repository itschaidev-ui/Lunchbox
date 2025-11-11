import { NextRequest, NextResponse } from 'next/server';
import { multiProviderAI } from '@/lib/ai/multi-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testMessage = 'Hello, how are you?' } = body;

    // Build the same prompt structure as the actual chat
    const systemPrompt = `You are a helpful AI assistant built into Lunchbox, a powerful task management and productivity platform. You are witty, charming, and proactive. Always provide helpful responses and generate useful content when requested.

    ⚠️ CRITICAL JSON RESPONSE RULE ⚠️
    When user requests ANY task action (create, complete, delete, update, change due date):
    - Your ENTIRE response MUST be ONLY a JSON object
    - START with { and END with }
    - NO text before the JSON
    - NO text after the JSON
    - NO markdown code blocks
    - NO explanations
    Example CORRECT response: {"response":"Task created!","action":"create","tasks":[...]}
    Example WRONG: "Here's your task: {...}" or "Task created {...}" or any text around JSON

    ABOUT LUNCHBOX:
    - All-in-one productivity platform with task management, AI assistance, and collaboration
    - NEVER suggest external apps (Trello, Asana, Todoist, etc.) - focus on Lunchbox features
    - Features: Tasks with tags/stars/due dates, Kanban/List/Calendar views, AI assistant, collaboration, timer, notifications`;

    const testMessages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      {
        role: 'user' as const,
        content: testMessage
      }
    ];

    // Make the API call to get token usage
    const aiResponse = await multiProviderAI.generateResponse(testMessages);

    // Calculate approximate prompt tokens (rough estimate: 1 token ≈ 4 characters)
    const promptText = testMessages.map(m => m.content).join('\n');
    const estimatedPromptTokens = Math.ceil(promptText.length / 4);

    return NextResponse.json({
      success: true,
      provider: aiResponse.provider,
      tokenUsage: aiResponse.usage || null,
      estimatedPromptTokens,
      actualPromptTokens: aiResponse.usage?.prompt_tokens || 'N/A',
      completionTokens: aiResponse.usage?.completion_tokens || 'N/A',
      totalTokens: aiResponse.usage?.total_tokens || 'N/A',
      responsePreview: aiResponse.text.substring(0, 100) + '...',
      message: `Test completed with ${aiResponse.provider}. Check token usage above.`
    });

  } catch (error) {
    console.error('AI token test error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}
