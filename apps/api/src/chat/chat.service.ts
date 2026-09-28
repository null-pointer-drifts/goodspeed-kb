import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { IngestionService } from '../ai/ingestion.service';
import { ChatRequest, ChatResponse, DocumentChunk } from '@goodspeed/types';

const SYSTEM_PROMPT = (context: string) => `\
You are a helpful assistant answering questions based on the user's personal knowledge base.
The context below is content the user has uploaded — treat it as their own information.
If the context contains a resume or profile, the person described in it IS the user asking the question.
Answer directly using the context. Do not say "the context does not mention" — if the information is there, use it.
If the answer genuinely cannot be found anywhere in the context, only then say you don't know.

Context:
${context}`;

@Injectable()
export class ChatService {
  constructor(
    private ai: AiService,
    private ingestion: IngestionService,
  ) {}

  async chat(request: ChatRequest, userId: string): Promise<ChatResponse> {
    // 1. Embed the user's query
    const queryEmbedding = await this.ai.embed(request.message);

    // 2. Find relevant chunks scoped to this user's documents
    const rawChunks = await this.ingestion.searchChunks(queryEmbedding, 0.1, 5, userId);
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
