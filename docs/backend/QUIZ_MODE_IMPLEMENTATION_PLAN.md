# Quiz Mode - Implementation Plan

> **Target:** K-12 Teachers | **Priority:** Async-first (Live mode Phase 2) | **Student Access:** Mobile-first
> **Created:** 2026-01-12 | **Status:** ✅ Completed (2026-01-19)

---

## Overview

Building an async-first quiz mode for the Teacher Dashboard with:
- Optional AI question generation (teachers can use existing question bank OR AI)
- Mobile-first student experience
- Flexible question bank integration

---

## Key Design Decisions

1. **Question Source Options:** Teachers can choose between existing question bank OR AI generation (not mandatory)
2. **Quiz Types:** MCQ + Fill-in-blanks (matching existing Question model)
3. **Access Control:** Using existing `TeacherStudent` model - teachers can only assign quizzes to their assigned students
4. **Scoring:** Auto-grading for objective questions only (no subjective answers in Phase 1)

> **Note:** Phase 2 (Live Quiz Mode) is intentionally excluded from this plan. It will require WebSocket integration and real-time leaderboards.

---

## Database Models

### Quiz Module (New Module)

New module at `src/modules/quiz/` following the existing DDM pattern.

---

### quiz.model.js

```javascript
// Quiz Schema Structure
{
  _id: ObjectId,
  title: String,                    // "Chapter 3 Weekly Test"
  description: String,              // Optional description
  
  // Creator & Access
  createdBy: ObjectId (ref: User),  // Teacher who created
  classId: ObjectId (ref: Class),
  sectionIds: [ObjectId],           // Optional: specific sections
  subjectId: ObjectId (ref: Subject),
  chapterIds: [ObjectId],           // Which chapters this covers
  
  // Configuration
  settings: {
    timeLimit: Number,              // Minutes (null = no limit)
    shuffleQuestions: Boolean,
    shuffleOptions: Boolean,
    showAnswersAfter: String,       // 'immediately', 'submission', 'deadline', 'never'
    allowedAttempts: Number,        // 1 = single attempt, null = unlimited
    passingPercentage: Number,      // e.g., 60
    deadline: Date,                 // Optional deadline
  },
  
  // Status
  status: String,                   // 'draft', 'published', 'closed'
  publishedAt: Date,
  closedAt: Date,
  
  // Stats (denormalized for performance)
  totalQuestions: Number,
  totalMarks: Number,
  
  timestamps: true
}
```

---

### quizQuestion.model.js

```javascript
// QuizQuestion Schema - Links quiz to questions with ordering & marks
{
  _id: ObjectId,
  quizId: ObjectId (ref: Quiz),
  questionId: ObjectId (ref: Question),  // Reference to existing question bank
  order: Number,                          // Display order
  marks: Number,                          // Points for this question (default: 1)
  
  // Optional: Custom question (not from bank)
  isCustom: Boolean,
  customQuestion: {
    questionText: String,
    options: [String],
    correctAnswer: String,
    explanation: String,
    questionType: String,
    difficulty: String
  }
}
```

---

### quizAttempt.model.js

```javascript
// QuizAttempt Schema - Student's attempt at a quiz
{
  _id: ObjectId,
  quizId: ObjectId (ref: Quiz),
  studentId: ObjectId (ref: User),
  attemptNumber: Number,                  // 1st, 2nd attempt etc.
  
  // Timing
  startedAt: Date,
  submittedAt: Date,
  timeSpent: Number,                      // Seconds
  
  // Results
  status: String,                         // 'in_progress', 'submitted', 'timed_out', 'graded'
  totalAnswered: Number,
  correctAnswers: Number,
  score: Number,                          // Total marks obtained
  percentage: Number,                     // Calculated percentage
  passed: Boolean,                        // Based on passingPercentage
  
  timestamps: true
}
```

---

### quizAnswer.model.js

```javascript
// QuizAnswer Schema - Individual question answers
{
  _id: ObjectId,
  attemptId: ObjectId (ref: QuizAttempt),
  quizQuestionId: ObjectId (ref: QuizQuestion),
  
  selectedAnswer: String,                 // Student's answer
  isCorrect: Boolean,
  marksObtained: Number,
  answeredAt: Date,
  timeTaken: Number                       // Seconds for this question
}
```

---

## Backend Routes

### Teacher Quiz Routes (`quiz.routes.js`)

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | `POST` | `/api/v1/quiz` | Create new quiz (draft) |
| 2 | `GET` | `/api/v1/quiz/:quizId` | Get quiz details |
| 3 | `PUT` | `/api/v1/quiz/:quizId` | Update quiz |
| 4 | `DELETE` | `/api/v1/quiz/:quizId` | Delete quiz (draft only) |
| 5 | `GET` | `/api/v1/quiz/teacher/:teacherId` | List teacher's quizzes |
| 6 | `POST` | `/api/v1/quiz/:quizId/publish` | Publish quiz |
| 7 | `POST` | `/api/v1/quiz/:quizId/close` | Close quiz |
| 8 | `POST` | `/api/v1/quiz/:quizId/clone` | Duplicate quiz |
| 9 | `POST` | `/api/v1/quiz/:quizId/questions` | Add questions to quiz |
| 10 | `DELETE` | `/api/v1/quiz/:quizId/questions/:questionId` | Remove question |
| 11 | `PUT` | `/api/v1/quiz/:quizId/questions/reorder` | Reorder questions |
| 12 | `GET` | `/api/v1/quiz/:quizId/analytics` | Get quiz analytics |

---

### Student Quiz Routes (`quizStudent.routes.js`)

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | `GET` | `/api/v1/quiz/student/available` | List available quizzes for student |
| 2 | `POST` | `/api/v1/quiz/:quizId/start` | Start quiz attempt |
| 3 | `POST` | `/api/v1/quiz/attempt/:attemptId/answer` | Submit answer |
| 4 | `POST` | `/api/v1/quiz/attempt/:attemptId/submit` | Submit entire quiz |
| 5 | `GET` | `/api/v1/quiz/attempt/:attemptId/result` | Get attempt result |
| 6 | `GET` | `/api/v1/quiz/student/history` | Get quiz history |

---

## API Response Structures

### Create Quiz Response
```json
{
  "success": true,
  "data": {
    "quiz": {
      "_id": "quiz123",
      "title": "Weekly Math Test",
      "status": "draft",
      "totalQuestions": 0,
      "totalMarks": 0,
      "settings": { ... }
    }
  }
}
```

### Quiz Analytics Response
```json
{
  "success": true,
  "data": {
    "quiz": { "_id": "...", "title": "..." },
    "overview": {
      "totalStudents": 67,
      "attempted": 52,
      "completed": 48,
      "avgScore": 72.5,
      "passRate": 0.85,
      "avgTimeSpent": 1200
    },
    "questionAnalysis": [
      {
        "questionId": "q1",
        "questionText": "...",
        "correctPercentage": 0.65,
        "avgTimeSpent": 45,
        "optionDistribution": { "A": 20, "B": 45, "C": 15, "D": 20 }
      }
    ],
    "topPerformers": [...],
    "strugglingStudents": [...]
  }
}
```

---

## Implementation Order

```
Phase 1: Database Models
    ↓
Phase 2: Quiz CRUD APIs
    ↓
Phase 3: Student APIs
    ↓
Phase 4: Analytics APIs
    ↓
Phase 5: Teacher Dashboard Integration
    ↓
Phase 6: Unit Tests
```

---

## Files to Create

### New Module Structure
```
src/modules/quiz/
├── controllers/
│   ├── quiz.controller.js
│   └── quizStudent.controller.js
├── models/
│   ├── quiz.model.js
│   ├── quizQuestion.model.js
│   ├── quizAttempt.model.js
│   └── quizAnswer.model.js
├── routes/
│   ├── quiz.routes.js
│   └── quizStudent.routes.js
├── services/
│   └── quiz.service.js
├── tests/
│   └── quiz.service.test.js
└── index.js
```

### Files to Modify
- `routes/index.js` - Register quiz routes
- `src/modules/teacher/routes/teacherDashboard.routes.js` - Add quiz summary

---

## Out of Scope (Phase 2 - Future)

| Feature | Reason |
|---------|--------|
| Live Quiz Mode | Requires WebSocket infrastructure |
| Real-time Leaderboard | Depends on Live Quiz |
| Subjective Questions | Requires manual grading workflow |
| Parent Notifications | Requires notification service |
| Proctoring | Complex browser security features |

---

## Open Questions (To Decide Before Implementation)

1. **Grading Scale:** Should we support different marks per question (e.g., Easy=1, Medium=2, Hard=3), or uniform marks?

2. **Quiz Retakes:** If student can retake, should we keep best score, latest score, or average?

3. **Partial Credit:** For fill-in-blanks, should we support partial matches (case-insensitive, trimmed)?

4. **Student View:** Should students see which questions they got wrong immediately, or only after deadline?

---

*This document is saved for future reference. Implementation can begin when ready.*
