"use strict";
document.addEventListener('DOMContentLoaded', async () => {
    // Load saved settings
    const settings = await chrome.storage.sync.get(['autoDetect', 'showWidget']);
    document.getElementById('auto-detect').checked = settings.autoDetect || false;
    document.getElementById('show-widget').checked = settings.showWidget !== false;
    document.getElementById('save')?.addEventListener('click', async () => {
        const autoDetect = document.getElementById('auto-detect').checked;
        const showWidget = document.getElementById('show-widget').checked;
        await chrome.storage.sync.set({ autoDetect, showWidget });
        alert('Settings saved!');
    });
});
