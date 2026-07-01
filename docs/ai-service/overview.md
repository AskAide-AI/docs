# AI Service

**FastAPI + Python** — the AI backend powering RAG (Retrieval-Augmented Generation), semantic search, question generation, and learning insights for AskAide AI.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | FastAPI (Python) |
| Vector DB | Qdrant |
| Document DB | MongoDB |
| Cache / Pub-Sub | Redis |
| LLM Providers | OpenRouter, Gemini, OpenAI, Anthropic |
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
| `/upload-status/{task_id}` | Poll upload status |

### Core
| Endpoint | Purpose |
|----------|---------|
| `POST /upload-document` | Ingest chapter PDF (async, returns task_id) |
| `POST /delete-document` | Delete chapter vectors |
| `POST /search-document` | RAG status check |
| `POST /search-documents/batch` | Batch check multiple chapters |
| `POST /regenerate-topics` | Regenerate topics from Qdrant (async) |
| `POST /generate-questions` | Question generation |
| `POST /sync-chapter-topics` | Sync Qdrant→MongoDB topics |
| `POST /query` | RAG semantic search |

### AI Insights
| Endpoint | Purpose |
|----------|---------|
| `GET /ai-insights/chapter` | Student chapter insight |
| `GET /ai-insights/subject` | Student subject insight |
| `GET /ai-insights/teacher/class` | Teacher class insight |

### AI Agent
| Endpoint | Purpose |
|----------|---------|
| `POST /ai-agent` | Teacher content generation |
| `POST /ai-agent/stream` | Teacher content generation (SSE streaming) |
| `POST /ai-agent/modify` | Modify existing generation |
| `GET /ai-agent/classes` | Agent-accessible classes |
| `GET /ai-agent/chapters` | Chapters with topics and RAG status |
| `GET /ai-agent/tasks` | Active agent tasks |
| `GET /ai-agent/history` | Past generations |
| `GET /ai-agent/generation/{id}` | Single generation by ID |
| `GET /ai-agent/health` | Agent health |

### Conversations
| Endpoint | Purpose |
|----------|---------|
| `POST /conversations` | Create conversation |
| `GET /conversations` | List conversations |
| `GET /conversations/{id}/messages` | Get messages |
| `POST /conversations/{id}/messages` | Add message |
| `DELETE /conversations/{id}` | Delete conversation |
