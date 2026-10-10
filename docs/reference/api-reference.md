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
  - [Health](#24-health)
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

Errors use `{ "success": false, "message": "...", "code": "ERROR_CODE" }` (see [Error Response Format](#error-response-format)). Exceptions: `POST /authenticate/login`, `/signup`, `/google` and `/refresh` return `tokens` and `user` at the top level instead of under `data`, the leaderboard endpoints return `{ success, data }` without a `message`, and the [Quiz](#9-quiz), [Question Paper](#12-question-paper) and API log endpoints build their own bodies (some without `message`; question paper history puts `pagination` next to `data`).

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
| `accountType` | No | `Student` (default) or `Teacher` (teacher self-signup). Any other value is rejected with `400` "Account type must be Student or Teacher". Principal accounts are created by an admin and linked to a school; parents are linked through the parent module |
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

**Errors:** 400 (validation failed, `INVALID_ACCOUNT_TYPE`, `USERNAME_TAKEN`, `EMAIL_TAKEN`), 429 (too many attempts)

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

The `/topic-progress` endpoints always report on the **signed-in user** (taken from the token), so they have no `userId` in the path. Mastery scores are between 0 and 1.

---

#### GET `/topic-progress/progress/chapter/:chapterId`

Topic-level progress in one chapter.

**Params:** `chapterId`

**Response (200):**
```json
{
  "success": true,
  "message": null,
  "data": {
    "chapterId": "64c1a2b3c4d5e6f7a8b9c0d4",
    "totalTopics": 6,
    "coverage": { "attempted": 4, "unattempted": 2, "percentage": 67 },
    "mastery": { "averageScore": 0.62, "status": "GOOD" },
    "topicBreakdown": { "unattempted": 2, "weak": 1, "learning": 1, "practicing": 1, "mastered": 1 },
    "topics": [
      {
        "topicId": "64t1a2b3c4d5e6f7a8b9c0d1",
        "topicName": "Natural Numbers",
        "state": "MASTERED",
        "masteryScore": 0.86,
        "hardAttempted": true,
        "lastPracticedAt": "2026-10-08T09:12:00.000Z"
      },
      { "topicId": "64t2a2b3c4d5e6f7a8b9c0d2", "topicName": "Integers", "state": "UNATTEMPTED" }
    ],
    "isStartable": true
  }
}
```

- `mastery.status`: `WEAK` (below 0.4), `NEEDS_REVISION` (below 0.6), `GOOD` (below 0.8) or `STRONG`
- Topic `state`: `WEAK`, `LEARNING`, `PRACTICING`, `MASTERED`, or `UNATTEMPTED` (then only `topicId` and `topicName` are sent). `hardAttempted` is `true` once the student has tried a Hard question on that topic
- `isStartable` is `true` once the chapter has topics and its PDF has finished indexing

---

#### GET `/topic-progress/progress/subject/:subjectId`

Progress across every active chapter of a subject.

**Params:** `subjectId`

**Response (200):**
```json
{
  "success": true,
  "message": null,
  "data": {
    "subjectId": "64f3a2b3c4d5e6f7a8b9c0d3",
    "subjectCoverage": 35,
    "subjectMastery": 0.41,
    "chapterBreakdown": { "not_started": 8, "weak": 1, "needs_revision": 2, "good": 1, "strong": 0 },
    "chaptersStarted": 4,
    "chaptersWithContent": 10,
    "totalChapters": 12,
    "chapters": [
      {
        "chapterId": "64c1a2b3c4d5e6f7a8b9c0d4",
        "name": "Number Systems",
        "order": 1,
        "status": "GOOD",
        "totalTopics": 6,
        "attemptedTopics": 4,
        "masteryScore": 0.62,
        "coveragePercentage": 67,
        "topics": [ "...same items as the chapter endpoint, without hardAttempted..." ],
        "isStartable": true
      }
    ]
  }
}
```

A chapter's `status` is `NOT_STARTED` until a topic is attempted, then one of the chapter statuses above.

---

#### GET `/topic-progress/ai-insights/chapter/:chapterId`

AI-generated insights on one chapter. The Backend calls the AI Service `GET /v1/ai-insights/chapter` with the signed-in user's id and returns its response unchanged in `data` (see [AI Insights](#3-ai-insights)). `message` is `null`.

**Params:** `chapterId`

---

#### GET `/topic-progress/ai-insights/subject/:subjectId`

AI-generated insights on a whole subject, through the AI Service `GET /v1/ai-insights/subject`. Same envelope as the chapter insights.

**Params:** `subjectId`

---

#### GET `/topic-progress/mastery-summary`

Mastery counts and highlights across all of the signed-in user's topics.

**Response (200):**
```json
{
  "success": true,
  "message": "Mastery summary fetched",
  "data": {
    "total": 42,
    "counts": { "WEAK": 6, "LEARNING": 12, "PRACTICING": 14, "MASTERED": 10 },
    "weakestTopics": [
      {
        "topicName": "Integers",
        "chapterName": "Number Systems",
        "subjectName": "Mathematics",
        "masteryState": "WEAK",
        "masteryScore": 0.22,
        "totalAttempts": 9
      }
    ],
    "strongestTopics": [ "...same item shape..." ],
    "recentlyImproved": [ "...same item shape, without totalAttempts..." ]
  }
}
```

Each list holds up to 5 topics. `recentlyImproved` lists topics updated in the last 7 days with mastery above 0.3.

---

#### GET `/topic-progress/teacher/class-insights`

AI insights on a teacher's class for one subject. The Backend calls the AI Service `GET /v1/ai-insights/teacher/class` with the signed-in teacher's id and returns its response unchanged in `data`.

**Auth:** Teacher role required.

**Query:** `?subjectId=64f3...` (required)

**Errors:** 400 (missing `subjectId`)

---

#### GET `/progress/user/:userId`

Everything the student dashboard shows, in one call. The shape is large; the main fields are below.

**Params:** `userId`

**Response (200):**
```json
{
  "success": true,
  "message": "Progress fetched successfully",
  "data": {
    "currentStreak": 5,
    "longestStreak": 12,
    "streakData": { "...": "same shape as GET /streaks/:userId" },
    "todayStats": { "questionsAnswered": 12, "correctAnswers": 9, "timeSpent": 540, "accuracy": 75 },
    "lastStudiedChapter": {
      "subject": "Mathematics",
      "chapter": "Number Systems",
      "chapterId": "64c1a2b3c4d5e6f7a8b9c0d4",
      "studiedAt": "2026-10-09T16:40:00.000Z"
    },
    "subjects": [ "...per-subject question counts and accuracy by difficulty..." ],
    "overallAccuracy": { "correctCount": 380, "totalCount": 480, "accuracyPercent": 79 },
    "avgTime": { "averageTimeSpent": 42 },
    "weeklyProgress": [ "..." ],
    "chapterWiseProgress": [ "..." ],
    "subjectWiseBestWorstChapter": [ "..." ]
  }
}
```

`lastStudiedChapter` is `null` before the first session.

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
  "message": "Streak freeze activated! Your streak is protected for 1 missed day.",
  "data": {
    "currentStreak": 5,
    "longestStreak": 12,
    "lastPracticeDate": "2026-10-09",
    "totalPracticeDays": 23,
    "streakFreezes": { "available": 1, "total": 1, "bonus": 1, "resetsOn": "2026-10-12T18:30:00.000Z" },
    "practiceDates": ["2026-10-05", "2026-10-06", "2026-10-09"],
    "practicedToday": false
  }
}
```

`data` has the same shape as `GET /streaks/:userId`.

**Errors:** 400 when no freeze is left ("No streak freezes available. Freezes reset every Monday.") or there is no streak to protect ("No active streak to protect."). These 400 responses keep the success body shape (`success: true`, the reason in `message`, the unchanged streak in `data`), so check the HTTP status.

---

#### GET `/daily-challenge/:userId`

Get today's daily challenge, creating it on the first call of the day (IST). It holds 5 questions from one of the user's weakest topics (`WEAK` or `LEARNING`), topped up with random questions when that topic has fewer than 5. With no weak topic, the names are `"Mixed"` / `"Mixed Topics"`. `difficulty` is `Easy`, `Medium` or `Hard`, from the topic's mastery.

**Params:** `userId`

**Response (200):**
```json
{
  "success": true,
  "message": "Daily challenge fetched successfully",
  "data": {
    "id": "64dc1a2b3c4d5e6f7a8b9c0d1",
    "date": "2026-10-10",
    "subjectName": "Mathematics",
    "chapterName": "Number Systems",
    "topicName": "Integers",
    "difficulty": "Easy",
    "totalQuestions": 5,
    "completed": false,
    "score": 0,
    "questions": [
      {
        "_id": "64q1a2b3c4d5e6f7a8b9c0d1",
        "questionText": "Which of these is a negative integer?",
        "options": ["-3", "0", "3", "1/2"],
        "difficulty": "Easy"
      }
    ]
  }
}
```

Before completion the questions carry no answers. Once completed, `questions` also include `correctAnswer` and `explanation`, and `answers` and `completedAt` are added.

---

#### POST `/daily-challenge/:userId/complete`

Mark today's challenge as completed. `score` is the number of answers sent with `isCorrect: true`. Completing an already completed challenge returns the saved result unchanged.

**Params:** `userId`

**Request:**
```json
{
  "answers": [
    {
      "questionId": "64q1a2b3c4d5e6f7a8b9c0d1",
      "selectedOption": "A",
      "selectedAnswer": "-3",
      "isCorrect": true,
      "timeSpent": 12
    }
  ]
}
```

**Response (200):** `message` is "Daily challenge completed!" and `data` has the same shape as `GET /daily-challenge/:userId`, with `completed: true`, `score`, `completedAt`, `answers` and the full questions.

**Errors:** 400 when `answers` is not an array (this response also keeps `success: true`; check the status). The call fails with 500 if today's challenge was never fetched.

---

#### GET `/daily-challenge/:userId/history`

Get recent daily challenges, newest first.

**Params:** `userId`

**Query:** `?limit=7` (default 7)

**Response (200):**
```json
{
  "success": true,
  "message": "Challenge history fetched",
  "data": [
    {
      "date": "2026-10-10",
      "completed": true,
      "score": 4,
      "totalQuestions": 5,
      "subjectName": "Mathematics",
      "chapterName": "Number Systems",
      "topicName": "Integers"
    }
  ]
}
```

---

#### GET `/badges/:userId`

Get every badge, earned and locked.

**Params:** `userId`

**Response (200):**
```json
{
  "success": true,
  "message": "Badges fetched successfully",
  "data": [
    {
      "badgeId": "first_session",
      "title": "First Steps",
      "description": "Complete your first practice session",
      "icon": "🎯",
      "earned": true,
      "earnedAt": "2026-09-20T10:00:00.000Z"
    },
    {
      "badgeId": "streak_keeper",
      "title": "Streak Starter",
      "description": "Achieve a 7-day practice streak",
      "icon": "🔥",
      "earned": false,
      "earnedAt": null
    }
  ]
}
```

There are 21 badges (practice, study time, streaks, time of day, subjects, challenges and invited friends). The list always contains all of them in the same order.

---

#### POST `/badges/check`

Check and award any newly earned badges. The session and quiz result screens call it, then show the new badges; the badges also go into the notification bell, already marked read.

**Request:**
```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "sessionId": "64s1a2b3c4d5e6f7a8b9c0d1",
  "score": 8,
  "totalQuestions": 10
}
```

Only `userId` is required.

**Response (200):**
```json
{
  "success": true,
  "message": "Badge check completed",
  "data": [
    { "badgeId": "perfect_score", "title": "Perfect Score" }
  ]
}
```

`data` lists only the badges awarded by this call (empty when none).

**Errors:** 400 (missing `userId`)

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

Full lifecycle: create (draft) → add questions → publish → start → answer → submit → result

**Auth:** every route needs a signed-in user; there is no role guard on the routes. Teacher operations only work on quizzes the signed-in user created, and creating a quiz (or searching the bank for one) needs a teacher–student link for that class and subject. Students only see published quizzes for the class and subject their teachers are linked to.

Quiz `status`: `draft`, `published` or `closed`. Attempt `status`: `in_progress`, `completed` or `abandoned`.

These responses are not built with `sendSuccess`: some have no `message`. Errors are `{ "success": false, "message": "...", "code": "..." }` (for example `NOT_FOUND`, `ACCESS_DENIED`, `QUIZ_PUBLISHED`).

---

#### GET `/questions/search` — Search Question Bank (Teacher)

Find bank questions to add to a quiz.

**Query:**

| Param | Required | Notes |
|-------|----------|-------|
| `chapterIds` | Yes | Comma-separated chapter IDs |
| `classId`, `subjectId` | Yes | The teacher must be linked to this class and subject |
| `questionType` | No | `mcq` or `fillblanks` |
| `difficulty` | No | `Easy`, `Medium` or `Hard` |
| `search` | No | Text to find in the question |
| `excludeQuizId` | No | Leave out questions already in this quiz |
| `page`, `limit` | No | Defaults 1 and 20; `limit` max 50 |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "_id": "64q1a2b3c4d5e6f7a8b9c0d1",
        "questionText": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"],
        "correctAnswer": "4",
        "explanation": "...",
        "questionType": "mcq",
        "difficulty": "Easy",
        "chapterId": { "_id": "64c1a2b3c4d5e6f7a8b9c0d4", "name": "Number Systems" },
        "createdAt": "2026-09-01T10:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 57, "pages": 3 }
  }
}
```

**Errors:** 400 (`MISSING_FIELDS`, `INVALID_CHAPTERS`), 403 (`ACCESS_DENIED`)

---

#### POST `/` — Create Quiz

Creates a draft quiz with no questions.

**Request:**
```json
{
  "title": "Midterm Practice",
  "description": "Covers chapters 1-5",
  "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "subjectId": "64f3a2b3c4d5e6f7a8b9c0d3",
  "chapterIds": ["64c1a2b3c4d5e6f7a8b9c0d4"],
  "sectionIds": [],
  "settings": {
    "timeLimit": 30,
    "shuffleQuestions": false,
    "shuffleOptions": false,
    "showAnswersAfter": "submission",
    "allowedAttempts": 1,
    "passingPercentage": 50,
    "deadline": "2026-10-20T18:29:59.000Z"
  }
}
```

`title`, `classId` and `subjectId` are required. `settings` is optional: `timeLimit` is in minutes (`null` = no limit), `showAnswersAfter` is `immediately`, `submission`, `deadline` or `never` (default `immediately`), `allowedAttempts` defaults to 1, `passingPercentage` to 50, `deadline` to none.

**Response (201):**
```json
{
  "success": true,
  "message": "Quiz created successfully",
  "data": {
    "quiz": {
      "_id": "64qz1a2b3c4d5e6f7a8b9c0d1",
      "title": "Midterm Practice",
      "status": "draft",
      "totalQuestions": 0,
      "totalMarks": 0,
      "settings": { "...": "as sent, with defaults filled in" },
      "...": "..."
    }
  }
}
```

**Errors:** 400 (`MISSING_FIELDS`), 403 (`ACCESS_DENIED`: not linked to this class/subject)

---

#### GET `/teacher/:teacherId` — List My Quizzes (Teacher)

`:teacherId` must be the signed-in user (otherwise 403). Deleted quizzes are left out.

**Query:** `?status=published&subjectId=...&classId=...&page=1&limit=10`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "quizzes": [ "...quiz documents, newest first, with classId, subjectId and chapterIds populated ({ _id, name })..." ],
    "pagination": { "page": 1, "limit": 10, "total": 4, "pages": 1 }
  }
}
```

---

#### GET `/:quizId` — Get Quiz

Returns the quiz and its questions. For a Teacher account the quiz must be their own.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "quiz": { "_id": "64qz1...", "title": "Midterm Practice", "classId": { "_id": "...", "name": "Class 7" }, "...": "..." },
    "questions": [
      {
        "_id": "64qq1a2b3c4d5e6f7a8b9c0d1",
        "questionId": { "_id": "64q1...", "questionText": "What is 2 + 2?", "options": ["3", "4", "5", "6"], "questionType": "mcq", "difficulty": "Easy" },
        "order": 1,
        "marks": 1,
        "isCustom": false
      }
    ]
  }
}
```

Each item's `_id` is the quiz-question ID used by the remove, reorder and answer endpoints. Custom questions have `isCustom: true`, `questionId: null` and the question in `customQuestion`.

---

#### PUT `/:quizId` — Update Quiz

Draft quizzes only. Send any of `title`, `description`, `chapterIds`, `sectionIds`, `settings` (merged into the current settings).

**Response (200):** `{ "success": true, "message": "Quiz updated successfully", "data": { "quiz": { ... } } }`

**Errors:** 400 (`QUIZ_PUBLISHED`), 403, 404

---

#### DELETE `/:quizId` — Delete Quiz

A draft is removed completely. A closed quiz, or a published one whose deadline has passed, is soft-deleted (kept for results). A published quiz before its deadline needs `?forceDelete=true`.

**Response (200):**
```json
{
  "success": true,
  "message": "Quiz deleted successfully",
  "data": { "deleteType": "hard" }
}
```

`deleteType` is `hard` or `soft`.

**Errors:** 400 (`QUIZ_ACTIVE`, `ALREADY_DELETED`), 403, 404

---

#### POST `/:quizId/publish` — Publish Quiz

Makes a draft visible to students. It needs at least one question, and the deadline (if set) must be in the future.

**Response (200):** `{ "success": true, "message": "Quiz published successfully", "data": { "quiz": { "status": "published", "publishedAt": "...", "...": "..." } } }`

**Errors:** 400 (`ALREADY_PUBLISHED`, `NO_QUESTIONS`, `DEADLINE_EXPIRED`), 403, 404

---

#### POST `/:quizId/close` — Close Quiz

Stops a published quiz.

**Response (200):** `{ "success": true, "message": "Quiz closed successfully", "data": { "quiz": { "status": "closed", "closedAt": "...", "...": "..." } } }`

**Errors:** 400 (`QUIZ_DRAFT`, `ALREADY_CLOSED`), 403, 404

---

#### POST `/:quizId/clone` — Clone Quiz

Copies the quiz and its questions into a new draft. The deadline is cleared.

**Request (optional):**
```json
{ "title": "Midterm Practice - Section B" }
```

Without `title`, the copy is called "`<title>` (Copy)".

**Response (201):** `{ "success": true, "message": "Quiz cloned successfully", "data": { "quiz": { "status": "draft", "...": "..." } } }`

---

#### POST `/:quizId/questions` — Add Questions

Draft quizzes only. Each item is either a bank question or a custom one; `marks` defaults to 1.

**Request:**
```json
{
  "questions": [
    { "questionId": "64q5a2b3c4d5e6f7a8b9c0d5", "marks": 1 },
    {
      "customQuestion": {
        "questionText": "Name the smallest prime number.",
        "options": ["0", "1", "2", "3"],
        "correctAnswer": "2",
        "explanation": "2 is the only even prime.",
        "questionType": "mcq",
        "difficulty": "Easy"
      },
      "marks": 2
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Questions added successfully",
  "data": { "added": 2, "totalQuestions": 12, "totalMarks": 15 }
}
```

**Errors:** 400 (no `questions` array, `QUIZ_PUBLISHED`), 403, 404 (`QUESTION_NOT_FOUND`)

---

#### DELETE `/:quizId/questions/:questionId` — Remove Question

Draft quizzes only. `:questionId` is the **quiz-question** `_id` from `GET /:quizId`, not the bank question ID. The remaining questions are renumbered.

**Response (200):**
```json
{ "success": true, "message": "Question removed successfully" }
```

**Errors:** 400 (`QUIZ_PUBLISHED`), 403, 404 (`QUESTION_NOT_FOUND`)

---

#### PUT `/:quizId/questions/reorder` — Reorder Questions

Draft quizzes only.

**Request:**
```json
{ "order": ["64qq3...", "64qq1...", "64qq2..."] }
```

`order` lists quiz-question IDs in the new order. Without it, the questions are just renumbered 1, 2, 3...

**Response (200):**
```json
{ "success": true, "message": "Questions reordered successfully" }
```

---

#### GET `/:quizId/analytics` — Quiz Analytics (Teacher)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "quiz": { "_id": "64qz1...", "title": "Midterm Practice", "totalMarks": 20, "totalQuestions": 20, "status": "published" },
    "overview": {
      "totalStudentsAssigned": 38,
      "totalAttempts": 35,
      "completedAttempts": 33,
      "inProgressAttempts": 2,
      "avgScore": 72,
      "passRate": 82,
      "avgTimeSpent": 1260
    },
    "questionAnalysis": [
      {
        "questionId": "64qq1...",
        "questionText": "What is 2 + 2?",
        "order": 1,
        "marks": 1,
        "totalAttempts": 33,
        "correctPercentage": 85,
        "avgTimeSpent": 21,
        "optionDistribution": [ "..." ]
      }
    ],
    "topPerformers": [
      { "student": { "_id": "...", "name": "Aarav", "email": "...", "image": "..." }, "score": 19, "percentage": 95, "timeSpent": 980 }
    ],
    "strugglingStudents": [
      { "student": { "_id": "...", "name": "...", "email": "...", "image": "..." }, "score": 6, "percentage": 30 }
    ]
  }
}
```

`avgScore` and `passRate` are percentages; times are in seconds. `topPerformers` (passed) and `strugglingStudents` (not passed) hold up to 5 each.

---

#### GET `/student/available` — Available Quizzes (Student)

Published, not deleted quizzes for the student's class/subject links.

**Query:** `?subjectId=...&classId=...` (both optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "quizzes": [
      {
        "_id": "64qz1...",
        "title": "Midterm Practice",
        "classId": { "_id": "...", "name": "Class 7" },
        "subjectId": { "_id": "...", "name": "Mathematics" },
        "chapterIds": [ { "_id": "...", "name": "Number Systems" } ],
        "settings": { "timeLimit": 30, "deadline": "2026-10-20T18:29:59.000Z", "allowedAttempts": 1, "...": "..." },
        "attemptInfo": {
          "totalAttempts": 1,
          "completedAttempts": 1,
          "inProgressAttempt": null,
          "canAttempt": false,
          "bestScore": 85,
          "lastAttemptId": "64at1..."
        },
        "isExpired": false
      }
    ]
  }
}
```

`attemptInfo.inProgressAttempt` is the ID of an unfinished attempt (or `null`); `bestScore` is the best percentage (or `null`); `canAttempt` is `false` once the deadline passed or no attempts are left.

---

#### POST `/:quizId/start` — Start Quiz Attempt

Starts an attempt on a published quiz, or resumes the student's attempt in progress.

**Response (201):** `{ "success": true, "message": "Quiz started", "data": { "attempt": { "_id": "64at1...", "...": "..." }, "...": "..." } }`

---

#### POST `/attempt/:attemptId/answer` — Submit Single Answer

Saves (or replaces) the answer to one question. Rejected once the time limit has passed.

**Request:**
```json
{
  "quizQuestionId": "64qq1a2b3c4d5e6f7a8b9c0d1",
  "selectedAnswer": "4"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "saved": true, "isCorrect": true, "marksObtained": 1 }
}
```

**Errors:** 400 (missing fields, `ALREADY_SUBMITTED`, `TIME_EXCEEDED`), 403, 404

---

#### POST `/attempt/:attemptId/submit` — Submit Quiz

Finalize attempt.

**Response (200):**
```json
{
  "success": true,
  "message": "Quiz submitted successfully",
  "data": {
    "attempt": { "_id": "64at1...", "status": "completed", "...": "..." },
    "results": {
      "totalQuestions": 20,
      "totalAnswered": 19,
      "correctAnswers": 16,
      "score": 16,
      "totalMarks": 20,
      "percentage": 80,
      "passed": true,
      "timeSpent": 1440
    }
  }
}
```

`timeSpent` is in seconds.

**Errors:** 400 (`ALREADY_SUBMITTED`), 403, 404

---

#### GET `/attempt/:attemptId` — Resume Attempt

Loads an attempt that is still in progress, with the answers saved so far. Correct answers are never included.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "attempt": {
      "_id": "64at1...",
      "quizId": "64qz1...",
      "quizTitle": "Midterm Practice",
      "status": "in_progress",
      "startedAt": "2026-10-10T09:00:00.000Z",
      "totalQuestions": 20,
      "settings": { "timeLimit": 30, "...": "..." }
    },
    "questions": [
      {
        "quizQuestionId": "64qq1...",
        "questionText": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"],
        "questionType": "mcq",
        "marks": 1,
        "explanation": null,
        "correctAnswer": null,
        "selectedAnswer": "4"
      }
    ]
  }
}
```

**Errors:** 400 (`NOT_IN_PROGRESS`), 403, 404

---

#### GET `/:quizId/in-progress` — Find Attempt in Progress

Same response as `GET /attempt/:attemptId` for the student's unfinished attempt on this quiz.

**Errors:** 404 (`NOT_FOUND`: no attempt in progress)

---

#### GET `/attempt/:attemptId/result` — Get Quiz Result

**Response (200):**
```json
{
  "success": true,
  "data": {
    "attempt": {
      "_id": "64at1...",
      "status": "completed",
      "startedAt": "2026-10-10T09:00:00.000Z",
      "submittedAt": "2026-10-10T09:24:00.000Z",
      "timeSpent": 1440,
      "totalQuestions": 20,
      "totalAnswers": 19,
      "correctAnswers": 16,
      "score": 16,
      "percentage": 80,
      "passed": true
    },
    "quiz": { "_id": "64qz1...", "title": "Midterm Practice", "totalMarks": 20, "passingPercentage": 50 },
    "questionDetails": [
      {
        "questionText": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"],
        "selectedAnswer": "4",
        "isCorrect": true,
        "marksObtained": 1,
        "timeTaken": 21,
        "correctAnswer": "4",
        "explanation": "..."
      }
    ],
    "showAnswers": true
  }
}
```

`correctAnswer` and `explanation` are `null` unless `showAnswers` is `true`, which follows the quiz's `showAnswersAfter` setting.

---

#### GET `/student/history` — Quiz History (Student)

Completed attempts, newest first.

**Query:** `?subjectId=...&page=1&limit=10`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "attempts": [
      {
        "_id": "64at1...",
        "status": "completed",
        "score": 16,
        "percentage": 80,
        "passed": true,
        "submittedAt": "2026-10-10T09:24:00.000Z",
        "quizId": { "_id": "64qz1...", "title": "Midterm Practice", "subjectId": { "_id": "...", "name": "Mathematics" }, "classId": { "_id": "...", "name": "Class 7" }, "...": "..." },
        "...": "..."
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 3, "pages": 1 }
  }
}
```

---

### 10. Teacher Dashboard

Three routers serve teachers and the people who manage them:

| Base | Auth | Purpose |
|------|------|---------|
| `/api/v1/teacher-dashboard/:teacherId/` | Teacher role required | Analytics on the students assigned to one teacher. `:teacherId` is the teacher's user ID |
| `/api/v1/teacher/` | Principal role required | Create, list, update and delete teacher accounts |
| `/api/v1/teacher-students/` | Teacher or Principal role required | Assign students to teachers |

A student counts as assigned once a teacher–student link exists for a subject (made with `POST /teacher-students/bulk`, or when the student joins a class link, see [Teacher Class Links](#22-teacher-class-links)). Mastery scores are between 0 and 1.

---

#### GET `/teacher-dashboard/:teacherId/my-assignments`

The teacher's subjects, classes and sections with student counts.

**Response (200):**
```json
{
  "success": true,
  "message": "Assignments fetched successfully",
  "data": {
    "teacher": { "_id": "64t1a2b3c4d5e6f7a8b9c0d1", "name": "Teacher Name", "image": "https://..." },
    "schoolName": "Springfield Academy",
    "assignments": [
      {
        "subjectId": "64f3a2b3c4d5e6f7a8b9c0d3",
        "subjectName": "Mathematics",
        "classes": [
          {
            "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
            "className": "Class 7",
            "sections": [ { "sectionId": "64sc1...", "name": "A", "studentCount": 28 } ],
            "totalStudents": 28
          }
        ],
        "totalStudents": 28
      }
    ],
    "totalStudentsAcrossSubjects": 28
  }
}
```

Links without a section are grouped under a section named `Default` (`sectionId: null`). A teacher with no links gets `assignments: []` and `schoolName: null`.

**Errors:** 404 (teacher not found)

---

#### GET `/teacher-dashboard/:teacherId/subject/:subjectId/dashboard`

Overview of one subject across the teacher's students.

**Response (200):**
```json
{
  "success": true,
  "message": "Subject dashboard fetched successfully",
  "data": {
    "subject": { "_id": "64f3a2b3c4d5e6f7a8b9c0d3", "name": "Mathematics" },
    "overview": {
      "totalStudents": 28,
      "activeThisWeek": 17,
      "avgSubjectMastery": 0.52,
      "avgSubjectCoverage": 64,
      "studentsNeedingHelp": 4
    },
    "chapterProgress": [
      {
        "chapterId": "64c1a2b3c4d5e6f7a8b9c0d4",
        "name": "Number Systems",
        "order": 1,
        "classAvgMastery": 0.61,
        "studentsCompleted": 6,
        "studentsInProgress": 15,
        "studentsNotStarted": 7,
        "status": "ON_TRACK"
      }
    ],
    "topWeakTopics": [
      { "topicId": "64tp1...", "name": "Integers", "chapterName": "Number Systems", "studentsWeak": 9 }
    ],
    "classSummary": [
      { "classId": "64f1...", "className": "Class 7", "sectionName": "A", "avgMastery": 0.52, "studentCount": 28 }
    ]
  }
}
```

- `activeThisWeek`: students with a session in the last 7 days. `studentsNeedingHelp`: average mastery below 0.4
- Chapter `status`: `NOT_STARTED`, `NEEDS_ATTENTION` (below 0.5), `ON_TRACK` (below 0.7) or `STRONG`
- `topWeakTopics`: up to 5 topics where at least a fifth of the students (minimum 1) are weak

**Errors:** 404 (no students assigned for this subject)

---

#### GET `/teacher-dashboard/:teacherId/subject/:subjectId/students`

The teacher's students in a subject, with their progress.

**Query:**

| Param | Values |
|-------|--------|
| `classId`, `sectionId` | Optional filters |
| `status` | `struggling` (needs help, or 3+ weak topics), `top` (strong), `inactive` (5+ days without a session) |
| `sortBy` | `name` (default), `mastery`, `coverage`, `lastPracticed` |
| `order` | `asc` (default) or `desc` |

**Response (200):**
```json
{
  "success": true,
  "message": "Students list fetched successfully",
  "data": {
    "totalCount": 1,
    "students": [
      {
        "studentId": "64s1a2b3c4d5e6f7a8b9c0d1",
        "name": "Aarav",
        "email": "student@example.com",
        "image": "https://...",
        "class": "Class 7",
        "section": "A",
        "subjectMastery": 0.58,
        "subjectCoverage": 45,
        "chaptersCompleted": 2,
        "totalChapters": 12,
        "lastPracticed": "2026-10-09T16:40:00.000Z",
        "status": "ON_TRACK",
        "weakTopicsCount": 1,
        "daysInactive": 0
      }
    ]
  }
}
```

Student `status`: `NOT_STARTED`, `NEEDS_HELP` (below 0.3), `NEEDS_REVISION` (below 0.5), `ON_TRACK` (below 0.7) or `STRONG`. A chapter counts as completed at an average mastery of 0.7.

---

#### GET `/teacher-dashboard/:teacherId/subject/:subjectId/chapter/:chapterId/analytics`

Topic-by-topic results for one chapter.

**Query:** `?classId=...&sectionId=...` (optional)

**Response (200):**
```json
{
  "success": true,
  "message": "Chapter analytics fetched successfully",
  "data": {
    "chapter": { "_id": "64c1a2b3c4d5e6f7a8b9c0d4", "name": "Number Systems", "order": 1 },
    "overview": { "totalTopics": 6, "classAvgCoverage": 75, "classAvgMastery": 0.55 },
    "topics": [
      {
        "topicId": "64tp1...",
        "name": "Integers",
        "classAvgMastery": 0.38,
        "masteryDistribution": { "MASTERED": 3, "PRACTICING": 6, "LEARNING": 7, "WEAK": 8 },
        "studentsAttempted": 24,
        "studentsTotal": 28,
        "status": "CRITICAL"
      }
    ],
    "strugglingStudents": [
      { "studentId": "64s2...", "name": "...", "image": "https://...", "masteryScore": 0.21, "weakTopics": 3 }
    ]
  }
}
```

Topic `status`: `NOT_STARTED`, `CRITICAL` (30% or more of the students who tried it are weak), `ON_TRACK` (average 0.7 or more) or `NEEDS_ATTENTION`. `strugglingStudents` (average below 0.4, or 2+ weak topics) holds up to 10, weakest first.

**Errors:** 404 (no students assigned)

---

#### GET `/teacher-dashboard/:teacherId/student/:studentId/subject/:subjectId/progress`

One student's progress in a subject.

**Response (200):**
```json
{
  "success": true,
  "message": "Student progress fetched successfully",
  "data": {
    "student": { "_id": "64s1...", "name": "Aarav", "email": "student@example.com", "image": "https://...", "class": "Class 7-A" },
    "subjectSummary": {
      "subjectId": "64f3...",
      "subjectName": "Mathematics",
      "overallMastery": 0.41,
      "overallCoverage": 35,
      "chaptersStarted": 4,
      "totalChapters": 12,
      "totalTimeSpent": 310,
      "lastActive": "2026-10-09T16:40:00.000Z"
    },
    "chapters": [ "...same items as GET /topic-progress/progress/subject/:subjectId chapters..." ],
    "weakTopics": [
      { "topicId": "64tp1...", "name": "Integers", "chapterName": "Number Systems", "masteryScore": 0.22 }
    ],
    "recommendations": ["Student has not started 8 chapters yet"]
  }
}
```

`totalTimeSpent` is in minutes. `weakTopics` holds up to 10.

**Errors:** 403 (`FORBIDDEN`: the teacher isn't assigned to this student for this subject)

---

#### GET `/teacher-dashboard/:teacherId/subject/:subjectId/weak-topics`

Topics the class finds hard.

**Query:** `?classId=...&sectionId=...&threshold=0.4` (`threshold` between 0 and 1, default 0.4)

**Response (200):**
```json
{
  "success": true,
  "message": "Weak topics fetched successfully",
  "data": {
    "totalWeakTopics": 1,
    "topics": [
      {
        "topicId": "64tp1...",
        "name": "Integers",
        "chapterName": "Number Systems",
        "studentsWeak": 9,
        "totalStudents": 24,
        "weakPercentage": 38,
        "avgMastery": 0.36,
        "difficulty": { "easyAccuracy": 0.71, "mediumAccuracy": 0.42, "hardAccuracy": 0.18 },
        "teacherAction": "MEDIUM_PRIORITY"
      }
    ],
    "classroomRecommendation": "Consider revisiting \"Number Systems\" focusing on Integers concept."
  }
}
```

A topic is listed when its average mastery is below `threshold` or 30% or more of the students who tried it are weak. `teacherAction`: `HIGH_PRIORITY` (40%+ weak), `MEDIUM_PRIORITY` (25%+) or `MONITOR`. Up to 20 topics, most weak students first.

---

#### GET `/teacher-dashboard/:teacherId/subject/:subjectId/activity`

Recent practice sessions by the teacher's students.

**Query:** `?limit=20` (1–100, default 20)

**Response (200):**
```json
{
  "success": true,
  "message": "Activity feed fetched successfully",
  "data": {
    "activities": [
      {
        "type": "SESSION_COMPLETED",
        "student": { "_id": "64s1...", "name": "Aarav", "image": "https://..." },
        "timestamp": "2026-10-09T16:40:00.000Z",
        "chapter": "Number Systems",
        "score": 8,
        "questionsAttempted": 10,
        "correctAnswers": 8
      }
    ]
  }
}
```

---

#### POST `/teacher` — Create Teacher

**Auth:** Principal role required.

Send one teacher object, or an array of them for a bulk create.

**Request:**
```json
{
  "name": "Teacher Name",
  "email": "teacher@example.com",
  "password": "secret123",
  "schoolId": "64sch1a2b3c4d5e6f7a8b9c0",
  "subject": ["64f3a2b3c4d5e6f7a8b9c0d3"],
  "class": ["64f1a2b3c4d5e6f7a8b9c0d2"]
}
```

`name`, `email`, `password` (6–128 characters) and `schoolId` are required.

**Response (201), one teacher:**
```json
{
  "success": true,
  "message": "Teacher created successfully",
  "data": { "_id": "64t1...", "name": "Teacher Name", "email": "teacher@example.com" }
}
```

**Response (200), array:** `message` is "Bulk creation completed" and `data` is `{ "success": [{ "_id", "name", "email", "accountType", "schoolId" }], "failed": [{ "email", "error" }] }`.

**Errors:** 400 (validation failed, `MISSING_FIELDS`, `USER_EXISTS`)

---

#### GET `/teacher/get-all` — List Teachers

**Auth:** Principal role required.

**Query:** `?schoolId=...` (optional)

**Response (200):** `message` "Teachers fetched successfully", `data` is an array of teacher user records with their profile (`additionalDetails`) populated.

---

#### PUT `/teacher/:id` — Update Teacher

**Auth:** Principal role required.

**Request:** any of `name`, `email`, `subject` (array of subject IDs), `class` (array of class IDs).

**Response (200):** `message` "Teacher updated successfully", `data` is the updated teacher.

**Errors:** 400 (`EMAIL_EXISTS`), 404 (`NOT_FOUND`)

---

#### DELETE `/teacher/:id` — Delete Teacher

**Auth:** Principal role required.

Deletes the teacher and all of their teacher–student links.

**Response (200):** `{ "success": true, "message": "Teacher deleted successfully", "data": null }`

**Errors:** 404 (`NOT_FOUND`)

---

#### POST `/teacher-students/bulk` — Assign Students

**Auth:** Teacher or Principal role required.

**Request:** an array of links.
```json
[
  {
    "teacher_id": "64t1a2b3c4d5e6f7a8b9c0d1",
    "student_id": "64s1a2b3c4d5e6f7a8b9c0d1",
    "class_id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "_subject_id": "64f3a2b3c4d5e6f7a8b9c0d3",
    "school_id": "64sch1a2b3c4d5e6f7a8b9c0",
    "section_id": "64sc1a2b3c4d5e6f7a8b9c0d"
  }
]
```

`section_id` is optional. Each student's `class` list also gains the link's class.

**Response (201):** `message` "Teacher-Student links created successfully", `data` is the array of created links.

**Errors:** 400 (validation failed)

---

#### GET `/teacher-students` — List Assignments

**Auth:** Teacher or Principal role required.

**Query:** `?schoolId=...` (required), plus optional `teacherId`, `classId`, `subjectId`, `sectionId`

**Response (200):** `message` "Teacher Students fetched successfully", `data` is an array of links with `teacher_id` and `student_id` (`name`, `email`), `class_id`, `section_id`, `_subject_id` and `school_id` populated.

**Errors:** 400 (`MISSING_FIELDS`: no `schoolId`)

---

### 11. Parent Dashboard

| Base | Auth | Purpose |
|------|------|---------|
| `/api/v1/parent-dashboard/` | Parent role required | The signed-in parent's linked children and their progress |
| `/api/v1/parent-students/` | See each endpoint | Link and unlink parents and students |

Every `/parent-dashboard/child/:childId/...` request checks that the child is linked to the signed-in parent; otherwise it returns `403` (`FORBIDDEN`).

---

#### GET `/parent-dashboard/children`

Children linked to the signed-in parent, primary child first.

**Response (200):**
```json
{
  "success": true,
  "message": "Children fetched successfully",
  "data": {
    "parent": { "_id": "64p1a2b3c4d5e6f7a8b9c0d1", "name": "Parent Name", "image": "https://..." },
    "children": [
      {
        "childId": "64s1a2b3c4d5e6f7a8b9c0d1",
        "name": "Aarav",
        "email": "student@example.com",
        "image": "https://...",
        "className": "Class 7",
        "sectionName": "A",
        "schoolName": "Springfield Academy",
        "relationship": "mother",
        "isPrimary": true,
        "currentStreak": 5,
        "longestStreak": 12,
        "practicedToday": false,
        "lastActive": "2026-10-09T16:40:00.000Z",
        "linkedAt": "2026-08-01T10:00:00.000Z"
      }
    ],
    "totalChildren": 1
  }
}
```

---

#### GET `/parent-dashboard/child/:childId/overview`

One child's dashboard.

**Params:** `childId`

**Response (200):**
```json
{
  "success": true,
  "message": "Child overview fetched successfully",
  "data": {
    "child": { "_id": "64s1...", "name": "Aarav", "email": "student@example.com", "image": "https://...", "className": "Class 7" },
    "overview": {
      "currentStreak": 5,
      "longestStreak": 12,
      "practicedToday": false,
      "streakFreezes": { "available": 1, "total": 1, "bonus": 0, "resetsOn": "2026-10-12T18:30:00.000Z" },
      "weeklyStudyMinutes": 95,
      "totalQuestions": 480,
      "overallAccuracy": 79
    },
    "todayStats": { "questionsAnswered": 12, "correctAnswers": 9, "timeSpent": 540, "accuracy": 75 },
    "subjects": [ "...same as subjects in GET /progress/user/:userId..." ],
    "lastStudiedChapter": { "subject": "Mathematics", "chapter": "Number Systems", "chapterId": "...", "studiedAt": "..." },
    "recentSessions": [ "...up to 5 most recent sessions..." ]
  }
}
```

---

#### GET `/parent-dashboard/child/:childId/subject/:subjectId/progress`

One child's progress in a subject.

**Response (200):**
```json
{
  "success": true,
  "message": "Child subject progress fetched successfully",
  "data": {
    "child": { "_id": "64s1...", "name": "Aarav", "image": "https://..." },
    "subjectSummary": {
      "subjectId": "64f3...",
      "overallMastery": 0.41,
      "overallCoverage": 35,
      "chaptersStarted": 4,
      "totalChapters": 12
    },
    "chapters": [ "...same items as GET /topic-progress/progress/subject/:subjectId chapters..." ],
    "weakTopics": [
      { "topicId": "64tp1...", "name": "Integers", "chapterName": "Number Systems", "chapterId": "64c1...", "masteryScore": 0.22, "state": "WEAK" }
    ]
  }
}
```

`weakTopics` holds up to 10.

---

#### GET `/parent-dashboard/child/:childId/subject/:subjectId/weak-topics`

Topics the child has tried and is weak in (state `WEAK`, or mastery below 0.4), weakest first.

**Response (200):**
```json
{
  "success": true,
  "message": "Child weak topics fetched successfully",
  "data": {
    "totalWeakTopics": 1,
    "topics": [
      {
        "topicId": "64tp1...",
        "name": "Integers",
        "subjectName": "Mathematics",
        "chapterName": "Number Systems",
        "chapterId": "64c1...",
        "masteryScore": 0.22,
        "masteryState": "WEAK",
        "totalAttempts": 9
      }
    ]
  }
}
```

---

#### GET `/parent-dashboard/child/:childId/activity`

The child's recent practice sessions, newest first.

**Query:** `?limit=20` (1–100, default 20)

**Response (200):**
```json
{
  "success": true,
  "message": "Child activity fetched successfully",
  "data": {
    "activities": [
      {
        "type": "SESSION_COMPLETED",
        "timestamp": "2026-10-09T16:40:00.000Z",
        "chapter": "Number Systems",
        "subject": "Mathematics",
        "chapterId": "64c1...",
        "subjectId": "64f3...",
        "score": 8,
        "questionsAttempted": 10,
        "correctAnswers": 8,
        "accuracy": 80,
        "duration": 420
      }
    ],
    "total": 1
  }
}
```

`duration` is in seconds.

---

#### POST `/parent-students/bulk` — Link Parent to Students

**Auth:** Teacher or Principal role required.

Links one parent to one or more students. Identify the parent by `parentEmails` (exactly one email) **or** `parentIds` (exactly one ID), not both.

**Request:**
```json
{
  "parentEmails": ["parent@example.com"],
  "studentIds": ["64s1a2b3c4d5e6f7a8b9c0d1"],
  "schoolId": "64sch1a2b3c4d5e6f7a8b9c0",
  "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "sectionId": "64sc1a2b3c4d5e6f7a8b9c0d",
  "relationship": "mother",
  "createParentsIfNotExist": true
}
```

`relationship` is `father`, `mother` or `guardian` (default). With `createParentsIfNotExist: true`, an unknown email gets a new Parent account. The first parent linked to a student is marked primary. Links that already exist are skipped.

**Response (201):** `message` "Parent-Student links created successfully", `data` is the array of new links (empty when all existed).

**Errors:** 400 (validation failed, `INVALID_DATA`, `INVALID_ACCOUNT_TYPE`), 404 (`PARENT_NOT_FOUND`, `STUDENTS_NOT_FOUND`)

---

#### GET `/parent-students` — List Links

**Auth:** Teacher or Principal role required.

**Query:** `?parentId=...&studentId=...` (both optional)

**Response (200):** `message` "Parent Students fetched successfully", `data` is an array of links with parent, student, class, section and school populated.

---

#### DELETE `/parent-students/unlink/:studentId` — Unlink a Child

**Auth:** Parent role required.

Removes the link between the signed-in parent and the student.

**Response (200):** `message` "Parent-Student link removed successfully", `data` is `{ "acknowledged": true, "deletedCount": 1 }`.

**Errors:** 404 (`LINK_NOT_FOUND`)

---

### 12. Question Paper

Base: `/api/v1/question-paper/`

**Auth:** signed in, except `POST /public/generate`. (The app shows the generator to teachers.)

---

#### POST `/` — Create Question Paper

Builds a paper from the question bank of the chosen chapters.

**Request:**
```json
{
  "title": "Unit Test 1",
  "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "subjectId": "64f3a2b3c4d5e6f7a8b9c0d3",
  "chapterIds": ["64c1a2b3c4d5e6f7a8b9c0d4", "64c2a2b3c4d5e6f7a8b9c0d5"],
  "config": {
    "totalQuestions": 10,
    "difficultyMix": { "easy": 4, "medium": 4, "hard": 2 },
    "questionTypes": ["mcq", "fillblanks"],
    "includeAnswerKey": true
  },
  "duration": 60,
  "schoolName": "Springfield Academy",
  "examName": "Unit Test",
  "instructions": []
}
```

- `difficultyMix` must add up to `totalQuestions`
- Questions are picked at random per difficulty; if a difficulty runs short, the paper is topped up from any difficulty
- Marks: Easy 1, Medium 2, Hard 3
- `duration` (minutes) defaults to 60, `examName` to "Examination", `questionTypes` to `["mcq"]`. With no `instructions`, four standard instructions are added

**Response (201):**
```json
{
  "success": true,
  "message": "Question paper generated with 10 questions (18 marks)",
  "data": {
    "_id": "64qp1a2b3c4d5e6f7a8b9c0d1",
    "title": "Unit Test 1",
    "classId": "64f1...",
    "subjectId": "64f3...",
    "chapterIds": ["64c1...", "64c2..."],
    "config": { "totalQuestions": 10, "difficultyMix": { "easy": 4, "medium": 4, "hard": 2 }, "questionTypes": ["mcq", "fillblanks"], "includeAnswerKey": true },
    "questionIds": ["64q1...", "..."],
    "totalMarks": 18,
    "duration": 60,
    "examName": "Unit Test",
    "instructions": ["All questions are compulsory.", "..."],
    "status": "generated",
    "createdAt": "2026-10-10T09:00:00.000Z"
  }
}
```

**Errors:** 400 (`INVALID_MIX`), 404 (`NO_QUESTIONS`: nothing matches)

---

#### POST `/public/generate` — Public Generation

Free sample paper for visitors (no sign-in). The name, school and contact are saved with the paper. At most 10 questions: a larger request is cut to 10 with a 4/4/2 easy/medium/hard mix.

**Request:**
```json
{
  "leadParams": {
    "name": "Teacher Name",
    "schoolName": "Springfield Academy",
    "contactInfo": "teacher@example.com"
  },
  "paperParams": {
    "title": "Practice Paper",
    "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
    "subjectId": "64f3a2b3c4d5e6f7a8b9c0d3",
    "chapterIds": ["64c1a2b3c4d5e6f7a8b9c0d4"],
    "config": { "totalQuestions": 5, "difficultyMix": { "easy": 2, "medium": 2, "hard": 1 } }
  }
}
```

**Response (201):** `message` "Your free question paper is generated successfully!", `data` is the paper (as above) plus `questions`, the full question objects, so the page can build the PDF.

**Errors:** 400 (missing `name`, `schoolName` or `contactInfo`; `INVALID_MIX`), 404 (`NO_QUESTIONS`)

---

#### GET `/history`

The signed-in user's papers, newest first. Deleted papers are left out.

**Query:** `?page=1&limit=10&classId=...&subjectId=...`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64qp1...",
      "title": "Unit Test 1",
      "classId": { "_id": "...", "name": "Class 7", "grade": 7 },
      "subjectId": { "_id": "...", "name": "Mathematics", "code": "..." },
      "totalMarks": 18,
      "createdAt": "2026-10-10T09:00:00.000Z",
      "...": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 }
}
```

`pagination` is at the top level, next to `data`.

---

#### GET `/:paperId/preview`

The paper with its class, subject and chapters populated, plus `questions` (the full question objects).

**Params:** `paperId`

**Response (200):** `{ "success": true, "data": { "_id": "64qp1...", "title": "Unit Test 1", "questions": [ { "questionText": "...", "options": ["..."], "correctAnswer": "...", "difficulty": "Easy", "...": "..." } ], "...": "..." } }`

**Errors:** 404 (`NOT_FOUND`)

---

#### GET `/:paperId/pdf`

Download the paper as an A4 PDF (with the answer key when `includeAnswerKey` is on).

**Params:** `paperId`

**Response:** PDF binary (`application/pdf`), `Content-Disposition: attachment; filename="question-paper-<paperId>.pdf"`

**Errors:** 404 (`NOT_FOUND`), 500 (`PDF_GENERATION_FAILED`)

---

#### DELETE `/:paperId`

Delete one of your own papers (it is hidden, not erased).

**Params:** `paperId`

**Response (200):**
```json
{
  "success": true,
  "message": "Question paper deleted successfully"
}
```

**Errors:** 404 (`NOT_FOUND`: no such paper, or not yours)

---

### 13. School & Sections

Base: `/api/v1/school/` and `/api/v1/sections/`

**Auth:** reads need a signed-in user; creating and changing schools and sections needs the Principal role.

---

#### POST `/school` — Create School

**Request:**
```json
{
  "schoolName": "Springfield Academy",
  "schoolCode": "SPR001",
  "schoolBoard": "CBSE",
  "schoolAddress": "123 Main Street",
  "schoolPhone": "+91 98765 43210",
  "schoolEmail": "office@example.com",
  "schoolWebsite": "https://example.com"
}
```

`schoolName`, `schoolCode` (unique), `schoolBoard` and `schoolAddress` are required.

**Response (201):**
```json
{
  "success": true,
  "message": "School created successfully",
  "data": {
    "_id": "64sch1a2b3c4d5e6f7a8b9c0",
    "schoolName": "Springfield Academy",
    "schoolCode": "SPR001",
    "board": "CBSE",
    "address": "123 Main Street",
    "phone": "+91 98765 43210",
    "email": "office@example.com",
    "website": "https://example.com",
    "kind": "school",
    "createdAt": "2026-10-10T09:00:00.000Z"
  }
}
```

`kind` is `school`, or `independent` for the private school created for a self-signed-up teacher's first class link.

**Errors:** 400 (`MISSING_FIELDS`), 409 (`DUPLICATE_CODE`)

---

#### GET `/school` — List Schools

**Query:** `?page=1&limit=20` (`limit` max 100)

**Response (200):**
```json
{
  "success": true,
  "message": "Schools fetched successfully",
  "data": {
    "schools": [ { "_id": "64sch1...", "schoolName": "Springfield Academy", "schoolCode": "SPR001", "...": "..." } ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
}
```

---

#### GET `/school/:id` — Get School

**Params:** `id`

**Response (200):** `message` "School fetched successfully", `data` is the school (same fields as above).

**Errors:** 404 (`SCHOOL_NOT_FOUND`)

---

#### PUT `/school/:id` — Update School

Only the name and code can be changed, and both are required.

**Request:**
```json
{
  "schoolName": "Springfield Academy",
  "schoolCode": "SPR002"
}
```

**Response (200):** `message` "School updated successfully", `data` is the updated school.

**Errors:** 400 (`MISSING_FIELDS`), 404 (`SCHOOL_NOT_FOUND`), 409 (`DUPLICATE_CODE`)

There is no endpoint to delete a school.

---

#### POST `/sections` — Create Section

**Request:**
```json
{
  "schoolId": "64sch1a2b3c4d5e6f7a8b9c0",
  "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "name": "a"
}
```

The name is stored in capitals, and `displayName` is "`<class name>`-`<NAME>`".

**Response (201):**
```json
{
  "success": true,
  "message": "Section created successfully",
  "data": {
    "_id": "64sc1a2b3c4d5e6f7a8b9c0d",
    "schoolId": "64sch1...",
    "classId": "64f1...",
    "name": "A",
    "displayName": "Class 7-A",
    "maxStrength": 40,
    "currentStrength": 0,
    "isActive": true,
    "createdAt": "2026-10-10T09:00:00.000Z"
  }
}
```

**Errors:** 400 (`MISSING_FIELDS`), 404 (`SCHOOL_NOT_FOUND`, `CLASS_NOT_FOUND`), 409 (`DUPLICATE_SECTION`)

---

#### POST `/sections/bulk` — Create Several Sections

**Request:**
```json
{
  "schoolId": "64sch1a2b3c4d5e6f7a8b9c0",
  "classId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "sections": ["A", "B", "C"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Bulk sections created successfully",
  "data": {
    "created": [ { "_id": "...", "name": "B", "displayName": "Class 7-B", "...": "..." } ],
    "skipped": [ { "name": "A", "reason": "Already exists" } ],
    "failed": []
  }
}
```

---

#### GET `/sections/school/:schoolId` — List Sections

Active sections of a school, with `classId` (`name`, `grade`) and `schoolId` (`schoolName`, `schoolCode`) populated.

**Response (200):** `message` "Sections fetched successfully", `data` is an array of sections.

---

#### GET `/sections/school/:schoolId/class/:classId` — List Sections of a Class

Same as above, for one class.

---

#### GET `/sections/:sectionId` — Get Section

**Response (200):** `message` "Section fetched successfully", `data` is the section with class and school populated.

**Errors:** 404 (`SECTION_NOT_FOUND`)

---

#### PUT `/sections/:sectionId` — Update Section

**Request:** `name` and/or `isActive`.
```json
{ "name": "D", "isActive": true }
```

A new name also updates `displayName`.

**Response (200):** `message` "Section updated successfully", `data` is the updated section.

**Errors:** 404 (`SECTION_NOT_FOUND`), 409 (`DUPLICATE_SECTION`)

---

#### DELETE `/sections/:sectionId` — Delete Section

Soft delete: sets `isActive` to `false`.

**Response (200):** `message` "Section deleted (soft delete)", `data` is the section.

**Errors:** 404 (`SECTION_NOT_FOUND`)

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

Base: `/api/v1/` (routes mounted at `/feedback`, `/logs` and `/stats`; the leaderboard is in [Gamification](#8-gamification), admin metrics in [Admin Metrics](#19-admin-metrics))

---

#### POST `/feedback`

Submit feedback from the public `/feedback` page or from inside the app. No sign-in needed; when a valid token is sent, the message is linked to that account.

**Rate limit:** 5 per hour.

**Request:**
```json
{
  "name": "Riya",
  "email": "user@example.com",
  "feedback": "The quiz timer resets on page reload",
  "source": "in_app",
  "context": { "path": "/quizzes", "questionId": "", "sessionId": "" }
}
```

`name` and `feedback` are required. `source` is `public_link` (default), `in_app` or `question_report`; `context` is optional. The form also has a hidden `website` field: a request that fills it in is answered with success but not saved.

**Response (200):**
```json
{
  "success": true,
  "message": "Feedback submitted successfully."
}
```

**Errors:** 400 (missing `name` or `feedback`), 429 (too many submissions)

---

#### GET `/feedback/admin`

The feedback inbox, newest first.

**Auth:** SuperAdmin.

**Query:** `?status=new&source=in_app&page=1&limit=20` (`status` and `source` accept `all`; `limit` max 100)

**Response (200):**
```json
{
  "success": true,
  "message": "Feedback fetched",
  "data": {
    "items": [
      {
        "_id": "6705e1a2b3c4d5e6f7a8b9c0",
        "name": "Riya",
        "email": "user@example.com",
        "message": "The quiz timer resets on page reload",
        "source": "in_app",
        "status": "new",
        "context": { "path": "/quizzes", "questionId": "", "sessionId": "" },
        "userId": { "_id": "...", "email": "user@example.com", "accountType": "Student" },
        "createdAt": "2026-10-10T09:00:00.000Z"
      }
    ],
    "counts": { "new": 3, "in_progress": 1, "resolved": 10, "archived": 2 },
    "pagination": { "page": 1, "limit": 20, "total": 16, "pages": 1 }
  }
}
```

---

#### PATCH `/feedback/admin/:id`

Triage one message.

**Auth:** SuperAdmin.

**Request:**
```json
{ "status": "resolved", "adminNote": "Fixed in the latest release" }
```

`status` is `new`, `in_progress`, `resolved` or `archived`. Both fields are optional.

**Response (200):** `message` "Feedback updated", `data` is the updated message.

**Errors:** 400 (`Invalid feedback id`, `Invalid status`), 404 (not found)

---

#### GET `/logs`

Stored API request logs, newest first.

**Auth:** SuperAdmin.

**Query:** all optional: `userId`, `sessionId`, `endpoint` (matches part of the path), `method`, `startDate`, `endDate`, `hasError=true`, `minProcessingTime`, `page` (default 1), `limit` (default 50)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [ "...log entries..." ],
    "pagination": { "currentPage": 1, "totalPages": 8, "totalItems": 391, "itemsPerPage": 50 }
  }
}
```

---

#### GET `/logs/stats`

**Auth:** SuperAdmin.

**Response (200):**
```json
{
  "success": true,
  "data": { "totalRequests": 391, "avgProcessingTime": 84.2, "maxProcessingTime": 2310, "errorCount": 7 }
}
```

---

#### DELETE `/logs`

Delete every stored API log.

**Auth:** SuperAdmin.

**Response (200):**
```json
{
  "success": true,
  "message": "All logs deleted",
  "data": { "deletedCount": 391 }
}
```

---

#### GET `/stats/public`

Platform totals for the landing page. No auth.

**Response (200):**
```json
{
  "success": true,
  "message": "Public stats fetched",
  "data": {
    "totalStudents": 1234,
    "totalSessions": 5678,
    "totalQuestionsAnswered": 91011
  }
}
```

Example values. `totalStudents` counts student and teacher accounts.

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

### 24. Health

Base: the server root (`http://localhost:4000/`), **not** `/api/v1`. No auth.

---

#### GET `/ping`

Liveness check. Skipped by the general rate limiter.

**Response (200):**
```json
{ "message": "Working Fine" }
```

`GET /` answers the same way for platform uptime probes, with `{ "message": "AskAide AI Backend is running" }`.

---

#### GET `/health`

Deep health check: reports whether MongoDB is connected. It goes through the general rate limiter like other routes.

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

`database` is `ok`, `connecting`, `disconnected` or `error`; anything but `ok` returns `503`.

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
  createdBy: string;
  title: string;
  description?: string;
  classId: string;
  subjectId: string;
  chapterIds: string[];
  sectionIds: string[];
  settings: {
    timeLimit: number | null;   // minutes
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showAnswersAfter: "immediately" | "submission" | "deadline" | "never";
    allowedAttempts: number;
    passingPercentage: number;
    deadline: Date | null;
  };
  status: "draft" | "published" | "closed";
  totalQuestions: number;
  totalMarks: number;
  publishedAt: Date | null;
  closedAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
}
```

### Chapter
```typescript
{
  _id: string;
  name: string;
  classId: string;
  subjectId: string;
  description?: string;
  order: number;
  isActive: boolean;
  hidden: boolean;
  ragIndexed: boolean;     // PDF finished indexing in the vector DB
  createdAt: Date;
}
```

### Topic
```typescript
{
  _id: string;
  title: string;
  slug: string;
  description?: string;
  keywords: string[];
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}
```

Topics are linked to chapters through a separate chapter-topic mapping (with an `order`), so a topic has no `chapterId` of its own.
