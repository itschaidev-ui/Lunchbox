import { api } from './utils/api.js';
import { popupAuth } from './popup-auth.js';
let currentTab = null;
document.addEventListener('DOMContentLoaded', async () => {
    // Get current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0] || null;
    // Listen for auth sync messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'AUTH_SYNCED') {
            console.log('✅ Popup: Received AUTH_SYNCED message', message.user);
            // Refresh the popup to show main screen
            initializePopup();
        }
        return true;
    });
    await initializePopup();
});
async function initializePopup() {
    console.log('🔄 Popup: Initializing...');
    const isAuthenticated = await popupAuth.isAuthenticated();
    console.log('🔐 Popup: Authentication status:', isAuthenticated);
    if (!isAuthenticated) {
        console.log('❌ Popup: Not authenticated, showing sign-in screen');
        showSignInScreen();
        return;
    }
    console.log('✅ Popup: Authenticated, showing main screen');
    const token = await popupAuth.getIdToken();
    const user = await popupAuth.getCurrentUser();
    console.log('👤 Popup: User info:', { email: user?.email, hasToken: !!token });
    if (token) {
        // Notify background script of auth completion
        chrome.runtime.sendMessage({
            type: 'AUTH_COMPLETE',
            token: token,
            user: user
        }).catch(err => console.error('Error notifying background:', err));
    }
    showMainScreen();
    await loadRecentAnalysis();
}
function showSignInScreen() {
    const container = document.getElementById('popup-container');
    if (!container)
        return;
    container.innerHTML = `
    <div class="sign-in-screen">
      <div class="logo">📦</div>
      <h2>Lunchbox AI</h2>
      <p>Sign in to start creating tasks</p>
      <button id="sign-in-btn" class="btn-primary">Sign In</button>
      <div id="code-input-section" style="display: none; margin-top: 16px;">
        <p style="font-size: 12px; color: #888; margin-bottom: 8px;">
          After signing in on the website, copy the code and paste it here:
        </p>
        <input 
          type="text" 
          id="code-input" 
          placeholder="Enter 6-digit code"
          maxlength="6"
          style="width: 100%; padding: 8px; border: 1px solid #444; border-radius: 4px; background: #1a1a1a; color: white; text-align: center; font-size: 18px; letter-spacing: 4px;"
        />
        <button id="submit-code-btn" class="btn-primary" style="width: 100%; margin-top: 8px;">Submit Code</button>
        <p id="code-error" style="color: #ff4444; font-size: 12px; margin-top: 8px; display: none;"></p>
      </div>
    </div>
  `;
    // Set up sign-in button click handler
    const signInBtn = document.getElementById('sign-in-btn');
    signInBtn?.addEventListener('click', async () => {
        await popupAuth.signIn();
        // Show code input section after a brief delay to ensure it's rendered
        setTimeout(() => {
            const codeSection = document.getElementById('code-input-section');
            if (codeSection) {
                codeSection.style.display = 'block';
            }
            // Focus on code input
            const codeInput = document.getElementById('code-input');
            if (codeInput) {
                codeInput.focus();
            }
            // Set up code submission handlers now that elements are visible
            setupCodeSubmission();
        }, 100);
    });
    function setupCodeSubmission() {
        const codeInput = document.getElementById('code-input');
        const submitBtn = document.getElementById('submit-code-btn');
        const codeError = document.getElementById('code-error');
        if (!codeInput || !submitBtn)
            return;
        // Remove existing listeners to avoid duplicates
        const newCodeInput = codeInput.cloneNode(true);
        const newSubmitBtn = submitBtn.cloneNode(true);
        codeInput.parentNode?.replaceChild(newCodeInput, codeInput);
        submitBtn.parentNode?.replaceChild(newSubmitBtn, submitBtn);
        // Add fresh event listeners
        newCodeInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter' && newCodeInput.value.length === 6) {
                await submitCode(newCodeInput, newSubmitBtn, codeError);
            }
        });
        newSubmitBtn.addEventListener('click', async () => {
            await submitCode(newCodeInput, newSubmitBtn, codeError);
        });
    }
    async function submitCode(codeInput, submitBtn, codeError) {
        const code = codeInput.value.trim();
        if (!code || code.length !== 6) {
            if (codeError) {
                codeError.textContent = 'Please enter a 6-digit code';
                codeError.style.display = 'block';
            }
            return;
        }
        if (codeError) {
            codeError.style.display = 'none';
        }
        submitBtn.textContent = 'Verifying...';
        submitBtn.disabled = true;
        try {
            await popupAuth.exchangeCode(code);
            // Success - refresh popup
            await initializePopup();
        }
        catch (error) {
            console.error('Error exchanging code:', error);
            if (codeError) {
                codeError.textContent = error.message || 'Invalid code. Please try again.';
                codeError.style.display = 'block';
            }
            codeInput.value = '';
            codeInput.focus();
        }
        finally {
            submitBtn.textContent = 'Submit Code';
            submitBtn.disabled = false;
        }
    }
}
function showMainScreen() {
    const container = document.getElementById('popup-container');
    if (!container)
        return;
    container.innerHTML = `
    <div class="main-screen">
      <div class="header">
        <h2>Lunchbox AI</h2>
        <button id="sign-out-btn" class="btn-icon">⚙️</button>
      </div>
      
      <div class="quick-actions">
        <button id="quick-create" class="action-btn">
          <span>➕</span>
          <span>Quick Create</span>
        </button>
        <button id="analyze-page" class="action-btn">
          <span>🔍</span>
          <span>Solve Page</span>
        </button>
        <button id="save-later" class="action-btn">
          <span>💾</span>
          <span>Save for Later</span>
        </button>
      </div>

      <div id="analysis-results" class="analysis-results" style="display: none;">
        <h3>Page Analysis</h3>
        <div id="analysis-content"></div>
        <div id="suggested-tasks"></div>
      </div>

      <div class="footer">
        <a href="https://lunchbox.chaimode.dev/tasks" target="_blank" class="link">
          View All Tasks →
        </a>
      </div>
    </div>
  `;
    // Add event listeners
    document.getElementById('quick-create')?.addEventListener('click', handleQuickCreate);
    document.getElementById('analyze-page')?.addEventListener('click', handleAnalyzePage);
    document.getElementById('save-later')?.addEventListener('click', handleSaveLater);
    document.getElementById('sign-out-btn')?.addEventListener('click', handleSignOut);
}
async function handleQuickCreate() {
    const text = prompt('Enter task text:');
    if (!text)
        return;
    try {
        await api.createTask({
            text: text.trim(),
            sourceUrl: currentTab?.url,
            sourceTitle: currentTab?.title,
        });
        showMessage('Task created!', 'success');
    }
    catch (error) {
        showMessage(error.message, 'error');
    }
}
async function handleAnalyzePage() {
    if (!currentTab?.id) {
        showMessage('No active tab', 'error');
        return;
    }
    showMessage('Analyzing page...', 'info');
    try {
        // Extract page content
        const results = await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: extractPageContent,
        });
        if (!results || !results[0]?.result) {
            throw new Error('Failed to extract page content');
        }
        const { content, title, url } = results[0].result;
        // Analyze with AI
        const analysis = await api.analyzePage(content, url, title);
        // Display results
        displayAnalysis(analysis);
    }
    catch (error) {
        showMessage(error.message, 'error');
    }
}
async function handleSaveLater() {
    if (!currentTab) {
        showMessage('No active tab', 'error');
        return;
    }
    try {
        await api.createTask({
            text: `Read: ${currentTab.title || 'Saved page'}`,
            description: `Saved for later reading\n\nURL: ${currentTab.url}`,
            sourceUrl: currentTab.url,
            sourceTitle: currentTab.title,
            tags: ['read-later'],
        });
        showMessage('Page saved for later!', 'success');
    }
    catch (error) {
        showMessage(error.message, 'error');
    }
}
async function handleSignOut() {
    await popupAuth.signOut();
    await initializePopup();
}
function displayAnalysis(analysis) {
    const resultsDiv = document.getElementById('analysis-results');
    const contentDiv = document.getElementById('analysis-content');
    const tasksDiv = document.getElementById('suggested-tasks');
    if (!resultsDiv || !contentDiv || !tasksDiv)
        return;
    resultsDiv.style.display = 'block';
    contentDiv.innerHTML = `<p>${analysis.analysis}</p>`;
    if (analysis.suggestedTasks && analysis.suggestedTasks.length > 0) {
        tasksDiv.innerHTML = `
      <h4>Suggested Tasks (${analysis.suggestedTasks.length})</h4>
      <div class="task-list">
        ${analysis.suggestedTasks.map((task, index) => `
          <div class="task-item">
            <input type="checkbox" id="task-${index}" data-task='${JSON.stringify(task)}'>
            <label for="task-${index}">${task.text}</label>
          </div>
        `).join('')}
      </div>
      <button id="create-all-tasks" class="btn-primary">Create All Tasks</button>
    `;
        document.getElementById('create-all-tasks')?.addEventListener('click', async () => {
            const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
            const tasks = Array.from(checkboxes).map(cb => JSON.parse(cb.dataset.task || '{}'));
            try {
                await api.batchCreateTasks(tasks);
                showMessage(`Created ${tasks.length} tasks!`, 'success');
                tasksDiv.innerHTML = '<p>Tasks created successfully!</p>';
            }
            catch (error) {
                showMessage(error.message, 'error');
            }
        });
    }
    else {
        tasksDiv.innerHTML = '<p>No suggested tasks found.</p>';
    }
}
async function loadRecentAnalysis() {
    const result = await chrome.storage.local.get(['lastAnalysis', 'lastPageUrl']);
    if (result.lastAnalysis && result.lastPageUrl === currentTab?.url) {
        displayAnalysis(result.lastAnalysis);
    }
}
function extractPageContent() {
    const title = document.title;
    const url = window.location.href;
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
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => {
        messageDiv.classList.add('show');
    }, 10);
    setTimeout(() => {
        messageDiv.classList.remove('show');
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}
