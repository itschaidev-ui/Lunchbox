// Simplified authentication for popup (no Firebase SDK needed)
// Uses token-based auth that syncs with the website
export class PopupAuth {
    async isAuthenticated() {
        const result = await chrome.storage.local.get(['firebaseAuthToken']);
        return !!result.firebaseAuthToken;
    }
    async getIdToken() {
        const result = await chrome.storage.local.get(['firebaseAuthToken']);
        return result.firebaseAuthToken || null;
    }
    async getCurrentUser() {
        const result = await chrome.storage.local.get(['firebaseUser']);
        return result.firebaseUser || null;
    }
    async signIn() {
        // Open Lunchbox website for authentication
        const url = 'https://lunchbox.chaimode.dev/login?extension=true';
        await chrome.tabs.create({ url });
        console.log('🔐 PopupAuth: Opened sign-in page');
        // Don't wait - user will paste code manually
    }
    async exchangeCode(code) {
        try {
            console.log('🔑 PopupAuth: Exchanging code for token...');
            const response = await fetch(`https://lunchbox.chaimode.dev/api/auth/extension-code?code=${code}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to exchange code');
            }
            const data = await response.json();
            if (!data.success || !data.customToken) {
                throw new Error('Invalid response from server');
            }
            // Exchange custom token for ID token using Firebase REST API
            const idTokenResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${this.getFirebaseApiKey()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: data.customToken, returnSecureToken: true }),
            });
            if (!idTokenResponse.ok) {
                throw new Error('Failed to get ID token');
            }
            const idTokenData = await idTokenResponse.json();
            // Store the ID token and user info
            await chrome.storage.local.set({
                firebaseAuthToken: idTokenData.idToken,
                firebaseUser: {
                    uid: data.userId,
                    email: data.email,
                }
            });
            console.log('✅ PopupAuth: Token stored successfully');
            return true;
        }
        catch (error) {
            console.error('❌ PopupAuth: Error exchanging code:', error);
            throw error;
        }
    }
    getFirebaseApiKey() {
        // Firebase Web API key (public, safe to expose)
        return 'AIzaSyCgywZbVA9aYUxqNiOKVxXVk3KLTJJSSho';
    }
    async signOut() {
        await chrome.storage.local.remove(['firebaseAuthToken', 'firebaseUser']);
    }
}
export const popupAuth = new PopupAuth();
