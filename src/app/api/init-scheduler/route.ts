import { NextRequest, NextResponse } from 'next/server';
import { simpleScheduler } from '@/lib/scheduler/simple-scheduler';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Initializing scheduler...');
    
    // Start the scheduler if not already running
    simpleScheduler.start();
    
    const status = simpleScheduler.getStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Scheduler initialized successfully',
      scheduler: status
    });
  } catch (error) {
    console.error('❌ Error initializing scheduler:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize scheduler' },
      { status: 500 }
    );
  }
}
