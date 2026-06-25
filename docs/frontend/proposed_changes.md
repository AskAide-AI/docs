# Proposed Changes & Product Roadmap

> **AskAideAI EdTech Platform**
> Last Updated: December 22, 2025

---

## 📋 Executive Summary

This document tracks completed improvements, pending work, and proposed enhancements for the AskAideAI platform. Items are marked with status indicators:
- ✅ **DONE** - Implemented and in production
- 🔄 **IN PROGRESS** - Currently being worked on
- 📋 **PENDING** - Approved, awaiting implementation
- 💡 **PROPOSED** - New ideas for consideration
- ❌ **BLOCKED** - Requires external dependencies

---

## 1. Code Structure & Organization

### 1.1 Component Organization

| Item | Status | Notes |
|------|--------|-------|
| Feature-Based Folders | ✅ DONE | Components organized into `auth/`, `study/`, `dashboard/`, `admin/`, `progress/`, `pages/`, `layout/` |
| Auth Components | ✅ DONE | Login, Signup, VerifyEmail, ForgotPassword, UpdatePassword, ProtectedRoute, RoleProtectedRoute |
| Study Components | ✅ DONE | Home, StudyConfig, QuestionPractice, QuestionArea, Sidebar, SessionResultModal, UserAnswers |
| Dashboard Components | ✅ DONE | Dashboard, ParentDashboard, TeacherDashboard, AdminDashboard |
| Admin Components | ✅ DONE | SchoolManagement, TeacherManagement, StudentManagement, LinkManagement, ChapterUpload, RelationView, ChapterTopicView |
| Progress Components | ✅ DONE | SubjectSummary, ChapterList, ChapterDetailView |

### 1.2 API Layer Consolidation

| Item | Status | Notes |
|------|--------|-------|
| Centralized Axios Instance | ✅ DONE | `src/api/axios.js` with interceptors |
| Auth API Module | ✅ DONE | `src/api/auth.api.js` - Redux thunks |
| Study API Module | ✅ DONE | `src/api/study.api.js` - Study operations |
| Admin API Module | ✅ DONE | `src/api/admin.api.js` - Admin operations |
| Barrel Export | ✅ DONE | `src/api/index.js` for clean imports |
| Remove Legacy API Files | 📋 PENDING | Clean up `src/lib/api.js` and `src/services/api.js` if redundant |

### 1.3 Mock Data Centralization

| Item | Status | Notes |
|------|--------|-------|
| Dashboard Mock Data | 📋 PENDING | Move to `src/constants/mockData.js` |
| Clean Component Files | 📋 PENDING | Remove inline mock data from Dashboard, ParentDashboard, TeacherDashboard |

---

## 2. Critical Fixes (Completed ✅)

### 2.1 Environment Variables

| Issue | Status | Resolution |
|-------|--------|------------|
| `process.env` in Vite | ✅ FIXED | All env vars now use `import.meta.env.VITE_*` |
| Base URL Configuration | ✅ DONE | Centralized in `src/api/axios.js` |
| Fallback URL | ✅ DONE | Defaults to production API if env var missing |

### 2.2 API Error Handling

| Issue | Status | Resolution |
|-------|--------|------------|
| Global Error Logging | ✅ DONE | Axios response interceptor logs errors |
| 401 Handling | ✅ DONE | Prepared for auto-logout (commented, easily enabled) |
| Network Error Handling | ✅ DONE | Distinct handling for network vs API errors |
| Retry Logic | ✅ DONE | AI question generation retries up to 3 times |

---

## 3. Feature Enhancements

### 3.1 Completed Features ✅

#### AI-Powered Learning
| Feature | Implementation |
|---------|----------------|
| Dynamic Question Generation | Backend AI service generates questions when DB is empty |
| Retry with Background Mode | `?retry=true` no longer blocks; it re-kicks AI generation in the background and the client polls normally |
| AI Insights | Subject & chapter-level personalized recommendations |
| Batch Question Loading | Efficient batch-based question fetching |

#### Progress Tracking
| Feature | Implementation |
|---------|----------------|
| Subject Progress Summary | Coverage + mastery metrics with visual cards |
| Chapter Progress Detail | Breakdown by chapter with status badges |
| Topic-Level Tracking | Granular topic progress with weak area identification |
| AI Recommendations | Clickable icons fetch AI-generated study advice |
| CTA Integration | Context-aware practice buttons |

#### Admin Panel
| Feature | Implementation |
|---------|----------------|
| School CRUD | Create, read, update schools |
| Teacher Management | Individual + bulk creation with school assignment |
| Student Management | Individual + bulk creation with class assignment |
| Teacher-Student Linking | Bulk assignment of teachers to students |
| Chapter PDF Upload | Upload PDFs for AI topic extraction |
| Chapter-Topic Visualization | View which chapters have AI-processed topics |
| Relation View | Visualize school hierarchy relationships |

#### Landing Page
| Feature | Implementation |
|---------|----------------|
| Modern UI Revamp | Animated, conversion-focused design |
| Feature Sections | AI, Analytics, School features showcased |
| Trust Elements | Statistics, testimonials, partner logos |
| Responsive Design | Mobile-first with smooth animations |

### 3.2 Pending Features 📋

#### Dashboard Real Data Integration
| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| Student Dashboard - Real Stats | 🔴 High | Medium | Connect to progress API, remove mock data |
| Parent Dashboard - Live Data | 🟡 Medium | Medium | Fetch linked student progress |
| Teacher Dashboard - Class Analytics | 🟡 Medium | High | Aggregate student performance by class |
| Gamification System | 🟡 Medium | High | Implement streaks, badges, milestones backend |

#### Session History
| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| Review Past Sessions | ✅ DONE | - | Basic implementation exists |
| Session Replay | 💡 PROPOSED | High | Replay session Q&A step-by-step |
| Session Comparison | 💡 PROPOSED | Medium | Compare performance across sessions |

---

## 4. Technical Improvements

### 4.1 TypeScript Migration

| Item | Status | Priority | Notes |
|------|--------|----------|-------|
| TypeScript Config | ✅ EXISTS | - | `tsconfig.json` present but unused |
| Utility Files | 📋 PENDING | 🟡 Medium | Start with `src/api/`, `src/store/` |
| Component Types | 📋 PENDING | 🟡 Medium | Add prop types to components |
| API Response Types | 📋 PENDING | 🔴 High | Define interfaces for all API responses |

### 4.2 Testing

| Item | Status | Priority | Notes |
|------|--------|----------|-------|
| Unit Tests Setup | 📋 PENDING | 🟡 Medium | Jest/Vitest configuration |
| API Tests | 📋 PENDING | 🔴 High | Test study.api.js, auth.api.js |
| Component Tests | 📋 PENDING | 🟡 Medium | React Testing Library |
| E2E Tests | 💡 PROPOSED | 🟢 Low | Playwright/Cypress for critical flows |

### 4.3 Performance

| Item | Status | Priority | Notes |
|------|--------|----------|-------|
| Code Splitting | 📋 PENDING | 🟡 Medium | Lazy load dashboard routes |
| Image Optimization | 💡 PROPOSED | 🟢 Low | Use next-gen formats |
| Bundle Analysis | 📋 PENDING | 🟢 Low | Identify large dependencies |

---

## 5. New Feature Proposals 💡

### 5.1 Student Experience

| Feature | Impact | Effort | Description |
|---------|--------|--------|-------------|
| **Adaptive Difficulty** | 🔴 High | High | Auto-adjust difficulty based on mastery |
| **Topic Mastery Paths** | 🔴 High | High | Sequential learning with prerequisites |
| **Quick Quizzes** | 🟡 Medium | Medium | Timed mini-tests for revision |
| **Doubt Resolution** | 🔴 High | High | AI chatbot for concept clarification |
| **Study Reminders** | 🟡 Medium | Low | Push/email notifications for consistency |
| **Achievement System** | 🟡 Medium | Medium | Badges, levels, leaderboards |
| **Offline Mode** | 🟡 Medium | High | Download questions for offline practice |

### 5.2 Parent Features

| Feature | Impact | Effort | Description |
|---------|--------|--------|-------------|
| **Weekly Reports** | 🔴 High | Medium | Automated email summaries |
| **Goal Setting** | 🟡 Medium | Medium | Set practice targets with alerts |
| **Teacher Communication** | 🟡 Medium | Medium | In-app messaging |
| **Multiple Children** | 🟡 Medium | Low | Switch between linked students |

### 5.3 Teacher Features

| Feature | Impact | Effort | Description |
|---------|--------|--------|-------------|
| **Assignment Creation** | 🔴 High | High | Custom assignments with deadlines |
| **Class Leaderboard** | 🟡 Medium | Low | Gamified class performance |
| **Weak Area Reports** | 🔴 High | Medium | Identify struggling students by topic |
| **Custom Content** | 🔴 High | High | Upload own questions/explanations |
| **Live Class Integration** | 💡 Future | Very High | Video class with embedded practice |

### 5.4 School/Admin Features

| Feature | Impact | Effort | Description |
|---------|--------|--------|-------------|
| **Multi-School Dashboard** | 🟡 Medium | Medium | Overview for school chains |
| **Curriculum Mapping** | 🔴 High | High | Align content with board syllabi |
| **Usage Analytics** | 🔴 High | Medium | Platform usage metrics |
| **Export Reports** | 🟡 Medium | Low | PDF/Excel report generation |
| **LMS Integration** | 💡 Future | Very High | Integrate with Google Classroom, etc. |

### 5.5 Platform-Wide

| Feature | Impact | Effort | Description |
|---------|--------|--------|-------------|
| **Dark Mode** | 🟢 Low | Low | Theme toggle |
| **Localization (i18n)** | 🟡 Medium | High | Multi-language support |
| **Accessibility (a11y)** | 🟡 Medium | Medium | WCAG compliance |
| **PWA Support** | 🟡 Medium | Medium | Installable app experience |
| **Analytics Dashboard** | 🔴 High | High | Real-time platform metrics |

---

## 6. Priority Matrix

### 🔴 High Priority (Next Sprint)

1. **Student Dashboard Real Data** - Replace mock data with actual progress
2. **API Response Types** - TypeScript interfaces for type safety
3. **Weekly Parent Reports** - Automated email summaries
4. **Weak Area Reports for Teachers** - Student struggle identification

### 🟡 Medium Priority (Q1 2026)

1. **Gamification Backend** - Streaks, badges, milestones
2. **Adaptive Difficulty Engine** - Dynamic question selection
3. **Assignment System** - Teacher-created assignments
4. **Code Splitting** - Performance optimization

### 🟢 Low Priority (Future)

1. **Dark Mode** - UI theming
2. **Offline Mode** - Cached questions
3. **LMS Integration** - Third-party platforms
4. **Live Classes** - Video integration

---

## 7. Architecture Decisions

### Completed ✅

| Decision | Rationale |
|----------|-----------|
| Feature-based folders | Scalability, easier navigation |
| Centralized API layer | Single point for auth, error handling |
| Redux for auth/session | Global state needed across routes |
| Axios interceptors | Automatic token injection |
| Vite env vars | Client-side env variable access |

### Proposed 💡

| Decision | Rationale |
|----------|-----------|
| React Query | Server state caching, background refetch |
| TypeScript strict mode | Catch more bugs at compile time |
| Storybook | Component documentation & testing |
| Feature flags | Gradual rollout of new features |

---

## 8. Success Metrics

### Product KPIs

| Metric | Target | Current |
|--------|--------|---------|
| Daily Active Users | - | Tracking TBD |
| Questions Answered/Day | - | Tracking TBD |
| Session Completion Rate | >80% | Tracking TBD |
| Average Session Duration | >10 min | Tracking TBD |
| Student Mastery Improvement | +15% monthly | Tracking TBD |

### Technical KPIs

| Metric | Target | Current |
|--------|--------|---------|
| Page Load Time | &lt;2s | Tracking TBD |
| API Response Time | &lt;500ms | Tracking TBD |
| Error Rate | &lt;1% | Tracking TBD |
| Test Coverage | >70% | 0% (TBD) |

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI Service Downtime | High | Retry logic, graceful degradation (✅ Done) |
| Mock Data in Production | Medium | Replace with real APIs (📋 Pending) |
| No TypeScript | Medium | Incremental migration (📋 Pending) |
| No Automated Tests | High | Add test suite (📋 Pending) |
| Single Point of Failure (API) | High | Error boundaries, offline support |

---

## 10. Summary Table

| Category | Done | Pending | Proposed |
|----------|------|---------|----------|
| Code Structure | 6 | 2 | 0 |
| Critical Fixes | 5 | 0 | 0 |
| Core Features | 25+ | 4 | 8 |
| Technical Improvements | 1 | 8 | 3 |
| New Features | 0 | 0 | 20+ |

---

*Document maintained by AskAideAI Product Team*
*For technical queries: Refer to `project_overview.md`*
