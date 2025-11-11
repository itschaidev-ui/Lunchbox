'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download, Edit, Play, Eye, ExternalLink, Monitor, Terminal } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PythonExecutor } from './python-executor';

interface CodeModeProps {
  code: string;
  language?: string;
  isExecutable?: boolean;
  onSave?: (code: string) => void;
  onEdit?: () => void;
  hasMultipleLanguages?: boolean;
  originalBlocks?: Array<{ language: string; content: string }>;
}

export function CodeMode({ code, language = 'typescript', isExecutable = false, onSave, onEdit, hasMultipleLanguages = false, originalBlocks = [] }: CodeModeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(code);
  const [showPreview, setShowPreview] = useState(false);
  const [showSplitEditor, setShowSplitEditor] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPythonConsole, setShowPythonConsole] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    toast({
      title: "Copied to clipboard",
      description: "Code has been copied.",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language === 'typescript' ? 'ts' : language === 'javascript' ? 'js' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Code has been downloaded.",
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editedCode);
    }
    setIsEditing(false);
    toast({
      title: "Saved",
      description: "Code has been saved to chat.",
    });
  };

  const handlePreview = () => {
    if (isExecutable) {
      setShowPreview(!showPreview);
    }
  };

  const handleOpenInNewTab = () => {
    if (language === 'html' || isExecutable) {
      // Detect if this is a complete HTML page or just HTML fragments
      const isCompleteHTML = code.includes('<!DOCTYPE') || code.includes('<html') || code.includes('<head') || code.includes('<body');
      
      let htmlContent = '';
      
      if (isCompleteHTML) {
        // If it's already a complete HTML page, use it as-is
        htmlContent = code;
      } else {
        // If it's HTML fragments, wrap them in a complete HTML structure
        htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Preview</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            overflow: hidden;
        }
        .header { 
            background: #2563eb; 
            color: white; 
            padding: 16px 20px; 
            font-weight: 600;
        }
        .content { 
            padding: 20px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">Code Preview - ${language.toUpperCase()}</div>
        <div class="content">
            ${code}
        </div>
    </div>
</body>
</html>`;
      }

      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new tab
      window.open(url, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      toast({
        title: "Opened in new tab",
        description: "Code preview opened in a new browser tab.",
      });
    }
  };

  const handleSplitEditor = () => {
    setShowSplitEditor(!showSplitEditor);
    setIsFullScreen(true);
    if (onEdit) {
      onEdit();
    }
  };

  const handleCloseFullScreen = () => {
    setShowSplitEditor(false);
    setIsFullScreen(false);
  };

  const handlePythonConsole = () => {
    setShowPythonConsole(!showPythonConsole);
  };

  const isPython = language.toLowerCase() === 'python';

  // Full-screen split editor
  if (isFullScreen && showSplitEditor) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-300">
              {language === 'typescript' ? 'TypeScript' : language} Component
            </h2>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs text-gray-500">{language}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-gray-300 border-gray-600 bg-gray-800/50 active:bg-gray-700 active:text-gray-100 min-h-[36px] min-w-[36px]"
            >
              <Copy className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="text-gray-300 border-gray-600 bg-gray-800/50 active:bg-gray-700 active:text-gray-100 min-h-[36px] min-w-[36px]"
            >
              <Download className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            {(language === 'html' || isExecutable) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                className="text-gray-300 border-gray-600 bg-gray-800/50 active:bg-gray-700 active:text-gray-100 min-h-[36px] min-w-[36px]"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Open HTML</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseFullScreen}
              className="text-gray-300 border-gray-600 bg-gray-800/50 active:bg-gray-700 active:text-gray-100 min-h-[36px] min-w-[36px]"
            >
              <span className="hidden sm:inline">Close Split</span>
              <span className="sm:hidden">Close</span>
            </Button>
            {isPython && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePythonConsole}
                className="text-gray-300 border-gray-600 bg-gray-800/50 active:bg-gray-700 active:text-gray-100 min-h-[36px] min-w-[36px]"
              >
                <Terminal className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Console</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-green-600 active:bg-green-700 text-white min-h-[36px]"
            >
              <Play className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Save Changes</span>
              <span className="sm:hidden">Save</span>
            </Button>
          </div>
        </div>

        {/* Split Editor */}
        <div className="flex h-[calc(100vh-80px)]">
          {/* Code Editor Side */}
          <div className="flex-1 border-r border-gray-700">
            <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
              Code Editor
            </div>
            <textarea
              value={editedCode}
              onChange={(e) => setEditedCode(e.target.value)}
              className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-none"
              placeholder="Edit your code..."
            />
          </div>
          
          {/* Preview Side */}
          <div className="flex-1">
            <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
              {isPython ? 'Python Console' : 'Live Preview'}
            </div>
            <div className="h-full bg-white p-4 overflow-auto">
              {isPython ? (
                <PythonExecutor code={editedCode} onSave={onSave} />
              ) : (language === 'html' || isExecutable) ? (
                <iframe
                  srcDoc={editedCode}
                  className="w-full h-full border-none"
                  sandbox="allow-scripts"
                />
              ) : (
                <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                  {editedCode}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gray-800 rounded-t-lg">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              {language === 'typescript' ? 'TypeScript' : language} Component
            </CardTitle>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs text-gray-500">{language}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-gray-300 border-gray-600 bg-gray-800/50 active:bg-gray-700 active:text-gray-100 min-h-[36px] min-w-[36px]"
            >
              <Copy className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="text-gray-300 border-gray-600 bg-gray-800/50 active:bg-gray-700 active:text-gray-100 min-h-[36px] min-w-[36px]"
            >
              <Download className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            {(language === 'html' || isExecutable) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                className="text-gray-300 border-gray-600 bg-gray-800/50 active:bg-gray-700 active:text-gray-100 min-h-[36px] min-w-[36px]"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Open HTML</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSplitEditor}
              className="text-gray-300 border-gray-600 bg-gray-800/50 active:bg-gray-700 active:text-gray-100 min-h-[36px] min-w-[36px]"
            >
              <Monitor className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Split Editor</span>
            </Button>
            {isPython && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePythonConsole}
                className="text-gray-300 border-gray-600 bg-gray-800/50 active:bg-gray-700 active:text-gray-100 min-h-[36px] min-w-[36px]"
              >
                <Terminal className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Console</span>
              </Button>
            )}
            {isExecutable && (
              <Button
                size="sm"
                onClick={handlePreview}
                className="bg-blue-600 active:bg-blue-700 text-white min-h-[36px]"
              >
                <Eye className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {showPythonConsole ? (
            <PythonExecutor code={code} onSave={onSave} />
          ) : isEditing ? (
            <textarea
              value={editedCode}
              onChange={(e) => setEditedCode(e.target.value)}
              className="w-full h-96 p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-none"
              placeholder="Edit your code..."
            />
          ) : (
            <div className="relative">
              <pre className="p-4 text-sm text-gray-100 font-mono overflow-x-auto">
                <code className="text-gray-100">{code}</code>
              </pre>
              {showPreview && isExecutable && (
                <div className="border-t border-gray-700">
                  <div className="p-4 bg-white">
                    <div className="text-sm text-gray-600 mb-2">Preview:</div>
                    <iframe
                      srcDoc={code}
                      className="w-full h-64 border border-gray-300 rounded"
                      sandbox="allow-scripts"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
