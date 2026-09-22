import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatMessage } from '@goodspeed/types';
import { IAiProvider } from './ai-provider.interface';

/**
 * Works with any provider that follows the OpenAI API spec:
 * - OpenAI        AI_BASE_URL=https://api.openai.com/v1
 * - Groq          AI_BASE_URL=https://api.groq.com/openai/v1
 * - Together AI   AI_BASE_URL=https://api.together.xyz/v1
 * - OpenRouter    AI_BASE_URL=https://openrouter.ai/api/v1
 * - Ollama        AI_BASE_URL=http://localhost:11434/v1
 *
 * Only AI_BASE_URL, AI_API_KEY, AI_MODEL, and AI_EMBEDDING_MODEL need to change.
 */
@Injectable()
export class OpenAICompatibleProvider implements IAiProvider {
  private client: OpenAI;
  private chatModel: string;
  private embeddingModel: string;

  constructor(private config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.getOrThrow('AI_API_KEY'),
      baseURL: this.config.getOrThrow('AI_BASE_URL'),
    });
    this.chatModel = this.config.getOrThrow('AI_MODEL');
    this.embeddingModel = this.config.getOrThrow('AI_EMBEDDING_MODEL');
  }

  async chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.chatModel,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });
    return response.choices[0].message.content ?? '';
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: text,
    });
    return response.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: texts,
    });
    return response.data.map((d) => d.embedding);
  }
}
