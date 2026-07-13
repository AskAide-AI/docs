# Backend Architecture

## Request Lifecycle

```
Request → helmet → rateLimiter (500 req/5min, skip /api-docs /ping localhost)
  → cors (origin:true, credentials:true)
  → compression (level 6, threshold 10KB)
  → apiLogger (Winston, custom — not morgan)
  → bodyParser (json + urlencoded + text)
  → Auth middleware (JWT) → Role guard → Joi validator
  → Controller → Service → Mongoose → MongoDB
  → Response (sendSuccess wrapper)
```

## Middleware Chain

| Middleware | File | Purpose |
|------------|------|---------|
| Auth | `src/shared/middleware/auth.js` | JWT verification, user extraction |
| Role Guards | `src/shared/middleware/auth.js` | `isStudent`, `isTeacher`, `isPrincipal`, `isParent`, `isNormalUser`, `isTeacherOrPrincipal` |
| Validation | `src/shared/middleware/validate.js` | Joi schema validation |
| Error Handler | `src/shared/middleware/errorHandler.js` | Global error handler + 404 handler |
| Logger | `src/shared/middleware/apiLogger.middleware.js` | Winston-based request logging |

All role guards also allow `SuperAdmin`.

## Module Pattern

Every feature module at `src/modules/<name>/` follows this structure:
```
src/modules/<name>/
├── controllers/    # Request handling, response formatting
├── services/       # Business logic
├── validators/     # Joi validation schemas
├── routes/         # Route definitions + middleware wiring
├── models/         # Mongoose schemas
├── tests/          # Jest test files
└── index.js        # Barrel export (routes)
```

## Shared Layer

| Path | Contents |
|------|----------|
| `src/shared/models/` | User, Profile, OTP models |
| `src/shared/utils/` | `sendSuccess()`, `AppError`, Winston logger, mail, Google Sheets, `cache.js` (Redis), WhatsApp, validation helpers |
| `src/shared/middleware/` | Auth, logger, error handler, Joi validation |
| `src/shared/jobs/` | keep-alive cron, achievement scheduler |

## Key Design Decisions

- **ESM modules**: `"type": "module"` in package.json
- **Testing**: `jest.unstable_mockModule` for ESM-compatible mocking
- **PDF generation**: Puppeteer-core + `@sparticuz/chromium` (not standard puppeteer)
- **AI calls via HTTP**: Axios requests to AI Service (FastAPI)
- **Response format**: All success responses use `sendSuccess(res, message, data, statusCode)`
- **Error handling**: `AppError` class → global `errorHandler` → JSON error response

## Background Jobs

Started at bottom of `index.js`:
| Job | File | Schedule | Purpose |
|-----|------|----------|---------|
| Keep-alive | `src/shared/jobs/keepAlive.js` | Every 14 min | Prevent Render cold start |
| Badge check | `src/modules/supporting/jobs/achievementScheduler.js` | Daily | Nightly badge safety net |

## Swagger API Docs

Available at `GET /api-docs` in development. Annotations are JSDoc comments on route files. Config at `config/swagger.config.js`.
