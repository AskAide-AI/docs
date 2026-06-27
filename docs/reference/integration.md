# Cross-Service Integration Guide — AskAide AI

This document covers how the three services (Frontend, Backend, AI Service) integrate, communicate, and maintain consistency across the AskAide AI platform.

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                     │
│                              (User)                                      │
└──────────────────────┬───────────────────────────────────────────────────┘
                       │ HTTP
                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 18 + Vite)                        │
│                           Port 5173                                      │
│                                                                          │
│  VITE_API_URL = http://localhost:4000/api/v1                             │
│                                                                          │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────────────┐  │
│  │  Chapter     │ │  Study       │ │  Progress  │ │  Teacher AI      │  │
│  │  Upload      │ │  Session     │ │  Pages     │ │  Generator       │  │
│  └─────────────┘ └──────────────┘ └────────────┘ └──────────────────┘  │
└──────────────────────┬───────────────────────────────────────────────────┘
                       │ HTTP (REST API)
                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Express.js)                              │
│                           Port 4000                                      │
│                                                                          │
│  AI_ENDPOINT = http://localhost:8000                                     │
│  AI_QUESTION_REQ_URL = http://localhost:8000/generate-questions          │
│                                                                          │
│  ┌────────────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────────┐  │
│  │  content/       │ │  questions/  │ │  progress/ │ │  ai-assistant/│  │
│  │  service.js     │ │  service.js  │ │  controller│ │  service.js   │  │
│  └───────┬────────┘ └──────┬───────┘ └──────┬─────┘ └──────┬────────┘  │
│          │                 │                │              │             │
│          │  ┌──────────────┴────────────────┴──────────────┘            │
│          │  │  fetch() — HTTP calls to AI Service                       │
│          ▼  ▼                                                           │
└──────────────────────┬───────────────────────────────────────────────────┘
                       │ HTTP (REST API)
                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        AI SERVICE (FastAPI)                               │
│                           Port 8000                                      │
│                                                                          │
│  ┌────────────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │  upload_service │ │  question_   │ │  llm_       │ │  ai_agent    │  │
│  │  _service.py    │ │  gen_service │ │  insights.py│ │  _service.py │  │
│  └───────┬────────┘ └──────┬───────┘ └──────┬──────┘ └──────┬───────┘  │
│          │                 │                │               │            │
│          │  ┌──────────────┴────────────────┴───────────────┘           │
│          │  │  LLM Providers (OpenRouter / Gemini / OpenAI / Anthropic) │
│          ▼  ▼                                                           │
└──────────────────────┬───────────────────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │  Qdrant  │ │  MongoDB │ │  Redis   │
    │ (Vectors)│ │ (Metadata│ │ (Cache/  │
    │          │ │  + Data) │ │  Sessions│
    └──────────┘ └──────────┘ └──────────┘
```

### Key Rules

- **Frontend NEVER calls AI Service directly.** All AI requests are proxied through Backend.
- Backend acts as the single gateway between the UI and AI capabilities.
- AI Service owns RAG, embeddings, LLM calls, and vector storage.
- Backend owns auth, business logic, and data persistence (MongoDB via Mongoose).

---

## 2. Cross-Service Integration Points

### 2.1 Complete Integration Map

| # | Backend File | AI Endpoint | Method | Purpose | Timeout |
|---|---|---|---|---|---|
| 1 | `src/modules/content/services/content.service.js` | `POST /upload-document` | POST (FormData) | Chapter PDF ingestion | 30s |
| 2 | `src/modules/content/services/content.service.js` | `POST /delete-document` | POST (JSON) | Chapter deletion | 30s |
| 3 | `src/modules/content/services/content.service.js` | `POST /search-document` | POST (JSON) | RAG status check | 30s |
| 4 | `src/modules/questions/services/questions.service.js` | `POST /generate-questions` | POST (JSON) | AI question generation | 600s |
| 5 | `src/modules/progress/controllers/topicProgress.controller.js` | `GET /ai-insights/chapter` | GET | Chapter learning insights | 30s |
| 6 | `src/modules/progress/controllers/topicProgress.controller.js` | `GET /ai-insights/subject` | GET | Subject learning insights | 30s |
| 7 | `src/modules/progress/controllers/topicProgress.controller.js` | `GET /ai-insights/teacher/class` | GET | Teacher class insights | 30s |
| 8 | `src/modules/ai-assistant/services/ai-assistant.service.js` | `POST /ai-agent` | POST (JSON) | Teacher AI content generation | 600s |
| 9 | `src/modules/ai-assistant/services/ai-assistant.service.js` | `GET /ai-agent/classes` | GET | Teacher accessible classes | 30s |
| 10 | `src/modules/ai-assistant/services/ai-assistant.service.js` | `GET /ai-agent/tasks` | GET | Available AI tasks | 30s |

---

## 3. Detailed Data Flow by Integration Point

### 3.1 Chapter PDF Upload Flow

```
Frontend (ChapterUpload.jsx)
  │
  ├─ 1. POST /api/v1/chapters/create-with-pdf
  │     Body: multipart FormData (file, chapter, class, subject)
  │
  ▼
Backend (content.service.js)
  │
  ├─ 2. Create Chapter doc in MongoDB
  ├─ 3. Upload PDF to Cloudinary
  ├─ 4. Call AI Service
  │     POST {AI_ENDPOINT}/upload-document
  │     Body: multipart FormData
  │       - file: Blob (PDF)
  │       - chapter_id: string
  │       - chapter_name: string
  │       - class_id: string
  │       - class_name: string
  │       - subject_id: string
  │       - subject_name: string
  │
  │     Response: 202 Accepted
  │       {
  │         "task_id": "abc-123",
  │         "status": "processing",
  │         "topic_keys": [
  │           { "name": "Topic A", "is_exist": false },
  │           { "name": "Topic B", "is_exist": true, "id": "existing_id" }
  │         ]
  │       }
  │
  ├─ 5. Process topic_keys → upsert topics in MongoDB
  ├─ 6. Return to Frontend with success + aiStatusMessage
  │
  ▼
AI Service (upload_service.py)
  │
  ├─ 7. Parse PDF (PyMuPDF / pdfplumber)
  ├─ 8. Chunk text (utils/chunker.py)
  ├─ 9. Generate embeddings (utils/embedding.py — fallback chain)
  ├─ 10. Store vectors in Qdrant
  ├─ 11. Store metadata in MongoDB
  │
  └─ (Async) Client can poll /upload-status/{task_id} for completion
```

**Backend request format:**
```javascript
// content.service.js lines 360-368
const formData = new FormData();
const blob = new Blob([file.buffer], { type: file.mimetype });
formData.append('file', blob, file.originalname);
formData.append('chapter_id', chapter._id.toString());
formData.append('chapter_name', chapter.name);
formData.append('class_id', classDoc._id.toString());
formData.append('class_name', classDoc.name);
formData.append('subject_id', subjectDoc._id.toString());
formData.append('subject_name', subjectDoc.name);

const response = await fetch(`${process.env.AI_ENDPOINT}/upload-document`, {
  method: 'POST',
  body: formData
});
```

**AI response handling:**
- If `aiResponseData.is_reuploaded` → skip topic processing
- If `aiResponseData.topic_keys` exists → upsert each topic into MongoDB via `_processTopicsFromAI()`
- AI call failure is **non-blocking** — the chapter is still created, just flagged with `aiStatusMessage`

---

### 3.2 Chapter Deletion Flow

```
Frontend
  │
  ├─ DELETE /api/v1/chapters/:classId/:subjectId
  │
  ▼
Backend (content.service.js)
  │
  ├─ 1. Validate chapters belong to class/subject
  ├─ 2. Call AI Service (parallel, one per chapter)
  │     POST {AI_ENDPOINT}/delete-document
  │     Body (JSON):
  │       {
  │         "class_id": "string",
  │         "subject_id": "string",
  │         "chapter_id": "string"
  │       }
  │
  ├─ 3. await Promise.allSettled(aiPromises)
  │     (AI deletion failure is non-blocking)
  │
  ├─ 4. Batch delete ChapterTopics mappings
  ├─ 5. Batch delete Chapter documents
  └─ 6. Return stats: { total, deleted, failed, errors }
```

---

### 3.3 RAG Status Check Flow

```
Frontend
  │
  ├─ POST /api/v1/chapters/rag-status
  │
  ▼
Backend (content.service.js)
  │
  ├─ For each chapterId:
  │     POST {AI_ENDPOINT}/search-document
  │     Body (JSON):
  │       {
  │         "class_id": "string",
  │         "subject_id": "string",
  │         "chapter_id": "string"
  │       }
  │
  │     Response (per chapter):
  │       {
  │         "chapter_id": "string",
  │         "rag_ready": true/false,
  │         "document_count": number
  │       }
  │
  └─ Aggregate and return results
```

---

### 3.4 AI Question Generation Flow

```
Frontend
  │
  ├─ POST /api/v1/questions
  │     Body: { chapterId, type, count, autoGenerate: true }
  │
  ▼
Backend (questions.service.js)
  │
  ├─ 1. Fetch chapter + topics from MongoDB
  ├─ 2. Build payload:
  │     POST {AI_QUESTION_REQ_URL}
  │     Body (JSON):
  │       {
  │         "class_id": "string",
  │         "subject_id": "string",
  │         "chapter_id": "string",
  │         "topics": ["topicId1", "topicId2"],
  │         "is_distinct": true,
  │         "n": 30,
  │         "type": "MCQ" | "SHORT_ANSWER" | "LONG_ANSWER"
  │       }
  │
  │     Response:
  │       {
  │         "questions": [
  │           {
  │             "text": "string",
  │             "type": "MCQ",
  │             "options": ["A", "B", "C", "D"],
  │             "correctAnswer": "string",
  │             "difficulty": "easy" | "medium" | "hard",
  │             "topic_id": "string",
  │             "marks": number
  │           }
  │         ]
  │       }
  │
  ├─ 3. Save generated questions to MongoDB
  ├─ 4. Return questions to Frontend
  │
  │ Uses AbortController with 600s (10 min) timeout
```

---

### 3.5 AI Insights Flow

```
Frontend (Progress pages)
  │
  ├─ GET /api/v1/topic-progress/ai-insights/chapter/:userId/:chapterId
  ├─ GET /api/v1/topic-progress/ai-insights/subject/:userId/:subjectId
  ├─ GET /api/v1/topic-progress/ai-insights/teacher/class?subjectId=...
  │
  ▼
Backend (topicProgress.controller.js)
  │
  ├─ GET {AI_ENDPOINT}/ai-insights/chapter?chapter_id=X&user_id=Y
  ├─ GET {AI_ENDPOINT}/ai-insights/subject?subject_id=X&user_id=Y
  ├─ GET {AI_ENDPOINT}/ai-insights/teacher/class?teacher_id=X&subject_id=Y
  │
  │ Response:
  │   {
  │     "strengths": ["..."],
  │     "weaknesses": ["..."],
  │     "recommendations": ["..."],
  │     "overall_mastery": 0.72
  │   }
  │
  └─ Backend passes AI response directly to Frontend
```

---

### 3.6 Teacher AI Assistant Flow

```
Frontend (TeacherAIGenerator.jsx)
  │
  ├─ POST /api/v1/ai-assistant
  │     Body: { prompt, sessionId?, responses?, scope: { classId, subjectId, chapterId } }
  │
  ▼
Backend (ai-assistant.service.js)
  │
  ├─ POST {AI_ENDPOINT}/ai-agent
  │     Body (JSON):
  │       {
  │         "teacher_id": "string",
  │         "prompt": "string",
  │         "responses": [...] | null,
  │         "session_id": "string" | null,
  │         "class_id": "string" | undefined,
  │         "subject_id": "string" | undefined,
  │         "chapter_id": "string" | undefined
  │       }
  │
  │     Response (clarification):
  │       {
  │         "needs_clarification": true,
  │         "session_id": "string",
  │         "ai_message": "string",
  │         "task_detected": "quiz" | "paper" | "notes" | "assignment" | "worksheet",
  │         "topics_identified": [...],
  │         "clarification": {
  │           "questions": [...]
  │         }
  │       }
  │
  │     Response (content):
  │       {
  │         "success": true,
  │         "content": "...",
  │         "metadata": { ... },
  │         "task_type": "quiz" | "paper" | "notes" | "assignment" | "worksheet"
  │       }
  │
  ├─ Multi-turn: Frontend sends sessionId + responses to continue
  ├─ Session stored in Redis with 30-minute TTL
  ├─ Uses AbortController with 600s (10 min) timeout
  └─ Returns parsed content (quiz questions, paper, notes, etc.)
```

**Additional AI Agent endpoints:**

```javascript
// Get teacher's accessible classes
GET {AI_ENDPOINT}/ai-agent/classes?teacher_id=XXX
Response: { "classes": [{ "id": "...", "name": "..." }] }

// Get available AI task types
GET {AI_ENDPOINT}/ai-agent/tasks
Response: { "tasks": ["quiz", "paper", "notes", "assignment", "worksheet"] }
```

---

### 3.7 Flows WITHOUT AI Service

These flows are entirely Backend-frontend with no AI involvement:

| Flow | Description |
|---|---|
| Study Session | Frontend → Backend (POST /sessions, GET /questions/batch, POST /user-answers/batch, PATCH /sessions/:id/end) |
| Quiz Flow | Full quiz CRUD + attempt lifecycle — Backend only |
| Question Paper | Backend generates PDF via Puppeteer — no AI service |
| Auth (JWT) | Login, register, token refresh — Backend only |
| User Management | Profile CRUD, role assignment — Backend only |

---

## 4. Request/Response Formats

### 4.1 Common Response Envelope (Backend)

All Backend endpoints return:
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

### 4.2 Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

### 4.3 AI Service Error

```json
{
  "detail": "Error message from AI service"
}
```

---

## 5. Error Handling Across Services

### 5.1 Error Propagation Model

```
AI Service (500/502/504)
  │
  ▼
Backend catches:
  │  ├─ AI_TIMEOUT (AbortError after 600s) → throws AppError 504
  │  ├─ AI_SERVICE_ERROR (non-200 response) → throws AppError 502
  │  ├─ AI_ERROR (network/fetch failure) → throws AppError 500
  │  └─ AI_NOT_CONFIGURED (missing env var) → throws AppError 503
  │
  ▼
Frontend receives Backend's error response
  │  └─ Displays user-friendly error message
```

### 5.2 Non-Blocking AI Failures

Some flows tolerate AI failures gracefully:

| Flow | Behavior on AI failure |
|---|---|
| Chapter PDF Upload | Chapter created in MongoDB; `aiStatusMessage` set to "but AI service is unavailable"; topics not processed |
| Chapter Deletion | `Promise.allSettled` — AI deletion failure logged but does not block MongoDB cleanup |
| RAG Status Check | Individual chapter failures logged; results returned for remaining chapters |

### 5.3 Blocking AI Failures

These flows fail the entire operation if AI is unavailable:

| Flow | Error behavior |
|---|---|
| AI Question Generation | Throws `QuestionsError` 502/504 to Frontend |
| AI Insights | Throws error to Frontend |
| Teacher AI Assistant | Throws `AIAssistantError` 502/503/504 to Frontend |

### 5.4 Custom Error Classes

```javascript
// Backend: src/shared/middleware/errorHandler.js
class AppError extends Error {
  constructor(message, statusCode, code) { ... }
}

// Backend: src/modules/ai-assistant/services/ai-assistant.service.js
class AIAssistantError extends AppError {
  constructor(message, statusCode = 500, code = 'AI_ASSISTANT_ERROR') { ... }
}

// Backend: src/modules/questions/services/questions.service.js
class QuestionsError extends AppError {
  constructor(message, statusCode, code) { ... }
}

// Backend: src/modules/content/services/content.service.js
class ContentError extends AppError {
  constructor(message, statusCode, code) { ... }
}
```

---

## 6. Timeout and Retry Policies

### 6.1 Timeout Configuration

| Endpoint | Timeout | Implementation |
|---|---|---|
| `/upload-document` | 30s | Default `fetch()` timeout |
| `/delete-document` | 30s | Default `fetch()` timeout |
| `/search-document` | 30s | Default `fetch()` timeout |
| `/generate-questions` | 600s (10 min) | `AbortController` with `setTimeout` |
| `/ai-insights/*` | 30s | Default `fetch()` timeout |
| `/ai-agent` | 600s (10 min) | `AbortController` with `setTimeout` |
| `/ai-agent/classes` | 30s | Default `fetch()` timeout |
| `/ai-agent/tasks` | 30s | Default `fetch()` timeout |

### 6.2 Timeout Implementation Pattern

```javascript
// Used in questions.service.js and ai-assistant.service.js
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  // handle response
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    throw new AppError('AI request timed out', 504, 'AI_TIMEOUT');
  }
  throw error;
}
```

### 6.3 Retry Policy

- **No automatic retries** are implemented at the Backend level.
- AI Service failures are logged and reported to Frontend as-is.
- Frontend may implement user-initiated retry (e.g., "Retry" button on error states).
- For batch operations (e.g., chapter deletion), `Promise.allSettled` ensures partial failures don't block the entire batch.

---

## 7. Data Consistency Patterns

### 7.1 Ownership Boundaries

| Data | Owner | Access Pattern |
|---|---|---|
| Users, Auth, JWT | Backend (MongoDB) | Direct Mongoose CRUD |
| Chapters, Classes, Subjects | Backend (MongoDB) | Direct Mongoose CRUD |
| Study Sessions, Progress | Backend (MongoDB) | Direct Mongoose CRUD |
| Questions | Backend (MongoDB) | AI generates → Backend stores |
| Document Embeddings | AI Service (Qdrant) | AI creates/deletes on Backend request |
| Document Metadata | AI Service (MongoDB) | AI creates on upload |
| Topics (extracted) | Backend (MongoDB) | Upserted from AI response `topic_keys` |
| AI Session State | AI Service (Redis) | 30-min TTL, teacher assistant only |
| LLM Insights | AI Service (computed) | Real-time generation, not persisted |

### 7.2 Consistency Strategies

**Eventual Consistency (Upload → Process):**
1. Backend creates Chapter in MongoDB immediately
2. PDF sent to AI Service for async processing
3. AI returns `task_id`; client polls `/upload-status/{task_id}`
4. Embeddings become available in Qdrant after processing completes
5. Topics extracted and upserted from AI response `topic_keys`

**Dual-Write Pattern (Delete):**
1. Backend calls AI Service to delete vectors from Qdrant
2. Backend deletes Chapter + ChapterTopics from MongoDB
3. Uses `Promise.allSettled` — AI deletion failure does not prevent MongoDB cleanup

**Real-Time Generation (Insights):**
- AI Service computes insights from student progress data passed by Backend
- Response is ephemeral — not stored in any database
- Frontend displays directly from API response

---

## 8. Shared Contracts Usage Guide

When a change affects the request/response shape crossing the Backend ↔ AI Service boundary:

### 8.1 Contract Files

| File | Purpose |
|---|---|
| `shared-contracts/api-definitions.md` | Endpoint documentation (URLs, methods, parameters) |
| `shared-contracts/data-models.ts` | TypeScript interfaces for request/response shapes |
| `shared-contracts/data-models.schema.json` | JSON Schema mirror of the TypeScript types |

### 8.2 Workflow for Contract Changes

1. **Design** the new/modified endpoint shape
2. **Update** `shared-contracts/api-definitions.md` with endpoint docs
3. **Update** `shared-contracts/data-models.ts` with TypeScript types
4. **Update** `shared-contracts/data-models.schema.json` to mirror types
5. **Implement** in AI Service (FastAPI + Pydantic)
6. **Implement** in Backend (Express + fetch)
7. **Verify** both sides match the contract

### 8.3 Example: Adding a New Cross-Service Endpoint

```typescript
// shared-contracts/data-models.ts
export interface NewAIRequest {
  chapter_id: string;
  user_id: string;
  options?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    count?: number;
  };
}

export interface NewAIResponse {
  success: boolean;
  data: {
    items: Array<{
      id: string;
      text: string;
      score: number;
    }>;
  };
  metadata: {
    generated_at: string;
    model_used: string;
  };
}
```

```markdown
<!-- shared-contracts/api-definitions.md -->
## POST /new-ai-endpoint

**Purpose:** Description of what this endpoint does.

**Request Body:** `NewAIRequest`
**Response:** `NewAIResponse`
**Timeout:** 30s
**Errors:** 400 (validation), 502 (AI service error), 504 (timeout)
```

---

## 9. How to Add a New Cross-Service Feature

### Step-by-Step Guide

1. **Define the feature scope**
   - Which flows involve AI? Which are Backend-only?
   - Does Frontend need new UI components?

2. **Design the API contract**
   - Request/response shapes in `shared-contracts/data-models.ts`
   - Endpoint definition in `shared-contracts/api-definitions.md`

3. **Implement AI Service endpoint** (`ai-service/`)
   - Add Pydantic models in `utils/schema.py`
   - Add route in `main.py`
   - Add service logic in `services/`
   - Test with `pytest`

4. **Implement Backend integration** (`Backend/`)
   - Create/update module (controller + service)
   - Add route in module's `routes/`
   - Wire into `routes/v1/index.js`
   - Use `fetch()` with `AI_ENDPOINT` to call AI Service
   - Add error handling with appropriate `AppError` subclass
   - Test with `npm test`

5. **Implement Frontend UI** (`frontend/`)
   - Create/update components
   - Add API calls via `VITE_API_URL`
   - Handle loading, error, and success states
   - Test manually

6. **Update environment variables** if needed
   - Backend: add to `.env` if new env var introduced
   - AI Service: add to `.env` if new env var introduced
   - Document in all relevant `CLAUDE.md` files

7. **Cross-check**
   - Verify request/response shapes match between Backend and AI Service
   - Verify error handling covers all failure modes
   - Verify timeout is appropriate for the operation

---

## 10. Debugging Integration Issues

### 10.1 Common Issues and Solutions

| Symptom | Likely Cause | Solution |
|---|---|---|
| `AI_NOT_CONFIGURED` error | Missing `AI_ENDPOINT` in Backend `.env` | Add `AI_ENDPOINT=http://localhost:8000` to Backend `.env` |
| `AI_TIMEOUT` (504) | AI Service took > 600s | Check AI Service logs; increase timeout if needed |
| `AI_SERVICE_ERROR` (502) | AI Service returned non-200 | Check AI Service logs for exception |
| Chapter upload succeeds but no embeddings | AI processing failed silently | Check AI Service logs; poll `/upload-status/{task_id}` |
| `fetch failed` network error | AI Service not running or wrong port | Verify AI Service is running on port 8000; check firewall |
| Topics not extracted from AI response | `topic_keys` missing or `is_reuploaded: true` | Check AI Service response; verify PDF parsing |
| AI Agent returns empty content | Session expired (30-min Redis TTL) | Frontend should handle session expiry gracefully |
| Questions not generated | `AI_QUESTION_REQ_URL` misconfigured | Verify env var points to `http://localhost:8000/generate-questions` |

### 10.2 Debugging Tools

**Check AI Service health:**
```bash
curl http://localhost:8000/health
# or
curl http://localhost:8000/ai-agent/health
```

**Check Backend → AI connectivity:**
```bash
# From Backend directory
node -e "fetch(process.env.AI_ENDPOINT + '/health').then(r => r.json()).then(console.log).catch(console.error)"
```

**Check environment variables:**
```bash
# Backend
grep AI_ENDPOINT Backend/.env

# AI Service
grep -E "LLM_PROVIDER|EMBEDDING_PROVIDERS|QDRANT_URL" ai-service/.env
```

### 10.3 Log Locations

| Service | Log Location | What to Look For |
|---|---|---|
| Backend | Console (Winston logger) | `[AI Endpoint called successfully]`, `[Error calling AI endpoint]`, `[AI agent request timed out]` |
| AI Service | Console (uvicorn logs) | Request/response logs, exceptions, LLM provider errors |
| Frontend | Browser DevTools Network tab | Request payloads, response bodies, status codes |

### 10.4 Testing Integration Endpoints

```bash
# Upload a chapter PDF
curl -X POST http://localhost:4000/api/v1/chapters/create-with-pdf \
  -F "file=@test.pdf" \
  -F "chapter={\"name\":\"Test Chapter\",\"classId\":\"...\",\"subjectId\":\"...\"}"

# Generate questions
curl -X POST http://localhost:4000/api/v1/questions \
  -H "Content-Type: application/json" \
  -d '{"chapterId":"...","type":"MCQ","count":10,"autoGenerate":true}'

# Get chapter insights
curl http://localhost:4000/api/v1/topic-progress/ai-insights/chapter/USER_ID/CHAPTER_ID

# Teacher AI assistant
curl -X POST http://localhost:4000/api/v1/ai-assistant \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Generate a quiz on photosynthesis","scope":{"classId":"...","subjectId":"..."}}'
```

---

## 11. Service Health Checks

### 11.1 Backend Health

```bash
curl http://localhost:4000/ping
# Response: { "status": "ok" }
```

### 11.2 AI Service Health

```bash
curl http://localhost:8000/health
# or
curl http://localhost:8000/ai-agent/health
```

### 11.3 Backend → AI Service Health Check

```javascript
// ai-assistant.service.js — checkHealth()
async checkHealth() {
  const res = await fetch(`${aiEndpoint}/ai-agent/health`, { timeout: 5000 });
  return await res.json();
}
```

### 11.4 Full Stack Health Check Script

```bash
#!/bin/bash
echo "=== Frontend ==="
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:5173/ || echo "DOWN"

echo -e "\n=== Backend ==="
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:4000/ping || echo "DOWN"

echo -e "\n=== AI Service ==="
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:8000/health || echo "DOWN"

echo -e "\n=== Qdrant ==="
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:6333/collections || echo "DOWN"

echo -e "\n=== MongoDB ==="
mongosh --eval "db.runCommand({ping:1})" --quiet || echo "DOWN"
```

---

## 12. Environment Variables Reference

### Backend (`.env`)

```env
PORT=4000
DATABASE_URL=mongodb://...
JWT_SECRET=...
AI_ENDPOINT=http://localhost:8000
AI_QUESTION_REQ_URL=http://localhost:8000/generate-questions
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:4000/api/v1
```

### AI Service (`.env`)

```env
LLM_PROVIDER=openrouter          # openrouter | gemini | openai | anthropic
EMBEDDING_PROVIDERS=ollama,google # comma-separated fallback chain
QDRANT_HOST=localhost
QDRANT_PORT=6333
MONGO_URI=mongodb://...
REDIS_HOST=localhost
REDIS_PORT=6379
```
