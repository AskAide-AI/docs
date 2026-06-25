# AI Service Architecture

## Entry Point

`main.py` → FastAPI app with lifespan keep-alive task. Warms MongoDB + LLM on start. Qdrant, embeddings, and RAGSystem are lazy-loaded on first use.

## Service Layer

Every capability lives in `services/` as a singleton service class. Instances are managed by `services/shared.py` (the authoritative singleton registry).

### Service Classes

| Service | File | Dependencies |
|---------|------|-------------|
| UploadService | `services/upload_service.py` | RAGSystem, MongoDB, QdrantDB |
| QueryService | `services/query_service.py` | RAGSystem, LLMService |
| GenerateQuestionService | `services/generate_question_service.py` | LLMService, MongoDB, QdrantDB |
| LLMInsightsService | `services/llm_insights.py` | MongoDB, LLMService |
| EducationAIAgent | `services/education_ai_agent.py` | LLMService, MongoDB |
| TopicSyncService | `services/topic_sync_service.py` | MongoDB, QdrantDB |

## Database Layer

| Client | File | Purpose |
|--------|------|---------|
| QdrantDB | `db/qdrant_db.py` | Vector storage (collections, upsert, search) |
| MongoDB | `db/mongo_db.py` | Structured data (chapters, topics) |
| Redis | `db/redis_db.py` | Pub/sub, caching |

## LLM Layer

Provider factory in `services/llm_service.py` (`get_llm_service_class()`). Implementations:

| Provider | File | Env Var |
|----------|------|---------|
| OpenRouter | `llm/llm_open_router.py` | `OPENROUTER_API_KEY` |
| Gemini | `llm/llm_gemini.py` | `GEMINI_API_KEY` |
| OpenAI | `llm/llm_open_ai.py` | `OPENAI_API_KEY` |
| Anthropic | `llm/llm_anthropic.py` | `ANTHROPIC_API_KEY` |

**Key rules:**
- All LLM methods return **generators** — iterate with `for`
- Use `ResponseSchema` + `JsonSchema` for all structured output
- Never parse raw strings

## Embedding Layer

`utils/embedding.py` supports fallback chain via `EMBEDDING_PROVIDERS` env var:
`ollama, external, openai, google` — tried left to right.

All embeddings auto-normalize to `QDRANT_VECTOR_SIZE` (default 1024, deployed 384).

## Processing Pipelines

### Document Upload
```
Upload → Extract text (TXT/PDF/DOCX)
  → Chunk (summary: 1000 words)
  → LLM summarize → Extract topics
  → Re-chunk (search: 512 words, overlap 50)
  → Embed → Store in Qdrant
  → Return { success, metadata, topics, summary }
```

### Question Generation
```
Topics from MongoDB → Filter Qdrant by topic
  → Sample chunks (QG_CANDIDATE_SAMPLE=12 from QG_CANDIDATE_POOL=200)
  → Build LLM context → Generate → Return questions
```

### RAG Query
```
Query → Embed → Vector search (Qdrant)
  → Context retrieval → LLM generate → Response
```

## Memory Management

The service runs on a 512 MB Render free tier:
- Lazy singletons via `services/shared.py` — never instantiate heavy objects in `__init__`
- `del raw_text` after chunking — raw text and chunks must not coexist
- Heavy objects: `RAGSystem`, `Embedding`, `MongoDB`, `QdrantDB`, `LLMService`
