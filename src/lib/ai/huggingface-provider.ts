/**
 * Advanced Hugging Face Provider with Multiple Model Support
 * Supports various Hugging Face models for different use cases
 */

export interface HuggingFaceModel {
  name: string;
  displayName: string;
  description: string;
  category: 'chat' | 'text-generation' | 'summarization' | 'translation' | 'question-answering';
  maxLength: number;
  temperature: number;
}

export const HUGGINGFACE_MODELS: HuggingFaceModel[] = [
  // Chat Models
  {
    name: 'microsoft/DialoGPT-large',
    displayName: 'DialoGPT Large',
    description: 'Conversational AI model for chat',
    category: 'chat',
    maxLength: 100,
    temperature: 0.7
  },
  {
    name: 'facebook/blenderbot-400M-distill',
    displayName: 'BlenderBot 400M',
    description: 'Facebook\'s conversational AI',
    category: 'chat',
    maxLength: 150,
    temperature: 0.8
  },
  {
    name: 'microsoft/DialoGPT-medium',
    displayName: 'DialoGPT Medium',
    description: 'Medium-sized conversational model',
    category: 'chat',
    maxLength: 80,
    temperature: 0.7
  },
  
  // Text Generation Models
  {
    name: 'gpt2-large',
    displayName: 'GPT-2 Large',
    description: 'OpenAI\'s GPT-2 for text generation',
    category: 'text-generation',
    maxLength: 200,
    temperature: 0.8
  },
  {
    name: 'EleutherAI/gpt-neo-2.7B',
    displayName: 'GPT-Neo 2.7B',
    description: 'Large-scale text generation model',
    category: 'text-generation',
    maxLength: 300,
    temperature: 0.7
  },
  {
    name: 'EleutherAI/gpt-j-6B',
    displayName: 'GPT-J 6B',
    description: '6B parameter text generation model',
    category: 'text-generation',
    maxLength: 400,
    temperature: 0.7
  },
  
  // Specialized Models
  {
    name: 'facebook/bart-large-cnn',
    displayName: 'BART Large CNN',
    description: 'Text summarization model',
    category: 'summarization',
    maxLength: 150,
    temperature: 0.5
  },
  {
    name: 't5-base',
    displayName: 'T5 Base',
    description: 'Text-to-text transfer transformer',
    category: 'text-generation',
    maxLength: 200,
    temperature: 0.7
  },
  {
    name: 'google/flan-t5-base',
    displayName: 'FLAN-T5 Base',
    description: 'Instruction-tuned T5 model',
    category: 'text-generation',
    maxLength: 250,
    temperature: 0.7
  }
];

export class HuggingFaceProvider {
  private apiKey: string;
  private baseUrl: string;
  private currentModel: string;

  constructor(apiKey: string, baseUrl: string = 'https://api-inference.huggingface.co') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.currentModel = 'microsoft/DialoGPT-large'; // Default model
  }

  public setModel(modelName: string): void {
    this.currentModel = modelName;
  }

  public getAvailableModels(): HuggingFaceModel[] {
    return HUGGINGFACE_MODELS;
  }

  public getCurrentModel(): HuggingFaceModel | undefined {
    return HUGGINGFACE_MODELS.find(m => m.name === this.currentModel);
  }

  public async generateResponse(messages: any[], modelName?: string): Promise<{
    text: string;
    provider: string;
    model: string;
    usage?: any;
  }> {
    const model = modelName || this.currentModel;
    const modelConfig = HUGGINGFACE_MODELS.find(m => m.name === model);
    
    if (!modelConfig) {
      throw new Error(`Model ${model} not found in available models`);
    }

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const inputText = lastUserMessage?.content || 'Hello';

    try {
      const response = await fetch(`${this.baseUrl}/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: inputText,
          parameters: {
            max_length: modelConfig.maxLength,
            temperature: modelConfig.temperature,
            return_full_text: false,
            do_sample: true,
            top_p: 0.9,
            top_k: 50
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hugging Face API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      // Handle different response formats
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
        model: model,
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    } catch (error: any) {
      console.error(`Hugging Face ${model} failed:`, error.message);
      throw error;
    }
  }

  public async testModel(modelName: string): Promise<boolean> {
    try {
      await this.generateResponse([
        { role: 'user', content: 'Hello' }
      ], modelName);
      return true;
    } catch (error) {
      console.error(`Model ${modelName} test failed:`, error);
      return false;
    }
  }
}
