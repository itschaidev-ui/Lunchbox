'use client';

import { useState } from 'react';
import { Button } from './button';
import { ChevronDown, Zap, Brain, Sparkles, Eye } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Badge } from './badge';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  speed: 'fast' | 'medium' | 'slow';
  capabilities: string[];
  icon?: React.ReactNode;
}

const availableModels: AIModel[] = [
  {
    id: 'auto',
    name: 'Auto',
    provider: 'system',
    description: 'Automatically selects the fastest available model',
    speed: 'fast',
    capabilities: ['reasoning', 'code', 'analysis'],
    icon: <Zap className="h-4 w-4" />
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    provider: 'groq',
    description: 'Ultra-fast inference with Groq',
    speed: 'fast',
    capabilities: ['reasoning', 'code', 'analysis'],
    icon: <Zap className="h-4 w-4" />
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    description: 'Powerful 70B model with Groq speed',
    speed: 'fast',
    capabilities: ['reasoning', 'code', 'analysis', 'long-context'],
    icon: <Zap className="h-4 w-4" />
  },
  {
    id: 'gpt-oss-20b',
    name: 'GPT OSS 20B',
    provider: 'groq',
    description: 'OpenAI GPT OSS 20B model via Groq',
    speed: 'fast',
    capabilities: ['reasoning', 'code', 'analysis'],
    icon: <Brain className="h-4 w-4" />
  },
  {
    id: 'gpt-oss-120b',
    name: 'GPT OSS 120B',
    provider: 'groq',
    description: 'OpenAI GPT OSS 120B model via Groq',
    speed: 'fast',
    capabilities: ['reasoning', 'code', 'analysis', 'long-context'],
    icon: <Brain className="h-4 w-4" />
  },
  {
    id: 'llama-guard-4-12b',
    name: 'Llama Guard 4 12B',
    provider: 'groq',
    description: 'Meta Llama Guard 4 safety model',
    speed: 'fast',
    capabilities: ['safety', 'content-moderation', 'analysis'],
    icon: <Sparkles className="h-4 w-4" />
  },
  {
    id: 'llama-4-scout',
    name: 'Llama 4 Scout',
    provider: 'groq',
    description: 'Meta Llama 4 Scout with vision support',
    speed: 'fast',
    capabilities: ['vision', 'image-analysis', 'reasoning', 'code'],
    icon: <Eye className="h-4 w-4" />
  },
  {
    id: 'llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: 'groq',
    description: 'Meta Llama 4 Maverick with vision support',
    speed: 'fast',
    capabilities: ['vision', 'image-analysis', 'reasoning', 'code', 'long-context'],
    icon: <Eye className="h-4 w-4" />
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    description: 'Google Gemini 2.0 with vision support',
    speed: 'fast',
    capabilities: ['vision', 'image-analysis', 'reasoning', 'code'],
    icon: <Eye className="h-4 w-4" />
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'OpenAI GPT-4o Mini with vision',
    speed: 'medium',
    capabilities: ['vision', 'image-analysis', 'reasoning', 'code'],
    icon: <Eye className="h-4 w-4" />
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'OpenAI GPT-4o with vision',
    speed: 'medium',
    capabilities: ['vision', 'image-analysis', 'reasoning', 'code', 'long-context'],
    icon: <Eye className="h-4 w-4" />
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Anthropic Claude with vision',
    speed: 'medium',
    capabilities: ['vision', 'image-analysis', 'reasoning', 'code', 'long-context'],
    icon: <Eye className="h-4 w-4" />
  }
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  className?: string;
}

export function ModelSelector({ selectedModel, onModelChange, className = '' }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentModel = availableModels.find(m => m.id === selectedModel) || availableModels[0];
  
  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'deepseek': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'groq': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'gemini': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'openai': return 'bg-green-100 text-green-800 border-green-200';
      case 'anthropic': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'system': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'fast': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'slow': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 text-xs hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors ${className}`}
        >
          <Zap className="h-3 w-3 mr-1.5" />
          <span className="font-medium">{currentModel.name}</span>
          <ChevronDown className="h-3 w-3 ml-1.5" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800">
        {availableModels.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => {
              onModelChange(model.id);
              setIsOpen(false);
            }}
            className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
          >
            <div className="flex-shrink-0">
              {model.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium">{model.name}</span>
                <span className={`text-[10px] ${getSpeedColor(model.speed)}`}>
                  {model.speed}
                </span>
              </div>
            </div>
            
            {model.id === selectedModel && (
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
