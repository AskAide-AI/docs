# Copilot Instructions — AskAideAI Backend

## Project Identity
- **Name**: AskAideAI Backend
- **Type**: Express.js + MongoDB REST API
- **Port**: 4000 (dev) / environment PORT
- **Target**: K-12 EdTech platform in India
- **Frontend**: React SPA at `http://localhost:5173` (consumes this API)
- **AI Service**: Python FastAPI at `http://localhost:8000` (this backend calls it)

## Architecture Patterns
- Entry: `index.js` → `config/server.config.js` → `routes/v1/index.js` → module routes
- Module structure: `src/modules/<name>/` with `controller/`, `service/`, `validators/`, `routes/`, `models/`
- Response: Always use `sendSuccess(res, message, data, statusCode)` from `src/shared/utils/`
- Error: Use `AppError` class from `src/shared/middleware/errorHandler.js`
- Auth: `auth` middleware for JWT, role guards (`isTeacher`, `isStudent`, `isParent`, `isPrincipal`)

## AI Service Integration
This backend calls the AI Service for:
- **Document upload**: `POST {AI_ENDPOINT}/upload-document` (FormData with file + metadata)
- **Document delete**: `POST {AI_ENDPOINT}/delete-document` (JSON body)
- **RAG search**: `POST {AI_ENDPOINT}/search-document` (JSON body)
- **Question generation**: `POST {AI_QUESTION_REQ_URL}` (JSON, 600s timeout) — called from `questions.service.js` `_callAIService()`
- **AI insights**: `GET {AI_ENDPOINT}/ai-insights/chapter` and `/ai-insights/subject` (proxied via `topicProgress.controller.js`)

## Response Format
All endpoints must return:
```json
{ "success": true, "message": "Success message", "data": { ... } }
```

- `sendSuccess(res, message, data, statusCode)` for success
- `sendError(res, message, statusCode, error)` for errors
- `AppError` for controlled error throwing

## Testing Pattern
- Jest with ESM: `NODE_OPTIONS=--experimental-vm-modules npx jest`
- Mock Mongoose models via `jest.unstable_mockModule`
- See `src/modules/*/tests/` for examples

## Key env vars
- `PORT`, `DATABASE_URL`, `JWT_SECRET`
- `AI_ENDPOINT=http://localhost:8000`, `AI_QUESTION_REQ_URL=http://localhost:8000/generate-questions`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `EMAIL_USER`, `EMAIL_PASS`
- `QUESTION_PREFETCH_AHEAD=10`, `QUESTION_MIN_NEW_PER_RUN=3`, `QUESTION_LOW_YIELD_LIMIT=2`, `QUESTION_HARD_CAP=300`

## Shared Contracts
Data models and API definitions are at `D:\AskAide AI\shared-contracts\`:
- `data-models.ts` — TypeScript interfaces for all models
- `api-definitions.md` — All API endpoints
