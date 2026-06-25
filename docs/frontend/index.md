# CLAUDE.md — Frontend

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # Production build
npm run lint         # ESLint check
npm run preview      # Preview production build
```

> `npm run server` / `npm run dev:server` are defined in package.json but **do not work** — the `server/` directory does not exist. These are legacy scripts; ignore them.

No test suite is configured.

## Environment Variables

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_CLARITY_PROJECT_ID=<project_id>
```

Production API defaults to `https://askaideaibackend.onrender.com/api/v1`.

## Architecture

**AskAideAI** is a React 18 + Vite SPA (not Next.js) — an AI-powered EdTech platform for K-12 students in India. The backend is Express + MongoDB (separate repo), accessed via API.

### Routing (`src/App.jsx`)

All routes lazy-load their components. Three tiers:
- **Public**: `/`, `/login`, `/signup`, `/try`, `/free-paper-generator`, `/blog`, `/blog/:slug`, `/for-schools`, `/feedback`, `/referral`, `/student/:userId`, `/class/:classId/subject/:subjectId`, `/class/:classId/subject/:subjectId/chapter/:chapterId`
- **`<ProtectedRoute>`**: Checks for JWT token — `/study`, `/dashboard`, `/profile`, `/settings`, `/progress`, `/quizzes`, `/quiz/:quizId/attempt/:attemptId`, `/quiz/result/:attemptId`, `/quiz/history`
- **`<RoleProtectedRoute>`**: Checks Redux profile role — `/admin`, `/teacher/*`, `/parent`, `/question-paper/*`

Roles: `SuperAdmin`, `Teacher`, `Parent` (student accounts have no special role).

### State Management

**Redux Toolkit** (`src/store/slices/`) for global state:
- `authSlice` — `token`, `signupData`, `loading`
- `profileSlice` — User object (name, email, role, image, etc.)
- `sessionSlice` — `sessionStarted`, `sessionHistory`, `userAnswers`
- `aiAgentSlice` — AI Assistant conversations, messages, streaming state

**React Context** (`src/contexts/`) for UI state persisted to localStorage:
- `ThemeContext` — dark/light mode via `.dark` class on document root
- `SoundContext` — audio settings

### API Layer (`src/api/`)

Unified Axios instance (`src/api/axios.js`):
- Base URL from `VITE_API_URL`
- Request interceptor: auto-injects JWT from localStorage
- Response interceptor: global error handling
- 30-second timeout

Endpoints are centralized in `src/api/endpoints.js` as nested constants (`ENDPOINTS.AUTH.LOGIN`, `ENDPOINTS.STUDY.QUESTIONS`, etc.).

API operations live in `src/api/*.api.js` as Redux thunks — they dispatch actions, show toasts, and track Clarity events. Always use these functions from components rather than calling Axios directly.

Key API modules:
- `src/api/ai-assistant.api.js` — Teacher AI content generation (quizzes, papers, assignments, notes, worksheets); proxied through Backend → AI Service
- `src/api/admin.api.js` — Admin school/teacher/student/section CRUD
- `src/api/teacher-dashboard.api.js` — Teacher dashboard data
- `src/api/parent.api.js` — Parent dashboard (child progress)
- `src/api/goal.api.js` — Daily student goal management
- `src/api/referral.api.js` — Referral code system
- `src/api/stats.api.js` — Public platform statistics
- `src/api/profile.api.js` — Profile update/photo management

> Note: `src/services/` is a legacy layer; prefer `src/api/` for all new work.

### Styling

- **Tailwind CSS** (utility-first) with custom CSS variables for theming defined in `index.css`
- **Material UI** has been removed — all components now use pure Tailwind CSS. MUI packages remain in `package.json` but are not imported in `src/`.
- Custom fonts: Fraunces (display/serif), Inter Tight (body/sans), JetBrains Mono (monospace) — loaded via Google Fonts in `index.html`
- Dark mode: toggle `.dark` class on document root — CSS variables switch automatically

### Analytics

Microsoft Clarity is integrated throughout (`src/utils/clarity.js`). It's disabled in development. When adding significant user-facing features, track events using `ClarityEvents` and `ClarityTags` constants from that module.

### Key Feature Areas

1. **Study Practice** (`src/components/study/`) — Class → Subject → Chapter → Question flow with AI generation fallback and session tracking
2. **Dashboards** (`src/components/dashboard/`) — Role-specific dashboards (Student, Teacher, Admin, Parent)
3. **Admin Panel** (`src/components/admin/`) — School/Teacher/Student CRUD, bulk operations, chapter PDF upload
4. **Question Paper Generator** (`src/components/question-paper/`) — Board-style exam generation with history/preview
5. **Progress Analytics** (`src/components/progress/`) — Subject/chapter/topic tracking with AI insights
6. **Quizzes** (`src/components/student/quiz/`) — Full assessment lifecycle (list, attempt, result, history)
7. **AI Assistant Widget** (`src/components/ai-agent/`) — Teacher AI content generation widget with streaming
8. **Blog** (`src/components/blog/`) — Blog pages with SEO schema
9. **SEO Landing Pages** (`src/components/seo/`) — SEO-optimized subject/chapter landing pages with structured data
10. **Gamification** (badges, streaks, daily challenges, NPS surveys) — Integrated across components
11. **Referral Program** (`/referral`) — Invite system with share cards
12. **Student Public Profile** (`/student/:userId`) — Shareable student achievement page
13. **Lead Magnet** (`src/components/pages/PublicPaperGenerator.jsx`) — Public-facing paper generation for sales
14. **Feedback** (`src/components/pages/FeedbackForm.jsx`) — User feedback collection

### Key Hooks

#### `useQuestionPolling` (`src/hooks/useQuestionPolling.js`)

Manages question loading, polling (5s intervals, up to 60 polls), and retry logic for the study session question flow. Used by `QuestionPractice.jsx`.

**Returned states:**

| Return | Type | Description |
|--------|------|-------------|
| `mastered` | boolean | `true` when backend returns `status: 'mastered'` — chapter tapped out, all questions exhausted. Drives a celebration milestone (not an error). |
| `error` | string | Full-screen error message. Only set when the failure occurs *before* `everLoadedRef` is true (i.e., no batch has ever loaded). |
| `inlineError` | string | Inline error message. Set when a failure occurs *after* at least one batch has already loaded successfully. |
| `isGenerating` | boolean | `true` while the hook is actively polling for AI-generated questions. |
| `loadQuestions` | function | Call to (re)start loading questions. Pass `true` to suppress the full-screen loader (used for next-batch fetches). |

The `mastered` state is automatically reset to `false` whenever `session.chapterId`, `session.difficulty`, or `session.questionType` changes (via a `useEffect` on line 283).

### File Conventions

- Components: PascalCase `.jsx` (no TypeScript — 0 `.tsx` component files; ~130 components are pure JSX; TypeScript is installed but unused for component files)
- Hooks: camelCase with `use` prefix in `src/hooks/`
- Forms: React Hook Form + Zod schema validation
- Lazy loading: all route-level components use `React.lazy()` in `App.jsx`

## Cross-Repository Integration

This frontend repo depends on two other AskAide AI repos:

| Repo | Path | Purpose |
|------|------|---------|
| **Backend** (Express) | `../Backend` | All API calls via `VITE_API_URL` |
| **AI Service** (FastAPI) | `../ai-service` | Never called directly — proxied through Backend |
| **Shared Contracts** | `../shared-contracts` | Data models + API defs at `data-models.ts`, `api-definitions.md` |

### AI Features (All Proxied Through Backend)

This frontend never directly calls the AI Service. All AI flows go through the Backend:

1. **PDF Upload → AI RAG:** `POST /chapters/create-with-pdf` → Backend uploads to AI Service
2. **AI Learning Insights:** `GET /topic-progress/ai-insights/userid/:userId/chapter/:chapterId` → Backend proxies to AI Service `GET /ai-insights/chapter`
3. **RAG Status Check:** `POST /chapters/check-rag-status` → Backend calls AI Service `POST /search-document`
4. **AI Question Generation:** Triggered automatically when Backend `GET /questions/batch/:chapterId/...` finds insufficient questions

### Key Backend Endpoints Used by This Frontend

See `src/api/endpoints.js` for the full list. Key groups:
- **Auth:** `/authenticate/login`, `/authenticate/signup`, `/authenticate/sendotp`, `/auth/changepassword`
- **Content:** `/study/configuration`, `/classes`, `/subjects`, `/chapters/class/:classId/subject/:subjectId`, `/chapters/check-rag-status`, `/topics/class/:classId/subject/:subjectId`
- **Study:** `/sessions`, `/sessions/:sessionId/end`, `/user-answers/batch`, `/questions/batch/:chapterId/:type/:difficulty/:session`
- **Progress:** `/topic-progress/progress/:userId/subject/:subjectId`, `/topic-progress/ai-insights/*`, `/streaks/:userId`, `/daily-challenge/:userId`, `/badges/:userId`, `/session-feedback/*`
- **Quiz:** `/quiz/*` (20+ endpoints)
- **Teacher Dashboard:** `/teacher-dashboard/*`
- **Admin:** `/schools`, `/teachers`, `/students`, `/sections`
- **AI Assistant:** `/ai-assistant/*`
- **Parent Dashboard:** `/parent-dashboard/*`, `/parent-students/*`
- **Referral:** `/referral/*`
- **Goals:** `/goals`
- **Misc:** `/stats/public`, `/profile/public/:userId`, `/profile/updateDisplayPicture`, `/profile/deleteProfilePhoto`, `/leaderboard`, `/leaderboard/class/:classId`

### Response Envelope Expected

All backend endpoints return:
```json
{ "success": true, "message": "...", "data": { ... } }
```

The `data` field may contain `items` (for paginated lists) or a direct object. The `normalizeListResponse()` helper in `admin.api.js` handles shape inconsistencies.

### When Making Changes

1. **Adding a new API call** → Add endpoint to `src/api/endpoints.js`, create function in `src/api/<name>.api.js`, verify the Backend route exists in `D:\AskAide AI\Backend\routes\v1\`
2. **Changing API response shape** → Update normalization in `.api.js`, check Backend `sendSuccess()` usage
3. **Adding a feature that uses AI** → All AI calls go through Backend only. Never call AI Service directly.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
