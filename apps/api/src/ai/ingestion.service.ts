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
    matchThreshold = 0.7,
    matchCount = 5,
  ) {
    const { data, error } = await this.supabase.client.rpc(
      'match_document_chunks',
      {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: matchThreshold,
        match_count: matchCount,
      },
    );

    if (error) throw error;
    return data ?? [];
  }
}
