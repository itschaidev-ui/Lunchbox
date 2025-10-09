'use client';

import type { GeneratedCode } from '@/lib/types';
import { useEffect, useState, useRef } from 'react';

interface ToolPreviewProps {
  code: GeneratedCode;
}

export function ToolPreview({ code }: ToolPreviewProps) {
  const [srcDoc, setSrcDoc] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const { html, css, js } = code;
    const document = `
      <html>
        <head>
          <style>
            body { 
              margin: 0; 
              height: min-content;
              width: min-content;
              background-color: transparent;
              color: hsl(var(--foreground));
              font-family: 'Inter', sans-serif;
            }
            ${css}
          </style>
        </head>
        <body>
          <div id="tool-root">${html}</div>
          <script>
            try {
              const root = document.getElementById('tool-root');
              if (root) {
                const sendSize = () => {
                  // Adding a small delay to ensure all rendering is complete
                  setTimeout(() => {
                    const height = root.scrollHeight;
                    const width = root.scrollWidth;
                    window.parent.postMessage({ type: 'resize', height, width }, '*');
                  }, 50);
                }

                const resizeObserver = new ResizeObserver(sendSize);
                resizeObserver.observe(root);
                
                // Also send size after initial script execution
                window.addEventListener('load', sendSize);
              }
              ${js}
            } catch (e) {
              console.error(e);
            }
          </script>
        </body>
      </html>
    `;
    setSrcDoc(document);
  }, [code]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data.type === 'resize') {
        if(iframeRef.current) {
          if (event.data.height > 0) {
            iframeRef.current.style.height = `${event.data.height}px`;
          }
          if (event.data.width > 0) {
            iframeRef.current.style.width = `${event.data.width}px`;
          }
        }
      }
    };
    
    window.addEventListener('message', handleMessage);

    const currentIframe = iframeRef.current;
    const handleLoad = () => {
        if (currentIframe?.contentWindow) {
            currentIframe.contentWindow.postMessage({ type: 'requestSize' }, '*');
        }
    };
    currentIframe?.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('message', handleMessage);
      currentIframe?.removeEventListener('load', handleLoad);
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      title="Tool Preview"
      sandbox="allow-scripts allow-forms"
      className="w-full rounded-md border border-border shadow-sm transition-all duration-300 bg-transparent"
      style={{ height: '100%' }}
    />
  );
}
