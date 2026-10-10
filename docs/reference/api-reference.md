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
  - [Inline Feedback](#16-inline-feedback)
  - [Behavioral Prompt](#17-behavioral-prompt)
  - [Suggestions / Feature Requests](#18-suggestions--feature-requests)
  - [Admin Metrics](#19-admin-metrics)
  - [AI System (LLM)](#20-ai-system-llm)
  - [Challenges](#21-challenges)
  - [Teacher Class Links](#22-teacher-class-links)
  - [Notifications](#23-notifications)
- [AI Service API (`/`)](#ai-service-api)
  - [Document Management](#1-document-management)
  - [Search & RAG](#2-search--rag)
  - [AI Insights](#3-ai-insights)
  - [AI Agent](#4-ai-agent)
  - [Topic Management](#5-topic-management)
  - [Health & Monitoring](#6-health--monitoring)
  - [Admin LLM](#7-admin-llm)
- [Error Codes](#error-codes)
- [Rate Limits](#rate-limits)
- [Appendix: Data Models](#appendix-data-models)

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
  "success": true,
  "message": "Human-readable message",
  "data": { ... }
}
```

Errors use `{ "success": false, "message": "...", "code": "ERROR_CODE" }` (see [Error Response Format](#error-response-format)). Exceptions: `POST /authenticate/login`, `/signup`, `/google` and `/refresh` return `tokens` and `user` at the top level instead of under `data`, and the leaderboard endpoints return `{ success, data }` without a `message`.

---

## Authentication

### JWT Token

- Obtained via `POST /authenticate/login`, `POST /authenticate/signup` or `POST /authenticate/google`
- Accepted via Cookie (`token=<jwt>`), Header (`Authorization: Bearer <jwt>`), or Body (`{ token }`)
- **accessToken** expires after 2 hours; **refreshToken** expires after 7 days
- Refresh tokens are **single-use**: `POST /authenticate/refresh` claims the old token atomically and returns a new pair, so a second refresh with the same token fails with `401`
- Admin-protected endpoints require `accountType: "SuperAdmin"`

### Role-Based Access

| Role | Access Level |
|------|-------------|
| `Student` | Own data, practice sessions, quizzes, challenges, referrals |
| `Teacher` | Teacher dashboard, quizzes, question papers, AI assistant, class join links |
| `Principal` | School-scoped dashboards, school, section and teacher management |
| `Parent` | Linked children's data and progress overview |
| `SuperAdmin` | Full access; passes every role guard |

---

## Backend API

### 1. Authentication

Base: `/api/v1/authenticate/`

---

#### POST `/login`

Login with username (or email) and password.

**Rate limit:** 10 per 15 minutes (shared with `/google`).

**Request:**
```json
{
  "userName": "john",
  "password": "secret123"
}
```

`userName` accepts either the username or the email address.

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "2h"
  },
  "user": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "userName": "john",
    "name": "John Doe",
    "email": "user@example.com",
    "accountType": "Student",
    "image": "https://..."
  }
}
```

**Errors:** 400 (missing fields, user does not exist), 401 (invalid credentials), 429 (too many attempts)

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

Register a new user. The new account is signed in straight away (tokens are returned).

**Rate limit:** 10 per hour.

**Request:**
```json
{
  "userName": "john",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Secret123",
  "confirmPassword": "Secret123",
  "accountType": "Student",
  "referralCode": "K7QM2P",
  "acquisition": {
    "source": "referral",
    "ref": "K7QM2P",
    "utmSource": "whatsapp",
    "landingPath": "/signup",
    "firstSeenAt": "2026-10-09T10:15:00.000Z"
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `userName` | Yes | 3–50 characters, unique |
| `name` | Yes | 2–100 characters |
| `email` | Yes | Valid email, unique |
| `password` | Yes | 8–128 characters, see requirements below |
| `confirmPassword` | Yes | Must equal `password` |
| `accountType` | Send it | `Student`, `Teacher` (teacher self-signup), `Parent` or `Principal` (Principal accounts wait for approval). Optional in request validation, but the account has no default type, so a signup without it fails |
| `contactNumber` | No | 10–15 characters: digits, spaces, `-`, optional leading `+` |
| `referralCode` | No | A friend's invite code (max 10 chars). Credits the new account to that friend |
| `acquisition` | No | First-touch attribution (`UserAcquisition`): `source` (`referral` \| `challenge` \| `class` \| `organic`), `ref`, `utmSource`, `utmMedium`, `utmCampaign`, `landingPath`, `firstSeenAt`. All optional |

**Password requirements:**
- Minimum 8 characters
- Must include at least one letter and one number (any other characters allowed)

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "user": { "_id": "64f1a2b3c4d5e6f7a8b9c0d1", "userName": "john", "accountType": "Student", "...": "..." },
  "referral": { "attributed": true, "referrerName": "Riya" }
}
```

`referral` is `null` when no `referralCode` was sent. A bad or stale code **never fails signup**: it comes back as `{ "attributed": false, "reason": "INVALID_CODE" }` (other reasons: `MISSING`, `SELF`, `USER_NOT_FOUND`, `NOT_NEW`, `ALREADY_REFERRED`).

**Errors:** 400 (validation failed, `USERNAME_TAKEN`, `EMAIL_TAKEN`), 429 (too many attempts)

---

#### POST `/google`

Sign in, or sign up, with a Google ID token. The Backend verifies the token with Google, then finds the account by Google ID, else links it by email, else creates a new account.

**Rate limit:** 10 per 15 minutes (shared with `/login`).

**Request:**
```json
{
  "idToken": "<Google ID token>",
  "accountType": "Teacher",
  "referralCode": "K7QM2P",
  "acquisition": { "source": "referral", "ref": "K7QM2P" }
}
```

`accountType` (`Student` | `Teacher`), `referralCode` and `acquisition` are optional and are used **only when this call creates the account**. A new account is a `Teacher` when `accountType: "Teacher"` is sent (teacher Google signup), otherwise a `Student`.

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "2h"
  },
  "user": { "_id": "64f1a2b3c4d5e6f7a8b9c0d1", "accountType": "Teacher", "...": "..." },
  "isNewUser": true,
  "referral": { "attributed": true, "referrerName": "Riya" }
}
```

`referral` follows the same rules as `/signup` and is `null` for an existing account or when no code was sent.

**Errors:** 400 (`GOOGLE_NO_EMAIL`, `GOOGLE_EMAIL_UNVERIFIED`), 401 (`INVALID_GOOGLE_TOKEN`), 429 (too many attempts), 500 (`GOOGLE_NOT_CONFIGURED`)

---

#### POST `/refresh`

Exchange a refresh token for a new access + refresh token pair. Refresh tokens are **single-use**: the old token is claimed and revoked in one atomic step, so if two requests send the same token at the same moment only one gets new tokens.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "2h"
  }
}
```

**Errors:** 401 (`INVALID_REFRESH_TOKEN`, `REFRESH_TOKEN_REVOKED` — already used or logged out, `REFRESH_TOKEN_EXPIRED`, `USER_NOT_FOUND`)

> **Client note:** with several tabs open, refresh once and share the result. The web app takes a cross-tab lock before refreshing and reuses tokens another tab has just saved, so tabs never race with the same refresh token.

---

#### POST `/logout`

Revoke a refresh token. The access token stays valid until it expires.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

#### POST `/changepassword`

Change password for logged-in user. Revokes all of the user's refresh tokens.

**Request:**
```json
{
  "oldPassword": "OldSecret123",
  "newPassword": "NewSecret456",
  "confirmPassword": "NewSecret456"
}
```

**Password requirements** (same as signup): minimum 8 characters, with at least one letter and one number.

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

Reset password with token from email. Revokes all of the user's refresh tokens.

**Rate limit:** 5 per 15 minutes (shared with `/reset-password-token`).

**Request:**
```json
{
  "token": "abc123def456",
  "newPassword": "NewSecret456",
  "confirmPassword": "NewSecret456"
}
```

**Password requirements** (same as signup): minimum 8 characters, with at least one letter and one number.

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

#### PUT `/name`

Change the display name. No verification is needed, because the name is not used to sign in. Extra spaces are collapsed.

**Request:**
```json
{
  "name": "Aarav Sharma"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Name updated",
  "data": { "name": "Aarav Sharma" }
}
```

**Errors:** 400 (name not 2–100 characters)

---

#### POST `/email/request-change`

Start changing the login email. A 6-digit code is emailed to the **new** address; nothing on the account changes until the code is confirmed. The code is valid for 10 minutes.

**Rate limit:** 10 per 15 minutes (shared with `/email/confirm-change`), and at most one code per 60 seconds.

**Request:**
```json
{
  "email": "new.address@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "We sent a 6-digit code to new.address@example.com",
  "data": {
    "newEmail": "new.address@example.com",
    "expiresInMinutes": 10
  }
}
```

**Errors:** 400 (`SAME_EMAIL`), 409 (`EMAIL_TAKEN` — another account uses it), 429 (`CODE_TOO_SOON` — within 60 s of the last code), 502 (`EMAIL_SEND_FAILED` — the code could not be sent; nothing was saved)

---

#### POST `/email/confirm-change`

Finish the change with the code sent to the new address. The login email switches and the old address gets a notice.

**Request:**
```json
{
  "code": "482915"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email updated",
  "data": { "email": "new.address@example.com" }
}
```

**Errors:** 400 (`WRONG_CODE` — the message says how many tries are left; `CODE_EXPIRED` — expired or no pending change), 409 (`EMAIL_TAKEN` — taken in the meantime), 429 (`TOO_MANY_ATTEMPTS` — 5 wrong codes; request a new code)

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

Use `POST /chapters/check-rag-status` or `GET /v1/upload-status/{task_id}` to poll processing status.

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

#### GET `/questions/public-preview/class/:classSlug/subject/:subjectSlug/chapter/:chapterSlug`

**No auth.** Powers the prerendered public chapter pages (SEO). Resolves the class/subject/chapter slugs to a chapter and returns a deterministic, limited preview of questions **including explanations**. Always returns `200` — chapters with no question bank yet return an empty `questions` array.

**Params:** `classSlug` (e.g. `10th`), `subjectSlug` (e.g. `mathematics`), `chapterSlug` (e.g. `real-numbers`)

**Query:** `?limit=12` (default 12, min 1, max 20)

**Response (200):**
```json
{
  "success": true,
  "message": "Public chapter preview fetched successfully",
  "data": {
    "chapterId": "64c1...",
    "chapterName": "Real Numbers",
    "totalAvailable": 42,
    "questions": [
      {
        "questionText": "What is the HCF of 12 and 18?",
        "options": ["2", "3", "4", "6"],
        "correctAnswer": "6",
        "explanation": "...",
        "questionType": "MCQ",
        "difficulty": "medium"
      }
    ]
  }
}
```

---

#### POST `/questions/generate/chapter/:chapterId`

**Auth: Teacher/Admin.** Fire-and-forget trigger from the admin panel to generate questions for a chapter (MCQ × Easy/Medium/Hard) in the background. Requires the chapter to already have topics.

**Params:** `chapterId` — MongoDB ObjectId

**Response (200):** generation started (or already running). Returns `409` if the chapter has no topics yet.

---

#### POST `/questions/counts`

**Auth: Teacher/Admin.** Returns a map of `chapterId → question count` for a set of chapters — used by the admin chapter list.

**Request:**
```json
{ "chapterIds": ["64c1...", "64c2..."] }
```

**Response (200):**
```json
{
  "success": true,
  "message": "Question counts fetched successfully",
  "data": { "64c1...": 42, "64c2...": 0 }
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

Base: `/api/v1/` — there is no single gamification prefix; each path below is the full path under `/api/v1` (`/streaks`, `/daily-challenge`, `/badges`, `/leaderboard`, `/goals`, `/referral`). All require auth.

---

#### GET `/streaks/:userId`

Get current streak info.

**Params:** `userId`

**Response (200):**
```json
{
  "success": true,
  "message": "Streak data fetched successfully",
  "data": {
    "currentStreak": 5,
    "longestStreak": 12,
    "lastPracticeDate": "2026-10-09",
    "totalPracticeDays": 23,
    "streakFreezes": {
      "available": 2,
      "total": 1,
      "bonus": 1,
      "resetsOn": "2026-10-12T18:30:00.000Z"
    },
    "practiceDates": ["2026-10-05", "2026-10-06", "2026-10-09"],
    "practicedToday": false
  }
}
```

`streakFreezes.total` is the free weekly freeze allowance (reset every Monday); `bonus` counts earned freezes ("streak shields" from referral gifts), which never reset and are spent only after the weekly one. `available` = unused weekly freezes + `bonus`.

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

Top 10 learners of **this week**, counted from Monday 00:00 IST, so a student who joined today can still catch up. Ranked by correct answers (each question counted once per student). Names are first names only. No query parameters.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Aarav",
      "totalScore": 42,
      "totalQuestions": 50,
      "accuracy": 84
    }
  ]
}
```

The array is already sorted (rank = position). `totalScore` is correct answers this week, `totalQuestions` distinct questions answered this week, `accuracy` a percentage.

---

#### GET `/leaderboard/subject/:subjectId`

Top 10 for one subject, **all-time**.

**Params:** `subjectId`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
      "totalScore": 120,
      "totalQuestions": 150,
      "accuracy": 80
    }
  ]
}
```

**Errors:** 400 (missing subject ID)

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

#### Referral rewards — how they work

- Every user has a 6-character invite code (`A–Z` and `2–9`, without look-alike characters). The invite link is `{FRONTEND_URL}/signup?ref=CODE`.
- A new account is credited to the inviter when it signs up with `referralCode` (`POST /authenticate/signup` or `/google`), redeems a code with `POST /referral/redeem/:code` shortly after signing up, or claims a challenge play (`POST /challenges/attempts/:attemptId/claim`, see [§21](#21-challenges)). Only brand-new accounts can be credited.
- **Nothing is rewarded at signup.** When the referred friend has answered **10 questions** (practice answers plus answers in challenges they played), the friend is marked active and **both** people get +1 practice-paper credit (`paperCredits`) and +1 bonus streak freeze (`streakFreezes.bonus`). Each person who gets the gift also gets a `gift_unlocked` notification ([§23](#23-notifications)).
- Referrer rewards are capped per calendar month; a friend activated past the cap still gets their own gift, and the referral entry shows `rewardClaimed: false`.

---

#### GET `/referral/my-code`

The signed-in user's invite code, link, rewards and friends. Opening it also settles any gift that is due but was not recorded yet (for the user and for recently joined friends), so the credits shown are current.

**Response (200):**
```json
{
  "success": true,
  "message": "Referral data fetched",
  "data": {
    "referralCode": "K7QM2P",
    "referralLink": "https://askaide.in/signup?ref=K7QM2P",
    "shareText": "AskAide try karo 📚 ... https://askaide.in/signup?ref=K7QM2P",
    "activationAnswers": 10,
    "totalReferrals": 3,
    "activeReferrals": 1,
    "totalRewards": 1,
    "rewards": { "paperCredits": 1, "papersUsed": 0, "papersAvailable": 1 },
    "milestones": [
      { "count": 1, "badgeId": "squad_starter", "title": "Squad Starter", "reached": true },
      { "count": 3, "badgeId": "squad_leader", "title": "Squad Leader", "reached": false },
      { "count": 5, "badgeId": "class_captain", "title": "Class Captain", "reached": false }
    ],
    "referredBy": { "name": "Riya", "activated": false, "answered": 6 },
    "referrals": [
      { "name": "Kabir", "joinedAt": "2026-10-09T08:00:00.000Z", "source": "challenge", "status": "active", "rewardClaimed": true },
      { "name": "Meera", "joinedAt": "2026-10-08T12:30:00.000Z", "source": "link", "status": "joined", "rewardClaimed": false }
    ]
  }
}
```

`referredBy` is `null` unless someone invited this user; `answered` is capped at `activationAnswers`. Each `referrals[].source` is `link` (invite link/code) or `challenge` (joined by playing a challenge); `status` is `joined` until that friend answers 10 questions, then `active`. Names are first names only. Shape: `ReferralSummary` in shared contracts.

---

#### POST `/referral/redeem/:code`

Apply a friend's invite code to the signed-in account after signup. Same rules as `referralCode` at signup: only for new accounts.

**Params:** `code` — invite code

**Response (200):**
```json
{
  "success": true,
  "message": "You joined with Riya's invite! Answer 10 questions and you both get a gift.",
  "data": {
    "success": true,
    "message": "You joined with Riya's invite! Answer 10 questions and you both get a gift."
  }
}
```

**Errors:** 400 (`SELF` — your own code, `NOT_NEW` — account too old, `ALREADY_REFERRED`), 404 (`INVALID_CODE`)

---

#### POST `/referral/rewards/practice-paper`

Spend one practice-paper credit on a 20-question practice paper (with answer key) for a chapter. If the paper can't be made (for example the chapter has no questions yet), the credit is given back.

**Request:**
```json
{
  "chapterId": "64f1a2b3c4d5e6f7a8b9c0d5"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Practice paper ready",
  "data": {
    "paperId": "6704c1a2b3c4d5e6f7a8b9c0",
    "title": "Chemical Reactions and Equations — Practice Paper",
    "questionsSelected": 20,
    "papersAvailable": 0
  }
}
```

Download the paper with `GET /question-paper/:paperId/pdf`.

**Errors:** 400 (`INVALID_CHAPTER`, `NO_CREDITS` — no practice papers left), 404 (`CHAPTER_NOT_FOUND`)

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

### 20. AI System (LLM)

Base: `/api/v1/admin/system/llm/`

All endpoints require **SuperAdmin** role. They back the **AI System** tab in `/admin` and proxy the AI Service's `/v1/admin/llm/*` (§7 of the AI Service API) with `x-api-key`. Unlike other AI proxies, the AI Service's `400` / `409` / `503` / `504` are passed through as-is instead of being mapped to `502`.

Switching takes effect **instantly for every AI feature** — no restart or redeploy; requests already running finish on the old model. API keys stay in the AI Service's environment; a provider can only be used if its key is set there. The env default (`LLM_PROVIDER` + that provider's model variable) is used whenever no choice has been saved.

---

#### GET `/status`

The live provider/model and where it came from.

**Response (200):**
```json
{
  "success": true,
  "message": "LLM status fetched",
  "data": {
    "provider": "openrouter",
    "model": "openai/gpt-4o-mini",
    "source": "database",
    "updated_by": "admin@example.com",
    "updated_at": "2026-10-02T09:30:00Z",
    "previous": { "provider": "openrouter", "model": "meta-llama/llama-3.3-70b-instruct:free" },
    "saved_choice_error": null,
    "env_default": { "provider": "openrouter", "model": "meta-llama/llama-3.3-70b-instruct:free" },
    "recent_changes": [
      { "action": "activate", "from": { "...": "..." }, "to": { "...": "..." }, "requested_by": "admin@example.com", "at": "2026-10-02T09:30:00Z" }
    ],
    "providers": [
      { "name": "openrouter", "key_configured": true, "configured_model": "meta-llama/llama-3.3-70b-instruct:free" },
      { "name": "gemini", "key_configured": false, "configured_model": null }
    ]
  }
}
```

`source` is `database` (chosen in the admin panel) or `env` (env default). `saved_choice_error` is set when a saved choice could not start (e.g. its key was removed), so the env default is live. Key values are never returned. Also includes `settings_scope`, `started_at`, `commit` and `error` (see `LlmStatus` in shared contracts).

---

#### GET `/models`

Model suggestions for a provider.

**Query:** `provider` (`openrouter` | `gemini` | `openai` | `anthropic`), `freeOnly` (`true` default; OpenRouter only)

**Response (200):** `data` = `{ provider, source: "live" | "curated", models: [{ id, name, context_length, free }], error }`. Live listings are cached for 10 minutes; a curated list is returned when the key is missing or the listing fails.

---

#### POST `/test`

Runs three checks (plain reply, JSON reply, MCQ question-schema reply) against a model. **Never changes anything.** An empty body tests the live model.

**Rate limit:** 10 per minute.

**Request:**
```json
{ "provider": "openrouter", "model": "openai/gpt-4o-mini" }
```

**Response (200):**
```json
{
  "success": true,
  "message": "All LLM checks passed",
  "data": {
    "ok": true,
    "provider": "openrouter",
    "model": "openai/gpt-4o-mini",
    "total_ms": 6120,
    "checks": [
      { "name": "plain", "ok": true, "latency_ms": 1300, "sample": "..." },
      { "name": "json", "ok": true, "latency_ms": 1900, "sample": "..." },
      { "name": "question", "ok": true, "latency_ms": 2900, "sample": "..." }
    ]
  }
}
```

**Errors:** `400` unknown provider or its key is not configured · `504` the checks took longer than the AI Service's cap (`LLM_TEST_TIMEOUT`, 90 s).

---

#### POST `/active`

Makes `provider` + `model` the live model for every AI feature. The AI Service re-runs the three checks first and switches **only if all pass**; the choice is then saved and swapped in memory. The SuperAdmin's email is recorded as `requested_by`.

**Rate limit:** 5 per 10 minutes (shared with `/reset`).

**Request:**
```json
{ "provider": "openrouter", "model": "openai/gpt-4o-mini" }
```

**Response (200):** `data` = `{ activated, changed, test, status, error? }`. `activated: false` means the checks failed and **nothing changed** (`test` holds the failing checks); `changed: false` with `activated: true` means that model was already live.

**Errors:** `400` unknown provider or key not configured · `409` another switch is already running · `503` the choice could not be saved (not switched) · `504` timed out (not switched).

---

#### POST `/reset`

Deletes the saved choice and goes back to the env default.

**Rate limit:** 5 per 10 minutes (shared with `/active`).

**Response (200):** `data` = `{ activated, changed, test: null, status }`. Features that have their own model keep it.

**Errors:** `409` a switch is already running · `503` the saved choice could not be cleared.

---

#### POST `/features/:feature`

Gives one AI feature its own model and/or temperature ("Model per feature" in the AI System tab). `:feature` is one of `ingestion`, `questions`, `assistant_chat`, `assistant_content`, `insights`. Send `provider` + `model` together, or only a `temperature` (0–2) to stay on the live model. The AI Service runs the three checks on exactly that combination and saves it only if all pass.

**Rate limit:** 20 per 10 minutes (shared with `/features/:feature/reset`).

**Request:**
```json
{ "provider": "openrouter", "model": "openai/gpt-4o-mini", "temperature": 0.4 }
```

**Response (200):** `data` = `{ activated, changed, test, status, feature }` (`LlmFeatureSwitchResult`), where `feature` is what that feature runs now. `GET /status` also lists every feature under `features`.

**Errors:** `400` bad combination, unknown provider or key not configured · `404` unknown feature · `409` a switch is already running · `503` the choice could not be saved.

---

#### POST `/features/:feature/reset`

Deletes the feature's own choice; it follows the live model again at the provider's default temperature.

**Response (200):** `data` = `LlmFeatureSwitchResult`.

`POST /test` also accepts `temperature` and `feature` (with `feature` and no model, it tests what that feature runs now).

---

### 21. Challenges

Base: `/api/v1/challenges/`

"Challenge a friend": a student turns a finished practice session into a link (`{FRONTEND_URL}/c/CODE`). Friends play the same questions **without logging in**, see who won, and sign in to see the answers. A guest's play can be claimed after signup, which credits the challenge owner as the new account's inviter ([Referral rewards](#referral-rewards--how-they-work)). Challenge answers count towards the referral gift. Shapes: `ChallengeSummary`, `PublicChallenge`, `ChallengeAttemptResult`, `ChallengeClaimResult`, `ChallengeReview`, `MyChallenge`, `ChallengeGiftStatus` in shared contracts.

| Endpoint | Auth | Rate limit |
|----------|------|------------|
| `POST /` | Required | Global only |
| `GET /mine` | Required | Global only |
| `GET /:code` | Optional | 120 per 10 min |
| `POST /:code/attempts` | Optional | 20 per 10 min |
| `POST /attempts/:attemptId/claim` | Required | Global only |
| `GET /:code/review` | Required | Global only |

---

#### POST `/`

Create a challenge from one of your finished practice sessions. Uses the session's first multiple-choice answers (up to 10). Calling it again for the same session returns the same challenge.

**Request:**
```json
{
  "sessionId": "6704b1a2b3c4d5e6f7a8b9c0"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Challenge ready to share",
  "data": {
    "code": "M4RT9K",
    "url": "https://askaide.in/c/M4RT9K",
    "ownerName": "Aarav",
    "ownerScore": 7,
    "total": 10,
    "className": "10th",
    "classLabel": "Class 10",
    "subjectName": "Science",
    "chapterName": "Chemical Reactions and Equations",
    "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
    "subjectId": "64f1a2b3c4d5e6f7a8b9c0d3",
    "chapterId": "64f1a2b3c4d5e6f7a8b9c0d5",
    "attemptsCount": 0,
    "shareText": "Maine Science ... me 7/10 score kiya 🔥 Tum beat kar sakte ho? ... 👉 https://askaide.in/c/M4RT9K"
  }
}
```

**Errors:** 400 (`INVALID_SESSION`, `NOT_ENOUGH_QUESTIONS` — fewer than 3 multiple-choice answers in the session), 403 (`UNAUTHORIZED` — not your session), 404 (`SESSION_NOT_FOUND`)

---

#### GET `/mine`

Challenges the signed-in student has sent, each with its best players.

**Response (200):** `data` = array of `ChallengeSummary` fields plus `createdAt` and `players: [{ name, score }]` (best 5).

---

#### GET `/:code`

Public play payload. Questions come **without answers**. Works with or without a token; with a token, `isOwner` and `myAttempt` reflect the signed-in user.

**Response (200):**
```json
{
  "success": true,
  "message": "Challenge fetched",
  "data": {
    "code": "M4RT9K",
    "ownerName": "Aarav",
    "ownerScore": 7,
    "total": 10,
    "subjectName": "Science",
    "chapterName": "Chemical Reactions and Equations",
    "...": "other ChallengeSummary fields",
    "isOwner": false,
    "myAttempt": null,
    "questions": [
      { "_id": "64q1...", "questionText": "Which of these is a combination reaction?", "options": ["...", "...", "...", "..."] }
    ],
    "leaderboard": [
      { "name": "Aarav", "score": 7, "isOwner": true, "isMe": false },
      { "name": "Kabir", "score": 8, "isOwner": false, "isMe": false }
    ]
  }
}
```

`myAttempt` is `{ score, outcome }` once the signed-in user has played. `leaderboard` is the top 5.

**Errors:** 404 (`CHALLENGE_NOT_FOUND`), 429 (too many requests)

---

#### POST `/:code/attempts`

Play a challenge. No login needed; the answers are scored on the server.

**Request:**
```json
{
  "name": "Kabir",
  "answers": [
    { "questionId": "64q1a2b3c4d5e6f7a8b9c0d1", "selected": "2Mg + O₂ → 2MgO" }
  ]
}
```

`name` (optional, max 60 characters) is used for guests; signed-in players appear under their first name. `answers` holds up to 20 items; `selected` may be `null` for a skipped question.

**Response (201):**
```json
{
  "success": true,
  "message": "Attempt scored",
  "data": {
    "attemptId": "6705c1a2b3c4d5e6f7a8b9c0",
    "code": "M4RT9K",
    "score": 8,
    "total": 10,
    "ownerName": "Aarav",
    "ownerScore": 7,
    "outcome": "won",
    "rank": 1,
    "players": 2,
    "claimToken": "9f2c...48 hex characters...",
    "gift": null
  }
}
```

- `outcome` is from the player's side: `won`, `lost` or `tie`. `rank` is 1-based with the owner included; `players` = owner + attempts.
- **Guests** get a single-use `claimToken` (48 hex characters) to claim the play after signing up. Signed-in players get `claimToken: null`; their play is linked to the account straight away.
- A signed-in player who already played gets their **first** result back with `alreadyPlayed: true`.
- `gift` (`ChallengeGiftStatus`) appears for signed-in players who were referred: `{ from, unlocked, justUnlocked, answered, goal }`, where `answered` counts practice and challenge answers (capped at `goal`, 10). A play can unlock the gift on the spot (`justUnlocked: true`).
- The owner gets a `challenge_played` notification.

**Errors:** 400 (`OWN_CHALLENGE` — the owner can't play their own challenge; validation), 404 (`CHALLENGE_NOT_FOUND`), 429 (too many attempts)

---

#### POST `/attempts/:attemptId/claim`

Link a guest's play to the account they just signed up or logged in with. If the account is new, the challenge owner is credited as its inviter, and the play's answers count towards the referral gift.

**Request:**
```json
{
  "claimToken": "9f2c...48 hex characters..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Attempt saved to your account",
  "data": {
    "code": "M4RT9K",
    "claimed": true,
    "referral": { "attributed": true, "referrerName": "Aarav" },
    "gift": { "from": "Aarav", "unlocked": false, "justUnlocked": false, "answered": 8, "goal": 10 }
  }
}
```

`claimed: false` (without `referral`/`gift`) when the owner claims their own play or the account already played this challenge (the first score is kept). Claiming again with the same account returns `claimed: true`. `gift` is `null` when nobody referred the player. Use `code` to open the results page.

**Errors:** 400 (`INVALID_ATTEMPT`), 403 (`INVALID_CLAIM_TOKEN`), 404 (`ATTEMPT_NOT_FOUND`, `CHALLENGE_NOT_FOUND`), 409 (`ALREADY_CLAIMED` — linked to another account)

---

#### GET `/:code/review`

Results page: every question with the correct answer, explanation and the caller's choice, plus the scoreboard. Only for the owner or someone who has played (and, for guests, claimed) the challenge.

**Response (200):**
```json
{
  "success": true,
  "message": "Challenge results fetched",
  "data": {
    "code": "M4RT9K",
    "...": "other ChallengeSummary fields",
    "isOwner": false,
    "myScore": 8,
    "outcome": "won",
    "questions": [
      {
        "_id": "64q1...",
        "questionText": "Which of these is a combination reaction?",
        "options": ["...", "...", "...", "..."],
        "correctAnswer": "2Mg + O₂ → 2MgO",
        "explanation": "Two reactants combine to form a single product.",
        "selected": "2Mg + O₂ → 2MgO",
        "isCorrect": true
      }
    ],
    "leaderboard": [ { "name": "Kabir", "score": 8, "isOwner": false, "isMe": true } ]
  }
}
```

`outcome` is `null` for the owner. `leaderboard` is the top 20.

**Errors:** 403 (`PLAY_FIRST`), 404 (`CHALLENGE_NOT_FOUND`)

---

### 22. Teacher Class Links

Base: `/api/v1/teacher-classes/`

A teacher creates a join link for one class + subject (+ optional section) and shares it with the class (WhatsApp, copy, or a QR code). Students who open `{FRONTEND_URL}/join/CODE` and join are linked to the teacher exactly like a school-created teacher–student link (a `TeacherStudent` row with `joinedVia` = the link), so they appear in every Teacher Dashboard view. The student's `schoolId` is left unset, so their own practice is not restricted. Shapes: `ClassLinkSummary`, `MyClassLinks`, `ClassLinkPublic`, `ClassJoinResult`, `ClassReport`, `TeacherCertificate` in shared contracts.

| Endpoint | Auth |
|----------|------|
| `POST /`, `GET /mine`, `PATCH /:id`, `GET /:id/report`, `GET /certificate` | Teacher |
| `GET /join/:code` | Public (120 per 10 min) |
| `POST /join/:code` | Any signed-in user; only students can join |

---

#### POST `/`

Create a class link, or get the active one that already exists for the same class, subject and section. A teacher who has no school yet gets a private independent school set up first.

**Request:**
```json
{
  "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "subjectId": "64f1a2b3c4d5e6f7a8b9c0d3",
  "sectionName": "B",
  "expectedStudents": 35
}
```

`sectionName` (max 20 characters) and `expectedStudents` (1–300) are optional.

**Response (201):**
```json
{
  "success": true,
  "message": "Class link ready",
  "data": {
    "code": "P8HV3D",
    "url": "https://askaide.in/join/P8HV3D",
    "label": "Class 10 · Science · B",
    "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
    "subjectId": "64f1a2b3c4d5e6f7a8b9c0d3",
    "className": "10th",
    "subjectName": "Science",
    "sectionName": "B",
    "shareText": "..."
  }
}
```

`shareText` is a ready-to-send English + Hindi message for the class or parents' group.

**Errors:** 400 (`INVALID_CLASS`, `INVALID_SUBJECT` — the subject is not part of this class), 404 (`TEACHER_NOT_FOUND`)

---

#### GET `/mine`

The teacher's links with join and practice counts, and progress towards the class report and the Champion Teacher certificate.

**Response (200):**
```json
{
  "success": true,
  "message": "Class links fetched",
  "data": {
    "links": [
      {
        "id": "6705d1a2b3c4d5e6f7a8b9c0",
        "code": "P8HV3D",
        "label": "Class 10 · Science · B",
        "...": "other ClassLinkSummary fields",
        "active": true,
        "expectedStudents": 35,
        "joined": 18,
        "practised": 11,
        "activeThisWeek": 6,
        "reportUnlocked": true,
        "createdAt": "2026-10-10T05:00:00.000Z"
      }
    ],
    "totals": { "joined": 18, "practised": 11 },
    "milestones": [
      { "key": "class_report", "count": 10, "title": "Class progress report", "reached": true },
      { "key": "certificate", "count": 25, "title": "AskAide Champion Teacher certificate", "reached": false }
    ]
  }
}
```

`practised` counts students who joined through the link **and** answered questions after joining.

---

#### PATCH `/:id`

Turn one of your links off (close it) or back on. Closed links can't be joined.

**Request:**
```json
{ "active": false }
```

**Response (200):**
```json
{
  "success": true,
  "message": "Class link turned off",
  "data": { "id": "6705d1a2b3c4d5e6f7a8b9c0", "code": "P8HV3D", "active": false }
}
```

**Errors:** 400 (`INVALID_LINK`), 404 (`LINK_NOT_FOUND` — not found or not yours)

---

#### GET `/:id/report`

Per-student report for one link: `{ label, teacherName, generatedAt, joined, practised, students: [{ name, joinedAt, answered, accuracy, lastPractisedAt }] }`.

**Errors:** 403 (`REPORT_LOCKED` — fewer than 10 students have practised), 404 (`LINK_NOT_FOUND`)

---

#### GET `/certificate`

Champion Teacher certificate data: `{ teacherName, studentsPractised, questionsAnswered, classes, issuedAt, certificateId }`.

**Errors:** 403 (`CERTIFICATE_LOCKED` — fewer than 25 students have practised across the teacher's links)

---

#### GET `/join/:code`

Public info for the join page. No login needed.

**Response (200):**
```json
{
  "success": true,
  "message": "Class fetched",
  "data": {
    "code": "P8HV3D",
    "active": true,
    "teacherName": "Mrs. Gupta",
    "className": "10th",
    "classLabel": "Class 10",
    "subjectName": "Science",
    "sectionName": "B",
    "label": "Class 10 · Science · B",
    "schoolName": null,
    "joinedCount": 18
  }
}
```

`schoolName` is `null` for a teacher without a school. A closed link still returns, with `active: false`.

**Errors:** 404 (`LINK_NOT_FOUND`), 429 (too many requests)

---

#### POST `/join/:code`

The signed-in student joins the class. Joining twice is harmless. The teacher gets a `class_joined` notification.

**Response (200):**
```json
{
  "success": true,
  "message": "You joined the class",
  "data": {
    "code": "P8HV3D",
    "alreadyJoined": false,
    "teacherName": "Mrs. Gupta",
    "label": "Class 10 · Science · B",
    "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
    "subjectId": "64f1a2b3c4d5e6f7a8b9c0d3",
    "subjectName": "Science"
  }
}
```

When `alreadyJoined` is `true` the message is "You are already in this class".

**Errors:** 403 (`ONLY_STUDENTS` — teacher, parent or other non-student accounts), 404 (`LINK_NOT_FOUND`), 410 (`LINK_INACTIVE` — the teacher closed the link)

---

### 23. Notifications

Base: `/api/v1/notifications/`

**Auth required for all endpoints** (any role). The in-app notification bell. Rows are written by the Backend when:

| `type` | When |
|--------|------|
| `challenge_played` | A friend played your challenge |
| `friend_joined` | A new account joined with your invite link or challenge |
| `gift_unlocked` | A referral gift unlocked (for the friend, and for the inviter when rewarded) |
| `gift_reminder` | Daily job: a referred friend who joined about a day ago (within the last week) still has questions left before the gift (sent once) |
| `badge_earned` | You earned a badge |
| `class_joined` | Students joined a teacher's class link |
| `class_milestone` | Daily job: a teacher's class report or certificate unlocked (sent once) |

The daily job runs at **5 pm IST**. Events of the same type and target on the same IST day are grouped into one row (`count` > 1, e.g. "Kabir and 2 others played your challenge"); `title` and `body` are written from the grouped data when the list is read. One-time events never repeat. Rows are deleted 60 days after their last event. Shapes: `NotificationItem`, `NotificationList`, `NotificationReadResult` in shared contracts.

---

#### GET `/`

The signed-in user's notifications, newest first (by `lastAt`).

**Query:**

| Param | Notes |
|-------|-------|
| `before` | Optional ISO date: the `nextCursor` from the previous page |
| `limit` | Optional, 1–50, default 20 |

**Response (200):**
```json
{
  "success": true,
  "message": "Notifications fetched",
  "data": {
    "items": [
      {
        "id": "6705e1a2b3c4d5e6f7a8b9c0",
        "type": "challenge_played",
        "icon": "⚔️",
        "title": "Kabir beat your challenge! 😤",
        "body": "Kabir 8/10 · you 7/10 in Chemical Reactions and Equations",
        "link": "/c/M4RT9K/results",
        "count": 1,
        "read": false,
        "lastAt": "2026-10-10T11:20:00.000Z",
        "createdAt": "2026-10-10T11:20:00.000Z"
      }
    ],
    "hasMore": false,
    "nextCursor": null,
    "unread": 1
  }
}
```

`link` is the in-app path to open (or `null`). Pass `nextCursor` as `before` to get the next page.

**Errors:** 400 (invalid `before` or `limit`)

---

#### GET `/unread-count`

The number on the bell. The web app polls it every 60 seconds while the tab is visible.

**Response (200):**
```json
{
  "success": true,
  "message": "Unread count fetched",
  "data": { "unread": 3 }
}
```

---

#### POST `/read`

Mark notifications read, either some by id or all of them.

**Request:**
```json
{ "ids": ["6705e1a2b3c4d5e6f7a8b9c0"] }
```
or
```json
{ "all": true }
```

`ids` holds up to 100 ids. One of `ids` or `all` is required.

**Response (200):**
```json
{
  "success": true,
  "message": "Notifications marked read",
  "data": { "updated": 1, "unread": 2 }
}
```

**Errors:** 400 (neither `ids` nor `all`, or an invalid id)

---

## AI Service API

Base: `http://localhost:8000`

All AI Service endpoints are **internal only** — called by the Backend, not the Frontend directly.

> **Integration legend:** `✅` = Backend caller exists (fully wired). `⚠️` = documented but no Backend caller (gap).

---

### 1. Document Management

---

#### POST `/v1/upload-document`

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

**Poll status with:** `GET /v1/upload-status/{task_id}`

> ⚠️ **Integration gap:** Backend never polls this endpoint — treats any 202 as success without checking actual completion.

---

#### GET `/v1/upload-status/{task_id}`

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

#### POST `/v1/delete-document`

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

> ⚠️ **Integration gap:** No Backend caller exists. The Backend calls individual `/v1/search-document` in a loop instead.

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

#### POST `/v1/search-document`

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

#### POST `/v1/generate-questions`

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

#### GET `/v1/ai-insights/chapter`

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

#### GET `/v1/ai-insights/subject`

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

#### GET `/v1/ai-insights/teacher/class`

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

#### POST `/v1/ai-agent`

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

#### GET `/v1/ai-agent/classes`

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

#### GET `/v1/ai-agent/tasks`

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

#### GET `/v1/ai-agent/health`

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

#### POST `/v1/ai-agent/stream`

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

#### GET `/v1/ai-agent/chapters`

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

#### POST `/v1/ai-agent/modify`

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

**Response:** Same `AgentResponse` shape as `/v1/ai-agent`, with a new `generation_id`.

---

#### GET `/v1/ai-agent/history`

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

#### GET `/v1/ai-agent/generation/{generation_id}`

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

#### POST `/v1/regenerate-topics`

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

#### POST `/v1/sync-chapter-topics`

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

### 7. Admin LLM

Live LLM switching. ✅ Called only by the Backend's SuperAdmin routes `/api/v1/admin/system/llm/*` (Backend §20), which add `requested_by`. Request/response types: `LlmStatus`, `LlmTestRequest`, `LlmTestResult`, `LlmActivateRequest`, `LlmSwitchResult`, `LlmFeatureRequest`, `LlmFeatureSwitchResult`, `LlmModelList` in shared contracts.

Every AI feature uses one shared, switchable LLM client, so a switch takes effect instantly with no restart; in-flight calls finish on the old client. The choice is saved in MongoDB `llm_settings` (scoped per deployment) and read once at startup; with none, `LLM_PROVIDER` + that provider's model variable is used. API keys stay in env only.

---

#### GET `/v1/admin/llm/status`

Live provider/model, `source` (`database` / `env`), who set it and when, the previous choice, the env default, recent switches, start time, commit, and a per-provider `key_configured` flag (never the key).

---

#### POST `/v1/admin/llm/test`

Plain / JSON / MCQ-schema checks. Empty body tests the live model. Never changes anything.

**Request:** `{ "provider"?: "openrouter", "model"?: "openai/gpt-4o-mini", "temperature"?: 0.4, "feature"?: "questions" }` — with `feature` and no model, tests what that feature runs now; `temperature` runs the checks at that temperature.

**Response (200):** `{ ok, provider, model, total_ms, checks: [{ name, ok, latency_ms, sample?, error?, skipped? }] }`

**Errors:** `400` unknown provider or key not configured · `504` past `LLM_TEST_TIMEOUT` (90 s).

---

#### POST `/v1/admin/llm/active`

Re-runs the three checks on the candidate; only if all pass, saves the choice then swaps the live client.

**Request:** `{ "provider": "openrouter", "model": "openai/gpt-4o-mini", "requested_by": "admin@example.com" }`

**Response (200):** `{ activated, changed, test, status, error? }` — `activated: false` = checks failed, nothing changed.

**Errors:** `409` a switch is already running · `503` can't save the choice (not switched) · `504` timed out (not switched).

---

#### POST `/v1/admin/llm/reset`

Deletes the saved choice and swaps back to the env default. Features with their own model keep it. **Request:** `{ "requested_by"?: "..." }` · **Response:** `LlmSwitchResult`.

---

#### POST `/v1/admin/llm/features/{feature}`

Give one feature (`ingestion`, `questions`, `assistant_chat`, `assistant_content`, `insights`) its own model and/or temperature. `provider` + `model` together, or only `temperature` to stay on the live model. Runs the three checks on exactly that combination; only if all pass, saves it to `llm_settings` and swaps it in instantly.

**Request:** `{ "provider"?: "openrouter", "model"?: "openai/gpt-4o-mini", "temperature"?: 0.4, "requested_by"?: "..." }` · **Response:** `LlmFeatureSwitchResult` (`LlmSwitchResult` plus `feature`).

**Errors:** `400` bad combination · `404` unknown feature · `409` a switch is already running · `503` can't save.

---

#### POST `/v1/admin/llm/features/{feature}/reset`

Deletes the feature's own choice; it follows the live model at the provider's default temperature. **Request:** `{ "requested_by"?: "..." }` · **Response:** `LlmFeatureSwitchResult`.

---

#### GET `/v1/admin/llm/models`

**Query:** `provider?`, `free_only?` (default `true`, OpenRouter only)

**Response (200):** `{ provider, source: "live" | "curated", models: [{ id, name, context_length, free }], error }` — live listing cached 10 min; curated fallback when the key is missing or listing fails (`502` only if OpenRouter's public catalogue is down).

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
  "message": "Answer at least 3 multiple-choice questions to send a challenge",
  "code": "NOT_ENOUGH_QUESTIONS"
}
```

`code` is a stable machine-readable value (for example `DUPLICATE_KEY`, `INVALID_ID`, or a module-specific code such as `NO_CREDITS` or `LINK_INACTIVE`); show `message` to users. Two other shapes exist:

- **Request validation** (Joi): `400` with `{ "success": false, "message": "Validation failed", "error": { "errors": [{ "field": "...", "message": "..." }] } }`.
- **Auth middleware**: `401` with `{ "success": false, "message": "Token has expired", "error": "tokenExpired" }` (also `noToken`, `tokenInvalid`). Clients refresh on `tokenExpired`.

Rate-limited requests (`429`) return `{ "success": false, "message": "Too many ... Please try again ..." }`.

---

## Rate Limits

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| General API (all routes, per IP; skips `/api-docs`, `/ping` and localhost) | 500 req | 5 min |
| Login (`/authenticate/login`, `/authenticate/google`) | 10 req | 15 min |
| Signup (`/authenticate/signup`) | 10 req | 1 hour |
| Password reset (`/authenticate/reset-password-token`, `/reset-password`) | 5 req | 15 min |
| Email change (`/profile/email/request-change`, `/confirm-change`) | 10 req | 15 min |
| Public challenge view (`GET /challenges/:code`) | 120 req | 10 min |
| Public challenge play (`POST /challenges/:code/attempts`) | 20 req | 10 min |
| Class link join info (`GET /teacher-classes/join/:code`) | 120 req | 10 min |
| Inline feedback (`/inline-feedback`) | 10 req | 1 min |
| Feedback form (`POST /feedback`) | 5 req | 1 hour |
| AI System model test (`/admin/system/llm/test`) | 10 req | 1 min |
| AI System switch / reset (`/admin/system/llm/active`, `/reset`) | 5 req | 10 min |
| AI System per-feature model (`/admin/system/llm/features/*`) | 20 req | 10 min |

Most limiters send the IETF draft-8 `RateLimit` and `RateLimit-Policy` headers instead of the legacy `X-RateLimit-*` headers. A rate-limited request gets `429`.

---

## Appendix: Data Models

### User
```typescript
{
  _id: string;
  userName: string;
  name: string;
  email: string;
  accountType: "Student" | "Teacher" | "Principal" | "Parent" | "SuperAdmin" | "NormalUser";
  image?: string;
  class?: string;          // Class ObjectId
  acquisition?: {          // first-touch attribution sent at signup (UserAcquisition)
    source?: "referral" | "challenge" | "class" | "organic";
    ref?: string;
    utmSource?: string; utmMedium?: string; utmCampaign?: string;
    landingPath?: string; firstSeenAt?: Date;
  };
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
