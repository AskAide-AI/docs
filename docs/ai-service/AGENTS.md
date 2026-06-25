# AI Service (RAG System) — Agent Guide

## Critical Commands

```bash
# Start server
uvicorn main:app --reload --port 8000

# Lint
ruff check .

# Type check
mypy . --ignore-missing-imports

# Test
pytest tests/ -v

# Format
ruff format .
```

## Architecture

**Entry point:** `main.py` → FastAPI app with lifespan keep-alive task

**Pattern:** Every capability lives in `services/` as a service class. LLM integrations in `llm/`, utilities in `utils/`, database clients in `db/`.

**Request lifecycle:**
```
FastAPI route → Schema validation (Pydantic) → Service class → LLM/Database → Response
```

**Modules:**
- `services/upload_service.py` — Document ingestion (chunking, embedding, Qdrant storage)
- `services/query_service.py` — Semantic search + RAG response generation
- `services/generate_question_service.py` — AI-powered question generation
- `services/llm_insights.py` — AI learning insights for subjects/chapters
- `services/rag.py` — Core RAG implementation (chunking, summarization, topic extraction)

**LLM Providers:** `services/llm_service.py` defines the ABC + `get_llm_service_class()` factory. Implementations in `llm/`: `llm_open_router.py`, `llm_gemini.py`, `llm_open_ai.py`, `llm_anthropic.py`.

**Embedding Providers:** `utils/embedding.py` supports a fallback chain. Providers: `ollama`, `external`, `openai`, `google`.

**Databases:**
- Qdrant (`db/qdrant_db.py`) — Vector storage for embeddings
- MongoDB (`db/mongo_db.py`) — Topic/chapter metadata
- Redis (`db/redis_db.py`) — Pub/sub and caching

**Utilities:** `utils/embedding.py`, `utils/chunker.py`, `utils/topic_search.py`, `utils/prompt.py`

## Cross-Repository Integration

This service integrates with two sibling repos. See `CROSS_REPO_MAP.md` for the full picture.

### Backend (Express + MongoDB) — `D:\AskAide AI\Backend`
- Calls this service for: document upload/delete/search, question generation, AI insights
- Uses `AI_ENDPOINT` env var for this service's base URL
- Uses `AI_QUESTION_REQ_URL` env var for `/generate-questions`

### Frontend (React 18 + Vite) — `D:\AskAide AI\Frontend`
- Never directly calls this service. All AI is proxied through Backend.
- `VITE_API_URL` points to Backend, which proxies AI calls.

### Shared Contracts — `D:\AskAide AI\shared-contracts\`
- `data-models.ts` — TypeScript interfaces (incl. AI request/response types)
- `data-models.schema.json` — JSON Schema mirror
- `api-definitions.md` — All API endpoint definitions

## When Making Changes Affecting Integration

1. **Changing request/response schemas** → Update `utils/schema.py` AND `D:\AskAide AI\shared-contracts\data-models.ts`
2. **Adding new endpoints** → Add to `main.py` AND update `D:\AskAide AI\shared-contracts\api-definitions.md`
3. **Changing MongoDB collection access** → Verify `db/mongo_db.py` still matches Backend's Mongoose schemas
4. **Changing env vars** → Update docs and verify Backend's `.env` has matching vars

## Key env vars

### LLM Provider Selection
`LLM_PROVIDER=openrouter` — Switch to: `openai`, `gemini`, `anthropic`

API keys: `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`

### Embedding Provider Chain
`EMBEDDING_PROVIDERS=ollama,google` — comma-separated, tried left-to-right with fallback. Free options: `ollama`, `google`. Paid: `external`, `openai`.

Config per provider: `OLLAMA_BASE_URL`, `OLLAMA_EMBEDDING_MODEL`, `EMBEDDING_API_URL`, `OPENAI_API_KEY`, `GEMINI_API_KEY`

**Dimension handling:** All embeddings auto-normalize to `QDRANT_VECTOR_SIZE` (default 1024).

### Question Generation (Context Rotation)
Question generation in `services/generate_question_service.py` uses context rotation to produce
distinct questions across successive calls:
- `QG_CANDIDATE_POOL=200` — how many chapter chunks to consider per generation (covers the whole chapter)
- `QG_CANDIDATE_SAMPLE=12` — chunks randomly sampled from the pool and fed to the LLM per call

Without this, the filter always returns the first N chunks and regeneration only produces
reworded duplicates of the chapter's opening pages.

### Other
`QDRANT_HOST`, `QDRANT_API_KEY`, `MONGO_URI`, `REDIS_HOST`, `REDIS_PASSWORD`

## Agent skills

`.agent/skills/` contains codified patterns for this project:
- `rag-system-expert` — Core RAG architecture, chunking, embedding, Qdrant operations
- `fastapi-service-patterns` — Service layer patterns, dependency injection, error handling
- `python-testing` — Pytest + FastAPI test patterns
- `code-review-graph-setup` — Graph-based code analysis setup and usage
- `skill-creator` — Guide for creating new skills
- `backend-integration` — AI service ↔ Backend Express integration patterns
- `cross-service-integration` — Full cross-repo coordination (Frontend ↔ Backend ↔ AI)
