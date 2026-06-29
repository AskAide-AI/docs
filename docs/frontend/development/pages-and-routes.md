# Pages and Routes

> Complete reference of all pages and routing in the AskAideAI frontend.
> Last Updated: June 26, 2026

---

## Route Overview

| Path | Component | Auth | Roles | Description |
|------|-----------|------|-------|-------------|
| `/` | LandingPage | Public | All | Marketing landing page |
| `/free-paper-generator` | PublicPaperGenerator | Public | All | Free paper generation (Lead magnet) |
| `/login` | Login | Public | All | User login |
| `/signup` | Signup | Public | All | User registration |
| `/verify-email` | VerifyEmail | Public | All | Email OTP verification |
| `/forgot-password` | ForgotPassword | Public | All | Request password reset |
| `/update-password/:id` | UpdatePassword | Public | All | Reset password with token |
| `/try` | TryNow | Public | All | Try before signup |
| `/blog` | BlogPage | Public | All | Blog listing |
| `/blog/:slug` | BlogPost | Public | All | Individual blog post |
| `/student/:userId` | StudentPublicProfile | Public | All | Shareable student profile |
| `/class/:classId/subject/:subjectId` | SeoSubjectPage | Public | All | SEO subject landing page |
| `/class/:classId/subject/:subjectId/chapter/:chapterId` | SeoChapterPage | Public | All | SEO chapter landing page |
| `/referral` | ReferralPage | Protected | All | Referral program page |
| `/for-schools` | ForSchools | Public | All | Marketing page for schools |
| `/study` | Home | Protected | All | Study session interface |
| `/dashboard` | Dashboard | Protected | All | Student dashboard |
| `/profile` | Profile | Protected | All | User profile management |
| `/settings` | Settings | Protected | All | App settings |
| `/progress` | Progress | Protected | All | Learning progress view |
| `/quizzes` | StudentQuizList | Protected | All | Student quiz listing |
| `/quiz/:quizId/attempt/:attemptId` | QuizAttempt | Protected | All | Take quiz |
| `/quiz/result/:attemptId` | QuizResult | Protected | All | Quiz result view |
| `/quiz/history` | QuizHistory | Protected | All | Past quiz attempts |
| `/question-paper` | QuestionPaperGenerator | Protected | SuperAdmin, Teacher | Teacher paper generation |
| `/question-paper/preview/:paperId` | QuestionPaperPreview | Protected | SuperAdmin, Teacher | View paper and PDF download |
| `/question-paper/history` | QuestionPaperHistory | Protected | SuperAdmin, Teacher | Generation history |
| `/parent/*` | ParentDashboard | Protected | SuperAdmin, Parent, Teacher | Parent oversight |
| `/teacher` | TeacherDashboard | Protected | SuperAdmin, Teacher, Parent | Teacher analytics |
| `/admin` | AdminDashboard | Protected | SuperAdmin | Admin panel |
| `*` | NotFound | Public | All | 404 catch-all — compass icon + contextual links |
| `/feedback` | FeedbackForm | Public | All | User feedback form |
| `/privacy-policy` | LegalPolicy | Public | All | Privacy policy |
| `/terms-of-service` | TermsOfService | Public | All | Terms of service |

---

## Public Routes

### / (Landing Page)
**Component:** `src/components/pages/LandingPage.jsx`
**Description:** Marketing landing page with product overview, features, and CTAs
**Authentication:** Public
**API Calls:** None
**Features:**
- Hero section with animated elements
- Feature showcase
- Statistics/social proof
- Testimonials
- Call-to-action buttons

---

### /free-paper-generator
**Component:** `src/components/pages/PublicPaperGenerator.jsx`
**Description:** Free paper generation to capture leads
**Authentication:** Public
**API Calls:**
- POST `/question-paper/public/generate`
**Features:**
- Form to generate custom paper
- Capture lead information (WhatsApp/Email)
- Provide instant PDF download
- Reuses logic from study APIs

---

### /login
**Component:** `src/components/auth/Login.jsx`
**Description:** User login with email and password
**Authentication:** Public (redirects to /dashboard if already logged in)
**API Calls:** 
- POST `/auth/login`
**Features:**
- Email/password form
- "Remember me" checkbox
- "Forgot password" link
- Link to signup

---

### /signup
**Component:** `src/components/auth/Signup.jsx`
**Description:** New user registration
**Authentication:** Public
**API Calls:** 
- POST `/auth/signup`
- POST `/auth/sendOtp`
**Features:**
- Name, email, password form
- Terms acceptance checkbox
- Triggers OTP verification

---

### /verify-email
**Component:** `src/components/auth/VerifyEmail.jsx`
**Description:** Email verification with OTP code
**Authentication:** Public
**API Calls:**
- POST `/auth/verifyOtp`
- POST `/auth/sendOtp` (resend)
**Features:**
- 6-digit OTP input
- Resend OTP button
- Timer for resend cooldown

---

### /forgot-password
**Component:** `src/components/auth/ForgotPassword.jsx`
**Description:** Request password reset email
**Authentication:** Public
**API Calls:**
- POST `/auth/resetPasswordToken`
**Features:**
- Email input
- Success message with email instructions

---

### /update-password/:id
**Component:** `src/components/auth/UpdatePassword.jsx`
**Description:** Set new password using reset token
**Authentication:** Public
**URL Parameters:**
- `id`: Reset token from email link
**API Calls:**
- POST `/auth/resetPassword`
**Features:**
- New password input
- Confirm password input
- Password strength indicator

---

### /feedback
**Component:** `src/components/pages/FeedbackForm.jsx`
**Description:** User feedback submission form
**Authentication:** Public
**API Calls:**
- POST `/feedback`
**Features:**
- Feedback category selection
- Text area for feedback
- Rating (optional)

---

### /privacy-policy
**Component:** `src/components/pages/LegalPolicy.jsx`
**Description:** Privacy policy document
**Authentication:** Public
**Features:** Static content

---

### /terms-of-service
**Component:** `src/components/pages/TermsOfService.jsx`
**Description:** Terms of service document
**Authentication:** Public
**Features:** Static content

---

## Protected Routes

### /study
**Component:** `src/components/study/Home.jsx`
**Description:** Main study interface with question practice
**Authentication:** Protected (ProtectedRoute)
**API Calls:**
- GET `/study/configuration/classes`
- GET `/study/configuration/subjects`
- GET `/study/configuration/chapters/:subjectId`
- GET `/questions/batch/chapter/:chapterId/type/:type/difficulty/:difficulty/session/:sessionId`
- POST `/sessions`
- PUT `/sessions/:id`
- POST `/answers/batch`
**Features:**
- Study configuration panel
- Question display
- Answer submission
- Session management
- Results modal

---

### /dashboard
**Component:** `src/components/dashboard/Dashboard.jsx`
**Description:** Student dashboard with overview and quick actions
**Authentication:** Protected (ProtectedRoute)
**API Calls:**
- GET `/study/configuration` - Get classes/subjects
- GET `/sessions/last-incomplete/:userId` - Resume last session
- GET `/streaks/:userId` - Streak data
- GET `/daily-challenge/:userId` - Daily challenge
- GET `/badges/:userId` - Badge data
- GET `/session-feedback/nps/check/:userId` - NPS prompt
**Features:**
- Welcome message
- Quick stats (streak, badges)
- Continue session button
- Daily challenge card
- Quick action buttons
- Progress summary

---

### /profile
**Component:** `src/components/pages/Profile.jsx`
**Description:** User profile view and edit
**Authentication:** Protected (ProtectedRoute)
**API Calls:**
- GET `/profile/userDetails`
- PUT `/profile/updateProfile`
**Features:**
- Profile picture
- Name, email display
- Edit profile form
- Password change option

---

### /settings
**Component:** `src/components/pages/Settings.jsx`
**Description:** Application settings and preferences
**Authentication:** Protected (ProtectedRoute)
**Features:**
- Notification preferences
- Theme settings (planned)
- Account settings

---

### /progress
**Component:** `src/components/pages/Progress.jsx`
**Description:** Learning progress tracking
**Authentication:** Protected (ProtectedRoute)
**API Calls:**
- GET `/topic-progress/user/:userId/subject/:subjectId`
- GET `/topic-progress/progress/:userId/chapter/:chapterId`
- GET `/topic-progress/ai-insights/chapter/:chapterId`
- GET `/topic-progress/ai-insights/subject/:subjectId`
**Features:**
- Subject progress cards
- Chapter breakdown
- Topic-level progress
- AI insights panel

---

## Role-Protected Routes

### /parent/*
**Component:** `src/components/dashboard/ParentDashboard.jsx`
**Description:** Parent oversight dashboard
**Authentication:** Protected (RoleProtectedRoute)
**Allowed Roles:** SuperAdmin, Parent, Teacher
**API Calls:**
- `GET /parent-dashboard/children` - Linked children overview
- `GET /parent-dashboard/child/:studentId/overview` - Child progress
- `GET /parent-dashboard/child/:studentId/subject/:subjectId/progress` - Subject progress
- `GET /parent-dashboard/child/:studentId/subject/:subjectId/weak-topics` - Weak topics
**Features:**
- Child's grades overview
- Activity summary
- Progress alerts
- Weak topic identification

---

### /teacher
**Component:** `src/components/dashboard/TeacherDashboard.jsx`
**Description:** Teacher analytics dashboard
**Authentication:** Protected (RoleProtectedRoute)
**Allowed Roles:** SuperAdmin, Teacher, Parent
**API Calls:**
- `GET /teacher-dashboard/:teacherId/my-assignments` - Assigned subjects/classes
- `GET /teacher-dashboard/:teacherId/subject/:subjectId/dashboard` - Subject overview
- `GET /teacher-dashboard/:teacherId/subject/:subjectId/students` - Student list with progress
- `GET /teacher-dashboard/:teacherId/subject/:subjectId/chapter/:chapterId/analytics` - Chapter analytics
- `GET /teacher-dashboard/:teacherId/subject/:subjectId/weak-topics` - Weak topics report
- `GET /teacher-dashboard/:teacherId/subject/:subjectId/activity` - Activity feed
**Features:**
- Class overview
- Student performance list
- Topic difficulty analysis
- Weak topic identification
- Activity feed

---

### /question-paper
**Component:** `src/components/question-paper/QuestionPaperGenerator.jsx`
**Description:** Teacher paper generation interface
**Authentication:** Protected (RoleProtectedRoute)
**Allowed Roles:** SuperAdmin, Teacher
**API Calls:** POST `/question-paper`
**Features:**
- Selection of subject, class, chapters, difficulties
- Customize question count and details 
- Dynamic generation of test papers

---

### /question-paper/preview/:paperId
**Component:** `src/components/question-paper/QuestionPaperPreview.jsx`
**Description:** View generated paper and download PDF
**Authentication:** Protected (RoleProtectedRoute)
**Allowed Roles:** SuperAdmin, Teacher
**API Calls:** GET `/:paperId/preview`
**Features:**
- View generated paper details
- Download paper to PDF

---

### /question-paper/history
**Component:** `src/components/question-paper/QuestionPaperHistory.jsx`
**Description:** History of generated question papers
**Authentication:** Protected (RoleProtectedRoute)
**Allowed Roles:** SuperAdmin, Teacher
**API Calls:** GET `/question-paper/history`
**Features:**
- List all generated papers
- Delete previously generated papers

---

### /admin
**Component:** `src/components/dashboard/AdminDashboard.jsx`
**Description:** SuperAdmin control panel
**Authentication:** Protected (RoleProtectedRoute)
**Allowed Roles:** SuperAdmin only
**API Calls:** Multiple admin APIs
**Features:**
- Tabbed interface for admin modules
- School Management
- Teacher Management
- Student Management
- Section Management
- Link Management
- Chapter Upload
- Relation View
- Chapter-Topic View

---

### /quizzes
**Component:** `src/components/student/quiz/StudentQuizList.jsx`
**Description:** Student's available and past quizzes
**Authentication:** Protected (ProtectedRoute)
**API Calls:**
- `GET /quiz/student/available` - Available quizzes
- `GET /quiz/student/history` - Quiz history
**Features:**
- Available quizzes list
- Past quiz history
- Quiz status indicators

---

### /quiz/:quizId/attempt/:attemptId
**Component:** `src/components/student/quiz/QuizAttempt.jsx`
**Description:** Take a quiz (in-progress attempt)
**Authentication:** Protected (ProtectedRoute)
**API Calls:**
- `POST /quiz/:quizId/start` - Start attempt
- `POST /quiz/attempt/:attemptId/answer` - Submit answer
- `POST /quiz/attempt/:attemptId/submit` - Submit quiz
**Features:**
- Question display with navigation
- Timer (if time limit set)
- Auto-save answers
- Submit quiz with results

---

### /quiz/result/:attemptId
**Component:** `src/components/student/quiz/QuizResult.jsx`
**Description:** Quiz attempt result with detailed breakdown
**Authentication:** Protected (ProtectedRoute)
**API Calls:** `GET /quiz/attempt/:attemptId/result`
**Features:**
- Score and percentage
- Correct/incorrect breakdown
- Question-level review
- Pass/fail status

---

### /quiz/history
**Component:** `src/components/student/quiz/QuizHistory.jsx`
**Description:** Past quiz attempts history
**Authentication:** Protected (ProtectedRoute)
**API Calls:** `GET /quiz/student/history`
**Features:**
- Attempt list with dates
- Score trend visualization
- Filter by subject

---

## New Public Routes

### /try
**Component:** `src/components/pages/TryNow.jsx`
**Description:** Try-before-signup experience
**Authentication:** Public
**Features:**
- Sample study session demo
- Limited question preview

---

### /blog
**Component:** `src/components/blog/BlogPage.jsx`
**Description:** Blog listing with educational content
**Authentication:** Public
**Features:**
- Blog post cards
- Category filters
- SEO meta tags

---

### /blog/:slug
**Component:** `src/components/blog/BlogPost.jsx`
**Description:** Individual blog post
**Authentication:** Public
**Features:**
- Full article rendering
- Related posts
- Breadcrumb navigation
- SEO schema (ArticleSchema)

---
### /referral

**Component:** `src/components/pages/ReferralPage.jsx`
**Description:** Referral program landing
**Authentication:** Protected (ProtectedRoute)
**Features:**
- Referral code display
- Share buttons
- Reward progress

---

### /student/:userId
**Component:** `src/components/pages/StudentPublicProfile.jsx`
**Description:** Shareable student achievement profile
**Authentication:** Public
**API Calls:** `GET /profile/public/:userId`
**Features:**
- Student stats (streak, badges, progress)
- Share card generation

---

### /class/:classId/subject/:subjectId
**Component:** `src/components/seo/SeoSubjectPage.jsx`
**Description:** SEO-optimized subject landing page
**Authentication:** Public
**API Calls:** `GET /study/configuration`
**Features:**
- Subject overview
- Chapter listing
- SEO structured data (CourseSchema)

---

### /class/:classId/subject/:subjectId/chapter/:chapterId
**Component:** `src/components/seo/SeoChapterPage.jsx`
**Description:** SEO-optimized chapter landing page
**Authentication:** Public
**Features:**
- Chapter details
- Topic preview
- SEO structured data

---

### `*` (404 Catch-All)
**Component:** `src/components/pages/NotFound.jsx`
**Description:** Catch-all route for undefined paths. Shows a compass icon with "404 — page not found" and contextual links back to dashboard (if logged in) or home (if not). Uses `<SEOHead noindex={true} />` to prevent search indexing.
**Authentication:** Public
**Features:**
- Compass icon with 404 message
- Contextual navigation based on auth state
- noindex SEO meta tag

---

## Route Guards

### ProtectedRoute
**Location:** `/src/components/auth/ProtectedRoute.jsx`
- Checks if user is authenticated (token in localStorage)
- Redirects to `/login` if not authenticated
- Renders children if authenticated

### RoleProtectedRoute
**Location:** `/src/components/auth/RoleProtectedRoute.jsx`
- Extends ProtectedRoute functionality
- Checks if user role is in `allowedRoles` array
- Redirects to `/dashboard` if role not allowed
- Renders children if role is allowed

---

## Navigation Behavior

### Navbar Visibility
- Hidden on `/login` and `/signup` pages
- Visible on all other pages

### Mobile Navigation
- `BottomNav` shown on mobile for authenticated users
- `MobileMenu` slide-out for additional options

### Scroll Behavior
- `ScrollToTop` component scrolls to top on route change

---

*Document maintained by AskAideAI Development Team*
