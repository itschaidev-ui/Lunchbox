
'use client';

import { Loader2, ArrowUp, User, Mail, MessageSquare, Code, Calendar, Target, Lightbulb, Zap, Paperclip, Mic, ChevronDown, Sparkles, Lock, Image as ImageIcon, BarChart3, X, Pencil } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ModeDropdown } from './mode-dropdown';
import { ModelSelector } from '../ui/model-selector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const examplePrompts = [
    {
      text: "Plan my week with 5 key priorities and deadlines",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      text: "Help me write a professional follow-up email",
      icon: <Mail className="h-5 w-5" />,
    },
    {
      text: "Break down this complex project into manageable tasks",
      icon: <Target className="h-5 w-5" />,
    },
    {
      text: "Brainstorm creative solutions for my productivity challenges",
      icon: <Lightbulb className="h-5 w-5" />,
    },
];


export function PromptForm({ onSubmit, isLoading, showExamples = true, activeTab = 'message', onTabChange, onFileUpload, advancedAI, selectedModel, onModelChange, onImageSelect, onImageRemove, onImageReplace, selectedImages = [], lastTokenUsage }: { 
  onSubmit: (prompt: string) => void, 
  isLoading: boolean, 
  showExamples?: boolean,
  activeTab?: 'message' | 'code' | 'canvas' | 'plan',
  onTabChange?: (tab: 'message' | 'code' | 'canvas' | 'plan') => void,
  onFileUpload?: () => void,
  advancedAI?: boolean,
  selectedModel?: string,
  onModelChange?: (modelId: string) => void,
  onImageSelect?: (files: FileList | File[]) => void,
  onImageRemove?: (imageId: string) => void,
  onImageReplace?: (imageId: string) => void,
  selectedImages?: Array<{ id: string; url: string; name: string }>,
  lastTokenUsage?: any
}) {
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [localAdvancedAI, setLocalAdvancedAI] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if advanced AI capabilities are enabled
  useEffect(() => {
    const checkAdvancedAI = () => {
      const savedAdvancedAI = localStorage.getItem('lunchbox-advanced-ai') === 'true';
      setLocalAdvancedAI(savedAdvancedAI);
    };
    
    checkAdvancedAI();
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'lunchbox-advanced-ai') {
        checkAdvancedAI();
      }
    });
    
    return () => window.removeEventListener('storage', checkAdvancedAI);
  }, []);

  // Use prop value if provided, otherwise use local state
  const isAdvancedAIEnabled = advancedAI !== undefined ? advancedAI : localAdvancedAI;

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleExampleClick = (text: string) => {
    setPrompt(text);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    onSubmit(prompt);
    setPrompt('');
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleFileUpload = () => {
    if (onFileUpload) {
      onFileUpload();
    }
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (onImageSelect) {
        onImageSelect(files);
      }
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    
    const originalPrompt = prompt;
    setIsEnhancing(true);
    
    // Create an AbortController for background processing
    const controller = new AbortController();
    
    try {
      // Call AI to enhance the prompt
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: originalPrompt }),
        signal: controller.signal,
        // Keep-alive to allow background processing
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error('Failed to enhance prompt');
      }

      const data = await response.json();
      
      // Animate the text replacement
      setPrompt('');
      let index = 0;
      const enhancedText = data.enhancedPrompt;
      const interval = setInterval(() => {
        if (index < enhancedText.length) {
          setPrompt(enhancedText.substring(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 10); // Fast typing animation
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Enhancement continuing in background');
        return;
      }
      console.error('Error enhancing prompt:', error);
      // Restore original prompt on error
      setPrompt(originalPrompt);
    } finally {
      setIsEnhancing(false);
    }
  };

  const tabs = [
    { id: 'message', label: 'Message', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <form onSubmit={handleSubmit}>
        {/* Attached Images - On top of text field (ChatGPT style) */}
        {selectedImages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedImages.map((img) => (
              <div key={img.id} className="relative group">
                <img 
                  src={img.url} 
                  alt={img.name}
                  className="w-14 h-14 rounded-lg object-cover border border-gray-600 cursor-pointer transition-transform duration-200 hover:scale-110"
                  onClick={(e) => {
                    // Create modal overlay for full-size view
                    const modal = document.createElement('div');
                    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
                    modal.style.animation = 'fadeIn 0.2s ease-out';
                    
                    const fullImg = document.createElement('img');
                    fullImg.src = img.url;
                    fullImg.className = 'max-w-full max-h-full rounded-lg shadow-2xl object-contain';
                    fullImg.style.animation = 'scaleIn 0.3s ease-out';
                    
                    const closeBtn = document.createElement('button');
                    closeBtn.className = 'absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-colors';
                    closeBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
                    closeBtn.onclick = () => {
                      modal.style.animation = 'fadeOut 0.2s ease-out';
                      setTimeout(() => modal.remove(), 200);
                    };
                    
                    modal.appendChild(fullImg);
                    modal.appendChild(closeBtn);
                    modal.onclick = (e) => {
                      if (e.target === modal) {
                        modal.style.animation = 'fadeOut 0.2s ease-out';
                        setTimeout(() => modal.remove(), 200);
                      }
                    };
                    
                    document.body.appendChild(modal);
                    
                    // Add CSS animations if not already added
                    if (!document.getElementById('image-modal-styles')) {
                      const style = document.createElement('style');
                      style.id = 'image-modal-styles';
                      style.textContent = `
                        @keyframes fadeIn {
                          from { opacity: 0; }
                          to { opacity: 1; }
                        }
                        @keyframes fadeOut {
                          from { opacity: 1; }
                          to { opacity: 0; }
                        }
                        @keyframes scaleIn {
                          from { transform: scale(0.8); opacity: 0; }
                          to { transform: scale(1); opacity: 1; }
                        }
                      `;
                      document.head.appendChild(style);
                    }
                    
                    e.stopPropagation();
                  }}
                />
                {/* Edit and Remove buttons */}
                <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageReplace?.(img.id);
                    }}
                    className="w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center border border-gray-600 transition-colors"
                    title="Replace image"
                  >
                    <Pencil className="h-2.5 w-2.5 text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageRemove?.(img.id);
                    }}
                    className="w-5 h-5 rounded-full bg-gray-700 hover:bg-red-600 flex items-center justify-center border border-gray-600 transition-colors"
                    title="Remove image"
                  >
                    <X className="h-2.5 w-2.5 text-white" />
                  </button>
                </div>
              </div>
            ))}
            {selectedImages.length < 6 && (
              <button
                type="button"
                onClick={handleImageSelect}
                className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-600 hover:border-gray-500 flex items-center justify-center text-gray-400 hover:text-gray-300 transition-colors"
                title="Add more images"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* ChatGPT-style input container */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-lg transition-all duration-200 hover:border-gray-600 focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-blue-500/20">
          {/* Tab switcher */}
          <div className="flex items-center gap-2 mb-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange?.(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
            {isAdvancedAIEnabled && <ModeDropdown activeTab={activeTab} onTabChange={onTabChange || (() => {})} />}
            
            {/* Model Selector - moved here to be next to Message button */}
            {selectedModel && onModelChange && (
              <div className="ml-auto">
                <ModelSelector 
                  selectedModel={selectedModel}
                  onModelChange={onModelChange}
                  className="text-xs"
                />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="flex items-end gap-2">
            {/* Attachment dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-gray-800 border-gray-700">
                <DropdownMenuItem 
                  onClick={handleEnhancePrompt}
                  disabled={!prompt.trim() || isEnhancing}
                  className="cursor-pointer focus:bg-gray-700 text-gray-200 hover:text-white transition-colors"
                >
                  {isEnhancing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-400" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2 text-purple-400" />
                  )}
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{isEnhancing ? 'Enhancing...' : 'Enhance Prompt'}</span>
                    {!isEnhancing && <span className="text-xs text-gray-400">Make it more detailed</span>}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleImageSelect}
                  className="cursor-pointer focus:bg-gray-700 text-gray-200 hover:text-white transition-colors"
                >
                  <ImageIcon className="h-4 w-4 mr-2 text-green-400" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Upload Image</span>
                    <span className="text-xs text-gray-400">Add visual context</span>
                  </div>
                </DropdownMenuItem>
                {lastTokenUsage && (
                  <>
                    <div className="h-px bg-gray-700 my-1" />
                    <div className="px-2 py-2">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-blue-400" />
                        <span className="text-xs font-medium text-gray-300">Token Usage</span>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1 pl-6">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">System:</span>
                          <span className="text-gray-300">{lastTokenUsage.system_prompt_tokens || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">Your Message:</span>
                          <span className="text-gray-300">{lastTokenUsage.user_message_tokens || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">Response:</span>
                          <span className="text-gray-300">{lastTokenUsage.completion_tokens}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-700">
                          <span className="font-medium">Total:</span>
                          <span className="text-gray-200 font-medium">{lastTokenUsage.total_tokens}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Text input */}
            <Textarea
              placeholder={selectedImages.length > 0 ? "Ask anything" : "Ask AI a question or make a request..."}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 shadow-none resize-none min-h-[60px] text-white placeholder:text-gray-400 text-base"
              value={prompt}
              onChange={handlePromptChange}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  (e.target as HTMLTextAreaElement).form?.requestSubmit();
                }
              }}
            />

            {/* Voice input button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={startVoiceRecognition}
              className={cn(
                "p-2 transition-colors",
                isListening 
                  ? "text-red-400 hover:text-red-300 hover:bg-red-700/50" 
                  : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
              )}
            >
              <Mic className="h-4 w-4" />
            </Button>

            {/* Submit button */}
            <Button
              type="submit"
              size="sm"
              className="rounded-full bg-white text-gray-800 hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed p-2"
              disabled={isLoading || (!prompt.trim() && selectedImages.length === 0)}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Example prompts - hidden on mobile */}
      {showExamples && (
        <div className="mt-6 text-center hidden md:block">
          <p className="text-xs text-gray-400 mb-4 font-medium tracking-wide">GET STARTED WITH AN EXAMPLE BELOW</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {examplePrompts.map((example) => (
              <button
                key={example.text}
                disabled={isLoading}
                onClick={() => handleExampleClick(example.text)}
                className="group bg-gray-800 border border-gray-700 rounded-lg p-3 text-left hover:border-gray-600 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-300 group-hover:text-white leading-tight">{example.text}</p>
                  </div>
                  <div className="ml-2 text-blue-400 group-hover:text-blue-300 transition-colors flex-shrink-0">
                    {example.icon}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
