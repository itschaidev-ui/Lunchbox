// Firebase utilities for service worker (background script)
// Service workers can't use Firebase SDK, so we use REST API
const FIREBASE_API_KEY = "AIzaSyCgywZbVA9aYUxqNiOKVxXVk3KLTJJSSho";
const FIREBASE_PROJECT_ID = "studio-7195653935-eecd8";
export class FirebaseAuth {
    async getCurrentUser() {
        // Get user from stored token
        const result = await chrome.storage.local.get(['firebaseUser', 'firebaseAuthToken']);
        return result.firebaseUser || null;
    }
    async getIdToken() {
        const result = await chrome.storage.local.get(['firebaseAuthToken']);
        return result.firebaseAuthToken || null;
    }
    async isAuthenticated() {
        const token = await this.getIdToken();
        return token !== null;
    }
    async signIn() {
        // Open Lunchbox website for authentication
        const url = 'https://lunchbox.chaimode.dev/login?extension=true';
        await chrome.tabs.create({ url });
        // Listen for auth completion via message from content script or popup
        // The popup/content script will send AUTH_COMPLETE message with token
        return new Promise((resolve) => {
            const listener = (message, sender, sendResponse) => {
                if (message.type === 'AUTH_COMPLETE') {
                    // Store the token
                    chrome.storage.local.set({
                        firebaseAuthToken: message.token,
                        firebaseUser: message.user
                    });
                    chrome.runtime.onMessage.removeListener(listener);
                    resolve();
                }
                return true; // Keep channel open for async
            };
            chrome.runtime.onMessage.addListener(listener);
        });
    }
    async signOut() {
        await chrome.storage.local.remove(['firebaseAuthToken', 'firebaseUser']);
    }
}
export const firebaseAuth = new FirebaseAuth();
