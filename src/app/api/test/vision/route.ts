import { NextRequest, NextResponse } from 'next/server';
import { continueConversation, Message } from '@/ai/flows/chat';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Test endpoint for vision API
 * POST /api/test/vision
 * Body: { imageUrl?: string, prompt?: string, model?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, prompt = 'What do you see in this image? Describe it in detail.', model = 'gemini-2.0-flash' } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing Vision API');
    console.log('Image URL:', imageUrl);
    console.log('Model:', model);
    console.log('Prompt:', prompt);

    // Build message with image (using the format expected by continueConversation)
    const messages: Message[] = [
      {
        role: 'user',
        content: [
          {
            text: prompt
          },
          {
            image: imageUrl
          }
        ] as any // Type assertion needed because Message interface expects { text: string }[] but we also need { image: string }
      }
    ];

    // Call the AI chat function
    const responses = await continueConversation(
      messages,
      undefined,
      'message',
      false,
      undefined,
      model
    );

    const response = responses[0];
    const tokenUsage = response?.tokenUsage || null;

    return NextResponse.json({
      success: true,
      response: response?.text || 'No response',
      tokenUsage: tokenUsage,
      model: model
    });

  } catch (error: any) {
    console.error('Vision API test error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing with default image
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl') || 'http://localhost:9002/images/lunchbox-ai-logo.png';
    const prompt = searchParams.get('prompt') || 'What do you see in this image? Describe it in detail.';
    const model = searchParams.get('model') || 'gemini-2.0-flash';

    console.log('🧪 Testing Vision API (GET)');
    console.log('Image URL:', imageUrl);
    console.log('Model:', model);
    console.log('Prompt:', prompt);

    // Build message with image (using the format expected by continueConversation)
    const messages: Message[] = [
      {
        role: 'user',
        content: [
          {
            text: prompt
          },
          {
            image: imageUrl
          }
        ] as any // Type assertion needed because Message interface expects { text: string }[] but we also need { image: string }
      }
    ];

    // Call the AI chat function
    const responses = await continueConversation(
      messages,
      undefined,
      'message',
      false,
      undefined,
      model
    );

    const response = responses[0];
    const tokenUsage = response?.tokenUsage || null;

    return NextResponse.json({
      success: true,
      response: response?.text || 'No response',
      tokenUsage: tokenUsage,
      model: model,
      imageUrl: imageUrl,
      prompt: prompt
    });

  } catch (error: any) {
    console.error('Vision API test error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

