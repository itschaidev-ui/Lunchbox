export class PageExtractor {
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
        // Try to find main content areas
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
        // Fallback to body
        return this.getTextContent(document.body);
    }
    static getTextContent(element) {
        // Clone to avoid modifying original
        const clone = element.cloneNode(true);
        // Remove script and style elements
        clone.querySelectorAll('script, style, nav, header, footer, aside').forEach(el => el.remove());
        // Get text content
        let text = clone.textContent || '';
        // Clean up whitespace
        text = text
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();
        return text;
    }
    static extractHeadings() {
        const headings = [];
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headingElements.forEach((heading) => {
            const text = heading.textContent?.trim();
            if (text) {
                headings.push(text);
            }
        });
        return headings;
    }
    static extractLinks() {
        const links = [];
        const linkElements = document.querySelectorAll('a[href]');
        linkElements.forEach((link) => {
            const href = link.href;
            const text = link.textContent?.trim();
            if (href && text) {
                links.push(`${text}: ${href}`);
            }
        });
        return links.slice(0, 50); // Limit to 50 links
    }
    static extractImages() {
        const images = [];
        const imageElements = document.querySelectorAll('img[src]');
        imageElements.forEach((img) => {
            const src = img.src;
            const alt = img.getAttribute('alt') || '';
            if (src) {
                images.push({ src, alt });
            }
        });
        return images.slice(0, 20); // Limit to 20 images
    }
    static extractSelectedText() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return '';
        }
        return selection.toString().trim();
    }
    static detectDates(text) {
        // Simple date detection patterns
        const datePatterns = [
            /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g,
            /\b(\d{1,2}-\d{1,2}-\d{2,4})\b/g,
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
            /\b(today|tomorrow|next week|next month)\b/gi,
        ];
        const dates = [];
        datePatterns.forEach((pattern) => {
            const matches = text.match(pattern);
            if (matches) {
                dates.push(...matches);
            }
        });
        return dates;
    }
    static detectTasks(text) {
        // Detect TODO-like patterns
        const taskPatterns = [
            /(?:TODO|FIXME|NOTE|HACK|XXX):\s*(.+)/gi,
            /[-*]\s*\[ \]\s*(.+)/g,
            /[-*]\s*(.+)/g,
        ];
        const tasks = [];
        taskPatterns.forEach((pattern) => {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    tasks.push(match[1].trim());
                }
            }
        });
        return tasks;
    }
}
