# AskAide AI — Product Introduction

> **Your AI-Powered Learning Companion for Students, Teachers, and Schools**

---

## What is AskAide AI?

AskAide AI is an educational platform that makes learning smarter and more personalized. It helps students practice and master their subjects by providing AI-generated questions, instant feedback, and detailed progress tracking.

Think of it as a **personal tutor** that:
- Knows exactly what topics each student needs to work on
- Creates practice questions automatically from textbooks and PDFs
- Shows teachers which students need extra help and on what topics

---

## Who Uses AskAide AI?

| User | What They Do |
|------|-------------|
| **Students** | Practice questions, track their progress, see what they've mastered |
| **Teachers** | Create quizzes, monitor student performance, identify weak topics in the class |
| **Schools** | Manage classes, sections, and teacher-student assignments |
| **Parents** | View their child's learning progress (coming soon) |

---

## Key Features (In Simple Terms)

### 📚 Smart Question Generation
Upload a chapter PDF and the AI automatically creates practice questions — no manual work needed.

### 🎯 Topic Mastery Tracking
Instead of just showing "You scored 70%", AskAide tells you *exactly* which topics you've mastered and which ones need more practice.

- 🟢 **Mastered** — You've got this!
- 🟡 **Practicing** — Good progress, keep going
- 🟠 **Learning** — Needs more practice
- 🔴 **Weak** — Focus here first

### 📝 Quiz Mode
Teachers can create timed quizzes for students. The system grades them automatically and provides analytics on how the class performed.

### 📊 Teacher Dashboard
Teachers see a subject-level view showing:
- Which chapters are being practiced
- Which topics the class struggles with
- Individual student progress

---

## How Does It Work?

```
┌──────────────────────────────────────────────────────────────────┐
│  1. SETUP                                                        │
│     Admin creates Classes (6th-12th) → Subjects → Chapters       │
│     Teachers upload chapter PDFs                                 │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. AI MAGIC                                                     │
│     AI reads the PDFs and generates practice questions           │
│     Questions are tagged by topic and difficulty                 │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. STUDENT PRACTICE                                             │
│     Students select a chapter and start practicing               │
│     They get instant feedback on each question                   │
│     The system tracks what they know and don't know              │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. INSIGHTS                                                     │
│     Students see: "You're weak in Polynomials, focus here"       │
│     Teachers see: "8 students struggling with Chapter 3"         │
│     Everyone improves!                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Content Structure

All learning content is organized like this:

```
Class (e.g., 10th Grade)
  └── Subject (e.g., Mathematics)
       └── Chapter (e.g., Quadratic Equations)
            └── Topics (e.g., Factorization, Completing the Square)
                 └── Questions (Easy / Medium / Hard)
```

---

## Question Types Supported

| Type | Description | Example |
|------|-------------|---------|
| **MCQ** | Multiple Choice Questions | "What is 2+2? A) 3 B) 4 C) 5 D) 6" |
| **Fill-in-the-Blank** | Type the correct answer | "The capital of France is ____" |

---

## What Makes AskAide Different?

| Traditional Learning Apps | AskAide AI |
|---------------------------|------------|
| Generic practice tests | AI generates questions from *your* syllabus |
| Just shows a score | Shows *which topics* you don't understand |
| Teachers manually create content | Teachers upload PDFs; AI does the rest |
| No class-level insights | Teachers see entire class performance at a glance |

---

## Technology Summary

For the technically curious:

- **Backend**: Node.js with Express
- **Database**: MongoDB
- **AI**: External AI service for question generation and learning insights
- **Authentication**: Secure login with JWT tokens
- **Architecture**: Domain-Driven Modules (organized by feature)

---

## Quick Links

- [Technical Architecture](../architecture)
- [Full Feature List](../features/)
- [API Reference](/docs/reference/api-reference)
- [Database Schema](../reference/database-schema)

---

# For Product Management

> The sections below were consolidated from the former *Backend Overview for PM* doc. They give the PM-facing detail behind the introduction above.

## Key Workflows (User Journeys)

### Workflow A — Content Creation (Admin/Teacher)
1. **Select context** — Admin picks a Class (e.g. "Grade 10") and Subject (e.g. "Physics").
2. **Upload material** — Admin uploads a PDF for a new Chapter (e.g. "Kinematics").
3. **AI processing** — Backend receives the PDF; the AI Service extracts text and generates initial questions, which are saved to the bank and tagged to the chapter.
4. **Publication** — The chapter is now live for students.

### Workflow B — Student Practice Loop (endless practice)
1. **Discovery** — Student browses their Class/Subject and sees progress on available chapters.
2. **Session start** — Student clicks "Practice" on a chapter.
3. **Batch request** — Frontend calls `GET /questions/batch/...`; backend returns immediately with existing questions plus a `status` field (`generating`, `failed`, or `mastered`). If no job exists, backend fires background AI generation (fire-and-forget).
4. **Interaction** — Student answers; backend records each `UserAnswer`; frontend polls every 3–5s for new questions. `_dedupeNewQuestions()` prevents duplicates across re-generation.
5. **Yield-based mastery** — When `lowYieldStreak` reaches `LOW_YIELD_LIMIT`, the chapter is marked `mastered`. **Prefetch:** when the remaining pool drops below `QUESTION_PREFETCH_AHEAD`, the next batch generates mid-session.
6. **Completion** — Session ends on stop or at a `contentComplete`/mastered state; on mastery the UI shows a celebration plus a session summary.

### Workflow C — Performance Monitoring
1. **Data collection** — Every answer is stored with timestamp, difficulty, and correctness.
2. **Teacher view** — Teachers see students and recent session scores, plus topic-level weak-area breakdowns (see Topic Mastery below).

## Topic Mastery System — Implementation Status

Granular topic-level progress tracking is implemented: every `UserAnswer` stores a `topicId`, with running mastery scores per topic (`StudentTopicProgress`), difficulty-weighted scoring (Easy 25% / Medium 35% / Hard 40%) and states WEAK → LEARNING → PRACTICING → MASTERED.

| Phase | Goal | Status |
|-------|------|--------|
| Phase 1 — Granularity fix (`topicId`, `StudentTopicProgress`) | Enable detailed data collection | ✅ Completed |
| Phase 2 — Weakness detector (chapter/subject progress + AI insights APIs) | Show students where they struggle | ✅ Completed |
| Phase 3 — Cognitive State Engine (Bayesian Knowledge Tracing, retention/decay, adaptive review) | Predictive, personalized learning | 🔮 Future |

Dashboard thresholds: 🟢 Mastered >80% · 🟡 Practicing 60–80% · 🟠 Learning 35–60% · 🔴 Weak &lt;35%.

## Engineering Standards Maturity

Backend engineering standards are codified as explicit team **Skills** to keep feature velocity high:
- **Service-oriented modules** (`api-module-scaffold`) — isolated modules with distinct routing/validation/business-logic layers.
- **Security** (`api-security`) — standardized RBAC (Teacher/Student/Principal) and JWT/OTP flows.
- **Testing fidelity** (`backend-testing`) — Jest/ESM unit-test pipelines for core business logic.
- **Database optimization** (`database-patterns`) — Mongoose query strategies that proactively avoid N+1 and scale with load.

---

*Last Updated: 2026-04-19 (merged with Backend Overview for PM)*
