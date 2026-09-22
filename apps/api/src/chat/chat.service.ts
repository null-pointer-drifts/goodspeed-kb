import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { IngestionService } from '../ai/ingestion.service';
import { ChatRequest, ChatResponse, DocumentChunk } from '@goodspeed/types';

const SYSTEM_PROMPT = (context: string) => `\
You are a helpful assistant answering questions based on the user's knowledge base.
Use the context below to answer. If the answer isn't in the context, say so honestly.

Context:
${context}`;

@Injectable()
export class ChatService {
  constructor(
    private ai: AiService,
    private ingestion: IngestionService,
  ) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // 1. Embed the user's query
    const queryEmbedding = await this.ai.embed(request.message);

    // 2. Find relevant chunks
    const rawChunks = await this.ingestion.searchChunks(queryEmbedding, 0.7, 5);

    const sources: DocumentChunk[] = rawChunks.map((c: any) => ({
      id: c.id,
      documentId: c.document_id,
      content: c.content,
      chunkIndex: c.chunk_index,
    }));

    // 3. Build context from retrieved chunks
    const context = sources.map((s) => s.content).join('\n\n---\n\n');

    // 4. Call the LLM with conversation history + context
    const fullHistory = [
      ...request.conversationHistory,
      { role: 'user' as const, content: request.message },
    ];

    const message = await this.ai.chat(fullHistory, SYSTEM_PROMPT(context));

    return { message, sources };
  }
}
