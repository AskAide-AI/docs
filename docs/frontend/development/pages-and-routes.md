# Pages and Routes

> Complete reference of all pages and routing in the AskAideAI frontend.
> Last Updated: October 10, 2026

---

## Route Overview

| Path | Component | Auth | Roles | Description |
|------|-----------|------|-------|-------------|
| `/` | LandingPage | Public | All | Marketing landing page |
| `/free-paper-generator` | PublicPaperGenerator | Public | All | Free paper generation (Lead magnet) |
| `/login` | Login | Public | All | User login |
| `/signup` | Signup | Public | All | User registration. `?role=teacher` creates a Teacher account. |
| `/forgot-password` | ForgotPassword | Public | All | Request password reset |
| `/update-password/:id` | UpdatePassword | Public | All | Reset password with token |
| `/try` | TryNow | Public | All | Try before signup |
| `/about` | AboutPage | Public | All | What AskAide is and what it covers |
| `/pricing` | PricingPage | Public | All | Pricing page |
| `/how-it-works` | HowItWorksPage | Public | All | How questions are made and checked |
| `/blog` | BlogPage | Public | All | Blog listing |
| `/blog/:slug` | BlogPost | Public | All | Individual blog post |
| `/student/:userId` | StudentPublicProfile | Public | All | Shareable student profile |
| `/class/:classId` | SeoClassHubPage | Public | All | SEO class hub (subjects of one class) |
| `/class/:classId/subject/:subjectId` | SeoSubjectPage | Public | All | SEO subject landing page |
| `/class/:classId/subject/:subjectId/chapter/:chapterId` | SeoChapterPage | Public | All | SEO chapter landing page |
| `/c/:code` | ChallengePlay | Public | All | Play a friend's challenge without logging in |
| `/c/:code/results` | ChallengeResults | Protected | All | Challenge answers and full scoreboard |
| `/join/:code` | JoinClass | Public | All | Join a teacher's class from a class link |
| `/for-schools` | ForSchools | Public | All | Marketing page for schools |
| `/referral` | ReferralPage | Protected | All | Refer & Earn: invite link, gifts, friends, challenges |
| `/study` | Home | Protected | All | Study session interface |
| `/dashboard` | Dashboard | Protected | All | Student dashboard |
| `/profile` | Profile | Protected | All | Profile: edit name, change email with a code |
| `/settings` | Settings | Protected | All | App settings |
| `/progress` | Progress | Protected | All | Learning progress view |
| `/suggestions` | SuggestionBoard | Protected | All | Feature suggestion board |
| `/whats-new` | WhatsNew | Protected | All | Product updates |
| `/quizzes` | StudentQuizList | Protected | All | Student quiz listing |
| `/quiz/:quizId/attempt/:attemptId` | QuizAttempt | Protected | All | Take quiz |
| `/quiz/result/:attemptId` | QuizResult | Protected | All | Quiz result view |
| `/quiz/history` | QuizHistory | Protected | All | Past quiz attempts |
| `/question-paper` | QuestionPaperGenerator | Protected | SuperAdmin, Teacher | Teacher paper generation |
| `/question-paper/preview/:paperId` | QuestionPaperPreview | Protected | SuperAdmin, Teacher | View paper and PDF download |
| `/question-paper/history` | QuestionPaperHistory | Protected | SuperAdmin, Teacher | Generation history |
| `/parent/*` | ParentDashboard | Protected | SuperAdmin, Parent | Parent oversight |
| `/teacher/*` | TeacherDashboard | Protected | SuperAdmin, Teacher, Parent | Teacher analytics, class links, AI generator, quizzes |
| `/principal/*` | PrincipalDashboard | Protected | SuperAdmin, Principal | School-scoped analytics |
| `/admin` | AdminDashboard | Protected | SuperAdmin | Admin panel |
| `/feedback` | FeedbackForm | Public | All | User feedback form |
| `/privacy-policy` | LegalPolicy | Public | All | Privacy policy |
| `/terms-of-service` | TermsOfService | Public | All | Terms of service |
| `*` | NotFound | Public | All | 404 catch-all — compass icon + contextual links |

Public marketing URLs end in a trailing slash (`/about/`, `/blog/<slug>/`, `/class/.../`). A small script in `index.html` sends the slash-less form to the slash form before the app loads, so it doesn't index as a copy of the home page. App routes (`/study`, `/dashboard`, …) are left alone.

### Tab titles

Signed-in pages set their own browser tab title, `<Page> | AskAide` (for example `Study | AskAide`, `Refer & Earn | AskAide`), and are marked `noindex`. `App.jsx` picks the title from the first matching path prefix in `APP_TITLES`. Before this, the tab kept the last public page's title (such as "Create Account" during practice).

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
**Description:** User login with email or username and password
**Authentication:** Public (redirects to /dashboard if already logged in)
**API Calls:** 
- POST `/authenticate/login`
- POST `/authenticate/google` (when Google sign-in is configured)
**Features:**
- Email-or-username and password form
- Google sign-in button (`FitGoogleLogin`, sized to its container so it never spills off a small phone)
- "Forgot password" link
- Link to signup, plus "Teacher? Create a free teacher account" (`/signup?role=teacher`)
- After sign-in, a pending class join (`/join/:code`) or a guest's challenge play (`/c/:code/results`) wins over the usual role landing

---

### /signup
**Component:** `src/components/auth/Signup.jsx`
**Description:** New user registration. `?role=teacher` switches the page to a teacher account (heading, newsletter copy, no referral code field) and creates a `Teacher` user.
**Authentication:** Public
**API Calls:** 
- POST `/authenticate/signup`
- POST `/authenticate/google` (sends `accountType: 'Teacher'` on the teacher page)
**Features:**
- Name, email, password form, and an optional referral code (students only)
- Password checklist: 8+ characters with at least one letter and one number
- Google sign-in button (`FitGoogleLogin`)
- Reads `?ref=` and the remembered invite code and UTM tags (`utils/acquisition.js`) and sends them with both email and Google signup
- Shows the live student count (no hardcoded number)
- Link to switch between the student and teacher sign-up
- Teachers land on `/teacher`, students on `/study`

---


### /forgot-password
**Component:** `src/components/auth/ForgotPassword.jsx`
**Description:** Request password reset email
**Authentication:** Public
**API Calls:**
- POST `/authenticate/reset-password-token`
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
- POST `/authenticate/reset-password`
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
- GET `/study/configuration` (classes with subjects and chapters)
- GET `/questions/batch/chapter/:chapterId/type/:type/difficulty/:difficulty/session/:sessionId`
- POST `/sessions`
- PATCH `/sessions/:id/end`
- POST `/user-answers/batch` (one answer per call, sent the moment it is given)
- POST `/challenges` (Challenge a friend, from the result card)
**Features:**
- Study configuration panel
- Question display
- Answer submission
- Session management
- Results modal
- Opens on the chapter a visitor tried on `/try`, once, after they sign up (see below)
- No "leave session?" prompt on tab or app switches; in-app navigation still asks to confirm

**First session after `/try`:** `/try` saves the chosen class, subject and chapter for 24 hours (`utils/tryChoice.js`). After signup, the onboarding wizard uses that chapter when the subject matches; otherwise the study picker opens pre-filled with it. The choice is used once, then cleared. The practice tour now starts after the first answer, so it doesn't cover the first question.

**Leaving a session:** answers are saved as they are given, so leaving loses nothing. If the student leaves without pressing End Session, the session is still ended: on in-app navigation by a normal request, and when the tab closes by a `keepalive` request on `pagehide`.

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
- Notification bell beside the greeting on phones (app pages have no top bar there)
- Quick stats (streak, badges)
- Continue session banner (the whole banner resumes, not only its button)
- Daily goal card (the "N left" count links to practice)
- Daily challenge card
- Weekly class leaderboard (resets every Monday)
- Quick action buttons
- Progress summary

---

### /profile
**Component:** `src/components/pages/Profile.jsx`
**Description:** User profile view and edit
**Authentication:** Protected (ProtectedRoute)
**API Calls:**
- GET `/profile/details`
- PUT `/profile/name` (`NameEditor`)
- POST `/profile/email/request-change`, POST `/profile/email/confirm-change` (`EmailChanger`)
**Features:**
- Profile picture
- Name with an inline **Edit** (2–100 characters)
- Email with a **Change** flow: enter the new address, get a 6-digit code there, enter it to switch. The email only changes once the code is confirmed. Server errors (tries left, expired code, address taken) are shown as sent, with a 60-second resend countdown.
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
- GET `/topic-progress/progress/subject/:subjectId`
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
**Allowed Roles:** SuperAdmin, Parent
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

### /teacher/*
**Component:** `src/components/dashboard/TeacherDashboard.jsx` (nested routes)
**Description:** Teacher analytics dashboard, class links, AI generator and quizzes
**Authentication:** Protected (RoleProtectedRoute)
**Allowed Roles:** SuperAdmin, Teacher, Parent
**Nested routes:**

| Path | Component |
|------|-----------|
| `/teacher` | `TeacherSubjectSelector` (home; empty state starts the class-link flow) |
| `/teacher/subject/:subjectId` (+ `/students`, `/student/:studentId`, `/chapter/:chapterId`, `/weak-topics`, `/activity`) | Subject analytics screens |
| `/teacher/classes` | `TeacherClassLinks` |
| `/teacher/classes/:id/report` | `TeacherClassReport` (printable) |
| `/teacher/certificate` | `TeacherCertificate` (printable) |
| `/teacher/ai-generator` | `TeacherAIGenerator` |
| `/teacher/quizzes`, `/teacher/quiz/new`, `/teacher/quiz/:quizId` (+ `/edit`, `/questions`, `/analytics`) | Quiz authoring |

**API Calls:**
- `GET /teacher-dashboard/:teacherId/my-assignments` - Assigned subjects/classes
- `GET /teacher-dashboard/:teacherId/subject/:subjectId/dashboard` - Subject overview
- `GET /teacher-dashboard/:teacherId/subject/:subjectId/students` - Student list with progress
- `GET /teacher-dashboard/:teacherId/subject/:subjectId/chapter/:chapterId/analytics` - Chapter analytics
- `GET /teacher-dashboard/:teacherId/subject/:subjectId/weak-topics` - Weak topics report
- `GET /teacher-dashboard/:teacherId/subject/:subjectId/activity` - Activity feed
- `POST /teacher-classes`, `GET /teacher-classes/mine`, `PATCH /teacher-classes/:id` - Class links
- `GET /teacher-classes/:id/report`, `GET /teacher-classes/certificate` - Report and certificate
**Features:**
- Class overview
- Student performance list
- Topic difficulty analysis
- Weak topic identification
- Activity feed
- "Invite students" button and, for a teacher with no students yet, a "Create your class link" welcome card

#### /teacher/classes (class links)
- Create a class link for a class and subject, with an optional section name and expected number of students
- Share it to WhatsApp, copy it, or download a QR code for the projector (`qrcode.react`)
- Per link: "N of M joined · N practised · N active this week", with a progress bar when the class size is set
- Turn a link off or on
- The class progress report unlocks once enough students practise; the "Champion Teacher" certificate shows progress across all links and opens at `/teacher/certificate` when earned

---

### /principal/*
**Component:** `src/components/dashboard/PrincipalDashboard.jsx` (nested, lazy-loaded screens)
**Description:** School-scoped analytics for principals
**Authentication:** Protected (RoleProtectedRoute)
**Allowed Roles:** SuperAdmin, Principal
**Nested routes:** index (overview), `classes`, `subjects`, `teachers`, `students`, `student/:studentId`
**API Calls:** `/principal/*` (`principal.api.js`)

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
- AI System — view, test and switch the live LLM instantly (`/admin/system/llm/*`)

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
- Remembers the chosen chapter for a day, so the first real session after signup opens on it

---

### /about, /pricing, /how-it-works
**Components:** `src/components/pages/info/AboutPage.jsx`, `PricingPage.jsx`, `HowItWorksPage.jsx` (shared `InfoLayout.jsx`)
**Description:** Plain "company" pages for search and AI engines
**Authentication:** Public
**Features:**
- **About:** what AskAide is, what it covers (CBSE / NCERT), and how to get in touch
- **Pricing:** the pricing page (linked from the navbar, the mobile menu and the landing page)
- **How it works:** how questions are generated from the NCERT chapter and checked, including the honest limits
- Rendered as static markup, prerendered, and listed in the sitemap
- Linked from the landing page footer and from each other's footers

---

### /c/:code (Challenge a friend)
**Component:** `src/components/pages/ChallengePlay.jsx`
**Description:** A friend opens a classmate's challenge from WhatsApp and plays the same questions without logging in
**Authentication:** Public, `noindex`. App chrome (onboarding, AI assistant, guest CTA bar) stays out of the way.
**API Calls:**
- GET `/challenges/:code`
- POST `/challenges/:code/attempts`
**Features:**
- Intro with the sender's score; a guest types a first name
- One question at a time, no right/wrong reveal (the answers are the reason to sign in)
- Result: won, lost or tie against the sender, plus the scoreboard
- "Join free to see the right answers" with Google or email sign-up. A guest's play is saved with a claim token and claimed after sign-in.
- Explains that the friend's challenge answers count towards the referral gift
- Share the challenge onwards on WhatsApp

---

### /c/:code/results
**Component:** `src/components/pages/ChallengeResults.jsx`
**Description:** Answers with explanations and the full scoreboard for a challenge
**Authentication:** Protected (ProtectedRoute)
**API Calls:**
- POST `/challenges/attempts/:attemptId/claim` (a guest's play, after sign-in)
- GET `/challenges/:code/review`
**Features:**
- Claims a pending guest play, then shows the review
- Shows the referral gift as unlocked when the challenge answers reached the goal
- "Practise this chapter" opens `/study` on the challenge's chapter (a brand-new student goes through onboarding first, which picks it up)
- Share the challenge on WhatsApp

---

### /join/:code (Join a class)
**Component:** `src/components/pages/JoinClass.jsx`
**Description:** Students join their teacher's class from a class link
**Authentication:** Public, `noindex`
**API Calls:**
- GET `/teacher-classes/join/:code` (public class info)
- POST `/teacher-classes/join/:code` (signed-in student)
**Features:**
- Shows the class and teacher, or "Hmm, no class here" for a bad or turned-off link
- A signed-in student joins in one tap, then can start practice with the class and subject pre-selected
- A guest signs up with Google or email; the join is stored as pending and done automatically on return (it wins over a pending challenge)

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
**Description:** Refer & Earn: invite friends, track the gift, and redeem rewards
**Authentication:** Protected (ProtectedRoute)
**API Calls:**
- GET `/referral/my-code`
- GET `/challenges/mine`
- POST `/referral/rewards/practice-paper`
**Features:**
- Invite link and a copyable invite message
- The gift both people get when a friend answers enough questions on a new account: a free practice paper and a streak shield
- "Your gifts": redeem a practice paper for any chapter (downloads a PDF)
- Squad badges
- Friends who joined, with their status
- Challenges you sent

Every share button adds the signed-in student's `?ref=` code to links to our own site (`hooks/useReferralCode.js`).

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

### /class/:classId
**Component:** `src/components/pages/SeoClassHubPage.jsx`
**Description:** SEO class hub listing the subjects of one class
**Authentication:** Public
**Features:**
- Subject cards linking to each subject page
- "Page Not Found" state for an unknown class

---

### /class/:classId/subject/:subjectId
**Component:** `src/components/pages/SeoSubjectPage.jsx`
**Description:** SEO-optimized subject landing page
**Authentication:** Public
**Features:**
- Subject overview
- Chapter listing
- SEO structured data (CourseSchema)

---

### /class/:classId/subject/:subjectId/chapter/:chapterId
**Component:** `src/components/pages/SeoChapterPage.jsx`
**Description:** SEO-optimized chapter landing page
**Authentication:** Public
**Features:**
- Chapter details
- Topic preview with real practice questions from the build-time snapshot
- SEO structured data
- `noindex, follow` when the chapter has no snapshot questions yet
- Old chapter URLs built from raw names (for example a slug with a leading number) redirect to the current chapter URL
- The page is keyed on the class/subject/chapter URL, so moving to another chapter remounts it with fresh state

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
- Shows a spinner while the profile loads
- Checks if user role is in `allowedRoles` array
- Shows an error toast and redirects to `/` if role not allowed
- Renders children if role is allowed

---

## Navigation Behavior

### Navbar Visibility
- Hidden on `/login` and `/signup` pages
- On desktop app pages (`/study`, `/dashboard`, `/teacher`, …) the `AppSidebar` replaces the Navbar
- Visible on public pages

### Notification Bell
Signed-in users get one notification panel, opened from several places:
- Desktop app pages: the bell in `AppSidebar`
- Public pages: the bell in the `Navbar`
- Phones: the bell beside the dashboard greeting, the unread count on the BottomNav **Menu** tab, and a **Notifications** row in the mobile menu

### Mobile Navigation
- `BottomNav` shown on mobile for app pages
- `MobileMenu` slide-out for additional options: public links such as Pricing and For Schools for guests, a Notifications row for signed-in users, the theme toggle and sign out

### Scroll Behavior
- `ScrollToTop` component scrolls to top on route change

---

*Document maintained by AskAideAI Development Team*
