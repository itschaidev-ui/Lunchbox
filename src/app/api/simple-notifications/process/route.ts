import { NextRequest, NextResponse } from 'next/server';
import { checkAndProcessNotifications, getNotificationStats } from '@/lib/notifications/simple-task-notifications';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Processing notifications...');
    
    await checkAndProcessNotifications();
    
    const stats = await getNotificationStats();
    
    return NextResponse.json({
      success: true,
      message: 'Notifications processed successfully',
      stats
    });

  } catch (error) {
    console.error('❌ Error processing notifications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process notifications',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = await getNotificationStats();
    
    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Error getting notification stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get notification stats',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
