# Goodspeed KB — AI-Powered Knowledge Base

A full-stack application that lets you upload documents and chat with them using RAG (Retrieval-Augmented Generation).

**[App Walkthrough — Loom](REPLACE_WITH_LOOM_LINK)**
**[AI-Assisted Development — Loom](REPLACE_WITH_LOOM_LINK)**

## Architecture

```
goodspeed-kb/
├── apps/
│   ├── api/          # NestJS REST API (port 3001)
│   └── web/          # Next.js 14 frontend (port 3000)
└── packages/
    └── types/        # Shared TypeScript types
```

### How it works

1. **Document ingestion** — when you upload a document, the API splits it into 500-character chunks, generates vector embeddings via OpenAI, and stores them in Supabase with pgvector.
2. **Chat (RAG)** — when you send a message, the API embeds your query, finds the most semantically similar chunks via cosine similarity, and passes them as context to GPT-4o-mini to generate a grounded answer.

```
Upload document
  └─ chunk text (500 chars, 50 overlap)
  └─ batch embed chunks (text-embedding-3-small)
  └─ store in document_chunks with vector

Send chat message
  └─ embed query
  └─ similarity search → top 5 chunks (threshold 0.7)
  └─ GPT-4o-mini completion with context
  └─ return answer + source chunks
```

### Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Backend | NestJS |
| Database | Supabase (PostgreSQL + pgvector) |
| AI | OpenAI (gpt-4o-mini + text-embedding-3-small) |
| Monorepo | Turborepo + pnpm workspaces |

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

Copy `.env.example` and fill in values:

```bash
cp .env.example apps/api/.env
```

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

AI_API_KEY=your_openai_api_key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_EMBEDDING_MODEL=text-embedding-3-small

FRONTEND_URL=http://localhost:3000
```

For the web app:

```bash
# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Run the database migrations

In your Supabase dashboard, go to **SQL Editor** and run each migration in order:

```
supabase/migrations/001_initial_schema.sql   # tables, pgvector, similarity search function
supabase/migrations/002_rls_policies.sql     # Row Level Security policies
```

### 4. Run the app

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/documents` | List all documents |
| `GET` | `/api/documents/:id` | Get a single document |
| `POST` | `/api/documents` | Create document (auto-ingests) |
| `PUT` | `/api/documents/:id` | Update document (re-ingests if content changed) |
| `DELETE` | `/api/documents/:id` | Delete document (chunks cascade) |
| `POST` | `/api/chat` | RAG chat |

### POST /api/documents

```json
{
  "title": "My Document",
  "content": "Document content here...",
  "tags": ["engineering", "docs"]
}
```

### POST /api/chat

```json
{
  "message": "What does the document say about X?",
  "conversationHistory": []
}
```

Response:

```json
{
  "message": "According to your documents...",
  "sources": [
    { "id": "...", "documentId": "...", "content": "...", "chunkIndex": 0 }
  ]
}
```

## Design Decisions

**Chunking strategy** — 500-character chunks with 50-character overlap. The overlap ensures context isn't lost at chunk boundaries, which matters for sentences that span chunks.

**Batch embeddings** — all chunks from a document are embedded in a single API call rather than one-by-one, reducing latency and API cost.

**Service role key on the backend** — the NestJS API uses Supabase's service role key (bypasses RLS) since it's a trusted server environment. The frontend uses the anon key.

**Global exception filter** — all errors return a consistent JSON shape `{ statusCode, message, path, timestamp }` so the frontend always has something reliable to display.

**Re-ingestion on update** — if a document's content changes, the old chunks are deleted and new ones are generated automatically. If only the title or tags change, no re-ingestion happens.

## Swapping AI Providers

The AI layer is provider-agnostic. Any provider that follows the OpenAI API spec can be swapped in by changing three environment variables — no code changes needed.

| Provider | `AI_PROVIDER` | `AI_BASE_URL` | `AI_MODEL` |
|---|---|---|---|
| OpenAI | `openai` | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Groq | `groq` | `https://api.groq.com/openai/v1` | `llama-3.1-8b-instant` |
| Together AI | `together` | `https://api.together.xyz/v1` | `meta-llama/Llama-3-8b-chat-hf` |
| OpenRouter | `openrouter` | `https://openrouter.ai/api/v1` | any supported model |
| Ollama (local) | `ollama` | `http://localhost:11434/v1` | `llama3.2` |

Example — switching to Groq:

```env
AI_PROVIDER=groq
AI_BASE_URL=https://api.groq.com/openai/v1
AI_API_KEY=your_groq_api_key
AI_MODEL=llama-3.1-8b-instant
AI_EMBEDDING_MODEL=...
```

The abstraction lives in `apps/api/src/ai/providers/`. To add a new provider that doesn't follow the OpenAI spec, implement the `IAiProvider` interface and add a case for it in `ai.module.ts`.

## What I'd Improve Given More Time

- **Streaming responses** — pipe the OpenAI stream directly to the client so answers appear word-by-word instead of waiting for the full completion
- **Persistent conversation history** — store chat sessions in Supabase so conversations survive page refreshes
- **File upload** — accept PDF/TXT uploads and extract text automatically instead of requiring users to paste content
- **Smarter chunking** — use sentence or paragraph boundaries instead of fixed character counts to preserve semantic coherence
- **Token usage tracking** — log prompt/completion tokens per request so users can see their usage
- **Pagination** — the documents list currently loads everything; needs cursor-based pagination at scale
