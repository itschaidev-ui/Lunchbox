import { NextRequest, NextResponse } from 'next/server';
import { multiProviderAI } from '@/lib/ai/multi-provider';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt provided' },
        { status: 400 }
      );
    }

    // Use multi-provider AI to enhance the prompt with a concise instruction
    const messages = [
      {
        role: 'user' as const,
        content: `Enhance this prompt to be more detailed and effective. Keep the core meaning but add clarity and specificity. Return only the enhanced version, nothing else.

Original: "${prompt}"

Enhanced:`,
      },
    ];

    const response = await multiProviderAI.generateResponse(messages);
    
    const enhancedPrompt = response.text.trim() || prompt;

    return NextResponse.json({ enhancedPrompt });
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return NextResponse.json(
      { error: 'Failed to enhance prompt' },
      { status: 500 }
    );
  }
}

