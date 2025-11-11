'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download, Edit, Save, Monitor, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CanvasModeProps {
  content: {
    title: string;
    content: string;
    type: string;
  };
  onSave?: (content: any) => void;
  onEdit?: () => void;
}

export function CanvasMode({ content, onSave, onEdit }: CanvasModeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content.content);
  const [showSplitEditor, setShowSplitEditor] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content.content);
    toast({
      title: "Copied to clipboard",
      description: "Canvas content has been copied.",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([content.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Canvas content has been downloaded.",
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...content,
        content: editedContent
      });
    }
    setIsEditing(false);
    toast({
      title: "Saved",
      description: "Canvas content has been saved to chat.",
    });
  };

  const handleOpenInNewTab = () => {
    // Create a standalone HTML page for the canvas content
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title}</title>
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
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">${content.title}</div>
        <div class="content">
            ${content.content.replace(/\n/g, '<br>')}
        </div>
    </div>
</body>
</html>`;

    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open in new tab
    window.open(url, '_blank');
    
    // Clean up the URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    toast({
      title: "Opened in new tab",
      description: "Canvas content opened in a new browser tab.",
    });
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

  // Full-screen split editor
  if (isFullScreen && showSplitEditor) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">{content.title}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-gray-500 border-gray-300 bg-gray-50 active:bg-gray-100 active:text-gray-700 min-h-[36px] min-w-[36px]"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="text-gray-500 border-gray-300 bg-gray-50 active:bg-gray-100 active:text-gray-700 min-h-[36px] min-w-[36px]"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="text-gray-500 border-gray-300 bg-gray-50 active:bg-gray-100 active:text-gray-700 min-h-[36px] min-w-[36px]"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open HTML
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseFullScreen}
              className="text-gray-500 border-gray-300 bg-gray-50 active:bg-gray-100 active:text-gray-700 min-h-[36px] min-w-[36px]"
            >
              Close Split
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Split Editor */}
        <div className="flex h-[calc(100vh-80px)]">
          {/* Editor Side */}
          <div className="flex-1 border-r border-gray-300">
            <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 border-b border-gray-300">
              Document Editor
            </div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-full p-4 border-none resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Edit your canvas content..."
            />
          </div>
          
          {/* Preview Side */}
          <div className="flex-1">
            <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 border-b border-gray-300">
              Live Preview
            </div>
            <div className="h-full bg-white p-4 overflow-auto">
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {editedContent}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {content.title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-gray-600 hover:text-gray-900"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="text-gray-600 hover:text-gray-900"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenInNewTab}
            className="text-gray-600 hover:text-gray-900"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open HTML
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSplitEditor}
            className="text-gray-600 hover:text-gray-900"
          >
            <Monitor className="h-4 w-4 mr-1" />
            Split Editor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Edit your canvas content..."
          />
        ) : (
          <div className="prose prose-gray max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {content.content}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
