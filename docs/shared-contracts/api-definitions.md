# AskAide AI Platform — API Contracts

:::info Internal contract reference
This document is the **cross-repo contract** (request/response shapes, base URLs, auth) used by developers wiring Backend ↔ AI Service. For the full, browsable endpoint catalog, see the canonical [API Reference](/docs/reference/api-reference).
:::

## Base URLs

| Environment | Backend (Express) | AI Service (FastAPI) |
|-------------|------------------|----------------------|
| **Local Development** | `http://localhost:4000/api/v1` | `http://localhost:8000/v1` |
| **Production** | `https://askaideaibackend.onrender.com/api/v1` | `https://ai-service.askaide.ai/v1` |

AI Service health/ops probes (`/ping`, `/health*`, `/metrics`) sit at the host root, outside `/v1`.

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

Ownership guards:

| Guard | Behaviour |
|-------|-----------|
| `isSelfOrSuperAdmin(param)` | `req.params[param]` must be the caller's own id, or the caller a `SuperAdmin`; otherwise `403 { code: "NOT_YOUR_DATA" }`. Used on `/teacher-dashboard/:teacherId` and the progress routes keyed by `/:userId` |
| `principalSchoolScope` | After `isPrincipal`: limits a principal to their own school (`req.schoolScope`); `SuperAdmin` has no limit; a principal with no school gets `403 { code: "NO_SCHOOL" }` |

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
| Backend Global | 500 req / 5 min per IP (skip: `/api-docs`, `/ping`, localhost) |
| Backend Login (`/login`, `/google`) | 10 req / 15 min |
| Backend Signup | 10 req / hour |
| Backend Password reset (`/reset-password-token`, `/reset-password`) | 5 req / 15 min |
| Backend Email change (`/profile/email/*`) | 10 req / 15 min |
| Backend Public challenge view (`GET /challenges/:code`) and class join info (`GET /teacher-classes/join/:code`) | 120 req / 10 min each |
| Backend Public challenge play (`POST /challenges/:code/attempts`) | 20 req / 10 min |
| AI Service | 200 req / 60s per IP (skip: `/ping`, `/health`) |

---

## 1. Backend API Endpoints (Express + MongoDB)

### 1.1 Authentication (`/api/v1/authenticate`)

| Method | Path | Auth | Body / Notes |
|--------|------|------|-------------|
| POST | `/login` | loginLimiter | `{ userName, password }` → `{ user, tokens: { accessToken, refreshToken, expiresIn } }` |
| POST | `/signup` | registerLimiter | `{ userName, name, email, password, confirmPassword, accountType?: 'Student' \| 'Teacher', contactNumber?, referralCode?, acquisition?: UserAcquisition }` → `{ user, tokens, referral: ReferralAttribution \| null }`. `accountType` defaults to `Student`; any other value gets `400` ("Account type must be Student or Teacher", `INVALID_ACCOUNT_TYPE`). Principals are created by an admin; parents come through the parent module. A bad/stale `referralCode` never fails signup; it just comes back `attributed: false`. |
| POST | `/google` | loginLimiter | `{ idToken, referralCode?, acquisition?: UserAcquisition, accountType?: 'Student' \| 'Teacher' }` (Google ID token) → `{ user, tokens, isNewUser, referral: ReferralAttribution \| null }`. Verifies the token with Google, then **finds by googleId**, else **links by email**, else **auto-creates a `Student`** (a `Teacher` when `accountType: 'Teacher'` is sent). `accountType`, `referralCode` and `acquisition` are used only when this call creates the account. |
| POST | `/refresh` | none | `{ refreshToken }` → `{ tokens: { accessToken, refreshToken, expiresIn } }` |
| POST | `/logout` | none | `{ refreshToken }` → revokes token |
| POST | `/changepassword` | auth | `{ oldPassword, newPassword, confirmPassword }` — revokes all refresh tokens |
| POST | `/reset-password-token` | resetLimiter | `{ email }` |
| POST | `/reset-password` | resetLimiter | `{ token, password, confirmPassword }` — revokes all refresh tokens |
| POST | `/verify-email` | none | `{ email, otp }` — OTP TTL: 5 min |

**Token model:**
- `accessToken`: short-lived JWT (2h expiry), sent as `Authorization: Bearer` header
- `refreshToken`: long-lived JWT (7d expiry), stored hashed in MongoDB, used only to get new access tokens
- Token rotation: each `/refresh` call invalidates the old refresh token and issues a new one. Refresh tokens are **single-use**: the old token is claimed atomically, so of two refreshes sent with the same token only one succeeds; the other gets `401 REFRESH_TOKEN_REVOKED`
- Max 5 active refresh tokens per user (multi-device support)
- Password change/reset revokes all refresh tokens, forcing re-login on all devices

### 1.2 Profile (`/api/v1/profile`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/details` | auth | Current user profile |
| PUT | `/update` | auth | Update fields |
| PUT | `/name` | auth | `{ name }` (2–100 chars) → `{ name }`. No verification |
| POST | `/email/request-change` | auth | `{ email }` → `{ newEmail, expiresInMinutes: 10 }`. Emails a 6-digit code to the NEW address; account unchanged. 400 same email · 409 taken · 429 within 60 s of last code · 502 send failed |
| POST | `/email/confirm-change` | auth | `{ code }` (6 digits) → `{ email }`. Switches the login email and notifies the old address. 400 wrong (with tries left) / expired · 409 taken meanwhile · 429 after 5 wrong codes |
| DELETE | `/delete` | auth | Delete account |
| PUT | `/display-picture` | auth | Multipart upload |
| DELETE | `/display-picture` | auth | Remove photo |
| GET | `/public/:userId` | none | Public profile view → `{ _id, name, image, accountType, createdAt }`; for a Student also `streak: { currentStreak, longestStreak }` and `stats: { questionsAnswered, accuracy, subjectsCount }` (`accuracy` is a whole percentage) |

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
| DELETE | `/` | auth, isTeacher | Body: `{ classId, subjectId, chapterIds }` — also calls AI Service `/v1/delete-document` |

### 1.6 Content - Topics (`/api/v1/topic`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/` | auth, isTeacher |
| GET | `/get-topics-by-chapter/:chapterId` | auth |
| POST | `/create-topic-mapping` | auth, isTeacher |

### 1.7 Study (`/api/v1/study`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/configuration` | none | Optional `?classIds=`. Each chapter in the returned class→subject→chapter tree carries `isStartable: boolean` (true only once the chapter has topics AND has finished RAG indexing) — clients must not let the user start a chapter where this is `false`. |
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
| GET | `/public-preview/class/:classSlug/subject/:subjectSlug/chapter/:chapterSlug` | none | Public SEO preview by slug; deterministic sample incl. explanations; always 200 |
| POST | `/generate/chapter/:chapterId` | auth, isTeacher | Admin fire-and-forget generation trigger; 409 if chapter has no topics |
| POST | `/counts` | auth, isTeacher | Batch question counts: `{ chapterIds: [] }` → `{ chapterId: count }` |

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
| GET | `/user/:userId` | All sessions (own, or SuperAdmin) |
| PATCH | `/:id/end` | End with score (session owner, or SuperAdmin) |
| GET | `/:id` | Get session (session owner, or SuperAdmin) |
| GET | `/last-incomplete/:userId` | Resume (own, or SuperAdmin) |

Other callers get `403` (`canAccessUser`: own records, or SuperAdmin).

### 1.10 User Answers (`/api/v1/user-answers`)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/batch` | Submit all answers |
| GET | `/session/:sessionId` | Get answers |
| GET | `/user/:userId` | User's answers (own, or SuperAdmin; `403 NOT_YOUR_DATA` otherwise) |

### 1.11 Topic Progress (`/api/v1/topic-progress`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/progress/chapter/:chapterId` | `auth` | userId from JWT. Response includes `isStartable: boolean` (topics exist AND RAG-indexed) for the requested chapter. |
| GET | `/progress/subject/:subjectId` | `auth` | userId from JWT. Each entry in `data.chapters[]` includes `isStartable: boolean` — the frontend gates the "Start Learning" CTA (`ChapterList.jsx`, `StudyConfig.jsx`) on this flag the same way it already gates chapter selection on `/study/configuration`'s `isStartable`. |
| GET | `/ai-insights/chapter/:chapterId` | `auth` | Proxies to AI Service `/v1/ai-insights/chapter` |
| GET | `/ai-insights/subject/:subjectId` | `auth` | Proxies to AI Service `/v1/ai-insights/subject` |
| GET | `/mastery-summary` | `auth` | userId from JWT |
| GET | `/teacher/class-insights` | `auth` + `isTeacher` | teacherId from JWT |

### 1.12 Progress Dashboard (`/api/v1/progress`)

| Method | Path |
|--------|------|
| GET | `/user/:userId` |

`:userId` must be the signed-in user, or the caller a SuperAdmin; otherwise `403` `{ code: "NOT_YOUR_DATA" }`.

### 1.13 Streaks (`/api/v1/streaks`)

| Method | Path |
|--------|------|
| GET | `/:userId` |
| POST | `/:userId/use-freeze` |

`:userId` must be the signed-in user, or the caller a SuperAdmin; otherwise `403` `{ code: "NOT_YOUR_DATA" }`. A failed `use-freeze` (no freeze left, no streak) is `400 { success: false, message, data: <streak> }`.

### 1.14 Daily Challenge (`/api/v1/daily-challenge`)

| Method | Path |
|--------|------|
| GET | `/:userId` |
| POST | `/:userId/complete` |
| GET | `/:userId/history` |

`:userId` must be the signed-in user, or the caller a SuperAdmin; otherwise `403` `{ code: "NOT_YOUR_DATA" }`. `complete` without an `answers` array is `400 { success: false }`. `topicName` is the weak topic's title (`"Mixed Topics"` when there is none).

### 1.15 Session Feedback (`/api/v1/session-feedback`)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/reaction` | `{ userId, sessionId, reaction, comment? }` |
| POST | `/nps` | NPS score (0-10) |
| GET | `/nps/check/:userId` | Check eligibility (own, or SuperAdmin; `403 NOT_YOUR_DATA` otherwise) |
| GET | `/stats` | |
| GET | `/nps/stats` | |

### 1.16 Inline Feedback (`/api/v1/inline-feedback`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/` | Auth | `{ feature, reaction, context? }` — rate-limited 10/min |
| GET | `/sentiment/:feature` | Teacher/Principal | |
| GET | `/sentiment` | SuperAdmin | All features |

### 1.17 Behavioral Prompt (`/api/v1/behavioral-prompt`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/check` | Auth | Returns `{ shouldPrompt, signalScore, reason }` |
| POST | `/dismiss` | Auth | Records prompt dismissal |
| GET | `/trend/:userId` | Auth | Satisfaction trend |

### 1.18 Suggestions / Feature Requests (`/api/v1/suggestions`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/` | Auth | `{ title, description, category }` |
| POST | `/:id/upvote` | Auth | Toggle upvote |
| GET | `/` | Auth | Paginated, filterable by `?status=&category=`. `?includeHidden=true` returns moderated (hidden) suggestions too — honoured for SuperAdmin only, silently ignored for everyone else. `isHidden` is stripped from the response unless `includeHidden` applied. |
| GET | `/mine` | Auth | User's own suggestions |
| GET | `/recently-shipped` | Auth | Last 30 days — includes `upvotedByMe`, `submittedByMe` flags |
| GET | `/user-impact` | Auth | Returns `{ suggestionsShipped, upvotesShipped }` |
| PUT | `/:id/respond` | SuperAdmin | `{ status, response? }` — `status` must be a valid `SuggestionStatus` |
| PUT | `/:id/hide` | SuperAdmin | Soft delete — sets `isHidden: true`, removing it from the public board |
| PUT | `/:id/unhide` | SuperAdmin | Restores a hidden suggestion (`isHidden: false`) |

### 1.19 Badges (`/api/v1/badges`)

| Method | Path |
|--------|------|
| GET | `/:userId` |
| POST | `/check` |

`GET /:userId`: `:userId` must be the signed-in user, or the caller a SuperAdmin; otherwise `403` `{ code: "NOT_YOUR_DATA" }`.

### 1.20 Quiz (`/api/v1/quiz`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/questions/search` | auth | Question bank search |
| GET | `/student/available` | auth | |
| GET | `/student/history` | auth | Signed-in student's completed attempts, newest first. `?subjectId=&page=&limit=` (limit default 10, max 50) → `{ attempts, pagination }` |
| POST | `/:quizId/start` | auth | Start, or resume the attempt in progress → `{ attempt, questions, quiz }`. `attempt.answers` is `[{ questionId, answer }]` (saved answers; `questionId` is the quiz-question id). Questions never include answers; with `shuffleQuestions` the order is fixed per attempt. Needs a `TeacherStudent` link to the quiz's teacher for its class and subject. Errors: 400 `QUIZ_NOT_AVAILABLE` / `DEADLINE_PASSED` / `MAX_ATTEMPTS_REACHED`, 403 `ACCESS_DENIED`, 404 |
| POST | `/attempt/:attemptId/answer` | auth | |
| POST | `/attempt/:attemptId/submit` | auth | |
| GET | `/attempt/:attemptId/result` | auth | Includes `attempt.canRetry` |
| GET | `/teacher/:teacherId` | auth | Own quizzes; SuperAdmin may list any teacher's |
| POST | `/` | auth | Create |
| GET | `/:quizId` | auth | Full quiz (custom answers included): the quiz's teacher or a SuperAdmin; anyone else 403 `ACCESS_DENIED` |
| PUT | `/:quizId` | auth | |
| DELETE | `/:quizId` | auth | |
| POST | `/:quizId/publish` | auth | |
| POST | `/:quizId/close` | auth | |
| POST | `/:quizId/clone` | auth | |
| GET | `/:quizId/analytics` | auth | Includes `questionAnalysis` (per question) |
| POST | `/:quizId/questions` | auth | Add question |
| DELETE | `/:quizId/questions/:questionId` | auth | |
| PUT | `/:quizId/questions/reorder` | auth | |

### 1.21 Question Paper (`/api/v1/question-paper`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/` | auth |
| POST | `/public/generate` | none (lead magnet) |
| GET | `/history` | auth |
| GET | `/:paperId/preview` | auth |
| GET | `/:paperId/pdf` | auth |
| DELETE | `/:paperId` | auth |

### 1.22 Teacher (`/api/v1/teacher`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/` | auth, isPrincipal, principalSchoolScope |
| GET | `/get-all` | auth, isPrincipal, principalSchoolScope |
| PUT | `/:id` | auth, isPrincipal, principalSchoolScope |
| DELETE | `/:id` | auth, isPrincipal, principalSchoolScope |

A principal works inside their own school: `POST /` (one teacher or an array) always uses it, `GET /get-all` lists only its teachers, and `PUT`/`DELETE /:id` return 404 for another school's teacher. A principal with no school gets `403 NO_SCHOOL`. SuperAdmin has no limit.

### 1.23 Teacher-Students (`/api/v1/teacher-students`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/bulk` | auth, isTeacherOrPrincipal |
| GET | `/` | auth, isTeacherOrPrincipal |

### 1.24 Teacher Dashboard (`/api/v1/teacher-dashboard`)

All require `auth, isTeacher` (applied at router level), and `:teacherId` must be the caller's own id (`isSelfOrSuperAdmin('teacherId')`; a SuperAdmin may use any). Otherwise `403 { code: "NOT_YOUR_DATA" }`.

| Method | Path |
|--------|------|
| GET | `/:teacherId/my-assignments` |
| GET | `/:teacherId/subject/:subjectId/dashboard` |
| GET | `/:teacherId/subject/:subjectId/students` |
| GET | `/:teacherId/subject/:subjectId/chapter/:chapterId/analytics` |
| GET | `/:teacherId/student/:studentId/subject/:subjectId/progress` |
| GET | `/:teacherId/subject/:subjectId/weak-topics` |
| GET | `/:teacherId/subject/:subjectId/activity` |

### 1.25 School (`/api/v1/school`)

| Method | Path |
|--------|------|
| POST | `/` |
| GET | `/` |
| GET | `/:id` |
| PUT | `/:id` |

Writes need `isPrincipal`. A principal may `PUT` only their own school (`403 NOT_YOUR_SCHOOL`; no school linked: `403 NO_SCHOOL`).

### 1.26 Sections (`/api/v1/sections`)

| Method | Path |
|--------|------|
| POST | `/` |
| POST | `/bulk` |
| GET | `/school/:schoolId` |
| GET | `/school/:schoolId/class/:classId` |
| GET | `/:sectionId` |
| PUT | `/:sectionId` |
| DELETE | `/:sectionId` |

Writes need `isPrincipal` + `principalSchoolScope`: a principal's `POST /` and `POST /bulk` always use their own school, and `PUT`/`DELETE` return 404 for another school's section. No school linked: `403 NO_SCHOOL`.

### 1.27 Student (`/api/v1/student`)

| Method | Path |
|--------|------|
| POST | `/create` |
| GET | `/get-all` |

### 1.28 Other

| Module | Path | Endpoints |
|--------|------|-----------|
| Leaderboard | `/api/v1/leaderboard` | `GET /` → top 10 of **this week** (from Monday 00:00 IST) `{ userId, name (first name), totalScore, totalQuestions, accuracy }[]`, `GET /subject/:subjectId` (all-time) |
| Feedback | `/api/v1/feedback` | `POST /` |
| API Logs | `/api/v1/logs` | `GET /`, `DELETE /`, `GET /stats` |
| Stats | `/api/v1/stats` | `GET /public` |
| Admin Metrics | `/api/v1/admin/metrics` | `GET /overview`, `GET /users`, `GET /content`, `GET /engagement`, `GET /question-jobs`, `GET /new-users`, `GET /feedback-insights` (all SuperAdmin) |
| AI System (LLM) | `/api/v1/admin/system/llm` | `GET /status` → `LlmStatus`, `GET /models?provider=&freeOnly=` → `LlmModelList`, `POST /test` `LlmTestRequest` → `LlmTestResult`, `POST /active` `{ provider, model }` → `LlmSwitchResult` (switches the live model instantly if the checks pass), `POST /reset` → `LlmSwitchResult` (back to env default), `POST /features/:feature` `{ provider?, model?, temperature? }` → `LlmFeatureSwitchResult` (gives one feature its own model and/or temperature if the checks pass), `POST /features/:feature/reset` → `LlmFeatureSwitchResult` (feature follows the live model again) (all SuperAdmin; `/test` 10/min, `/active`+`/reset` 5 per 10 min, `/features/*` 20 per 10 min; proxies the ai-service `/v1/admin/llm/*`) |
| Referral | `/api/v1/referral` | `GET /my-code` (auth) → `ReferralSummary`, `POST /redeem/:code` (auth; new accounts only, same rules as signup), `POST /rewards/practice-paper` `{ chapterId }` (auth) → `PracticePaperRedeemResult` (201; spends one credit, `400 NO_CREDITS` when none; credit refunded if the paper can't be made). Rewards are given when the referred friend has answered **10** questions, not at signup: both sides get +1 `paperCredits` and +1 `streakFreezes.bonus`; max 10 rewarded friends per referrer per month. |
| Teacher class links | `/api/v1/teacher-classes` | `POST /` `{ classId, subjectId, sectionName?, expectedStudents? }` (isTeacher) → `ClassLinkSummary` (201; reuses the active link for the same class/subject/section; a teacher with no school gets a private `kind: 'independent'` School first), `GET /mine` (isTeacher) → `MyClassLinks`, `PATCH /:id` `{ active }` (isTeacher, own links), `GET /:id/report` (isTeacher) → `ClassReport` (`403 REPORT_LOCKED` below 10 practised), `GET /certificate` (isTeacher) → `TeacherCertificate` (`403 CERTIFICATE_LOCKED` below 25 practised), `GET /join/:code` (public, 120/10 min) → `ClassLinkPublic`, `POST /join/:code` (auth, students only else `403 ONLY_STUDENTS`; `410 LINK_INACTIVE`) → `ClassJoinResult`. Joining creates a normal `TeacherStudent` row (`joinedVia` = the link) so the student appears in every `/teacher-dashboard` view; the student's `schoolId` is left unset so their practice stays unrestricted. |
| Challenges | `/api/v1/challenges` | `POST /` `{ sessionId }` (auth) → `ChallengeSummary` (201; one per session, needs ≥3 MCQ answers else `400 NOT_ENOUGH_QUESTIONS`), `GET /mine` (auth) → `MyChallenge[]`, `GET /:code` (public, optional auth, 120/10 min) → `PublicChallenge` (no answers), `POST /:code/attempts` `{ name?, answers: { questionId, selected }[] }` (public, optional auth, 20/10 min) → `ChallengeAttemptResult` (201; scored server-side; guests get a single-use `claimToken`; owner → `400 OWN_CHALLENGE`), `POST /attempts/:attemptId/claim` `{ claimToken }` (auth) → `ChallengeClaimResult` (links a guest play to the account and credits the owner as referrer if the account is new; the play's answers count towards the referral gift, so `gift` can come back already unlocked), `GET /:code/review` (auth; owner or a player, else `403 PLAY_FIRST`) → `ChallengeReview` |
| Notifications | `/api/v1/notifications` | All auth, any role. `GET /` `?before=<nextCursor>&limit=` (≤50, default 20) → `NotificationList` (newest first by `lastAt`), `GET /unread-count` → `{ unread }` (the bell polls this every 60 s while the tab is visible), `POST /read` `{ ids }` or `{ all: true }` → `NotificationReadResult`. Rows are written by the backend on challenge plays, referral joins/gifts, badges, class-link joins and a daily 5 pm IST job (gift reminders, teacher milestones); one-time events never repeat; rows expire 60 days after their last event. |
| Goals | `/api/v1/goals` | `GET /` (auth), `PUT /` (auth) |

### 1.29 Health

| Method | Path |
|--------|------|
| GET | `/ping` |

### 1.30 AI Assistant (`/api/v1/ai-assistant`)

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

Host: `http://localhost:8000` (dev) / `https://ai-service.askaide.ai` (prod)
Auth: All endpoints require `x-api-key` header (except `/ping`, `/health`, `/health/live`, `/health/ready`, `/docs`, `/redoc`)

**Versioning:** all business endpoints are served under the `/v1` prefix. There are **no unversioned mirrors** — an unversioned business path returns `404`. Only the health/ops endpoints in the second table below are unversioned. New endpoints go under `/v1`.

### 2.1 Versioned Endpoints (`/v1`)

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| POST | `/v1/upload-document` | Multipart: `file` + `class_id`, `chapter_id`, `subject_id` | `202` + `UploadStatusResponse` | Async — returns immediately; poll `/v1/upload-status/{task_id}` for result. Max file: 10 MB |
| GET | `/v1/upload-status/{task_id}` | Path param | `UploadStatusResponse` | Poll upload task status; `status` is `queued`, `processing`, `completed`, or `failed` |
| POST | `/v1/delete-document` | `{ class_id, chapter_id, subject_id }` | `DocumentDeleteResponse` | Removes from Qdrant |
| POST | `/v1/search-document` | `{ class_id, chapter_id, subject_id }` | `DocumentSearchResponse` | Check existence |
| POST | `/v1/search-documents/batch` | `[{ class_id, subject_id, chapter_id }]` | `BatchDocumentSearchResponse` — `{ results: [{ found, metadata }] }` | Batch check multiple chapters |
| POST | `/v1/query` | `{ query, class_id, subject_id, chapter_ids, stream? }` | `QueryResponse` | RAG semantic search |
| POST | `/v1/generate-questions` | `{ class_id, subject_id, chapter_id, topics, n, type, is_distinct?, difficulty?, max_retries? }` | `GenerateQuestionsResponse` | AI question gen (`max_retries` caps LLM attempts for latency-sensitive first-batch calls) |
| POST | `/v1/regenerate-topics` | `{ class_id, subject_id, chapter_id }` | `202` + `{ task_id }` | Async topic regeneration from Qdrant chunks |
| POST | `/v1/sync-chapter-topics` | `{ chapter_id }` | `SyncChapterTopicsResponse` | Sync Qdrant→MongoDB topics |
| GET | `/v1/ai-insights/chapter` | Query: `chapter_id`, `user_id` | `{ insight: string }` | Student progress analysis |
| GET | `/v1/ai-insights/subject` | Query: `subject_id`, `user_id` | `{ insight: string }` | Subject-level analysis |
| GET | `/v1/ai-insights/teacher/class` | Query: `class_id`, `teacher_id` | `AITeacherClassInsightResponse` | Teacher class-level analysis |
| POST | `/v1/ai-agent` | `{ teacher_id, prompt, responses?, session_id?, class_id?, subject_id?, chapter_id? }` | `AgentResponse` (contains `generation_id`) | AI content generation (quiz, paper, notes, etc.) |
| POST | `/v1/ai-agent/stream` | `{ teacher_id, prompt, responses?, session_id?, class_id?, subject_id?, chapter_id? }` | SSE stream | Streaming version (SSE, token-by-token) |
| POST | `/v1/ai-agent/modify` | `{ teacher_id, generation_id, difficulty?, num_questions?, question_type?, sections?, duration_minutes? }` | `AgentResponse` | Modify existing generation — re-executes with merged params |
| GET | `/v1/ai-agent/chapters` | Query: `teacher_id`, `subject_id?` | `{ chapters: [...] }` | Teacher's chapters with topics, RAG status, class/subject info |
| GET | `/v1/ai-agent/classes` | Query: `teacher_id` | `{ classes: [] }` | Teacher's accessible classes |
| GET | `/v1/ai-agent/tasks` | — | `{ tasks: [] }` | Available AI tasks |
| GET | `/v1/ai-agent/history` | Query: `teacher_id`, `limit?`, `offset?` | `{ generations: [...] }` | Past generations, newest first |
| GET | `/v1/ai-agent/generation/{generation_id}` | Path param | `{ generation: { ... } }` | Single generation by ID |
| GET | `/v1/ai-agent/health` | — | `{ status: "healthy" }` | AI Agent health (requires `x-api-key` — it is versioned, not a public probe) |
| POST | `/v1/conversations` | `{ user_id, title? }` | `{ conversation_id }` | Create conversation |
| GET | `/v1/conversations` | Query: `user_id`, `limit?` | `{ conversations: [] }` | List conversations |
| GET | `/v1/conversations/{id}/messages` | Query: `user_id` | `{ messages: [] }` | Get messages |
| POST | `/v1/conversations/{id}/messages` | Query: `user_id`, `role`, `content` | `{ message: {...} }` | Add message |
| DELETE | `/v1/conversations/{id}` | Query: `user_id` | `{ deleted: true }` | Delete conversation |
| POST | `/v1/teacher/create-quiz` | `TeacherQuizRequest` — `{ teacher_id, prompt }` | `TeacherQuizResponse` | Legacy quiz entry point; delegates to the AI Agent internally |
| GET | `/v1/teacher/classes` | Query: `teacher_id` | `{ success, classes: [] }` | Legacy — prefer `/v1/ai-agent/classes` |
| GET | `/v1/admin/llm/status` | — | `LlmStatus` | Live provider/model and where it came from (`database` / `env`), env default, recent switches, start time, commit, per-provider key configured flag (never the key) |
| POST | `/v1/admin/llm/test` | `LlmTestRequest` — `{ provider?, model?, temperature?, feature? }` | `LlmTestResult` | Plain / JSON / question checks; empty body tests the live model (with `feature`: what that feature runs now); `temperature` runs the checks at that temperature. `400` unknown provider or key not configured, `504` past `LLM_TEST_TIMEOUT` (90s). Never changes anything |
| POST | `/v1/admin/llm/active` | `LlmActivateRequest` — `{ provider, model, requested_by? }` | `LlmSwitchResult` | Re-runs the 3 checks on the candidate; only if all pass: save to MongoDB `llm_settings` (scoped per deployment) → swap the live client in memory. Instant, no restart; in-flight calls finish on the old model. `activated: false` = failed checks, nothing changed. `409` switch already running, `503` can't save |
| POST | `/v1/admin/llm/reset` | `{ requested_by? }` | `LlmSwitchResult` | Delete the saved choice; go back to `LLM_PROVIDER` + its model env var. Features with their own model keep it |
| POST | `/v1/admin/llm/features/{feature}` | `LlmFeatureRequest` — `{ provider?, model?, temperature?, requested_by? }` | `LlmFeatureSwitchResult` | Give one feature (`LlmFeatureKey`) its own model and/or temperature. provider+model together, or only a temperature to stay on the live model. Runs the 3 checks on exactly that combination; only if all pass: save to `llm_settings` (`_id = feature:<scope>:<feature>`) → swap instantly. `404` unknown feature, `400` bad combination, `409` switch running, `503` can't save |
| POST | `/v1/admin/llm/features/{feature}/reset` | `{ requested_by? }` | `LlmFeatureSwitchResult` | Delete the feature's saved choice; it follows the live model at the provider's default temperature |
| GET | `/v1/admin/llm/models` | Query: `provider?`, `free_only?` (default true, OpenRouter only) | `LlmModelList` | Live provider listing cached 10 min; curated fallback when a key is missing or listing fails (`502` only if OpenRouter's public catalogue is down) |

### 2.2 Unversioned Health & Ops Endpoints

These sit on the app root, not the `/v1` router, so probes survive future version bumps.

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| GET | `/` | — | service info | Root |
| GET | `/ping` | — | `{ status: "alive" }` | Health ping |
| GET | `/health` | — | `{ status: "healthy" }` | Full health check |
| GET | `/health/live` | — | `{ status: "alive" }` | Liveness probe |
| GET | `/health/ready` | — | `{ status: "ready" }` | Readiness probe |
| GET | `/metrics` | — | service metrics | Service metrics |

### AI Service Data Flow

```
Backend → POST /v1/upload-document (multipart)
   → Parse document (PDF/TXT/DOCX)
   → Chunk → LLM summarize → Extract topics
   → Chunk (512 words) → Embed → Store in Qdrant
   → Return { success, metadata, topics, summary }

Backend → POST /v1/generate-questions
   → Fetch topics from MongoDB
   → Search Qdrant by topic filter
   → Build LLM context → Generate questions
   → Return { questions[], count }

Backend → GET /v1/ai-insights/{chapter,subject}
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
