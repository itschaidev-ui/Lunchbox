import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { addMember } from '@/lib/firebase-collaborations';

export async function POST(request: NextRequest) {
  try {
    const { collabId, userIds } = await request.json();

    if (!collabId || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. collabId and userIds array required.' },
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

    // Get collaboration to find owner
    const collabDoc = await adminDb.collection('collaborations').doc(collabId).get();
    if (!collabDoc.exists) {
      return NextResponse.json(
        { error: 'Collaboration not found' },
        { status: 404 }
      );
    }

    const collab = collabDoc.data();
    const ownerId = collab?.ownerId;

    // Get default role (Member)
    const rolesQuery = await adminDb
      .collection('collaboration_roles')
      .where('collabId', '==', collabId)
      .where('name', '==', 'Member')
      .limit(1)
      .get();

    if (rolesQuery.empty) {
      return NextResponse.json(
        { error: 'Default role not found' },
        { status: 500 }
      );
    }

    const memberRoleId = rolesQuery.docs[0].id;

    // Add each user as a member
    const results = [];
    for (const userId of userIds) {
      try {
        // Check if user is already a member
        const existingMemberQuery = await adminDb
          .collection('collaboration_members')
          .where('collabId', '==', collabId)
          .where('userId', '==', userId)
          .limit(1)
          .get();

        if (!existingMemberQuery.empty) {
          results.push({ userId, status: 'already_member' });
          continue;
        }

        // Get user info
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        // Get Discord username if available
        // discord_links is stored by discordId, not userId, so we need to query by uid
        let discordUsername: string | undefined;
        try {
          const discordLinksQuery = await adminDb
            .collection('discord_links')
            .where('uid', '==', userId)
            .limit(1)
            .get();
          
          if (!discordLinksQuery.empty) {
            const discordData = discordLinksQuery.docs[0].data();
            discordUsername = discordData?.username || discordData?.discordUsername;
          }
        } catch (err) {
          // Discord link not found, continue without it
        }

        // Add member
        const memberRef = adminDb.collection('collaboration_members').doc();
        await memberRef.set({
          collabId,
          userId,
          email: userData?.email || '',
          displayName: userData?.displayName || userData?.name || '',
          discordUsername,
          roleId: memberRoleId,
          joinedAt: new Date().toISOString(),
          invitedBy: ownerId,
          status: 'pending', // They need to accept
        });

        results.push({ userId, status: 'invited', memberId: memberRef.id });
      } catch (error: any) {
        console.error(`Error inviting user ${userId}:`, error);
        results.push({ userId, status: 'error', error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Invited ${results.filter(r => r.status === 'invited').length} user(s)`,
    });
  } catch (error: any) {
    console.error('Error inviting members:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to invite members' },
      { status: 500 }
    );
  }
}

