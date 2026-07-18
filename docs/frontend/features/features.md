# Features

> Complete list of all user-facing features in the AskAideAI frontend application.
> Last Updated: June 29, 2026

---

## Authentication & User Management

### Login
**Status:** ✅ Completed
**Description:** Users can log in with email and password using JWT authentication. On session expiry, the system stores `auth:sessionExpired` + `auth:returnTo` flags in sessionStorage, redirects to `/login`, and shows a toast: "Your session expired. Please sign in again to continue." After login, the user is returned to their original destination.
**Pages:** /login
**Components:** 
- `Login.jsx`
**API Dependencies:** 
- POST `/auth/login`
**Added:** Initial release

---

### User Registration
**Status:** ✅ Completed
**Description:** New users can sign up with email, which triggers OTP verification
**Pages:** /signup, /verify-email
**Components:** 
- `Signup.jsx`
- `VerifyEmail.jsx`
**API Dependencies:** 
- POST `/auth/signup`
- POST `/auth/verifyOtp`
- POST `/auth/sendOtp`
**Added:** Initial release

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
**Description:** Users can view and update their profile information
**Pages:** /profile
**Components:** 
- `Profile.jsx`
**API Dependencies:** 
- GET `/profile/userDetails`
- PUT `/profile/updateProfile`
**Added:** Initial release

---

## AI-Powered Study Experience

### Study Configuration
**Status:** ✅ Completed
**Description:** Users select class, subject, chapter, question type, and difficulty before starting a practice session. Can also be pre-populated from the Progress page ("Start Learning" button navigates here with class/subject/chapter pre-selected)
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
**Description:** AI-generated questions with real-time feedback and explanations
**Pages:** /study
**Components:** 
- `QuestionPractice.jsx`
- `QuestionArea.jsx`
- `Sidebar.jsx`
- `UserAnswers.jsx`
**API Dependencies:** 
- GET `/questions/batch/chapter/:chapterId/type/:type/difficulty/:difficulty/session/:sessionId`
- POST `/sessions` (start session)
- PATCH `/sessions/:id/end` (end session)
- POST `/answers/batch`
**Polling Mechanism:** When questions are being generated, the frontend polls the question batch endpoint every 5 seconds (up to 30 retries). The response includes a `status` field with possible values:
  - `generating` — AI is still generating questions, retry later
  - `mastered` — all topics are mastered; no questions returned (positive terminal state)
  - `failed` — AI generation failed after retries; show error to user
**Added:** Initial release

---

### Session Results
**Status:** ✅ Completed
**Description:** Users can view session summary with correct/incorrect answers
**Pages:** /study
**Components:** 
- `SessionResultModal.jsx`
- `UserAnswers.jsx`
**API Dependencies:**
- Session data from Redux store
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
- GET `/topic-progress/progress/:userId/chapter/:chapterId`
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
- **Selection carried into study** — on completion, `OnboardingOverlay` navigates to `/study` with `location.state.preselectConfig` (class/subject/chapter + `mcq`/`Medium` defaults), so the student doesn't re-pick everything.
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

### Teacher Quiz Management
**Status:** ✅ Completed
**Description:** Teachers can create, edit, publish, and analyze quizzes. Includes question bank search and custom question creation. Uses custom DatePicker + time dropdown for deadline selection, custom Dropdown for all select fields (class, subject, show answers after), custom RangeSlider for passing percentage, and branded ConfirmDialog for delete/publish actions.
**Pages:** /teacher/quizzes, /teacher/quizzes/create, /teacher/quizzes/:id/edit
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
**Pages:** /student/quizzes, /quiz/:quizId/attempt, /quiz/result/:attemptId
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
**Description:** Modern, animated landing page with feature showcase and CTAs
**Pages:** /
**Components:** 
- `LandingPage.jsx`
**Added:** December 2025

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
**Description:** App detects and displays network status. Session `blur` listener was removed (was causing false "leave session?" prompts from innocuous focus loss); only `visibilitychange` is kept for genuine tab-switch detection.
**Pages:** All pages (App.jsx)
**Components:** 
- `App.jsx` (online/offline event listeners)
- `useSessionEvents.js` (visibility-only session tracking)
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
