# Changelog

> All notable changes to the AskAideAI frontend will be documented in this file.
> Format: [Semantic Versioning](https://semver.org/)
> Last Updated: October 19, 2026

---

## [Unreleased]

### October 2026

#### Added
- **Written questions on papers** (2026-10-19) — printed papers can now carry assertion-reason, 2-mark, 3-mark, 5-mark and case-based questions from a separate reviewed store (`paperquestions`; a person sets each draft `live`). The free generator shows how many questions of each type the chosen chapters have ready and lets the teacher count them; with written questions ready, an untouched form makes a 20-mark class test. The paper editor edits assertion-reason options and case-study parts with marks, and the PDF/Word output prints written sections and case parts with an answer key carrying the value points. Sections with a single question no longer say "marks each". Written questions are never shown to students.
- **Paper editor + Set A/B** (2026-10-18) — the shared editor (`question-paper/paper/`) prints a hand-made school paper: exam header (session, class & section, date, time), CBSE-style auto instructions, sections A/B with continuous numbering, swap / edit / delete / move / add own question, Set A + Set B, a separate answer key, PDF with an embedded DejaVu Serif Condensed subset (jsPDF's built-in fonts printed √ π → θ H₂O ≤ as garbage) and an editable Word file. Free papers keep their draft on the device (resume after reload or signup). Guest drafts are device-only; signed-in teachers autosave via `PUT /question-paper/:id`.
- **Homework status** — the quiz analytics page (`/teacher/quiz/:quizId/analytics`) lists every student the quiz is for as Done, In progress, Not done or Never logged in, with a one-tap reminder, a WhatsApp message to the parent and a way to give more time. Parents see **Homework this week** on the School card. New `teacher/quiz/QuizStudentsPanel.jsx`.
- **Pixel Buddy on Login** — a small pixel robot explains a failed sign-in in plain English and offers the next step as a button (Reset password or Create an account). Only `/login` is enabled (`BUDDY_ROUTES` in `src/buddy/config.js`); `VITE_BUDDY_ENABLED=false` turns it off everywhere.
- **Live demo school** — **See a live demo school** on For Schools signs in without a password as the demo Principal, Class Teacher, Parent or Student (`demoLogin()`, `POST /demo/login`). A banner on every app page says the school resets every night and has a **Leave demo** button. New `common/DemoBanner.jsx` and `school-ops/DemoSchoolCard.jsx` (SuperAdmin rebuild, on the Import screen).
- **School Ops** (`/school-ops/*`) — role-gated jobs for SuperAdmin, Principal and Teacher, one job per tabbed screen:
  - **Fees**: Collect (advance and several months in one receipt), Billing, Setup (SuperAdmin), Receipts.
  - **Attendance**: Mark, Day view, Staff. **Timetable**: Today, Cover (Principal), Setup (SuperAdmin). **Gradebook**: Enter marks, Plans (SuperAdmin), Report cards (Principal).
  - **Day book** (`/school-ops/collections`): every receipt in a date range, downloadable as CSV and printable.
  - **TC**: request (Teacher or Principal), dues check, Principal override.
  - **Notices** (`/school-ops/notices`): for the whole school, one class or one section. Staff can share a notice to a class WhatsApp group.
  - **Parent logins** (`/school-ops/parents`, Principal and SuperAdmin): one login per family, printed on password slips with no email or SMS.
  - **Import** (SuperAdmin): CSV up to 500 rows, previewed before import.
- **Printable school documents** — A4 pages without app chrome: fee receipt (`/print/receipt/:receiptNo`), report card (`/print/report-card/:planId/:studentId`), TC (`/print/tc/:studentId`), day book (`/print/day-book`) and parent login slips, eight to a page (`/print/parent-slips`).
- **Principal Today** — `/principal` opens "Today at my school": attendance, fee collection, staff and TCs, each card linking to the School Ops page that acts on it.
- **Parent School card** — on `/parent`, for a child on a school class list: today's attendance, the month's register, fees due, overdue and next with receipts, report cards, notices from school and homework this week. New `dashboard/ChildSchoolCard.jsx`.
- **Study memory** — the last class, subject and chapter are remembered per browser (`utils/studyLastConfig.js`), so a returning student starts with one tap.
- **First-session result** — a student's first finished session shows a short hero above the score, once.
- **Chapter coverage (Admin)** — a coverage line per class (covered, ready, need PDF) and a **Generate next 3 empty** button in chapter management.
- **In-app notifications** — a bell, panel and toast for signed-in users. One shared store (`hooks/useNotifications.js`) polls the unread count every 60 s while the tab is visible. Bells sit in the desktop `AppSidebar`, the public `Navbar` and beside the dashboard greeting on phones; on phones the BottomNav **Menu** tab shows the count and the mobile menu has a Notifications row. `NotificationCenter` is a top sheet on phones and a popover on desktop, and opening it marks everything read. `NotificationToaster` shows the newest unread once and stays quiet on `/study` and `/quiz/`. New `notification.api.js`.
- **Challenge a friend** — `/c/:code` lets friends play a classmate's questions from WhatsApp without logging in and see who won; `/c/:code/results` (signed in) shows answers and the scoreboard. A guest's play is claimed after sign-up. "Challenge on WhatsApp" on the session result card. New `challenge.api.js`, `ChallengePlay`, `ChallengeResults`, `ChallengeShareCard`, `ChallengeGiftNote`.
- **Invite attribution** — the first visit's `?ref=` code and UTM tags are remembered (`utils/acquisition.js`) and sent with both email and Google signup (Google signup used to drop the code). Every share button adds the student's `?ref=` to links to our own site (`hooks/useReferralCode.js`).
- **Teacher class links** — `/teacher/classes`: create a class link, share it to WhatsApp, copy it, or download a QR for the projector (`qrcode.react`); see joined / practised / active-this-week counts; printable class report (`/teacher/classes/:id/report`) and Champion Teacher certificate (`/teacher/certificate`). New `teacherClass.api.js`.
- **Join page** — `/join/:code`: students join a teacher's class; guests sign up with Google or email and are joined automatically when they come back.
- **Teacher self-signup** — `/signup?role=teacher` creates a Teacher account (email or Google) that lands on `/teacher`, whose empty state now starts the class-link flow. Teacher entry points on Login and For Schools.
- **Profile editing** — inline name edit (`NameEditor`) and email change with a 6-digit code sent to the new address (`EmailChanger`), with server errors and a resend countdown.
- **About, Pricing and How-it-works pages** — `/about`, `/pricing`, `/how-it-works`, linked from the navbar, mobile menu and footers, prerendered and in the sitemap.
- **First session on the `/try` chapter** — `/try` remembers the chosen chapter for a day (`utils/tryChoice.js`); after signup the onboarding wizard (same subject) or the study picker opens on it, once.
- **Badges** — Challenger, Challenge Champion, Squad Starter, Squad Leader and Class Captain added to `src/constants/badges.js` (21 badges).
- **`FitGoogleLogin`** — sizes Google's fixed-width sign-in button to its container.
- **`authorizedFetch()`** — `fetch` with the axios refresh-and-retry, used by the teacher AI stream and PDF export.

#### Changed
- **Study starts on Easy** — new sessions, the first onboarding session and the study picker's default difficulty are Easy (they were Medium).
- **Role access matches the nav** — `/teacher/*` is for SuperAdmin and Teacher only (Parent removed). A missing account type counts as Student in route guards, as it does in the nav.
- **Refer & Earn gift** — a referred friend's new account answers 3 questions (not 10) to unlock the gift; the copy says so.
- **Public pages match the product** — difficulty levels, contact emails and upload copy corrected; GitHub and LinkedIn links hidden in the landing and About footers.
- **School Ops polish** — the School Ops, principal Today and parent screens share the Quiet Scholar styling.
- **Referral page** — challenge-first hero on top, plain invite link secondary.
- **Refer & Earn rebuilt** — invite link, progress to the friend's gift (free practice paper and streak shield), practice-paper redeem (PDF), squad badges, friends' status and challenges sent.
- **Signed-in tab titles** — signed-in pages set `<Page> | AskAide` per route instead of keeping the last public page's title.
- **No tab-switch warning during practice** — answers save as they are given, so the "leave session?" dialog no longer fires on tab or app switches and there is no native unload prompt. In-app navigation still asks to confirm.
- **Practice tour** — starts after the first answer instead of covering the first question.
- **Token refresh across tabs** — one shared in-flight refresh per tab, under a Web Lock across tabs; a request sent with an older token than the stored one is just retried.
- **Self-hosted fonts** — Fraunces, Inter Tight and JetBrains Mono are served from `/fonts` and the four latin files are preloaded; the Google Fonts requests and their Workbox caches are gone.
- **Real favicon files** — `favicon.ico`, `favicon.svg`, `apple-touch-icon.png` and the PWA icon set (generated by `scripts/generate-icons.mjs`) replace the inline `data:` icon; `manifest.json` points at them.
- **Prerender output** — pages load with dynamic `import()`, so the shared prerender chunk is much smaller; Helmet's HTML entities are decoded in head tags; slash-less public URLs redirect to their trailing-slash page before the app loads.
- **Chapter indexing** — the chapter content snapshot was regenerated, so more chapter pages drop `noindex` and join the sitemap (120 URLs).
- **Claims** — board coverage copy now says CBSE / NCERT.
- **Signup** — password rule is 8+ characters with a letter and a number; the page shows the live student count.
- **Onboarding greeting** — uses the student's first name instead of the auto-generated username.
- **Leaderboard copy** — the card now says "this week's learners" and "It resets every Monday", matching the weekly ranking.
- **Class dropdown** — the list is 280px tall, so all 7 classes (6th–12th) show without an inner scroll.
- **Result card** — "Challenge on WhatsApp" is pinned in the footer, visible without scrolling on every phone (shorter label below 360px).

#### Fixed
- **Refresh race before logout** — a refresh rejected because another tab had already rotated the token re-reads storage once and retries, instead of logging the user out.
- **School Ops pickers** — class lists and pickers replace pasted IDs; the principal's or teacher's school name shows; a cancelled bill has no Collect button; SuperAdmin publish works.
- **Demo banner** — sits in the content column, not over the desktop sidebar.
- **Parent slip** — the header wraps the full school name; long login IDs fit on one line.
- **Quiz Try Again and history** — **Try Again** on the result page (shown when `attempt.canRetry` is `true`) starts a new attempt and opens it. The quiz list header and the result page link to `/quiz/history`.
- **Quiz page load** — `QuizAttempt` declares `flushPending` before the effect that depends on it, so the page renders instead of the error screen.
- **Public student page stats** — `StudentPublicProfile` reads the streak and stats from `GET /profile/public/:userId` alone, so signed-out visitors see the real numbers.
- **Result card after a new badge** — the badge check returned `{ badgeId, title }` objects but the result modal expected IDs, so any session that earned a badge (including First Steps on a first session) ended with no result card. The API layer now maps to IDs and the popup skips unknown badges.
- **Two tabs logging each other out** — two tabs refreshing with the same single-use refresh token no longer log the slower tab out.
- **AI stream and PDF export after token expiry** — they now refresh instead of failing with a bare 401.
- **Landing hero shift** — the live counters are reserved from first paint in fixed-width tabular digits, so they no longer push the hero and CTAs down.
- **Legacy chapter URLs** — old chapter slugs built from raw names redirect to the current chapter URL instead of "Page Not Found"; the chapter page remounts when the chapter changes.
- **Dead clicks** — the whole "Continue your session" banner resumes; the daily goal "N left" count links to practice; landing "why" cards no longer lift on hover; mobile menu "For Schools" opens `/for-schools/` and the FAQ section has its `#faq` anchor.
- **Small phones (320–412px)** — Google sign-in buttons no longer spill off narrow screens; grids use `minmax(min(Npx, 100%), 1fr)` so 240–300px minimum columns don't overflow; the dashboard streak strip and practice header no longer clip at 320px.

### July 2026 (mid-month)

#### Added
- **App-level first-run onboarding gate (`FirstRunGate.jsx`)** — the welcome-wizard decision moved out of `Dashboard.jsx` to a lazy app-level component mounted in `App.jsx` for authenticated non-public routes, so the wizard fires wherever a new student lands (signup drops them on `/study`, not `/dashboard`). Student-only; confirms no session history via `studyApi.fetchSessionsByUserId` when the `onboarding_<userId>` flag is unset (guards returning users with cleared storage); falls back to showing on network error.
- **Guest mobile CTA bar (`GuestMobileCTA.jsx`)** — persistent fixed bottom bar on phones for logged-out visitors on public marketing pages, keeping a one-tap "Start free — no signup" path to `/try` visible after the top nav collapses to a hamburger. Hidden on `/try`, `/login`, `/signup`; desktop unaffected (`md:hidden`). Mounted from `App.jsx` only when `isPublicRoute && !user`.
- **Compact "Log in" in mobile navbar** — returning guests get a top-right "Log in" pill on small screens instead of it being buried in the hamburger drawer (`Navbar.jsx`, `md:hidden`).
- **Password requirements checklist on Signup** — live checklist (8+ chars, uppercase, lowercase, number, symbol `!@#$%^&*`) below the password field, each item ticking green (`✓`) as met; complements the existing strength meter (`Signup.jsx`).
- **Landing role-card CTAs** — "For Students" and "For Parents" role cards now link to `/try`; "For Teachers"/"For Schools" retain their existing CTAs (`LandingPage.jsx`).

#### Changed
- **Onboarding carries selection into study** — completing the welcome wizard now navigates to `/study` with `location.state.preselectConfig` (class/subject/chapter + `mcq`/`Medium` defaults) instead of a blank config, so the student doesn't re-pick everything (`OnboardingOverlay.jsx`).
- **Onboarding/tour de-confliction** — `Dashboard.jsx` no longer owns the onboarding overlay; its tour auto-starts only for established users (question count > 0), and the study config tour is suppressed when arriving with a preselected config or while first-run onboarding is pending (`Home.jsx`), so no tour renders behind the modal.
- **Trial social-proof stats now live** — `TryNow.jsx` fetches `statsApi.getPublicStats()` and renders real `totalStudents` / `totalQuestionsAnswered`, matching the landing page so `/` and `/try` never show contradictory numbers (fallbacks: 63 students / 10,000 questions).
- **Trial empty-state turned into a conversion moment** — when a chapter has no pre-built questions, `TryNow.jsx` now prompts creating a free account (AI generates fresh questions) instead of a dead-end "No questions available" message.
- **Subject range copy updated to Class 6–12** — landing FAQ, SEO `description`/`keywords` updated from "Class 9–12" to "Class 6–12" to match marketed coverage (`LandingPage.jsx`, `TermsOfService.jsx`). Note: SEO subject/chapter static pages + sitemap still only cover 9–12 pending real 6–8 chapter data.
- **Stronger signup password rule** — minimum raised 6 → 8 chars with a complexity pattern (upper + lower + digit + symbol) and 128-char max (`Signup.jsx`). Relaxed in October 2026 to a letter and a number.
- **Collapsed-sidebar hover tooltips** — `AppSidebar.jsx` replaces native `title` tooltips with styled hover tooltips (fixed-positioned to avoid overflow clipping) on the collapse, theme, and sign-out buttons plus collapsed nav items.

### Fixed
- **Profile rehydration bug (C1)** — `fetchUserDetails()` now reads `response.data.data` (sendSuccess envelope) before falling back to `response.data.user`; never overwrites stored state with falsy payload; `StudyConfig.jsx` guards against missing `user._id`; `RoleProtectedRoute` shows spinner while profile hydrates instead of blank shell
- **Trial "Correct: undefined" (C3)** — `TryNow.jsx` now defaults `correctAnswer` to `'—'` when absent
- **Rate-limit messaging (H1)** — Login branches on `error.response.status === 429` to show the server's message verbatim; login thunk preserves the original axios error (no longer wrapped in `new Error`)
- **Question-generation failure UX (C2)** — `GIVE_UP_MESSAGE` and `TIMEOUT_MESSAGE` replaced raw LLM apology with product copy offering actionable alternatives; zero-answer sessions are no longer persisted
- **Paper generator silent Next (H5)** — Step 1 now shows inline red validation text when no class is selected
- **React `borderRadius` prop warnings (L2)** — fixed extra `</div>` causing esbuild unterminated regex error in `QuestionPaperGenerator.jsx`

### Added
- **Auto-login after signup (H2)** — signup now uses returned tokens to auto-login and navigate to `/study`; falls back to `/login` if no tokens (OTP flow)
- **Role-aware landing (M3)** — after login, routes Teacher→`/teacher`, Principal→`/principal`, SuperAdmin→`/admin`, Parent→`/parent`
- **`getDisplayName()` helper (M1)** — new utility in `src/utils/displayName.js` that returns `firstName || name || email-prefix || 'Student'`; applied to Dashboard greeting and StudyConfig welcome text
- **Referral code input on signup (M5)** — new `referralCode` field reads `?ref=` URL param; sent to backend for auto-redeem; signup now says "Four fields" (was "Three")
- **Google Sign-In conditional (L1)** — `GoogleLogin` button and `GoogleOAuthProvider` wrapper only render when `VITE_GOOGLE_CLIENT_ID` is set
- **Sidebar profile loading state** — `ProfileLoader` spinner shown while profile rehydrates (replaces blank shell)

### Changed
- **Dashboard tour cut from 13→5 steps (M4)** — greeting, start-practicing, stats, today-activity, mastery
- **Trial social proof stats (M2)** — updated to "10,000+ students learning", "50,000+ questions answered", "seconds per question"
- **Login form deduplicated (L3)** — removed duplicate "Forgot password?" link inside error box; removed redundant `toast.error()` from login thunk catch block (inline error is sufficient)
- **Progress → Study navigation** — clicking a chapter's "Start Learning" on the Progress page now navigates to StudyConfig with the class/subject/chapter pre-selected, letting the user choose question type and difficulty before starting instead of using hardcoded defaults (`Progress.jsx`, `Home.jsx`, `StudyConfig.jsx`)
- **`useQuestionPolling` hook rewrite** — normalized response handling, proper polling loop, retry bounds with max 30 attempts
- **Mastered state** — positive terminal state for fully mastered topics; auto-resets on session configuration change
- **Dedup + yield-based mastery integration** — deduplication of mastered topics and early-exit yield when all topics are mastered
- **Static Prerendering** (`vite-prerender-plugin`)
  - `src/prerender.jsx` — SSR entry point using `react-dom/server` + `StaticRouter`
  - 6 public routes now output real HTML at build time: `/`, `/for-schools`, `/free-paper-generator`, `/try`, `/blog`, `/signup`
  - `index.html` updated with `prerender` attribute on script tag
  - Correct per-page `<title>` and meta tags injected via `react-helmet-async` context extraction
- **Question Paper Generator**
  - Custom paper generation for Teachers and Admins
  - History view and PDF download capabilities
- **Public Lead Magnet**
  - Free paper generator at `/free-paper-generator` to capture prospect info
- Comprehensive frontend documentation system (17 files)
- `/for-schools`, `/try`, `/blog` pages added to `sitemap.xml` (was 9 URLs, now 13)
- **`RangeSlider` component** (`src/components/ui/RangeSlider.jsx`) — custom-styled range input with CSS variable theming, replaces native `<input type="range">`

### Changed
- **Comprehensive UI polish (June 2026)**
  - 10 native `<select>` elements replaced with custom `Dropdown` component across 6 files
  - 7 plain-text loading states replaced with `Loader` component across 7 files
  - 4 empty states standardized with `EmptyState` component
  - 4 native range sliders replaced with custom `RangeSlider`
  - Native `datetime-local` input replaced with `DatePicker` + time dropdown in QuizForm
  - Inline SVGs replaced with lucide-react icons in AI chat components
- **Dark mode fully fixed across all components**
  - All hardcoded Tailwind colors (`bg-white`, `bg-gray-50`, `text-gray-800`, `from-blue-500`, `bg-violet-500`, `text-rose-500`, `text-red-500`, `bg-emerald-100`) replaced with CSS variables
  - AI chat widget fully themed: ChatWindow, MessageBubble, TypingIndicator, ConversationSidebar, ChatInput, AIAssistantWidget
  - Admin, teacher, student, and public pages all respect dark/light theme tokens
- **MUI fully removed from active codebase**
  - `ChapterTopicView`, `ChapterUpload`, `ChapterManagement` migrated from `@mui/material` to pure Tailwind CSS
  - `mui-vendor` manual chunk removed from `vite.config.ts` (saves ~100 KB gzipped)
  - Native `<input type="checkbox">` with `useRef` for indeterminate state replaces MUI `Checkbox`
  - Custom combobox replaces MUI `Autocomplete` in `ChapterUpload`
  - Inline SVG spinner replaces `CircularProgress` across all 3 admin components
- **`src/main.jsx`** — switched from `createRoot` to `createRoot / hydrateRoot` pattern to support prerendered HTML hydration
- **`ThemeContext`** — `localStorage` access in `useState` initializer now guarded with `typeof window !== 'undefined'`; removed debug `console.log` calls
- **`SoundContext`** — `localStorage` access in `useState` initializer now guarded with `typeof window !== 'undefined'`

### Fixed
- **7 `window.confirm()` calls replaced** with branded `ConfirmDialog` component (TeacherQuizList, QuizQuestionManager, QuestionPaperHistory, SectionManagement, ChapterManagement, ConversationSidebar)
- **2 inline modals in QuizAttempt** consolidated to use `ConfirmDialog`
- **Dark mode broken in AI chat** — all backgrounds, text, borders now use CSS variables
- **Hardcoded colors in 15+ components** — error states, success states, button colors all themed
- **Canonical URL bug** — `TryNow`, `PublicPaperGenerator`, and `SeoSubjectPage` were missing `path=` prop on `SEOHead`, causing all three pages to emit `https://askaide.in/` as their canonical URL. Google was treating them as duplicates of the homepage. All three now have correct canonical paths.
- **Redux slices SSR crash** — `authSlice`, `profileSlice`, and `sessionSlice` all called `localStorage` directly in `initialState`. This crashed the Node.js prerender process. Fixed with `typeof window !== 'undefined'` guards in all three slices.
- **`PublicPaperGenerator` missing SEO in loading state** — `configLoading=true` early return had no `SEOHead`, so the prerendered HTML had an empty `<title>`. Added `SEOHead` to the loading branch.
- **`TryNow` SEO metadata improved** — title and description updated with better keywords for organic search

---

## [v1.1.0] - January 19, 2026

### Added
- **Teacher Quiz Management**
  - `TeacherQuizList.jsx` - Quiz listing with status filters
  - `QuizForm.jsx` - Create/edit quiz with settings
  - `QuizQuestionManager.jsx` - Add questions from bank or custom
  - `QuizAnalytics.jsx` - Quiz performance analytics
  - `QuizCard.jsx` - Shared quiz card component
- **Student Quiz Experience**
  - `StudentQuizList.jsx` - Available quizzes with attempt info
  - `QuizAttempt.jsx` - Timed quiz taking interface
  - `QuizResult.jsx` - Detailed result view with explanations
  - `QuizHistory.jsx` - Past quiz attempts history
- Quiz API service (`quiz.api.js`) with complete endpoint coverage

---

## [v1.0.0] - January 2026

### Added
- Section Management for Admin Panel
- Teacher-Student linking with section filtering
- AI Insights rendered as Markdown in Progress views

### Changed
- Subject coverage calculation now aggregates across all chapters
- Updated progress UI with status badges

### Fixed
- Fixed undefined `handleFetchAIInsight` function error
- Fixed subject coverage showing single chapter progress

---

## [v0.9.0] - December 2025

### Added
- Progress Tracking with Subject and Chapter views
- Topic-level progress with mastery metrics
- AI-generated insights per chapter/subject
- Visual progress cards with coverage/mastery bars
- "Practice Now" CTA buttons

### Changed
- Refactored component organization to feature-based structure
- Migrated to centralized API layer

---

## [v0.8.0] - December 2025

### Added
- Modern animated Landing Page
- Feature showcase sections
- Social proof statistics
- Testimonial sections

### Changed
- Updated landing page design with animations
- Improved mobile responsiveness

---

## [v0.7.0] - Initial Release

### Added
- Complete authentication flow (Login, Signup, Verify Email, Forgot Password)
- Study configuration and question practice
- Session management with answer tracking
- Student Dashboard (mock data)
- Parent Dashboard (mock data)
- Teacher Dashboard (mock data)
- Admin Dashboard with full functionality:
  - School Management
  - Teacher Management (individual + bulk)
  - Student Management (individual + bulk)
  - Chapter PDF Upload
  - Relation View
  - Chapter-Topic View
- Profile and Settings pages
- Mobile-responsive design with bottom navigation
- Offline detection
- Toast notifications
- Protected routes with role-based access

---

## How to Update This Changelog

When making changes:

1. Add entry under `[Unreleased]` section
2. Categorize as:
   - **Added** - New features
   - **Changed** - Changes to existing features
   - **Deprecated** - Features to be removed
   - **Removed** - Removed features
   - **Fixed** - Bug fixes
   - **Security** - Security updates

3. When releasing, move unreleased items to new version

Example entry:
```markdown
### Added
- User notification preferences in Settings page
- Email notification toggle

### Fixed
- Fixed button alignment on mobile login page
```

---

*Document maintained by AskAideAI Development Team*
