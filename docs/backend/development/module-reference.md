# Backend Module Reference

All modules follow `src/modules/<name>/` with `controller`, `service`, `validators`, `routes`, and `models` subfolders.

## Auth Module

**Path:** `src/modules/auth/`
**Purpose:** Authentication, authorization, token management

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/authenticate/login` | POST | Rate-limited | `{ userName, password }` → `{ user, tokens }` |
| `/authenticate/signup` | POST | Rate-limited | `{ name, email, password, role }` |
| `/authenticate/google` | POST | Rate-limited | Google ID token auth |
| `/authenticate/refresh` | POST | - | Token refresh |
| `/authenticate/logout` | POST | - | Revoke refresh token |
| `/authenticate/changepassword` | POST | auth | Password change |
| `/authenticate/reset-password-token` | POST | - | Send reset email |
| `/authenticate/reset-password` | POST | - | Reset with token |
| `/authenticate/verify-email` | POST | - | OTP verification |

**Token model:** accessToken (2h) + refreshToken (7d) with rotation. Max 5 active refresh tokens per user.

## Content Module

**Path:** `src/modules/content/`
**Purpose:** Class, subject, chapter, topic management + PDF upload

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/classes` | GET | auth | List classes |
| `/subjects` | GET | auth | List subjects |
| `/subjects/class/:classId` | GET | auth | Subjects by class |
| `/chapters` | POST | teacher | Create chapter |
| `/chapters/create-with-pdf` | POST | teacher | Multipart PDF + metadata — triggers AI RAG |
| `/chapters/check-rag-status` | POST | auth | Check AI RAG data existence |
| `/chapters/class/:classId/subject/:subjectId` | GET | none | Chapters with topics |
| `/chapters` | DELETE | teacher | Delete chapters (also calls AI delete-document) |
| `/topic` | POST | teacher | Create topic |
| `/topic/get-topics-by-chapter/:chapterId` | GET | auth | Topics by chapter |

## Questions Module

**Path:** `src/modules/questions/`
**Purpose:** Question CRUD, batch fetching, AI generation trigger

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/questions` | POST | teacher | Create question |
| `/questions/chapter/:chapterId` | GET | auth | All questions for chapter |
| `/questions/batch/chapter/:chapterId/type/:questionType/difficulty/:difficulty/session/:sessionId` | GET | auth | Batched — calls AI if insufficient |
| `/questions/public-batch/chapter/:chapterId` | GET | none | Public (Try Now) |

**Batch response statuses:**
- `generating` — AI job in flight; poll again
- `failed` — last attempt errored; retry with `?retry=true`
- `mastered` — content exhausted; offer next chapter

## Quiz Module

**Path:** `src/modules/quiz/`
**Purpose:** Full quiz lifecycle management

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/quiz` | POST | auth | Create quiz |
| `/quiz/:quizId` | GET/PUT/DELETE | auth | CRUD |
| `/quiz/:quizId/publish` | POST | auth | Publish |
| `/quiz/:quizId/close` | POST | auth | Close |
| `/quiz/:quizId/clone` | POST | auth | Clone |
| `/quiz/:quizId/analytics` | GET | auth | Analytics |
| `/quiz/:quizId/questions` | POST | auth | Add question |
| `/quiz/:quizId/questions/:questionId` | DELETE | auth | Remove question |
| `/quiz/:quizId/questions/reorder` | PUT | auth | Reorder |
| `/quiz/questions/search` | GET | auth | Question bank search |
| `/quiz/student/available` | GET | auth | Available quizzes |
| `/quiz/student/history` | GET | auth | Quiz history |
| `/quiz/:quizId/start` | POST | auth | Start attempt |
| `/quiz/attempt/:attemptId/answer` | POST | auth | Submit answer |
| `/quiz/attempt/:attemptId/submit` | POST | auth | Submit attempt |
| `/quiz/attempt/:attemptId/result` | GET | auth | Attempt result |

## Progress Module

**Path:** `src/modules/progress/`
**Purpose:** Topic progress tracking, AI insights, streaks, badges

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/topic-progress/progress/:userId/chapter/:chapterId` | GET | Chapter progress |
| `/topic-progress/progress/:userId/subject/:subjectId` | GET | Subject progress |
| `/topic-progress/ai-insights/...` | GET | AI learning insights |
| `/topic-progress/mastery-summary/:userId` | GET | Mastery overview |
| `/progress/user/:userId` | GET | Progress dashboard |
| `/streaks/:userId` | GET | Streak data |
| `/streaks/:userId/use-freeze` | POST | Use streak freeze |
| `/daily-challenge/:userId` | GET/POST | Daily challenges |
| `/badges/:userId` | GET | User badges |
| `/badges/check` | POST | Trigger badge check |
| `/session-feedback/reaction` | POST | Session reaction |
| `/session-feedback/nps` | POST | NPS score |

## Other Modules

### School (`src/modules/school/`)
`POST/GET /`, `GET/PUT /:id` — School CRUD

### Sections (`src/modules/sections/`)
`POST /`, `POST /bulk`, `GET /school/:schoolId`, `GET /:sectionId`, `PUT/DELETE /:sectionId`

### Teacher (`src/modules/teacher/`)
`POST /`, `GET /get-all` — Teacher CRUD (Principal only)

### Teacher Dashboard (`src/modules/teacher-dashboard/`)
All require `auth, isTeacher`:
- `/:teacherId/my-assignments`
- `/:teacherId/subject/:subjectId/dashboard`
- `/:teacherId/subject/:subjectId/students`
- `/:teacherId/subject/:subjectId/chapter/:chapterId/analytics`
- `/:teacherId/student/:studentId/subject/:subjectId/progress`
- `/:teacherId/subject/:subjectId/weak-topics`
- `/:teacherId/subject/:subjectId/activity`

### Question Paper (`src/modules/question-paper/`)
`POST /`, `POST /public/generate`, `GET /history`, `GET /:paperId/preview`, `GET /:paperId/pdf`, `DELETE /:paperId`

### AI Assistant (`src/modules/ai-assistant/`)
All require `auth, isTeacher`:
- `POST /` — process AI request → returns `generationId`
- `POST /continue` — continue clarification → returns `generationId`
- `GET /classes` — teacher's classes
- `GET /tasks` — available AI tasks
- `GET /health` — AI service health
- `GET /export/:generationId` — download as PDF

### Misc
| Module | Endpoints |
|--------|-----------|
| Leaderboard | `GET /`, `GET /subject/:subjectId` |
| Feedback | `POST /` |
| Referral | `GET /my-code`, `POST /redeem/:code` |
| Goals | `GET /`, `PUT /` |
| Stats | `GET /public` |
| Student | `POST /create`, `GET /get-all` |
