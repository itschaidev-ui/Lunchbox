const API_BASE_URL = 'https://lunchbox.chaimode.dev';
export class LunchboxAPI {
    async getAuthToken() {
        try {
            const result = await chrome.storage.local.get(['firebaseAuthToken']);
            return result.firebaseAuthToken || null;
        }
        catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }
    async makeRequest(endpoint, options = {}) {
        const token = await this.getAuthToken();
        if (!token) {
            throw new Error('Not authenticated. Please sign in to Lunchbox.');
        }
        const headers = new Headers(options.headers);
        headers.set('Authorization', `Bearer ${token}`);
        headers.set('Content-Type', 'application/json');
        return fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
    }
    async createTask(task) {
        const response = await this.makeRequest('/api/tasks/create', {
            method: 'POST',
            body: JSON.stringify(task),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create task');
        }
        return response.json();
    }
    async analyzePage(content, url, title) {
        const response = await this.makeRequest('/api/ai/analyze-page', {
            method: 'POST',
            body: JSON.stringify({ content, url, title }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to analyze page');
        }
        return response.json();
    }
    async verifyToken() {
        const response = await this.makeRequest('/api/auth/extension-token', {
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error('Invalid token');
        }
        return response.json();
    }
    async batchCreateTasks(tasks) {
        const results = await Promise.allSettled(tasks.map(task => this.createTask(task)));
        const taskIds = [];
        const errors = [];
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                taskIds.push(result.value.taskId);
            }
            else {
                errors.push(`Task ${index + 1}: ${result.reason.message}`);
            }
        });
        if (errors.length > 0) {
            console.warn('Some tasks failed to create:', errors);
        }
        return { success: taskIds.length > 0, taskIds };
    }
}
export const api = new LunchboxAPI();
