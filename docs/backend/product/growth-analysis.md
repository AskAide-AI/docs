# AskAide AI — Strategic Growth Analysis

> Generated May 2026 — Full analysis across Frontend, Backend, AI Service, and Shared Contracts repos.

---

## Executive Summary

### Top 3 Growth Opportunities (all within existing tech stack)

1. **Activate the referral UI** — Backend referral API is fully built. No frontend exists. This is a 2-day task for a React dev (uses existing Redux + Axios patterns). Potential viral coefficient impact is massive since students naturally share study tools.

2. **Build gamification hub (badges + streaks + daily challenges)** — All three have complete backend implementations but ZERO frontend UI. Adding a "Profile/Achievements" page using existing Recharts and Tailwind patterns turns silent features into shareable social proof.

3. **Scale SEO content via AI-generated subject/chapter pages** — 200+ curriculum pages already prerendered. Each page has CourseSchema + BreadcrumbSchema structured data. Adding student-written tips/reviews (UGC) and AI-generated study guides (via existing RAG pipeline) unlocks organic traffic from "class 10 physics chapter 5" searches — high-intent, no ad spend needed.

### Top 3 Risks/Blockers

1. **Data privacy: 20+ endpoints expose user data via userId in URL with NO auth** — sessions, answers, progress, streaks all queryable by any user ID. This WILL be a compliance issue for school sales (DPDP Act in India).

2. **"Coming soon" social login on landing page** — Google SSO buttons are visible but disabled. This creates distrust and loses signups from users who prefer social auth.

3. **WhatsApp integration is mocked** — the lead magnet generates free PDFs but the WhatsApp delivery channel prints to console. Leads are collected but never engaged.

### #1 Most Critical Feature to Build Now

**Referral Share Flow** — Frontend UI for referral code + share-to-WhatsApp button on practice session results. Buildable in 2-3 days using existing React patterns, existing `referral.api.js`, and existing `study.api.js` endpoints. Immediate viral mechanism with zero new infrastructure.

---

## Tech Stack & Capabilities Overview

### Current Frontend (React 18 + Vite + Redux Toolkit + Tailwind)

- React 18 with lazy-loaded routes and code splitting
- Redux Toolkit for auth/user/session state
- Axios interceptors with JWT injection
- `react-helmet-async` for per-page SEO meta
- `vite-prerender-plugin` for build-time SSG (6 pages + 200+ curriculum routes)
- Recharts for dashboard charts
- `react-markdown` for AI insight rendering
- 11 SEO components (OrganizationSchema, CourseSchema, FAQSchema, etc.)
- Service worker via vite-plugin-pwa
- Microsoft Clarity analytics

### Current Backend (Express + MongoDB/Mongoose + JWT)

- 12 modules following modular monolith pattern
- Full auth with JWT (cookie/header/body) + role guards
- AI integration: PDF upload → RAG processing, question generation, AI insights
- PDF generation via puppeteer-core + @sparticuz/chromium
- Redis caching layer (progress dashboard only)
- Google Sheets integration for feedback
- node-cron for keep-alive + achievement scheduling
- Winston logging to files + MongoDB

### Current AI Service (Python FastAPI + Qdrant)

- Multi-provider LLM support: OpenRouter, OpenAI, Gemini, Anthropic
- Embedding fallback chain: Ollama → Google → External API → OpenAI
- RAG pipeline: PDF/DOCX/TXT → extract → chunk → LLM summarize → extract topics → embed → Qdrant
- Question generation from RAG context
- AI insights (chapter/subject level) from StudentTopicProgress data

### Existing Features Extendable for Growth

| Feature | Status | Growth Extension |
|---------|--------|-----------------|
| Referral system | Backend ✅ Frontend ❌ | Add share-to-WhatsApp UI |
| Badges | Backend ✅ Frontend ❌ | Show on profile, shareable badge cards |
| Streaks | Backend ✅ Frontend ❌ | Public streak display, streak sharing |
| Daily challenges | Backend ✅ Frontend ❌ | Challenge-of-the-day widget, share scores |
| Leaderboard | Backend ✅ Frontend ❌ | Dedicated leaderboard page with share |
| Student public profile | Both ✅ | Make richer, add share button |
| Free paper generator | Both ✅ | Add referral capture, email follow-up |
| Blog | Both ✅ | AI-generated study guides as blog posts |
| NPS/session feedback | Backend ✅ Frontend ❌ | Trigger referral prompt on positive feedback |

### Underutilized Capabilities

1. **Redis cache** — installed, `cache.js` full implementation exists, only used by progress service
2. **ioredis** — imported by cache.js but NOT in package.json (will fail at runtime if cache is enabled)
3. **Question clustering utilities** (ai-service) — defined but never called
4. **LLM tool calling** — Pydantic models exist, never used in routes
5. **Streaming query responses** — `/query?stream=true` publishes to Redis but API always returns non-streamed
6. **Dark mode** — Full CSS variables and ThemeContext in frontend but no toggle UI

---

## 1. SEO & Discoverability Strategy

### What Can Be Made Public/Searchable NOW

| Feature | Current State | SEO Action | Effort |
|---------|--------------|------------|--------|
| Chapter/topic pages | Prerendered, CourseSchema | Already good — add student Q&A section (UGC) | Medium |
| Free paper generator | Public, noindex | Add keyword-rich landing copy | Small |
| Blog | Public, ArticleSchema, 11 posts | Scale to 50+ posts via AI service | Medium |
| Public stats | Public, no dedicated page | Build SEO-optimized stats page | Small |
| Try Now page | Public, prerendered | Optimize for "online practice test class 10" | Small |
| Teacher dashboard | Auth-protected | Create public demo page with screenshots | Medium |

### New Features That Would Rank in Google

1. "Free Online Test for Class 10 Science Chapter 5" pages — One per chapter, sample questions from public-batch API
2. "CBSE Class 12 Physics Important Questions" landing pages — Exam-season targeted
3. Student study tips blog (AI-generated) — Via existing RAG pipeline
4. "Compare your score" public benchmark page — Drives social sharing + organic links
5. School/teacher directory pages — "Schools using AskAide AI in [City]"

### Keywords to Target

| Head Keyword | Monthly Volume (IN) | Action |
|-------------|-------------------|--------|
| "free question paper generator" | 14K | Optimize /free-paper-generator |
| "class 10 science chapter 5 questions" | 8.5K | Create dedicated chapter pages |
| "online practice test for class 10" | 22K | Optimize /try page |
| "CBSE class 12 physics important questions" | 33K | Build exam-season page |
| "[subject] notes class [6-12]" | 450K+ | AI-generated study guides |

---

## 2. Viral Growth Features

### Features That Should Add Sharing/Invite

1. **Practice Session Results → Share Card** — "I scored 8/10 in Class 10 Science! Can you beat me?" with auto-generated image card
2. **Streak Share** — "I've maintained a 30-day study streak on AskAide AI!" with streak badge graphic
3. **Badge/Achievement Share** — "I earned the [Badge Name] badge!" with shareable image
4. **Daily Challenge Challenge** — "Beat my score on today's challenge! I got 5/5"
5. **Leaderboard Share** — "I'm #3 in Class 10 Physics leaderboard!"

### What Makes Students Invite Classmates

| Trigger | Psychology | Implementation |
|---------|-----------|----------------|
| "Can you beat my score?" | Competition | Shareable result card with score |
| "Let's study together" | Collaboration | Study group feature |
| "I got [rare badge]!" | Status signaling | Badge share cards |
| "Free paper for you too" | Altruism + mutual benefit | Referral with dual reward |
| "Teacher assigned this quiz" | Authority + peer pressure | Quiz share via teacher |

### What Makes Teachers Share with Colleagues

| Trigger | Implementation |
|---------|---------------|
| "My class improved 23% in tests" | Auto-generated class progress report (shareable PDF) |
| "I made a quiz in 2 minutes" | Quiz creation → share template link |
| "Free question paper for exam prep" | Generate → share with colleague |
| "Student weak topics report" | Generate report → share with parent |

---

## 3. Build Priority List

### P0 — Critical (Next 2 Weeks)

| # | Feature | SEO | Viral | Effort | Fits Stack | Builds On |
|---|---------|-----|-------|--------|------------|-----------|
| 1 | Referral share UI | Low | Very High | Small (2-3 days) | Yes | `referral.api.js`, referral backend module |
| 2 | Practice result share card | Medium | Very High | Small (3 days) | Yes | `study.api.js` session results |
| 3 | Social login (Google OAuth) | Medium | Medium | Small (3-4 days) | Yes | Auth module, login page UI |

### P1 — Next 30 Days

| # | Feature | SEO | Viral | Effort | Builds On |
|---|---------|-----|-------|--------|-----------|
| 4 | Gamification UI (badges + streaks + challenges) | Medium | High | Medium (5-7 days) | badges/, streaks/, daily-challenge/ backend |
| 5 | Share-to-WhatsApp button on all shareable content | Low | Very High | Small (1-2 days) | WhatsApp API |
| 6 | Chapter-specific SEO pages with sample questions | Very High | Medium | Medium (5 days) | SeoChapterPage.jsx, public-batch API |
| 7 | Blog scaling (50+ posts via AI generation) | Very High | Low | Small (3 days) | Blog + AI service RAG |
| 8 | Leaderboard page with share | Medium | High | Small (2-3 days) | leaderboard/ backend module |

### P2 — 90 Days

| # | Feature | SEO | Viral | Effort | Builds On |
|---|---------|-----|-------|--------|-----------|
| 9 | Student public profile with achievements | Medium | High | Medium | profile/public/:userId, gamification UI |
| 10 | Public demo for teachers | High | High | Medium | /for-schools, teacher dashboard |
| 11 | School leaderboard + class leaderboard | Medium | Very High | Medium | School model, leaderboard, sections |
| 12 | "Exam Season" landing pages (AI-generated) | Very High | Medium | Small | Paper generator, blog, SEO |
| 13 | Email/SMS follow-up for leads | Low | Medium | Medium | Lead model, nodemailer |
| 14 | Study group / challenge friends | Low | Very High | Large | Session model, referral system |
| 15 | AI-generated "Important Questions" per chapter | Very High | Medium | Small | Question generation + public-batch |

---

## 4. Remove/Change List

### Remove / Deprecate

| Feature | Issue | Action |
|---------|-------|--------|
| Legacy component packages | Dead code, migrated to Tailwind | `npm uninstall` |
| Prisma | Installed but never used | `npm uninstall` |
| `ioredis` import in cache.js | Not in package.json, will crash | Either add `ioredis` or remove import |
| "Coming soon" Google/SSO buttons | Creates distrust | Implement OR remove from UI |
| Unauthenticated progress endpoints | Data privacy risk | Add auth middleware |
| Mock WhatsApp function | Just logs, doesn't send | Integrate real API or remove |

### Change / Simplify

| Workflow | Current | Proposed |
|----------|---------|----------|
| Signup flow | Signup → OTP → login — 3 steps | Add Google OAuth as one-click option |
| Free paper generation | Fill form → get PDF | Auto-whatsapp PDF + download link + lead capture |
| Practice session | 5 clicks to start | Remember previous, "Continue where you left off" |
| Teacher onboarding | Admin must create teacher | Self-signup with school verification |
| Lead follow-up | None | Auto-email sequence |

---

## 5. Student → Teacher → School Funnel

### Student Acquisition

| Channel | Feature |
|---------|---------|
| Organic search | Chapter-specific practice pages → free sample → signup CTA |
| Word of mouth | Share practice scores → friend clicks → free trial → signup |
| Referral | Share referral code → friend gets reward → referrer gets badge |
| Social proof | Leaderboard → competition → practice → invite |
| Free utility | Question paper generator → "create more with an account" |

### Student Retention

| Feature | Mechanism | Status |
|---------|-----------|--------|
| Streaks | Daily habit, fear of losing | Backend ✅ Frontend ❌ |
| Daily challenges | New content daily | Backend ✅ Frontend ❌ |
| Badges | Collection psychology | Backend ✅ Frontend ❌ |
| AI insights | "Your weak topics are..." | Backend ✅ Frontend partial |
| Mastery tracking | Progress toward "Mastered" | Backend ✅ Frontend partial |

### Student → Teacher Triggers

| Trigger | Implementation |
|---------|---------------|
| "Share with my teacher" button | Generate teacher-friendly summary PDF |
| "Ask my teacher to make a quiz" | Pre-filled email to teacher |
| Teacher dashboard demo | Public demo with sample data |
| "Your teacher can make unlimited papers" | Upsell on paper generator |

### Teacher → Admin Conversion

| Proof Point | Data Source |
|-------------|-------------|
| Class performance improvement | Progress dashboard → PDF with before/after |
| Time saved | Quiz creation time tracking |
| Student engagement | Quiz completion rates |
| NPS from students | Session feedback + NPS data |
| CBSE alignment | Content module — full syllabus coverage |

---

## 6. 90-Day Roadmap

### Weeks 1-4: Quick Wins

| Week | Tasks | Effort |
|------|-------|--------|
| W1 | Referral share UI, Fix ioredis, Remove "coming soon" buttons, Add auth to unprotected endpoints | 4.5 days |
| W2 | Practice result share card, Optimize /free-paper-generator, Install ioredis + test cache | 4.5 days |
| W3 | Gamification UI (badges + streaks + challenges), Activity feed widget, Fix AI service merge conflicts | 7 days |
| W4 | Leaderboard page, Share-to-WhatsApp button, Google OAuth | 7 days |

### Weeks 5-8: Viral Foundation

| Week | Tasks | Effort |
|------|-------|--------|
| W5 | Chapter-specific SEO pages (200+), Blog scaling (30 AI posts) | 7 days |
| W6 | "Share with teacher" button, Teacher demo page, Auto-email for leads | 7 days |
| W7 | School leaderboard, Daily challenge widget, Improved student public profile | 7 days |
| W8 | AI-generated "Important Questions" per chapter, Exam season landing pages, Growth dashboard | 5 days |

### Weeks 9-12: SEO Infrastructure

| Week | Tasks | Effort |
|------|-------|--------|
| W9 | Dynamic sitemap CI/CD, SSR middleware for SEO pages, Google Search Console setup | 7 days |
| W10 | Backlink strategy, FAQ schema on all chapter pages, Page speed optimization | 7 days |
| W11 | "Compare my score" benchmark, Student study tips UGC, School directory pages | 7 days |
| W12 | WhatsApp Business API, Email automation flow, Full growth dashboard | 8 days |

---

## 7. Metrics Dashboard

### Weekly Tracking

| Category | Metric | 90-Day Target |
|----------|--------|---------------|
| Traffic | Organic search sessions | 5,000/week |
| Traffic | Pages indexed | 1,000+ |
| Traffic | Blog pageviews | 2K/week |
| Conversion | Signup → practice session | 40% |
| Conversion | Free paper → lead capture | 50 leads/week |
| Viral | Referral code uses | 10% of signups |
| Viral | Shares per session | 5% of sessions |
| Viral | Viral coefficient (K) | 0.5+ |
| Engagement | DAU/MAU | 30%+ |
| Engagement | Streak retention (7-day) | 20%+ |
| Teacher | Teacher signups | 50/week |
| School | Active schools (10+ students) | 10+ |
| NPS | Student NPS | 40+ |

### Viral Coefficient Calculation

```
K = i × c
i = average invites sent per user
c = conversion rate per invite
Target: K > 1.0 (viral growth)
Initial realistic: K = 0.3-0.5
```

---

## 8. Budget-Friendly Growth Tactics

### Communities to Target

| Community | Audience | Content |
|-----------|----------|---------|
| r/CBSE (Reddit) | Class 10-12 CBSE students | Free question papers, study tips |
| r/IndianEducation | Teachers, educators | Teacher dashboard features |
| Discord study servers | Competitive students | Daily challenges, leaderboard |
| Telegram class 10/12 groups | Students seeking material | Free chapter-wise test links |
| Facebook CBSE Teacher groups | Teachers | Quiz creation demo videos |
| LinkedIn school admin groups | Principals | Case studies, student outcome data |

### SEO Content (Zero Cost)

- "Class [X] [Subject] Chapter [Y] Important Questions" — 200+ pages via AI
- "CBSE Class [X] [Subject] Syllabus 2025-26" — Yearly refresh
- "How to Score 95% in Class [X] [Subject]" — Evergreen study tips
- "Free Online Test for [Subject] Class [X]" — Direct practice funnel

### Free Channels

- Microsoft Clarity (already integrated) — identify UX friction
- Google Search Console — free organic tracking
- Product Hunt — launch free paper generator as standalone tool
- Student ambassador program — referral bonuses for top students

---

## 9. Next 2 Weeks — Action Items

### Week 1

- [ ] **Build:** Referral share UI — React component using existing `referral.api.js`. 2 days.
- [ ] **Build:** Practice result share card — `html2canvas` or `jsPDF`. 3 days.
- [ ] **Track:** Add `inviteSent` and `shareClicked` events to Referral model. 1 day.
- [ ] **Change:** Remove "coming soon" from Google SSO buttons or implement. 1 day.
- [ ] **Security:** Add auth middleware to unprotected data endpoints. 1 day.

### Week 2

- [ ] **Build:** Gamification widget — Profile page with streak count, badges, daily challenge. 3 days.
- [ ] **SEO:** Add FAQ schema + sample questions to chapter SEO pages. 2 days.
- [ ] **Infrastructure:** Fix ioredis dependency, remove mock WhatsApp. 0.5 days.
- [ ] **Content:** Generate 10 AI study guide blog posts via RAG pipeline. 1 day.
- [ ] **Build:** Weekly growth metrics sheet via Google Sheets integration. 2 days.
