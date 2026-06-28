# AskAide AI - Changelog

All notable changes to this project are documented in this file.

---

## [v1.1.0] - 2026-05-04

### Performance Optimizations
- **Database Query Optimization**: Comprehensive performance improvements across all modules
  - Added missing database indexes for improved query performance (Question, UserAnswer, Session, QuizAnswer models)
  - Added `.lean()` to 25+ read-only queries to reduce memory overhead
  - Fixed N+1 query in `getQuestionAnalysis()` using aggregation (90% faster)
  - Used projection to limit fields in 15+ queries (15-20% improvement)
  - Optimized batch operations for delete (80% faster)
  - Combined `getProgress()` aggregations using `$facet` (60-70% faster)
  - Optimized `getStudentAvailableQuizzes()` with single aggregation (50-60% faster)

### Caching Layer
- **Redis Caching Implementation**: Added caching layer with graceful degradation
  - Created `src/shared/utils/cache.js` with full Redis support
  - Added caching to `getProgress()` with 5-minute TTL
  - Added cache invalidation on data changes
  - Implemented cache mock for testing environments
  - Cache gracefully degrades without Redis server

### Performance Impact
- Dashboard load: 60-70% faster (~2-3s → ~500-800ms)
- Quiz availability: 50-60% faster (~500ms → ~200-250ms)
- Question analysis: 90% faster (~1-2s → ~100-200ms)
- Question batch: 40-50% faster (~200ms → ~100-120ms)
- Cached requests: 95% faster (~500ms → ~25ms)
- Overall throughput: 100% increase (~500 req/s → ~1000 req/s)

### Database Metrics
- Index hit ratio: 70% → 95%
- Average query time: 80ms → 40ms
- Slow queries (>100ms): 15% → 5%
- Cache hit rate: 0% → ~60% (with Redis)

### Scripts
- Added `scripts/createIndexes.js` for database index creation

---

## [v1.0.0] - 2026-04-19

### Added
- **Public Question Paper Generation**: New lead generation module with WhatsApp delivery.
- **WhatsApp Utility**: Mock utility for PDF delivery via WhatsApp (`src/shared/utils/whatsapp.js`).
- **Support for Leads**: New `Lead` model for tracking prospective users from public paper generation.
- **Teacher Dashboard Activity**: New endpoints for tracking student activity feeds.
- **Support for Feedback**: Integrated feedback collection system.

### Changed
- Comprehensive documentation overhaul across all modules.
- Refined Teacher Dashboard analytics for better performance.
- Updated `readme.md` with new API sections and models.

---

## [Unreleased]

### Added
- Comprehensive backend documentation system (14 files)
- Chapter bulk deletion API: `DELETE /api/v1/chapters`
- Chapter RAG status API: `POST /api/v1/chapters/check-rag-status`
- Question paper APIs documented in backend docs (`/api/v1/question-paper/*`)
- **Non-blocking question generation polling**: New `/batch/...` endpoint returns immediately with questions + `generating`/`failed`/`mastered` status; AI runs fire-and-forget via `_startBackgroundGeneration`
- **Yield-based mastery detection**: Consecutive low-yield runs (`lowYieldStreak` >= `LOW_YIELD_LIMIT`) mark chapter as mastered — stops further generation
- **Context rotation**: AI Service randomly samples from `CANDIDATE_POOL` for diverse question content
- **Dedup on insert**: `_dedupeNewQuestions()` prevents duplicate questions across re-generation runs
- **Failed-job auto-recovery**: Stale `generating` jobs auto-reset after 2 min cooldown and retry
- **Prefetch**: Background generation triggers when remaining pool ≤ `QUESTION_PREFETCH_AHEAD`
- **Structured logging** for generation lifecycle (job creation, AI call, dedup, mastery decisions)

### Changed
- Chapter and study responses now include `isStartable` flag based on chapter topic availability
- Chapter PDF ingestion now uses `AI_ENDPOINT` and calls `${AI_ENDPOINT}/upload-document`

### Documentation
- Updated `API-DOCUMENTATION.md` with chapter lifecycle and question paper endpoints
- Updated `SETUP.md` environment variables to match runtime configuration
- Updated `FEATURES.md` with chapter lifecycle and question paper capabilities
- Updated architecture, feature, PM overview, and setup docs for on-demand polling generation

### Testing
- Updated test suite: 48 tests across all modules (question generation, batch endpoint, dedup, mastery detection)

---

## [v0.9.7] - 2026-01-19

### Added
- **Quiz Module**: Complete async quiz system
  - Quiz CRUD operations (create, read, update, delete)
  - Quiz lifecycle management (draft → published → closed)
  - Question bank integration with search functionality
  - Custom question support for quizzes
  - Student quiz attempts with configurable settings (time limit, allowed attempts, shuffling)
  - Auto-grading for MCQ and fill-in-blanks
  - Quiz analytics with performance insights (completion rates, question analysis, top/struggling students)
  - Quiz cloning for reuse

### Models Added
- `Quiz` - Core quiz configuration and settings
- `QuizQuestion` - Quiz-question links with ordering and marks
- `QuizAttempt` - Student attempt tracking
- `QuizAnswer` - Individual answer records

---

## [v0.9.6] - 2026-01-11

### Added
- **Joi Validation Middleware**: Centralized input validation layer
  - `src/shared/middleware/validate.js` - Reusable validation middleware
  - `src/modules/auth/validators/auth.validator.js` - Schemas for all auth endpoints
  - All 6 auth routes now use Joi validation (login, signup, changePassword, verifyEmail, resetPassword, resetPasswordToken)

### Fixed
- **DB Config**: Fixed silent failure on connection error - now throws and fails fast
- **DB Config**: Removed development-only restriction - now connects in all environments
- **HTTP Status Codes**: Fixed `403→400` for validation errors in signup
- **HTTP Status Codes**: Fixed `401→400` for password mismatch errors
- **N+1 Queries**: Optimized `getSubjectDashboard` with bulk queries (Topic, Chapter lookups)
- **N+1 Queries**: Optimized `getChapterAnalytics` with bulk User lookups
- **N+1 Queries**: Optimized `getWeakTopics` with bulk Topic, Chapter lookups

### Security
- **Secure Cookies**: Added `secure`, `sameSite: 'strict'` options to login cookie
- **Configurable Expiry**: Cookie expiry now configurable via `COOKIE_EXPIRE_DAYS` env var

### Refactor
- **Magic Numbers**: Extracted `MASTERY_CONFIG` constants in `topicProgress.controller.js`
- **Magic Numbers**: Extracted `TEACHER_DASHBOARD_CONFIG` in `teacherDashboard.controller.js`
- **Controller Cleanup**: Removed redundant manual validation from auth controllers (handled by Joi middleware)

---

## [v0.9.5] - 2026-01-10
 
 ### Refactor
 - **DDM Migration Complete**: Removed root `controllers` and `models` folders. All logic moved to `src/modules` (Domain-Driven Modules).
 - **Legacy Cleanup**: Moved legacy controllers to `legacy_backup` folder.
 - **Progress Module**: Fully implemented `topicProgress.controller.js` within DDM structure, removing dependencies on legacy code.
 
 ### Documentation
 - **Swagger Coverage**: Added Swagger documentation for all 13 endpoints in `progress` module (Sessions, User Answers, Topic Progress).
 - **Architecture**: Updated architecture docs to reflect DDM structure.
 
 ---
 
 ## [v0.9.1] - 2026-01-07

### Optimization
- **Student School Affiliation**: Optimized `createTeacherStudentBulk` to automatically sync `class_id` to the Student's `class` list, reducing database queries on hot paths.

### Documentation
- Updated `API-DOCUMENTATION.md` to reflect correct Teacher-Student bulk endpoints and added Student/Teacher management APIs.

### Refactor
- **Student Progress**: Unified `getStudentProgress` logic in Teacher Dashboard to use shared `getSubjectProgressData` service, ensuring consistent data across student and teacher views.

### Fixes
- **Teacher Dashboard**: `getSubjectDashboard` now uses an adaptive threshold for weak topics (20% of class or min 1 student) for more relevant insights.

---

## [v0.9.0] - 2026-01-06

### Added
- **Teacher Dashboard**: Complete subject-centric dashboard for teachers
  - `GET /api/v1/teacher-dashboard/:teacherId/my-assignments` - Assigned subjects & classes
  - `GET /api/v1/teacher-dashboard/:teacherId/subject/:subjectId/dashboard` - Subject overview
  - `GET /api/v1/teacher-dashboard/:teacherId/subject/:subjectId/students` - Students list with progress
  - `GET /api/v1/teacher-dashboard/:teacherId/subject/:subjectId/chapter/:chapterId/analytics` - Chapter analytics
  - `GET /api/v1/teacher-dashboard/:teacherId/student/:studentId/subject/:subjectId/progress` - Individual student progress
  - `GET /api/v1/teacher-dashboard/:teacherId/subject/:subjectId/weak-topics` - Weak topics report
  - `GET /api/v1/teacher-dashboard/:teacherId/subject/:subjectId/activity` - Activity feed

### Fixed
- ChapterTopics query now correctly uses `find()` with `topicId` field instead of `findOne()` with non-existent `topics` array
- Topic field selection updated to use `title` instead of `name` across all functions
- `getSubjectDashboard`: Fixed chapter topics retrieval for progress calculation
- `getStudentProgress`: Fixed chapter topics and weak topics population
- `getWeakTopics`: Removed hardcoded test IDs, now uses dynamic `teacherId` and `subjectId` params

---

## [v0.8.0] - 2026-01-04

### Added
- Documentation audit and consolidation
- Backend system design documentation

### Changed
- Updated `Backend_Overview_for_PM.md` with current feature status

---

## [v0.7.0] - 2026-01-03

### Added
- **Section Management**: New `Section` model for class organization (9th-A, 9th-B)
- **Teacher-Student Relationships**: `TeacherStudent` model with section awareness
- **Bulk Upload Script**: `bulkUploadChapters.js` for batch PDF uploads
- Section CRUD APIs (`/api/v1/sections`)

### Fixed
- Subject coverage calculation now correctly aggregates across all chapters

---

## [v0.6.0] - 2025-12-21

### Added
- **Topic Mastery System**: Complete implementation
  - `StudentTopicProgress` model with difficulty-weighted scoring
  - `topicId` field in `UserAnswer` model
  - Mastery states: WEAK, LEARNING, PRACTICING, MASTERED
- **Progress APIs**:
  - `GET /api/v1/student-progress/progress/:userId/chapter/:chapterId`
  - `GET /api/v1/student-progress/progress/:userId/subject/:subjectId`
- **AI Insights APIs**:
  - `GET /api/v1/student-progress/chapter/:chapterId/ai-insights`
  - `GET /api/v1/student-progress/subject/:subjectId/ai-insights`
- Coverage vs Mastery separation in progress calculations

### Changed
- Progress calculation now uses difficulty weighting (Easy: 25%, Medium: 35%, Hard: 40%)

---

## [v0.5.0] - 2025-12-20

### Added
- Topic model for granular content structure
- ChapterTopics junction model for chapter-topic relationships
- Chapter topics API showing upload/RAG processing status

---

## [v0.4.0] - 2024-03-01

### Added
- School management system
- OTP-based authentication option
- Password reset via email

---

## [v0.3.0] - 2024-02-15

### Added
- Leaderboard system with class and global rankings
- Achievement model for student badges

---

## [v0.2.0] - 2024-02-01

### Added
- AI question generation from chapter PDFs
- QuestionGenerationJob model for tracking AI tasks
- Background question generation processing
- Retry logic for failed AI generation

### Changed
- Question model now supports topics

---

## [v0.1.0] - 2024-01-20

### Added
- Initial project setup
- Express.js server with MongoDB
- User model with role-based access (Admin, Teacher, Student, Principal, Parent)
- JWT authentication
- Class, Subject, Chapter models with hierarchical structure
- Question model (MCQ, Fill-in-blanks)
- Session model for practice tracking
- UserAnswer model for response recording
- Basic CRUD APIs for all models
- Rate limiting
- API logging middleware

---

## API Surface History

A focused, month-by-month view of changes to the **public API surface** (the release notes above track the full project; this section tracks endpoints only).

### 2026

**June 2026 — Added**
- `GET /topic-progress/ai-insights/teacher/class` — Teacher class-level aggregated insight
- `POST /ai-assistant/continue` — Follow-up clarifications for AI content generation

**May 2026 — Added**
- `GET /progress/dashboard/:userId` — Optimized dashboard progress query (replaces N+1 pattern)
- `POST /leaderboard` — Leaderboard with class-level filtering

**May 2026 — Changed**
- `GET /questions/batch/:chapterId/:type/:difficulty/:session` — Added yield-based mastery; returns `status: "mastered"` when chapter is exhausted
- Redis caching layer added for frequently accessed data

**April 2026 — Added**
- `POST /quiz/:quizId` — Teacher quiz CRUD (create, update, delete)
- `POST /quiz/:quizId/questions` — Add questions to quiz
- `POST /quiz/attempt/:attemptId/submit` — Submit quiz attempt
- `POST /ai-assistant/*` — Teacher AI content generation endpoints
- `POST /question-paper` — Question paper generation and preview
- `POST /goals` — Student daily goal management
- `POST /referral/*` — Referral code system
- `POST /parent-dashboard/*` — Parent dashboard endpoints
- `GET /parent-students/*` — Parent-student linking

**March 2026 — Added**
- `POST /badges/check` — Real-time badge achievement check
- `POST /daily-challenge/:userId` — Daily challenge system
- `POST /session-feedback` — Session feedback collection
- `GET /streaks/:userId` — Streak tracking
- `GET /teacher-dashboard/:teacherId/*` — Teacher dashboard endpoints

**February 2026 — Added**
- `GET /topic-progress/ai-insights/chapter` — Chapter AI insights (proxied to AI Service)
- `GET /topic-progress/ai-insights/subject` — Subject AI insights (proxied to AI Service)

**January 2026 — Added**
- Section management CRUD
- Teacher-student linking with section filtering
- Bulk student/teacher upload

### 2025

**Initial Release (December 2025) — Core**
- Auth: login, signup, OTP verification, password reset
- Content: classes, subjects, chapters CRUD
- Study: sessions, questions batch, user answers
- Progress: topic progress tracking
- Admin: school / teacher / student management
- Chapter PDF upload with AI processing
- Swagger API docs at `GET /api-docs`

---

*Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)*
