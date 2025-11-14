import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
const firebaseConfig = {
    apiKey: "AIzaSyCgywZbVA9aYUxqNiOKVxXVk3KLTJJSSho",
    authDomain: "studio-7195653935-eecd8.firebaseapp.com",
    projectId: "studio-7195653935-eecd8",
    storageBucket: "studio-7195653935-eecd8.firebasestorage.app",
    messagingSenderId: "618021672555",
    appId: "1:618021672555:web:c3f3c2360d0cb63cf2432e"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export class FirebaseAuth {
    async getCurrentUser() {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                resolve(user);
            });
        });
    }
    async getIdToken() {
        const user = await this.getCurrentUser();
        if (!user)
            return null;
        try {
            const token = await user.getIdToken();
            // Store token for API calls
            await chrome.storage.local.set({ firebaseAuthToken: token });
            return token;
        }
        catch (error) {
            console.error('Error getting ID token:', error);
            return null;
        }
    }
    async isAuthenticated() {
        const user = await this.getCurrentUser();
        return user !== null;
    }
    async signIn() {
        // Open Lunchbox website for authentication
        const url = 'https://lunchbox.chaimode.dev/login';
        await chrome.tabs.create({ url });
        // Listen for auth state changes
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    unsubscribe();
                    await this.getIdToken();
                    resolve();
                }
            });
        });
    }
    async signOut() {
        await auth.signOut();
        await chrome.storage.local.remove(['firebaseAuthToken']);
    }
}
export const firebaseAuth = new FirebaseAuth();
