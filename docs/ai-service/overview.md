# AI Service

**FastAPI + Python** — the AI backend powering RAG (Retrieval-Augmented Generation), semantic search, question generation, and learning insights for AskAide AI.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | FastAPI (Python) |
| Vector DB | Qdrant |
| Document DB | MongoDB |
| Cache / Pub-Sub | Redis |
| LLM Providers | OpenRouter, Gemini, OpenAI, Anthropic (one live at a time, switchable from /admin → AI System without a restart) |
| Embeddings | Ollama, Google, OpenAI, External (fallback chain) |

## Architecture

**Entry point:** `main.py` → FastAPI app with lifespan keep-alive

**Pattern:** Each capability is a service class in `services/`. LLM integrations in `llm/`, utilities in `utils/`, database clients in `db/`.

**Request lifecycle:**
```
FastAPI route → Pydantic validation → Service class → LLM/Database → Response
```

## Core Services

| Service | File | Purpose |
|---------|------|---------|
| UploadService | `services/upload_service.py` | Document ingestion pipeline (async, task-tracked) |
| QueryService | `services/query_service.py` | Semantic search + RAG response |
| GenerateQuestionService | `services/generate_question_service.py` | AI question generation |
| LLMInsightsService | `services/llm_insights.py` | Learning insights (chapter, subject, teacher) |
| EducationAIAgent | `services/education_ai_agent.py` | Teacher AI assistant (quiz/notes/papers) |
| TopicSyncService | `services/topic_sync_service.py` | Sync Qdrant→MongoDB topic entries |

### Advanced AI Submodule (`services/ai/`)
Implemented but not yet exposed via HTTP endpoints:
- `AIOrchestrator` — unified AI interface
- `AdaptiveQuestionGenerator` / `QuizBuilder` — adaptive assessments
- `ConceptDependencyGraph` / `CurriculumBuilder` — curriculum mapping
- `MultiHopRAG` / `ComparisonAnalyzer` — advanced reasoning
- `QueryExpander` / `MultiQueryGenerator` — query enhancement
- `SemanticChunker` / `ContextPreservingChunker` — smart chunking
- `SocraticQuestionGenerator` / `DiscussionGuide` — Socratic learning

## Processing Pipeline

### Document Upload → RAG
1. Upload PDF/TXT/DOCX → extract text
2. Chunk (summary size) → LLM summarize → extract topics
3. Re-chunk (search size) → embed → store in Qdrant
4. Query → vector search → context retrieval → LLM generate → response

### Question Generation
1. Fetch topics from MongoDB
2. Search Qdrant by topic filter
3. Build LLM context → generate questions
4. Return structured questions

## Critical Design Rules

- **Memory management**: Server runs on 512 MB RAM. Use lazy singletons from `services/shared.py`. Never instantiate heavy objects inside service `__init__`.
- **LLM calls**: All return generators — iterate with `for`. Use `ResponseSchema` + `JsonSchema` for structured output.
- **Document upload**: `del raw_text` immediately after chunking to free memory.

## API Endpoints

### Health & Utility
| Endpoint | Purpose |
|----------|---------|
| `/ping`, `/health`, `/health/live`, `/health/ready` | Health checks |
| `/metrics` | Service metrics |
| `/v1/upload-status/{task_id}` | Poll upload status |

### Core
| Endpoint | Purpose |
|----------|---------|
| `POST /v1/upload-document` | Ingest chapter PDF (async, returns task_id) |
| `POST /v1/delete-document` | Delete chapter vectors |
| `POST /v1/search-document` | RAG status check |
| `POST /search-documents/batch` | Batch check multiple chapters |
| `POST /v1/regenerate-topics` | Regenerate topics from Qdrant (async) |
| `POST /v1/generate-questions` | Question generation |
| `POST /v1/sync-chapter-topics` | Sync Qdrant→MongoDB topics |
| `POST /query` | RAG semantic search |

### AI Insights
| Endpoint | Purpose |
|----------|---------|
| `GET /v1/ai-insights/chapter` | Student chapter insight |
| `GET /v1/ai-insights/subject` | Student subject insight |
| `GET /v1/ai-insights/teacher/class` | Teacher class insight |

### AI Agent
| Endpoint | Purpose |
|----------|---------|
| `POST /v1/ai-agent` | Teacher content generation |
| `POST /v1/ai-agent/stream` | Teacher content generation (SSE streaming) |
| `POST /v1/ai-agent/modify` | Modify existing generation |
| `GET /v1/ai-agent/classes` | Agent-accessible classes |
| `GET /v1/ai-agent/chapters` | Chapters with topics and RAG status |
| `GET /v1/ai-agent/tasks` | Active agent tasks |
| `GET /v1/ai-agent/history` | Past generations |
| `GET /v1/ai-agent/generation/{id}` | Single generation by ID |
| `GET /v1/ai-agent/health` | Agent health |

### Conversations
| Endpoint | Purpose |
|----------|---------|
| `POST /conversations` | Create conversation |
| `GET /conversations` | List conversations |
| `GET /conversations/{id}/messages` | Get messages |
| `POST /conversations/{id}/messages` | Add message |
| `DELETE /conversations/{id}` | Delete conversation |

### Admin: live LLM switching
SuperAdmin-only, proxied by the Backend's `/api/v1/admin/system/llm/*` (the /admin **AI System** tab).

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/admin/llm/status` | Live provider/model, whether it came from the admin panel or env default, recent switches, which providers have a key |
| `POST /v1/admin/llm/test` | Plain / JSON / MCQ-schema checks on a model (empty body = live model); never changes anything |
| `POST /v1/admin/llm/active` | Re-run the checks; only if all pass, save and switch the live model instantly (no restart) |
| `POST /v1/admin/llm/reset` | Back to the env default (`LLM_PROVIDER`) |
| `GET /v1/admin/llm/models` | Live model listing per provider (cached 10 min, curated fallback) |
