/**
 * Multi-Provider AI System with Automatic Failover
 * Supports multiple AI providers with automatic switching
 */
import { HuggingFaceProvider } from './huggingface-provider';

export interface AIProvider {
  name: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  priority: number; // Lower number = higher priority
  enabled: boolean;
}

export interface AIResponse {
  text: string;
  provider: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  rateLimitInfo?: {
    retryAfter?: number; // seconds until retry
    retryAfterMessage?: string; // human-readable message
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class MultiProviderAI {
  private providers: AIProvider[] = [];
  private currentProvider: AIProvider | null = null;
  private failedProviders: Set<string> = new Set();
  private retryDelay = 30000; // 30 seconds before retrying failed providers
  private huggingFaceProvider: HuggingFaceProvider | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Add your API keys here
    this.providers = [
      {
        name: 'deepseek',
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
        priority: 1,
        enabled: true
      },
      {
        name: 'groq',
        apiKey: process.env.GROQ_API_KEY || '',
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'openai/gpt-oss-safeguard-20b',
        priority: 2,
        enabled: true
      },
      {
        name: 'gemini',
        apiKey: process.env.GEMINI_API_KEY || '',
        model: 'gemini-1.5-flash',
        priority: 3,
        enabled: !!process.env.GEMINI_API_KEY // Only enable if API key is provided
      },
      {
        name: 'huggingface',
        apiKey: process.env.HUGGINGFACE_API_KEY || '',
        baseUrl: 'https://api-inference.huggingface.co',
        model: 'microsoft/DialoGPT-large',
        priority: 4,
        enabled: false // Disabled - endpoint deprecated, need to use Inference API client
      },
      {
        name: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
        priority: 5,
        enabled: !!process.env.OPENAI_API_KEY
      },
      {
        name: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        baseUrl: 'https://api.anthropic.com/v1',
        model: 'claude-3-5-sonnet-20241022',
        priority: 6,
        enabled: !!process.env.ANTHROPIC_API_KEY
      }
    ].filter(provider => provider.enabled);

    // Sort by priority
    this.providers.sort((a, b) => a.priority - b.priority);
    this.currentProvider = this.providers[0] || null;
    
    console.log('🤖 Initialized AI Providers:', this.providers.map(p => p.name).join(', '));
  }

  private async callProvider(provider: AIProvider, messages: ChatMessage[]): Promise<AIResponse> {
    const { name, apiKey, baseUrl, model } = provider;

    try {
      switch (name) {
        case 'deepseek':
          return await this.callDeepSeek(apiKey, baseUrl!, messages, model);
        case 'groq':
          return await this.callGroq(apiKey, baseUrl!, messages, model);
        case 'huggingface':
          return await this.callHuggingFace(apiKey, baseUrl!, messages, model);
        case 'gemini':
          return await this.callGemini(apiKey, messages, model);
        case 'openai':
          return await this.callOpenAI(apiKey, baseUrl!, messages, model);
        case 'anthropic':
          return await this.callAnthropic(apiKey, baseUrl!, messages, model);
        default:
          throw new Error(`Unknown provider: ${name}`);
      }
    } catch (error: any) {
      console.error(`Provider ${name} failed:`, error.message);
      throw error;
    }
  }

  private async callDeepSeek(apiKey: string, baseUrl: string, messages: ChatMessage[], model: string): Promise<AIResponse> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return {
      text: data.choices?.[0]?.message?.content || 'No response generated',
      provider: 'deepseek',
      usage: data.usage
    };
  }

  private async callGemini(apiKey: string, messages: ChatMessage[], model: string): Promise<AIResponse> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: messages.map(m => `${m.role}: ${m.content}`).join('\n\n')
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated',
      provider: 'gemini',
      usage: data.usageMetadata ? {
        prompt_tokens: data.usageMetadata.promptTokenCount || 0,
        completion_tokens: data.usageMetadata.candidatesTokenCount || 0,
        total_tokens: data.usageMetadata.totalTokenCount || 0
      } : undefined
    };
  }

  private async callGroq(apiKey: string, baseUrl: string, messages: ChatMessage[], model: string): Promise<AIResponse> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      })
    });

    if (!response.ok) {
      let errorMessage = `Groq API error: ${response.status} ${response.statusText}`;
      let rateLimitInfo: { retryAfter?: number; retryAfterMessage?: string } | undefined;
      
      // Try to parse error response for rate limit info
      try {
        const errorData = await response.json();
        const errorText = JSON.stringify(errorData);
        
        // Check for rate limit (429) or TPM/quota errors
        if (response.status === 429 || errorText.toLowerCase().includes('rate limit') || 
            errorText.toLowerCase().includes('tpm') || errorText.toLowerCase().includes('quota')) {
          
          // Try to extract retry time from error message
          // Groq format: "Please try again in 16.425s" or "retry after Y seconds"
          const retryMatch = errorText.match(/(?:in|after|try again in|retry after)\s+(\d+\.?\d*)\s*s(?!\w)/i) ||
                            errorText.match(/(\d+\.?\d*)\s*s(?!\w)/i); // Match "16.425s" or "16s" but not "seconds"
          
          if (retryMatch) {
            const retrySeconds = parseFloat(retryMatch[1]);
            rateLimitInfo = {
              retryAfter: retrySeconds,
              retryAfterMessage: `You can retry in ${retrySeconds.toFixed(1)} seconds`
            };
            errorMessage = `Rate limit reached. ${rateLimitInfo.retryAfterMessage}.`;
          } else {
            // Check for Retry-After header
            const retryAfterHeader = response.headers.get('Retry-After');
            if (retryAfterHeader) {
              const retrySeconds = parseFloat(retryAfterHeader);
              rateLimitInfo = {
                retryAfter: retrySeconds,
                retryAfterMessage: `You can retry in ${retrySeconds.toFixed(1)} seconds`
              };
              errorMessage = `Rate limit reached. ${rateLimitInfo.retryAfterMessage}.`;
            } else {
              errorMessage = 'Rate limit reached. Please wait a moment and try again.';
            }
          }
        }
      } catch (e) {
        // If we can't parse the error, use the default message
      }
      
      const error = new Error(errorMessage) as any;
      error.rateLimitInfo = rateLimitInfo;
      throw error;
    }

    const data = await response.json();
    return {
      text: data.choices?.[0]?.message?.content || 'No response generated',
      provider: 'groq',
      usage: data.usage
    };
  }

  private async callHuggingFace(apiKey: string, baseUrl: string, messages: ChatMessage[], model: string): Promise<AIResponse> {
    // Get the last user message for Hugging Face
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const inputText = lastUserMessage?.content || 'Hello';

    // Use new router endpoint format
    const endpoint = baseUrl.includes('router.huggingface.co') 
      ? `${baseUrl}/models/${model}` 
      : `${baseUrl}/models/${model}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: inputText,
        parameters: {
          max_length: 100,
          temperature: 0.7,
          return_full_text: false,
          do_sample: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Handle different response formats from Hugging Face
    let text = 'No response generated';
    if (Array.isArray(data) && data.length > 0) {
      text = data[0].generated_text || data[0].text || 'No response generated';
    } else if (data.generated_text) {
      text = data.generated_text;
    } else if (data.text) {
      text = data.text;
    } else if (data[0] && data[0].generated_text) {
      text = data[0].generated_text;
    }

    return {
      text: text.trim(),
      provider: 'huggingface',
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }

  private async callOpenAI(apiKey: string, baseUrl: string, messages: ChatMessage[], model: string): Promise<AIResponse> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.choices?.[0]?.message?.content || 'No response generated',
      provider: 'openai',
      usage: data.usage
    };
  }

  private async callAnthropic(apiKey: string, baseUrl: string, messages: ChatMessage[], model: string): Promise<AIResponse> {
    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2048,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.content?.[0]?.text || 'No response generated',
      provider: 'anthropic',
      usage: data.usage
    };
  }

  public async generateResponse(messages: ChatMessage[], selectedModel?: string): Promise<AIResponse> {
    // If a specific model is selected, find the provider for that model
    if (selectedModel && selectedModel !== 'auto') {
      const modelProvider = this.getProviderForModel(selectedModel);
      if (modelProvider) {
        try {
          console.log(`🎯 Using selected model: ${selectedModel} (${modelProvider.name})`);
          return await this.callProvider(modelProvider, messages);
        } catch (error: any) {
          console.error(`Selected model ${selectedModel} failed, falling back to auto:`, error.message);
          // If it's a rate limit error, re-throw it
          if (error.rateLimitInfo) {
            throw error;
          }
          // Fall through to auto selection
        }
      }
    }
    
    const availableProviders = this.providers.filter(p => !this.failedProviders.has(p.name));
    
    if (availableProviders.length === 0) {
      throw new Error('All AI providers are currently unavailable. Please try again later.');
    }
    
    for (const provider of availableProviders) {
      try {
        console.log(`Trying provider: ${provider.name}`);
        const response = await this.callProvider(provider, messages);
        
        // Reset failed providers on success
        this.failedProviders.clear();
        this.currentProvider = provider;
        
        console.log(`✅ Success with ${provider.name}`);
        return response;
      } catch (error: any) {
        console.error(`❌ Provider ${provider.name} failed:`, error.message);
        
        // If this is a rate limit error with retry info, preserve it
        if (error.rateLimitInfo) {
          // Re-throw with rate limit info so it can be passed to the caller
          throw error;
        }
        
        // Mark provider as failed
        this.failedProviders.add(provider.name);
        
        // Check if it's a retryable error
        const isRetryable = error.message?.includes('503') || 
                           error.message?.includes('overloaded') || 
                           error.message?.includes('rate limit') ||
                           error.message?.includes('UNAVAILABLE') ||
                           error.message?.includes('timeout');
        
        if (isRetryable) {
          // Schedule retry for this provider
          setTimeout(() => {
            this.failedProviders.delete(provider.name);
            console.log(`🔄 Provider ${provider.name} is available for retry`);
          }, this.retryDelay);
        }
        
        // Continue to next provider
        continue;
      }
    }

    throw new Error('All AI providers failed. Please try again later.');
  }

  public getCurrentProvider(): string | null {
    return this.currentProvider?.name || null;
  }

  public getProviderStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {};
    this.providers.forEach(provider => {
      status[provider.name] = !this.failedProviders.has(provider.name);
    });
    return status;
  }

  public resetFailedProviders(): void {
    this.failedProviders.clear();
    console.log('🔄 All providers reset and available');
  }

  private getProviderForModel(modelId: string): AIProvider | null {
    // Map model IDs to providers and their models
    const modelMap: { [key: string]: { provider: string; model: string } } = {
      'deepseek-chat': { provider: 'deepseek', model: 'deepseek-chat' },
      'llama-3.1-8b-instant': { provider: 'groq', model: 'llama-3.1-8b-instant' },
      'llama-3.3-70b-versatile': { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      'gpt-oss-20b': { provider: 'groq', model: 'openai/gpt-oss-20b' },
      'gpt-oss-120b': { provider: 'groq', model: 'openai/gpt-oss-120b' },
      'llama-guard-4-12b': { provider: 'groq', model: 'meta-llama/llama-guard-4-12b' },
      'gpt-oss-safeguard-20b': { provider: 'groq', model: 'openai/gpt-oss-safeguard-20b' }, // Legacy ID support
      'gemini-1.5-flash': { provider: 'gemini', model: 'gemini-1.5-flash' },
      'gpt-4o-mini': { provider: 'openai', model: 'gpt-4o-mini' },
      'gpt-4o': { provider: 'openai', model: 'gpt-4o' },
      'claude-3-5-sonnet': { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
      'claude-3-opus': { provider: 'anthropic', model: 'claude-3-opus-20240229' }
    };

    const modelInfo = modelMap[modelId];
    if (!modelInfo) return null;

    const provider = this.providers.find(p => p.name === modelInfo.provider);
    if (!provider) return null;

    // Return a copy of the provider with the specific model
    return {
      ...provider,
      model: modelInfo.model
    };
  }
}

// Export singleton instance
export const multiProviderAI = new MultiProviderAI();
