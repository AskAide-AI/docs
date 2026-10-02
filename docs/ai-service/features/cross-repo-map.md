# AskAide AI — Cross-Repository Map

This document maps all three AskAide AI repositories, their locations, architecture, and integration points.
Use this file to understand how changes in one repo affect the others.

---

## Repository Locations

| Repo | Language | Path | Port |
|------|----------|------|------|
| **Frontend** | React 18 + Vite + Redux | `D:\AskAide AI\Frontend` | 5173 (Vite dev) |
| **Backend** | Express.js + MongoDB (Mongoose) | `D:\AskAide AI\Backend` | 4000 |
| **AI Service** | Python FastAPI + Qdrant + MongoDB | `D:\AskAide AI\ai-service` | 8000 |
| **Shared Contracts** | TypeScript + JSON Schema | `D:\AskAide AI\shared-contracts` | — |

---

## Architecture Overview

```
User's Browser
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React 18 + Vite)                                 │
│  Port: 5173 (dev) / 3000 (prod preview)                     │
│  Path: D:\AskAide AI\Frontend                               │
│                                                              │
│  Key files:                                                 │
│    src/api/axios.js          — Axios instance               │
│    src/api/endpoints.js      — All endpoint constants       │
│    src/api/*.api.js          — Per-feature API functions    │
│    src/store/slices/         — Redux state slices           │
│    src/components/           — UI components                │
│                                                              │
│  Env: VITE_API_URL = http://localhost:4000/api/v1           │
└────────────────────┬────────────────────────────────────────┘
                     │  REST API calls
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (Express.js + MongoDB)                              │
│  Port: 4000                                                  │
│  Path: D:\AskAide AI\Backend                                 │
│                                                              │
│  Key files:                                                 │
│    index.js                  — Entry point                  │
│    config/server.config.js   — PORT, DB_URL                 │
│    routes/v1/index.js        — Route aggregator             │
│    src/modules/<name>/       — Per-feature modules          │
│    src/shared/utils/         — sendSuccess, AppError, etc.  │
│    src/shared/middleware/    — auth, role guards, validate  │
│                                                              │
│  Env:                                                        │
│    PORT = 4000                                               │
│    AI_ENDPOINT = http://localhost:8000                       │
│    AI_SERVICE_API_KEY = <shared secret, sent as x-api-key>   │
└───────────┬──────────────────────────────────────┬──────────┘
            │  HTTP calls to AI Service             │  MongoDB
            ▼                                       ▼
┌──────────────────────────────┐          ┌──────────────────┐
│  AI Service (FastAPI)        │          │  MongoDB Atlas   │
│  Port: 8000                  │          │                  │
│  Path: D:\AskAide AI\ai-service          │  Database:       │
│                              │          │  study_platform  │
│  Key files:                  │          │  ai_service      │
│    main.py                   │          └──────────────────┘
│    services/                 │
│      rag.py                  │
│      upload_service.py       │
│      query_service.py        │
│      generate_question_service.py │
│      llm_insights.py         │
│      llm_service.py          │
│      active_llm.py           │  ← live switchable LLM
│    db/                       │
│      qdrant_db.py            │
│      mongo_db.py             │
│      redis_db.py             │
│    utils/schema.py           │  ← Pydantic models
│                              │
│  Env: SELF_API_URL = http://localhost:8000  │
│       LLM_PROVIDER = openrouter            │
└──────────────────────────────┘
```

---

## Integration Points

### Frontend → Backend (REST API)

- **Base URL:** `VITE_API_URL` (default: `http://localhost:4000/api/v1`)
- **Auth:** JWT stored in `localStorage('token')`, injected via Axios interceptor
- **Response envelope:** `{ success: boolean, message: string, data: T }`
- **All AI features** are proxied through the backend — frontend never calls AI Service directly

### Backend → AI Service

| Backend Endpoint | AI Service Endpoint | Method | Purpose |
|-----------------|---------------------|--------|---------|
| `POST /chapters/create-with-pdf` | `POST /v1/upload-document` | FormData (file + metadata) | Upload PDF for RAG |
| `DELETE /chapters` | `POST /v1/delete-document` | JSON `{ class_id, subject_id, chapter_id }` | Delete from RAG |
| `POST /chapters/check-rag-status` | `POST /v1/search-document` | JSON | Check RAG existence |
| `POST /questions/batch/:chapterId/...` | — | Calls AI when DB has insufficient questions | Internal _callAIService() |
| `GET /topic-progress/ai-insights/:userId/subject/:subjectId` | `GET /v1/ai-insights/subject` | Query params | AI learning insights |
| `GET /topic-progress/ai-insights/:userId/chapter/:chapterId` | `GET /v1/ai-insights/chapter` | Query params | AI learning insights |
| `POST /api/v1/ai-assistant` | `POST /v1/ai-agent` | JSON | AI content generation — returns `generation_id` |
| `POST /api/v1/ai-assistant/continue` | `POST /v1/ai-agent` | JSON (with `session_id`) | Continue clarification session |
| `GET /api/v1/ai-assistant/export/:generationId` | `GET /v1/ai-agent/generation/{generationId}` (lookup) + backend generates PDF | — | PDF export via Puppeteer |
| — (called from backend controller) | `POST /v1/ai-agent/modify` | JSON | Modify existing generation |
| — (called from backend controller) | `GET /v1/ai-agent/history` | Query params | Generation history |
| — (called from backend controller) | `GET /v1/ai-agent/generation/{id}` | Path param | Single generation lookup |
| `GET /api/v1/admin/system/llm/status`, `GET .../models` (`llmSystem.service.js`) | `GET /v1/admin/llm/status`, `GET /v1/admin/llm/models` | Query params (`freeOnly` → `free_only`) | SuperAdmin AI System tab: live LLM, model suggestions |
| `POST /api/v1/admin/system/llm/test`, `/active`, `/reset` (`llmSystem.service.js`) | `POST /v1/admin/llm/test`, `/active`, `/reset` | JSON; admin email sent as `requested_by` | Test a model; switch the live LLM instantly; back to env default. 400/409/503/504 passed through, not mapped to 502 |

**Key cross-repo contract:** The AI Service returns `generation_id` in every successful `/v1/ai-agent` response. The Backend forwards this as `generationId` to the Frontend. The Frontend uses it to display a "Download PDF" button and (in future) a "Modify" button.

### AI Service `_callAIService()` (Questions Service)

The question generation AI call is built from the `AI_ENDPOINT` base URL:
- Payload: `{ class_id, subject_id, chapter_id, topics, is_distinct, n, type, difficulty }`
- Endpoint: `POST {AI_ENDPOINT}/v1/generate-questions` (default base: `http://localhost:8000`)
- Timeout: 240 seconds (4 min) — `AI_REQUEST_TIMEOUT_MS = 4 * 60 * 1000`
- **Non-blocking:** The Backend calls this via `_startBackgroundGeneration()` which never `await`s the result — the request returns immediately, and the AI call runs fire-and-forget in the background.
- **Deduplication is the Backend's responsibility:** The AI service returns all generated questions; the Backend's `_dedupeNewQuestions()` compares normalized text against existing docs before inserting, so the AI service doesn't need to track what was already generated.

---

## Shared Data Flow Patterns

### Document Upload Pipeline
```
Frontend (multipart upload)
  → Backend POST /chapters/create-with-pdf
    → Backend saves chapter to MongoDB
    → Backend POSTs file + metadata to AI Service /v1/upload-document
      → AI Service extracts text → chunks → summarizes → extracts topics
      → AI Service embeds chunks → stores in Qdrant
      → AI Service returns { topics, summary }
    → Backend auto-creates Topic + ChapterTopics from AI's topic_keys
    → Backend returns chapter to Frontend
```

### Question Generation Pipeline

The Backend uses a **non-blocking status endpoint** pattern — it never blocks on the AI call:

```
Student drains question pool in session
  → Backend _handleNoQuestions() — status endpoint, never awaits AI
    ├─ If job exists & status=processing → return { status: "generating" }
    ├─ If job exists & status=failed → return { status: "failed" }
    ├─ If chapter tapped out (contentComplete) → return { status: "mastered" }
    └─ Else → atomically claim job → launch _startBackgroundGeneration()
                → return { status: "generating" }

Background (_startBackgroundGeneration → _generateQuestionsBackground)
  → Backend POSTs to AI Service /v1/generate-questions  (fire-and-forget)
    → AI Service fetches topics from MongoDB
    → AI Service searches Qdrant by topic filter
      → **Context rotation:** `QG_CANDIDATE_POOL=200` chunks sampled from
        whole chapter; `QG_CANDIDATE_SAMPLE=12` randomly selected per call.
        Without this, regeneration only rewords the first few pages.
    → AI Service builds context → LLM generates questions
    → AI Service returns questions[]
  → Backend _dedupeNewQuestions() — compares normalized text before insert
  → Backend evaluates yield: if new docs < MIN_NEW_PER_RUN, increment lowYieldStreak;
    if lowYieldStreak >= LOW_YIELD_LIMIT or totalCount >= HARD_CAP, set contentComplete=true
  → Backend saves to MongoDB + updates QuestionGenerationJob
```

**Client-polled status values:**
| Value | Meaning |
|-------|---------|
| `generating` | Job in flight — keep polling |
| `failed` | Last attempt errored — client may retry |
| `mastered` | Chapter tapped out (contentComplete) — terminal, celebrate |

### AI Insights Pipeline
```
Frontend requests insights
  → Backend GET /topic-progress/ai-insights/userid/:userId/chapter/:chapterId
    → Backend proxies to AI Service GET /v1/ai-insights/chapter?chapter_id=...&user_id=...
      → AI Service fetches StudentTopicProgress from MongoDB
      → AI Service aggregates by topic, identifies gaps
      → AI Service calls LLM for analysis (~50 words)
      → AI Service returns insight string
    → Backend returns { insight } to Frontend
```

---

## Environment Variable Mapping

| Frontend | Backend | AI Service | Description |
|----------|---------|------------|-------------|
| `VITE_API_URL` | `PORT` | — | Backend: service port / Frontend: backend URL |
| — | `DATABASE_URL` | `MONGO_URI` | MongoDB connection |
| — | `JWT_SECRET` | — | JWT signing key |
| — | `AI_ENDPOINT` | `SELF_API_URL` | AI Service base URL |
| — | `AI_SERVICE_API_KEY` | `AI_SERVICE_API_KEY` | Shared secret sent as `x-api-key`; must match on both sides |
| — | — | `QDRANT_HOST` | Qdrant vector DB host |
| — | — | `REDIS_HOST` | Redis cache host |
| — | — | `LLM_PROVIDER` | Default LLM provider (overridable live from /admin → AI System) |
| — | — | `LLM_TEST_TIMEOUT`, `LLM_SETTINGS_SCOPE` | Admin model-check cap (s); optional scope of the saved LLM choice |
| — | — | `EMBEDDING_PROVIDERS` | Embedding fallback chain |

---

## When Making Changes

1. **Frontend changes** → Check if `src/api/endpoints.js` and `src/api/*.api.js` match backend routes in `D:\AskAide AI\Backend\routes\v1\`
2. **Backend changes** → Update `D:\AskAide AI\shared-contracts\api-definitions.md` AND the corresponding frontend API wrapper
3. **AI Service changes** → Update `D:\AskAide AI\shared-contracts\data-models.ts` (AI schemas section) AND verify backend calls match. If adding a MongoDB collection, add it to both `DOCUMENTATION.md` (MongoDB collections table) and `CROSS_REPO_MAP.md`
4. **Shared Contracts changes** → Must update JSON Schema AND all three repos' implementations
5. **Adding AI Agent endpoint** → Must add to `education_ai_agent.py` method, `main.py` route, `shared-contracts/api-definitions.md`, `DOCUMENTATION.md`, and the Backend's ai-assistant module
