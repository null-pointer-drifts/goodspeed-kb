-- Enable pgvector for embeddings
create extension if not exists vector;

-- Documents table
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  title       text not null,
  content     text not null,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_updated_at
  before update on documents
  for each row execute function update_updated_at();

-- Document chunks table (stores text chunks + vector embeddings)
create table if not exists document_chunks (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references documents(id) on delete cascade,
  content      text not null,
  chunk_index  integer not null,
  embedding    vector(1536),         -- text-embedding-3-small dimensions
  unique (document_id, chunk_index)
);

-- Index for similarity search
create index if not exists document_chunks_embedding_idx
  on document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index for fast lookup by document
create index if not exists document_chunks_document_id_idx
  on document_chunks (document_id);

-- Helper function for similarity search used by the API
create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count     int
)
returns table (
  id           uuid,
  document_id  uuid,
  content      text,
  chunk_index  integer,
  similarity   float
)
language sql stable as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where dc.embedding is not null
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
