// Get Firebase functions (will be available after popup.html loads them)
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebaseApp && window.firebaseAuth) {
            resolve();
            return;
        }
        window.addEventListener('firebase-ready', () => resolve(), { once: true });
    });
}
const firebaseConfig = {
    apiKey: "AIzaSyCgywZbVA9aYUxqNiOKVxXVk3KLTJJSSho",
    authDomain: "studio-7195653935-eecd8.firebaseapp.com",
    projectId: "studio-7195653935-eecd8",
    storageBucket: "studio-7195653935-eecd8.firebasestorage.app",
    messagingSenderId: "618021672555",
    appId: "1:618021672555:web:c3f3c2360d0cb63cf2432e"
};
// Initialize Firebase (will be called after Firebase is loaded)
let app = null;
let auth = null;
async function initFirebase() {
    await waitForFirebase();
    if (!window.firebaseApp || !window.firebaseAuth) {
        throw new Error('Firebase not loaded');
    }
    app = window.firebaseApp(firebaseConfig);
    auth = window.firebaseAuth.getAuth(app);
}
// Initialize immediately
initFirebase();
export class FirebaseAuth {
    async getCurrentUser() {
        await initFirebase();
        return new Promise((resolve) => {
            const unsubscribe = window.firebaseAuth.onAuthStateChanged(auth, (user) => {
                unsubscribe();
                resolve(user);
            });
        });
    }
    async getIdToken() {
        await initFirebase();
        const user = await this.getCurrentUser();
        if (!user)
            return null;
        try {
            const token = await user.getIdToken();
            // Store token for API calls and background script
            await chrome.storage.local.set({ firebaseAuthToken: token });
            // Notify background script of auth completion
            chrome.runtime.sendMessage({
                type: 'AUTH_COMPLETE',
                token: token,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName
                }
            });
            return token;
        }
        catch (error) {
            console.error('Error getting ID token:', error);
            return null;
        }
    }
    async isAuthenticated() {
        await initFirebase();
        const user = await this.getCurrentUser();
        return user !== null;
    }
    async signIn() {
        await initFirebase();
        // Open Lunchbox website for authentication
        const url = 'https://lunchbox.chaimode.dev/login?extension=true';
        await chrome.tabs.create({ url });
        // Listen for auth state changes
        return new Promise((resolve) => {
            const unsubscribe = window.firebaseAuth.onAuthStateChanged(auth, async (user) => {
                if (user) {
                    unsubscribe();
                    await this.getIdToken();
                    resolve();
                }
            });
        });
    }
    async signOut() {
        await initFirebase();
        await auth.signOut();
        await chrome.storage.local.remove(['firebaseAuthToken', 'firebaseUser']);
    }
}
export const firebaseAuth = new FirebaseAuth();
