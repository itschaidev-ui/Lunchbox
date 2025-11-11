import admin from 'firebase-admin';

// Track if we have valid credentials
let hasValidCredentials = false;

// Initialize Firebase Admin
if (!admin.apps.length) {
  let serviceAccount: any;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Full service account JSON provided
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    // Ensure project_id exists (handle both snake_case and camelCase)
    if (!serviceAccount.project_id && serviceAccount.projectId) {
      serviceAccount.project_id = serviceAccount.projectId;
    }
  } else {
    // Build service account object from individual env vars
    const projectId = process.env.FIREBASE_PROJECT_ID || 'studio-7195653935-eecd8'; // Fallback to client config project ID
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    
    serviceAccount = {
      project_id: projectId,
      private_key: privateKey,
      client_email: clientEmail,
    };
  }

  // Validate that we have the required fields
  if (!serviceAccount.project_id) {
    console.warn('⚠️ Firebase Admin: Missing project_id. Using fallback project ID.');
    serviceAccount.project_id = 'studio-7195653935-eecd8'; // Fallback to client config project ID
  }

  // Only initialize if we have credentials (private_key and client_email)
  // Without credentials, Admin SDK cannot authenticate to Firestore
  if (serviceAccount.private_key && serviceAccount.client_email) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id, // Explicitly set project ID
      });
      hasValidCredentials = true;
      console.log('✅ Firebase Admin initialized successfully with credentials');
    } catch (err) {
      console.error('❌ Firebase Admin: Failed to initialize with service account:', err);
      hasValidCredentials = false;
      // Don't try to initialize without credentials - it won't work
    }
  } else {
    console.warn('⚠️ Firebase Admin: Missing credentials (private_key or client_email).');
    console.warn('⚠️ Admin operations will be disabled until credentials are provided.');
    console.warn('⚠️ Set FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL environment variables.');
    hasValidCredentials = false;
    // Don't initialize without credentials - it will fail when trying to use Firestore
  }
}

// Export Admin services - check dynamically to handle module caching issues
// Create getter functions that check credentials each time they're accessed
function getAdminDb(): admin.firestore.Firestore | null {
  if (admin.apps.length === 0) {
    return null;
  }
  
  try {
    // Check if app was initialized with credentials
    const app = admin.apps[0];
    const options = (app as any).options;
    const credential = options?.credential;
    
    // If no credential or credential is not a service account cert, return null
    if (!credential) {
      return null;
    }
    
    // Try to access Firestore - this will work if credentials are valid
    const db = admin.firestore();
    return db;
  } catch (err) {
    console.warn('⚠️ Firebase Admin Firestore not available:', err);
    return null;
  }
}

function getAdminAuth(): admin.auth.Auth | null {
  if (admin.apps.length === 0) {
    return null;
  }
  
  try {
    // Check if app was initialized with credentials
    const app = admin.apps[0];
    const options = (app as any).options;
    const credential = options?.credential;
    
    // If no credential, return null
    if (!credential) {
      return null;
    }
    
    const auth = admin.auth();
    return auth;
  } catch (err) {
    console.warn('⚠️ Firebase Admin Auth not available:', err);
    return null;
  }
}

// Export as getters that check each time (handles module caching)
export const adminDb = getAdminDb();
export const adminAuth = getAdminAuth();

// Also export getter functions for dynamic access (use these if you need fresh checks)
export function getDb() {
  return getAdminDb();
}

export function getAuth() {
  return getAdminAuth();
}

export default admin;

