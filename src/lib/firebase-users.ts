import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  lastSignInTime?: any;
  creationTime?: any;
  totalTasksCreated?: number;
  totalTasksCompleted?: number;
  lastActive?: any;
  isOnline?: boolean;
  lastHeartbeat?: any;
}

const USERS_COLLECTION = 'users';

// Create or update user profile when they sign in
export const createOrUpdateUser = async (user: any): Promise<void> => {
  try {
    const userData: FirebaseUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastSignInTime: new Date(),
      creationTime: user.metadata?.creationTime ? new Date(user.metadata.creationTime) : new Date(),
      lastActive: new Date()
    };

    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await setDoc(userRef, userData, { merge: true });
  } catch (error) {
    console.error('Error creating/updating user:', error);
  }
};

// Get all users from the users collection
export const getAllUsers = async (): Promise<FirebaseUser[]> => {
  try {
    const usersQuery = query(
      collection(db, USERS_COLLECTION),
      orderBy('lastActive', 'desc')
    );
    
    const querySnapshot = await getDocs(usersQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseUser & { id: string }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Update user's task statistics
export const updateUserTaskStats = async (userId: string, taskStats: {
  totalTasksCreated: number;
  totalTasksCompleted: number;
}): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userRef, {
      ...taskStats,
      lastActive: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user task stats:', error);
  }
};

// Update user's online status with heartbeat
export const updateUserHeartbeat = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userRef, {
      isOnline: true,
      lastHeartbeat: new Date(),
      lastActive: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user heartbeat:', error);
  }
};

// Set user offline
export const setUserOffline = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userRef, {
      isOnline: false,
      lastActive: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error setting user offline:', error);
  }
};