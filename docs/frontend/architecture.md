# Frontend Architecture

## Routing (`src/App.jsx`)

All routes use `React.lazy()` for code splitting. Three tiers:

### Public Routes
| Path | Component |
|------|-----------|
| `/` | Landing |
| `/login`, `/signup` | Auth |
| `/try`, `/free-paper-generator` | Lead gen |
| `/blog`, `/blog/:slug` | Blog |
| `/for-schools` | Sales |
| `/feedback`, `/referral` | Engagement |
| `/student/:userId` | Public profile |

### Protected Routes (`<ProtectedRoute>` — JWT required)
| Path | Component |
|------|-----------|
| `/study` | Study practice |
| `/dashboard` | User dashboard |
| `/profile`, `/settings` | Account |
| `/progress` | Learning analytics |
| `/quizzes`, `/quiz/*` | Quiz lifecycle |

### Role-Protected Routes (`<RoleProtectedRoute>`)
| Path | Role |
|------|------|
| `/admin/*` | SuperAdmin |
| `/teacher/*` | Teacher |
| `/parent/*` | Parent |
| `/question-paper/*` | Teacher |

## API Layer

### Axios Setup (`src/api/axios.js`)
- Base URL: `VITE_API_URL` env variable
- Request interceptor: auto-injects JWT from `localStorage`
- Response interceptor: global error handling with toast
- 30-second timeout

### Endpoint Organization (`src/api/endpoints.js`)
Nested constants — `ENDPOINTS.AUTH.LOGIN`, `ENDPOINTS.STUDY.QUESTIONS`, etc.

### API Modules (`src/api/*.api.js`)
Redux thunks that dispatch actions, show toasts, and track Clarity events:
- `ai-assistant.api.js` — Teacher AI content generation
- `admin.api.js` — School/teacher/student CRUD
- `teacher-dashboard.api.js` — Class analytics
- `parent.api.js` — Child progress
- `goal.api.js` — Daily goals
- `referral.api.js` — Referral system
- `stats.api.js` — Public platform stats
- `profile.api.js` — Profile updates

## State Management

### Redux Slices (`src/store/slices/`)
| Slice | Purpose |
|-------|---------|
| `authSlice` | Token, signup data, loading state |
| `profileSlice` | User object (name, email, role, image) |
| `sessionSlice` | Session tracking, user answers |
| `aiAgentSlice` | AI assistant conversations, streaming |

### React Context (`src/contexts/`)
| Context | Storage | Purpose |
|---------|---------|---------|
| `ThemeContext` | localStorage | Dark/light mode via `.dark` class |
| `SoundContext` | localStorage | Audio settings |

## Conventions

- **Components**: PascalCase `.jsx` (no TypeScript)
- **Hooks**: camelCase with `use` prefix in `src/hooks/`
- **Forms**: React Hook Form + Zod schema validation
- **API calls**: through `src/api/*.api.js` thunks only
- **No inline styles**: Tailwind utility classes only
- **Lazy loading**: all route components use `React.lazy()`
- **No array indices as keys** in lists
- **Error boundaries**: wrap feature sections
