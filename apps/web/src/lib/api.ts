import { Document, CreateDocumentDto, UpdateDocumentDto, ChatRequest, ChatResponse } from '@goodspeed/types';
import { createClient } from './supabase/client';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api`;

async function getToken(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return token;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  documents: {
    list: () => request<Document[]>('/documents'),
    get: (id: string) => request<Document>(`/documents/${id}`),
    create: (dto: CreateDocumentDto) =>
      request<Document>('/documents', { method: 'POST', body: JSON.stringify(dto) }),
    update: (id: string, dto: UpdateDocumentDto) =>
      request<Document>(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    remove: (id: string) =>
      request<void>(`/documents/${id}`, { method: 'DELETE' }),
  },
  chat: {
    send: (payload: ChatRequest) =>
      request<ChatResponse>('/chat', { method: 'POST', body: JSON.stringify(payload) }),
  },
};
