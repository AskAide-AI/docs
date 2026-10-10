# AskAide AI — Developer Contribution Guide

Welcome to the AskAide AI monorepo. This guide covers everything you need to know to contribute effectively.

---

## 1. Repository Structure Overview

```
AskAideAI/
├── frontend/              React 18 + Vite SPA
│   └── src/
│       ├── api/           axios.js (shared instance + token refresh), endpoints.js,
│       │                  and 19 *.api.js modules (one per domain, e.g. referral,
│       │                  challenge, teacherClass, notification)
│       ├── components/    20 component directories
│       │   ├── admin/
│       │   ├── ai-agent/
│       │   ├── auth/
│       │   ├── blog/
│       │   ├── common/
│       │   ├── dashboard/
│       │   ├── feedback/
│       │   ├── layout/
│       │   ├── notifications/
│       │   ├── pages/
│       │   ├── principal/
│       │   ├── profile/
│       │   ├── progress/
│       │   ├── question-paper/
│       │   ├── seo/
│       │   ├── student/
│       │   ├── study/
│       │   ├── teacher/
│       │   ├── tour/
│       │   └── ui/
│       ├── contexts/      ThemeContext, SoundContext
│       ├── hooks/         useQuestionPolling, useSessionEvents, useTypewriter, useIsMobile,
│       │                  useNotifications, useReferralCode, useFeedbackGate, ...
│       ├── store/slices/  authSlice, profileSlice, sessionSlice, aiAgentSlice
│       └── utils/         incl. acquisition.js (first-touch ?ref= / UTMs),
│                          pendingChallenge.js (guest challenge claim, pending class join)
│
├── Backend/               Express.js + MongoDB API server
│   ├── index.js           Entry point (also imports the cron jobs)
│   ├── routes/v1/index.js Mounts every module router under /api/v1
│   └── src/
│       ├── modules/       19 domain modules: auth, user, content, questions,
│       │   │              progress, question-paper, teacher, quiz, school,
│       │   │              principal, parent, supporting, ai-assistant, feedback,
│       │   │              goal, referral, challenge, notification, campaign
│       │   └── <domain>/
│       │       ├── controllers/
│       │       ├── routes/
│       │       ├── services/
│       │       ├── models/
│       │       ├── validators/
│       │       ├── jobs/        (supporting, notification: node-cron jobs)
│       │       ├── tests/
│       │       └── index.js     barrel that re-exports the routers
│       └── shared/
│           ├── middleware/  auth, apiLogger, errorHandler, validate
│           ├── models/      User, Profile, OTP, UserActivityDay
│           ├── jobs/        keepAlive
│           ├── templates/   email templates
│           └── utils/       cache, responseHandler, mailSender, logger, activityTracker, requestContext
│
├── ai-service/            FastAPI + Python RAG/LLM service
│   ├── main.py            FastAPI app entry
│   ├── config.py          Configuration & env vars
│   ├── services/          rag, upload, query, generate_question, llm_insights, education_ai_agent
│   ├── llm/               openrouter, gemini, openai, anthropic providers
│   ├── db/                mongo_db, qdrant_db, redis_db
│   └── utils/             embedding, chunker, topic_search, topic_embedder, prompt, schema
│
├── shared-contracts/      Shared API definitions & types
│   ├── api-definitions.md
│   ├── data-models.ts
│   ├── data-models.schema.json
│   ├── integration-guide.md
│   └── QUICK_START.md
│
└── docs/                  This file and future documentation
```

### Service Communication

```
Browser → Frontend (:5173) → Backend (:4000) → AI Service (:8000)
```

Frontend **never** calls AI Service directly. All AI requests go through Backend.

---

## 2. Coding Standards

### Frontend & Backend (JavaScript)

- **ES Modules**: Use `import`/`export`, never `require()` in new code.
- **No TypeScript** (unless migrating): Current codebase is plain JS with JSDoc annotations.
- **Async/await**: Preferred over raw Promises.
- **Destructuring**: Use for function params and object access where it improves readability.
- **Naming**:
  - Files: `kebab-case.js` (e.g., `content.service.js`)
  - Variables/functions: `camelCase`
  - React components: `PascalCase` filenames (e.g., `Dashboard.jsx`)
  - Constants: `UPPER_SNAKE_CASE`
  - MongoDB models: `PascalCase` export, file in lowercase (`user.model.js`)
- **No `var`**: Use `const` by default, `let` only when reassignment is needed.
- **Error handling**: Always use `asyncHandler` in Backend controllers. Propagate meaningful errors via `AppError`.
- **Validation**: Use Joi validators in `validators/` directories. Never trust req.body.

### AI Service (Python)

- **Python 3.10+** with type hints on all public functions.
- **FastAPI conventions**: Use `Depends()` for dependency injection, Pydantic models for request/response schemas.
- **Naming**:
  - Files: `snake_case.py`
  - Functions/variables: `snake_case`
  - Classes: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
- **Docstrings**: Google-style docstrings on all service functions and public APIs.
- **Async**: Use `async def` for FastAPI routes and any I/O-bound operations.
- **Imports**: Group as stdlib → third-party → local. Use absolute imports within the project.
- **Error handling**: Raise `HTTPException` with appropriate status codes. Log errors with structured context.
- **Configuration**: All secrets and tunables go through `config.py`. Never hardcode credentials.

### Cross-Service Conventions

- **Shared Contracts**: When changing request/response shapes crossing Backend ↔ AI Service, update `shared-contracts/` files.
- **API versions**: All endpoints are prefixed with `/api/v1/` (Backend) or root-level (AI Service).
- **Logging**: Use the project's logger (`logger` in Backend, `logging` in AI Service). No `console.log` or `print()` in production paths.

---

## 3. How to Add a New Feature (End-to-End)

This is the full workflow when a feature spans multiple services.

### Step 1: Define the API Contract

1. Open `shared-contracts/api-definitions.md`.
2. Document the new endpoint(s), request body, and response shape.
3. Update `shared-contracts/data-models.ts` with any new TypeScript types.
4. Update `shared-contracts/data-models.schema.json` if applicable.

### Step 2: Backend Implementation

1. Create a new module under `src/modules/<feature>/`:
   ```
   controllers/<feature>.controller.js
   routes/<feature>.routes.js
   services/<feature>.service.js
   models/<feature>.model.js
   validators/<feature>.validator.js
   ```
2. Define the Joi validator in `validators/`.
3. Implement business logic in `services/`.
4. Write the controller using `asyncHandler`.
5. Wire routes in `routes/`, re-export the router from the module's `index.js`, and mount it in `routes/v1/index.js`.
6. If the feature needs AI, call the AI Service from the service layer (`proxyAiService()` in `src/shared/utils/requestContext.js` adds the `x-api-key` and correlation headers).

### Step 3: AI Service Implementation (if needed)

1. Add a new service file in `services/` (e.g., `services/my_feature_service.py`).
2. Create a new route in `main.py` or a dedicated router file.
3. Define Pydantic request/response models in `utils/schema.py`.
4. Implement the logic, using existing LLM providers from `llm/` and DB clients from `db/`.
5. Test the endpoint independently via FastAPI's `/docs`.

### Step 4: Frontend Implementation

1. Add the URLs to `src/api/endpoints.js` and create an API module `src/api/myFeature.api.js` (export it from `src/api/index.js`).
2. Export functions that call the Backend endpoints through the shared axios instance.
3. Create components under `src/components/<domain>/`.
4. Add any new Redux slices in `src/store/slices/` if state management is needed.
5. Wire routing in `src/App.jsx` or the relevant router config.

### Step 5: Testing

- Write Backend unit tests for the service and controller.
- Write AI Service unit tests (pytest) for the new service function.
- Write Frontend component tests if applicable.
- Run the full test suite before pushing.

### Step 6: Documentation

- Update `shared-contracts/api-definitions.md` with final contract.
- Add any new environment variables to the relevant `.env.example`.

---

## 4. How to Add a New API Endpoint

### Backend

The Backend is ESM (`import`/`export`, `.js` extensions in import paths).

1. **Validator** — `src/modules/<module>/validators/<module>.validator.js`
   ```js
   import Joi from 'joi';

   // validate() checks any of body, query and params.
   export const myEndpointSchema = {
     body: Joi.object({
       field: Joi.string().required(),
       count: Joi.number().integer().min(1).default(10),
     }),
   };
   ```

2. **Service** — `src/modules/<module>/services/<module>.service.js`
   ```js
   import MyModel from '../models/<module>.model.js';

   class MyService {
     async myEndpoint(userId, params) {
       return MyModel.find({ userId, ...params }).lean();
     }
   }

   export default new MyService();
   ```

3. **Controller** — `src/modules/<module>/controllers/<module>.controller.js`
   ```js
   import myService from '../services/<module>.service.js';
   import { asyncHandler } from '../../../shared/middleware/index.js';
   import { sendSuccess } from '../../../shared/utils/index.js';

   export const myEndpoint = asyncHandler(async (req, res) => {
     const data = await myService.myEndpoint(req.user.id, req.body);
     return sendSuccess(res, 'Done', data); // → { success, message, data }
   });
   ```

4. **Route** — `src/modules/<module>/routes/<module>.routes.js`
   ```js
   import express from 'express';
   import { auth, validate } from '../../../shared/middleware/index.js';
   import * as myController from '../controllers/<module>.controller.js';
   import { myEndpointSchema } from '../validators/<module>.validator.js';

   const router = express.Router();
   router.post('/my-endpoint', auth, validate(myEndpointSchema), myController.myEndpoint);

   export default router;
   ```

5. **Export** the router from `src/modules/<module>/index.js`:
   ```js
   export { default as myRoutes } from './routes/<module>.routes.js';
   ```

6. **Mount** it in `routes/v1/index.js` (everything there is served under `/api/v1`):
   ```js
   import { myRoutes } from '../../src/modules/<module>/index.js';
   router.use('/<module>', myRoutes);
   ```

### Frontend

1. **Endpoint + API module** — add the URL to `src/api/endpoints.js`, then create `src/api/myFeature.api.js`:
   ```js
   import api from './axios'; // shared Axios instance (adds the JWT, refreshes expired tokens)
   import { ENDPOINTS } from './endpoints';

   export const myFeatureApi = {
     myEndpoint: async (body) => {
       const response = await api.post(ENDPOINTS.MY_FEATURE.MY_ENDPOINT, body);
       return response.data.data; // unwrap { success, message, data }
     },
   };
   ```
   Export it from `src/api/index.js`. Raw `fetch` calls (streaming, file downloads) must use `authorizedFetch()` from `axios.js` so expired tokens are refreshed the same way.

2. **Component usage**:
   ```jsx
   import { myFeatureApi } from '../../api';

   const handleAction = async () => {
     const data = await myFeatureApi.myEndpoint({ field: 'value' });
     // use data
   };
   ```

---

## 5. How to Add a New AI Capability

1. **Choose the right layer**:
   - Pure LLM call → `llm/` providers
   - RAG pipeline → `services/rag.py`
   - Embedding logic → `utils/embedding.py`

2. **Create the service** — `services/my_capability.py`
   ```python
   from fastapi import APIRouter, HTTPException
   from pydantic import BaseModel
   from services.my_capability import run_my_capability

   router = APIRouter()

   class MyCapabilityRequest(BaseModel):
       query: str
       context: str | None = None

   class MyCapabilityResponse(BaseModel):
       result: str
       confidence: float

   @router.post("/my-capability", response_model=MyCapabilityResponse)
   async def my_capability_endpoint(req: MyCapabilityRequest):
       try:
           return await run_my_capability(req.query, req.context)
       except Exception as e:
           raise HTTPException(status_code=500, detail=str(e))
   ```

3. **Register the router** in `main.py`:
   ```python
   from routers.my_capability import router as my_capability_router
   app.include_router(my_capability_router, tags=["my-capability"])
   ```

4. **Wire from Backend** — add the call in the appropriate Backend service/controller.

5. **Test independently** via `http://localhost:8000/docs` (Swagger UI).

### LLM Provider Pattern

To add a new LLM provider:

1. Create `llm/my_provider.py` implementing the standard interface:
   ```python
   async def generate(prompt: str, **kwargs) -> str:
       ...
   ```
2. Add the provider selection logic in `config.py` under `LLM_PROVIDER`.
3. Update the provider factory in whichever service dispatches LLM calls.
4. Register it in `PROVIDERS` in `services/llm_admin.py` (key and model env vars) so it can be tested and made live from /admin → AI System.

---

## 6. How to Add a New Frontend Component

### Step 1: Identify the component directory

Place it in the appropriate domain folder under `src/components/`:

| Domain | Directory |
|--------|-----------|
| Admin panel | `admin/` |
| Authentication | `auth/` |
| Blog | `blog/` |
| Shared/reusable | `common/` or `ui/` |
| Dashboard widgets | `dashboard/` |
| Navigation/layout | `layout/` |
| Routes/pages | `pages/` |
| Progress tracking | `progress/` |
| Question paper builder | `question-paper/` |
| SEO components | `seo/` |
| Study materials | `study/` |
| Student quiz UI | `student/quiz/` |
| Teacher tools | `teacher/` |

### Step 2: Create the component

```jsx
// src/components/dashboard/MyWidget.jsx
import { useState, useEffect } from 'react';

const MyWidget = ({ data, onAction }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // effect logic
  }, [data]);

  return (
    <div className="my-widget">
      {/* JSX */}
    </div>
  );
};

export default MyWidget;
```

### Step 3: Follow conventions

- One component per file.
- Use the centralized Axios instance from `src/api/axios.js` (through the `src/api/*.api.js` modules) for API calls.
- Use Redux (`useSelector`/`useDispatch`) for global state; use local state for UI-only concerns.
- Access theme via `useContext(ThemeContext)`.
- Use existing `ui/` primitives before building new UI elements.

### Step 4: Add tests

Place test files adjacent to components: `MyWidget.test.jsx`.

---

## 7. How to Add a New MongoDB Model

### Backend (shared models or module models)

1. **Create the model file** — `src/modules/<module>/models/<module>.model.js` or `src/shared/models/`
   ```js
   const mongoose = require('mongoose');

   const mySchema = new mongoose.Schema(
     {
       name: { type: String, required: true, trim: true },
       email: { type: String, required: true, unique: true, lowercase: true },
       role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
       metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
     },
     {
       timestamps: true,
     }
   );

   mySchema.index({ email: 1 }, { unique: true });

   module.exports = mongoose.model('MyModel', mySchema);
   ```

2. **Guidelines**:
   - Always set `timestamps: true` for auditability.
   - Add `unique` constraints where business logic requires them.
   - Use `enum` for fixed-value fields.
   - Store `Mixed` types only for unstructured metadata, not for queryable fields.
   - Add indexes for fields used in `find()`, `sort()`, or `aggregate()`.
   - Models used across modules go in `src/shared/models/`. Module-specific models stay in the module.

3. **Migration**: If changing an existing schema, ensure backward compatibility or write a migration script.

---

## 8. Testing Guidelines

### Backend

- **Framework**: Jest (check `package.json` for config).
- **Location**: `tests/` directory or co-located `*.test.js` files.
- **What to test**:
  - Service layer (business logic) — unit tests with mocked DB.
  - Controller layer — integration tests with mocked services.
  - Route-level — supertest for API contract verification.
- **Run**: `npm test` (or `npm run test:unit`, `npm run test:integration`).

### Frontend

- **Framework**: Vitest + React Testing Library (standard with Vite).
- **Location**: Co-located `*.test.jsx` files.
- **What to test**:
  - Component rendering and user interactions.
  - Redux slice reducers and selectors.
  - Custom hooks with `renderHook`.
- **Run**: `npm test` from `/frontend/`.

### AI Service

- **Framework**: pytest.
- **Location**: `tests/` directory.
- **What to test**:
  - Service functions with mocked LLM responses.
  - Pydantic schema validation.
  - Database query builders.
- **Run**: `pytest` from `/ai-service/`.

### General Rules

- Test files should be self-contained with no external dependencies.
- Mock all external calls (DB, HTTP, LLM providers) in unit tests.
- Aim for tests that are deterministic — no reliance on real services.
- Each PR should include tests for new functionality.

---

## 9. Git Workflow & PR Process

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<short-description>` | `feature/question-paper-builder` |
| Bug fix | `fix/<short-description>` | `fix/auth-token-refresh` |
| Hotfix | `hotfix/<short-description>` | `hotfix/login-500-error` |
| Refactor | `refactor/<short-description>` | `refactor/rag-pipeline` |

### Workflow

1. **Branch off** from `main` (or the active development branch).
2. **Commit early, commit often** — atomic commits with clear messages:
   ```
   feat(backend): add question paper generation endpoint
   fix(ai-service): handle empty embedding vector
   feat(frontend): add question paper builder UI
   ```
   Format: `<type>(<scope>): <description>`
   Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`

3. **Keep PRs focused** — one feature or fix per PR. If a change spans all three services, the PR can include all changes but the description should clearly map each change to its service.

4. **PR Description Template**:
   ```
   ## What
   Brief description of the change.

   ## Why
   Motivation / linked issue.

   ## How
   Implementation approach.

   ## Testing
   How this was tested.

   ## Screenshots (if UI)
   Before/after.
   ```

5. **Before requesting review**:
   - Run linting (`npm run lint` in frontend/Backend, `ruff check` in AI Service).
   - Run type checks where applicable.
   - Run the full test suite.
   - Verify the app starts and the changed flows work end-to-end.

6. **Merge strategy**: Squash merge for feature branches. Rebase for clean history on `main`.

---

## 10. Code Review Checklist

Reviewers should verify:

### Functionality
- [ ] Does the code do what it claims?
- [ ] Are edge cases handled (empty states, null values, errors)?
- [ ] Are new API endpoints documented in `shared-contracts/`?

### Code Quality
- [ ] Follows naming conventions for the service?
- [ ] No dead code or commented-out blocks?
- [ ] No hardcoded values that should be in config/env?
- [ ] Error messages are descriptive and actionable?

### Security
- [ ] No secrets, keys, or tokens in source code?
- [ ] Input validation on all user-facing endpoints?
- [ ] Auth guards applied to protected routes?
- [ ] Role-based access control enforced?
- [ ] No SQL/NoSQL injection vectors?

### Performance
- [ ] Database queries are indexed for the access pattern?
- [ ] No N+1 query patterns?
- [ ] Pagination used for list endpoints?
- [ ] Unnecessary re-renders avoided in React components?

### Testing
- [ ] New code has corresponding tests?
- [ ] Tests are deterministic (no flakiness)?
- [ ] Mocks are appropriate (not too broad, not too narrow)?

### Cross-Service
- [ ] Request/response shapes match `shared-contracts/`?
- [ ] Backend → AI Service calls handle timeouts and errors?
- [ ] Frontend gracefully handles all API response shapes?

---

## 11. Common Gotchas and Anti-Patterns

### Frontend

| Gotcha | Fix |
|--------|-----|
| Calling AI Service directly from frontend | All AI calls go through Backend (`VITE_API_URL`) |
| Storing JWT in localStorage | Use httpOnly cookies or follow the existing auth pattern |
| Inline styles for complex components | Use CSS modules or the existing styling approach |
| Importing from `../../` deep paths | Use path aliases if configured, or reorganize |
| Missing error boundaries | Wrap async component logic in try/catch or error boundaries |
| Not using the centralized Axios instance | Always go through `src/api/axios.js` — it adds the JWT, refreshes expired tokens and sets the base URL |

### Backend

| Gotcha | Fix |
|--------|-----|
| Missing `asyncHandler` in controllers | Every async route handler must be wrapped |
| Not using `AppError` for business errors | Use `throw new AppError('message', statusCode)` |
| Joi validation bypassed | Always apply `validate` middleware before the controller |
| Circular dependencies between modules | Services should not import from sibling modules' services |
| Storing large objects in MongoDB without indexes | Add indexes or use a different storage strategy |
| Not handling AI Service downtime | Always implement fallback/timeout when calling AI Service |

### AI Service

| Gotcha | Fix |
|--------|-----|
| Blocking async operations | Use `await` or `asyncio.gather` for concurrent I/O |
| Hardcoding model names or prompts | Put in `config.py` or `utils/prompt.py` |
| No rate limiting on LLM calls | Implement retry logic with backoff |
| Ignoring embedding dimension mismatches | Validate vector dimensions before Qdrant operations |
| Not cleaning up Redis connections | Use async context managers or connection pools |
| Logging sensitive data (user queries, PII) | Sanitize logs; never log raw user content in production |

### General

| Gotcha | Fix |
|--------|-----|
| Committing `.env` files | Always `.gitignore` `.env`; commit `.env.example` only |
| Not updating shared contracts | Any API shape change must be reflected in `shared-contracts/` |
| Feature branches going stale | Rebase on `main` regularly; keep PRs under 500 lines |
| Skipping linting before push | Run linter as part of your pre-push hook or CI |
| Assuming libraries are available | Check `package.json` / `requirements.txt` before importing |
| console.log/print in production code | Remove before PR; use the project logger |

---

## Quick Reference: Key Files

| Purpose | Location |
|---------|----------|
| Backend entry point | `Backend/index.js` |
| Backend route mounts | `Backend/routes/v1/index.js` |
| Backend cron jobs | `Backend/src/shared/jobs/keepAlive.js`, `Backend/src/modules/supporting/jobs/achievementScheduler.js`, `Backend/src/modules/notification/jobs/notificationScheduler.js` |
| Frontend entry point | `frontend/src/main.jsx` (routes in `frontend/src/App.jsx`) |
| AI Service entry point | `ai-service/main.py` |
| API contract docs | `shared-contracts/api-definitions.md` |
| Shared TS types | `shared-contracts/data-models.ts` |
| Frontend API client | `frontend/src/api/axios.js`, `frontend/src/api/endpoints.js` |
| Backend auth middleware | `Backend/src/shared/middleware/auth.js` |
| Backend error handler | `Backend/src/shared/middleware/errorHandler.js` |
| AI config | `ai-service/config.py` |
| AI LLM providers | `ai-service/llm/` |

---

*Last updated: October 2026*
