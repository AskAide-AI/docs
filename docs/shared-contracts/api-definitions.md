# AskAide AI Platform — API Contracts

## Base URLs

| Environment | Backend (Express) | AI Service (FastAPI) |
|-------------|------------------|----------------------|
| **Local Development** | `http://localhost:4000/api/v1` | `http://localhost:8000` |
| **Production** | `https://askaideaibackend.onrender.com/api/v1` | `https://ai-service.askaide.ai` |

## Authentication

All protected endpoints require JWT token in **one** of:
- Cookie: `token=<jwt>`
- Header: `Authorization: Bearer <token>`
- Body: `{ token: "<jwt>" }`

### Role Guards

| Guard | Required `accountType` |
|-------|----------------------|
| `auth` (bare) | Any authenticated user |
| `isStudent` | `Student` |
| `isTeacher` | `Teacher` |
| `isPrincipal` | `Principal` |
| `isParent` | `Parent` |
| `isTeacherOrPrincipal` | `Teacher` or `Principal` |
| `isNormalUser` | `NormalUser` |

All role guards also allow `SuperAdmin`.

## Common Response Format

### Success
```json
{ "success": true, "message": "Success message", "data": { ... } }
```

### Error
```json
{ "success": false, "message": "Error message", "error": "..." }
```

### Validation Error
```json
{ "success": false, "message": "Validation failed", "error": { "errors": [{ "field": "name", "message": "Required" }] } }
```

## Authentication Methods

| Service | Method | Header |
|---------|--------|--------|
| **Backend** | JWT (Bearer token) | `Authorization: Bearer <jwt>` or Cookie `token=<jwt>` |
| **AI Service** | API Key | `x-api-key: <shared-secret>` |
| **AI Service** (skip) | Public | `/ping`, `/health`, `/health/live`, `/health/ready`, `/docs`, `/redoc` |

## Rate Limiting

| Scope | Limit |
|-------|-------|
| Backend Global | 100 req / 5 min per IP |
| Backend Login | 5 req / 15 min |
| Backend Signup | 3 req / hour |
| AI Service | 200 req / 60s per IP (skip: `/ping`, `/health`) |

---

## 1. Backend API Endpoints (Express + MongoDB)

### 1.1 Authentication (`/api/v1/authenticate`)

| Method | Path | Auth | Body / Notes |
|--------|------|------|-------------|
| POST | `/login` | loginLimiter | `{ userName, password }` → `{ user, tokens: { accessToken, refreshToken, expiresIn } }` |
| POST | `/signup` | registerLimiter | `{ name, email, password, role }` → `{ user, tokens }` |
| POST | `/google` | loginLimiter | `{ idToken }` (Google ID token) → `{ user, tokens }`. Verifies the token with Google, then **finds by googleId**, else **links by email**, else **auto-creates a `Student`**. Same response shape as `/login`. |
| POST | `/refresh` | none | `{ refreshToken }` → `{ tokens: { accessToken, refreshToken, expiresIn } }` |
| POST | `/logout` | none | `{ refreshToken }` → revokes token |
| POST | `/changepassword` | auth | `{ oldPassword, newPassword, confirmNewPassword }` — revokes all refresh tokens |
| POST | `/reset-password-token` | none | `{ email }` |
| POST | `/reset-password` | none | `{ token, password }` — revokes all refresh tokens |
| POST | `/verify-email` | none | `{ email, otp }` — OTP TTL: 5 min |

**Token model:**
- `accessToken`: short-lived JWT (2h expiry), sent as `Authorization: Bearer` header
- `refreshToken`: long-lived JWT (7d expiry), stored hashed in MongoDB, used only to get new access tokens
- Token rotation: each `/refresh` call invalidates the old refresh token and issues a new one
- Max 5 active refresh tokens per user (multi-device support)
- Password change/reset revokes all refresh tokens, forcing re-login on all devices

### 1.2 Profile (`/api/v1/profile`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/details` | auth | Current user profile |
| PUT | `/update` | auth | Update fields |
| DELETE | `/delete` | auth | Delete account |
| PUT | `/display-picture` | auth | Multipart upload |
| DELETE | `/display-picture` | auth | Remove photo |
| GET | `/public/:userId` | none | Public profile view |

### 1.3 Content - Classes (`/api/v1/classes`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/` | auth |

### 1.4 Content - Subjects (`/api/v1/subjects`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/` | auth |
| GET | `/class/:classId` | auth |

### 1.5 Content - Chapters (`/api/v1/chapters`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/` | auth, isTeacher | Create chapter |
| POST | `/create-with-pdf` | auth, isTeacher | Multipart: pdf + metadata — auto-triggers AI RAG upload |
| POST | `/check-rag-status` | auth | Body: `{ classId, subjectId, chapterIds }` — checks if AI has RAG data |
| GET | `/class/:classId/subject/:subjectId` | none | Chapters with topics |
| DELETE | `/` | auth, isTeacher | Body: `{ classId, subjectId, chapterIds }` — also calls AI delete-document |

### 1.6 Content - Topics (`/api/v1/topic`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/` | auth, isTeacher |
| GET | `/get-topics-by-chapter/:chapterId` | auth |
| POST | `/create-topic-mapping` | auth, isTeacher |

### 1.7 Study (`/api/v1/study`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/configuration` | none | Optional `?classIds=` |
| GET | `/filter` | auth | |

### 1.8 Questions (`/api/v1/questions`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/` | auth, isTeacher | Create question |
| GET | `/chapter/:chapterId` | auth | All questions for chapter |
| GET | `/chapter/:chapterId/type/:questionType` | auth | Filtered by type |
| GET | `/chapter/:chapterId/type/:questionType/difficulty/:difficulty` | auth | Filtered by type + difficulty |
| GET | `/batch/chapter/:chapterId/type/:questionType/difficulty/:difficulty/session/:sessionId` | auth | Batched — calls AI if not enough in DB; see response details below |
| GET | `/public-batch/chapter/:chapterId` | none | Public (Try Now) |

**Batch response** (`GET /batch/…`) — wrapped in standard `ApiResponse` envelope:
```json
{
  "success": true,
  "message": "Questions batch fetched successfully",
  "data": {
    "data": [ /* Question[] */ ],
    "status": "generating"   // "generating" | "failed" | "mastered"
  }
}
```

| `status` value | Meaning |
|-------|---------|
| `generating` | A job is in flight or will start; client should poll again (no blocking). |
| `failed` | The last generation attempt errored; client may retry with `?retry=true`. |
| `mastered` | The selection is content-complete (endless practice exhausted); terminal — celebrate and offer next chapter. |

### 1.9 Sessions (`/api/v1/sessions`)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/` | Create session |
| DELETE | `/` | Admin |
| GET | `/user/:userId` | All sessions |
| PATCH | `/:id/end` | End with score |
| GET | `/:id` | Get session |
| GET | `/last-incomplete/:userId` | Resume |

### 1.10 User Answers (`/api/v1/user-answers`)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/batch` | Submit all answers |
| GET | `/session/:sessionId` | Get answers |
| GET | `/user/:userId` | User's answers |

### 1.11 Topic Progress (`/api/v1/topic-progress`)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/progress/chapter/:chapterId` | `auth` | userId from JWT |
| GET | `/progress/subject/:subjectId` | `auth` | userId from JWT |
| GET | `/ai-insights/chapter/:chapterId` | `auth` | Proxies to AI Service `/ai-insights/chapter` |
| GET | `/ai-insights/subject/:subjectId` | `auth` | Proxies to AI Service `/ai-insights/subject` |
| GET | `/mastery-summary` | `auth` | userId from JWT |
| GET | `/teacher/class-insights` | `auth` + `isTeacher` | teacherId from JWT |

### 1.12 Progress Dashboard (`/api/v1/progress`)

| Method | Path |
|--------|------|
| GET | `/user/:userId` |

### 1.13 Streaks (`/api/v1/streaks`)

| Method | Path |
|--------|------|
| GET | `/:userId` |
| POST | `/:userId/use-freeze` |

### 1.14 Daily Challenge (`/api/v1/daily-challenge`)

| Method | Path |
|--------|------|
| GET | `/:userId` |
| POST | `/:userId/complete` |
| GET | `/:userId/history` |

### 1.15 Session Feedback (`/api/v1/session-feedback`)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/reaction` | `{ userId, sessionId, reaction, comment? }` |
| POST | `/nps` | NPS score (0-10) |
| GET | `/nps/check/:userId` | Check eligibility |
| GET | `/stats` | |
| GET | `/nps/stats` | |

### 1.16 Badges (`/api/v1/badges`)

| Method | Path |
|--------|------|
| GET | `/:userId` |
| POST | `/check` |

### 1.17 Quiz (`/api/v1/quiz`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/questions/search` | auth | Question bank search |
| GET | `/student/available` | auth | |
| GET | `/student/history` | auth | |
| POST | `/:quizId/start` | auth | |
| POST | `/attempt/:attemptId/answer` | auth | |
| POST | `/attempt/:attemptId/submit` | auth | |
| GET | `/attempt/:attemptId/result` | auth | |
| GET | `/teacher/:teacherId` | auth | |
| POST | `/` | auth | Create |
| GET | `/:quizId` | auth | |
| PUT | `/:quizId` | auth | |
| DELETE | `/:quizId` | auth | |
| POST | `/:quizId/publish` | auth | |
| POST | `/:quizId/close` | auth | |
| POST | `/:quizId/clone` | auth | |
| GET | `/:quizId/analytics` | auth | |
| POST | `/:quizId/questions` | auth | Add question |
| DELETE | `/:quizId/questions/:questionId` | auth | |
| PUT | `/:quizId/questions/reorder` | auth | |

### 1.18 Question Paper (`/api/v1/question-paper`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/` | auth |
| POST | `/public/generate` | none (lead magnet) |
| GET | `/history` | auth |
| GET | `/:paperId/preview` | auth |
| GET | `/:paperId/pdf` | auth |
| DELETE | `/:paperId` | auth |

### 1.19 Teacher (`/api/v1/teacher`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/` | auth, isPrincipal |
| GET | `/get-all` | auth, isPrincipal |

### 1.20 Teacher-Students (`/api/v1/teacher-students`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/bulk` | auth, isTeacherOrPrincipal |
| GET | `/` | auth, isTeacherOrPrincipal |

### 1.21 Teacher Dashboard (`/api/v1/teacher-dashboard`)

All require `auth, isTeacher` (applied at router level).

| Method | Path |
|--------|------|
| GET | `/:teacherId/my-assignments` |
| GET | `/:teacherId/subject/:subjectId/dashboard` |
| GET | `/:teacherId/subject/:subjectId/students` |
| GET | `/:teacherId/subject/:subjectId/chapter/:chapterId/analytics` |
| GET | `/:teacherId/student/:studentId/subject/:subjectId/progress` |
| GET | `/:teacherId/subject/:subjectId/weak-topics` |
| GET | `/:teacherId/subject/:subjectId/activity` |

### 1.22 School (`/api/v1/school`)

| Method | Path |
|--------|------|
| POST | `/` |
| GET | `/` |
| GET | `/:id` |
| PUT | `/:id` |

### 1.23 Sections (`/api/v1/sections`)

| Method | Path |
|--------|------|
| POST | `/` |
| POST | `/bulk` |
| GET | `/school/:schoolId` |
| GET | `/school/:schoolId/class/:classId` |
| GET | `/:sectionId` |
| PUT | `/:sectionId` |
| DELETE | `/:sectionId` |

### 1.24 Student (`/api/v1/student`)

| Method | Path |
|--------|------|
| POST | `/create` |
| GET | `/get-all` |

### 1.25 Other

| Module | Path | Endpoints |
|--------|------|-----------|
| Leaderboard | `/api/v1/leaderboard` | `GET /`, `GET /subject/:subjectId` |
| Feedback | `/api/v1/feedback` | `POST /` |
| API Logs | `/api/v1/logs` | `GET /`, `DELETE /`, `GET /stats` |
| Stats | `/api/v1/stats` | `GET /public` |
| Referral | `/api/v1/referral` | `GET /my-code` (auth), `POST /redeem/:code` (auth) |
| Goals | `/api/v1/goals` | `GET /` (auth), `PUT /` (auth) |

### 1.26 Health

| Method | Path |
|--------|------|
| GET | `/ping` |

### 1.27 AI Assistant (`/api/v1/ai-assistant`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/` | auth, isTeacher | Process AI agent request — returns `generationId` in response |
| POST | `/continue` | auth, isTeacher | Continue clarification session — returns `generationId` in response |
| GET | `/classes` | auth, isTeacher | Get teacher's accessible classes |
| GET | `/tasks` | auth, isTeacher | Get available AI tasks |
| GET | `/health` | auth, isTeacher | Check AI service health |
| GET | `/export/:generationId` | auth, isTeacher | Download generation content as PDF blob |

**Response envelope** (POST `/`, POST `/continue`):
```json
{
  "success": true,
  "message": "Content generated successfully",
  "data": {
    "needsClarification": false,
    "content": { "questions": [...], "paper": {...}, ... },
    "metadata": { "task_type": "quiz", "difficulty_used": "Medium", ... },
    "taskType": "quiz",
    "generationId": "abc123def456"
  }
}
```

---

## 2. AI Service Endpoints (FastAPI + Qdrant)

Base: `http://localhost:8000` (dev) / `https://ai-service.askaide.ai` (prod)
Auth: All endpoints require `x-api-key` header (except `/ping`, `/health`, `/health/live`, `/health/ready`, `/docs`, `/redoc`)

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| POST | `/upload-document` | Multipart: `file` + `class_id`, `chapter_id`, `subject_id` | `202` + `UploadStatusResponse` | Async — returns immediately; poll `/upload-status/{task_id}` for result |
| GET | `/upload-status/{task_id}` | Path param | `UploadStatusResponse` | Poll upload task status; `status` is `queued`, `processing`, `completed`, or `failed` |
| POST | `/delete-document` | `{ class_id, chapter_id, subject_id }` | `DocumentDeleteResponse` | Removes from Qdrant |
| POST | `/search-document` | `{ class_id, chapter_id, subject_id }` | `DocumentSearchResponse` | Check existence |
| POST | `/query` | `{ query, class_id, subject_id, chapter_ids, stream? }` | `QueryResponse` | RAG semantic search |
| POST | `/generate-questions` | `{ class_id, subject_id, chapter_id, topics, n, type, is_distinct?, difficulty? }` | `GenerateQuestionsResponse` | AI question gen |
| GET | `/ai-insights/chapter` | Query: `chapter_id`, `user_id` | `{ insight: string }` | Student progress analysis |
| GET | `/ai-insights/subject` | Query: `subject_id`, `user_id` | `{ insight: string }` | Subject-level analysis |
| POST | `/ai-agent` | `{ teacher_id, prompt, responses?, session_id?, class_id?, subject_id?, chapter_id? }` | `AgentResponse` (contains `generation_id`) | AI content generation (quiz, paper, notes, etc.) |
| POST | `/ai-agent/modify` | `{ teacher_id, generation_id, difficulty?, num_questions?, question_type?, sections?, duration_minutes? }` | `AgentResponse` | Modify existing generation — re-executes with merged params |
| GET | `/ai-agent/chapters` | Query: `teacher_id`, `subject_id?` | `{ chapters: [...] }` | Teacher's chapters with topics, RAG status, class/subject info |
| GET | `/ai-agent/classes` | Query: `teacher_id` | `{ classes: [] }` | Teacher's accessible classes |
| GET | `/ai-agent/tasks` | — | `{ tasks: [] }` | Available AI tasks |
| GET | `/ai-agent/history` | Query: `teacher_id`, `limit?`, `offset?` | `{ generations: [...] }` | Past generations, newest first |
| GET | `/ai-agent/generation/{generation_id}` | Path param | `{ generation: { ... } }` | Single generation by ID |
| GET | `/ai-agent/health` | — | `{ status: "healthy" }` | AI Agent health |
| GET | `/ai-insights/teacher/class` | Query: `class_id`, `teacher_id` | `AITeacherClassInsightResponse` | Teacher class-level analysis |
| GET | `/upload-status/{task_id}` | — | `AIUploadStatusResponse` | Async upload task status |
| POST | `/sync-chapter-topics` | `{ chapter_id }` | `{ synced: number }` | Sync Qdrant→MongoDB topics |
| GET | `/ping` | — | `{ status: "alive" }` | Health ping |
| GET | `/health` | — | `{ status: "healthy" }` | Full health check |
| GET | `/health/live` | — | `{ status: "alive" }` | Liveness probe |
| GET | `/health/ready` | — | `{ status: "ready" }` | Readiness probe |
| GET | `/metrics` | — | service metrics | Service metrics |

### AI Service Data Flow

```
Backend → POST /upload-document (multipart)
   → Parse document (PDF/TXT/DOCX)
   → Chunk → LLM summarize → Extract topics
   → Chunk (512 words) → Embed → Store in Qdrant
   → Return { success, metadata, topics, summary }

Backend → POST /generate-questions
   → Fetch topics from MongoDB
   → Search Qdrant by topic filter
   → Build LLM context → Generate questions
   → Return { questions[], count }

Backend → GET /ai-insights/{chapter,subject}
   → Fetch StudentTopicProgress from MongoDB
   → Aggregate by chapter/topic
   → LLM analyzes → Return insight string
```

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (no token / invalid token / wrong role) |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
| 504 | AI Service Timeout (> 600s) |

## Versioning

URL path: `/api/v1/`. Breaking changes → `/api/v2/`.

## Webhook Events

| Event | Trigger |
|-------|---------|
| `user.created` | Account registered |
| `user.updated` | Profile updated |
| `content.completed` | Chapter/lesson completed |
| `quiz.submitted` | Quiz attempt submitted |
| `document.processed` | AI RAG ingestion done |
