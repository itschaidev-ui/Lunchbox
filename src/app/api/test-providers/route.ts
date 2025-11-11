import { NextRequest, NextResponse } from 'next/server';
import { multiProviderAI } from '../../../lib/ai/multi-provider';

export async function GET(request: NextRequest) {
  try {
    const status = multiProviderAI.getProviderStatus();
    const currentProvider = multiProviderAI.getCurrentProvider();
    
    return NextResponse.json({
      success: true,
      currentProvider,
      providerStatus: status,
      message: 'Multi-provider system status retrieved'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, model } = await request.json();
    
    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }

    // Test the multi-provider system
    const response = await multiProviderAI.generateResponse([
      { role: 'user', content: message }
    ]);

    return NextResponse.json({
      success: true,
      response: response.text,
      provider: response.provider,
      model: model || 'default',
      usage: response.usage
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
