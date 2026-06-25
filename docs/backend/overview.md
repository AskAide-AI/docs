# Backend

**Express.js + MongoDB** — API server for the AskAide AI learning platform. Handles authentication, content management, question generation, quiz lifecycle, progress tracking, and teacher tools.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |
| Validation | Joi schemas |
| Caching | Redis (ioredis) |
| Payments | Razorpay |
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

**Pattern:** Every feature lives in `src/modules/<name>/` with `controller`, `service`, `validators`, `routes`, and `models` subfolders. Cross-cutting models (User, Profile, OTP) live in `src/shared/models/`.

## Response Format

All endpoints return:
```json
{ "success": true, "message": "...", "data": { ... } }
```

Errors use `AppError` class with global error handler.

## Modules (14 total)

| Module | Purpose |
|--------|---------|
| `auth` | Login, signup, OTP, password reset, Google OAuth |
| `content` | Classes, subjects, chapters, topics, PDF upload |
| `questions` | CRUD, batch fetching, AI generation trigger |
| `quiz` | Full quiz lifecycle (CRUD, attempts, scoring, analytics) |
| `progress` | Topic progress, AI insights, streaks, badges |
| `teacher` | Teacher CRUD, dashboard, student management |
| `school` | School management, sections |
| `question-paper` | Board-style paper generation |
| `ai-assistant` | Teacher AI content generation |
| `user` | User/profile management |
| `parent` | Parent dashboard |
| `goal` | Daily student goal management |
| `referral` | Invite/referral system |
| `supporting` | Leaderboard, feedback, background jobs |

## AI Integration

The backend acts as a proxy between Frontend and AI Service:

| Backend | AI Service Endpoint | Purpose |
|---------|-------------------|---------|
| `content.service.js` | `POST /upload-document` | Chapter PDF ingestion |
| `content.service.js` | `POST /delete-document` | Chapter deletion |
| `content.service.js` | `POST /search-document` | RAG status check |
| `questions.service.js` | `POST /generate-questions` | AI question generation |
| `topicProgress.controller.js` | `GET /ai-insights/chapter` | Chapter learning insights |
| `topicProgress.controller.js` | `GET /ai-insights/subject` | Subject learning insights |
| `topicProgress.controller.js` | `GET /ai-insights/teacher/class` | Teacher class insight |
| `ai-assistant/` | `POST /ai-agent` | Teacher content generation |
