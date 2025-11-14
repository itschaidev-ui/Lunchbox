// Inline PageExtractor to avoid ES module import issues in content scripts
class PageExtractor {
    static extractPageContent() {
        const title = document.title || '';
        const url = window.location.href;
        // Extract main content
        const mainContent = this.extractMainContent();
        const headings = this.extractHeadings();
        const links = this.extractLinks();
        const images = this.extractImages();
        return {
            text: mainContent,
            title,
            url,
            headings,
            links,
            images,
        };
    }
    static extractMainContent() {
        const selectors = [
            'article',
            'main',
            '[role="main"]',
            '.content',
            '.post',
            '.article',
            '#content',
            '#main-content',
        ];
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return this.getTextContent(element);
            }
        }
        return this.getTextContent(document.body);
    }
    static getTextContent(element) {
        const clone = element.cloneNode(true);
        clone.querySelectorAll('script, style, nav, header, footer, aside').forEach(el => el.remove());
        let text = clone.textContent || '';
        text = text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
        return text;
    }
    static extractHeadings() {
        const headings = [];
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headingElements.forEach((heading) => {
            const text = heading.textContent?.trim();
            if (text)
                headings.push(text);
        });
        return headings;
    }
    static extractLinks() {
        const links = [];
        const linkElements = document.querySelectorAll('a[href]');
        linkElements.forEach((link) => {
            const href = link.href;
            const text = link.textContent?.trim();
            if (href && text)
                links.push(`${text}: ${href}`);
        });
        return links.slice(0, 50);
    }
    static extractImages() {
        const images = [];
        const imageElements = document.querySelectorAll('img[src]');
        imageElements.forEach((img) => {
            const src = img.src;
            const alt = img.getAttribute('alt') || '';
            if (src)
                images.push({ src, alt });
        });
        return images.slice(0, 20);
    }
    static extractSelectedText() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return '';
        return selection.toString().trim();
    }
    static detectDates(text) {
        const datePatterns = [
            /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g,
            /\b(\d{1,2}-\d{1,2}-\d{2,4})\b/g,
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
            /\b(today|tomorrow|next week|next month)\b/gi,
        ];
        const dates = [];
        datePatterns.forEach((pattern) => {
            const matches = text.match(pattern);
            if (matches)
                dates.push(...matches);
        });
        return dates;
    }
    static detectTasks(text) {
        const taskPatterns = [
            /(?:TODO|FIXME|NOTE|HACK|XXX):\s*(.+)/gi,
            /[-*]\s*\[ \]\s*(.+)/g,
            /[-*]\s*(.+)/g,
        ];
        const tasks = [];
        taskPatterns.forEach((pattern) => {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                if (match[1])
                    tasks.push(match[1].trim());
            }
        });
        return tasks;
    }
}
// Create floating widget
let widget = null;
let isWidgetVisible = false;
function createWidget() {
    if (widget)
        return;
    widget = document.createElement('div');
    widget.id = 'lunchbox-widget';
    widget.innerHTML = `
    <div class="lunchbox-widget-container">
      <button class="lunchbox-widget-button" id="lunchbox-quick-capture">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
      <div class="lunchbox-widget-menu" id="lunchbox-menu" style="display: none;">
        <button class="lunchbox-menu-item" data-action="create-task">
          <span>📝 Create Task</span>
        </button>
        <button class="lunchbox-menu-item" data-action="analyze-page">
          <span>🔍 Solve Page</span>
        </button>
        <button class="lunchbox-menu-item" data-action="save-later">
          <span>💾 Save for Later</span>
        </button>
        <button class="lunchbox-menu-item" data-action="open-popup">
          <span>📋 Open Lunchbox</span>
        </button>
      </div>
    </div>
  `;
    document.body.appendChild(widget);
    // Add event listeners
    const button = widget.querySelector('#lunchbox-quick-capture');
    const menu = widget.querySelector('#lunchbox-menu');
    button?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });
    menu?.querySelectorAll('.lunchbox-menu-item').forEach((item) => {
        item.addEventListener('click', async (e) => {
            e.stopPropagation();
            const action = item.dataset.action;
            await handleMenuAction(action || '');
            hideMenu();
        });
    });
    // Hide menu when clicking outside
    document.addEventListener('click', () => {
        if (isWidgetVisible) {
            hideMenu();
        }
    });
}
function toggleMenu() {
    const menu = document.getElementById('lunchbox-menu');
    if (menu) {
        isWidgetVisible = !isWidgetVisible;
        menu.style.display = isWidgetVisible ? 'block' : 'none';
    }
}
function hideMenu() {
    const menu = document.getElementById('lunchbox-menu');
    if (menu) {
        isWidgetVisible = false;
        menu.style.display = 'none';
    }
}
async function handleMenuAction(action) {
    switch (action) {
        case 'create-task':
            await handleCreateTask();
            break;
        case 'analyze-page':
            await handleAnalyzePage();
            break;
        case 'save-later':
            await handleSaveLater();
            break;
        case 'open-popup':
            chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
            break;
    }
}
async function handleCreateTask() {
    const selection = PageExtractor.extractSelectedText();
    const text = selection || prompt('Enter task text:');
    if (!text)
        return;
    const tab = await chrome.runtime.sendMessage({
        type: 'CREATE_TASK',
        data: {
            text: text.trim(),
            sourceUrl: window.location.href,
            sourceTitle: document.title,
        },
    });
    if (tab.success) {
        showToast('Task created!');
    }
    else {
        showToast(tab.error || 'Failed to create task');
    }
}
async function handleAnalyzePage() {
    chrome.runtime.sendMessage({ type: 'ANALYZE_PAGE' });
    showToast('Analyzing page...');
}
async function handleSaveLater() {
    const tab = await chrome.runtime.sendMessage({
        type: 'CREATE_TASK',
        data: {
            text: `Read: ${document.title}`,
            description: `Saved for later reading\n\nURL: ${window.location.href}`,
            sourceUrl: window.location.href,
            sourceTitle: document.title,
            tags: ['read-later'],
        },
    });
    if (tab.success) {
        showToast('Page saved for later!');
    }
    else {
        showToast(tab.error || 'Failed to save page');
    }
}
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'lunchbox-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
// Highlight detection
let highlightButton = null;
function showHighlightButton(x, y, text) {
    if (highlightButton) {
        highlightButton.remove();
    }
    highlightButton = document.createElement('div');
    highlightButton.className = 'lunchbox-highlight-button';
    highlightButton.innerHTML = `
    <button class="lunchbox-add-button" data-text="${text.replace(/"/g, '&quot;')}">
      ➕ Add to Lunchbox
    </button>
  `;
    highlightButton.style.left = `${x}px`;
    highlightButton.style.top = `${y - 40}px`;
    document.body.appendChild(highlightButton);
    highlightButton.querySelector('button')?.addEventListener('click', async () => {
        await handleCreateTask();
        highlightButton?.remove();
        highlightButton = null;
    });
}
// Listen for text selection
document.addEventListener('mouseup', (e) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
        const text = selection.toString().trim();
        if (text.length > 3) {
            // Show button near selection
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            showHighlightButton(rect.left + rect.width / 2, rect.top, text);
        }
    }
    else {
        if (highlightButton) {
            highlightButton.remove();
            highlightButton = null;
        }
    }
});
// Initialize widget
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
}
else {
    createWidget();
}
// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXTRACT_PAGE') {
        const content = PageExtractor.extractPageContent();
        sendResponse(content);
    }
});
