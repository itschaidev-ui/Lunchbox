import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export async function POST(request: NextRequest) {
  try {
    const { discordId, email, uid, username, discordUser, accessToken } = await request.json();

    if (!discordId || !email || !uid) {
      return NextResponse.json(
        { error: 'Missing required fields: discordId, email, or uid' },
        { status: 400 }
      );
    }

    const adminDb = getDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    // Store Discord link in discord_links collection
    // Document ID is discordId (as per discord-bot/firebase-utils.js)
    const linkData = {
      discordId,
      uid, // Firebase User ID
      email,
      username: username || discordUser?.username || 'Unknown',
      discordUsername: discordUser?.username || discordUser?.global_name || username,
      discordAvatar: discordUser?.avatar || null,
      linkedAt: new Date().toISOString(),
      linkMethod: 'oauth',
      accessToken: accessToken || null, // Store access token (optional, for future use)
    };

    await adminDb.collection('discord_links').doc(discordId).set(linkData, { merge: true });

    // Get Discord avatar URL if available
    const discordPhotoURL = discordUser?.avatar 
      ? `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.png` 
      : undefined;
    
    // Also update user document with Discord info
    try {
      const userRef = adminDb.collection('users').doc(uid);
      await userRef.set({
        discordId,
        discordUsername: discordUser?.username || discordUser?.global_name || username,
        discordAvatar: discordUser?.avatar || null,
        photoURL: discordPhotoURL, // Also update photoURL in Firestore
        discordEnabled: true,
      }, { merge: true });
    } catch (userError) {
      console.warn('Could not update user document:', userError);
      // Continue even if user doc update fails
    }
    
    // Update Firebase Auth profile with Discord photo if available
    if (discordPhotoURL) {
      try {
        const adminAuth = getAuth();
        await adminAuth.updateUser(uid, {
          photoURL: discordPhotoURL,
        });
        console.log('Updated Firebase Auth profile with Discord photo');
      } catch (authError) {
        console.warn('Could not update Firebase Auth profile photo:', authError);
        // Continue even if auth profile update fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account linked successfully',
      linkData 
    });

  } catch (error: any) {
    console.error('Error linking Discord account:', error);
    return NextResponse.json(
      { error: `Failed to link Discord account: ${error.message}` },
      { status: 500 }
    );
  }
}

