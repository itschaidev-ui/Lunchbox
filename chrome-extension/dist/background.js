import { api } from './utils/api.js';
import { firebaseAuth } from './utils/firebase-background.js';
// Initialize context menu on install
chrome.runtime.onInstalled.addListener(() => {
    createContextMenus();
    checkAuthStatus();
});
// Create context menu items
function createContextMenus() {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'create-task-from-selection',
            title: 'Add to Lunchbox',
            contexts: ['selection'],
        });
        chrome.contextMenus.create({
            id: 'create-task-with-date',
            title: 'Add to Lunchbox (with date)',
            contexts: ['selection'],
        });
        chrome.contextMenus.create({
            id: 'analyze-page',
            title: 'Solve this page with Lunchbox AI',
            contexts: ['page'],
        });
        chrome.contextMenus.create({
            id: 'create-task-from-link',
            title: 'Create task from link',
            contexts: ['link'],
        });
        chrome.contextMenus.create({
            id: 'save-page-for-later',
            title: 'Save page for later',
            contexts: ['page'],
        });
    });
}
// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id)
        return;
    try {
        switch (info.menuItemId) {
            case 'create-task-from-selection':
                await handleCreateTaskFromSelection(tab.id, info.selectionText || '');
                break;
            case 'create-task-with-date':
                await handleCreateTaskWithDate(tab.id, info.selectionText || '');
                break;
            case 'analyze-page':
                await handleAnalyzePage(tab.id);
                break;
            case 'create-task-from-link':
                // Get link text from the page if available
                const linkText = await getLinkText(tab.id, info.linkUrl || '');
                await handleCreateTaskFromLink(info.linkUrl || '', linkText || tab?.title || 'Link');
                break;
            case 'save-page-for-later':
                await handleSavePageForLater(tab.id);
                break;
        }
    }
    catch (error) {
        console.error('Error handling context menu:', error);
        showNotification('Error', error.message || 'Something went wrong');
    }
});
// Helper function to get link text from the page
async function getLinkText(tabId, url) {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                const link = document.querySelector(`a[href="${window.location.href}"]`);
                return link?.textContent?.trim() || null;
            },
        });
        return results[0]?.result || null;
    }
    catch {
        return null;
    }
}
async function handleCreateTaskFromSelection(tabId, text) {
    if (!text.trim()) {
        showNotification('Error', 'No text selected');
        return;
    }
    const isAuthenticated = await firebaseAuth.isAuthenticated();
    if (!isAuthenticated) {
        await promptSignIn();
        return;
    }
    const tab = await chrome.tabs.get(tabId);
    const task = {
        text: text.trim(),
        sourceUrl: tab.url,
        sourceTitle: tab.title,
    };
    try {
        await api.createTask(task);
        showNotification('Success', 'Task created successfully!');
    }
    catch (error) {
        showNotification('Error', error.message);
    }
}
async function handleCreateTaskWithDate(tabId, text) {
    if (!text.trim()) {
        showNotification('Error', 'No text selected');
        return;
    }
    const isAuthenticated = await firebaseAuth.isAuthenticated();
    if (!isAuthenticated) {
        await promptSignIn();
        return;
    }
    // Open a dialog to select date (we'll use a simple prompt for now)
    const date = prompt('Enter due date (e.g., 2024-12-25 or "tomorrow"):');
    if (!date)
        return;
    const tab = await chrome.tabs.get(tabId);
    const task = {
        text: text.trim(),
        dueDate: date,
        sourceUrl: tab.url,
        sourceTitle: tab.title,
    };
    try {
        await api.createTask(task);
        showNotification('Success', 'Task created with due date!');
    }
    catch (error) {
        showNotification('Error', error.message);
    }
}
async function handleAnalyzePage(tabId) {
    const isAuthenticated = await firebaseAuth.isAuthenticated();
    if (!isAuthenticated) {
        await promptSignIn();
        return;
    }
    showNotification('Analyzing', 'Analyzing page content...');
    // Inject content script to extract page content
    const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: extractPageContent,
    });
    if (!results || !results[0]?.result) {
        showNotification('Error', 'Failed to extract page content');
        return;
    }
    const { content, title, url } = results[0].result;
    try {
        const analysis = await api.analyzePage(content, url, title);
        // Show analysis results
        if (analysis.suggestedTasks && analysis.suggestedTasks.length > 0) {
            // Open popup or show notification with tasks
            showNotification('Analysis Complete', `Found ${analysis.suggestedTasks.length} suggested tasks. Click to view.`);
            // Store analysis for popup to display
            await chrome.storage.local.set({
                lastAnalysis: analysis,
                lastPageUrl: url,
            });
        }
        else {
            showNotification('Analysis Complete', 'Page analyzed. Check popup for details.');
        }
    }
    catch (error) {
        showNotification('Error', error.message);
    }
}
async function handleCreateTaskFromLink(url, title) {
    const isAuthenticated = await firebaseAuth.isAuthenticated();
    if (!isAuthenticated) {
        await promptSignIn();
        return;
    }
    const task = {
        text: title || 'Check this link',
        description: `Link: ${url}`,
        sourceUrl: url,
    };
    try {
        await api.createTask(task);
        showNotification('Success', 'Task created from link!');
    }
    catch (error) {
        showNotification('Error', error.message);
    }
}
async function handleSavePageForLater(tabId) {
    const isAuthenticated = await firebaseAuth.isAuthenticated();
    if (!isAuthenticated) {
        await promptSignIn();
        return;
    }
    const tab = await chrome.tabs.get(tabId);
    const task = {
        text: `Read: ${tab.title || 'Saved page'}`,
        description: `Saved for later reading\n\nURL: ${tab.url}`,
        sourceUrl: tab.url,
        sourceTitle: tab.title,
        tags: ['read-later'],
    };
    try {
        await api.createTask(task);
        showNotification('Success', 'Page saved for later!');
    }
    catch (error) {
        showNotification('Error', error.message);
    }
}
// Helper function to extract page content (runs in page context)
function extractPageContent() {
    const title = document.title;
    const url = window.location.href;
    // Get main content
    let content = '';
    const mainSelectors = ['article', 'main', '[role="main"]', '.content', 'body'];
    for (const selector of mainSelectors) {
        const el = document.querySelector(selector);
        if (el) {
            const clone = el.cloneNode(true);
            clone.querySelectorAll('script, style, nav, header, footer').forEach(e => e.remove());
            content = clone.textContent || '';
            break;
        }
    }
    return { content: content.substring(0, 10000), title, url };
}
async function promptSignIn() {
    const result = await chrome.tabs.create({
        url: 'https://lunchbox.chaimode.dev/login?extension=true',
    });
    // Listen for auth completion
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === result.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            checkAuthStatus();
        }
    });
}
async function checkAuthStatus() {
    const isAuthenticated = await firebaseAuth.isAuthenticated();
    if (isAuthenticated) {
        await firebaseAuth.getIdToken();
        updateBadge();
    }
    else {
        chrome.action.setBadgeText({ text: '' });
    }
}
async function updateBadge() {
    // Update badge with task count (would need API endpoint for this)
    // For now, just show a dot to indicate authenticated
    chrome.action.setBadgeText({ text: '•' });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
}
function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title,
        message,
    });
}
// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CREATE_TASK') {
        handleCreateTaskFromMessage(message.data)
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
    }
    if (message.type === 'ANALYZE_PAGE') {
        handleAnalyzePage(sender.tab?.id || 0)
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
    }
    if (message.type === 'CHECK_AUTH') {
        firebaseAuth.isAuthenticated()
            .then((auth) => sendResponse({ authenticated: auth }))
            .catch(() => sendResponse({ authenticated: false }));
        return true;
    }
    if (message.type === 'AUTH_COMPLETE') {
        // Store the token and user info
        chrome.storage.local.set({
            firebaseAuthToken: message.token,
            firebaseUser: message.user
        }).then(() => {
            console.log('✅ Auth token stored from website:', message.user?.email);
            updateBadge();
            // Notify popup if it's open
            chrome.runtime.sendMessage({
                type: 'AUTH_SYNCED',
                user: message.user
            }).catch(() => {
                // Popup might not be open, that's okay
            });
            sendResponse({ success: true });
        }).catch((error) => {
            console.error('Error storing auth token:', error);
            sendResponse({ success: false, error: error.message });
        });
        return true; // Keep channel open
    }
});
async function handleCreateTaskFromMessage(data) {
    const isAuthenticated = await firebaseAuth.isAuthenticated();
    if (!isAuthenticated) {
        throw new Error('Please sign in to Lunchbox first');
    }
    await api.createTask(data);
}
// Periodic badge update
setInterval(updateBadge, 60000); // Update every minute
