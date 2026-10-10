# Frontend Architecture

## Routing (`src/App.jsx`)

All routes use `React.lazy()` for code splitting. Three tiers:

### Public Routes
| Path | Component |
|------|-----------|
| `/` | Landing |
| `/login`, `/signup` | Auth |
| `/try`, `/free-paper-generator` | Lead gen |
| `/about`, `/pricing`, `/how-it-works` | Company pages |
| `/blog`, `/blog/:slug` | Blog |
| `/for-schools` | Schools |
| `/feedback` | Engagement |
| `/class/:classId` (+ `/subject/:subjectId`, `/chapter/:chapterId`) | SEO curriculum pages |
| `/c/:code` | Challenge a friend (no login) |
| `/join/:code` | Join a teacher's class |
| `/student/:userId` | Public profile |

### Protected Routes (`<ProtectedRoute>` — JWT required)
| Path | Component |
|------|-----------|
| `/study` | Study practice |
| `/dashboard` | User dashboard |
| `/profile`, `/settings` | Account |
| `/progress` | Learning analytics |
| `/quizzes`, `/quiz/*` | Quiz lifecycle |
| `/referral` | Refer & Earn |
| `/c/:code/results` | Challenge answers and scoreboard |
| `/suggestions`, `/whats-new` | Engagement |

### Role-Protected Routes (`<RoleProtectedRoute>`)
| Path | Role |
|------|------|
| `/admin` | SuperAdmin |
| `/teacher/*` (incl. `/teacher/classes`) | SuperAdmin, Teacher, Parent |
| `/principal/*` | SuperAdmin, Principal |
| `/parent/*` | SuperAdmin, Parent |
| `/question-paper/*` | SuperAdmin, Teacher |

Signed-in pages also set their own tab title (`<Page> | AskAide`) from `APP_TITLES` in `App.jsx`.

## API Layer

### Axios Setup (`src/api/axios.js`)
- Base URL: `VITE_API_URL` env variable
- Request interceptor: auto-injects JWT from `localStorage`
- Response interceptor: on a `tokenExpired` 401, refreshes the access token and retries. `refreshAccessToken()` runs one refresh at a time per tab and, through a Web Lock, across tabs. Any other 401 clears the tokens and sends the user to `/login`.
- `authorizedFetch()`: `fetch` with the same refresh-and-retry, for calls axios can't make (the teacher AI stream, PDF downloads)
- 30-second timeout

### Endpoint Organization (`src/api/endpoints.js`)
Nested constants — `ENDPOINTS.AUTH.LOGIN`, `ENDPOINTS.STUDY.QUESTIONS`, etc.

### API Modules (`src/api/*.api.js`)
Operation modules (19). `auth.api.js` returns Redux thunks that dispatch actions, show toasts, and track Clarity events; the others are plain promise functions:
- `auth.api.js` — Login, signup (email and Google), logout, password reset, profile picture
- `study.api.js` — Study config, questions, sessions, answers, progress, streaks, badges
- `quiz.api.js` — Teacher quiz authoring and student attempts
- `questionPaper.api.js` — Question paper generator (incl. public lead magnet)
- `ai-assistant.api.js` — Teacher AI content generation
- `admin.api.js` — School/teacher/student CRUD, admin metrics, AI System (live LLM status/test/switch)
- `teacher-dashboard.api.js` — Class analytics
- `teacherClass.api.js` — Teacher class links and the public join page
- `principal.api.js` — School-scoped analytics
- `parent.api.js` — Child progress
- `goal.api.js` — Daily goals
- `referral.api.js` — Invite link, referral redeem, practice-paper reward
- `challenge.api.js` — Challenge a friend
- `notification.api.js` — Notification bell (list, unread count, mark read)
- `stats.api.js` — Public platform stats
- `profile.api.js` — Public profile, name edit, email change
- `feedback.api.js`, `suggestion.api.js`, `behavioral.api.js` — Feedback and suggestions

## State Management

### Redux Slices (`src/store/slices/`)
| Slice | Purpose |
|-------|---------|
| `authSlice` | Token, refresh token, signup data, loading state |
| `profileSlice` | User object (name, email, role, image) |
| `sessionSlice` | Session tracking, user answers |
| `aiAgentSlice` | AI assistant conversations, streaming |

### React Context (`src/contexts/`)
| Context | Storage | Purpose |
|---------|---------|---------|
| `ThemeContext` | localStorage | Dark/light mode via `.dark` class |
| `SoundContext` | localStorage | Audio settings |

### Shared store outside Redux
`src/hooks/useNotifications.js` keeps the notification bell's unread count and panel state in a module-level store read with `useSyncExternalStore`. One poller refreshes the count every 60 s while the tab is visible, and when the tab comes back into view. Every bell, the BottomNav Menu badge and the toaster read the same value.

## Conventions

- **Components**: PascalCase `.jsx` (no TypeScript)
- **Hooks**: camelCase with `use` prefix in `src/hooks/`
- **Forms**: React Hook Form + Zod schema validation
- **API calls**: through `src/api/*.api.js` thunks only
- **No inline styles**: Tailwind utility classes only
- **Lazy loading**: all route components use `React.lazy()`
- **No array indices as keys** in lists
- **Error boundaries**: wrap feature sections
