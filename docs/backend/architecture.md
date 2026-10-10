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
| Auth | `src/shared/middleware/auth.js` | JWT verification, user extraction, daily-active record (`useractivitydays`, not awaited) |
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
| `src/shared/models/` | User, Profile, OTP, UserActivityDay models |
| `src/shared/utils/` | `sendSuccess()`, `AppError`, Winston logger, mail, Google Sheets, `cache.js` (Redis), WhatsApp, validation helpers, `ensureIndexes.js` (builds schema indexes at startup), `activityTracker.js` (daily-active rows) |
| `src/shared/middleware/` | Auth, logger, error handler, Joi validation |
| `src/shared/jobs/` | keep-alive cron (the badge and notification schedulers live in their modules' `jobs/` folders) |

## Key Design Decisions

- **ESM modules**: `"type": "module"` in package.json
- **Testing**: `jest.unstable_mockModule` for ESM-compatible mocking
- **PDF generation**: Puppeteer-core + `@sparticuz/chromium` (not standard puppeteer)
- **AI calls via HTTP**: `fetch` requests to the AI Service (FastAPI), mostly through `proxyAiService` / `fetchWithTimeout`
- **Indexes**: built explicitly with `createIndexes()` for every model after the database connects (Mongoose's automatic build does not run under the `secondaryPreferred` read preference)
- **Response format**: All success responses use `sendSuccess(res, message, data, statusCode)`
- **Error handling**: `AppError` class → global `errorHandler` → JSON error response

## Background Jobs

Started by side-effect imports at the top of `index.js`:
| Job | File | Schedule | Purpose |
|-----|------|----------|---------|
| Keep-alive | `src/shared/jobs/keepAlive.js` | Every 14 min | Prevent Render cold start |
| Badge check | `src/modules/supporting/jobs/achievementScheduler.js` | Daily, `35 11 * * *` (server time) | Badge safety net |
| Daily notifications | `src/modules/notification/jobs/notificationScheduler.js` | Daily, 5 pm IST | Gift reminders for invited friends, teacher class-report and certificate notices |

## Swagger API Docs

Available at `GET /api-docs` in development. Annotations are JSDoc comments on route files. Config at `config/swagger.config.js`.
