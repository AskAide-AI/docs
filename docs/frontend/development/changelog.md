# Changelog

> All notable changes to the AskAideAI frontend will be documented in this file.
> Format: [Semantic Versioning](https://semver.org/)
> Last Updated: April 17, 2026

---

## [Unreleased]

### Added
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
