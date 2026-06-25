# CLAUDE.md — AI Service

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
uvicorn main:app --reload --port 8000   # Start dev server
python main.py                           # Alternative start
ruff check .                             # Lint
ruff format .                            # Format
pytest tests/ -v                         # Test
mypy . --ignore-missing-imports          # Type check
```

Run a single test file:
```bash
pytest tests/test_api_endpoints.py -v
```

## Architecture

AI Service is a Python FastAPI-based RAG (Retrieval-Augmented Generation) system serving educational content via semantic search, question generation, and AI insights.

**Entry point:** `main.py` → FastAPI app → service classes → LLM providers / vector DB

**Pattern:** Every feature lives in `services/<name>_service.py` with a singleton getter in `services/shared.py` (the authoritative singleton registry). `services/service.py` re-exports from `shared.py` for backwards compatibility.

### Core Services
- `UploadService` — Document ingestion pipeline (async, task-tracked)
- `QueryService` — Semantic search + RAG response
- `GenerateQuestionService` — AI question generation
- `LLMInsightsService` — Learning insights (chapter, subject, teacher class)
- `EducationAIAgent` — Teacher AI assistant (quiz/notes/paper/assignment/worksheet)
- `TopicSyncService` — Sync topics for chapters indexed in Qdrant but missing MongoDB entries

### Advanced AI Submodule (`services/ai/`)
Higher-level AI capabilities that are fully implemented in code but **not yet exposed via HTTP endpoints** (accessible only via Python imports):
- `orchestrator.py` — `AIOrchestrator` unified interface (`get_ai_orchestrator()`) combining all AI features
- `adaptive_questions.py` — `AdaptiveQuestionGenerator`, `QuizBuilder`
- `concept_graph.py` — `ConceptDependencyGraph`, `CurriculumBuilder`
- `multi_hop_rag.py` — `MultiHopRAG`, `ComparisonAnalyzer`
- `query_expansion.py` — `QueryExpander`, `MultiQueryGenerator`
- `semantic_chunking.py` — `SemanticChunker`, `ContextPreservingChunker`
- `socratic.py` — `SocraticQuestionGenerator`, `DiscussionGuide`

> **Note:** The `AIOrchestrator` and all `services/ai/` modules are implemented but require new API endpoints in `main.py` to be accessible from Backend. See `docs/INTEGRATION_PLAN*.md` for the proposed endpoint mappings (these are future work, not current state).

**Request lifecycle:**
```
FastAPI route → Pydantic schema validation → Service class → LLM/Database → Response
```

**Database clients:**
- `db/qdrant_db.py` — Qdrant vector database wrapper (collections, upsert, search)
- `db/mongo_db.py` — MongoDB client for structured data
- `db/redis_db.py` — Redis pub/sub and caching

**MongoDB collections accessed:**
- `chaptertopics` — Chapter-topic mappings
- `teacherstudents` — Teacher-student/class relationships
- `subjects` — Subject definitions
- `classes` — Class definitions

**LLM providers:** Provider factory in `services/llm_service.py` (`get_llm_service_class()`). Implementations in `llm/`: `llm_open_router.py`, `llm_gemini.py`, `llm_open_ai.py`, `llm_anthropic.py`. Select with `LLM_PROVIDER` env var.

**Embedding providers:** `utils/embedding.py` supports fallback chain via `EMBEDDING_PROVIDERS` env var. Providers: `ollama`, `external`, `openai`, `google`.

**Document processing:** `document/document_loader.py` — TXT, PDF, DOCX extraction

**Utilities:** `utils/embedding.py`, `utils/chunker.py`, `utils/topic_search.py`, `utils/prompt.py`, `utils/schema.py`

**Key processing pipeline:**
1. Upload → Extract text → Chunk (summary size, configurable) → LLM summarize → Extract topics
2. Re-chunk (search size, configurable) → Embed → Store in Qdrant
3. Query → Vector search → Context retrieval → LLM generate → Response

Chunking defaults (from `config.py`; actual `.env` values may differ):
- Summary chunk: `QDRANT_SUMMARY_CHUNK_SIZE=1000`
- Search chunk: `QDRANT_CHUNK_SIZE=512`, `QDRANT_CHUNK_OVERLAP=50`

**Async upload pattern:** Upload returns a `task_id` immediately. Status is polled via `GET /upload-status/{task_id}`. Background cleanup runs after completion.

**Startup / lifespan:** `main.py` uses a lifespan hook that warms Mongo + LLM on start. Qdrant, embeddings, and RAGSystem are lazy-loaded on first use. A keep-alive ping fires on the Render free tier to prevent cold starts.

## API Endpoints

### Health & Utility
| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Root info |
| `/ping` | GET | Health ping |
| `/health` | GET | Full health check |
| `/health/live` | GET | Liveness probe |
| `/health/ready` | GET | Readiness probe |
| `/metrics` | GET | Service metrics |
| `/upload-status/{task_id}` | GET | Async upload task status |

### Core (also available under `/v1/`)
| Endpoint | Method | Purpose |
|---|---|---|
| `/upload-document` | POST | Ingest chapter PDF |
| `/delete-document` | POST | Delete chapter vectors |
| `/search-document` | POST | RAG status / search |
| `/generate-questions` | POST | AI question generation |
| `/sync-chapter-topics` | POST | Sync Qdrant→MongoDB topic entries |

### AI Insights
| Endpoint | Method | Purpose |
|---|---|---|
| `/ai-insights/chapter` | GET | Student chapter insight |
| `/ai-insights/subject` | GET | Student subject insight |
| `/ai-insights/teacher/class` | GET | Teacher class-level insight |

### AI Agent (also available under `/v1/`)
| Endpoint | Method | Purpose |
|---|---|---|
| `/ai-agent` | POST | Teacher content generation |
| `/ai-agent/classes` | GET | Agent-accessible classes |
| `/ai-agent/tasks` | GET | Active agent task list |
| `/ai-agent/health` | GET | Agent health |

### Legacy Teacher Routes (`/v1/teacher/`)
| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/teacher/create-quiz` | POST | Legacy quiz creation |
| `/v1/teacher/classes` | GET | Legacy class list |

## Critical Rules (read before writing any code)

### 1. Shared Singletons — Memory Rule

This service runs on a 512 MB Render free tier. **Never instantiate heavy objects directly inside a service `__init__`.** Always accept them as optional params sourced from `services/shared.py`.

Heavy objects: `RAGSystem`, `Embedding`, `MongoDB`, `QdrantDB`, `LLMService`

```python
# ✅ CORRECT — accept injected deps
class MyService:
    def __init__(self, rag_service=None, mongo=None, llm_service=None):
        self.rag_service = rag_service or RAGSystem()
        self.mongo = mongo or MongoDB(...)
        ...

# services/shared.py — wire with shared instances (authoritative singletons here)
def get_my_service():
    global MY_SERVICE
    if not MY_SERVICE:
        MY_SERVICE = MyService(
            rag_service=get_rag_system(),
            mongo=get_mongo(),
            llm_service=get_llm_service(),
        )
    return MY_SERVICE
```

```python
# ❌ WRONG — creates duplicate Embedding/MongoDB/LLMService on every cold start
class MyService:
    def __init__(self):
        self.rag_service = RAGSystem()
        self.mongo = MongoDB(uri, db)
```

`services/shared.py` is the single source of truth — lazy singletons for `get_embedding()`, `get_mongo()`, `get_qdrant()`, `get_topic_search()`, `get_llm_service()`, `get_rag_system()`, `get_redis()`.

### 2. LLM Calls — Always Iterate the Generator

All LLM service methods return generators. Iterate with `for`:

```python
for event in self.llm_service.generate_summary(text, want_topics=True, is_final=True, response_schema=schema):
    response = event.get("response", {})
    summary = response.get("summary", "")
```

Use `ResponseSchema` + `JsonSchema` for all structured output (never parse raw strings):

```python
from utils.response_format import ResponseSchema, JsonSchema, SummaryResponse
schema = ResponseSchema(json_schema=JsonSchema(name="summary", schema=SummaryResponse.model_json_schema()))
```

### 3. Document Upload — Free Memory After Chunking

```python
storage_chunks = chunker.split_chunks(raw_text)
del raw_text  # free immediately; raw text + chunks must not coexist
```

## Cross-Repository Integration

This service is one of three AskAide AI repos. You can read files in sibling repos for context.

### Sibling Repositories

| Repo | Path | Key Integration |
|------|------|-----------------|
| **Backend** (Express) | `../Backend` | Calls AI Service for RAG, QG, insights |
| **Frontend** (React) | `../Frontend` | All AI proxied through Backend |
| **Shared Contracts** | `../shared-contracts` | TypeScript types + API defs + JSON Schema |

### Routes That Backend Calls On This Service

| This Endpoint | Called From Backend | When |
|---------------|-------------------|------|
| `POST /upload-document` | `content.service.js` (`AI_ENDPOINT`) | Chapter PDF upload |
| `POST /delete-document` | `content.service.js` (`AI_ENDPOINT`) | Chapter deletion |
| `POST /search-document` | `content.service.js` (`AI_ENDPOINT`) | RAG status check |
| `POST /generate-questions` | `questions.service.js` (`AI_QUESTION_REQ_URL`) | Question batch generation |
| `GET /ai-insights/chapter` | `topicProgress.controller.js` (`AI_ENDPOINT`) | Student chapter insight |
| `GET /ai-insights/subject` | `topicProgress.controller.js` (`AI_ENDPOINT`) | Student subject insight |
| `GET /ai-insights/teacher/class` | `topicProgress.controller.js` (`AI_ENDPOINT`) | Teacher class-level insight |

### Shared Data Models (for this service)

See `../shared-contracts/data-models.ts` sections:
- `AIQueryRequest`, `AIQueryResponse`
- `AIGenerateQuestionsRequest`, `AIGenerateQuestionsResponse`, `AIQuestionItem`
- `AIDocumentUploadRequest`, `AIDocumentUploadResponse`
- `AIDocumentDeleteResponse`, `AIDocumentSearchResponse`
- `AIInsightRequest`, `AIInsightResponse`
- `AIUploadStatusResponse`
- `AIAssistantRequest`, `AIAssistantResponse`, `AIAssistantClarification`
- `AITeacherClassInsightResponse`

### Cross-Repo Workflow

When making changes that affect backend integration:
1. Check `../Backend/src/modules/content/services/content.service.js` for upload/delete/search calls
2. Check `../Backend/src/modules/questions/services/questions.service.js` for `_callAIService()`
3. Check `../Backend/src/modules/progress/controllers/topicProgress.controller.js` for insights calls
4. Update shared contracts if changing request/response shapes

## Key env vars

### LLM Provider
`LLM_PROVIDER=openrouter` — options: `openai`, `gemini`, `anthropic`
API keys: `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`

### Embedding Provider Chain
`EMBEDDING_PROVIDERS=ollama,google` — comma-separated, tried with fallback. Free: `ollama`, `google`. Paid: `external`, `openai`.
`QDRANT_VECTOR_SIZE` — all embeddings auto-pad/truncate to this dim (default 384; typical deployed value 1024).
Config: `OLLAMA_BASE_URL`, `OLLAMA_EMBEDDING_MODEL`, `EMBEDDING_API_URL`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENAI_EMBEDDING_MODEL` (default: `text-embedding-3-small`)

### Qdrant
`QDRANT_HOST`, `QDRANT_PORT`, `QDRANT_API_KEY`, `QDRANT_PREFER_GRPC`, `QDRANT_COLLECTION_NAME`
`QDRANT_CHUNK_SIZE`, `QDRANT_CHUNK_OVERLAP`, `QDRANT_SUMMARY_CHUNK_SIZE`, `QDRANT_SUMMARY_CHUNK_OVERLAP`

### MongoDB
`MONGO_URI`, `MONGO_TOPIC_COLLECTION` (default: `chaptertopics`)

### Redis
`REDIS_HOST`, `REDIS_PORT`, `REDIS_DB`, `REDIS_USER`, `REDIS_PASSWORD`, `REDIS_CHANNEL` (default: `ai-service`)

### Other
`SELF_API_URL`, `BATCH_SIZE`, `MAX_WORKERS`, `DEBUG`
`LOG_LEVEL` — `DEBUG|INFO|WARNING|ERROR|CRITICAL` (default `INFO`; forced to `DEBUG` when `DEBUG=true`)

## Slash Commands (`.claude/commands/`)

Type these in Claude Code to load focused expert context:

| Command | When to use |
|---|---|
| `/memory-management` | Adding any new service or heavy object |
| `/rag-expert` | Working on ingestion, search, chunking, or embeddings |
| `/llm-patterns` | Working with LLM calls, providers, or response schemas |
| `/new-service` | Creating a new FastAPI service end-to-end |
| `/backend-integration` | Changing request/response shapes or adding endpoints |

## Agent Skills (`.agent/skills/`)

Detailed reference docs — read when you need deeper context:

| Skill | Topic |
|---|---|
| `memory-management` | Singleton rules, resource budget, del raw_text |
| `rag-system-expert` | Full RAG pipeline, Qdrant ops, topic deduplication |
| `fastapi-service-patterns` | Service layer, DI pattern, route patterns |
| `llm-provider-patterns` | Provider factory, ResponseSchema, generator pattern |
| `python-testing` | Pytest, DI-aware mocking, shared.py test patterns |
| `backend-integration` | AI ↔ Backend contract, error handling |
| `cross-service-integration` | Full three-repo data flow |
| `ai-service-improvement` | Improvement areas (note: Query Expansion, Semantic Chunking, Multi-hop RAG, and Adaptive Questions are already implemented in `services/ai/`) |
| `skill-creator` | How to create new skills |
