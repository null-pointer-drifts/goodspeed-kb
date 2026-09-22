import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { IngestionService } from '../ai/ingestion.service';
import { Document, CreateDocumentDto, UpdateDocumentDto } from '@goodspeed/types';

@Injectable()
export class DocumentsService {
  constructor(
    private supabase: SupabaseService,
    private ingestion: IngestionService,
  ) {}

  async findAll(userId: string): Promise<Document[]> {
    const { data, error } = await this.supabase.client
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.toDocument);
  }

  async findOne(id: string, userId: string): Promise<Document> {
    const { data, error } = await this.supabase.client
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException(`Document ${id} not found`);
    return this.toDocument(data);
  }

  async create(dto: CreateDocumentDto, userId: string): Promise<Document> {
    const { data, error } = await this.supabase.client
      .from('documents')
      .insert({ title: dto.title, content: dto.content, tags: dto.tags ?? [], user_id: userId })
      .select()
      .single();

    if (error) throw error;
    const doc = this.toDocument(data);

    await this.ingestion.ingestDocument(doc.id, doc.content);
    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto, userId: string): Promise<Document> {
    await this.findOne(id, userId); // ensure exists + owned

    const { data, error } = await this.supabase.client
      .from('documents')
      .update({ ...dto })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    const doc = this.toDocument(data);

    // Re-ingest if content changed
    if (dto.content !== undefined) {
      await this.ingestion.ingestDocument(doc.id, doc.content);
    }

    return doc;
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId); // ensure exists + owned

    const { error } = await this.supabase.client
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private toDocument(row: Record<string, unknown>): Document {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      title: row.title as string,
      content: row.content as string,
      tags: row.tags as string[],
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
