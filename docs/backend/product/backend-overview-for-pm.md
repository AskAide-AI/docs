# AskAide Project Overview & Backend Roadmap

**To:** Product Management Team
**From:** Backend Engineering Team
**Date:** 2026-02-02 (Updated)
**Subject:** Project Features, Workflows, and Student Progress Tracking Proposal

---

## 1. Executive Summary

AskAide AI is an advanced educational platform designed to provide smart, personalized learning experiences. Our backend currently supports **Role-Based Access**, a **Hierarchical Content System**, and **Interactive Practice Sessions**.

While the core infrastructure is solid, enabling features like PDF-based learning and quiz generation, our current **Student Progress Tracking** is limited to session-based scoring. We propose a roadmap to evolve this into a **"Topic Mastery"** system to provide deep insights into student learning.

This document covers:
1.  **Project Features**: What the platform does today.
2.  **Key Workflows**: How users interact with the system.
3.  **Progress Tracking Implementation**: Our completed Topic Mastery system.

---

## 2. Project Feature Overview

### 👥 User Roles & Portals
*   **Admin Panel**: Global management of Schools, Teachers, and Content (Classes/Subjects).
*   **Teacher Dashboard**: Class oversight, student performance monitoring, and content assignment.
*   **Student Portal**: deeply interactive area for learning, practicing questions, and tracking personal history.
*   **Principal/Parent View**: High-level oversight of school or child performance (Architecturally supported).

### 🧠 Smart Content Engine
*   **PDF-to-Learning**: Admins/Teachers can upload Chapter PDFs.
*   **AI Integration**:
    *   **Question Generation**: Automatically creates questions (MCQ/Fill-in-blanks) from uploaded content.
    *   **Contextual RAG**: Uses "Retrieval-Augmented Generation" to answer specific student queries based on chapter material.
*   **Hierarchical Structure**: Content is organized strictly as `Class -> Subject -> Chapter -> Topic`.

### 📝 Assessment & Practice
*   **Dynamic Practice Sessions**: Students can start quizzes on specific chapters.
*   **Real-time Scored Feedback**: Immediate right/wrong feedback with explanations.
*   **Adaptive Difficulty**: Questions are tagged (Easy, Medium, Hard) to allow for potential adaptive flows.
*   **Quiz Mode**: Teachers can create, publish, and manage async quizzes with auto-grading, configurable time limits, and multiple attempts.

---

## 3. Key Workflows (User Journeys)

### 🛠️ Workflow A: Content Creation (Admin/Teacher)
1.  **Select Context**: Admin selects a Class (e.g., "Grade 10") and Subject (e.g., "Physics").
2.  **Upload Material**: Admin uploads a PDF for a new Chapter (e.g., "Kinematics").
3.  **AI Processing**:
    *   Backend receives PDF.
    *   AI Service extracts text and generates initial Questions.
    *   Questions are saved to the Bank and tagged to the Chapter.
4.  **Publication**: The Chapter is now live for students.

### 🎓 Workflow B: Student Practice Loop (Endless Practice)
1.  **Discovery**: Student browses their Class/Subject and measures progress on available Chapters.
2.  **Session Start**: Student clicks "Practice" on a Chapter.
3.  **Batch Request**:
    *   Frontend calls `GET /questions/batch/chapter/:id/type/:type/difficulty/:diff/session/:sessionId`.
    *   Backend returns immediately with existing questions + a `status` field (`generating`, `failed`, or `mastered`).
    *   If no job exists, backend creates one and fires background AI generation (fire-and-forget).
4.  **Interaction**:
    *   Student answers questions; Backend records the `UserAnswer`.
    *   Frontend polls the batch endpoint every 3-5s to fetch newly generated questions.
    *   **Dedup on insert**: `_dedupeNewQuestions()` prevents duplicates on re-generation.
5.  **Yield-Based Mastery**:
    *   If `lowYieldStreak` reaches `LOW_YIELD_LIMIT` (backend detects too few new questions per run), the chapter is marked `mastered`.
    *   **Prefetch**: When the remaining question pool drops below `QUESTION_PREFETCH_AHEAD`, background generation triggers the next batch mid-session — no waiting.
6.  **Completion**:
    *   Session ends when the student chooses to stop or after reaching a `contentComplete` / mastered state.
    *   On mastery: frontend shows a **celebration state** ("You've mastered this chapter!").
    *   Student sees a summary: "You scored 8/10! Improved by 15%."

### 📊 Workflow C: Performance Monitoring
1.  **Data Collection**: Every answer is stored with timestamp, difficulty, and correctness.
2.  **Teacher View**: Teacher logs in to see a list of students and their recent Session scores.
3.  **Gap**: *Currently, the teacher sees "John got 70%", but not "John doesn't understand acceleration."*

---

## 4. ✅ Implemented: Topic Mastery System

We have successfully implemented granular topic-level progress tracking:

> *"User John answered Question #123 correctly on **Topic** 'Factoring Polynomials' in the 'Algebra' Chapter."*

**What we now track:**
- `topicId` stored in every `UserAnswer` record
- Running mastery scores per topic (`StudentTopicProgress` model)
- Difficulty-weighted scoring (Easy: 25%, Medium: 35%, Hard: 40%)
- Mastery states: WEAK → LEARNING → PRACTICING → MASTERED

We can now tell you exactly *which specific topics* a student struggles with!

---

## 5. Implementation Status

### ✅ Phase 1: The "Granularity" Fix — COMPLETED
**Goal**: Enable data collection for detailed analysis.

**Implemented:**
- `topicId` field added to `UserAnswer` model
- `StudentTopicProgress` model created with comprehensive tracking
- Progress calculated per topic with difficulty weighting

### ✅ Phase 2: The "Weakness Detector" — COMPLETED
**Goal**: Show students where they are struggling.

**Implemented APIs:**
- `GET /api/v1/student-progress/progress/:userId/chapter/:chapterId` - Chapter mastery breakdown
- `GET /api/v1/student-progress/progress/:userId/subject/:subjectId` - Subject-level aggregation
- `GET /api/v1/student-progress/chapter/:chapterId/ai-insights` - AI-powered insights
- `GET /api/v1/student-progress/subject/:subjectId/ai-insights` - Subject AI insights

**Dashboard Output (Implemented):**
- 🟢 **MASTERED** (>80%): Strong topics
- 🟡 **PRACTICING** (60-80%): Good progress
- 🟠 **LEARNING** (35-60%): Needs more practice
- 🔴 **WEAK** (<35%): Requires attention

### 🔮 Phase 3: The "Cognitive State Engine" — FUTURE
**Goal**: Predictive analytics and personalized learning.

*   **Bayesian Knowledge Tracing (BKT)**: Calculate **Probability of Mastery**.
*   **Retention Tracking**: Track "Last Practiced" date for memory decay prediction.
*   **Adaptive Questions**: Auto-insert review questions for decaying topics.

---

## 6. Summary of Work

| Feature | Effort | Impact | Status |
| :--- | :--- | :--- | :--- |
| **Schema Update (`topicId`)** | 📉 Low | Critical enabler for all analytics. | ✅ **COMPLETED** |
| **Mastery Dashboard API** | 📉 Medium | High user value (Visual progress). | ✅ **COMPLETED** |
| **Section Management** | 📉 Low | Class organization (9th-A, 9th-B). | ✅ **COMPLETED** |
| **AI Insights API** | 📉 Medium | Smart recommendations. | ✅ **COMPLETED** |
| **AI/BKT Engine** | 📈 High | "Star Feature" (Personalized Tutor). | 🔮 **Future** |

---

## 7. Recently Added Features

### Class Sections
- Schools can now create sections (A, B, C) for each class
- Teachers can be assigned to specific class-sections
- Model: `Section` with school and class relationships

### AI-Powered Insights
- Chapter-level AI insights for personalized recommendations
- Subject-level AI insights for broad learning guidance
- Integration with external AI service for analysis

### Teacher-Student Management
- `TeacherStudent` model for managing teacher-student relationships
- Section-aware student assignments
- Bulk upload capabilities for chapter PDFs

### Quiz Mode (2026-01-19)
- Async quiz system for teachers to create and manage quizzes
- Auto-grading for MCQ and fill-in-blanks
- Configurable settings: time limits, allowed attempts, shuffling
- Quiz analytics with performance insights
- Student quiz history and results

---

## 8. Engineering Standards Maturity

We have recently codified robust backend engineering standards into explicit **Skills** for our development team. This accelerates future feature velocity by ensuring consistency, reliability, and security across the codebase.

**Key Achievements:**
- **Service-Oriented Modules (`api-module-scaffold`)**: Features are cleanly separated into isolated modules with designated layers for HTTP routing, validation, and business logic.
- **Enhanced Security (`api-security`)**: Standardized explicit Role-Based Access Controls (Teacher, Student, Principal) and advanced JWT/OTP flows.
- **Testing Fidelity (`backend-testing`)**: Established modern unit-test pipelines (Jest/ESM) for all core business logic to prevent regressions as the product scales.
- **Database Optimization (`database-patterns`)**: Solidified Mongoose query strategies to proactively prevent performance bottlenecks (like N+1 queries) and handle increased student loads.

