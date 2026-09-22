import { Inject, Injectable } from '@nestjs/common';
import { ChatMessage } from '@goodspeed/types';
import { IAiProvider, AI_PROVIDER } from './providers/ai-provider.interface';

@Injectable()
export class AiService {
  constructor(@Inject(AI_PROVIDER) private provider: IAiProvider) {}

  chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    return this.provider.chat(messages, systemPrompt);
  }

  embed(text: string): Promise<number[]> {
    return this.provider.embed(text);
  }

  embedBatch(texts: string[]): Promise<number[][]> {
    return this.provider.embedBatch(texts);
  }
}
