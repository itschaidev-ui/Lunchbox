
'use server';

/**
 * @fileoverview A conversational flow for the AI assistant.
 */
import { Message, Part } from '@genkit-ai/ai/message';
import { ai } from '@/ai/genkit';

export type { Message } from '@genkit-ai/ai/message';

/**
 * The main conversational flow.
 *
 * @param history A history of messages in the conversation.
 * @returns The AI's response.
 */
export async function continueConversation(history: Message[]): Promise<Part[]> {
  const response = await ai.generate({
    model: 'gemini-1.5-flash-latest',
    history: history,
    prompt:
      'You are a helpful AI assistant named Lunchbox. You are witty and charming. Keep your responses concise and helpful.',
  });

  return [{ text: response.text }];
}
