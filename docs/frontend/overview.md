# Frontend

**React 18 + Vite SPA** — the student, teacher, and admin user interface.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS (utility-first, no MUI) |
| State | Redux Toolkit (global) + React Context (UI/theme) |
| Routing | React Router v7 with lazy-loaded routes |
| HTTP | Axios with JWT interceptor, 30s timeout |
| Forms | React Hook Form + Zod |
| Analytics | Microsoft Clarity |

## Architecture

- **Public routes**: `/`, `/login`, `/signup`, `/try`, `/about`, `/pricing`, `/how-it-works`, `/blog`, `/for-schools`, `/class/...` (SEO pages), `/c/:code` (challenge a friend), `/join/:code` (join a teacher's class)
- **Protected routes** (JWT required): `/study`, `/dashboard`, `/profile`, `/progress`, `/referral`, `/quizzes`, `/c/:code/results`
- **Role-protected routes**: `/admin` (SuperAdmin), `/teacher/*`, `/principal/*`, `/parent/*`, `/question-paper/*`

### State Management

- `authSlice` — token, refresh token, signup data, loading
- `profileSlice` — user object (name, role, image)
- `sessionSlice` — study sessions, answers
- `aiAgentSlice` — AI assistant conversations
- `ThemeContext` / `SoundContext` — persisted to localStorage
- `useNotifications` — small shared store (outside Redux) for the notification bell's unread count and panel

### API Layer

Unified Axios instance at `src/api/axios.js`:
- Base URL from `VITE_API_URL` env var
- Request interceptor auto-injects JWT
- Response interceptor refreshes an expired access token, once at a time across all tabs, and retries
- Raw `fetch` calls (AI streaming, PDF download) go through `authorizedFetch()`, which refreshes the same way
- Endpoints centralized in `src/api/endpoints.js`

## Key Feature Areas

1. **Study Practice** — Class → Subject → Chapter → Question flow with AI fallback
2. **Quizzes** — Full assessment lifecycle (list, attempt, result, history)
3. **Admin Panel** — School/Teacher/Student CRUD, bulk ops, chapter PDF upload
4. **Teacher Dashboard** — Class analytics, student progress, weak topics
5. **AI Assistant** — Teacher AI content generation (quizzes, papers, notes)
6. **Progress Analytics** — Subject/chapter/topic tracking with AI insights
7. **Question Paper Generator** — Board-style exam generation with PDF preview
8. **Gamification** — Badges, streaks, daily challenges, weekly leaderboard, NPS surveys
9. **Challenges & Referral** — Challenge a friend on WhatsApp, Refer & Earn gifts, invite attribution
10. **Class Links** — Teachers self-sign-up and bring students in with a link or QR code
11. **Notifications** — In-app bell, panel and toast

## AI Integration

All AI features are proxied through the Backend — never call AI Service directly:
- PDF upload → `POST /chapters/create-with-pdf`
- AI Insights → `GET /topic-progress/ai-insights/*`
- Question generation → automatic when question batch runs low

## Environment Variables

```
VITE_API_URL=http://localhost:4000/api/v1
VITE_SITE_URL=https://askaide.in
VITE_GOOGLE_CLIENT_ID=<google_oauth_client_id>
VITE_CLARITY_PROJECT_ID=<project_id>
VITE_CONTACT_EMAIL=hello@askaide.in
```

If `VITE_API_URL` is unset, `vite.config.ts` (PWA API cache rule) and the chapter-content snapshot script fall back to the production backend URL. The axios client has no fallback, so requests then go to the frontend's own origin and fail.
