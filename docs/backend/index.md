# CLAUDE.md — Backend

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start with nodemon auto-reload
npm start          # Production server
npm test           # Jest with ESM support (NODE_OPTIONS=--experimental-vm-modules)
npm run lint       # ESLint check
npm run lint:fix   # ESLint auto-fix

# DB seed / utility scripts
node scripts/initClasses.js
node scripts/initSubjects.js
node scripts/initChapters.js
node scripts/createIndexes.js        # Create MongoDB indexes
node scripts/bulkUploadChapters.js   # Bulk chapter ingestion
node scripts/query-runner.js         # Ad-hoc DB query runner
```

Run a single test file:
```bash
NODE_OPTIONS=--experimental-vm-modules npx jest src/modules/progress/tests/progress.service.test.js
```

## Architecture

AskAide AI is an EdTech backend (Express.js + MongoDB) serving curriculum content, AI-powered question generation, practice sessions, and teacher tools.

**Entry point:** `index.js` → `config/server.config.js` + `config/db.config.js` → `routes/index.js` → `routes/v1/index.js` → module routes

**Pattern:** Every feature lives in `src/modules/<name>/` with `controller`, `service`, `validators`, `routes`, and `models` subfolders. Cross-cutting models (User, Profile, OTP) live in `src/shared/models/`.

**Request lifecycle:**
```
Rate limiter → CORS → API logger → Body parser
  → Auth middleware (JWT) → Role guard → Joi validator → Controller → Service → Mongoose → MongoDB
```

**Modules:** `auth`, `user`, `content`, `questions`, `progress`, `question-paper`, `teacher`, `quiz`, `school`, `supporting` (leaderboard, feedback, jobs), `teacher-dashboard`, `ai-assistant`, `goal`, `referral`, `parent`

**Shared utilities:** `src/shared/utils/` — `sendSuccess()` for all responses, `AppError` for all errors, Winston logger, mail sender, Google Sheets integration, `cache.js` (Redis caching via ioredis), `whatsapp.js` (mock WhatsApp PDF sender), `validation.js` (field validation helpers).

**Auth & roles:** JWT via `src/shared/middleware/auth.js`. Role guards: `isStudent`, `isTeacher`, `isPrincipal`, `isParent`. All protected routes must apply the appropriate guard.

**PDF generation:** Puppeteer-core + `@sparticuz/chromium` (not the standard `puppeteer` package).

**AI integration:** External RAG service via `AI_ENDPOINT` (document upload) and `AI_QUESTION_REQ_URL` (question generation).

**Testing pattern:** `jest.unstable_mockModule` for ESM-compatible mocking. Mock Mongoose models by mocking the module path. See existing tests in `src/modules/*/tests/` for examples.

**Background jobs:** `src/shared/jobs/` — keep-alive cron and achievement scheduler, started in `index.js`.

**New feature modules:**
- `ai-assistant` — Processes teacher prompts for content generation; calls `AI_ENDPOINT/ai-agent`; supports follow-up clarifications via `POST /ai-assistant/continue`
- `goal` — Student daily goal management; resets daily at IST midnight
- `referral` — Invite/referral system with codes and redemption
- `parent` — Parent dashboard access to child progress

**Key subsystems added since initial docs:**
- Badge/achievement system (real-time checks via `POST /badges/check` + nightly cron safety net)
- Daily challenge system
- Session feedback collection
- Streak tracking

**Swagger docs:** Available at `GET /api-docs` in development. Annotations are JSDoc comments on route files.

## Cross-Repository Integration

This backend repo is one of three AskAide AI repositories:

| Repo | Path | Port | Connection |
|------|------|------|------------|
| **Frontend** (React) | `D:\AskAide AI\Frontend` | 5173 | Serves API to this via `VITE_API_URL` |
| **AI Service** (FastAPI) | `D:\AskAide AI\ai-service` | 8000 | Called via `AI_ENDPOINT` + `AI_QUESTION_REQ_URL` |
| **Shared Contracts** | `D:\AskAide AI\shared-contracts\` | — | `data-models.ts`, `api-definitions.md`, schema |

### How This Backend Calls the AI Service

This backend sends HTTP requests to the AI Service (FastAPI) for:

| Backend Code Location | AI Service Endpoint | Method | When |
|----------------------|---------------------|--------|------|
| `src/modules/content/services/content.service.js` | `AI_ENDPOINT/upload-document` | POST (FormData) | Chapter PDF upload |
| `src/modules/content/services/content.service.js` | `AI_ENDPOINT/delete-document` | POST (JSON) | Chapter deletion |
| `src/modules/content/services/content.service.js` | `AI_ENDPOINT/search-document` | POST (JSON) | RAG status check |
| `src/modules/questions/services/questions.service.js` | `AI_QUESTION_REQ_URL` (full URL) | POST (JSON) | Question generation |
| `src/modules/progress/controllers/topicProgress.controller.js` | `AI_ENDPOINT/ai-insights/chapter` | GET | Chapter insight |
| `src/modules/progress/controllers/topicProgress.controller.js` | `AI_ENDPOINT/ai-insights/subject` | GET | Subject insight |
| `src/modules/progress/controllers/topicProgress.controller.js` | `AI_ENDPOINT/ai-insights/teacher/class` | GET | Teacher class insight |
| `src/modules/ai-assistant/` | `AI_ENDPOINT/ai-agent` | POST | Teacher content generation |

### Key Env Vars for Integration

```env
AI_ENDPOINT=http://localhost:8000          # Base URL for AI Service
AI_QUESTION_REQ_URL=http://localhost:8000/generate-questions  # Question gen endpoint
PORT=4000                                  # This server
DATABASE_URL=mongodb://...                 # MongoDB
JWT_SECRET=...                             # JWT signing

# Question Prefetch/Generation Tuning
QUESTION_PREFETCH_AHEAD=10    # How many future questions to pre-generate
QUESTION_MIN_NEW_PER_RUN=3    # Minimum new questions to generate per batch
QUESTION_LOW_YIELD_LIMIT=2    # Threshold for retrying a low-yield generation run
QUESTION_HARD_CAP=300         # Maximum total questions allowed per generation request
```

### Shared Contracts

When making changes that affect API contracts:
1. Update `D:\AskAide AI\shared-contracts\api-definitions.md` for endpoint changes
2. Update `D:\AskAide AI\shared-contracts\data-models.ts` for model changes
3. Update `D:\AskAide AI\shared-contracts\data-models.schema.json` (JSON Schema mirror)

### AI Service Data Models Used by Backend

See `D:\AskAide AI\shared-contracts\data-models.ts` for:
- `AIQueryRequest` / `AIQueryResponse` — RAG query
- `AIGenerateQuestionsRequest` / `AIGenerateQuestionsResponse` / `AIQuestionItem` — Question generation
- `AIDocumentUploadRequest` / `AIDocumentUploadResponse` — Document pipeline
- `AIInsightResponse` — Learning insights

## Key env vars

`DATABASE_URL`, `JWT_SECRET`, `PORT`, `BACKEND_URL`
`AI_ENDPOINT`, `AI_QUESTION_REQ_URL`
`CLOUD_NAME`, `API_KEY`, `API_SECRET`, `FOLDER_NAME` (Cloudinary)
`RAZORPAY_KEY`, `RAZORPAY_SECRET`
`MAIL_HOST`, `MAIL_USER`, `MAIL_PASS`
`REDIS_URL` (Redis cache via ioredis)
`QUESTION_PREFETCH_AHEAD`, `QUESTION_MIN_NEW_PER_RUN`, `QUESTION_LOW_YIELD_LIMIT`, `QUESTION_HARD_CAP` (Question generation tuning)

## Agent skills

`.agent/skills/` contains codified patterns for this project:
- `api-module-scaffold` — exact file/folder structure for new modules
- `api-security` — JWT/role guard patterns
- `backend-testing` — Jest + ESM + Mongoose mock patterns
- `database-patterns` — Mongoose schema design, N+1 prevention
- `deployment-ops` — Render deployment, Winston logging config
