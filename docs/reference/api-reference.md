# API Reference — AskAide AI

> Comprehensive reference for all Backend and AI Service endpoints.

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Backend API (`/api/v1/`)](#backend-api)
  - [Authentication](#1-authentication)
  - [Profile](#2-profile)
  - [Content](#3-content)
  - [Questions](#4-questions)
  - [Sessions](#5-sessions)
  - [User Answers](#6-user-answers)
  - [Progress](#7-progress)
  - [Gamification](#8-gamification)
  - [Quiz](#9-quiz)
  - [Teacher Dashboard](#10-teacher-dashboard)
  - [Parent Dashboard](#11-parent-dashboard)
  - [Question Paper](#12-question-paper)
  - [School & Sections](#13-school--sections)
  - [AI Assistant](#14-ai-assistant)
  - [Supporting](#15-supporting)
- [AI Service API (`/`)](#ai-service-api)
  - [Document Management](#1-document-management)
  - [Search & RAG](#2-search--rag)
  - [AI Insights](#3-ai-insights)
  - [AI Agent](#4-ai-agent)
  - [Topic Management](#5-topic-management)
  - [Health & Monitoring](#6-health--monitoring)
- [Error Codes](#error-codes)
- [Rate Limits](#rate-limits)

---

## Overview

| Service | Base URL | Protocol | Auth |
|---------|----------|----------|------|
| **Backend** | `http://localhost:4000` | REST | JWT Bearer (via Cookie, Header, or Body) |
| **AI Service** | `http://localhost:8000` | REST | `x-api-key` header (shared secret) |

**Frontend never calls AI Service directly.** All AI calls are proxied through the Backend.

### Common Headers

```
Content-Type: application/json
Authorization: Bearer <jwt_token>        # Backend only
```

### Response Envelope

All Backend endpoints return responses wrapped in:

```json
{
  "success": true | false,
  "data": { ... },
  "message": "optional message",
  "error": "optional error details"
}
```

---

## Authentication

### JWT Token

- Obtained via `POST /authenticate/login` or `POST /authenticate/signup`
- Accepted via Cookie (`token=<jwt>`), Header (`Authorization: Bearer <jwt>`), or Body (`{ token }`)
- **accessToken** expires after 2 hours; **refreshToken** expires after 7 days (rotated on use)
- Admin-protected endpoints require `accountType: "SuperAdmin"`

### Role-Based Access

| Role | Access Level |
|------|-------------|
| `Student` | Own data, quizzes, sessions |
| `Teacher` | Teacher dashboard, assignments, analytics |
| `Admin` | Full access |
| `Parent` | Child data, progress overview |

---

## Backend API

### 1. Authentication

Base: `/api/v1/authenticate/`

---

#### POST `/login`

Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "userName": "john",
    "email": "user@example.com",
    "accountType": "Student",
    "image": "https://..."
  }
}
```

**Errors:** 400 (missing fields), 401 (invalid credentials), 404 (user not found)

---

#### GET `/health`

Backend health check (excluded from rate limiting).

**Response (200):**
```json
{
  "status": "healthy",
  "server": "ok",
  "database": "ok",
  "timestamp": "2026-06-29T12:00:00.000Z"
}
```

**Response (503):**
```json
{
  "status": "degraded",
  "server": "ok",
  "database": "disconnected",
  "timestamp": "2026-06-29T12:00:00.000Z"
}
```

---

#### POST `/signup`

Register a new user.

**Request:**
```json
{
  "userName": "john",
  "email": "john@example.com",
  "password": "Secret@123",
  "accountType": "Student"
}
```

**Password requirements:**
- Minimum 8 characters
- Must include uppercase, lowercase, number, and special character (`!@#$%^&*`)

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

**Errors:** 400 (missing fields), 409 (email already exists)

---

#### POST `/changepassword`

Change password for logged-in user.

**Request:**
```json
{
  "oldPassword": "OldSecret@123",
  "newPassword": "NewSecret@456"
}
```

**Password requirements** (same as signup): minimum 8 characters, must include uppercase, lowercase, number, and special character.

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:** 400 (incorrect old password)

---

#### POST `/reset-password-token`

Request a password reset email.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "resetPasswordUrl": "http://localhost:5173/reset-password?token=abc123"
}
```

**Errors:** 404 (email not found)

---

#### POST `/reset-password`

Reset password with token from email.

**Request:**
```json
{
  "password": "NewSecret@456",
  "token": "abc123def456"
}
```

**Password requirements** (same as signup): minimum 8 characters, must include uppercase, lowercase, number, and special character.

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Errors:** 400 (invalid/expired token)

---

#### POST `/verify-email`

Verify email with OTP sent during signup.

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Errors:** 400 (invalid OTP), 404 (user not found)

---

### 2. Profile

Base: `/api/v1/profile/`

**Auth required for all endpoints.**

---

#### GET `/details`

Get logged-in user's full profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "userName": "john",
    "email": "john@example.com",
    "accountType": "Student",
    "image": "https://...",
    "class": "64f1a2b3c4d5e6f7a8b9c0d2",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-06-20T14:22:00.000Z"
  }
}
```

---

#### PUT `/update`

Update profile fields.

**Request:**
```json
{
  "userName": "john_updated",
  "class": "64f1a2b3c4d5e6f7a8b9c0d3"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "..." : "updated profile" }
}
```

---

#### DELETE `/delete`

Delete user account and all associated data.

**Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

#### PUT `/display-picture`

Upload profile avatar (multipart/form-data).

**Request:** `multipart/form-data`
| Field | Type | Required |
|-------|------|----------|
| `avatar` | File (image) | Yes |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "image": "https://res.cloudinary.com/..."
  }
}
```

---

#### DELETE `/display-picture`

Remove profile avatar (reverts to default).

**Response (200):**
```json
{
  "success": true,
  "message": "Display picture removed"
}
```

---

#### GET `/public/:userId`

Get public profile for any user (no sensitive data).

**Params:** `userId` — MongoDB ObjectId

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userName": "john",
    "image": "https://...",
    "accountType": "Student",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors:** 404 (user not found)

---

### 3. Content

Base: `/api/v1/` (routes mounted at `/classes`, `/subjects`, `/chapters`, `/topic`, `/study` — no `/content` prefix)

---

#### GET `/classes`

List all available classes.

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "_id": "64f1...", "name": "Class 6", "order": 6 },
    { "_id": "64f2...", "name": "Class 7", "order": 7 }
  ]
}
```

---

#### GET `/subjects`

List all subjects.

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "_id": "64f3...", "name": "Mathematics" },
    { "_id": "64f4...", "name": "Science" }
  ]
}
```

---

#### GET `/subjects/class/:classId`

Get subjects for a specific class.

**Params:** `classId` — MongoDB ObjectId

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "_id": "64f3...", "name": "Mathematics" },
    { "_id": "64f4...", "name": "Science" }
  ]
}
```

---

#### GET `/study/configuration`

Get full class → subject → chapter hierarchy for the study flow.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1...",
      "name": "Class 6",
      "subjects": [
        {
          "_id": "64f3...",
          "name": "Mathematics",
          "chapters": [
            { "_id": "64c1...", "title": "Number System" },
            { "_id": "64c2...", "title": "Algebra" }
          ]
        }
      ]
    }
  ]
}
```

---

#### POST `/chapters`

Create a new chapter.

**Request:**
```json
{
  "title": "Number System",
  "classId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "subjectId": "64f3a2b3c4d5e6f7a8b9c0d3"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "64c1a2b3c4d5e6f7a8b9c0d1",
    "title": "Number System",
    "classId": "64f1...",
    "subjectId": "64f3...",
    "createdAt": "2024-06-20T14:22:00.000Z"
  }
}
```

---

#### POST `/chapters/create-with-pdf`

Upload a chapter with a PDF for RAG indexing (multipart/form-data).

**Request:** `multipart/form-data`
| Field | Type | Required |
|-------|------|----------|
| `file` | PDF file | Yes |
| `chapterId` | String (ObjectId) | Yes |

**Response (202):**
```json
{
  "success": true,
  "message": "PDF uploaded and ingestion started",
  "task_id": "task_abc123def456"
}
```

Use `POST /chapters/check-rag-status` or `GET /upload-status/{task_id}` to poll processing status.

---

#### POST `/chapters/check-rag-status`

Check if a chapter's PDF has been indexed in Qdrant.

**Request:**
```json
{
  "chapterId": "64c1a2b3c4d5e6f7a8b9c0d1"
}
```

**Response (200):**
```json
{
  "success": true,
  "indexed": true
}
```

---

#### GET `/chapters/class/:classId/subject/:subjectId`

Get chapters filtered by class and subject.

**Params:** `classId`, `subjectId` — MongoDB ObjectIds

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "_id": "64c1...", "title": "Number System" },
    { "_id": "64c2...", "title": "Algebra" }
  ]
}
```

---

#### DELETE `/chapters`

Delete a chapter (also removes from vector DB).

**Request:**
```json
{
  "chapterId": "64c1a2b3c4d5e6f7a8b9c0d1"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Chapter deleted successfully"
}
```

---

#### POST `/topic`

Create a topic within a chapter.

**Request:**
```json
{
  "title": "Natural Numbers",
  "chapterId": "64c1a2b3c4d5e6f7a8b9c0d1",
  "classId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "subjectId": "64f3a2b3c4d5e6f7a8b9c0d3"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "64t1a2b3c4d5e6f7a8b9c0d1",
    "title": "Natural Numbers",
    "chapterId": "64c1..."
  }
}
```

---

#### GET `/topic/get-topics-by-chapter/:chapterId`

Get all topics for a chapter.

**Params:** `chapterId` — MongoDB ObjectId

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "_id": "64t1...", "title": "Natural Numbers" },
    { "_id": "64t2...", "title": "Whole Numbers" }
  ]
}
```

---

### 4. Questions

Base: `/api/v1/questions/`

---

#### POST `/`

Create a single question.

**Request:**
```json
{
  "question": "What is the HCF of 12 and 18?",
  "options": ["2", "3", "4", "6"],
  "correctAnswer": "6",
  "questionType": "MCQ",
  "difficulty": "medium",
  "topicId": "64t1a2b3c4d5e6f7a8b9c0d1",
  "chapterId": "64c1a2b3c4d5e6f7a8b9c0d1",
  "classId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "subjectId": "64f3a2b3c4d5e6f7a8b9c0d3"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "64q1a2b3c4d5e6f7a8b9c0d1",
    "question": "What is the HCF of 12 and 18?",
    "options": ["2", "3", "4", "6"],
    "correctAnswer": "6",
    "questionType": "MCQ",
    "difficulty": "medium"
  }
}
```

---

#### GET `/questions/chapter/:chapterId`

Get all questions for a chapter.

**Params:** `chapterId` — MongoDB ObjectId

**Query params:** `?type=MCQ&difficulty=easy&limit=50`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64q1...",
      "question": "What is the HCF of 12 and 18?",
      "options": ["2", "3", "4", "6"],
      "correctAnswer": "6",
      "questionType": "MCQ",
      "difficulty": "medium"
    }
  ]
}
```

---

#### GET `/questions/batch/chapter/:chapterId/type/:questionType/difficulty/:difficulty/session/:sessionId`

Smart batch fetch — returns questions **not yet answered** in the given session.

**Params:** `chapterId`, `questionType`, `difficulty`, `sessionId`

**Query:** `?limit=10`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64q1...",
      "question": "What is the HCF of 12 and 18?",
      "options": ["2", "3", "4", "6"],
      "correctAnswer": "6",
      "questionType": "MCQ",
      "difficulty": "medium"
    }
  ]
}
```

---

### 5. Sessions

Base: `/api/v1/sessions/`

---

#### POST `/sessions`

Start a new practice session.

**Request:**
```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "subject": "Mathematics",
  "chapter": "Number System",
  "questionType": "MCQ",
  "difficulty": "medium"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "64s1a2b3c4d5e6f7a8b9c0d1",
    "userId": "64f1...",
    "classId": "64f1...",
    "subject": "Mathematics",
    "chapter": "Number System",
    "questionType": "MCQ",
    "difficulty": "medium",
    "status": "in-progress",
    "score": 0,
    "totalQuestions": 0,
    "createdAt": "2024-06-20T14:22:00.000Z"
  }
}
```

---

#### DELETE `/sessions`

Delete a session and its answers.

**Request:**
```json
{
  "sessionId": "64s1a2b3c4d5e6f7a8b9c0d1"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Session deleted"
}
```

---

#### GET `/sessions/user/:userId`

Get all sessions for a user.

**Params:** `userId`

**Query:** `?status=in-progress&limit=20&sort=-createdAt`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64s1...",
      "subject": "Mathematics",
      "chapter": "Number System",
      "status": "in-progress",
      "score": 5,
      "totalQuestions": 10,
      "createdAt": "2024-06-20T14:22:00.000Z"
    }
  ]
}
```

---

#### PATCH `/sessions/:id/end`

End a session with final score.

**Params:** `id` — session MongoDB ObjectId

**Request:**
```json
{
  "score": 8,
  "totalquestions": 10
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64s1...",
    "status": "completed",
    "score": 8,
    "totalQuestions": 10,
    "completedAt": "2024-06-20T14:45:00.000Z"
  }
}
```

---

#### GET `/sessions/:id`

Get full session details.

**Params:** `id`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64s1...",
    "userId": "64f1...",
    "subject": "Mathematics",
    "chapter": "Number System",
    "questionType": "MCQ",
    "difficulty": "medium",
    "status": "completed",
    "score": 8,
    "totalQuestions": 10,
    "createdAt": "2024-06-20T14:22:00.000Z",
    "completedAt": "2024-06-20T14:45:00.000Z"
  }
}
```

---

#### GET `/sessions/last-incomplete/:userId`

Get the most recent incomplete session for resuming.

**Params:** `userId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64s1...",
    "status": "in-progress",
    "subject": "Mathematics",
    "chapter": "Number System",
    "score": 3,
    "totalQuestions": 10
  }
}
```

**Response (200, no incomplete):**
```json
{
  "success": true,
  "data": null
}
```

---

#### GET `/sessions/:id/share`

Get shareable card data for a completed session.

**Params:** `id`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userName": "john",
    "subject": "Mathematics",
    "chapter": "Number System",
    "score": 8,
    "totalQuestions": 10,
    "percentage": 80,
    "date": "2024-06-20"
  }
}
```

---

#### GET `/sessions/:id/share-image`

Generate a shareable image for the session.

**Params:** `id`

**Response (200):** Image binary (PNG)

---

### 6. User Answers

Base: `/api/v1/user-answers/`

---

#### POST `/user-answers/batch`

Submit a batch of answers for a session.

**Request:**
```json
{
  "sessionId": "64s1a2b3c4d5e6f7a8b9c0d1",
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "answers": [
    {
      "questionId": "64q1a2b3c4d5e6f7a8b9c0d1",
      "selectedAnswer": "6",
      "isCorrect": true,
      "timeTaken": 15
    },
    {
      "questionId": "64q2a2b3c4d5e6f7a8b9c0d2",
      "selectedAnswer": "3",
      "isCorrect": false,
      "timeTaken": 22
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "submitted": 2,
    "correct": 1,
    "incorrect": 1
  }
}
```

---

#### GET `/user-answers/session/:sessionId`

Get all answers for a session.

**Params:** `sessionId`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64ua1...",
      "questionId": "64q1...",
      "selectedAnswer": "6",
      "isCorrect": true,
      "timeTaken": 15
    }
  ]
}
```

---

#### GET `/user-answers/user/:userId`

Get all answers for a user (across sessions).

**Params:** `userId`

**Query:** `?limit=100&sort=-createdAt`

**Response (200):**
```json
{
  "success": true,
  "data": [ "..." ]
}
```

---

### 7. Progress

Base: `/api/v1/` (routes mounted at `/topic-progress`, `/sessions`, `/user-answers`, `/progress`, `/streaks`, `/daily-challenge`, `/session-feedback`, `/badges` — no single `/progress` prefix)

---

#### GET `/topic-progress/progress/:userId/chapter/:chapterId`

Get topic-level progress for a specific chapter.

**Params:** `userId`, `chapterId`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "topicId": "64t1...",
      "topicName": "Natural Numbers",
      "totalAttempts": 15,
      "correctAttempts": 12,
      "accuracy": 80,
      "mastery": "proficient"
    }
  ]
}
```

---

#### GET `/topic-progress/progress/:userId/subject/:subjectId`

Get topic-level progress for an entire subject.

**Params:** `userId`, `subjectId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "chapters": [
      {
        "chapterId": "64c1...",
        "chapterName": "Number System",
        "topics": [
          {
            "topicId": "64t1...",
            "topicName": "Natural Numbers",
            "accuracy": 80,
            "mastery": "proficient"
          }
        ]
      }
    ],
    "overallAccuracy": 75
  }
}
```

---

#### GET `/topic-progress/ai-insights/userid/:userId/chapter/:chapterId`

Get AI-generated insights for a chapter.

**Params:** `userId`, `chapterId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": "You have a strong grasp of Number System fundamentals...",
    "strengths": ["Natural Numbers", "Whole Numbers"],
    "weaknesses": ["Integers"],
    "recommendations": [
      "Practice more integer operations",
      "Review negative number concepts"
    ]
  }
}
```

---

#### GET `/topic-progress/ai-insights/userid/:userId/subject/:subjectId`

Get AI-generated insights for an entire subject.

**Params:** `userId`, `subjectId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": "Overall strong performance in Mathematics...",
    "chapterInsights": [ "..." ],
    "overallRecommendations": [ "..." ]
  }
}
```

---

#### GET `/topic-progress/mastery-summary/:userId`

Get mastery summary across all subjects.

**Params:** `userId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalTopics": 120,
    "mastered": 45,
    "proficient": 35,
    "learning": 25,
    "needsPractice": 15,
    "overallMastery": 37.5
  }
}
```

---

#### GET `/progress/user/:userId`

Dashboard progress overview.

**Params:** `userId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalSessions": 48,
    "totalQuestionsAnswered": 480,
    "overallAccuracy": 78,
    "currentStreak": 5,
    "weeklyActivity": [12, 8, 15, 10, 7, 0, 0],
    "recentSessions": [ "..." ],
    "topSubjects": ["Mathematics", "Science"]
  }
}
```

---

### 8. Gamification

Base: `/api/v1/gamification/`

---

#### GET `/streaks/:userId`

Get current streak info.

**Params:** `userId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "currentStreak": 5,
    "longestStreak": 12,
    "lastActiveDate": "2024-06-20",
    "freezeCount": 2,
    "maxFreezes": 3
  }
}
```

---

#### POST `/streaks/:userId/use-freeze`

Use a streak freeze to maintain streak for a missed day.

**Params:** `userId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "freezeCount": 1,
    "remainingFreezes": 2
  }
}
```

**Errors:** 400 (no freezes remaining)

---

#### GET `/daily-challenge/:userId`

Get today's daily challenge.

**Params:** `userId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64dc1...",
    "title": "Speed Round: Algebra",
    "description": "Answer 10 questions in under 5 minutes",
    "questions": 10,
    "timeLimit": 300,
    "difficulty": "medium",
    "completed": false
  }
}
```

---

#### POST `/daily-challenge/:userId/complete`

Mark today's challenge as completed.

**Params:** `userId`

**Request:**
```json
{
  "challengeId": "64dc1a2b3c4d5e6f7a8b9c0d1",
  "score": 8,
  "totalQuestions": 10
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "completed": true,
    "score": 8,
    "xpEarned": 150
  }
}
```

---

#### GET `/daily-challenge/:userId/history`

Get challenge completion history.

**Params:** `userId`

**Query:** `?limit=30`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-06-20",
      "title": "Speed Round: Algebra",
      "score": 8,
      "totalQuestions": 10,
      "completed": true
    }
  ]
}
```

---

#### GET `/badges/:userId`

Get all earned badges for a user.

**Params:** `userId`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64b1...",
      "name": "First Steps",
      "description": "Complete your first session",
      "icon": "star",
      "earnedAt": "2024-01-20T10:00:00.000Z"
    },
    {
      "_id": "64b2...",
      "name": "On Fire",
      "description": "Maintain a 7-day streak",
      "icon": "flame",
      "earnedAt": "2024-06-15T08:30:00.000Z"
    }
  ]
}
```

---

#### POST `/badges/check`

Check and award any newly earned badges.

**Request:**
```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "newBadges": [
      { "name": "Century", "description": "Answer 100 questions" }
    ],
    "totalBadges": 12
  }
}
```

---

#### GET `/leaderboard`

Get global leaderboard.

**Query:** `?limit=50&sort=-score`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "userId": "64f1...",
      "userName": "top_student",
      "image": "https://...",
      "score": 9850,
      "streak": 15
    }
  ]
}
```

---

#### GET `/leaderboard/subject/:subjectId`

Get leaderboard for a specific subject.

**Params:** `subjectId`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "userId": "64f1...",
      "userName": "math_whiz",
      "score": 4200
    }
  ]
}
```

---

#### GET `/goals`

Get current user's daily goal.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "dailyQuestionGoal": 20,
    "todayCompleted": 12,
    "remaining": 8,
    "met": false
  }
}
```

---

#### PUT `/goals`

Update daily goal.

**Request:**
```json
{
  "dailyQuestionGoal": 30
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "dailyQuestionGoal": 30
  }
}
```

---

#### GET `/referral/my-code`

Get user's referral code.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "code": "JOHN2024",
    "referralCount": 3,
    "rewardsEarned": 300
  }
}
```

---

#### POST `/referral/redeem/:code`

Redeem a referral code.

**Params:** `code` — referral code string

**Response (200):**
```json
{
  "success": true,
  "message": "Referral redeemed successfully",
  "data": {
    "xpEarned": 100
  }
}
```

**Errors:** 400 (invalid code), 400 (cannot refer yourself), 409 (already redeemed)

---

### 9. Quiz

Base: `/api/v1/quiz/`

Full lifecycle: create → publish → start → answer → submit → result

---

#### POST `/` — Create Quiz

**Request:**
```json
{
  "title": "Midterm Practice",
  "description": "Covers chapters 1-5",
  "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "subjectId": "64f3a2b3c4d5e6f7a8b9c0d3",
  "chapterIds": ["64c1...", "64c2...", "64c3..."],
  "questionType": "MCQ",
  "difficulty": "medium",
  "timeLimit": 3600,
  "totalQuestions": 20,
  "createdBy": "64f1a2b3c4d5e6f7a8b9c0d1"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "64quiz1...",
    "title": "Midterm Practice",
    "status": "draft"
  }
}
```

---

#### PUT `/:id/publish` — Publish Quiz

Makes quiz available to students.

**Response (200):**
```json
{
  "success": true,
  "data": { "status": "published" }
}
```

---

#### PUT `/:id/close` — Close Quiz

Prevents new attempts.

**Response (200):**
```json
{
  "success": true,
  "data": { "status": "closed" }
}
```

---

#### POST `/:id/clone` — Clone Quiz

Creates a copy of the quiz.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "64quiz2...",
    "title": "Midterm Practice (Copy)",
    "status": "draft"
  }
}
```

---

#### POST `/:id/start` — Start Quiz Attempt

**Request:**
```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "attemptId": "64att1...",
    "quizId": "64quiz1...",
    "questions": [
      {
        "_id": "64q1...",
        "question": "What is 2+2?",
        "options": ["3", "4", "5", "6"]
      }
    ],
    "timeLimit": 3600,
    "startedAt": "2024-06-20T14:00:00.000Z"
  }
}
```

---

#### POST `/:id/answer` — Submit Single Answer

**Request:**
```json
{
  "attemptId": "64att1...",
  "questionId": "64q1...",
  "selectedAnswer": "4"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "correctAnswer": "4"
  }
}
```

---

#### POST `/:id/submit` — Submit Quiz

Finalize attempt.

**Request:**
```json
{
  "attemptId": "64att1..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "score": 16,
    "totalQuestions": 20,
    "percentage": 80,
    "timeTaken": 2400
  }
}
```

---

#### GET `/:id/result` — Get Quiz Result

**Query:** `?attemptId=64att1...`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "quizTitle": "Midterm Practice",
    "score": 16,
    "totalQuestions": 20,
    "percentage": 80,
    "questionResults": [
      {
        "questionId": "64q1...",
        "question": "What is 2+2?",
        "selectedAnswer": "4",
        "correctAnswer": "4",
        "isCorrect": true
      }
    ]
  }
}
```

---

#### GET `/:id/analytics` — Quiz Analytics (Teacher)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalAttempts": 35,
    "averageScore": 72,
    "highestScore": 95,
    "lowestScore": 40,
    "questionAnalytics": [
      {
        "questionId": "64q1...",
        "correctPercentage": 85
      }
    ]
  }
}
```

---

#### POST `/:id/questions` — Add Question to Quiz

**Request:**
```json
{
  "questionId": "64q5a2b3c4d5e6f7a8b9c0d5"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "totalQuestions": 21 }
}
```

---

#### DELETE `/:id/questions/:questionId` — Remove Question

**Response (200):**
```json
{
  "success": true,
  "data": { "totalQuestions": 19 }
}
```

---

### 10. Teacher Dashboard

Base: `/api/v1/teacher/`

**Auth:** Teacher role required.

---

#### GET `/assignments`

Get teacher's assignments.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64as1...",
      "className": "Class 7",
      "subjectName": "Mathematics",
      "assignedStudents": 25,
      "status": "active"
    }
  ]
}
```

---

#### GET `/subject-dashboard`

Get subject-level dashboard.

**Query:** `?subjectId=64f3...`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalStudents": 120,
    "averageAccuracy": 72,
    "topPerformers": [ "..." ],
    "weakTopics": [ "..." ],
    "recentActivity": [ "..." ]
  }
}
```

---

#### GET `/students`

Get list of students in teacher's classes.

**Query:** `?classId=64f1...&page=1&limit=20`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1...",
      "userName": "student1",
      "email": "s1@example.com",
      "accuracy": 78,
      "totalSessions": 15,
      "lastActive": "2024-06-20T14:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "totalPages": 3, "totalItems": 55 }
}
```

---

#### GET `/chapter-analytics`

Get chapter-level analytics.

**Query:** `?chapterId=64c1...`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "chapterName": "Number System",
    "totalStudents": 40,
    "averageAccuracy": 68,
    "topicBreakdown": [
      {
        "topicName": "Natural Numbers",
        "accuracy": 82
      },
      {
        "topicName": "Integers",
        "accuracy": 55
      }
    ]
  }
}
```

---

#### GET `/student-progress/:studentId`

Get detailed progress for a specific student.

**Params:** `studentId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "studentName": "john",
    "overallAccuracy": 75,
    "subjectProgress": [
      {
        "subjectName": "Mathematics",
        "accuracy": 80,
        "chaptersCompleted": 8,
        "totalChapters": 12
      }
    ],
    "recentSessions": [ "..." ]
  }
}
```

---

#### GET `/weak-topics`

Get weak topics across all students.

**Query:** `?classId=64f1...&subjectId=64f3...`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "topicId": "64t1...",
      "topicName": "Integers",
      "chapterName": "Number System",
      "averageAccuracy": 45,
      "studentsAffected": 18
    }
  ]
}
```

---

#### GET `/activity`

Get recent teacher activity feed.

**Query:** `?limit=20`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "type": "quiz_completed",
      "studentName": "john",
      "quizTitle": "Algebra Quiz",
      "score": 85,
      "timestamp": "2024-06-20T14:00:00.000Z"
    }
  ]
}
```

---

### 11. Parent Dashboard

Base: `/api/v1/parent/`

**Auth:** Parent role required.

---

#### GET `/children`

Get list of children linked to parent.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1...",
      "userName": "child1",
      "class": "Class 7",
      "overallAccuracy": 75
    }
  ]
}
```

---

#### GET `/child-overview/:childId`

Get overview for a specific child.

**Params:** `childId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "childName": "child1",
    "class": "Class 7",
    "overallAccuracy": 75,
    "currentStreak": 5,
    "totalSessions": 48,
    "weeklyActivity": [12, 8, 15, 10, 7, 0, 0],
    "recentSessions": [ "..." ]
  }
}
```

---

#### GET `/child-overview/:childId/subject-progress`

Get subject-wise progress for a child.

**Params:** `childId`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "subjectName": "Mathematics",
      "accuracy": 80,
      "chaptersCompleted": 8,
      "totalChapters": 12,
      "weakTopics": ["Integers", "Fractions"]
    }
  ]
}
```

---

#### GET `/child-overview/:childId/weak-topics`

Get weak topics for a child.

**Params:** `childId`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "topicName": "Integers",
      "chapterName": "Number System",
      "accuracy": 45,
      "attempts": 20
    }
  ]
}
```

---

#### GET `/child-overview/:childId/activity`

Get recent activity for a child.

**Params:** `childId`

**Query:** `?limit=20`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "type": "session_completed",
      "subject": "Mathematics",
      "chapter": "Number System",
      "score": 8,
      "totalQuestions": 10,
      "timestamp": "2024-06-20T14:00:00.000Z"
    }
  ]
}
```

---

### 12. Question Paper

Base: `/api/v1/question-paper/`

---

#### POST `/` — Create Question Paper

**Request:**
```json
{
  "title": "Unit Test 1",
  "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "subjectId": "64f3a2b3c4d5e6f7a8b9c0d3",
  "chapterIds": ["64c1...", "64c2..."],
  "totalMarks": 50,
  "duration": 60,
  "sections": [
    {
      "name": "MCQ",
      "questionType": "MCQ",
      "difficulty": "easy",
      "count": 10,
      "marksPerQuestion": 1
    },
    {
      "name": "Short Answer",
      "questionType": "ShortAnswer",
      "difficulty": "medium",
      "count": 5,
      "marksPerQuestion": 3
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "64qp1...",
    "title": "Unit Test 1",
    "status": "draft"
  }
}
```

---

#### POST `/generate-public` — Public AI Generation

Generate a question paper using AI (public endpoint).

**Request:**
```json
{
  "title": "Practice Paper",
  "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "subjectId": "64f3a2b3c4d5e6f7a8b9c0d3",
  "chapterIds": ["64c1...", "64c2..."],
  "totalMarks": 50,
  "duration": 60
}
```

**Response (202):**
```json
{
  "success": true,
  "message": "Question paper generation started",
  "task_id": "task_qp123"
}
```

---

#### GET `/history`

Get question paper history for a teacher.

**Query:** `?page=1&limit=20`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64qp1...",
      "title": "Unit Test 1",
      "createdAt": "2024-06-20T14:00:00.000Z"
    }
  ]
}
```

---

#### GET `/:id/preview`

Preview a question paper.

**Params:** `id`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "title": "Unit Test 1",
    "totalMarks": 50,
    "duration": 60,
    "sections": [
      {
        "name": "MCQ",
        "questions": [
          {
            "question": "What is 2+2?",
            "options": ["3", "4", "5", "6"],
            "correctAnswer": "4",
            "marks": 1
          }
        ]
      }
    ]
  }
}
```

---

#### GET `/:id/download-pdf`

Download question paper as PDF.

**Params:** `id`

**Response:** PDF binary (application/pdf)

---

#### DELETE `/:id`

Delete a question paper.

**Params:** `id`

**Response (200):**
```json
{
  "success": true,
  "message": "Question paper deleted"
}
```

---

### 13. School & Sections

Base: `/api/v1/school/`

**Auth:** Admin role required for school CRUD.

---

#### POST `/` — Create School

**Request:**
```json
{
  "name": "Springfield Academy",
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "contactEmail": "admin@springfield.edu"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "64sch1...",
    "name": "Springfield Academy"
  }
}
```

---

#### GET `/` — List Schools

**Response (200):**
```json
{
  "success": true,
  "data": [ { "_id": "64sch1...", "name": "Springfield Academy" } ]
}
```

---

#### GET `/:id` — Get School

**Params:** `id`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64sch1...",
    "name": "Springfield Academy",
    "sections": [ "..." ]
  }
}
```

---

#### PUT `/:id` — Update School

**Params:** `id`

**Request:**
```json
{
  "name": "Springfield Academy Updated"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "..." : "updated school" }
}
```

---

#### DELETE `/:id` — Delete School

**Params:** `id`

**Response (200):**
```json
{
  "success": true,
  "message": "School deleted"
}
```

---

#### POST `/:schoolId/sections` — Create Section

**Params:** `schoolId`

**Request:**
```json
{
  "name": "7-A",
  "classId": "64f1a2b3c4d5e6f7a8b9c0d2"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "64sec1...",
    "name": "7-A",
    "schoolId": "64sch1...",
    "classId": "64f1..."
  }
}
```

---

#### GET `/:schoolId/sections` — List Sections

**Params:** `schoolId`

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "_id": "64sec1...", "name": "7-A" },
    { "_id": "64sec2...", "name": "7-B" }
  ]
}
```

---

#### GET `/:schoolId/sections/:sectionId` — Get Section

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64sec1...",
    "name": "7-A",
    "students": 35,
    "classId": "64f1..."
  }
}
```

---

#### PUT `/:schoolId/sections/:sectionId` — Update Section

**Request:**
```json
{
  "name": "7-A (Updated)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "..." : "updated section" }
}
```

---

#### DELETE `/:schoolId/sections/:sectionId` — Delete Section

**Response (200):**
```json
{
  "success": true,
  "message": "Section deleted"
}
```

---

### 14. AI Assistant

Base: `/api/v1/ai-assistant/`

**Auth:** Teacher/Admin role required.

---

#### POST `/` — Generate Content

Generate teaching content via AI.

**Request:**
```json
{
  "prompt": "Create a worksheet on fractions for Class 7",
  "responses": [],
  "sessionId": "optional-session-id",
  "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "subjectId": "64f3a2b3c4d5e6f7a8b9c0d3"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "response": "Here is a worksheet on fractions...",
    "suggestions": [
      "Add visual fraction models",
      "Include word problems"
    ],
    "sessionId": "64ais1..."
  }
}
```

---

#### POST `/continue` — Continue Clarification

Continue a multi-turn clarification conversation.

**Request:**
```json
{
  "sessionId": "64ais1...",
  "message": "Make it more challenging for advanced students"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "response": "Updated worksheet with advanced problems...",
    "sessionId": "64ais1..."
  }
}
```

---

#### GET `/classes` — Get Teacher's Classes

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "_id": "64f1...", "name": "Class 7" },
    { "_id": "64f2...", "name": "Class 8" }
  ]
}
```

---

#### GET `/tasks` — Available AI Tasks

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "worksheet", "name": "Generate Worksheet" },
    { "id": "quiz", "name": "Create Quiz" },
    { "id": "lesson-plan", "name": "Lesson Plan" },
    { "id": "explanation", "name": "Topic Explanation" }
  ]
}
```

---

#### GET `/health` — AI Assistant Health Check

**Response (200):**
```json
{
  "success": true,
  "status": "healthy",
  "llmProvider": "openrouter"
}
```

---

### 15. Supporting

Base: `/api/v1/`

---

#### GET `/feedback`

Get feedback list.

**Response (200):**
```json
{
  "success": true,
  "data": [ "..." ]
}
```

---

#### POST `/feedback`

Submit feedback.

**Request:**
```json
{
  "type": "bug",
  "message": "The quiz timer resets on page reload",
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Feedback submitted"
}
```

---

#### GET `/logs`

Get system logs (Admin only).

**Response (200):**
```json
{
  "success": true,
  "data": [ "..." ]
}
```

---

#### GET `/stats/public`

Get public platform stats.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 12500,
    "totalSessions": 98000,
    "totalQuestions": 45000,
    "activeToday": 350
  }
}
```

---

### 16. Inline Feedback

Base: `/api/v1/inline-feedback/`

---

#### POST `/`

Submit inline feedback (thumbs up/down with optional context).

**Request:**
```json
{
  "feature": "question-generation",
  "reaction": "thumbs_up",
  "context": {
    "questionId": "64f1...",
    "type": "mcq",
    "difficulty": "hard"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Feedback recorded"
}
```

**Errors:** 429 (rate limited — 10/min)

---

#### GET `/sentiment/:feature`

Get sentiment breakdown for a feature (Teacher/Principal).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "feature": "question-generation",
    "thumbs_up": 142,
    "thumbs_down": 18,
    "total": 160
  }
}
```

---

#### GET `/sentiment`

Get sentiment across all features (SuperAdmin).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "question-generation": { "thumbs_up": 142, "thumbs_down": 18 },
    "ai-agent": { "thumbs_up": 89, "thumbs_down": 5 }
  }
}
```

---

### 17. Behavioral Prompt

Base: `/api/v1/behavioral-prompt/`

---

#### GET `/check`

Check if user should receive a behavioral prompt. Returns signal score and reason.

**Response (200):**
```json
{
  "success": true,
  "shouldPrompt": true,
  "signalScore": 0.72,
  "reason": "rapid_skipping"
}
```

---

#### POST `/dismiss`

Record that a behavioral prompt was dismissed.

**Request:**
```json
{
  "promptId": "64f1..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Dismissal recorded"
}
```

---

### 18. Suggestions / Feature Requests

Base: `/api/v1/suggestions/`

---

#### POST `/`

Submit a feature request.

**Request:**
```json
{
  "title": "Dark mode",
  "description": "Add a dark mode toggle",
  "category": "ui"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "64f1...",
    "title": "Dark mode",
    "upvotes": 0,
    "status": "new"
  }
}
```

---

#### POST `/:id/upvote`

Toggle upvote on a suggestion.

**Response (200):**
```json
{
  "success": true,
  "upvoted": true
}
```

---

#### GET `/`

List suggestions (paginated, filterable).

**Query params:** `?status=new&category=ui&page=1&limit=20`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1...",
      "title": "Dark mode",
      "description": "Add a dark mode toggle",
      "category": "ui",
      "status": "planned",
      "upvotes": 12,
      "upvotedByMe": false
    }
  ],
  "total": 45,
  "page": 1
}
```

---

#### GET `/mine`

Get the current user's own suggestions.

**Response (200):**
```json
{
  "success": true,
  "data": [ ... ]
}
```

---

### 19. Admin Metrics

Base: `/api/v1/admin/metrics/`

All endpoints require **SuperAdmin** role.

---

#### GET `/overview`

Platform-wide summary stats.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 12500,
    "totalSchools": 48,
    "totalQuestions": 45000,
    "activeToday": 350,
    "paidUsers": 2100
  }
}
```

---

#### GET `/users`

User growth metrics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 12500,
    "newToday": 42,
    "newThisWeek": 280,
    "byAccountType": {
      "Student": 10000,
      "Teacher": 1800,
      "Parent": 700
    }
  }
}
```

---

#### GET `/content`

Content metrics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalClasses": 12,
    "totalSubjects": 48,
    "totalChapters": 240,
    "totalTopics": 1800,
    "chaptersWithDocuments": 180
  }
}
```

---

#### GET `/engagement`

Engagement metrics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "avgSessionsPerUser": 8.5,
    "avgTimePerSession": 480,
    "retentionDay7": 0.42,
    "retentionDay30": 0.28
  }
}
```

---

#### GET `/feedback-insights`

Feedback sentiment insights.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overallNPS": 42,
    "featureSentiments": {
      "question-generation": { "positive": 0.88, "negative": 0.12 },
      "ai-agent": { "positive": 0.94, "negative": 0.06 }
    }
  }
}
```

---

## AI Service API

Base: `http://localhost:8000`

All AI Service endpoints are **internal only** — called by the Backend, not the Frontend directly.

> **Integration legend:** `✅` = Backend caller exists (fully wired). `⚠️` = documented but no Backend caller (gap).

---

### 1. Document Management

---

#### POST `/upload-document`

Async PDF ingestion into vector DB (Qdrant). Returns task ID for polling.

**Request (multipart/form-data):**
| Field | Type | Required |
|-------|------|----------|
| `file` | PDF file | Yes |
| `chapter_id` | String | Yes |
| `class_id` | String | Yes |
| `subject_id` | String | Yes |

**Response (202):**
```json
{
  "task_id": "task_abc123def456",
  "status": "processing",
  "message": "Document ingestion started"
}
```

**Poll status with:** `GET /upload-status/{task_id}`

> ⚠️ **Integration gap:** Backend never polls this endpoint — treats any 202 as success without checking actual completion.

---

#### GET `/upload-status/{task_id}`

Poll upload processing status.

**Params:** `task_id`

**Response (200, processing):**
```json
{
  "task_id": "task_abc123def456",
  "status": "processing",
  "progress": 45
}
```

**Response (200, completed):**
```json
{
  "task_id": "task_abc123def456",
  "status": "completed",
  "chunks_indexed": 156,
  "collection_name": "class7_maths_chapter1"
}
```

**Response (200, failed):**
```json
{
  "task_id": "task_abc123def456",
  "status": "failed",
  "error": "Failed to extract text from PDF"
}
```

> ⚠️ **Integration gap:** Backend never calls this endpoint — treats any 202 as success.

---

#### POST `/delete-document`

Remove document from Qdrant vector DB.

✅ **Integration:** Backend calls this from `content.service.js` on chapter delete.

**Request:**
```json
{
  "chapter_id": "64c1a2b3c4d5e6f7a8b9c0d1"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Document deleted from vector DB",
  "points_removed": 156
}
```

---

#### POST `/search-documents/batch`

Batch check if multiple chapters have indexed documents.

> ⚠️ **Integration gap:** No Backend caller exists. The Backend calls individual `/search-document` in a loop instead.

**Request:**
```json
[
  { "class_id": "64f1...", "subject_id": "64f3...", "chapter_id": "64c1..." },
  { "class_id": "64f1...", "subject_id": "64f3...", "chapter_id": "64c2..." }
]
```

**Response (200):**
```json
{
  "results": [
    { "found": true, "metadata": { "chapter_id": "64c1...", "points_count": 156 } },
    { "found": false, "metadata": { "chapter_id": "64c2..." } }
  ]
}
```

---

#### POST `/search-document`

Check if a document is indexed.

**Request:**
```json
{
  "chapter_id": "64c1a2b3c4d5e6f7a8b9c0d1"
}
```

**Response (200):**
```json
{
  "indexed": true,
  "points_count": 156,
  "collection_name": "class7_maths_chapter1"
}
```

---

### 2. Search & RAG

---

#### POST `/query`

RAG-based semantic search across indexed documents.

> ⚠️ **Integration gap:** No Backend caller exists. This endpoint provides the core "Ask AI about chapter content" capability but is not wired through the stack. To use it, create a Backend route + service that proxies to this endpoint.

**Request:**
```json
{
  "query": "Explain the properties of integers",
  "class_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "subject_id": "64f3a2b3c4d5e6f7a8b9c0d3",
  "chapter_ids": ["64c1a2b3c4d5e6f7a8b9c0d1"]
}
```

**Response (200):**
```json
{
  "results": [
    {
      "content": "Integers are whole numbers that can be positive, negative, or zero...",
      "score": 0.92,
      "metadata": {
        "chapter_id": "64c1...",
        "page": 12,
        "section": "3.2 Properties of Integers"
      }
    }
  ],
  "answer": "Integers have several key properties including closure, commutative, and associative properties...",
  "sources": [
    {
      "chapter": "Number System",
      "page": 12,
      "relevance": 0.92
    }
  ]
}
```

---

#### POST `/generate-questions`

AI-powered question generation.

**Request:**
```json
{
  "chapter_id": "64c1a2b3c4d5e6f7a8b9c0d1",
  "class_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "subject_id": "64f3a2b3c4d5e6f7a8b9c0d3",
  "question_type": "MCQ",
  "difficulty": "medium",
  "count": 10,
  "topics": ["Natural Numbers", "Integers"]
}
```

**Response (200):**
```json
{
  "questions": [
    {
      "question": "Which of the following is an integer?",
      "options": ["2.5", "-3", "√2", "3/4"],
      "correctAnswer": "-3",
      "explanation": "Integers include positive and negative whole numbers...",
      "topic": "Integers",
      "difficulty": "medium"
    }
  ],
  "generated_count": 10,
  "model_used": "openrouter/meta-llama/llama-3-8b-instruct"
}
```

---

### 3. AI Insights

---

#### GET `/ai-insights/chapter`

Generate chapter-level learning insights.

**Query:** `?user_id=64f1...&chapter_id=64c1...`

**Response (200):**
```json
{
  "insights": {
    "summary": "Strong performance in basic concepts but struggles with advanced topics.",
    "strengths": ["Number recognition", "Basic operations"],
    "weaknesses": ["Negative numbers", "Word problems"],
    "recommendations": [
      "Focus on integer operations with visual aids",
      "Practice real-world application problems"
    ],
    "confidence": 0.87
  }
}
```

---

#### GET `/ai-insights/subject`

Generate subject-level learning insights.

**Query:** `?user_id=64f1...&subject_id=64f3...`

**Response (200):**
```json
{
  "insights": {
    "overallLevel": "Intermediate",
    "masteryPercentage": 65,
    "chapterBreakdown": [
      {
        "chapterName": "Number System",
        "mastery": 80,
        "status": "proficient"
      },
      {
        "chapterName": "Algebra",
        "mastery": 45,
        "status": "learning"
      }
    ],
    "nextSteps": [
      "Complete algebra fundamentals",
      "Review fraction operations"
    ]
  }
}
```

---

#### GET `/ai-insights/teacher/class`

Generate teacher-specific class insights.

**Query:** `?teacher_id=64f1...&class_id=64f2...&subject_id=64f3...`

**Response (200):**
```json
{
  "insights": {
    "classAverage": 72,
    "topPerformers": [ "..." ],
    "strugglingStudents": [ "..." ],
    "weakTopics": [
      {
        "topicName": "Integers",
        "classAverage": 45,
        "recommendation": "Review negative number concepts with visual aids"
      }
    ],
    "suggestedActions": [
      "Conduct remedial session on integers",
      "Assign practice worksheets for fractions"
    ]
  }
}
```

---

### 4. AI Agent

---

#### POST `/ai-agent`

AI content generation agent.

**Request:**
```json
{
  "prompt": "Explain photosynthesis in simple terms for Class 7 students",
  "task_type": "explanation",
  "class_id": "64f1a2b3c4d5e6f7a8b9c0d2",
  "subject_id": "64f4a2b3c4d5e6f7a8b9c0d4"
}
```

**Response (200):**
```json
{
  "response": "Photosynthesis is how plants make their own food...",
  "suggestions": [
    "Add diagrams for visual learners",
    "Include real-world examples"
  ],
  "model_used": "openrouter/meta-llama/llama-3-8b-instruct"
}
```

---

#### GET `/ai-agent/classes`

Get available classes for AI agent.

**Response (200):**
```json
{
  "classes": [
    { "_id": "64f1...", "name": "Class 6" },
    { "_id": "64f2...", "name": "Class 7" }
  ]
}
```

---

#### GET `/ai-agent/tasks`

Get available task types.

**Response (200):**
```json
{
  "tasks": [
    { "id": "explanation", "name": "Topic Explanation" },
    { "id": "worksheet", "name": "Generate Worksheet" },
    { "id": "quiz", "name": "Create Quiz" },
    { "id": "lesson-plan", "name": "Lesson Plan" }
  ]
}
```

---

#### GET `/ai-agent/health`

AI agent health check.

**Response (200):**
```json
{
  "status": "healthy",
  "llm_provider": "openrouter",
  "model": "meta-llama/llama-3-8b-instruct"
}
```

---

#### POST `/ai-agent/stream`

Streaming AI content generation (SSE, token-by-token).

✅ **Integration:** Backend proxies this from `ai-assistant.service.js` → `POST /api/v1/ai-assistant/stream`.

**Request:**
```json
{
  "teacher_id": "64f1...",
  "prompt": "Generate a quiz on fractions",
  "session_id": "optional-session-id",
  "class_id": "64f1...",
  "subject_id": "64f3..."
}
```

**Response:** SSE stream of token-by-token content.

---

#### GET `/ai-agent/chapters`

Get chapters available to a teacher, optionally filtered by subject.

✅ **Integration:** Backend proxies this from `ai-assistant.service.js` → `GET /api/v1/ai-assistant/classes` (populates the chapter picker).

**Query params:** `teacher_id`, `subject_id?`

**Response (200):**
```json
{
  "chapters": [
    {
      "chapter_id": "64c1...",
      "chapter_name": "Newton's Laws",
      "has_rag_content": true,
      "class_name": "Class 9",
      "subject_name": "Physics"
    }
  ]
}
```

---

#### POST `/ai-agent/modify`

Modify a previously generated piece of content. Re-executes the original task with merged parameters.

✅ **Integration:** Backend proxies this from `ai-assistant.service.js` → `POST /api/v1/ai-assistant/modify` (not yet exposed as a Frontend-facing route).

**Request:**
```json
{
  "teacher_id": "64f1...",
  "generation_id": "abc123def456",
  "difficulty": "hard",
  "num_questions": 15,
  "question_type": "MCQ"
}
```

**Response:** Same `AgentResponse` shape as `/ai-agent`, with a new `generation_id`.

---

#### GET `/ai-agent/history`

Retrieve past generations for a teacher, newest first. Paginated.

✅ **Integration:** Backend proxies this from `ai-assistant.service.js` → `GET /api/v1/ai-assistant/history` (not yet exposed as a Frontend-facing route).

**Query params:** `teacher_id`, `limit` (default 20), `offset` (default 0)

**Response (200):**
```json
{
  "generations": [
    {
      "generation_id": "abc...",
      "task_type": "quiz",
      "difficulty": "medium",
      "created_at": "2026-06-01T12:00:00Z"
    }
  ]
}
```

---

#### GET `/ai-agent/generation/{generation_id}`

Get a single generation by ID.

✅ **Integration:** Backend proxies this from `ai-assistant.service.js` → `GET /api/v1/ai-assistant/export/:generationId`.

**Response (200):**
```json
{
  "generation": {
    "generation_id": "abc...",
    "task_type": "quiz",
    "content": { ... },
    "metadata": { ... }
  }
}
```

---

### 5. Topic Management

---

#### POST `/regenerate-topics`

Regenerate topic breakdown for a chapter using AI.

> ⚠️ **Integration gap:** No Backend caller exists. This endpoint is only accessible directly (not through the proxy stack).

**Request:**
```json
{
  "chapter_id": "64c1a2b3c4d5e6f7a8b9c0d1",
  "chapter_title": "Number System"
}
```

**Response (200):**
```json
{
  "topics": [
    { "title": "Natural Numbers", "description": "Counting numbers from 1 onwards" },
    { "title": "Whole Numbers", "description": "Natural numbers including zero" },
    { "title": "Integers", "description": "Positive and negative whole numbers" }
  ]
}
```

---

#### POST `/sync-chapter-topics`

Sync topics from AI service to the backend database.

> ⚠️ **Integration gap:** No Backend caller exists. This is a manual recovery tool for backfilling topics from Qdrant into MongoDB.

**Request:**
```json
{
  "chapter_id": "64c1a2b3c4d5e6f7a8b9c0d1",
  "class_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "subject_id": "64f3a2b3c4d5e6f7a8b9c0d3"
}
```

**Response (200):**
```json
{
  "success": true,
  "synced_topics": 5,
  "message": "Topics synced successfully"
}
```

---

### 6. Health & Monitoring

---

#### GET `/ping`

Keep-alive endpoint. Exempt from auth and rate limiting.

**Response (200):**
```json
{
  "status": "alive"
}
```

---

#### GET `/health`

General health check.

**Response (200):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 86400
}
```

---

#### GET `/health/live`

Liveness probe (for k8s/Docker).

**Response (200):**
```json
{
  "status": "alive"
}
```

---

#### GET `/health/ready`

Readiness probe.

**Response (200):**
```json
{
  "status": "ready",
  "dependencies": {
    "qdrant": "connected",
    "redis": "connected",
    "mongodb": "connected"
  }
}
```

---

#### GET `/metrics`

Service metrics (Prometheus format).

**Response (200):**
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="POST",endpoint="/query"} 1520
...
```

---

## Error Codes

### Backend Error Responses

| Code | Meaning |
|------|---------|
| `400` | Bad Request — missing or invalid fields |
| `401` | Unauthorized — invalid/missing JWT token |
| `403` | Forbidden — insufficient role permissions |
| `404` | Not Found — resource does not exist |
| `409` | Conflict — duplicate entry (email, code, etc.) |
| `413` | Payload Too Large — file exceeds limit |
| `422` | Unprocessable Entity — validation error |
| `429` | Too Many Requests — rate limit exceeded |
| `500` | Internal Server Error |
| `502` | Bad Gateway — AI Service error (proxied) |
| `504` | Gateway Timeout — AI Service timeout |

### AI Service Error Responses

| Code | Meaning |
|------|---------|
| `400` | Bad Request — missing or invalid parameters |
| `404` | Not Found — task/document not found |
| `422` | Unprocessable Entity — processing failed |
| `500` | Internal Server Error — LLM/embedding failure |
| `502` | Bad Gateway — upstream provider error (OpenRouter, etc.) |
| `503` | Service Unavailable — Qdrant/Redis/MongoDB down |
| `504` | Gateway Timeout — upstream provider timed out |

### Error Response Format

```json
{
  "success": false,
  "error": "Validation failed",
  "message": "email is required",
  "statusCode": 400
}
```

---

## Rate Limits

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| Authentication (`/authenticate/*`) | 10 req | 15 min |
| AI generation (`/ai-assistant/*`) | 30 req | 1 hour |
| File uploads (`/chapters/create-with-pdf`) | 10 req | 1 hour |
| Quiz start | 5 req | 1 hour |
| General API | 100 req | 15 min |

Rate limit headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1718901600
```

---

## Appendix: Data Models

### User
```typescript
{
  _id: string;
  userName: string;
  email: string;
  accountType: "Student" | "Teacher" | "Admin" | "Parent";
  image?: string;
  class?: string;          // Class ObjectId
  createdAt: Date;
  updatedAt: Date;
}
```

### Session
```typescript
{
  _id: string;
  userId: string;
  classId: string;
  subject: string;
  chapter: string;
  questionType: "MCQ" | "TrueFalse" | "ShortAnswer";
  difficulty: "easy" | "medium" | "hard";
  status: "in-progress" | "completed" | "abandoned";
  score: number;
  totalQuestions: number;
  createdAt: Date;
  completedAt?: Date;
}
```

### Question
```typescript
{
  _id: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  questionType: "MCQ" | "TrueFalse" | "ShortAnswer";
  difficulty: "easy" | "medium" | "hard";
  topicId: string;
  chapterId: string;
  classId: string;
  subjectId: string;
}
```

### UserAnswer
```typescript
{
  _id: string;
  sessionId: string;
  userId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeTaken: number;       // seconds
  createdAt: Date;
}
```

### Quiz
```typescript
{
  _id: string;
  title: string;
  description?: string;
  classId: string;
  subjectId: string;
  chapterIds: string[];
  questionType: string;
  difficulty: string;
  timeLimit: number;       // seconds
  totalQuestions: number;
  createdBy: string;
  status: "draft" | "published" | "closed";
  createdAt: Date;
}
```

### Chapter
```typescript
{
  _id: string;
  title: string;
  classId: string;
  subjectId: string;
  indexed: boolean;        // has PDF in vector DB
  createdAt: Date;
}
```

### Topic
```typescript
{
  _id: string;
  title: string;
  chapterId: string;
  classId: string;
  subjectId: string;
  createdAt: Date;
}
```
