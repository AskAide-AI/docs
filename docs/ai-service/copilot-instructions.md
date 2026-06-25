# Copilot Instructions — AskAideAI AI Service

## Project Identity
- **Name**: AskAideAI AI Service
- **Type**: Python FastAPI RAG system
- **Port**: 8000
- **Role**: Document ingestion, semantic search, AI question generation, learning insights
- **Backend**: Express.js API at `http://localhost:4000` (calls this service)
- **Frontend**: React SPA at `http://localhost:5173` (never calls this service directly)

## Architecture Patterns
- Entry: `main.py` → FastAPI app with lifespan keep-alive
- Service pattern: `services/<name>_service.py` with singleton getter in `services/service.py`
- Validation: Pydantic schemas in `utils/schema.py`
- LLM: Abstract base in `services/llm_service.py`, implementations in `llm/`
- Embedding: `utils/embedding.py` with fallback chain (ollama → google → external → openai)

## Key Endpoints
- `POST /upload-document` — Document ingestion (multipart: file + class_id, chapter_id, subject_id)
- `POST /delete-document` — Remove from Qdrant by metadata filter
- `POST /search-document` — Check document existence by metadata
- `POST /query` — Semantic search with RAG response
- `POST /generate-questions` — AI question generation from RAG context
- `GET /ai-insights/chapter` — Student chapter learning analysis
- `GET /ai-insights/subject` — Student subject learning analysis

## LLM Provider Selection
- Set `LLM_PROVIDER` in env: `openrouter` (default), `openai`, `gemini`, `anthropic`
- Each provider has its own API key env var

## Embedding Provider Chain
- Set `EMBEDDING_PROVIDERS=ollama,google` (comma-separated, tried with fallback)
- All embeddings auto-pad/truncate to `QDRANT_VECTOR_SIZE` (default 1024)

## Processing Pipelines
1. **Upload**: Extract text → Chunk (4000 chars) → LLM summarize → Extract topics → Re-chunk (512 words) → Embed → Store in Qdrant
2. **Query**: Embed query → Vector search → Context retrieval → LLM → Response
3. **Question Gen**: Fetch topics → Search Qdrant → Build context → LLM → Questions
4. **Insights**: Fetch StudentTopicProgress from MongoDB → Aggregate → LLM analyze

## Shared Contracts
Data models and API definitions are at `D:\AskAide AI\shared-contracts\`:
- `utils/schema.py` must stay in sync with `data-models.ts` for AI request/response types
- When adding new endpoints, update `api-definitions.md`
