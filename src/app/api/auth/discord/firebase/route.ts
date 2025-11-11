import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { userData, accessToken } = await request.json();

    if (!userData || !userData.id || !userData.username) {
      return NextResponse.json({ error: 'Invalid user data from Discord' }, { status: 400 });
    }

    // Create a unique user ID for Discord users
    const userId = `discord_${userData.id}`;
    const email = userData.email || `${userData.id}@discord.local`;
    const displayName = userData.global_name || userData.username;
    const photoURL = userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : undefined;

    // Create a predictable password for Discord users (they'll use Discord OAuth, not email/password)
    const tempPassword = `discord_${userData.id}`;

    let firebaseUser;
    
    try {
      // Try to create a new Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
      firebaseUser = userCredential.user;
      
      console.log('Created new Firebase Auth user:', firebaseUser.uid);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        // User exists, try to sign them in
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, tempPassword);
          firebaseUser = userCredential.user;
          console.log('Signed in existing Firebase Auth user:', firebaseUser.uid);
        } catch (signInError: any) {
          // If sign in fails, create a new user with a different email
          const uniqueEmail = `${userData.id}_${Date.now()}@discord.local`;
          const userCredential = await createUserWithEmailAndPassword(auth, uniqueEmail, tempPassword);
          firebaseUser = userCredential.user;
          
          console.log('Created Firebase Auth user with unique email:', firebaseUser.uid);
        }
      } else {
        throw error;
      }
    }

    // Update the Firebase user profile with Discord info
    await updateProfile(firebaseUser, {
      displayName: displayName,
      photoURL: photoURL,
    });

    // Store user data in Firestore
    const userRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userRef, {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: displayName,
      photoURL: photoURL,
      // Discord-specific fields
      discordId: userData.id,
      discordUsername: userData.username,
      discordAvatar: userData.avatar,
      discordAccessToken: accessToken,
      discordEnabled: true,
      reminderTimes: [1, 24], // Default: 1 hour and 24 hours before due
      timezone: 'UTC',
      createdAt: new Date(),
      lastActive: new Date()
    }, { merge: true });

    // The user is already signed in on the server side
    // We need to return the user data so the client can handle the auth state
    return NextResponse.json({ 
      success: true, 
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: displayName,
      photoURL: photoURL,
      tempPassword: tempPassword, // Add this
      // Return the Firebase Auth user data for frontend authentication
      firebaseUser: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName,
        photoURL: photoURL
      }
    });

  } catch (error: any) {
    console.error('Firebase user creation error:', error);
    return NextResponse.json({ 
      error: `Failed to create Firebase user: ${error.message}` 
    }, { status: 500 });
  }
}
