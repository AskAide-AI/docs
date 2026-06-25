# Frontend

**React 18 + Vite SPA** — the student, teacher, and admin user interface.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS (utility-first, no MUI) |
| State | Redux Toolkit (global) + React Context (UI/theme) |
| Routing | React Router v6 with lazy-loaded routes |
| HTTP | Axios with JWT interceptor, 30s timeout |
| Forms | React Hook Form + Zod |
| Analytics | Microsoft Clarity |

## Architecture

- **Public routes**: `/`, `/login`, `/signup`, `/try`, `/blog`, `/for-schools`
- **Protected routes** (JWT required): `/study`, `/dashboard`, `/profile`, `/progress`, `/quizzes`
- **Role-protected routes**: `/admin` (SuperAdmin), `/teacher/*`, `/parent/*`

### State Management

- `authSlice` — token, signup data, loading
- `profileSlice` — user object (name, role, image)
- `sessionSlice` — study sessions, answers
- `aiAgentSlice` — AI assistant conversations
- `ThemeContext` / `SoundContext` — persisted to localStorage

### API Layer

Unified Axios instance at `src/api/axios.js`:
- Base URL from `VITE_API_URL` env var
- Request interceptor auto-injects JWT
- Response interceptor handles global errors
- Endpoints centralized in `src/api/endpoints.js`

## Key Feature Areas

1. **Study Practice** — Class → Subject → Chapter → Question flow with AI fallback
2. **Quizzes** — Full assessment lifecycle (list, attempt, result, history)
3. **Admin Panel** — School/Teacher/Student CRUD, bulk ops, chapter PDF upload
4. **Teacher Dashboard** — Class analytics, student progress, weak topics
5. **AI Assistant** — Teacher AI content generation (quizzes, papers, notes)
6. **Progress Analytics** — Subject/chapter/topic tracking with AI insights
7. **Question Paper Generator** — Board-style exam generation with PDF preview
8. **Gamification** — Badges, streaks, daily challenges, NPS surveys

## AI Integration

All AI features are proxied through the Backend — never call AI Service directly:
- PDF upload → `POST /chapters/create-with-pdf`
- AI Insights → `GET /topic-progress/ai-insights/*`
- Question generation → automatic when question batch runs low

## Environment Variables

```
VITE_API_URL=http://localhost:4000/api/v1
VITE_CLARITY_PROJECT_ID=<project_id>
```

Production API defaults to `https://askaideaibackend.onrender.com/api/v1`.
