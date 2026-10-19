# AskAide AI - Features

**Last Updated:** 2026-10-18

---

## User Authentication
**Status:** ✅ Completed  
**Description:** Students and teachers can register themselves (principal accounts are created by an admin, parents are linked through the parent module), log in with email/password or Google, verify their email with an OTP, and stay signed in with JWT access tokens (2 hours) and single-use refresh tokens (30 days). Students and teachers can sign up on their own, by email or Google; any other account type is refused at signup. Signup accepts an invite code and first-touch attribution details. A retry of a refresh token just after it was rotated gets a fresh pair, so a dropped response does not sign the user out.  
**Endpoints:**
- `POST /api/v1/authenticate/signup` - User registration
- `POST /api/v1/authenticate/login` - Email/password login
- `POST /api/v1/authenticate/google` - Google sign-in (creates a Student, or a Teacher when asked)
- `POST /api/v1/authenticate/sendotp` - OTP request
- `POST /api/v1/authenticate/verify-email` - OTP verification
- `POST /api/v1/authenticate/refresh` - Refresh the token pair (each refresh token works once, with a 2 to 60 second retry grace)
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
**Description:** Multi-role system supporting Admin, Teacher, Student, Principal, and Parent with role-specific dashboards. Routes keyed by a user id serve only that user (a SuperAdmin may open anyone's); principals manage only their own school; teachers, parents and principals see students through their own dashboards.  
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
**Description:** Teachers can auto-generate question papers from chapter question banks by exact counts per type (`typeCounts`, including written types) or by difficulty mix, preview papers, edit them on a hand-made school paper view (`PUT /:paperId` autosaves header + `items`), swap any question for another of the same type, download PDFs, and manage generation history. Written types (assertion-reason, 2/3/5-mark, case-based) come from the separate `paperquestions` collection and only when `live`.  
**Endpoints:**
- `POST /api/v1/question-paper` - Generate question paper
- `POST /api/v1/question-paper/swap` and `POST /public/swap` - One replacement question (same difficulty first)
- `POST /api/v1/question-paper/public/availability` - Ready count per question type for chosen chapters
- `GET /api/v1/question-paper/history` - Get paper history
- `GET /api/v1/question-paper/:paperId/preview` - Preview a generated paper (owner or SuperAdmin)
- `GET /api/v1/question-paper/:paperId/pdf` - Download generated PDF (owner or SuperAdmin)
- `PUT /api/v1/question-paper/:paperId` - Save the teacher's edited paper (owner or SuperAdmin)
- `DELETE /api/v1/question-paper/:paperId` - Soft delete generated paper

**Dependencies:** MongoDB, Puppeteer  
**Added:** 2026-02-11 · Updated 2026-10-18/19 (paper editor, written questions, swap, availability)

---

## Public Question Paper Generation (Lead Magnet)
**Status:** ✅ Completed  
**Description:** Prospective users (leads) generate a free paper by providing their contact details (20 / hour per network), choosing exact counts per type (up to 30 questions) with plain-English shortfall notes ("Only 1 five-mark question is ready for these chapters."). The browser builds the PDF/Word file. MCQ and fill-in top each other up; the written types never.  
**Endpoints:**
- `POST /api/v1/question-paper/public/generate` - Generate free paper
- `POST /api/v1/question-paper/public/swap` - One replacement question (150 / hour per network, shared with availability)

**Dependencies:** MongoDB, WhatsApp Mock Utility  
**Added:** 2026-04-18 · Updated 2026-10-18/19 (typeCounts, swap, availability; server no longer renders the free paper's PDF)

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
**Description:** Students can start practice sessions on chapters, answer questions, and receive immediate feedback. A session is readable only by its owner or a SuperAdmin.  
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
**Description:** Schools can create class sections (A, B, C) and assign teachers to specific class-sections. A principal creates and changes sections only in their own school.  
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
**Description:** Subject-centric dashboard for teachers to monitor student progress, view chapter analytics, identify weak topics, and track individual student performance. `:teacherId` must be the signed-in teacher's own id (a SuperAdmin may open any teacher's).  
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
**Description:** Async quiz system for teachers to create, publish, and manage quizzes with auto-grading. Students can attempt quizzes with configurable time limits, multiple attempts, and view results. Students see the published quizzes of the teachers they are assigned to, start or resume an attempt (shuffled questions keep their order for that attempt), see from the result whether another attempt is allowed (`canRetry`), and can review past attempts. Teacher analytics include per-question analysis. Only the quiz's teacher (or a SuperAdmin) can read the full quiz.  
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
- `GET /api/v1/quiz/student/history` - Quiz history (student)

**Dependencies:** Quiz, QuizQuestion, QuizAttempt, QuizAnswer models, TeacherStudent model  
**Added:** 2026-01-19

---

## Quiz Homework
**Status:** ✅ Completed  
**Description:** A quiz set as homework shows the teacher who has done it. Each assigned student is marked done, in progress, not done, or never logged in, with their best score, and a "very fast, check" hint when someone averages under 5 seconds an answer (a hint about guessing, not an accusation). The teacher can send one reminder per student who has not finished, and move a published deadline later. A quiz set for certain sections is seen only by students in those sections. Parents see this week's homework on the School card, never the questions or answers.  
**Endpoints:**
- `GET /api/v1/quiz/:quizId/students` - Per-student status, best score and phone (for students not done), teacher only
- `POST /api/v1/quiz/:quizId/remind` - One reminder per student not done (once per quiz)
- `PATCH /api/v1/quiz/:quizId/deadline` - Move a published deadline later (`{ deadline }`)

**Dependencies:** Quiz, QuizAttempt, TeacherStudent, Notification models  
**Added:** 2026-10-18

---

## Parent School View
**Status:** ✅ Completed  
**Description:** A parent sees their child's school in one place: this month's attendance (with today's status, absent and half-day dates, and whether a day was a working day or a holiday), fees due by today, overdue and next bill with receipts, published report cards (provisional until the plan is locked), notices from the last 60 days, and homework. Receipts and report cards can be printed. It is read-only and works only through the parent's link to the child.  
**Endpoints:**
- `GET /api/v1/parent-dashboard/child/:childId/school` - School card (optional `?month=YYYY-MM`)
- `GET /api/v1/parent-dashboard/child/:childId/receipts/:receiptNo` - Receipt print data
- `GET /api/v1/parent-dashboard/child/:childId/report-cards/:planId` - Report card print data
- `POST /api/v1/parent-dashboard/notices/read` - Mark notices seen (`{ noticeIds }`, up to 50)

**Dependencies:** ParentStudent, AttendanceDay, FeeInvoice, FeePayment, ReportCard, Notice, NoticeRead, Quiz models  
**Added:** 2026-10-11

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
**Description:** Every user has a 6-character invite code and link. A new account that signs up with the link (email or Google), or that plays a friend's challenge and then signs up, is credited to the inviter. Nothing is given at signup: once the friend has answered 3 questions (practice answers and challenge answers both count), both people get a free practice paper credit and a streak shield (bonus streak freeze). Rewards are capped at 10 friends per inviter per month, and only accounts less than a day old can be credited. Milestone badges unlock at 1, 3 and 5 practising friends.  
**Endpoints:**
- `GET /api/v1/referral/my-code` - Code, link, friends, rewards and milestones
- `POST /api/v1/referral/redeem/:code` - Apply a code after signup (new accounts only)
- `POST /api/v1/referral/rewards/practice-paper` - Spend a credit on a 20-question practice paper

**Dependencies:** Referral, UserAnswer, ChallengeAttempt, Streak models; question paper service  
**Added:** 2026-04-18 (activation-based rewards 2026-10-10; activation threshold lowered to 3 answers 2026-10-11)

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
**Description:** A notification bell inside the app. It shows when friends play your challenge, join with your invite, or unlock a gift; when you earn a badge; and, for teachers, when students join a class link or a class milestone unlocks. Similar events on the same day are grouped into one row ("Name and 2 others played your challenge"). A daily job at 5 pm IST reminds invited friends how many questions are left for their gift, and nudges students who practised in the last week but not today (the evening streak reminder). Notifications are kept for 60 days after their last event. Emails continue to go out as before.  
**Endpoints:**
- `GET /api/v1/notifications` - List notifications, newest first
- `GET /api/v1/notifications/unread-count` - Unread count for the bell
- `POST /api/v1/notifications/read` - Mark some or all as read

**Dependencies:** Notification model, node-cron  
**Added:** 2026-10-10

---

## Parent Dashboard
**Status:** ✅ Completed  
**Description:** Parents can link to their children's accounts and view their progress, subject mastery, and weak topics. The parent comes from the login token; the dashboard paths carry only the child (and subject) ids, and the child must be linked to that parent.  
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

Both serve only the student themself (or a SuperAdmin).

**Dependencies:** Streak model, MongoDB  
**Added:** 2026-04-18

---

## Daily Challenge System
**Status:** ✅ Completed  
**Description:** Daily practice challenges with completion tracking and history. Each challenge is named after the topic it practises. The routes serve only the student themself (or a SuperAdmin).  
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
- `GET /api/v1/badges/:userId` - Get user badges (the student themself or a SuperAdmin)
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
- `GET /api/v1/session-feedback/nps/check/:userId` - Check if NPS due (the user themself or a SuperAdmin)
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
**Description:** Create and manage school entities for institutional users. A principal can edit only their own school.  
**Endpoints:**
- `POST /api/v1/school` - Create school
- `GET /api/v1/school` - List schools
- `GET /api/v1/school/:id` - Get school details
- `PUT /api/v1/school/:id` - Update school name and code

**Dependencies:** School model  
**Added:** 2024-03-01

---

## School Fees
**Status:** ✅ Completed  
**Description:** Fee collection for schools. A principal sets up fee heads and structures (tuition, transport and so on, with instalments and due dates), and generates bills per student. Staff record payments at the counter. One payment can clear several bills (advance or multi-month) and produces one receipt; the bills change together or not at all. A principal can give an advance-payment discount of 0 to 50% per structure, waive late fines, cancel bills, and refund a payment (a refund is a new row; a payment can be refunded once). UPI and online payments stay pending until reconciled. Every money change is audited with a reason. Amounts are stored in paise and shown in rupees.  
**Endpoints:**
- `POST /api/v1/fees/heads`, `POST /api/v1/fees/structures`, `POST /api/v1/fees/structures/:id/publish` - Set up the price list
- `PATCH /api/v1/fees/structures/:id/advance-discount` - Advance-payment discount
- `POST /api/v1/fees/invoices/generate` - Generate bills (`allInstallments` bills the whole year ahead)
- `GET /api/v1/fees/defaulters` - Overdue bills
- `GET /api/v1/fees/students/:studentId/bills` - A student's open bills
- `POST /api/v1/fees/payments/collect` - One payment for several bills, one receipt
- `POST /api/v1/fees/payments` and `POST /api/v1/fees/payments/:id/reconcile` - Single-bill payment and UPI confirmation
- `POST /api/v1/fees/payments/:id/refund` - Refund (principal)
- `GET /api/v1/fees/receipts/:receiptNo` - Receipt print data
- `GET /api/v1/fees/collections` - Day book for a date range (teachers see only their own)
- `GET /api/v1/fees/settings` and `PUT /api/v1/fees/settings` - Receipt prefix, UPI ID, late fine per day

**Dependencies:** FeeHeadMaster, FeeStructure, FeeInvoice, FeePayment, FeeSettings, FeeAudit models  
**Added:** 2026-10-11

---

## Attendance Registers
**Status:** ✅ Completed  
**Description:** Daily attendance per section (present, absent, half day, leave) with an optional period register, and staff attendance with leave types. A teacher can submit a register up to 2 days late; a locked register can be edited only by the principal, with a reason. The principal's monthly and absentee views and an audit of sections that are almost always all-present are included. Absence messages are queued as rows but not yet sent.  
**Endpoints:**
- `GET /api/v1/attendance/roster` - Students in a section
- `POST /api/v1/attendance/days/mark` and `GET /api/v1/attendance/days` - Mark and read a section's day
- `GET /api/v1/attendance/school-day` - Every section's register for a day
- `POST /api/v1/attendance/periods/mark` - Period register (when period tracking is on)
- `GET /api/v1/attendance/monthly` and `GET /api/v1/attendance/absentees` - Reports
- `POST /api/v1/attendance/staff/mark` and `POST /api/v1/attendance/staff/:id/regularize` - Staff attendance
- `GET /api/v1/attendance/settings` and `PUT /api/v1/attendance/settings` - Working days, holidays, period tracking

**Dependencies:** AttendanceDay, AttendancePeriod, StaffAttendance, AbsenteeEvent, SchoolSettings models  
**Added:** 2026-10-11

---

## Timetable and Substitutions
**Status:** ✅ Completed  
**Description:** A weekly timetable for each school, kept as versions: a principal publishes a version and it takes effect from its start date, so next term's grid does not replace this term's early. Teachers and sections cannot clash in a period. A teacher's day view shows their periods, and when a teacher is absent the principal assigns a substitute from the free-teacher list (same subject first, then the lightest load that day).  
**Endpoints:**
- `GET /api/v1/timetable/versions` and `POST /api/v1/timetable/versions` - Versions
- `POST /api/v1/timetable/versions/:id/publish` - Publish a version
- `POST /api/v1/timetable/slots` - Set a draft version's slots
- `GET /api/v1/timetable/week` - Grid for a section
- `GET /api/v1/timetable/teacher-day` - A teacher's periods for a day
- `GET /api/v1/timetable/free-teachers` - Teachers free in a period
- `POST /api/v1/timetable/substitutions` and `POST /api/v1/timetable/substitutions/:id/cancel` - Assign or cancel cover

**Dependencies:** TimetableVersion, TimetableSlot, Substitution models  
**Added:** 2026-10-11

---

## Notices
**Status:** ✅ Completed  
**Description:** A principal posts a notice to the whole school, a class or a section; a teacher posts to a class or section. Authors and principals can edit (the notice is marked edited) or delete. Parents see the last 60 days of their child's notices and mark them seen. Staff see how many parents of the audience have seen each notice ("seen by X of Y").  
**Endpoints:**
- `GET /api/v1/notices` - Staff list with "seen by" counts
- `POST /api/v1/notices` - Post a notice
- `PATCH /api/v1/notices/:id` - Edit
- `DELETE /api/v1/notices/:id` - Delete
- `POST /api/v1/parent-dashboard/notices/read` - Parent marks notices seen

**Dependencies:** Notice, NoticeRead models  
**Added:** 2026-10-11

---

## Gradebook and Report Cards
**Status:** ✅ Completed  
**Description:** Exam plans for a school year (for example Term 1 with weighted exams), entered mark sheets per section, subject and exam, and report cards. An absent student is left out of the averages, and an exam with no mark yet is left out of a student's percentage until it is entered. The grade is computed from the weighted percentage. Publishing a report card freezes a snapshot; a plan can be locked so that no sheet or card changes. The school publishes no class ranks.  
**Endpoints:**
- `GET /api/v1/gradebook/plans` and `POST /api/v1/gradebook/plans` - Exam plans
- `POST /api/v1/gradebook/plans/:id/publish` and `POST /api/v1/gradebook/plans/:id/lock` - Publish or lock
- `GET /api/v1/gradebook/marks` and `POST /api/v1/gradebook/marks` - Mark sheets
- `POST /api/v1/gradebook/cards/publish` - Publish a student's report card (principal)
- `GET /api/v1/gradebook/cards` - Report card
- `GET /api/v1/gradebook/class-totals` - Class totals

**Dependencies:** ExamPlan, MarkSheet, ReportCard models, Attendance  
**Added:** 2026-10-11

---

## Bulk Student Import and Transfer Certificates
**Status:** ✅ Completed  
**Description:** A principal imports a class list of up to 500 students at once (admission number, name, class and section, parent phone). Admission numbers are unique per school. A transfer certificate (TC) is issued from the student's record; a student with open fee dues is blocked unless the principal overrides with a reason. An issued TC marks the student as having left, so no new attendance or fee bills are created for them.  
**Endpoints:**
- `POST /api/v1/school/import-students` - Bulk import (principal)
- `POST /api/v1/tc/request` - Request a TC (`override` needs the principal)
- `GET /api/v1/tc/:studentId` - TC for a student

**Dependencies:** User (admissionNo, leftSchoolAt), TcCertificate, TcCounter, FeeInvoice models  
**Added:** 2026-10-11

---

## Parent Logins on Password Slips
**Status:** ✅ Completed  
**Description:** Parents get a login on a printed password slip, with no email or SMS needed. A family is the children who share the parent phone from the import, so siblings share one login. The login ID is the 10-digit mobile number, or `<school code>-<admission no>` when there is no phone. Passwords are stored only as hashes, so a slip can be printed only in the response that set it. A reprint renews only families that have not logged in since their last slip. A new slip ends that family's sessions. The parent can type the ID as they like (spaces, +91, capitals).  
**Endpoints:**
- `GET /api/v1/parent-logins` - A section's families and their login state
- `POST /api/v1/parent-logins` - Issue or reprint logins for a section
- `POST /api/v1/parent-logins/renew` - New slip for one family

**Dependencies:** User, ParentStudent, School, Section models  
**Added:** 2026-10-11

---

## Demo School
**Status:** ✅ Completed  
**Description:** A public demo school that anyone can try without an account. The sign-in is passwordless and picks a role: principal (default), teacher, parent or student. The school has about 420 students in 10 sections, teachers, fee collections and defaulters, about six weeks of registers, marks and report cards, a timetable, notices, and practice activity for the student account. It is rebuilt from scratch every night at 02:00 IST, and SuperAdmin can rebuild it on demand. Demo accounts cannot change their profile or password and do not count in platform metrics, leaderboards or public stats.  
**Endpoints:**
- `POST /api/v1/demo/login` - Sign in as a demo role (`{ role }`, 20 per hour per IP)
- `GET /api/v1/demo/status` - Rebuild status (SuperAdmin)
- `POST /api/v1/demo/rebuild` - Rebuild now (SuperAdmin)

**Dependencies:** School (isDemo), User (isDemo) models, node-cron  
**Added:** 2026-10-11 (practice data 2026-10-13)

---

## Principal "Today at My School"
**Status:** ✅ Completed  
**Description:** A phone-friendly summary for the principal: attendance (present percentage, sections not yet marked, holiday-aware), fees collected today, this month and overdue, pending UPI, staff away and substitutions, and TCs issued this month. Counts only, computed by aggregation. The fee day book (`GET /api/v1/fees/collections`) lists every receipt for a date range.  
**Endpoints:**
- `GET /api/v1/principal/today` - Today's summary

**Dependencies:** AttendanceDay, FeePayment, Substitution, TcCertificate models  
**Added:** 2026-10-11

---

## Question Coverage (SuperAdmin)
**Status:** ✅ Completed  
**Description:** Shows how many chapters have questions and which need a PDF, and can start generation for chapters that have none. The bulk fill-gaps step starts a few chapters per call (1 to 10, default 3), using the same race-safe claim as on-demand generation. Chapters with no topics are reported and not started.  
**Endpoints:**
- `GET /api/v1/questions/coverage` - Coverage (teacher or SuperAdmin, optional `classId`)
- `POST /api/v1/questions/generate/missing` - Fill gaps (SuperAdmin, `?classId=&limit=`)

**Dependencies:** Chapter, Question, QuestionGenerationJob models  
**Added:** 2026-10-11

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
