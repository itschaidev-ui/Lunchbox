import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { discordId } = await request.json();

    if (!discordId) {
      return NextResponse.json(
        { error: 'Missing Discord ID' },
        { status: 400 }
      );
    }

    // Try to use Admin SDK if available
    try {
      const { adminDb } = await import('@/lib/firebase-admin');
      
      if (!adminDb) {
        console.warn('⚠️ Firebase Admin not available for unlink operation');
        return NextResponse.json(
          { error: 'Admin service not available. Please configure Firebase Admin credentials.' },
          { status: 503 }
        );
      }

      // Delete discord link
      await adminDb.collection('discord_links').doc(discordId).delete();

      return NextResponse.json({ success: true });
    } catch (adminError) {
      console.error('Error using Admin SDK:', adminError);
      return NextResponse.json(
        { error: 'Failed to unlink Discord account - Admin service error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error unlinking Discord:', error);
    return NextResponse.json(
      { error: 'Failed to unlink Discord account' },
      { status: 500 }
    );
  }
}

