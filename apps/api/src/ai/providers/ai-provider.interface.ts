import { ChatMessage } from '@goodspeed/types';

export const AI_PROVIDER = 'AI_PROVIDER';

export interface IAiProvider {
  chat(messages: ChatMessage[], systemPrompt: string): Promise<string>;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
