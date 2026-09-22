export interface Document {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  embedding?: number[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  sources: DocumentChunk[];
}

export interface CreateDocumentDto {
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdateDocumentDto {
  title?: string;
  content?: string;
  tags?: string[];
}
