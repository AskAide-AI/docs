# AskAide AI Backend — Agent Guide

## Commands

```bash
npm run dev        # nodemon auto-reload
npm start          # Production server
npm test           # Jest with ESM (NODE_OPTIONS=--experimental-vm-modules)
npm run lint       # ESLint flat config check
npm run lint:fix   # ESLint auto-fix

# DB seed scripts (exist on disk but ARE gitignored by /.gitignore)
node scripts/initClasses.js
node scripts/initSubjects.js
node scripts/initChapters.js
```

Run a single test:
```bash
NODE_OPTIONS=--experimental-vm-modules npx jest src/modules/auth/tests/auth.service.test.js
```

## Architecture

**Entry path:** `index.js → config/server.config.js → routes/index.js → routes/v1/index.js → module routes`

`config/server.config.js` only exports `PORT`, `ATLAS_DB_URL`, `NODE_ENV` — it does NOT mount routes.

**Request lifecycle** (order in `index.js`):
```
helmet → rateLimiter (100 req/5min, skip /api-docs /ping)
  → cors (origin:true, credentials:true)
  → compression (level 6, threshold 10KB)
  → apiLogger (custom Winston-based, NOT morgan)
  → bodyParser (json + urlencoded + text)
  → Auth middleware (JWT) → Role guard → Joi validator → Controller → Service → Mongoose → MongoDB
```

**Modules** (14 total under `src/modules/`):
`auth`, `content`, `goal`, `parent`, `progress`, `question-paper`, `questions`, `quiz`, `referral`, `school`, `supporting`, `teacher`, `user`

Every module has a barrel `index.js` exporting routes. Most have `controllers/`, `services/`, `routes/`, `models/` subdirs. Exceptions:
- `user` — no `models/` or `validators/` (User/Profile models live in `src/shared/models/`)
- `parent` — no `tests/`
- `goal` — no `validators/` or `tests/`
- `progress` — no `validators/`
- `supporting` — no `validators/`

**Shared middleware:** `src/shared/middleware/` — `auth` (JWT), `apiLogger.middleware.js`, `errorHandler.js`, `validate.js`

**Role guards** exported from `src/shared/middleware/auth.js`: `isStudent`, `isTeacher`, `isPrincipal`, `isParent`, `isNormalUser`, `isTeacherOrPrincipal`

**Response format:** All endpoints use `sendSuccess(res, message, data, statusCode)` from `src/shared/utils/responseHandler.js`:
```json
{ "success": true, "message": "...", "data": ... }
```

**Errors:** `AppError` class + global `errorHandler` + `notFoundHandler` from `src/shared/middleware/errorHandler.js`

## Key env vars

`DATABASE_URL`, `JWT_SECRET`, `AI_ENDPOINT` (not `AI_ENDPOINT_URL` — the path is appended in code), `AI_QUESTION_REQ_URL`, `CLOUDINARY_*`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `EMAIL_USER`, `EMAIL_PASS`

Env loading: `dotenv` is called in `config/server.config.js`. Also added via `node --import` flag in `package.json` scripts (redundant).

## AI Integration

| Backend file | Env var | AI endpoint |
|---|---|---|
| `content.service.js` | `AI_ENDPOINT` | `{AI_ENDPOINT}/upload-document` (POST FormData) |
| `content.service.js` | `AI_ENDPOINT` | `{AI_ENDPOINT}/delete-document` (POST JSON) |
| `content.service.js` | `AI_ENDPOINT` | `{AI_ENDPOINT}/search-document` (POST JSON) |
| `questions.service.js` | `AI_QUESTION_REQ_URL` | full URL, 600s timeout, POST JSON |
| `topicProgress.controller.js` | `AI_ENDPOINT` | `{AI_ENDPOINT}/ai-insights/chapter` (GET) |
| `topicProgress.controller.js` | `AI_ENDPOINT` | `{AI_ENDPOINT}/ai-insights/subject` (GET) |

## Testing

- `jest.unstable_mockModule` for ESM-compatible mocking (mock modules BEFORE dynamic import)
- Mock Mongoose models by mocking the model file path directly
- See `src/modules/*/tests/` for examples (10 test files exist across auth, content, progress, questions, quiz, question-paper, school, supporting, teacher, user)

## Background jobs

Started at bottom of `index.js`:
- `src/shared/jobs/keepAlive.js` — server keep-alive cron
- `src/modules/supporting/jobs/achievementScheduler.js` — daily badge safety net

## PDF generation

Puppeteer-core + `@sparticuz/chromium` (NOT the standard `puppeteer` package).

## Swagger

Available at `GET /api-docs` in development. Annotations are JSDoc comments. Config at `config/swagger.config.js`.

## Cross-repo context

| Repo | Path | Port |
|------|------|------|
| Frontend (React) | `D:\AskAide AI\Frontend` | 5173 |
| AI Service (FastAPI) | `D:\AskAide AI\ai-service` | 8000 |
| Shared Contracts | `D:\AskAide AI\shared-contracts\` | — |

When adding cross-repo features: check `shared-contracts/data-models.ts` and `shared-contracts/api-definitions.md` first.

## Gotchas

- `scripts/` directory is in `.gitignore` — files exist on disk but won't be tracked
- `prisma` is in `dependencies` in `package.json` but has **no `prisma/` directory or schema** — likely unused
- `.mcp.json` uses `mongodb-mcp-server` as the command; `opencode.json` uses `@anthropic-ai/mcp-server-mongodb` — two different MCP server packages
- There is no `.github/` directory — no CI/CD pipeline config in this repo
