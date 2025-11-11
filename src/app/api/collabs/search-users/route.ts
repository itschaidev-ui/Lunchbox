import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchLower = query.toLowerCase().trim();
    const adminDb = getDb();
    
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    const results: Array<{
      userId: string;
      email: string;
      displayName?: string;
      discordUsername?: string;
    }> = [];

    // Search in users collection
    const usersSnapshot = await adminDb.collection('users').limit(100).get();
    
    // Also search in discord_links for username matches
    const discordLinksSnapshot = await adminDb.collection('discord_links').limit(100).get();
    
    // Create a map of uid -> discord username
    const discordMap = new Map<string, string>();
    for (const linkDoc of discordLinksSnapshot.docs) {
      const linkData = linkDoc.data();
      if (linkData.uid && linkData.username) {
        discordMap.set(linkData.uid, linkData.username);
      }
    }

    // Process users
    const seenUserIds = new Set<string>();
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const email = (userData.email || '').toLowerCase();
      const displayName = (userData.displayName || userData.name || '').toLowerCase();
      const discordUsername = discordMap.get(userId);
      const discordUsernameLower = discordUsername?.toLowerCase() || '';
      
      // Check if matches email, display name, or Discord username
      const matchesEmail = email.includes(searchLower);
      const matchesDisplayName = displayName.includes(searchLower);
      const matchesDiscord = discordUsernameLower.includes(searchLower);
      
      if ((matchesEmail || matchesDisplayName || matchesDiscord) && !seenUserIds.has(userId)) {
        seenUserIds.add(userId);
        results.push({
          userId,
          email: userData.email || '',
          displayName: userData.displayName || userData.name,
          discordUsername,
        });
      }
    }
    
    // Also check discord_links directly for username matches
    for (const linkDoc of discordLinksSnapshot.docs) {
      const linkData = linkDoc.data();
      const discordUsername = linkData.username || linkData.discordUsername || '';
      const discordUsernameLower = discordUsername.toLowerCase();
      
      if (discordUsernameLower.includes(searchLower) && linkData.uid && !seenUserIds.has(linkData.uid)) {
        // Get user data
        try {
          const userDoc = await adminDb.collection('users').doc(linkData.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            seenUserIds.add(linkData.uid);
            results.push({
              userId: linkData.uid,
              email: userData?.email || '',
              displayName: userData?.displayName || userData?.name,
              discordUsername,
            });
          }
        } catch (err) {
          // User not found, skip
        }
      }
    }

    // Sort results: exact matches first, then partial matches
    results.sort((a, b) => {
      const aEmail = a.email.toLowerCase();
      const bEmail = b.email.toLowerCase();
      const aName = (a.displayName || '').toLowerCase();
      const bName = (b.displayName || '').toLowerCase();
      const aDiscord = (a.discordUsername || '').toLowerCase();
      const bDiscord = (b.discordUsername || '').toLowerCase();
      
      // Exact matches first
      const aExact = aEmail === searchLower || aName === searchLower || aDiscord === searchLower;
      const bExact = bEmail === searchLower || bName === searchLower || bDiscord === searchLower;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Then by starts with
      const aStarts = aEmail.startsWith(searchLower) || aName.startsWith(searchLower) || aDiscord.startsWith(searchLower);
      const bStarts = bEmail.startsWith(searchLower) || bName.startsWith(searchLower) || bDiscord.startsWith(searchLower);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return 0;
    });

    return NextResponse.json({
      results: results.slice(0, 10), // Limit to 10 results
      query: searchLower,
    });
  } catch (error: any) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search users', results: [] },
      { status: 500 }
    );
  }
}

