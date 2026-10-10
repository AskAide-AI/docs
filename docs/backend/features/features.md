# AskAide AI - Features

**Last Updated:** 2026-10-10

---

## User Authentication
**Status:** ✅ Completed  
**Description:** Users can register (students, teachers, parents and principals), log in with email/password or Google, verify their email with an OTP, and stay signed in with JWT access tokens and single-use refresh tokens. Teachers can sign up on their own, by email or Google. Signup accepts an invite code and first-touch attribution details.  
**Endpoints:**
- `POST /api/v1/authenticate/signup` - User registration
- `POST /api/v1/authenticate/login` - Email/password login
- `POST /api/v1/authenticate/google` - Google sign-in (creates a Student, or a Teacher when asked)
- `POST /api/v1/authenticate/sendotp` - OTP request
- `POST /api/v1/authenticate/verify-email` - OTP verification
- `POST /api/v1/authenticate/refresh` - Refresh the token pair (each refresh token works once)
- `POST /api/v1/authenticate/logout` - Session logout

**Dependencies:** MongoDB, JWT, bcrypt, google-auth-library, SendGrid  
**Added:** 2024-01-15 (Google sign-in, teacher self-signup and single-use refresh tokens added 2026)

---

## Profile Editing
**Status:** ✅ Completed  
**Description:** Users can change their display name, and change their login email after entering a 6-digit code sent to the new address. The account keeps its old email until the code is confirmed; the old address is then told about the change. Codes expire after 10 minutes and allow 5 tries.  
**Endpoints:**
- `PUT /api/v1/profile/name` - Change display name
- `POST /api/v1/profile/email/request-change` - Send a code to the new email
- `POST /api/v1/profile/email/confirm-change` - Confirm the code and switch the email

**Dependencies:** EmailChangeRequest model, SendGrid  
**Added:** 2026-10-04

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

## Teacher Class Join Links
**Status:** ✅ Completed  
**Description:** A teacher creates a join link per class and subject (and optional section) and shares it with the class. Students who join appear in the teacher dashboard like any assigned student. A teacher who signed up alone gets a private school set up automatically. The teacher sees how many students joined, practised after joining, and were active this week. A class report unlocks when 10 students have practised, and a Champion Teacher certificate when 25 have. Links can be turned off.  
**Endpoints:**
- `POST /api/v1/teacher-classes` - Create (or reuse) a class link
- `GET /api/v1/teacher-classes/mine` - Links with join and practice counts, milestones
- `GET /api/v1/teacher-classes/join/:code` - Public join page data
- `POST /api/v1/teacher-classes/join/:code` - Student joins the class
- `PATCH /api/v1/teacher-classes/:id` - Turn a link on or off
- `GET /api/v1/teacher-classes/:id/report` - Class report (after 10 students practised)
- `GET /api/v1/teacher-classes/certificate` - Certificate data (after 25 students practised)

**Dependencies:** TeacherClass, TeacherStudent, School, Section, UserAnswer models  
**Added:** 2026-10-10

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
**Description:** Teachers can generate lesson content (quizzes, notes, worksheets, assignments, question papers) via AI prompts with follow-up clarifications. Proxied through Backend to AI Service `/v1/ai-agent` endpoint.  
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
**Description:** Every user has a 6-character invite code and link. A new account that signs up with the link (email or Google), or that plays a friend's challenge and then signs up, is credited to the inviter. Nothing is given at signup: once the friend has answered 10 questions (practice answers and challenge answers both count), both people get a free practice paper credit and a streak shield (bonus streak freeze). Rewards are capped at 10 friends per inviter per month, and only accounts less than a day old can be credited. Milestone badges unlock at 1, 3 and 5 practising friends.  
**Endpoints:**
- `GET /api/v1/referral/my-code` - Code, link, friends, rewards and milestones
- `POST /api/v1/referral/redeem/:code` - Apply a code after signup (new accounts only)
- `POST /api/v1/referral/rewards/practice-paper` - Spend a credit on a 20-question practice paper

**Dependencies:** Referral, UserAnswer, ChallengeAttempt, Streak models; question paper service  
**Added:** 2026-04-18 (activation-based rewards 2026-10-10)

---

## Challenge a Friend
**Status:** ✅ Completed  
**Description:** After a practice session, a student can turn the multiple-choice questions they just answered (3 to 10) into a challenge link. Friends play it without logging in; answers are scored on the server and never sent to the page. A guest who signs up afterwards keeps their result, and the new account counts as the sender's referral. The sender sees the scoreboard and gets an email for the first 10 plays. Badges: Challenger and Challenge Champion.  
**Endpoints:**
- `POST /api/v1/challenges` - Create a challenge from a session
- `GET /api/v1/challenges/mine` - Challenges sent, with top players
- `GET /api/v1/challenges/:code` - Public play page (no answers)
- `POST /api/v1/challenges/:code/attempts` - Submit a play (guest or signed in)
- `POST /api/v1/challenges/attempts/:attemptId/claim` - Link a guest play to the new account
- `GET /api/v1/challenges/:code/review` - Answers, explanations and scoreboard

**Dependencies:** Challenge, ChallengeAttempt, Session, UserAnswer, Question models; referral service  
**Added:** 2026-10-10

---

## In-App Notifications
**Status:** ✅ Completed  
**Description:** A notification bell inside the app. It shows when friends play your challenge, join with your invite, or unlock a gift; when you earn a badge; and, for teachers, when students join a class link or a class milestone unlocks. Similar events on the same day are grouped into one row ("Name and 2 others played your challenge"). A daily job at 5 pm IST reminds invited friends how many questions are left for their gift. Notifications are kept for 60 days after their last event. Emails continue to go out as before.  
**Endpoints:**
- `GET /api/v1/notifications` - List notifications, newest first
- `GET /api/v1/notifications/unread-count` - Unread count for the bell
- `POST /api/v1/notifications/read` - Mark some or all as read

**Dependencies:** Notification model, node-cron  
**Added:** 2026-10-10

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
**Description:** Tracks consecutive daily practice streaks (IST dates). Each student gets one free streak freeze per week, used automatically when exactly one day is missed. Bonus freezes earned from referrals never reset and are used after the weekly one.  
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
**Description:** Real-time badge awards with 21 achievements unlocked on practice milestones, streaks, study time, challenges and invites. Night Owl and Early Bird are judged by Indian time (IST). New badges also appear in the notification bell. Daily cron safety net for missed checks.  
**Endpoints:**
- `GET /api/v1/badges/:userId` - Get user badges
- `POST /api/v1/badges/check` - Real-time badge check

**Dependencies:** Achievement model, Achievement scheduler job  
**Added:** 2026-04-18

---

## Leaderboard
**Status:** ✅ Completed  
**Description:** Top 10 students of the current week (from Monday 00:00 IST) by distinct questions answered correctly, shown with first names, so a new student can catch up. A per-subject leaderboard ranks all-time results.  
**Endpoints:**
- `GET /api/v1/leaderboard` - This week's top 10
- `GET /api/v1/leaderboard/subject/:subjectId` - Top 10 for a subject

**Dependencies:** UserAnswer model, MongoDB aggregation  
**Added:** 2024-02-15 (weekly ranking 2026-10-10)

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

### More Social Logins
**Status:** 📋 Planned  
**Description:** GitHub OAuth integration (Google sign-in is already available).

### Two-Factor Authentication
**Status:** 📋 Planned  
**Description:** Enhanced security with 2FA support.

### WebSockets / Real-Time Notifications
**Status:** 📋 Planned  
**Description:** Real-time push notifications for quiz updates, achievements, and feedback.
