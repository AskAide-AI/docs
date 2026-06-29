# AskAide AI - API Documentation

**Last Updated:** 2026-02-16  
**Base URL:** `/api/v1`

> **Note:** For interactive API testing and the most up-to-date schema details, visit the **Swagger UI** at `http://localhost:4000/api-docs`.

---

## Table of Contents
- [Authentication](#authentication-apis)
- [Study Configuration](#study-configuration)
- [Chapters](#chapters)
- [Questions](#questions)
- [Sessions](#sessions)
- [Student Progress](#student-progress)
- [Sections](#sections)
- [Teacher-Student](#teacher-student)
- [Teacher Dashboard](#teacher-dashboard)
- [Quiz](#quiz)
- [Question Paper](#question-paper)
- [Schools](#schools)
- [Leaderboard](#leaderboard)

---

## Authentication APIs

> **Note:** Auth routes are available under `/api/v1/user/` (legacy) and `/api/v1/authenticate/`. The `/authenticate/` prefix is the primary path used by the frontend.

### POST /api/v1/authenticate/signup (or /api/v1/user/signup)
**Description:** Register a new user account  
**Authentication:** No

**Request Body:**
```json
{
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars)",
  "name": "string (required)",
  "role": "string (required, enum: student|teacher|admin|principal|parent)",
  "confirmPassword": "string (required)",
  "phone": "string (optional)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student"
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `409` - User already exists

---

### POST /api/v1/authenticate/login (or /api/v1/user/login)
**Description:** Login with email and password  
**Authentication:** No

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": { "id": "...", "email": "...", "role": "..." }
}
```

---

### POST /api/v1/authenticate/sendotp (or /api/v1/user/request-otp)
**Description:** Request OTP for login  
**Authentication:** No

**Request Body:**
```json
{ "email": "string (required)" }
```

---

### POST /api/v1/authenticate/verify-email (or /api/v1/user/verify-otp)
**Description:** Verify OTP and login  
**Authentication:** No

**Request Body:**
```json
{
  "email": "string (required)",
  "otp": "string (required, 6 digits)"
}
```

---

### POST /api/v1/auth/changepassword
**Description:** Change password for authenticated user  
**Authentication:** Yes

---

## User Management

### POST /api/v1/student/create
**Description:** Create one or multiple students  
**Authentication:** Yes (Admin/Principal/Teacher)

**Request Body:**
- **Single:** `{ ...studentData }`
- **Bulk:** `[ { ...studentData }, ... ]` or `{ "students": [ { ...studentData }, ... ] }`

**Student Data Structure:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required)",
  "schoolId": "string (required, ObjectId)",
  "class": ["class_id_1", "class_id_2"]
}
```

**Response:**
Returns success/failure report for bulk operations.

---

### GET /api/v1/student/get-all
**Description:** Get all students  
**Authentication:** Yes

**Query Parameters:**
- `schoolId` - Filter by School ID

---

### POST /api/v1/teacher
**Description:** Create one or multiple teachers  
**Authentication:** Yes (Admin/Principal)

**Request Body:**
- **Single:** `{ ...teacherData }`
- **Bulk:** `[ { ...teacherData }, ... ]` or `{ "teachers": [ { ...teacherData }, ... ] }`

**Teacher Data Structure:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required)",
  "schoolId": "string (required, ObjectId)",
  "subject": ["subject_name_1"],
  "class": ["class_id_1"]
}
```

---

### GET /api/v1/teacher/get-all
**Description:** Get all teachers  
**Authentication:** Yes

**Query Parameters:**
- `schoolId` - Filter by School ID

---

## Study Configuration

### GET /api/v1/study/configuration
**Description:** Get all classes with their subjects  
**Authentication:** No

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "class_id",
      "name": "9th",
      "grade": 9,
      "subjects": [
        { "_id": "subject_id", "name": "Mathematics", "code": "MAT" }
      ]
    }
  ]
}
```

---

## Chapters

### GET /api/v1/chapters/class/:classId/subject/:subjectId
**Description:** Get chapters for a class and subject with topic status  
**Authentication:** Yes

**Parameters:**
- `classId` - Class ObjectId
- `subjectId` - Subject ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "chapter_id",
      "name": "Algebra",
      "order": 1,
      "topics": [...],
      "isStartable": true
    }
  ]
}
```

---

### POST /api/v1/chapters/create-with-pdf
**Description:** Create chapter with PDF upload and trigger AI document processing  
**Authentication:** Yes (Admin/Teacher)  
**Content-Type:** multipart/form-data

**Request Body:**
- `chapter_name` - Chapter name (required when `chapter_id` is not provided)
- `class_id` - Class ObjectId (required when creating a new chapter)
- `subject_id` - Subject ObjectId (required when creating a new chapter)
- `chapter_id` - Existing chapter ObjectId (optional, for re-upload)
- `pdf` - PDF file

---

### DELETE /api/v1/chapters
**Description:** Delete multiple chapters and attempt deletion in AI service  
**Authentication:** Yes (Admin/Teacher)

**Request Body:**
```json
{
  "classId": "class_id",
  "subjectId": "subject_id",
  "chapterIds": ["chapter_id_1", "chapter_id_2"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Chapters deleted successfully from Backend and AI Service",
  "data": {
    "total": 2,
    "deleted": 2,
    "failed": 0,
    "errors": []
  }
}
```

---

### POST /api/v1/chapters/check-rag-status
**Description:** Check AI/RAG availability for one or more chapters  
**Authentication:** Yes (Admin/Teacher)

**Request Body:**
```json
{
  "classId": "class_id",
  "subjectId": "subject_id",
  "chapterIds": ["chapter_id_1", "chapter_id_2"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "RAG status checked successfully",
  "data": {
    "classId": "class_id",
    "subjectId": "subject_id",
    "results": [
      { "chapterId": "chapter_id_1", "found": true, "status": "success" },
      { "chapterId": "chapter_id_2", "found": false, "status": "error" }
    ]
  }
}
```

---

## Questions

### GET /api/v1/questions/chapter/:chapterId
**Description:** Get all questions for a chapter  
**Authentication:** Yes

### GET /api/v1/questions/chapter/:chapterId/type/:questionType
**Description:** Get questions by type (mcq/fillblanks)  
**Authentication:** Yes

### GET /api/v1/questions/chapter/:chapterId/type/:type/difficulty/:difficulty
**Description:** Get questions by type and difficulty  
**Authentication:** Yes

**Parameters:**
- `questionType` - enum: `mcq`, `fillblanks`
- `difficulty` - enum: `Easy`, `Medium`, `Hard`

---

### GET /api/v1/questions/batch/chapter/:chapterId/type/:questionType/difficulty/:difficulty/session/:sessionId
**Description:** Non-blocking status check for on-demand question generation. Returns existing questions immediately alongside a `status` field for the frontend to drive polling/practice flow.  
**Authentication:** Yes

**Path Parameters:**
- `chapterId` - Chapter ObjectId
- `questionType` - enum: `mcq`, `fillblanks`
- `difficulty` - enum: `Easy`, `Medium`, `Hard`
- `sessionId` - Practice Session ObjectId

**Query Parameters:**
- `retry` (boolean, optional) — Force re-generate if current job is `failed`
- `limit` (number, optional) — Max questions to return (default: 10)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [ ...existing questions... ],
    "status": "generating"
  }
}
```

**Status Values:**
- `generating` — AI generation is in progress; frontend should poll every 3-5s
- `failed` — AI generation failed; frontend can pass `?retry=true` to retry
- `mastered` — Yield-based mastery detected; no more questions to generate

**Flow:**
1. First call creates a `QuestionGenerationJob` (status: `generating`) and fires `_startBackgroundGeneration()` in the background
2. Response returns immediately — frontend polls with same params
3. Subsequent calls return accumulated questions + current status
4. Failed jobs auto-recover after 2 min cooldown

---

## Sessions

### POST /api/v1/sessions
**Description:** Create practice session  
**Authentication:** Yes

**Request Body:**
```json
{
  "userId": "user_id",
  "classId": "class_id",
  "subject": "Mathematics",
  "chapter": "Algebra",
  "questionType": "mcq",
  "difficulty": "Medium"
}
```

---

### PATCH /api/v1/sessions/:id/end
**Description:** End session with score  
**Authentication:** Yes

**Request Body:**
```json
{ "score": 85 }
```

---

### GET /api/v1/sessions/user/:userId
**Description:** Get user's session history  
**Authentication:** Yes

---

## Student Progress

### POST /api/v1/student-progress/update
**Description:** Update topic progress after session  
**Authentication:** Yes

**Request Body:**
```json
{
  "userId": "user_id",
  "sessionId": "session_id"
}
```

---

### GET /api/v1/student-progress/progress/:userId/chapter/:chapterId
**Description:** Get chapter mastery breakdown  
**Authentication:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "chapterCoverage": 75,
    "chapterMastery": 68,
    "stats": {
      "totalTopics": 8,
      "attemptedTopics": 6,
      "masteredTopics": 3
    },
    "topics": [
      {
        "topicId": "...",
        "topicName": "Linear Equations",
        "masteryScore": 0.85,
        "masteryState": "MASTERED",
        "totalAttempts": 12
      }
    ]
  }
}
```

---

### GET /api/v1/student-progress/progress/:userId/subject/:subjectId
**Description:** Get subject-level aggregated progress  
**Authentication:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "subjectId": "...",
    "subjectCoverage": 60,
    "subjectMastery": 55,
    "chaptersStarted": 2,
    "totalChapters": 5,
    "chapterBreakdown": {
      "not_started": 3,
      "weak": 0,
      "needs_revision": 0,
      "good": 1,
      "strong": 1
    },
    "chapters": [
      {
        "chapterId": "...",
        "name": "Algebra",
        "status": "STRONG", // or NOT_STARTED, WEAK, etc.
        "totalTopics": 10,
        "attemptedTopics": 8,
        "masteryScore": 0.85,
        "coveragePercentage": 80,
        "topics": [...]
      }
    ]
  }
}
```

---

### GET /api/v1/student-progress/chapter/:chapterId/ai-insights
**Description:** Get AI-powered chapter insights  
**Authentication:** Yes

---

### GET /api/v1/student-progress/subject/:subjectId/ai-insights
**Description:** Get AI-powered subject insights  
**Authentication:** Yes

---

## Sections

### POST /api/v1/sections
**Description:** Create class section  
**Authentication:** Yes (Admin)

**Request Body:**
```json
{
  "name": "A",
  "schoolId": "school_id",
  "classId": "class_id"
}
```

---

### GET /api/v1/sections/school/:schoolId/class/:classId
**Description:** Get sections for school and class  
**Authentication:** Yes

---

## Teacher-Student

### POST /api/v1/teacher-students/bulk
**Description:** Bulk assign students to teachers  
**Authentication:** Yes

**Request Body:**
```json
{
  "data": [
    {
      "teacher_id": "teacher_id",
      "student_id": "student_id",
      "class_id": "class_id",
      "_subject_id": "subject_id",
      "school_id": "school_id",
      "section_id": "section_id (optional)"
    }
  ]
}
```

**Note:** This endpoint automatically syncs the `class_id` to the student's `class` list (Optimized School Affiliation).

---

### GET /api/v1/teacher-students
**Description:** Get teacher-student relationships  
**Authentication:** Yes

**Query Parameters:**
- `schoolId` - School ID (Required)
- `teacherId` - Filter by Teacher ID
- `classId` - Filter by Class ID
- `subjectId` - Filter by Subject ID
- `sectionId` - Filter by Section ID

**Response:**
Returns list of teacher-student links with populated fields.

---

---

## Teacher Dashboard

### GET /api/v1/teacher-dashboard/:teacherId/my-assignments
**Description:** Get all subjects and classes assigned to the teacher  
**Authentication:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "teacher": { "_id": "...", "name": "...", "image": "..." },
    "schoolName": "School Name",
    "assignments": [
      {
        "subjectId": "...",
        "subjectName": "Mathematics",
        "classes": [...],
        "totalStudents": 67
      }
    ]
  }
}
```

---

### GET /api/v1/teacher-dashboard/:teacherId/subject/:subjectId/dashboard
**Description:** Subject overview dashboard with chapter progress and weak topics  
**Authentication:** Yes

---

### GET /api/v1/teacher-dashboard/:teacherId/subject/:subjectId/students
**Description:** List students with progress for a subject  
**Authentication:** Yes

**Query Parameters:**
- `classId` - Filter by class
- `sectionId` - Filter by section
- `status` - Filter by status: `struggling`, `top`, `inactive`
- `sortBy` - Sort field: `name`, `mastery`, `coverage`, `lastPracticed`
- `order` - Sort order: `asc`, `desc`

---

### GET /api/v1/teacher-dashboard/:teacherId/subject/:subjectId/chapter/:chapterId/analytics
**Description:** Detailed analytics for a specific chapter  
**Authentication:** Yes

**Query Parameters:**
- `classId` - Filter by class
- `sectionId` - Filter by section

---

### GET /api/v1/teacher-dashboard/:teacherId/student/:studentId/subject/:subjectId/progress
**Description:** Individual student's detailed progress for a subject  
**Authentication:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "student": {
      "_id": "...",
      "name": "Student Name",
      "email": "...",
      "image": "...",
      "class": "9th-A"
    },
    "subjectSummary": {
      "subjectId": "...",
      "subjectName": "Mathematics",
      "overallMastery": 0.75,
      "overallCoverage": 80,
      "chaptersStarted": 4,
      "totalChapters": 10,
      "totalTimeSpent": 120, // minutes
      "lastActive": "2024-04-15T..."
    },
    "chapters": [
      {
        "chapterId": "...",
        "name": "Algebra",
        "status": "STRONG",
        "totalTopics": 5,
        "attemptedTopics": 5,
        "masteryScore": 0.85,
        "coveragePercentage": 100,
        "topics": [...]
      }
    ],
    "weakTopics": [...],
    "recommendations": ["Result string..."]
  }
}
```

---

### GET /api/v1/teacher-dashboard/:teacherId/subject/:subjectId/weak-topics
**Description:** Topics where students are struggling  
**Authentication:** Yes

**Query Parameters:**
- `classId` - Filter by class
- `sectionId` - Filter by section
- `threshold` - Mastery threshold (default: 0.4)

---

### GET /api/v1/teacher-dashboard/:teacherId/subject/:subjectId/activity
**Description:** Recent student activity feed  
**Authentication:** Yes

**Query Parameters:**
- `limit` - Max activities to return (default: 20)

---

## Quiz

### Teacher Quiz Management

#### POST /api/v1/quiz
**Description:** Create a new quiz (draft status)  
**Authentication:** Yes (Teacher)

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string",
  "classId": "string (required)",
  "subjectId": "string (required)",
  "chapterIds": ["chapter_id_1"],
  "sectionIds": ["section_id_1"],
  "settings": {
    "timeLimit": 30,
    "shuffleQuestions": true,
    "shuffleOptions": true,
    "showAnswersAfter": "submission",
    "allowedAttempts": 1,
    "passingPercentage": 60,
    "deadline": "2026-02-01T23:59:59Z"
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Quiz created successfully",
  "data": { "quiz": { "_id": "...", "title": "...", "status": "draft" } }
}
```

---

#### GET /api/v1/quiz/:quizId
**Description:** Get quiz details with questions  
**Authentication:** Yes

---

#### PUT /api/v1/quiz/:quizId
**Description:** Update quiz (draft only)  
**Authentication:** Yes (Quiz owner)

---

#### DELETE /api/v1/quiz/:quizId
**Description:** Delete quiz  
**Authentication:** Yes (Quiz owner)

**Query Parameters:**
- `forceDelete` - Force delete active published quiz (boolean)

**Note:** Draft quizzes are hard-deleted. Published/closed quizzes are soft-deleted.

---

#### GET /api/v1/quiz/teacher/:teacherId
**Description:** Get teacher's quizzes with filtering  
**Authentication:** Yes

**Query Parameters:**
- `status` - Filter: `draft`, `published`, `closed`
- `subjectId` - Filter by subject
- `classId` - Filter by class
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)

---

#### POST /api/v1/quiz/:quizId/publish
**Description:** Publish quiz (makes it available to students)  
**Authentication:** Yes (Quiz owner)

---

#### POST /api/v1/quiz/:quizId/close
**Description:** Close quiz (prevents new attempts)  
**Authentication:** Yes (Quiz owner)

---

#### POST /api/v1/quiz/:quizId/clone
**Description:** Clone quiz as new draft  
**Authentication:** Yes (Quiz owner)

---

#### GET /api/v1/quiz/:quizId/analytics
**Description:** Get quiz analytics (attempt stats, question analysis)  
**Authentication:** Yes (Quiz owner)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalStudents": 67,
      "attempted": 52,
      "avgScore": 72.5,
      "passRate": 0.85
    },
    "questionAnalysis": [...],
    "topPerformers": [...],
    "strugglingStudents": [...]
  }
}
```

---

### Question Management

#### GET /api/v1/quiz/questions/search
**Description:** Search questions from question bank for adding to quiz  
**Authentication:** Yes (Teacher)

**Query Parameters:**
- `chapterIds` - Comma-separated chapter IDs (required)
- `classId` - Class ID (required)
- `subjectId` - Subject ID (required)
- `questionType` - Filter: `mcq`, `fillblanks`
- `difficulty` - Filter: `Easy`, `Medium`, `Hard`
- `search` - Search text
- `excludeQuizId` - Exclude already-added questions
- `page`, `limit` - Pagination

---

#### POST /api/v1/quiz/:quizId/questions
**Description:** Add questions to quiz  
**Authentication:** Yes (Quiz owner, draft only)

**Request Body:**
```json
{
  "questions": [
    { "questionId": "existing_question_id", "marks": 1 },
    { "customQuestion": { "questionText": "...", "options": [...], "correctAnswer": "A" }, "marks": 2 }
  ]
}
```

---

#### DELETE /api/v1/quiz/:quizId/questions/:questionId
**Description:** Remove question from quiz  
**Authentication:** Yes (Quiz owner, draft only)

---

#### PUT /api/v1/quiz/:quizId/questions/reorder
**Description:** Reorder questions in quiz  
**Authentication:** Yes (Quiz owner, draft only)

---

### Student Quiz Operations

#### GET /api/v1/quiz/student/available
**Description:** Get available quizzes for student  
**Authentication:** Yes (Student)

**Query Parameters:**
- `subjectId` - Filter by subject
- `classId` - Filter by class

---

#### POST /api/v1/quiz/:quizId/start
**Description:** Start a quiz attempt  
**Authentication:** Yes (Student)

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "attempt": { "_id": "...", "status": "in_progress" },
    "questions": [...],
    "quiz": { "title": "...", "settings": { "timeLimit": 30 } }
  }
}
```

---

#### POST /api/v1/quiz/attempt/:attemptId/answer
**Description:** Submit answer for a question  
**Authentication:** Yes (Attempt owner)

**Request Body:**
```json
{
  "quizQuestionId": "string",
  "selectedAnswer": "A"
}
```

---

#### POST /api/v1/quiz/attempt/:attemptId/submit
**Description:** Submit entire quiz  
**Authentication:** Yes (Attempt owner)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "results": {
      "totalQuestions": 10,
      "correctAnswers": 8,
      "score": 16,
      "percentage": 80,
      "passed": true
    }
  }
}
```

---

#### GET /api/v1/quiz/attempt/:attemptId/result
**Description:** Get attempt result with question details  
**Authentication:** Yes (Attempt owner)

---

#### GET /api/v1/quiz/student/history
**Description:** Get student's quiz history  
**Authentication:** Yes (Student)

**Query Parameters:**
- `subjectId` - Filter by subject
- `page`, `limit` - Pagination

---

## Question Paper

### POST /api/v1/question-paper
**Description:** Generate a question paper using selected class/subject/chapters and difficulty mix  
**Authentication:** Yes (Teacher)

**Request Body:**
```json
{
  "title": "Mid-Term Exam",
  "classId": "class_id",
  "subjectId": "subject_id",
  "chapterIds": ["chapter_id_1", "chapter_id_2"],
  "config": {
    "totalQuestions": 20,
    "difficultyMix": { "easy": 8, "medium": 8, "hard": 4 },
    "questionTypes": ["mcq", "fillblanks"],
    "includeAnswerKey": true
  },
  "duration": 60,
  "schoolName": "Sample School",
  "examName": "Term 1 Examination",
  "instructions": ["All questions are compulsory."]
}
```

---

### GET /api/v1/question-paper/history
**Description:** Get generated question paper history for the logged-in teacher  
**Authentication:** Yes (Teacher)

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)
- `classId` - Filter by class
- `subjectId` - Filter by subject

---

### GET /api/v1/question-paper/:paperId/preview
**Description:** Get a generated paper with populated question details for preview  
**Authentication:** Yes (Teacher)

---

### GET /api/v1/question-paper/:paperId/pdf
**Description:** Download generated question paper as PDF  
**Authentication:** Yes (Teacher)

---

### POST /api/v1/question-paper/public/generate
**Description:** Generate a free question paper and deliver via WhatsApp (Lead Magnet)  
**Authentication:** No

**Request Body:**
```json
{
  "leadParams": {
    "name": "string (required)",
    "schoolName": "string (required)",
    "whatsappNumber": "string (required, e.g., 919876543210)"
  },
  "paperParams": {
    "classId": "string (required)",
    "subjectId": "string (required)",
    "chapterIds": ["string (required)"]
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Paper generated and sent via WhatsApp",
  "data": { "leadId": "...", "paperId": "..." }
}
```

---

### DELETE /api/v1/question-paper/:paperId
**Description:** Soft delete a generated question paper  
**Authentication:** Yes (Teacher)

---

## Feedback

### POST /api/v1/feedback
**Description:** Submit user feedback  
**Authentication:** Yes

**Request Body:**
```json
{
  "type": "string (bug, feature, general)",
  "message": "string (required)",
  "metadata": "object (optional)"
}
```

---

## Schools

### POST /api/v1/schools
**Description:** Create school  
**Authentication:** Yes (Admin)

### GET /api/v1/schools
**Description:** List all schools  
**Authentication:** Yes

### GET /api/v1/schools/:id
**Description:** Get school details  
**Authentication:** Yes

---

## Leaderboard

### GET /api/v1/leaderboard
**Description:** Get global leaderboard  
**Authentication:** Yes

### GET /api/v1/leaderboard/class/:classId
**Description:** Get class-specific leaderboard  
**Authentication:** Yes

### GET /api/v1/leaderboard/subject/:subjectId
**Description:** Get subject-specific leaderboard  
**Authentication:** Yes

---

## AI Assistant (Teacher Content Generation)

### POST /api/v1/ai-assistant
**Description:** Generate content (quiz, notes, worksheet, assignment, paper) from teacher prompt  
**Authentication:** Yes (Teacher)

### POST /api/v1/ai-assistant/continue
**Description:** Follow-up clarification on previous generation  
**Authentication:** Yes (Teacher)

### GET /api/v1/ai-assistant/classes
**Description:** Get classes the AI agent has access to  
**Authentication:** Yes (Teacher)

### GET /api/v1/ai-assistant/tasks
**Description:** Get active agent task list  
**Authentication:** Yes (Teacher)

### GET /api/v1/ai-assistant/health
**Description:** Agent health check  
**Authentication:** Yes (Teacher)

### POST /api/v1/ai-assistant/stream
**Description:** Streamed content generation  
**Authentication:** Yes (Teacher)

### Conversation Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/ai-assistant/conversations` | POST | Create conversation |
| `/api/v1/ai-assistant/conversations` | GET | List conversations |
| `/api/v1/ai-assistant/conversations/:id/messages` | GET | Get conversation messages |
| `/api/v1/ai-assistant/conversations/:id/messages` | POST | Add message to conversation |
| `/api/v1/ai-assistant/conversations/:id` | DELETE | Delete conversation |
| `/api/v1/ai-assistant/export/:id` | GET | Export generated content |

---

## Daily Goal Management

### GET /api/v1/goals
**Description:** Get current daily goals for the authenticated user  
**Authentication:** Yes

### PUT /api/v1/goals
**Description:** Update daily goals (e.g., questions per day target)  
**Authentication:** Yes

**Request Body:**
```json
{
  "dailyGoal": 20
}
```

---

## Referral System

### GET /api/v1/referral/my-code
**Description:** Get authenticated user's referral code  
**Authentication:** Yes

### POST /api/v1/referral/redeem/:code
**Description:** Redeem a referral code  
**Authentication:** Yes

---

## Parent Dashboard

### Parent-Student Links
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/parent-students/bulk` | POST | Bulk link students to parent |
| `/api/v1/parent-students/links` | GET | Get parent-student links |
| `/api/v1/parent-students/unlink/:studentId` | DELETE | Unlink a student |

### Parent Dashboard Data
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/parent-dashboard/children` | GET | Get linked children overview |
| `/api/v1/parent-dashboard/child/:studentId/overview` | GET | Child's overall progress |
| `/api/v1/parent-dashboard/child/:studentId/subject/:subjectId/progress` | GET | Subject-specific progress |
| `/api/v1/parent-dashboard/child/:studentId/subject/:subjectId/weak-topics` | GET | Child's weak topics |

---

## Gamification & Progress Enhancement

### Streak Tracking
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/streaks/:userId` | GET | Get current streak data |
| `/api/v1/streaks/:userId/use-freeze` | POST | Use a streak freeze |

### Daily Challenge
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/daily-challenge/:userId` | GET | Get today's challenge |
| `/api/v1/daily-challenge/:userId/complete` | POST | Mark challenge complete |
| `/api/v1/daily-challenge/:userId/history` | GET | Challenge history |

### Badge/Achievement System
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/badges/:userId` | GET | Get user badges |
| `/api/v1/badges/check` | POST | Real-time badge eligibility check |

### Session Feedback
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/session-feedback/reaction` | POST | Submit emoji reaction |
| `/api/v1/session-feedback/nps` | POST | Submit NPS score (0-10) |
| `/api/v1/session-feedback/nps/check/:userId` | GET | Check if NPS survey is due |
| `/api/v1/session-feedback/stats` | GET | Feedback statistics |
| `/api/v1/session-feedback/nps/stats` | GET | NPS statistics |

---

## Platform & Logging

### Public Stats
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/stats/public` | GET | Public platform statistics (users, questions, etc.) |

### API Logs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/logs` | GET | Get API request logs |
| `/api/v1/logs` | DELETE | Clear logs |
| `/api/v1/logs/stats` | GET | Log statistics |

---

## Error Response Format

All errors follow this structure:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev only)"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error
