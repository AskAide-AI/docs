# Proposed Changes & Product Roadmap

> **AskAideAI EdTech Platform**
> Last Updated: October 10, 2026

---

## 📋 Summary

This page keeps the ideas that are **not built yet**. Items from the December 2025 list that have since been built are collected under [Shipped](#1-shipped-from-the-earlier-list) so the history stays visible. Status indicators:
- ✅ **SHIPPED** - Built and live
- 🟡 **PARTLY SHIPPED** - Some of it is built; the rest is still proposed
- 💡 **PROPOSED** - Not built yet

---

## 1. Shipped from the earlier list

| Item | Status | What exists now |
|------|--------|-----------------|
| Student Dashboard - Real Stats | ✅ SHIPPED | `/dashboard` reads `GET /progress/user/:userId` |
| Parent Dashboard - Live Data | ✅ SHIPPED | `/parent` shows the linked child's streak, weekly study time, accuracy, subject progress, today's snapshot and recent sessions |
| Multiple Children (parents) | ✅ SHIPPED | Child selector on `/parent` when more than one child is linked |
| Teacher Dashboard - Class Analytics | ✅ SHIPPED | `/teacher` subject dashboards, student list, chapter analytics and student drill-down (`/teacher-dashboard/...`) |
| Weak Area Reports (teachers) | ✅ SHIPPED | Weak-topics report per subject, with the share of students weak in each topic |
| Gamification System / Achievement System | ✅ SHIPPED | Streaks with weekly and earned freezes, badges, daily goals, daily challenge, weekly leaderboard |
| Class Leaderboard | 🟡 PARTLY SHIPPED | A weekly top-10 leaderboard is on the student dashboard. It ranks all students, not one class; a per-class view for teachers is still open |
| Assignment Creation | ✅ SHIPPED | Teacher quizzes with deadline, time limit, allowed attempts and pass mark; the AI assistant also drafts assignments and worksheets |
| Custom Content | ✅ SHIPPED | Teachers can write their own questions, with answers and explanations, inside quizzes |
| Usage Analytics / Analytics Dashboard | ✅ SHIPPED | SuperAdmin `/admin` overview, users, content, engagement and feedback insights |
| Export Reports | 🟡 PARTLY SHIPPED | Question papers download as PDF; teachers get a printable class report and certificate. Excel export is not built |
| Review Past Sessions | ✅ SHIPPED | Session results and answers can be reviewed |
| Dark Mode | ✅ SHIPPED | Light/Dark in **Settings** |
| PWA Support | ✅ SHIPPED | `vite-plugin-pwa` (auto-update, precached assets) |
| Code Splitting | ✅ SHIPPED | Every route in `App.jsx` is `React.lazy()` |
| Unit / Component Tests | ✅ SHIPPED | Vitest + Testing Library, tests in `src/__tests__/` |
| Remove Legacy API Files | ✅ SHIPPED | `src/services/` and `src/lib/` are gone; all calls go through `src/api/` |
| Vite Environment Variables | ✅ SHIPPED | `import.meta.env.VITE_*` everywhere |
| 401 Handling | ✅ SHIPPED | Automatic token refresh (one refresh across tabs), then redirect to `/login` if it fails |

---

## 2. Still proposed 💡

### 2.1 Student Experience

| Feature | Impact | Effort | Description |
|---------|--------|--------|-------------|
| **Adaptive Difficulty** | 🔴 High | High | Practice sessions use the difficulty the student picks; nothing adjusts it from mastery yet |
| **Topic Mastery Paths** | 🔴 High | High | Sequential learning with prerequisites |
| **Quick Quizzes** | 🟡 Medium | Medium | Timed mini-tests a student can start on their own for revision (only teacher quizzes are timed today) |
| **Doubt Resolution** | 🔴 High | High | AI chat for students to clarify concepts (the AI assistant is for teachers only) |
| **Study Reminders** | 🟡 Medium | Low | Push or email reminders to practise. Only the in-app notification bell exists; there are no push notifications |
| **Levels** | 🟢 Low | Medium | Levels on top of badges and streaks |
| **Offline Mode** | 🟡 Medium | High | Download questions for offline practice |
| **Session Replay** | 🟢 Low | High | Replay a session's questions and answers step by step |
| **Session Comparison** | 🟢 Low | Medium | Compare performance across sessions |

### 2.2 Parent Features

| Feature | Impact | Effort | Description |
|---------|--------|--------|-------------|
| **Weekly Reports** | 🔴 High | Medium | Automated email summaries of the child's week |
| **Goal Setting** | 🟡 Medium | Medium | Parents set practice targets and get alerts (students can already set their own daily goal) |
| **Teacher Communication** | 🟡 Medium | Medium | In-app messaging with teachers |
| **Self-service Linking** | 🟡 Medium | Low | Parents link a child themselves; today the school links parent accounts |

### 2.3 Teacher Features

| Feature | Impact | Effort | Description |
|---------|--------|--------|-------------|
| **Per-class Leaderboard** | 🟡 Medium | Low | Leaderboard limited to one teacher's class |
| **Live Class Integration** | 🟢 Low | Very High | Video class with embedded practice |

### 2.4 School/Admin Features

| Feature | Impact | Effort | Description |
|---------|--------|--------|-------------|
| **Multi-School Dashboard** | 🟡 Medium | Medium | Overview for school chains (principal screens are scoped to one school) |
| **Curriculum Mapping** | 🔴 High | High | Map content to each board's syllabus |
| **Excel Export** | 🟡 Medium | Low | Spreadsheet export of class and school reports |
| **LMS Integration** | 🟢 Low | Very High | Integrate with Google Classroom and similar tools |

### 2.5 Platform-Wide

| Feature | Impact | Effort | Description |
|---------|--------|--------|-------------|
| **Localization (i18n)** | 🟡 Medium | High | Multi-language interface |
| **Accessibility (a11y)** | 🟡 Medium | Medium | Full WCAG audit and fixes |

---

## 3. Technical backlog 💡

| Item | Priority | Notes |
|------|----------|-------|
| TypeScript migration | 🟡 Medium | `tsconfig.json` exists, but all components are `.jsx`. Start with `src/api/` and `src/store/`, and define types for API responses |
| End-to-end tests | 🟢 Low | No E2E suite yet; Playwright is only used for manual browser checks |
| Wider test coverage | 🟡 Medium | More tests for the `src/api/` modules and key components |
| Bundle analysis | 🟢 Low | No bundle analyser is configured |
| Split `LandingPage.jsx` | 🟢 Low | Still one large file; split into section components |
| Slim `QuestionPractice.jsx` | 🟢 Low | Still a large file; extract session logic into a hook and the question card into a component |
| Move SuperAdmin preview mocks | 🟢 Low | Teacher screens use `src/mocks/teacherData.js`, but `StudentQuizList.jsx` still has inline mock quizzes |
| Lint and formatting | 🟢 Low | Clear `npm run lint` warnings; there is no Prettier config |

---

## 4. Architecture Decisions

### In place ✅

| Decision | Rationale |
|----------|-----------|
| Feature-based folders | Scalability, easier navigation |
| Centralized API layer (`src/api/`) | Single point for auth, token refresh and error handling |
| Redux for auth/session | Global state needed across routes |
| Axios interceptors | Automatic token injection and refresh |
| Vite env vars | Client-side env variable access |

### Proposed 💡

| Decision | Rationale |
|----------|-----------|
| React Query | Server state caching, background refetch |
| TypeScript strict mode | Catch more bugs at compile time |
| Storybook | Component documentation & testing |
| Feature flags | Gradual rollout of new features |
