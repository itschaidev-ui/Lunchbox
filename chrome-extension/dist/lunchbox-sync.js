// Content script that runs on Lunchbox website to sync auth token with extension
// This script listens for postMessage from the website's ExtensionAuthSync component
console.log('🔌 lunchbox-sync.js: Content script loaded on', window.location.href);
// Check if we're on a Lunchbox page
if (!window.location.hostname.includes('lunchbox.chaimode.dev') &&
    !window.location.hostname.includes('studio-7195653935-eecd8')) {
    console.log('⚠️ lunchbox-sync.js: Not a Lunchbox page, exiting');
    // Not a Lunchbox page, exit
}
let lastToken = null;
async function sendTokenToExtension(token, user) {
    // Don't send the same token multiple times
    if (lastToken === token) {
        console.log('⏭️ lunchbox-sync.js: Token already sent, skipping');
        return;
    }
    lastToken = token;
    console.log('📤 lunchbox-sync.js: Sending token to extension background script', {
        email: user?.email,
        hasToken: !!token
    });
    try {
        chrome.runtime.sendMessage({
            type: 'AUTH_COMPLETE',
            token: token,
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
            }
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('❌ lunchbox-sync.js: Error sending to background:', chrome.runtime.lastError);
            }
            else {
                console.log('✅ lunchbox-sync.js: Auth token sent to extension background script', response);
            }
        });
    }
    catch (error) {
        console.error('❌ lunchbox-sync.js: Error sending token to extension:', error);
    }
}
// Listen for messages from the website's ExtensionAuthSync component
window.addEventListener('message', (event) => {
    console.log('📬 lunchbox-sync.js: Received postMessage', {
        origin: event.origin,
        type: event.data?.type,
        expectedOrigin: window.location.origin
    });
    // Only accept messages from same origin (the website itself)
    if (event.origin !== window.location.origin) {
        console.log('⚠️ lunchbox-sync.js: Rejected message from different origin');
        return;
    }
    if (event.data && event.data.type === 'FIREBASE_AUTH_TOKEN') {
        console.log('📨 lunchbox-sync.js: Received auth token from website', {
            email: event.data.user?.email
        });
        sendTokenToExtension(event.data.token, event.data.user);
    }
});
console.log('👂 lunchbox-sync.js: Listening for postMessage events');
