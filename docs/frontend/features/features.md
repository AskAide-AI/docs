# Features

> Complete list of all user-facing features in the AskAideAI frontend application.
> Last Updated: October 10, 2026

---

## Authentication & User Management

### Login
**Status:** ✅ Completed
**Description:** Users can log in with email or username and password, or with Google, using JWT authentication. The 2-hour access token is refreshed automatically, once at a time across all open tabs (a Web Lock), so two tabs never log each other out. On session expiry, the system stores `auth:sessionExpired` + `auth:returnTo` flags in sessionStorage, redirects to `/login`, and shows a toast: "Your session expired. Please sign in again to continue." After login, the user is returned to their original destination.
**Pages:** /login
**Components:** 
- `Login.jsx`
- `FitGoogleLogin.jsx` (sizes Google's button to its container)
**API Dependencies:** 
- POST `/authenticate/login`
- POST `/authenticate/google`
- POST `/authenticate/refresh`
**Added:** Initial release

---

### User Registration
**Status:** ✅ Completed
**Description:** New users sign up with name, email and password, or with Google, and are signed in straight away. The password needs 8+ characters with at least one letter and one number. `/signup?role=teacher` creates a free teacher account (email or Google) that lands on `/teacher`. A friend's invite code and UTM tags from the first visit are sent with both email and Google signup.
**Pages:** /signup
**Components:** 
- `Signup.jsx`
- `FitGoogleLogin.jsx`
**API Dependencies:** 
- POST `/authenticate/signup`
- POST `/authenticate/google`
**Added:** Initial release. Teacher self-signup added October 2026.

---

### Password Recovery
**Status:** ✅ Completed
**Description:** Users can reset their password via email link
**Pages:** /forgot-password, /update-password/:id
**Components:** 
- `ForgotPassword.jsx`
- `UpdatePassword.jsx`
**API Dependencies:** 
- POST `/auth/resetPasswordToken`
- POST `/auth/resetPassword`
**Added:** Initial release

---

### Profile Management
**Status:** ✅ Completed
**Description:** Users can view and update their profile information. The name has an inline **Edit**. The email has a **Change** flow: enter the new address, get a 6-digit code there, and enter it to switch. The email only changes once the code is confirmed. Errors from the server (tries left, expired code, address already taken) are shown, with a 60-second resend countdown.
**Pages:** /profile
**Components:** 
- `Profile.jsx`
- `profile/NameEditor.jsx`
- `profile/EmailChanger.jsx`
**API Dependencies:** 
- GET `/profile/details`
- PUT `/profile/name`
- POST `/profile/email/request-change`
- POST `/profile/email/confirm-change`
**Added:** Initial release. Name edit and email change added October 2026.

---

## AI-Powered Study Experience

### Study Configuration
**Status:** ✅ Completed
**Description:** Users select class, subject, chapter, question type, and difficulty before starting a practice session. Can also be pre-populated from the Progress page ("Start Learning" button navigates here with class/subject/chapter pre-selected), from a class the student just joined, or from a challenge's chapter. A visitor who tried a chapter on `/try` and then signed up gets their first session on that same chapter (remembered for a day, used once). The class dropdown shows all 7 classes (6th–12th) without an inner scroll.
**Pages:** /study
**Components:** 
- `Home.jsx`
- `StudyConfig.jsx`
**API Dependencies:** 
- GET `/study/configuration?classIds=`
**Added:** Initial release

---

### Question Practice
**Status:** ✅ Completed
**Description:** AI-generated questions with real-time feedback and explanations. Each answer is saved the moment it is given, so leaving mid-session loses nothing. There is no "leave session?" warning on tab or app switches; in-app navigation still asks to confirm. A session the student leaves without pressing End Session is still ended (a `keepalive` request when the tab closes). The practice tour starts after the first answer, not over the first question.
**Pages:** /study
**Components:** 
- `QuestionPractice.jsx`
- `CurrentQuestion.jsx`
- `Sidebar.jsx`
- `UserAnswers.jsx`
**API Dependencies:** 
- GET `/questions/batch/chapter/:chapterId/type/:type/difficulty/:difficulty/session/:sessionId`
- POST `/sessions` (start session)
- PATCH `/sessions/:id/end` (end session)
- POST `/user-answers/batch` (one answer per call)
**Polling Mechanism:** When questions are being generated, the frontend polls the question batch endpoint every 5 seconds (up to 60 polls). The response includes a `status` field with possible values:
  - `generating` — AI is still generating questions, retry later
  - `mastered` — all topics are mastered; no questions returned (positive terminal state)
  - `failed` — AI generation failed after retries; show error to user
**Added:** Initial release

---

### Session Results
**Status:** ✅ Completed
**Description:** Users can view session summary with correct/incorrect answers. Any new badge pops up first, then the result card opens. After a session of 3 or more answers, **Challenge on WhatsApp** (and a copy-link button) sits in the card's pinned footer, so it is on screen without scrolling on any phone.
**Pages:** /study
**Components:** 
- `SessionResultModal.jsx`
- `BadgeUnlockToast.jsx`
- `ChallengeShareCard.jsx`
- `UserAnswers.jsx`
**API Dependencies:**
- Session data from Redux store
- POST `/badges/check`
- POST `/challenges`
**Added:** Initial release

---

## Progress Tracking & Analytics

### Subject Progress
**Status:** ✅ Completed
**Description:** Overview of learning progress across all subjects with coverage and mastery metrics
**Pages:** /progress
**Components:** 
- `Progress.jsx`
- `SubjectSummary.jsx`
**API Dependencies:** 
- GET `/topic-progress/user/:userId/subject/:subjectId`
**Added:** December 2025

---

### Chapter Progress
**Status:** ✅ Completed
**Description:** Detailed chapter-level breakdown with topic mastery visualization
**Pages:** /progress
**Components:** 
- `ChapterList.jsx`
- `ChapterDetailView.jsx`
**API Dependencies:** 
- GET `/topic-progress/progress/subject/:subjectId` (the signed-in user's progress; chapters and topics are inside it)
**Added:** December 2025

---

### AI Insights
**Status:** ✅ Completed
**Description:** AI-generated learning recommendations per chapter/subject
**Pages:** /progress (modal/panel)
**Components:** 
- `ChapterDetailView.jsx` (renders AI insights in Markdown)
**API Dependencies:** 
- GET `/topic-progress/ai-insights/chapter/:chapterId`
- GET `/topic-progress/ai-insights/subject/:subjectId`
**Added:** December 2025

---

## Sharing, Referral & Notifications

### Challenge a Friend
**Status:** ✅ Completed
**Description:** After a practice session of 3 or more answers, a student sends the same questions to friends on WhatsApp. Friends open `/c/:code` and play without logging in, then see whether they beat the sender and the scoreboard. Signing in shows the right answers with explanations and puts their score on the scoreboard; a guest's play is claimed to their new account after sign-in. A friend's challenge answers count towards the referral gift.
**Pages:** /study (result card), /c/:code, /c/:code/results
**Components:**
- `common/ChallengeShareCard.jsx`
- `pages/ChallengePlay.jsx`
- `pages/ChallengeResults.jsx`
- `common/ChallengeGiftNote.jsx`
**API Dependencies:**
- POST `/challenges`, GET `/challenges/mine`
- GET `/challenges/:code`, POST `/challenges/:code/attempts`
- POST `/challenges/attempts/:attemptId/claim`, GET `/challenges/:code/review`
**Added:** October 2026

---

### Refer & Earn
**Status:** ✅ Completed
**Description:** The Refer & Earn page gives each student an invite link and message. When a friend joins and answers enough questions on a new account, both get a gift: a free practice paper and a streak shield. Students redeem a practice paper for any chapter (PDF), see their squad badges, the friends who joined and their status, and the challenges they sent. Every share button adds the student's `?ref=` code to links to our own site.
**Pages:** /referral
**Components:**
- `pages/ReferralPage.jsx`
- `common/ReferralCard.jsx` (dashboard)
- `hooks/useReferralCode.js`
**API Dependencies:**
- GET `/referral/my-code`
- POST `/referral/redeem/:code`
- POST `/referral/rewards/practice-paper`
**Added:** Rebuilt October 2026

---

### Invite Attribution
**Status:** ✅ Completed
**Description:** The first visit's `?ref=` invite code and UTM tags are remembered for 30 days (`utils/acquisition.js`) and sent with both email and Google signup, so a friend who browses first and signs up later is still credited. Signed-in visitors are not recorded.
**Pages:** All public pages, /signup
**Components:**
- `utils/acquisition.js`
- `utils/pendingChallenge.js` (pending challenge claim and pending class join, `postAuthPath()`)
**Added:** October 2026

---

### In-App Notifications
**Status:** ✅ Completed
**Description:** Signed-in users get a notification bell. It shows an unread count and opens one panel: a top sheet on phones, a popover beside the bell on desktop. Opening the panel marks everything read. Tapping a notification goes where it points. A toast shows the newest unread notification once, also when news arrives while the app is open, but stays quiet during practice (`/study`) and quizzes. Examples: a friend played your challenge, a friend joined with your invite, a gift unlocked, a badge earned, students joined your class link.
**Where the bell is:** the desktop sidebar on app pages, the top Navbar on public pages, beside the dashboard greeting on phones, a count on the BottomNav **Menu** tab, and a **Notifications** row in the mobile menu.
**Pages:** All pages for signed-in users
**Components:**
- `notifications/NotificationBell.jsx`
- `notifications/NotificationCenter.jsx`
- `notifications/NotificationToaster.jsx`
- `hooks/useNotifications.js` (one shared store; unread count polled every 60 s while the tab is visible)
**API Dependencies:**
- GET `/notifications`, GET `/notifications/unread-count`
- POST `/notifications/read`
**Added:** October 2026

---

## Admin Panel

### School Management
**Status:** ✅ Completed
**Description:** SuperAdmin can create, view, update, and delete schools
**Pages:** /admin
**Components:** 
- `AdminDashboard.jsx`
- `SchoolManagement.jsx`
**API Dependencies:** 
- GET/POST/PUT/DELETE `/school`
**Added:** Initial release

---

### Teacher Management
**Status:** ✅ Completed
**Description:** Create individual or bulk teachers, assign to schools
**Pages:** /admin
**Components:** 
- `TeacherManagement.jsx`
**API Dependencies:** 
- GET/POST `/teacher`
- POST `/teacher/bulk`
**Added:** Initial release

---

### Student Management
**Status:** ✅ Completed
**Description:** Create individual or bulk students, manage enrollments
**Pages:** /admin
**Components:** 
- `StudentManagement.jsx`
**API Dependencies:** 
- GET/POST `/student`
- POST `/student/bulk`
**Added:** Initial release

---

### Section Management
**Status:** ✅ Completed
**Description:** Manage class sections (e.g., "9th - A") for schools
**Pages:** /admin
**Components:** 
- `SectionManagement.jsx`
**API Dependencies:** 
- GET/POST/PUT/DELETE `/section`
**Added:** January 2026

---

### Teacher-Student Linking
**Status:** ✅ Completed
**Description:** Assign teachers to students with section filtering
**Pages:** /admin
**Components:** 
- `LinkManagement.jsx`
**API Dependencies:** 
- POST/DELETE `/assignment`
**Added:** Initial release

---

### Chapter PDF Upload
**Status:** ✅ Completed
**Description:** Upload chapter PDFs for AI processing and topic extraction
**Pages:** /admin
**Components:** 
- `ChapterUpload.jsx`
**API Dependencies:** 
- POST `/chapters/create-with-pdf`
**Added:** Initial release

---

### Relation View
**Status:** ✅ Completed
**Description:** Visualize school-teacher-student relationships
**Pages:** /admin
**Components:** 
- `RelationView.jsx`
**API Dependencies:** 
- GET `/school/relations`
**Added:** Initial release

---

### Chapter-Topic View
**Status:** ✅ Completed
**Description:** View AI-processed chapters with extracted topics
**Pages:** /admin
**Components:** 
- `ChapterTopicView.jsx`
**API Dependencies:** 
- GET `/chapters/with-topics`
**Added:** Initial release

---

### AI System (Live LLM Switching)
**Status:** ✅ Completed
**Description:** SuperAdmin sees which LLM provider/model every AI feature is using (and whether it came from the admin panel or the env default), tests any provider + model with plain / JSON / MCQ checks side by side with the live one, and makes a passing model live instantly — no restart or redeploy. Also switch back, reset to env default, and change history. Only providers whose API key is set on the AI Service can be used; keys are never shown.
**Pages:** /admin (AI System tab)
**Components:**
- `admin/system/AiSystemSettings.jsx`
**API Dependencies:**
- GET `/admin/system/llm/status`, GET `/admin/system/llm/models`
- POST `/admin/system/llm/test`, POST `/admin/system/llm/active`, POST `/admin/system/llm/reset`
**Added:** October 2026

---

## Role-Based Dashboards

### Student Dashboard
**Status:** 🚧 In Progress (Mock Data)
**Description:** Personalized dashboard with streaks, badges, and activity. DailyGoalCard includes `minHeight: 104px` on skeleton and loaded states to prevent CLS (layout shift). Onboarding overlay has a persistent escape hatch (X button + Escape key) so it never traps the user.
**Pages:** /dashboard
**Components:** 
- `Dashboard.jsx`
- `DailyGoalCard.jsx`
- `OnboardingOverlay.jsx`
- `FirstRunGate.jsx`
**API Dependencies:** 
- Currently uses mock data
**Added:** Initial release
**Notes:** Gamification elements pending backend implementation

#### First-Run Onboarding (`FirstRunGate`)
The welcome wizard decision is owned by `FirstRunGate.jsx`, mounted **app-level** in `App.jsx` for any authenticated, non-public route — not by the dashboard. This fires the wizard wherever a new student first lands (signup drops students on `/study`, not `/dashboard`). Behavior:
- **Student-only** — staff roles (Teacher/Principal/Parent/SuperAdmin) never see the practice wizard; a missing `accountType` is treated as `Student`.
- **localStorage flag + history fallback** — if `onboarding_<userId>` is unset, it confirms the student has no session history via `studyApi.fetchSessionsByUserId` before showing, so a returning user with cleared storage (new device/cleared cache) isn't re-onboarded; a network failure falls back to showing (the escape hatch makes a false positive harmless).
- **Selection carried into study** — on completion, `OnboardingOverlay` navigates to `/study` with `location.state.preselectConfig` (class/subject/chapter + `mcq`/`Medium` defaults), so the student doesn't re-pick everything. If the student tried a chapter of the same subject on `/try`, that chapter is used instead.
- **Greets by first name** — the wizard uses the student's real first name, not the auto-generated username.
- **Tour de-confliction** — the dashboard tour now auto-starts only for established users (question count > 0); the study config tour is suppressed when arriving with a preselected config or while onboarding is still pending, so no tour renders behind the modal.

---

### Parent Dashboard
**Status:** 🚧 In Progress (Mock Data)
**Description:** Parent oversight of student's grades and activities
**Pages:** /parent
**Components:** 
- `ParentDashboard.jsx`
**API Dependencies:** 
- Currently uses mock data
**Added:** Initial release

---

### Teacher Dashboard
**Status:** ✅ Completed
**Description:** Class analytics and student performance tracking
**Pages:** /teacher
**Components:** 
- `TeacherDashboard.jsx`
**API Dependencies:** 
- Currently uses mock data
**Added:** Initial release

---

### Teacher Class Links
**Status:** ✅ Completed
**Description:** Teachers bring students in with a class link. On `/teacher/classes` they create a link for a class and subject (optional section and class size), share it to WhatsApp, copy it, or download a QR code for the projector. Each link shows how many students joined, practised, and were active this week. Links can be turned off. A printable class progress report unlocks once enough students practise, and a printable "Champion Teacher" certificate once enough students practise across all links. A teacher with no students yet sees a "Create your class link" welcome card on `/teacher`.
**Pages:** /teacher/classes, /teacher/classes/:id/report, /teacher/certificate, /join/:code
**Components:**
- `teacher/TeacherClassLinks.jsx`
- `teacher/TeacherClassReport.jsx`
- `teacher/TeacherCertificate.jsx`
- `teacher/PrintSheet.jsx`
- `pages/JoinClass.jsx`
**API Dependencies:**
- POST `/teacher-classes`, GET `/teacher-classes/mine`, PATCH `/teacher-classes/:id`
- GET `/teacher-classes/:id/report`, GET `/teacher-classes/certificate`
- GET `/teacher-classes/join/:code`, POST `/teacher-classes/join/:code`
**Added:** October 2026

#### Join Page (`/join/:code`)
Students open the teacher's link and join in one tap. A guest signs up with Google or email and is joined automatically on return. After joining, the student can start practice with the class and subject already picked.

---

### Teacher Quiz Management
**Status:** ✅ Completed
**Description:** Teachers can create, edit, publish, and analyze quizzes. Includes question bank search and custom question creation. Uses custom DatePicker + time dropdown for deadline selection, custom Dropdown for all select fields (class, subject, show answers after), custom RangeSlider for passing percentage, and branded ConfirmDialog for delete/publish actions.
**Pages:** /teacher/quizzes, /teacher/quiz/new, /teacher/quiz/:quizId/edit
**Components:** 
- `TeacherQuizList.jsx`
- `QuizForm.jsx`
- `QuizQuestionManager.jsx`
- `QuizAnalytics.jsx`
- `QuizCard.jsx`
**API Dependencies:** 
- GET `/quiz/teacher/:teacherId`
- POST `/quiz`
- PUT `/quiz/:quizId`
- POST `/quiz/:quizId/publish`
- POST `/quiz/:quizId/close`
- GET `/quiz/:quizId/analytics`
**Added:** January 2026

---

### Teacher Question Paper Generator
**Status:** ✅ Completed
**Description:** Teachers and SuperAdmins can generate custom question papers with specific questions, view history, and download PDFs.
**Pages:** /question-paper, /question-paper/preview/:paperId, /question-paper/history
**Components:** 
- `QuestionPaperGenerator.jsx`
- `QuestionPaperPreview.jsx`
- `QuestionPaperHistory.jsx`
**API Dependencies:** 
- POST `/question-paper`
- GET `/question-paper/history`
- GET `/question-paper/:paperId/preview`
- DELETE `/question-paper/:paperId`
**Added:** April 2026

---

### Student Quiz Experience
**Status:** ✅ Completed
**Description:** Students can view available quizzes, take timed attempts, submit answers, and view detailed results with explanations. Includes offline answer safety net — answers that fail to save are queued in localStorage (`pendingQuizAnswers:<attemptId>`) and retried on reconnect + before final submit.
**Pages:** /quizzes, /quiz/:quizId/attempt/:attemptId, /quiz/result/:attemptId
**Components:** 
- `StudentQuizList.jsx`
- `QuizAttempt.jsx`
- `QuizResult.jsx`
- `QuizHistory.jsx`
**API Dependencies:** 
- GET `/quiz/student/available`
- POST `/quiz/:quizId/start`
- POST `/quiz/attempt/:attemptId/answer`
- POST `/quiz/attempt/:attemptId/submit`
- GET `/quiz/attempt/:attemptId/result`
- GET `/quiz/student/history`
**Added:** January 2026

---

## User Experience

### Landing Page
**Status:** ✅ Completed
**Description:** Modern, animated landing page with feature showcase and CTAs. The live student and answer counters are reserved from first paint (invisible until real numbers arrive, in fixed-width tabular digits), so they no longer push the hero around on load.
**Pages:** /
**Components:** 
- `LandingPage.jsx`
**Added:** December 2025

---

### About, Pricing and How It Works Pages
**Status:** ✅ Completed
**Description:** Plain company pages for visitors, search engines and AI answer engines. About covers what AskAide is and what it covers (CBSE / NCERT). How It Works explains how questions are generated from the NCERT chapter and checked, including the honest limits. The Pricing page is linked from the navbar, the mobile menu and the landing page. All three are prerendered and in the sitemap.
**Pages:** /about, /pricing, /how-it-works
**Components:**
- `pages/info/AboutPage.jsx`
- `pages/info/PricingPage.jsx`
- `pages/info/HowItWorksPage.jsx`
- `pages/info/InfoLayout.jsx`
**Added:** October 2026

---

### Free Question Paper Generator (Lead Magnet)
**Status:** ✅ Completed
**Description:** Publicly accessible endpoint for generating free question papers to capturing lead information (email/WhatsApp).
**Pages:** /free-paper-generator
**Components:** 
- `PublicPaperGenerator.jsx`
**API Dependencies:** 
- POST `/question-paper/public/generate`
**Added:** April 2026

---

### Settings
**Status:** ✅ Completed
**Description:** User preferences and app settings
**Pages:** /settings
**Components:** 
- `Settings.jsx`
**Added:** Initial release

---

### Feedback Form
**Status:** ✅ Completed
**Description:** Users can submit feedback about the platform
**Pages:** /feedback
**Components:** 
- `FeedbackForm.jsx`
**API Dependencies:** 
- POST `/feedback`
**Added:** Initial release

---

### Error Boundary
**Status:** ✅ Completed
**Description:** Catch-all error boundary with two recovery options: "Try again" (retries in-place) and "Go to dashboard" (navigates to `/dashboard`).
**Pages:** All pages
**Components:**
- `ErrorBoundary.jsx`
**Added:** Initial release

---

### 404 Page
**Status:** ✅ Completed
**Description:** Catch-all route for undefined paths. Shows a compass icon with contextual links — dashboard if logged in, home if not. Uses `<SEOHead noindex={true} />`.
**Pages:** `*` (catch-all)
**Components:**
- `NotFound.jsx`
**Added:** June 2026

---

### Offline Detection
**Status:** ✅ Completed
**Description:** App detects and displays network status. During practice, going offline pauses the session timer and coming back resumes it. Tab and app switches no longer open a "leave session?" dialog (answers are saved as they are given), and there is no native "leave site?" prompt on close.
**Pages:** All pages (App.jsx)
**Components:** 
- `App.jsx` (online/offline event listeners)
- `useSessionEvents.js` (online/offline handling and in-app navigation guard during a session)
**Added:** Initial release

---

### Legal Pages
**Status:** ✅ Completed
**Description:** Privacy policy and terms of service
**Pages:** /privacy-policy, /terms-of-service
**Components:** 
- `LegalPolicy.jsx`
- `TermsOfService.jsx`
**Added:** Initial release

---

*Document maintained by AskAideAI Development Team*
