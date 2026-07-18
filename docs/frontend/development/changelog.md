# Changelog

> All notable changes to the AskAideAI frontend will be documented in this file.
> Format: [Semantic Versioning](https://semver.org/)
> Last Updated: July 18, 2026

---

## [Unreleased]

### July 2026 (mid-month)

#### Added
- **Guest mobile CTA bar (`GuestMobileCTA.jsx`)** — persistent fixed bottom bar on phones for logged-out visitors on public marketing pages, keeping a one-tap "Start free — no signup" path to `/try` visible after the top nav collapses to a hamburger. Hidden on `/try`, `/login`, `/signup`; desktop unaffected (`md:hidden`). Mounted from `App.jsx` only when `isPublicRoute && !user`.
- **Compact "Log in" in mobile navbar** — returning guests get a top-right "Log in" pill on small screens instead of it being buried in the hamburger drawer (`Navbar.jsx`, `md:hidden`).
- **Password requirements checklist on Signup** — live checklist (8+ chars, uppercase, lowercase, number, symbol `!@#$%^&*`) below the password field, each item ticking green (`✓`) as met; complements the existing strength meter (`Signup.jsx`).
- **Landing role-card CTAs** — "For Students" and "For Parents" role cards now link to `/try`; "For Teachers"/"For Schools" retain their existing CTAs (`LandingPage.jsx`).

#### Changed
- **Trial social-proof stats now live** — `TryNow.jsx` fetches `statsApi.getPublicStats()` and renders real `totalStudents` / `totalQuestionsAnswered`, matching the landing page so `/` and `/try` never show contradictory numbers (fallbacks: 63 students / 10,000 questions).
- **Trial empty-state turned into a conversion moment** — when a chapter has no pre-built questions, `TryNow.jsx` now prompts creating a free account (AI generates fresh questions) instead of a dead-end "No questions available" message.
- **Subject range copy updated to Class 6–12** — landing FAQ, SEO `description`/`keywords` updated from "Class 9–12" to "Class 6–12" to match marketed coverage (`LandingPage.jsx`, `TermsOfService.jsx`). Note: SEO subject/chapter static pages + sitemap still only cover 9–12 pending real 6–8 chapter data.
- **Stronger signup password rule** — minimum raised 6 → 8 chars with a complexity pattern (upper + lower + digit + symbol) and 128-char max (`Signup.jsx`).
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
