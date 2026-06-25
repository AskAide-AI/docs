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

- [Technical Architecture](./backend/ARCHITECTURE.md)
- [Full Feature List](./backend/FEATURES.md)
- [API Documentation](./backend/API-DOCUMENTATION.md)
- [Database Schema](./backend/DATABASE-SCHEMA.md)

---

*Last Updated: 2026-04-19*
