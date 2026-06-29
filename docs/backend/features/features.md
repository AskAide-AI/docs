# AskAide AI - Features

**Last Updated:** 2026-06-29

---

## User Authentication
**Status:** ✅ Completed  
**Description:** Users can register, login via email/password or OTP, and manage accounts securely with JWT tokens.  
**Endpoints:**
- `POST /api/v1/user/signup` - User registration
- `POST /api/v1/user/login` - Email/password login
- `POST /api/v1/user/request-otp` - OTP request
- `POST /api/v1/user/verify-otp` - OTP verification
- `POST /api/v1/user/logout` - Session logout

**Dependencies:** MongoDB, JWT, bcrypt, Nodemailer  
**Added:** 2024-01-15

---

## Role-Based Access Control
**Status:** ✅ Completed  
**Description:** Multi-role system supporting Admin, Teacher, Student, Principal, and Parent with role-specific dashboards.  
**Endpoints:**
- Role verified via JWT middleware on protected routes
- Different controllers for each role type

**Dependencies:** JWT middleware  
**Added:** 2024-01-15

---

## Content Management (Classes, Subjects, Chapters)
**Status:** ✅ Completed  
**Description:** Hierarchical content structure: Class → Subject → Chapter → Topic, including chapter PDF ingestion, chapter startability metadata, bulk chapter deletion, and RAG status checks.  
**Endpoints:**
- `GET /api/v1/classes` - List all classes
- `GET /api/v1/subjects/class/:classId` - Subjects by class
- `GET /api/v1/chapters/class/:classId/subject/:subjectId` - Chapters list
- `POST /api/v1/chapters/create-with-pdf` - Create chapter with PDF upload
- `DELETE /api/v1/chapters` - Delete multiple chapters
- `POST /api/v1/chapters/check-rag-status` - Check chapter RAG availability

**Dependencies:** MongoDB, Multer, External AI Service  
**Added:** 2024-01-10

---

## Question Paper Generation & Export
**Status:** ✅ Completed  
**Description:** Teachers can auto-generate balanced question papers from chapter question banks, preview papers, download PDFs, and manage generation history.  
**Endpoints:**
- `POST /api/v1/question-paper` - Generate question paper
- `GET /api/v1/question-paper/history` - Get paper history
- `GET /api/v1/question-paper/:paperId/preview` - Preview a generated paper
- `GET /api/v1/question-paper/:paperId/pdf` - Download generated PDF
- `DELETE /api/v1/question-paper/:paperId` - Soft delete generated paper

**Dependencies:** MongoDB, Puppeteer  
**Added:** 2026-02-11

---

## Public Question Paper Generation (Lead Magnet)
**Status:** ✅ Completed  
**Description:** Prospective users (leads) can generate a free question paper by providing their contact details. The system auto-delivers the PDF via WhatsApp.  
**Endpoints:**
- `POST /api/v1/question-paper/public/generate` - Generate free paper and send via WhatsApp

**Dependencies:** MongoDB, Puppeteer, WhatsApp Mock Utility  
**Added:** 2026-04-18

---

## Feedback System
**Status:** ✅ Completed  
**Description:** Integrated feedback collection for bugs, feature requests, and general suggestions.  
**Endpoints:**
- `POST /api/v1/feedback` - Submit user feedback

**Dependencies:** MongoDB, Feedback model  
**Added:** 2026-04-10

---

## AI Question Generation (On-Demand Practice)
**Status:** ✅ Completed  
**Description:** On-demand, non-blocking question generation for student practice. Students request questions via a status-check endpoint; AI generation runs fire-and-forget in the background. Implements yield-based mastery detection (lowYieldStreak, MIN_NEW_PER_RUN, LOW_YIELD_LIMIT, HARD_CAP), context rotation (AI Service randomly samples from CANDIDATE_POOL), dedup on insert via `_dedupeNewQuestions`, failed-job auto-recovery after 2 min cooldown, and prefetch when pool is low.  
**Endpoints:**
- `GET /api/v1/questions/chapter/:chapterId` - Get questions
- `GET /api/v1/questions/chapter/:chapterId/type/:type` - By question type
- `GET /api/v1/questions/chapter/:chapterId/type/:type/difficulty/:difficulty` - By type and difficulty
- `GET /api/v1/questions/batch/chapter/:chapterId/type/:questionType/difficulty/:difficulty/session/:sessionId` - Non-blocking status check for on-demand generation (returns questions + `generating`/`failed`/`mastered` status)

**Dependencies:** External AI Service, QuestionGenerationJob model, unique compound index for race safety  
**Added:** 2024-02-01 (updated with on-demand flow)

---

## Practice Sessions
**Status:** ✅ Completed  
**Description:** Students can start practice sessions on chapters, answer questions, and receive immediate feedback.  
**Endpoints:**
- `POST /api/v1/sessions` - Create session
- `GET /api/v1/sessions/:id` - Get session
- `PATCH /api/v1/sessions/:id/end` - End session with score
- `GET /api/v1/sessions/user/:userId` - User's sessions

**Dependencies:** Session model, UserAnswer model  
**Added:** 2024-01-20

---

## Topic Mastery Tracking
**Status:** ✅ Completed  
**Description:** Granular topic-level progress tracking with difficulty-weighted scoring and mastery states (WEAK → LEARNING → PRACTICING → MASTERED).  
**Endpoints:**
- `POST /api/v1/student-progress/update` - Update progress
- `GET /api/v1/student-progress/progress/:userId/chapter/:chapterId` - Chapter mastery
- `GET /api/v1/student-progress/progress/:userId/subject/:subjectId` - Subject mastery

**Dependencies:** StudentTopicProgress model, Topic model  
**Added:** 2025-12-21

---

## AI-Powered Insights
**Status:** ✅ Completed  
**Description:** AI-generated personalized learning recommendations based on performance data at chapter and subject levels.  
**Endpoints:**
- `GET /api/v1/student-progress/chapter/:chapterId/ai-insights`
- `GET /api/v1/student-progress/subject/:subjectId/ai-insights`

**Dependencies:** External AI Insights Service  
**Added:** 2025-12-21

---

## Section Management
**Status:** ✅ Completed  
**Description:** Schools can create class sections (A, B, C) and assign teachers to specific class-sections.  
**Endpoints:**
- `POST /api/v1/sections` - Create section
- `GET /api/v1/sections/school/:schoolId/class/:classId` - Get sections

**Dependencies:** Section model, School model  
**Added:** 2026-01-03

---

## Teacher-Student Relationships
**Status:** ✅ Completed  
**Description:** Link students to teachers with section awareness for class management.  
**Endpoints:**
- `POST /api/v1/teacher-student` - Assign student to teacher
- `GET /api/v1/teacher-student/teacher/:teacherId/students` - Get teacher's students

**Dependencies:** TeacherStudent model  
**Added:** 2026-01-03

---

## Teacher Dashboard
**Status:** ✅ Completed  
**Description:** Subject-centric dashboard for teachers to monitor student progress, view chapter analytics, identify weak topics, and track individual student performance.  
**Endpoints:**
- `GET /api/v1/teacher-dashboard/:teacherId/my-assignments` - Get assigned subjects & classes
- `GET /api/v1/teacher-dashboard/:teacherId/subject/:subjectId/dashboard` - Subject overview
- `GET /api/v1/teacher-dashboard/:teacherId/subject/:subjectId/students` - List students with progress
- `GET /api/v1/teacher-dashboard/:teacherId/subject/:subjectId/chapter/:chapterId/analytics` - Chapter analytics
- `GET /api/v1/teacher-dashboard/:teacherId/student/:studentId/subject/:subjectId/progress` - Individual student progress
- `GET /api/v1/teacher-dashboard/:teacherId/subject/:subjectId/weak-topics` - Weak topics report
- `GET /api/v1/teacher-dashboard/:teacherId/subject/:subjectId/activity` - Recent activity feed

**Dependencies:** TeacherStudent, StudentTopicProgress, Session, Chapter, ChapterTopics models  
**Added:** 2026-01-06

---

## Quiz Mode
**Status:** ✅ Completed  
**Description:** Async quiz system for teachers to create, publish, and manage quizzes with auto-grading. Students can attempt quizzes with configurable time limits, multiple attempts, and view results.  
**Endpoints:**
- `POST /api/v1/quiz` - Create quiz (draft)
- `GET /api/v1/quiz/:quizId` - Get quiz details
- `PUT /api/v1/quiz/:quizId` - Update quiz
- `DELETE /api/v1/quiz/:quizId` - Delete quiz
- `GET /api/v1/quiz/teacher/:teacherId` - List teacher's quizzes
- `POST /api/v1/quiz/:quizId/publish` - Publish quiz
- `POST /api/v1/quiz/:quizId/close` - Close quiz
- `POST /api/v1/quiz/:quizId/clone` - Clone quiz
- `GET /api/v1/quiz/:quizId/analytics` - Quiz analytics
- `POST /api/v1/quiz/:quizId/questions` - Add questions
- `GET /api/v1/quiz/student/available` - Available quizzes (student)
- `POST /api/v1/quiz/:quizId/start` - Start attempt
- `POST /api/v1/quiz/attempt/:attemptId/submit` - Submit quiz
- `GET /api/v1/quiz/attempt/:attemptId/result` - Get result

**Dependencies:** Quiz, QuizQuestion, QuizAttempt, QuizAnswer models, TeacherStudent model  
**Added:** 2026-01-19

---

## AI Assistant (Teacher Content Generation)
**Status:** ✅ Completed  
**Description:** Teachers can generate lesson content (quizzes, notes, worksheets, assignments, question papers) via AI prompts with follow-up clarifications. Proxied through Backend to AI Service `/ai-agent` endpoint.  
**Endpoints:**
- `POST /api/v1/ai-assistant` - Generate content from prompt
- `POST /api/v1/ai-assistant/continue` - Follow-up clarification
- `GET /api/v1/ai-assistant/classes` - Agent-accessible classes
- `GET /api/v1/ai-assistant/tasks` - Active agent task list
- `GET /api/v1/ai-assistant/health` - Agent health check
- `POST /api/v1/ai-assistant/stream` - Streamed content generation
- `POST /api/v1/ai-assistant/conversations` - Create conversation
- `GET /api/v1/ai-assistant/conversations` - List conversations
- `GET /api/v1/ai-assistant/conversations/:id/messages` - Get conversation messages
- `POST /api/v1/ai-assistant/conversations/:id/messages` - Add message to conversation
- `DELETE /api/v1/ai-assistant/conversations/:id` - Delete conversation
- `GET /api/v1/ai-assistant/export/:id` - Export generated content

**Dependencies:** External AI Service, MongoDB  
**Added:** 2026-04-18

---

## Daily Goal Management
**Status:** ✅ Completed  
**Description:** Students can set daily practice goals (questions per day). Goals auto-reset at IST midnight.  
**Endpoints:**
- `GET /api/v1/goals` - Get current goals
- `PUT /api/v1/goals` - Update goals

**Dependencies:** Goal model  
**Added:** 2026-04-18

---

## Referral System
**Status:** ✅ Completed  
**Description:** Users can generate referral codes and redeem them for rewards.  
**Endpoints:**
- `GET /api/v1/referral/my-code` - Get user's referral code
- `POST /api/v1/referral/redeem/:code` - Redeem a referral code

**Dependencies:** Referral model, MongoDB  
**Added:** 2026-04-18

---

## Parent Dashboard
**Status:** ✅ Completed  
**Description:** Parents can link to their children's accounts and view their progress, subject mastery, and weak topics.  
**Endpoints:**
- `POST /api/v1/parent-students/bulk` - Bulk link children
- `GET /api/v1/parent-students/links` - Get parent-student links
- `DELETE /api/v1/parent-students/unlink/:studentId` - Unlink a student
- `GET /api/v1/parent-dashboard/children` - Get linked children overview
- `GET /api/v1/parent-dashboard/child/:studentId/overview` - Child progress overview
- `GET /api/v1/parent-dashboard/child/:studentId/subject/:subjectId/progress` - Subject progress
- `GET /api/v1/parent-dashboard/child/:studentId/subject/:subjectId/weak-topics` - Weak topics

**Dependencies:** ParentStudent model, StudentTopicProgress model  
**Added:** 2026-04-18

---

## Streak Tracking
**Status:** ✅ Completed  
**Description:** Tracks consecutive daily practice streaks. Students can purchase streak freezes to maintain streaks.  
**Endpoints:**
- `GET /api/v1/streaks/:userId` - Get current streak info
- `POST /api/v1/streaks/:userId/use-freeze` - Use a streak freeze

**Dependencies:** Streak model, MongoDB  
**Added:** 2026-04-18

---

## Daily Challenge System
**Status:** ✅ Completed  
**Description:** Daily practice challenges with completion tracking and history.  
**Endpoints:**
- `GET /api/v1/daily-challenge/:userId` - Get today's challenge
- `POST /api/v1/daily-challenge/:userId/complete` - Mark challenge complete
- `GET /api/v1/daily-challenge/:userId/history` - Challenge history

**Dependencies:** DailyChallenge model  
**Added:** 2026-04-18

---

## Badge/Achievement System
**Status:** ✅ Completed  
**Description:** Real-time badge awards with achievements unlocked on practice milestones. Nightly cron safety net for missed checks.  
**Endpoints:**
- `GET /api/v1/badges/:userId` - Get user badges
- `POST /api/v1/badges/check` - Real-time badge check

**Dependencies:** Achievement model, Achievement scheduler job  
**Added:** 2026-04-18

---

## Session Feedback (Reaction + NPS)
**Status:** ✅ Completed  
**Description:** Emoji reaction feedback and Net Promoter Score survey after practice sessions.  
**Endpoints:**
- `POST /api/v1/session-feedback/reaction` - Submit emoji reaction
- `POST /api/v1/session-feedback/nps` - Submit NPS score
- `GET /api/v1/session-feedback/nps/check/:userId` - Check if NPS due
- `GET /api/v1/session-feedback/stats` - Feedback statistics
- `GET /api/v1/session-feedback/nps/stats` - NPS statistics

**Dependencies:** SessionFeedback model  
**Added:** 2026-04-18

---

## Platform Public Stats
**Status:** ✅ Completed  
**Description:** Public platform statistics (total users, questions answered, etc.) for landing pages.  
**Endpoints:**
- `GET /api/v1/stats/public` - Public platform statistics

**Dependencies:** MongoDB aggregation  
**Added:** 2026-04-18

---

## Health Check
**Status:** ✅ Completed  
**Description:** Deep health check for monitoring — reports server and database connectivity. Excluded from rate limiting.  
**Endpoints:**
- `GET /health` - Health check

**Response (200):**
```json
{ "status": "healthy", "server": "ok", "database": "ok", "timestamp": "..." }
```

**Response (503):**
```json
{ "status": "degraded", "server": "ok", "database": "disconnected", "timestamp": "..." }
```

**Dependencies:** MongoDB connection status  
**Added:** 2026-06-29

---

## API Logging & Stats
**Status:** ✅ Completed  
**Description:** Request/response logging to MongoDB with statistical analysis. Log level changed from `http` to `info` to ensure logs ship reliably to Loki transport.  
**Endpoints:**
- `GET /api/v1/logs` - Get API logs
- `DELETE /api/v1/logs` - Clear logs
- `GET /api/v1/logs/stats` - Log statistics

**Dependencies:** ApiLog model  
**Added:** 2026-04-18

---

## School Management
**Status:** ✅ Completed  
**Description:** Create and manage school entities for institutional users.  
**Endpoints:**
- `POST /api/v1/schools` - Create school
- `GET /api/v1/schools` - List schools
- `GET /api/v1/schools/:id` - Get school details

**Dependencies:** School model  
**Added:** 2024-03-01

---

## 🔮 Planned Features

### Bayesian Knowledge Tracing
**Status:** 📋 Planned  
**Description:** Advanced probability-based mastery prediction using BKT algorithms.

### Retention Tracking
**Status:** 📋 Planned  
**Description:** Track "last practiced" dates to predict memory decay and suggest reviews.

### Adaptive Question Selection
**Status:** 📋 Planned  
**Description:** Auto-insert review questions for decaying topics during practice.

### Social Login
**Status:** 📋 Planned  
**Description:** Google and GitHub OAuth integration.

### Two-Factor Authentication
**Status:** 📋 Planned  
**Description:** Enhanced security with 2FA support.

### WebSockets / Real-Time Notifications
**Status:** 📋 Planned  
**Description:** Real-time push notifications for quiz updates, achievements, and feedback.
