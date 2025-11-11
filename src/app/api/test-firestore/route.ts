import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * GET /api/test-firestore
 * Test Firestore permissions and connectivity
 */
export async function GET() {
  try {
    console.log('🧪 Testing Firestore permissions...');
    
    // Test reading from scheduled_notifications collection only (this should work)
    const notificationsQuery = query(collection(db, 'scheduled_notifications'));
    const notificationsSnapshot = await getDocs(notificationsQuery);
    console.log('✅ Scheduled notifications collection accessible, found', notificationsSnapshot.docs.length, 'notifications');
    
    return NextResponse.json({
      success: true,
      message: 'Firestore permissions test passed for scheduled_notifications',
      collections: {
        scheduled_notifications: notificationsSnapshot.docs.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Firestore permissions test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Firestore permissions test failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
