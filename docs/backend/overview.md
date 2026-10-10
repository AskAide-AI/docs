# Backend

**Express.js + MongoDB** — API server for the AskAide AI learning platform. Handles authentication, content management, question generation, quiz lifecycle, progress tracking, teacher tools, invites and challenges, and in-app notifications.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js + Express.js |
| Database | MongoDB + Mongoose (schema indexes built at startup) |
| Auth | JWT (access + single-use refresh tokens) |
| Validation | Joi schemas |
| Caching | In-process cache for the study hierarchy; Redis code path is inactive (`ioredis` is not installed) |
| Scheduling | `node-cron` (badge sweep, daily notifications, keep-alive) |
| Email | SendGrid HTTPS API |
| PDF | Puppeteer-core + @sparticuz/chromium |
| Logging | Winston |
| Docs | Swagger at `GET /api-docs` |

## Architecture

**Entry point:** `index.js → config/ → routes/ → modules/`

**Request lifecycle:**
```
helmet → rate limiter → CORS → compression → Winston logger
  → body parser → Auth middleware (JWT) → Role guard
  → Joi validator → Controller → Service → Mongoose → MongoDB
```

**Pattern:** Every feature lives in `src/modules/<name>/` with `controllers`, `services`, `validators`, `routes`, `models` and `tests` subfolders (not every module has all of them). Cross-cutting models (`User`, `Profile`, `OTP`, `UserActivityDay`) live in `src/shared/models/`.

## Response Format

All endpoints return:
```json
{ "success": true, "message": "...", "data": { ... } }
```

Errors use `AppError` class with global error handler.

## Modules (19 total)

| Module | Purpose |
|--------|---------|
| `auth` | Login, signup (students and teachers), OTP, password reset, Google OAuth, single-use refresh tokens |
| `user` | Profile management, name change, verified email change, school-managed student accounts |
| `content` | Classes, subjects, chapters, topics, PDF upload |
| `questions` | CRUD, batch fetching, AI generation trigger, public chapter preview |
| `progress` | Sessions, answers, topic progress, AI insights, streaks, badges, session feedback |
| `question-paper` | Board-style paper generation |
| `teacher` | Teacher accounts, teacher-student assignments, teacher dashboard, class join links |
| `quiz` | Full quiz lifecycle (CRUD, attempts, scoring, analytics) |
| `school` | Schools and sections |
| `principal` | Principal dashboard and principal accounts |
| `parent` | Parent dashboard, parent-student linking |
| `supporting` | Weekly leaderboard, feedback inbox, API logs, public stats, admin metrics, AI System (live LLM switching), badge sweep job |
| `ai-assistant` | Teacher AI content generation |
| `feedback` | Inline feedback, behavioral prompts, suggestions |
| `goal` | Daily student goal management |
| `referral` | Invite codes, signup attribution, rewards after the friend answers 10 questions |
| `challenge` | Challenge-a-friend links: public play without login, claim after signup, results |
| `notification` | In-app notification bell and the daily 5 pm IST notification job |
| `campaign` | SuperAdmin email campaigns and one-click unsubscribe |

## AI Integration

The backend acts as a proxy between Frontend and AI Service:

| Backend | AI Service Endpoint | Purpose |
|---------|-------------------|---------|
| `content.service.js` | `POST /v1/upload-document` | Chapter PDF ingestion |
| `content.service.js` | `POST /v1/delete-document` | Chapter deletion |
| `content.service.js` | `POST /v1/search-document` | RAG status check |
| `questions.service.js` | `POST /v1/generate-questions` | AI question generation |
| `topicProgress.controller.js` | `GET /v1/ai-insights/chapter` | Chapter learning insights |
| `topicProgress.controller.js` | `GET /v1/ai-insights/subject` | Subject learning insights |
| `topicProgress.controller.js` | `GET /v1/ai-insights/teacher/class` | Teacher class insight |
| `ai-assistant/` | `POST /v1/ai-agent` | Teacher content generation |
| `ai-assistant/` | `POST /v1/ai-agent/stream` | Teacher content generation (SSE streaming) |
| `llmSystem.service.js` | `GET /v1/admin/llm/status`, `/models`; `POST /v1/admin/llm/test`, `/active`, `/reset`, `/features/{feature}[/reset]` | SuperAdmin AI System tab: test and switch the live LLM, and set a model per AI feature (instant, no redeploy) |
