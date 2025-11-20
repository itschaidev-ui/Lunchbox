import { NextRequest, NextResponse } from 'next/server';
import { multiProviderAI } from '@/lib/ai/multi-provider';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get('imageUrl') || 'http://localhost:9002/images/lunchbox-ai-logo.png';
  const prompt = searchParams.get('prompt') || 'Describe this image in detail. What do you see?';
  const model = searchParams.get('model') || 'llama-4-scout';

  try {
    // Build message with image for Groq vision
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a helpful AI assistant that analyzes images. Provide detailed descriptions of what you see.'
      },
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: prompt
          },
          {
            type: 'image_url' as const,
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ];

    console.log('🧪 Testing Groq Vision API:', {
      model,
      imageUrl,
      prompt,
      messageFormat: 'OpenAI-compatible vision format',
      hasGroqApiKey: !!process.env.GROQ_API_KEY,
      groqApiKeyLength: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0
    });

    // Call Groq vision model directly
    const response = await multiProviderAI.generateResponse(messages, model);

    return NextResponse.json({
      success: true,
      model: model,
      provider: response.provider,
      response: response.text,
      imageUrl: imageUrl,
      prompt: prompt,
      tokenUsage: response.usage,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Groq Vision Test Error (GET):', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Unknown error',
      model: model,
      imageUrl: imageUrl,
      prompt: prompt,
      details: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        hasGroqApiKey: !!process.env.GROQ_API_KEY,
        groqApiKeyLength: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0
      },
      timestamp: new Date().toISOString()
    };
    
    console.error('   Returning error response:', JSON.stringify(errorResponse, null, 2));
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
    const { imageUrl, prompt, model } = body;

    const finalImageUrl = imageUrl || 'http://localhost:9002/images/lunchbox-ai-logo.png';
    const finalPrompt = prompt || 'Describe this image in detail. What do you see?';
    const finalModel = model || 'llama-4-scout';

    // Build message with image for Groq vision
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a helpful AI assistant that analyzes images. Provide detailed descriptions of what you see.'
      },
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: finalPrompt
          },
          {
            type: 'image_url' as const,
            image_url: {
              url: finalImageUrl
            }
          }
        ]
      }
    ];

    console.log('🧪 Testing Groq Vision API (POST):', {
      model: finalModel,
      imageUrl: finalImageUrl,
      prompt: finalPrompt,
      messageFormat: 'OpenAI-compatible vision format',
      hasApiKey: !!process.env.GROQ_API_KEY
    });

    // Call Groq vision model directly
    const response = await multiProviderAI.generateResponse(messages, finalModel);

    return NextResponse.json({
      success: true,
      model: finalModel,
      provider: response.provider,
      response: response.text,
      imageUrl: finalImageUrl,
      prompt: finalPrompt,
      tokenUsage: response.usage,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Groq Vision Test Error (POST):', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Unknown error',
      model: body?.model || 'llama-4-scout',
      imageUrl: body?.imageUrl,
      prompt: body?.prompt,
      details: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        hasGroqApiKey: !!process.env.GROQ_API_KEY,
        groqApiKeyLength: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0
      },
      timestamp: new Date().toISOString()
    };
    
    console.error('   Returning error response:', JSON.stringify(errorResponse, null, 2));
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

