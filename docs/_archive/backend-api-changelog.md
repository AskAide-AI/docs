# Backend API Changelog

Tracks notable changes to the Backend API surface.

## 2026

### June 2026

#### Added
- `GET /topic-progress/ai-insights/teacher/class` — Teacher class-level aggregated insight
- `POST /ai-assistant/continue` — Follow-up clarifications for AI content generation

### May 2026

#### Added
- `GET /progress/dashboard/:userId` — Optimized dashboard progress query (replaces N+1 pattern)
- `POST /leaderboard` — Leaderboard with class-level filtering

#### Changed
- `GET /questions/batch/:chapterId/:type/:difficulty/:session` — Added yield-based mastery integration; returns `status: "mastered"` when chapter is exhausted
- Redis caching layer added for frequently accessed data

### April 2026

#### Added
- `POST /quiz/:quizId` — Teacher quiz CRUD (create, update, delete)
- `POST /quiz/:quizId/questions` — Add questions to quiz
- `POST /quiz/attempt/:attemptId/submit` — Submit quiz attempt
- `POST /ai-assistant/*` — Teacher AI content generation endpoints
- `POST /question-paper` — Question paper generation and preview
- `POST /goals` — Student daily goal management
- `POST /referral/*` — Referral code system
- `POST /parent-dashboard/*` — Parent dashboard endpoints
- `GET /parent-students/*` — Parent-student linking

### March 2026

#### Added
- `POST /badges/check` — Real-time badge achievement check
- `POST /daily-challenge/:userId` — Daily challenge system
- `POST /session-feedback` — Session feedback collection
- `GET /streaks/:userId` — Streak tracking
- `GET /teacher-dashboard/:teacherId/*` — Teacher dashboard endpoints

### February 2026

#### Added
- `GET /topic-progress/ai-insights/chapter` — Chapter AI insights (proxied to AI Service)
- `GET /topic-progress/ai-insights/subject` — Subject AI insights (proxied to AI Service)

### January 2026

#### Added
- Section management CRUD
- Teacher-student linking with section filtering
- Bulk student/teacher upload

## 2025

### Initial Release (December 2025)

#### Core
- Auth: login, signup, OTP verification, password reset
- Content: classes, subjects, chapters CRUD
- Study: sessions, questions batch, user answers
- Progress: topic progress tracking
- Admin: school management, teacher management, student management
- Chapter PDF upload with AI processing
- Swagger API docs at `GET /api-docs`
