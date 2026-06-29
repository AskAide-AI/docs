# AI Service — Full Documentation

> **Last updated:** 2026-06-29  
> **Version:** 1.1.0 (FastAPI)

This document covers every part of the `ai-service`: what it does, how every file fits together, every API endpoint, every service class, the database layer, LLM/embedding providers, and critical operational rules.

---

## Table of Contents

1. [What This Service Does](#1-what-this-service-does)
2. [Where It Fits in AskAide AI](#2-where-it-fits-in-askaide-ai)
3. [Technology Stack](#3-technology-stack)
4. [File Structure](#4-file-structure)
5. [System Architecture](#5-system-architecture)
6. [Two Core Pipelines](#6-two-core-pipelines)
7. [API Endpoints (Complete Reference)](#7-api-endpoints-complete-reference)
8. [Services Layer](#8-services-layer)
9. [Database Clients](#9-database-clients)
10. [LLM Providers](#10-llm-providers)
11. [Embedding Providers](#11-embedding-providers)
12. [Singleton Pattern (Shared Resources)](#12-singleton-pattern-shared-resources)
13. [Memory Management Rules](#13-memory-management-rules)
14. [Environment Variables](#14-environment-variables)
15. [Local Development](#15-local-development)
16. [Data Models & Schemas](#16-data-models--schemas)

---

## 1. What This Service Does

The AI Service is a Python/FastAPI backend that powers all AI features in AskAide AI:

- **Document ingestion (RAG pipeline)** — Teachers upload chapter PDFs; the service extracts text, chunks it, summarizes it, embeds it, and stores it in Qdrant so students can query it later.
- **Semantic Q&A** — Students ask questions; the service finds the most relevant chunks from Qdrant and feeds them to an LLM to generate an answer.
- **Question generation** — Generates MCQ and subjective questions grounded in the actual uploaded chapter content.
- **Learning insights** — Analyzes student topic progress and generates personalized feedback using an LLM.
- **AI Agent** — A multi-mode teacher assistant that can create quizzes, exam papers, study notes, assignments, and worksheets from natural language prompts.

---

## 2. Where It Fits in AskAide AI

```
Browser
  └─▶ Frontend (React/Vite :5173)
        └─▶ Backend (Express :4000)
              └─▶ AI Service (FastAPI :8000)   ← this repo
```

**The Frontend never calls the AI Service directly.** Every AI request is proxied through the Backend. The Backend calls specific endpoints on the AI Service using two env vars:

```
AI_ENDPOINT=http://localhost:8000        (upload, delete, search, insights)
AI_QUESTION_REQ_URL=http://localhost:8000/generate-questions
```

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Language | Python 3.10+ |
| Framework | FastAPI + Uvicorn |
| Vector DB | Qdrant (cloud: eu-central-1 AWS) |
| Document DB | MongoDB Atlas |
| Cache / Pub-Sub | Redis Cloud |
| LLM | OpenRouter (default), Gemini, OpenAI, Anthropic |
| Embeddings | Google (gemini-embedding-001), OpenAI, Ollama, External API |
| Document parsing | pypdf, python-docx |
| Retries | tenacity |
| Config | pydantic-settings |

---

## 4. File Structure

```
ai-service/
├── main.py                          Entry point. All FastAPI routes + startup lifecycle.
├── config.py                        Pydantic Settings — all env vars with defaults.
├── logger.py                        Structured + plain logging helpers.
│
├── services/
│   ├── shared.py                    Lazy singletons — THE source of truth for shared objects.
│   ├── service.py                   Singleton getters for all service classes.
│   ├── rag.py                       RAGSystem — upload pipeline + search (core).
│   ├── upload_service.py            UploadService — wraps RAGSystem for HTTP layer.
│   ├── query_service.py             QueryService — RAG search + LLM answer generation.
│   ├── generate_question_service.py GenerateQuestionService — topic-based question generation.
│   ├── llm_insights.py              LLMInsightsService — student progress analysis.
│   ├── education_ai_agent.py        EducationAIAgent — multi-mode teacher assistant.
│   ├── topic_sync_service.py        TopicSyncService — backfill chaptertopics from Qdrant.
│   └── llm_service.py               LLM provider factory (get_llm_service_class).
│
├── llm/
│   ├── llm_open_router.py           OpenRouter API provider (default).
│   ├── llm_gemini.py                Google Gemini provider.
│   ├── llm_open_ai.py               OpenAI provider.
│   └── llm_anthropic.py             Anthropic/Claude provider.
│
├── db/
│   ├── qdrant_db.py                 QdrantDB wrapper — create collection, upsert, search, delete.
│   ├── mongo_db.py                  MongoDB client wrapper.
│   └── redis_db.py                  Redis client — pub/sub + key-value for session storage.
│
├── document/
│   └── document_loader.py           Extracts raw text from PDF, DOCX, TXT files.
│
├── utils/
│   ├── embedding.py                 Embedding class — fallback provider chain.
│   ├── chunker.py                   DocumentChunker — splits text into overlapping windows.
│   ├── topic_search.py              TopicSearch — semantic deduplication of topics.
│   ├── topic_embedder.py            TopicEmbedder — maps chunks to relevant topics.
│   ├── mongo_util.py                MongoDB query helpers (get_topics_mongo, etc.).
│   ├── prompt.py                    LLM prompt templates.
│   ├── schema.py                    Pydantic request/response schemas for API.
│   ├── response_format.py           ResponseSchema, JsonSchema, LLM output models.
│   ├── metrics.py                   Prometheus-style metrics collector.
│   └── thread_pool.py               ThreadPoolManager for parallel LLM/embed calls.
│
└── tests/                           Pytest test suite.
```

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       FastAPI (main.py)                      │
│   Routes → validate → call service → return response        │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼───────────────────┐
         ▼                 ▼                   ▼
   UploadService     QueryService        EducationAIAgent
   GenerateQuestion  LLMInsights         TopicSyncService
         │                 │                   │
         └────────────┬────┘                   │
                      ▼                        ▼
               RAGSystem (rag.py)        MongoDB + Redis
                      │
          ┌───────────┼────────────┐
          ▼           ▼            ▼
      QdrantDB    Embedding    LLMService
    (vector DB) (embed text)  (generate text)
```

**Dependency injection flow:** All heavy objects (QdrantDB, Embedding, LLMService, MongoDB) are created once in `services/shared.py` as lazy singletons and passed into service constructors via `services/service.py`.

**Thread safety:** All singleton getters (`get_embedding`, `get_mongo`, `get_qdrant`, `get_topic_search`, `get_llm_service`, `get_rag_system`, `get_redis`) use **double-checked locking** with `threading.Lock()` to prevent race conditions during lazy initialization on concurrent requests.

---

## 6. Two Core Pipelines

### Upload Pipeline

When a chapter PDF is uploaded, this is what happens step by step:

```
1. HTTP POST /upload-document
   ├─ Validate file extension (.pdf, .docx, .txt)
   ├─ Validate **magic bytes** — PDFs must start with `%PDF`, DOCX must start with `PK` (ZIP header)
   ├─ Validate file size (max 10 MB)
   ├─ Save file to /tmp/uploads/
   ├─ Return 202 immediately with task_id
   └─ Start background task

2. Background task (async, serialized by UPLOAD_SEMAPHORE)
   ├─ Check if chapter already indexed (search Qdrant by class_id + chapter_id + subject_id)
   │   └─ If yes → return existing metadata (is_reuploaded: true), skip re-ingestion
   │
   ├─ DocumentLoader.load_document() → extract raw text
   │
   ├─ Check if subject has existing topics in MongoDB chaptertopics
   │   ├─ Path A (topics exist): skip LLM topic generation, use existing topic embeddings
   │   └─ Path B (no topics): full LLM generation flow below
   │
   ├─ [Path B] Chunk raw_text into 1000-word windows (summary chunks)
   ├─ [Path B] For each chunk: LLM → { summary, topics[] }   (parallel via ThreadPool)
   ├─ [Path B] Combine all summaries → LLM final summary + 5–6 topic keys
   │           (recursive summarization if combined summaries > 12,000 chars)
   ├─ [Path B] TopicSearch.topics_exist_semantic() → deduplicate topics against MongoDB
   │
   ├─ del raw_text   ← free memory BEFORE creating storage chunks
   │
   ├─ Chunk document into 512-word windows (150-word overlap) — storage chunks
   ├─ For each batch of chunks:
   │   ├─ Embedding.embed(batch) → vectors
   │   ├─ TopicEmbedder.get_relevant_topics_batch() → which topics each chunk covers
   │   └─ QdrantDB.batch_upsert() → store vectors + payload
   │
   └─ Cleanup: del topic_keys_embeddings, gc.collect(), remove temp file

3. Client polls GET /upload-status/{task_id} until status = "completed" or "failed"
```

### Query Pipeline

When a student asks a question:

```
1. HTTP POST /query
   ├─ Receive: query text, class_id, subject_id, chapter_ids[]
   ├─ RAGSystem.search() → embed query → Qdrant filtered search (class_id + subject_id + chapter_ids)
   │                        returns top-5 matching chunks with payload
   ├─ Build context string from chunk text + summary + metadata
   ├─ LLMService.generate_rag_response(context) → { answer, sources[] }
   └─ Return { answer, sources }
```

---

## 7. API Endpoints (Complete Reference)

### Root Endpoints

#### `GET /`
Info page with documentation links.

#### `GET /ping`
Keep-alive endpoint. The service pings itself every 2 minutes to prevent Render free-tier sleep.  
**Response:** `{"status": "alive"}`

#### `GET /health`
Full health check — runs connectivity checks against all dependencies.  
**Response:** `{"status": "healthy"|"degraded", "version": "...", "checks": {...}}`

#### `GET /health/live`
Liveness probe (Kubernetes-style). Just checks if the app is running.  
**Response:** `{"status": "alive"}`

#### `GET /health/ready`
Readiness probe. Checks if the app can serve traffic.  
**Response:** `{"status": "ready"|"not_ready", "checks": {...}}`

#### `GET /metrics`
Prometheus-style metrics — request counts, latencies, etc.

---

### Document Management

#### `POST /upload-document`  ← also at `/v1/upload-document`
Upload a chapter document for RAG ingestion.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | file | yes | PDF, DOCX, or TXT. Max 10 MB. |
| `class_id` | string | yes | MongoDB class `_id` |
| `chapter_id` | string | yes | MongoDB chapter `_id` |
| `subject_id` | string | yes | MongoDB subject `_id` |

**Validation:**
- File extension must be `.pdf`, `.docx`, or `.txt`
- File size must not exceed 10 MB
- **Magic bytes** are validated: PDF files must start with `%PDF` bytes, DOCX files must start with `PK` (ZIP header). Invalid magic bytes return a 400 error and the temp file is cleaned up immediately.

**Response (202 Accepted):**
```json
{
  "task_id": "abc123...",
  "status": "queued"
}
```
Poll `/upload-status/{task_id}` for the result. Only one upload runs at a time (serialized by `UPLOAD_SEMAPHORE`).

---

#### `GET /upload-status/{task_id}`
Poll the status of a background upload.

**Response:**
```json
{
  "task_id": "abc123...",
  "status": "queued" | "completed" | "failed",
  "result": { ... },   // present when completed
  "error": "..."       // present when failed
}
```

When `status = "completed"`, `result` contains:
```json
{
  "success": true,
  "metadata": { "class_id": "...", "chapter_id": "...", "subject_id": "..." },
  "chunks_processed": 42,
  "topics_extracted": 6,
  "topic_keys": [{ "name": "Newton's Laws", "description": "..." }],
  "summary": "This chapter covers...",
  "summary_length": 312,
  "is_reuploaded": false
}
```
If `is_reuploaded: true`, the chapter was already in Qdrant and no re-ingestion happened.

Completed tasks are cleaned up automatically after 1 hour.

---

#### `POST /delete-document`
Remove all Qdrant vectors for a chapter.

**Request body:**
```json
{ "class_id": "...", "chapter_id": "...", "subject_id": "..." }
```

**Response:**
```json
{ "success": true, "metadata": {...}, "status": "deleted" }
```

---

#### `POST /search-document`
Check whether a chapter has already been indexed in Qdrant (used by Backend before deciding to upload).

**Request body:**
```json
{ "class_id": "...", "chapter_id": "...", "subject_id": "..." }
```

**Response:**
```json
{ "found": true, "metadata": {...}, "data": { ... first chunk payload ... } }
// or
{ "found": false }
```

---

### Query (RAG)

#### `POST /query`  ← also at `/v1/query`
Ask a question about uploaded chapter content.

**Request body:**
```json
{
  "query": "What is Newton's Second Law?",
  "class_id": "...",
  "subject_id": "...",
  "chapter_ids": ["...", "..."]
}
```

**Response:**
```json
{
  "answer": "Newton's Second Law states that...",
  "sources": [
    { "text": "...", "chapter_id": "...", "subject_id": "...", "score": 0.87 }
  ]
}
```

The service embeds the query, searches Qdrant with `class_id + subject_id + chapter_ids[]` filters, builds a context string, and feeds it to the LLM. Returns `answer: "No relevant documents found"` if no matching vectors exist.

**Error handling:** All 25+ endpoints now return **generic error messages** (e.g., `"Question generation failed"`, `"Internal server error"`) instead of leaking `str(e)` exception details. This is a security hardening measure — production error responses never expose internal exception text.

---

### Question Generation

#### `POST /generate-questions`  ← also at `/v1/generate-questions`
Generate MCQ or subjective questions from chapter content, grounded in RAG.

**Request body:**
```json
{
  "class_id": "...",
  "subject_id": "...",
  "chapter_id": "...",
  "topics": ["Newton's Laws", "Friction"],
  "n": 10,
  "type": "mcq",
  "is_distinct": false,
  "difficulty": "medium"
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `topics` | string[] | required | Topic names (matched to MongoDB `topics` collection) |
| `n` | int | 10 | Number of questions to generate (1–50) |
| `type` | string | `"mcq"` | `"mcq"` or `"subjective"` |
| `is_distinct` | bool | false | Ensure no duplicate question styles |
| `difficulty` | string | null | `"easy"`, `"medium"`, `"hard"`, or null |

**Validation:** All `_id` fields (`class_id`, `subject_id`, `chapter_id`) are validated against `OBJECTID_PATTERN = /^[0-9a-fA-F]{24}$/`. Invalid ObjectIds return 422 with field-level validation errors. `n` is clamped to 1–50.

**Response:**
```json
{
  "questions": [
    {
      "question": "What is the unit of force?",
      "options": ["Newton", "Joule", "Watt", "Pascal"],
      "correct_answer": "Newton",
      "explanation": "...",
      "topic_id": "..."
    }
  ],
  "count": 10
}
```

**How it works:**
1. Looks up topic documents in MongoDB `topics` collection by name.
2. Searches Qdrant for chunks that have those topic names in `relevant_topic_keys[].name` (nested filter).
3. Uses **context rotation** — `QG_CANDIDATE_POOL=200` chunks are fetched from across the entire chapter, then `QG_CANDIDATE_SAMPLE=12` are randomly subsampled per call. This ensures successive calls don't retread the same opening pages.
4. Builds context from sampled chunks.
5. Calls LLM to generate `n` questions of the requested type/difficulty.

**Calling convention:** This endpoint is called by the Backend's `_callAIService()`, which runs as a fire-and-forget background task. The Backend never blocks on this call — the student's session receives an immediate `generating` status. The Backend also handles **all deduplication** via `_dedupeNewQuestions()`, which compares normalized question text against existing docs before inserting. The AI service does not need to track what was previously generated.

**`difficulty` field note:** The value must be passed lowercase — `"easy"`, `"medium"`, or `"hard"`. The AI service passes it through to the LLM prompt as-is; the Backend stores it normalized.

---

### Learning Insights

#### `GET /ai-insights/subject?subject_id=...&user_id=...`
Generate AI-written feedback about a student's progress across a whole subject.

**Query params:** `subject_id` (MongoDB `_id`), `user_id` (MongoDB `_id`)

**Response:**
```json
{ "insight": "You've done well in Chapter 2 but Chapter 4 on Electricity needs more practice..." }
```

**How it works:** Fetches all `studenttopicprogresses` records for the student in that subject, resolves chapter/topic names from MongoDB, builds a structured prompt, and asks the LLM to write a personalized paragraph (~40–50 words).

---

#### `GET /ai-insights/chapter?chapter_id=...&user_id=...`
Generate AI-written feedback about a student's progress in a single chapter, including uncovered topics.

**Query params:** `chapter_id`, `user_id`

**Response:**
```json
{ "insight": "You've covered 3 topics well. You haven't started 'Magnetic Fields' yet — give it a try!" }
```

**How it works:** Fetches `chaptertopics` to know all expected topics, then `studenttopicprogresses` for the student, identifies covered vs uncovered topics, and generates a paragraph (~50 words).

---

### AI Agent

#### `POST /ai-agent`  ← also at `/v1/ai-agent`
The teacher AI assistant. Accepts natural language prompts and generates educational content.

**Request body:**
```json
{
  "teacher_id": "...",
  "prompt": "Create a quiz on Chapter 5 Newton's Laws",
  "responses": null,
  "session_id": null,
  "class_id": "...",
  "subject_id": "...",
  "chapter_id": "..."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `teacher_id` | string | yes | MongoDB teacher `_id` |
| `prompt` | string | yes | Natural language request |
| `responses` | object | no | Teacher's answers to clarification questions (see below) |
| `session_id` | string | no | Resume a clarification session |
| `class_id` | string | no | Narrow scope to a specific class |
| `subject_id` | string | no | Narrow scope to a specific subject |
| `chapter_id` | string | no | Narrow scope to a specific chapter |

**Response (content generated):**
```json
{
  "success": true,
  "needs_clarification": false,
  "generation_id": "abc123def456",
  "task_detected": "quiz",
  "topics_identified": ["Newton's Laws", "Friction"],
  "content": { ... generated quiz ... },
  "metadata": { "grounded": true, "chunks_used": 5 }
}
```

`generation_id` is a unique MongoDB ObjectId hex string. Use it to download PDFs (`/api/v1/ai-assistant/export/:generationId`), modify the generation (`/ai-agent/modify`), or retrieve it later (`/ai-agent/generation/{id}`).

**Response (clarification needed):**
```json
{
  "success": true,
  "needs_clarification": true,
  "session_id": "abc123",
  "ai_message": "I need a few details before I can create your quiz.",
  "clarification": {
    "questions": [
      { "id": "difficulty", "question": "What difficulty level?", "options": ["Easy", "Medium", "Hard"] }
    ]
  }
}
```

To resume after clarification, send the same request with `session_id` and `responses: { "difficulty": "Medium" }`.

**Supported task types:**

| Task | Keywords that trigger it |
|---|---|
| `quiz` | quiz, test, questions, mcq, objective |
| `paper` | paper, exam, examination, final, midterm |
| `assignment` | assignment, homework, hw, task |
| `notes` | notes, summary, summarize, study material |
| `worksheet` | worksheet, practice, exercise, drill |

**Chapter intelligence:** The agent can resolve chapter mentions like "Chapter 5" or "Ch 5" to the correct MongoDB chapter by its `order` field, via `find_best_chapter_match()`. If a chapter name is ambiguous, it returns "Did you mean...?" suggestions in the clarification flow.

**Question validation:** After generating, `_validate_and_fix_questions()` removes empty questions, deduplicates by text similarity (difflib > 0.85), pads MCQs to 4 options, fixes out-of-range `correct_option_index`, enforces minimum 10-char explanations, and normalizes difficulty.

**RAG grounding:** The agent searches Qdrant using teacher's allowed scopes (class_id + subject_id pairs from MongoDB `teacherstudents`). If embeddings are unavailable or no chapters are uploaded, it falls back to generating from LLM knowledge alone (`grounded: false`).

**Session storage:** Clarification sessions are stored in Redis with a 30-minute TTL (`agent_session:{session_id}`). Falls back to in-memory dict if Redis is unavailable.

---

#### `POST /ai-agent/modify`  ← also at `/v1/ai-agent/modify`
Modify a previously generated piece of content. Re-executes the original task with merged parameters.

**Request body:**
```json
{
  "teacher_id": "...",
  "generation_id": "abc123def456",
  "difficulty": "hard",
  "num_questions": 15,
  "question_type": "MCQ"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `teacher_id` | string | yes | MongoDB teacher `_id` |
| `generation_id` | string | yes | ID returned from original `/ai-agent` response |
| `difficulty` | string | no | `"easy"`, `"medium"`, or `"hard"` |
| `num_questions` | int | no | Number of questions |
| `question_type` | string | no | `"MCQ"`, `"True/False"`, `"Fill in Blank"`, `"Mixed"` |
| `sections` | int | no | Number of sections (paper only) |
| `duration_minutes` | int | no | Duration in minutes (paper only) |

**Response:** Same `AgentResponse` shape as `/ai-agent`, with a new `generation_id`. The modification is saved as a **new** generation record — the original is preserved.

---

#### `GET /ai-agent/chapters?teacher_id=...&subject_id=...`  ← also at `/v1/ai-agent/chapters`
Get chapters available to a teacher, optionally filtered by subject. Returns chapters with their associated topics, RAG content status, and class/subject display info.

**Response:**
```json
{
  "success": true,
  "chapters": [
    {
      "chapter_id": "...",
      "chapter_name": "Newton's Laws",
      "chapter_order": 5,
      "class_id": "...",
      "class_name": "9th",
      "subject_id": "...",
      "subject_name": "Physics",
      "topics": ["Laws of Motion", "Friction"],
      "has_rag_content": true
    }
  ]
}
```

---

#### `GET /ai-agent/history?teacher_id=...&limit=20&offset=0`  ← also at `/v1/ai-agent/history`
Retrieve past generations for a teacher, newest first. Paginated with `limit` (default 20) and `offset` (default 0).

**Response:**
```json
{
  "success": true,
  "generations": [
    {
      "generation_id": "...",
      "task_type": "quiz",
      "parameters": { "difficulty": "medium", "num_questions": 10 },
      "metadata": { "grounded": true },
      "created_at": "2026-06-10T12:00:00Z"
    }
  ]
}
```

---

#### `GET /ai-agent/generation/{generation_id}`  ← also at `/v1/ai-agent/generation/{generation_id}`
Retrieve a single generation by its ID, including full content. Returns 404 if not found.

**Response:**
```json
{
  "success": true,
  "generation": {
    "generation_id": "...",
    "teacher_id": "...",
    "task_type": "quiz",
    "parameters": { ... },
    "content": { ... full generated content ... },
    "metadata": { ... },
    "created_at": "2026-06-10T12:00:00Z"
  }
}
```

---

#### `GET /ai-agent/classes?teacher_id=...`
Returns the list of classes and subjects a teacher has access to (from MongoDB `teacherstudents`).

#### `GET /ai-agent/tasks`
Returns the list of task types the agent can perform (quiz, paper, notes, etc.).

#### `GET /ai-agent/health`
Health check for the agent service.

---

### Legacy / v1 Endpoints

| Endpoint | Description |
|---|---|
| `POST /v1/teacher/create-quiz` | Legacy quiz creation — internally delegates to EducationAIAgent |
| `GET /v1/teacher/classes` | Legacy teacher class list |

---

### Topic Sync

#### `POST /sync-chapter-topics`
Backfill MongoDB `chaptertopics` for a chapter that was already indexed in Qdrant but whose topics were never written to MongoDB (e.g., uploaded before topic sync was implemented).

**Request body:**
```json
{
  "chapter_id": "...",
  "class_id": "...",
  "subject_id": "...",
  "class_name": "9th"
}
```

Reads `relevant_topic_keys` from Qdrant chunk payloads and upserts them into the `topics` and `chaptertopics` MongoDB collections.

---

## 8. Services Layer

### `RAGSystem` (`services/rag.py`)

The core class that does both document ingestion and search. All other services depend on it.

**Constructor (injected deps):**
```python
RAGSystem(db=qdrant_db, embedding=embedding, topic_search=topic_search, llm_service=llm_service)
```

**Key methods:**

| Method | What it does |
|---|---|
| `add_document(file_path, metadata)` | Full ingestion pipeline — see Upload Pipeline section |
| `generate_summary_and_topics(raw_text)` | LLM-based summary + topic extraction with recursive chunking |
| `search(query, limit, filters)` | Simple vector search with optional payload filter |
| `search_scoped(query, scopes, chapter_ids, limit)` | Vector search scoped to teacher's allowed (class_id, subject_id) pairs — enforces OR(AND) access control |
| `search_by_filter(limit, filters)` | Retrieve chunks by exact payload match (no vector similarity) |
| `delete_document(metadata)` | Remove all chunks matching class_id + chapter_id + subject_id |
| `create_payload_index(fields)` | Create Qdrant payload indexes for fast filtering |

**`search_scoped` access control detail:**

A flat filter like `{class_id: [A, B], subject_id: [X, Y]}` would allow cross-pairing (class A + subject Y), potentially leaking content across teachers. `search_scoped` uses OR-of-ANDs instead:

```
(class_id=A AND subject_id=X) OR (class_id=B AND subject_id=Y)
```

This means a teacher only accesses content from their exact (class, subject) pairs, nothing else.

---

### `UploadService` (`services/upload_service.py`)

Thin wrapper over `RAGSystem` that handles the HTTP layer for uploads.

| Method | What it does |
|---|---|
| `upload_document(file_path, class_id, chapter_id, subject_id)` | Checks for existing document first; delegates to `rag_service.add_document()` |
| `delete_document(class_id, chapter_id, subject_id)` | Delegates to `rag_service.delete_document()` |
| `search_document(class_id, chapter_id, subject_id)` | Returns first matching chunk payload or `{found: false}` |
| `is_already_exists(...)` | Internal check via `search_by_filter(limit=1)` |

---

### `QueryService` (`services/query_service.py`)

Handles student Q&A requests.

| Method | What it does |
|---|---|
| `query(query, class_id, subject_id, chapter_ids)` | Embed query → search Qdrant → build context → LLM → return answer |
| `build_llm_context(query, context_chunks)` | Formats chunk payloads into a structured context string for the LLM |

Uses `rag_service.search()` (not `search_scoped`) because the Backend already enforces which chapters a student can query.

---

### `GenerateQuestionService` (`services/generate_question_service.py`)

Generates exam questions grounded in uploaded chapter content.

| Method | What it does |
|---|---|
| `generate_questions_for_topic_list(class_id, subject_id, chapter_id, topics, n, question_type, is_distinct, difficulty)` | Full pipeline — topic lookup → RAG search → LLM generation |
| `search_topics_rag(class_id, subject_id, chapter_id, topics, limit)` | Searches Qdrant with nested topic filter → returns candidate chunks |
| `_llm_generate_questions(context, question_type, n, is_distinct, difficulty)` | Calls LLM with `QuestionResponse` schema, returns list of question dicts |
| `build_llm_context(candidates)` | Formats RAG candidates into LLM prompt context |

**Topic matching:** Uses a Qdrant nested filter on `relevant_topic_keys[].name` to find chunks relevant to the requested topics. This means a topic must have been tagged to a chunk during ingestion.

---

### `LLMInsightsService` (`services/llm_insights.py`)

Generates personalized learning feedback.

| Method | What it does |
|---|---|
| `get_ai_insights_subject(subject_id, user_id)` | Fetches `studenttopicprogresses`, groups by chapter, formats progress data, calls LLM to write ~40–50 word paragraph |
| `get_ai_insights_chapter(chapter_id, user_id)` | Compares `chaptertopics` vs `studenttopicprogresses` to identify covered and uncovered topics, calls LLM for a ~50 word analysis |

**MongoDB collections queried:** `subjects`, `studenttopicprogresses`, `chapters`, `chaptertopics`, `topics`

---

### `EducationAIAgent` (`services/education_ai_agent.py`)

The main teacher-facing AI assistant.

**Task modes:**
- `quiz` — Multiple choice / true-false questions
- `paper` — Full exam with sections
- `assignment` — Homework problems
- `notes` — Study notes and summaries
- `worksheet` — Practice exercises

**`process()` flow:**
1. **Validate prompt actionability** — rejects non-educational requests.
2. **Detect task type** from keyword matching ("quiz" → quiz, "exam" → paper, etc.).
3. **Extract topics and chapter references** from the prompt via `_extract_chapter_number()` and `find_best_chapter_match()`.
   - "Chapter 5" resolves by MongoDB `order` field, not name alone.
   - Unknown chapter names trigger "Did you mean...?" suggestions.
4. **Check if clarification is needed** (ambiguous scope, missing difficulty, etc.)
   - If yes: save session state (Redis or in-memory), return `needs_clarification: true` + clarification questions (including chapter selection dropdown).
   - If no (or `responses` already provided): continue.
5. **Resolve chapter from clarification response** — calls `find_best_chapter_match()` with the teacher's answer.
6. **Get teacher's allowed scopes** from MongoDB `teacherstudents`.
7. `_search_rag_content()` → call `rag_service.search_scoped()` with teacher scopes.
   - Gracefully skips RAG if embeddings fail (returns `grounded: false`).
8. **Build LLM prompt** from RAG context + task requirements.
9. **Generate content** via LLM (`_create_quiz()`, `_create_paper()`, etc.).
10. **Validate generated questions** via `_validate_and_fix_questions()` — dedup, option padding, bounds, explanations.
11. **Save generation to MongoDB** (`agent_generations` collection) via `_save_generation()`.
12. **Delete session** if it existed.
13. **Return `AgentResponse`** with `generation_id`, content, and metadata.

**Key methods added in 2026-06:**

| Method | Purpose |
|--------|---------|
| `_validate_and_fix_questions()` | Deduplicates by text similarity (difflib > 0.85), pads MCQs to 4 options, fixes out-of-range `correct_option_index`, enforces minimum 10-char explanations, normalizes difficulty |
| `_save_generation()` | Persists the generation record to MongoDB `agent_generations` — stores teacher_id, task_type, parameters, content, metadata, and a unique `generation_id` |
| `modify_generation()` | Loads a previous generation by `generation_id`, merges new parameters (difficulty, num_questions, question_type, sections, duration_minutes), re-executes the task. Saves as a **new** record — original is preserved |
| `get_generations_history()` | Paginated query of `agent_generations` by teacher_id, newest first |
| `get_generation_by_id()` | Single generation lookup by `generation_id` |
| `find_best_chapter_match()` | Two-pass chapter resolution: word-overlap name matching first, then `order`-number fallback. Returns confidence score and suggestions on no match |
| `_extract_chapter_number()` | Static method — parses "Chapter 5", "Ch 5", "chapter five", "Unit 3", "Lesson 2" patterns via regex |
| `get_chapters_for_scope()` | Fetches chapters for a (class_id, subject_id) pair including topics, RAG status, and chapter order |
| `search_chapters_by_name()` | Fuzzy name search against MongoDB chapters collection |
| `get_chapters_with_topics()` | Aggregates chapters with their associated topics from `chaptertopics` |
| `_detect_list_chapters_intent()` | Matches prompts like "list my chapters", "show topics" — returns grouped chapter lists |

**Session keys in Redis:** `agent_session:{session_id}` with 30-minute TTL.

---

### `TopicSyncService` (`services/topic_sync_service.py`)

Utility service for backfilling MongoDB topic data from Qdrant.  
Reads `relevant_topic_keys` from chunk payloads → upserts into `topics` + `chaptertopics` collections.

---

## 9. Database Clients

### Qdrant (`db/qdrant_db.py`)

Single collection `"ai-service"` shared by all schools, classes, and subjects. Multi-tenancy is enforced via **payload filters**, not separate collections.

**Vector parameters:**
- Size: `QDRANT_VECTOR_SIZE` (default: 1024)
- Distance metric: Cosine

**Payload schema per stored chunk:**
```
text              string    The actual text chunk (512 words)
summary           string    Chapter-level summary (same for all chunks in a chapter)
relevant_topic_keys  array  [{ "name": "Newton's Laws", "description": "..." }]
class_id          string    MongoDB class _id
chapter_id        string    MongoDB chapter _id
subject_id        string    MongoDB subject _id
source_file       string    Original filename
index             int       Chunk index within the chapter
words_count       int       Word count of this chunk
sentence_count    int       Approximate sentence count
created_at        float     Unix timestamp
```

**Payload indexes** are created on: `class_id`, `chapter_id`, `subject_id`, `relevant_topic_keys[].name`

**Key methods:**
```python
create_collection(name)              # Idempotent — skips if exists
batch_upsert(collection, points)     # Upsert a list of PointStruct
search_by_text(collection, query, limit, filter_conditions)  # Embed + ANN search
search_by_filter(collection, filter_conditions, limit)       # Exact filter, no vector
delete_by_filter(collection, filter)                         # Delete matching points
create_payload_index(collection, field_name, field_schema)  # Add keyword index
```

The Qdrant client is cached via `@lru_cache` so only one connection is made regardless of how many `QdrantDB` instances exist. Transient errors are retried up to 3 times using `tenacity`.

---

### MongoDB (`db/mongo_db.py`)

Connection via `MONGO_URI` to Atlas cluster. Database: `MONGO_DB_NAME` (default: `"user"`).

**Collections used:**

| Collection | Used by | Purpose |
|---|---|---|
| `teacherstudents` | EducationAIAgent, QueryService | Teacher → (class_id, subject_id) scope mapping |
| `chapters` | EducationAIAgent, LLMInsightsService | Chapter name/order lookup |
| `subjects` | LLMInsightsService | Subject name lookup |
| `chaptertopics` | LLMInsightsService, TopicSync | Chapter → topic associations |
| `topics` | GenerateQuestionService, TopicSync | Topic title/description |
| `studenttopicprogresses` | LLMInsightsService | Student progress records |
| `agent_generations` | EducationAIAgent | Persistent generation history — stores teacher_id, task_type, parameters, content, metadata, created_at |

**Key methods:**
```python
get_collection(name)         # Returns pymongo Collection
```

---

### Redis (`db/redis_db.py`)

Used for two purposes:

1. **Agent session storage** (key-value): `agent_session:{session_id}` stores clarification state with 30-minute TTL.
2. **Pub/sub** (streaming): Publishes query streaming events on channel `REDIS_CHANNEL` (default: `"ai-service"`).

**Fallback:** If Redis is unavailable, the agent uses an in-memory dict (`AGENT_SESSIONS`) as a fallback. This means sessions survive within a process but are lost on restart.

**Check:** `EducationAIAgent._redis_ok()` checks `redis._available` before attempting Redis operations.

**Key methods:**
```python
set(key, value, expiry=None)    # Store a value (serialized as JSON)
get(key)                        # Retrieve a value
publish(message)                # Publish to the configured channel
```

---

## 10. LLM Providers

All LLM providers are in `llm/`. The active provider is selected by `LLM_PROVIDER` env var.

**Factory function:**
```python
from services.llm_service import get_llm_service_class
LLMClass = get_llm_service_class()   # returns the class, not an instance
llm = LLMClass()
```

| `LLM_PROVIDER` value | Class | Config vars |
|---|---|---|
| `openrouter` (default) | `OpenRouterLLM` | `OPENROUTER_API_KEY`, `OPEN_ROUTER_MODEL`, `OPEN_ROUTER_MAX_TOKENS`, `OPEN_ROUTER_TEMPERATURE` |

**OpenRouter health check:** The health check endpoint was changed from `self.base_url` (which points to `/chat/completions`) to `{base_url.rstrip('/chat/completions')}/models` — it now calls `https://openrouter.ai/api/v1/models` instead.
| `gemini` | `GeminiLLM` | `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_MAX_TOKENS`, `GEMINI_TEMPERATURE` |
| `openai` | `OpenAILLM` | `OPENAI_API_KEY`, `OPEN_AI_MODEL`, `OPEN_AI_MAX_TOKENS`, `OPEN_AI_TEMPERATURE` |
| `anthropic` | `AnthropicLLM` | `ANTHROPIC_API_KEY` |

**Critical rule — all LLM methods return generators:**

```python
# CORRECT
for event in llm_service.generate_summary(text, response_schema=schema):
    result = event.get("response", {})

# WRONG — this gets a generator object, not the result
result = llm_service.generate_summary(text)
```

**LLM service methods:**

| Method | Used by | Returns |
|---|---|---|
| `generate_summary(text, want_topics, is_final, response_schema)` | RAGSystem | `{ "response": { "summary": "...", "topics": [...] } }` |
| `generate_rag_response(query, stream, response_schema)` | QueryService | `{ "response": { "answer": "...", "sources": [...] } }` |
| `generate_questions(context, question_type, n, response_schema, is_distinct, difficulty)` | GenerateQuestionService | `{ "response": { "questions": [...] } }` |
| `get_response(system_prompt, user_prompt)` | LLMInsightsService, EducationAIAgent | `{ "response": "text..." }` |

**Structured output (ResponseSchema pattern):**

```python
from utils.response_format import ResponseSchema, JsonSchema, SummaryResponse

schema = ResponseSchema(
    json_schema=JsonSchema(
        name="summary",
        schema=SummaryResponse.model_json_schema()
    )
)
for event in llm.generate_summary(text, response_schema=schema):
    response = event.get("response", {})
    summary = response.get("summary", "")
    topics = response.get("topics", [])
```

Never parse raw LLM strings — always use `ResponseSchema` + a Pydantic model's `model_json_schema()`.

---

## 11. Embedding Providers

Defined in `utils/embedding.py`. A fallback chain is tried in order.

**Chain configuration** via `EMBEDDING_PROVIDERS` env var (comma-separated):
```
EMBEDDING_PROVIDERS=google,openai
```

| Provider name | Class | Config |
|---|---|---|
| `google` | `GoogleEmbeddingProvider` | `GEMINI_API_KEY`, `GOOGLE_EMBEDDING_MODEL` (default: `text-embedding-004`) |
| `openai` | `OpenAIEmbeddingProvider` | `OPENAI_API_KEY`, `OPENAI_EMBEDDING_MODEL` (default: `text-embedding-3-small`) |
| `ollama` | `OllamaProvider` | `OLLAMA_BASE_URL`, `OLLAMA_EMBEDDING_MODEL` |
| `external` | `ExternalApiProvider` | `EMBEDDING_API_URL` |

**Current production config:** `google,openai` with `GOOGLE_EMBEDDING_MODEL=gemini-embedding-001`

> **Important:** The Google provider uses the direct v1 REST API (`/v1/models/{model}:embedContent`), **not** the `google-generativeai` SDK (which defaults to v1beta and doesn't support newer models).

**Dimension normalization:** All vectors are auto-padded or truncated to `QDRANT_VECTOR_SIZE` (default: 1024). This means switching providers with different dimensions is safe as long as the Qdrant collection's vector size matches.

**Behavior:** Raises `RuntimeError` only if ALL providers in the chain fail. If the first provider fails, the next is tried automatically.

---

## 12. Singleton Pattern (Shared Resources)

`services/shared.py` is the **single source of truth** for all shared, expensive objects. Each getter is a lazy initializer — the object is only created on first call.

```python
from services.shared import (
    get_embedding,    # → Embedding instance
    get_mongo,        # → MongoDB instance
    get_qdrant,       # → QdrantDB instance (depends on get_embedding)
    get_topic_search, # → TopicSearch instance (depends on get_mongo, get_embedding)
    get_llm_service,  # → LLMService instance
    get_rag_system,   # → RAGSystem instance (depends on all above)
    get_redis,        # → RedisDB instance
)
```

**Startup behavior:** On app start (`lifespan`), only `get_mongo()` and `get_llm_service()` are warmed up. The heavier objects (Embedding, Qdrant, RAGSystem, TopicSearch) stay lazy — they initialize on the first actual request. This keeps the idle memory baseline low.

**Dependency wiring** in `services/service.py`:
```python
def get_upload_service():
    global _UPLOAD_SERVICE
    if not _UPLOAD_SERVICE:
        _UPLOAD_SERVICE = UploadService(rag_service=get_rag_system())
    return _UPLOAD_SERVICE
```

**Rule:** Never instantiate `Embedding`, `MongoDB`, `QdrantDB`, `RAGSystem`, or `LLMService` directly inside a service class `__init__`. Always accept them as optional constructor params and source from `shared.py` via `service.py`.

---

## 13. Memory Management Rules

This service runs on a **512 MB Render free tier**. Memory discipline is critical.

### Rule 1: Free raw text immediately after chunking

```python
# In RAGSystem.add_document():
raw_text = DocumentLoader.load_document(file_path)
# ... process into chunks ...
del raw_text   # ← REQUIRED before creating storage chunks
gc.collect()
```

Raw text + chunk list + embeddings must never coexist in memory. The `del raw_text` call before the storage chunking loop is mandatory.

### Rule 2: Serialize uploads

Only one upload runs at a time:
```python
UPLOAD_SEMAPHORE = asyncio.Semaphore(1)

async with UPLOAD_SEMAPHORE:
    result = await asyncio.to_thread(service.upload_document, ...)
```

This prevents two large PDFs from both loading into memory simultaneously.

### Rule 3: Stream-chunk large documents

The storage chunking loop never materializes the full chunk list. It uses `chunker.iter_chunks()` (a generator) and flushes batches to Qdrant incrementally:

```python
for chunk_text in chunker.iter_chunks(raw_text):
    batch_chunks.append(chunk_text)
    if len(batch_chunks) >= batch_size:
        _flush_batch(...)   # embed + upsert + clear
        batch_chunks = []
```

### Rule 4: Recursive summarization

If combined chunk summaries exceed 12,000 chars, they are summarized again recursively until they fit within the LLM context window.

---

## 14. Environment Variables

### Required (no defaults)
| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `QDRANT_HOST` | Qdrant cloud URL (e.g., `https://xxx.aws.cloud.qdrant.io`) |
| `QDRANT_API_KEY` | Qdrant API key |
| `REDIS_HOST` | Redis host |
| `REDIS_PASSWORD` | Redis password |

### LLM Provider
| Variable | Default | Description |
|---|---|---|
| `LLM_PROVIDER` | `openrouter` | `openrouter`, `gemini`, `openai`, `anthropic` |
| `OPENROUTER_API_KEY` | — | Required when `LLM_PROVIDER=openrouter` |
| `OPEN_ROUTER_MODEL` | `mistralai/ministral-8b-2512` | OpenRouter model |
| `OPEN_ROUTER_MAX_TOKENS` | `4096` | Max tokens |
| `OPEN_ROUTER_TEMPERATURE` | `0.2` | Temperature |
| `GEMINI_API_KEY` | — | Required when `LLM_PROVIDER=gemini` |
| `GEMINI_MODEL` | `gemini-2.0-flash-exp` | Gemini model |
| `OPENAI_API_KEY` | — | Required when `LLM_PROVIDER=openai` |
| `OPEN_AI_MODEL` | `gpt-3.5-turbo` | OpenAI model |
| `ANTHROPIC_API_KEY` | — | Required when `LLM_PROVIDER=anthropic` |

### Embedding
| Variable | Default | Description |
|---|---|---|
| `EMBEDDING_PROVIDERS` | `ollama,external` | Comma-separated fallback chain |
| `GOOGLE_EMBEDDING_MODEL` | `text-embedding-004` | Google model name |
| `GEMINI_API_KEY` | — | Used by Google embedding provider |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_EMBEDDING_MODEL` | `nomic-embed-text` | Ollama model |
| `EMBEDDING_API_URL` | — | External embedding API URL |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | OpenAI embedding model |

### Qdrant
| Variable | Default | Description |
|---|---|---|
| `QDRANT_COLLECTION_NAME` | `ai-service` | Collection name |
| `QDRANT_VECTOR_SIZE` | `1024` | Vector dimensions (must match embedding model output) |
| `QDRANT_PORT` | `6333` | HTTP port |
| `QDRANT_GRPC_PORT` | `6334` | gRPC port |
| `QDRANT_PREFER_GRPC` | `false` | Use gRPC transport |
| `QDRANT_CHUNK_SIZE` | `150` | Storage chunk size (words) |
| `QDRANT_CHUNK_OVERLAP` | `25` | Storage chunk overlap (words) |

### MongoDB
| Variable | Default | Description |
|---|---|---|
| `MONGO_DB_NAME` | `user` | Database name |
| `MONGO_TOPIC_COLLECTION` | `chaptertopics` | Collection for topic lookup during ingestion |

### Redis
| Variable | Default | Description |
|---|---|---|
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_USER` | `default` | Redis username |
| `REDIS_CHANNEL` | `ai-service` | Pub/sub channel name |

### Summary chunking
| Variable | Default | Description |
|---|---|---|
| `SUMMARY_CHUNK_SIZE` | `1000` | Words per chunk for LLM summarization |
| `SUMMARY_CHUNK_OVERLAP` | `0` | Overlap for summary chunks |

### Question Generation (Context Rotation)
| Variable | Default | Description |
|---|---|---|
| `QG_CANDIDATE_POOL` | `200` | Number of chapter chunks to fetch from Qdrant per generation call |
| `QG_CANDIDATE_SAMPLE` | `12` | Chunks randomly sampled from the pool and fed to the LLM |

### Other
| Variable | Default | Description |
|---|---|---|
| `SELF_API_URL` | — | This service's own URL (used for keep-alive ping) |

---

## 15. Local Development

### Start the service
```bash
cd ai-service
uvicorn main:app --reload --port 8000
```

Or via the root `start.ps1`:
```powershell
.\start.ps1 ai
```

### Useful commands
```bash
uvicorn main:app --reload --port 8000   # Dev server with auto-reload
python main.py                           # Alternative start
ruff check .                             # Lint
ruff format .                            # Format
pytest tests/ -v                         # Run tests
mypy . --ignore-missing-imports          # Type check
```

### Interactive docs
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Minimum viable .env for local dev

You need at minimum:
```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=...
EMBEDDING_PROVIDERS=google,openai
GEMINI_API_KEY=...
GOOGLE_EMBEDDING_MODEL=gemini-embedding-001
QDRANT_HOST=...
QDRANT_API_KEY=...
MONGO_URI=...
REDIS_HOST=...
REDIS_PASSWORD=...
```

Redis and Qdrant can use the cloud instances from `.env` — no local setup required.

---

## 16. Data Models & Schemas

Defined in `utils/schema.py` and `utils/response_format.py`.

### API Request/Response Schemas

```python
# Document operations
DocumentUploadRequest:     class_id, chapter_id, subject_id
DocumentUploadResponse:    success, metadata, chunks_processed, topics_extracted, topic_keys, summary, is_reuploaded
UploadStatusResponse:      task_id, status, result?, error?
DocumentDeleteResponse:    success, metadata, status
DocumentSearchResponse:    found, metadata?, data?

# Query
QueryRequest:              query, class_id, subject_id, chapter_ids[]
QueryResponse:             answer, sources[]

# Question generation
GenerateQuestionsRequest:  class_id, subject_id, chapter_id, topics[], n, type, is_distinct, difficulty
GenerateQuestionsResponse: questions[], count

# Topic sync
SyncChapterTopicsRequest:  chapter_id, class_id, subject_id, class_name
SyncChapterTopicsResponse: success, topics_synced, ...
```

### LLM Response Models (`utils/response_format.py`)

```python
SummaryResponse:     summary: str, topics: [{ name, description }]
RagQueryResponse:    answer: str, sources: [{ text, chapter_id, ... }]
QuestionResponse:    questions: [{ question, options, correct_answer, explanation, topic_id }]
```

### Agent Request/Response (defined inline in `main.py`)

```python
AgentRequest:   teacher_id, prompt, responses?, session_id?, class_id?, subject_id?, chapter_id?
AgentResponse:  success, needs_clarification, session_id?, generation_id?,
                ai_message?, task_detected?, topics_identified?,
                clarification?, content?, metadata?, error?
ModifyRequest:  teacher_id, generation_id, num_questions?, difficulty?,
                question_type?, sections?, duration_minutes?
```

**`generation_id`** is a MongoDB ObjectId hex string returned by every successful generation. It is the primary key for:
- `GET /ai-agent/generation/{id}` — single generation lookup
- `POST /ai-agent/modify` — modify existing generation
- `GET /api/v1/ai-assistant/export/:generationId` — download PDF (via Backend)

**Modification flow:** `POST /ai-agent/modify` loads the original generation, merges new parameters with originals, re-executes the task, and saves as a new record. The original is never overwritten.
