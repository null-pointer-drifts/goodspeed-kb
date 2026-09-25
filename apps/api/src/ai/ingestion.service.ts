import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AiService } from './ai.service';
import { ChunkingService } from './chunking.service';

@Injectable()
export class IngestionService {
  constructor(
    private supabase: SupabaseService,
    private ai: AiService,
    private chunking: ChunkingService,
  ) {}

  async ingestDocument(documentId: string, content: string): Promise<void> {
    // 1. Split into chunks
    const chunks = this.chunking.chunk(content);

    // 2. Embed all chunks in one batch request
    const embeddings = await this.ai.embedBatch(chunks);

    // 3. Delete any existing chunks for this document (re-ingestion support)
    await this.supabase.client
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    // 4. Upsert new chunks with embeddings
    const rows = chunks.map((chunk, index) => ({
      document_id: documentId,
      content: chunk,
      chunk_index: index,
      embedding: JSON.stringify(embeddings[index]),
    }));

    const { error } = await this.supabase.client
      .from('document_chunks')
      .insert(rows);

    if (error) throw error;
  }

  async searchChunks(
    queryEmbedding: number[],
    matchThreshold = 0.1,
    matchCount = 5,
  ) {
    // Fetch all chunks with embeddings
    const { data, error } = await this.supabase.client
      .from('document_chunks')
      .select('id, document_id, content, chunk_index, embedding')
      .not('embedding', 'is', null);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Compute cosine similarity in JS
    const cosineSimilarity = (a: number[], b: number[]): number => {
      let dot = 0, normA = 0, normB = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    const results = data
      .map((chunk: any) => {
        const embedding = typeof chunk.embedding === 'string'
          ? JSON.parse(chunk.embedding)
          : Array.isArray(chunk.embedding)
            ? chunk.embedding
            : Object.values(chunk.embedding);
        const similarity = cosineSimilarity(queryEmbedding, embedding);
        return { ...chunk, similarity };
      })
      .filter((c: any) => c.similarity > matchThreshold)
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, matchCount);

    return results;
  }
}
