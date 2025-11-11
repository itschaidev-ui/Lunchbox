import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { animationId } = await request.json();
    
    if (!animationId) {
      return NextResponse.json(
        { error: 'Animation ID is required' },
        { status: 400 }
      );
    }

    // Get user from auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const adminAuth = getAuth();
    const adminDb = getDb();
    
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Admin service not available. Please configure Firebase Admin credentials.' },
        { status: 503 }
      );
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    console.log(`[API] Unlocking animation ${animationId} for user ${uid}`);

    // Get current document
    const prefsRef = adminDb.collection('userPreferences').doc(uid);
    const prefsDoc = await prefsRef.get();
    
    const currentUnlocked = prefsDoc.exists 
      ? (prefsDoc.data()?.unlockedAnimations || [])
      : [];
    
    console.log(`[API] Current unlocked: ${JSON.stringify(currentUnlocked)}`);

    if (currentUnlocked.includes(animationId)) {
      return NextResponse.json({
        success: true,
        message: 'Animation already unlocked',
        unlockedAnimations: currentUnlocked,
      });
    }

    // Use transaction to update
    const result = await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(prefsRef);
      const existingUnlocked = doc.exists 
        ? (doc.data()?.unlockedAnimations || [])
        : [];
      
      if (!existingUnlocked.includes(animationId)) {
        const newUnlocked = [...existingUnlocked, animationId];
        
        if (doc.exists) {
          const docData = doc.data();
          if (docData?.unlockedAnimations === undefined || docData?.unlockedAnimations === null) {
            // Field doesn't exist, set it directly
            transaction.update(prefsRef, {
              unlockedAnimations: [animationId],
              updatedAt: FieldValue.serverTimestamp(),
              userId: uid,
            });
          } else {
            // Field exists, use arrayUnion
            transaction.update(prefsRef, {
              unlockedAnimations: FieldValue.arrayUnion(animationId),
              updatedAt: FieldValue.serverTimestamp(),
              userId: uid,
            });
          }
        } else {
          // Create new document
          transaction.set(prefsRef, {
            unlockedAnimations: [animationId],
            updatedAt: FieldValue.serverTimestamp(),
            userId: uid,
          });
        }
        
        return newUnlocked;
      }
      
      return existingUnlocked;
    });

    console.log(`[API] Successfully unlocked. New unlocked: ${JSON.stringify(result)}`);

    // Verify the write
    const verifyDoc = await prefsRef.get();
    const verifiedUnlocked = verifyDoc.exists 
      ? (verifyDoc.data()?.unlockedAnimations || [])
      : [];
    
    console.log(`[API] Verified unlocked: ${JSON.stringify(verifiedUnlocked)}`);

    return NextResponse.json({
      success: true,
      message: 'Animation unlocked successfully',
      unlockedAnimations: verifiedUnlocked,
    });
  } catch (error: any) {
    console.error('[API] Error unlocking animation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unlock animation' },
      { status: 500 }
    );
  }
}

