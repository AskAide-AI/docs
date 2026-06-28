# AskAide AI — EdTech Backend

:::info Full-stack setup lives in Getting Started
For the end-to-end local setup (infrastructure + Backend + AI Service + Frontend), follow the canonical [Getting Started](/docs/reference/getting-started) guide. This page covers **backend-specific** details only.
:::

Welcome to the AskAide AI Backend repository! This project provides a comprehensive EdTech platform for students, teachers, and schools, featuring AI-powered question generation, mastery-based progress tracking, automated quiz management, and teacher analytics.

## Engineering Standards (Skills)

This project strictly adheres to codified engineering standards for backend development. Please refer to the `.agent/skills/` directory for detailed guidelines before contributing:

- **api-module-scaffold**: Structure for new modules, services, controllers, and routes
- **api-security**: Authentication, role-based access, and password handling
- **backend-testing**: Jest/ESM setup and mocking conventions for services
- **database-patterns**: Mongoose schema design, query optimization, and performance
- **deployment-ops**: Server startup, environment config, Winston logging, and Render deployment

# Question API Documentation

This document outlines the Question and Session API endpoints available in the application.

## Models

### Question Model
```javascript
{
  chapterId: ObjectId,        // Reference to Chapter model
  questionText: String,     // Required
  options: [String],        // For MCQ questions
  correctAnswer: String,    // Required
  explanation: String,      // Required
  questionType: String,     // Required, enum: ['mcq', 'fillblanks']
  difficulty: String,       // Required, enum: ['Easy', 'Medium', 'Hard']
  createdAt: Date          // Auto-generated
}
```

### Session Model
```javascript
{
  userId: ObjectId,         // Reference to User model
  classId: ObjectId,        // Reference to Class model
  subject: String,          // Required
  chapter: String,          // Required
  questionType: String,     // Required, enum: ['mcq', 'fillblanks']
  difficulty: String,       // Required, enum: ['Easy', 'Medium', 'Hard']
  score: Number,            // Default: 0
  createdAt: Date,          // Auto-generated
  endedAt: Date             // Optional, set when session ends
}
```

### Class Model
```javascript
{
  grade: Number,            // Required, min: 6, max: 12
  name: String,             // Required, enum: ['6th', '7th', '8th', '9th', '10th', '11th', '12th']
  isActive: Boolean         // Default: true
}
```

### Subject Model
```javascript
{
  name: String,             // Required, enum of subject names
  code: String,             // Required, auto-generated from name
  classId: ObjectId,        // Reference to Class model
  isActive: Boolean         // Default: true
}
```

### Chapter Model
```javascript
{
  name: String,             // Required
  subjectId: ObjectId,      // Reference to Subject model
  classId: ObjectId,        // Reference to Class model
  order: Number,            // Required, for ordering chapters
  isActive: Boolean         // Default: true
}
```

## API Endpoints

### Study Configuration API

#### Get Study Configuration
- **URL**: `/api/v1/study/configuration`
- **Method**: GET
- **Description**: Returns all active classes with their subjects
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "class_id",
        "name": "6th",
        "grade": 6,
        "subjects": [
          {
            "_id": "subject_id",
            "name": "Mathematics",
            "code": "MAT"
          }
        ]
      }
    ]
  }
  ```

### Chapters API

#### Get Chapters by Class and Subject
- **URL**: `/api/v1/chapters/class/:classId/subject/:subjectId`
- **Method**: GET
- **Description**: Returns all active chapters for a specific class and subject
- **Parameters**: 
  - `classId`: ID of the class
  - `subjectId`: ID of the subject
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "chapter_id",
        "name": "Chapter Name",
        "order": 1
      }
    ]
  }
  ```

### Class APIs

#### Get All Classes
- **URL**: `/api/v1/classes`
- **Method**: GET
- **Description**: Returns all active classes sorted by grade
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      { "_id": "...", "grade": 6, "name": "6th", "isActive": true },
      { "_id": "...", "grade": 7, "name": "7th", "isActive": true },
      ...
    ]
  }
  ```

### Subject APIs

#### Get All Subjects
- **URL**: `/api/v1/subjects`
- **Method**: GET
- **Description**: Returns all active subjects with class information
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      { 
        "_id": "...", 
        "name": "Mathematics", 
        "code": "MAT", 
        "classId": { "_id": "...", "name": "6th", "grade": 6 },
        "isActive": true 
      },
      ...
    ]
  }
  ```

#### Get Subjects by Class
- **URL**: `/api/v1/subjects/class/:classId`
- **Method**: GET
- **Description**: Returns all active subjects for a specific class
- **Parameters**: `classId` (in URL)
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      { "_id": "...", "name": "Mathematics", "code": "MAT", "classId": "...", "isActive": true },
      { "_id": "...", "name": "English", "code": "ENG", "classId": "...", "isActive": true },
      ...
    ]
  }
  ```

### Question APIs

#### Create Question
- **URL**: `/api/v1/questions`
- **Method**: POST
- **Description**: Create a new question
- **Request Body**:
  ```json
  {
    "chapterId": "chapter_id",
    "questionText": "What is 2+2?",
    "options": ["3", "4", "5", "6"],
    "correctAnswer": "4",
    "explanation": "Basic addition",
    "questionType": "mcq",
    "difficulty": "Easy"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "...",
      "chapterId": "...",
      "questionText": "What is 2+2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": "4",
      "explanation": "Basic addition",
      "questionType": "mcq",
      "difficulty": "Easy",
      "createdAt": "2024-04-15T12:00:00.000Z"
    }
  }
  ```

#### Get Questions by Chapter
- **URL**: `/api/v1/questions/chapter/:chapterId`
- **Method**: GET
- **Description**: Get all questions for a specific chapter
- **Parameters**: `chapterId` (in URL)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "...",
        "questionText": "What is 2+2?",
        "options": ["3", "4", "5", "6"],
        "correctAnswer": "4",
        "explanation": "Basic addition",
        "questionType": "mcq",
        "difficulty": "Easy"
      },
      ...
    ]
  }
  ```

#### Get Questions by Chapter and Type
- **URL**: `/api/v1/questions/chapter/:chapterId/type/:questionType`
- **Method**: GET
- **Description**: Get questions filtered by chapter and question type
- **Parameters**: 
  - `chapterId` (in URL)
  - `questionType` (in URL, enum: ['mcq', 'fillblanks'])
- **Response**: Same as Get Questions by Chapter

#### Get Questions by Chapter, Type, and Difficulty
- **URL**: `/api/v1/questions/chapter/:chapterId/type/:questionType/difficulty/:difficulty`
- **Method**: GET
- **Description**: Get questions filtered by chapter, type, and difficulty
- **Parameters**: 
  - `chapterId` (in URL)
  - `questionType` (in URL, enum: ['mcq', 'fillblanks'])
  - `difficulty` (in URL, enum: ['Easy', 'Medium', 'Hard'])
- **Response**: Same as Get Questions by Chapter

#### Batch Questions (On-Demand Generation)
- **URL**: `/api/v1/questions/batch/chapter/:chapterId/type/:questionType/difficulty/:difficulty/session/:sessionId`
- **Method**: GET
- **Description**: Non-blocking status check for on-demand question generation. Returns existing questions + `generating`/`failed`/`mastered` status. AI generation runs fire-and-forget in the background.
- **Query Params**: `?retry=true&limit=10`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "data": [ ...questions... ],
      "status": "generating"
    }
  }
  ```

### Session APIs

#### Create Session
- **URL**: `/api/v1/sessions`
- **Method**: POST
- **Description**: Create a new practice session
- **Request Body**:
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
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "...",
      "userId": "...",
      "classId": "...",
      "subject": "Mathematics",
      "chapter": "Algebra",
      "questionType": "mcq",
      "difficulty": "Medium",
      "score": 0,
      "createdAt": "2024-04-15T12:00:00.000Z"
    }
  }
  ```

#### Get Session by ID
- **URL**: `/api/v1/sessions/:id`
- **Method**: GET
- **Description**: Get a specific session by ID
- **Parameters**: `id` (in URL)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "...",
      "userId": "...",
      "classId": "...",
      "subject": "Mathematics",
      "chapter": "Algebra",
      "questionType": "mcq",
      "difficulty": "Medium",
      "score": 0,
      "createdAt": "2024-04-15T12:00:00.000Z",
      "endedAt": null
    }
  }
  ```

#### End Session
- **URL**: `/api/v1/sessions/:id/end`
- **Method**: PATCH
- **Description**: End a session and submit the score
- **Parameters**: `id` (in URL)
- **Request Body**:
  ```json
  {
    "score": 85
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "...",
      "score": 85,
      "endedAt": "2024-04-15T12:30:00.000Z"
    }
  }
  ```

#### Get User's Sessions
- **URL**: `/api/v1/sessions/user/:userId`
- **Method**: GET
- **Description**: Get all sessions for a specific user
- **Parameters**: `userId` (in URL)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "...",
        "classId": "...",
        "subject": "Mathematics",
        "chapter": "Algebra",
        "questionType": "mcq",
        "difficulty": "Medium",
        "score": 85,
        "createdAt": "2024-04-15T12:00:00.000Z",
        "endedAt": "2024-04-15T12:30:00.000Z"
      },
      ...
    ]
  }
  ```

### Student Progress APIs

#### Get Chapter Progress
- **URL**: `/api/v1/student-progress/progress/:userId/chapter/:chapterId`
- **Method**: GET
- **Description**: Get detailed topic mastery breakdown for a chapter
- **Parameters**: 
  - `userId`: ID of the user
  - `chapterId`: ID of the chapter
- **Response**:
  ```json
  {
    "success": true,
    "message": "Progress retrieved successfully",
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
          "topicName": "Topic Name",
          "masteryScore": 0.85,
          "masteryState": "MASTERED",
          "totalAttempts": 12
        }
      ]
    }
  }
  ```

#### Get Subject Progress
- **URL**: `/api/v1/student-progress/progress/:userId/subject/:subjectId`
- **Method**: GET
- **Description**: Get aggregated progress across all chapters in a subject
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "subjectCoverage": 60,
      "subjectMastery": 55,
      "chapters": [
        {
          "chapterId": "...",
          "chapterName": "Chapter 1",
          "status": "IN_PROGRESS",
          "coverage": 80,
          "mastery": 65
        }
      ]
    }
  }
  ```

#### Update Topic Progress
- **URL**: `/api/v1/student-progress/update`
- **Method**: POST
- **Description**: Triggers progress recalculation after a session
- **Request Body**:
  ```json
  {
    "userId": "user_id",
    "sessionId": "session_id"
  }
  ```

### AI Insights APIs

#### Get Chapter AI Insights
- **URL**: `/api/v1/student-progress/chapter/:chapterId/ai-insights`
- **Method**: GET
- **Description**: Get AI-powered learning recommendations for a chapter
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "insights": "Personalized AI recommendation based on performance..."
    }
  }
  ```

#### Get Subject AI Insights
- **URL**: `/api/v1/student-progress/subject/:subjectId/ai-insights`
- **Method**: GET
- **Description**: Get AI-powered learning recommendations for a subject

### Section Management APIs

#### Create Section
- **URL**: `/api/v1/sections`
- **Method**: POST
- **Description**: Create a new class section (e.g., "9th-A")
- **Request Body**:
  ```json
  {
    "name": "A",
    "schoolId": "school_id",
    "classId": "class_id"
  }
  ```

#### Get Sections by School and Class
- **URL**: `/api/v1/sections/school/:schoolId/class/:classId`
- **Method**: GET
- **Description**: Get all sections for a specific school and class

### Teacher-Student APIs

#### Assign Students to Teacher
- **URL**: `/api/v1/teacher-student`
- **Method**: POST
- **Description**: Link students to a teacher
- **Request Body**:
  ```json
  {
    "teacherId": "teacher_id",
    "studentId": "student_id",
    "sectionId": "section_id"
  }
  ```

#### Get Students by Teacher
- **URL**: `/api/v1/teacher-student/teacher/:teacherId/students`
- **Method**: GET
- **Description**: Get all students assigned to a teacher

### Question Paper APIs

#### Generate Question Paper
- **URL**: `/api/v1/question-paper`
- **Method**: POST
- **Description**: Auto-generate a question paper based on criteria
- **Request Body**:
  ```json
  {
    "title": "Mid-Term Exam",
    "classId": "class_id",
    "subjectId": "subject_id",
    "chapterIds": ["chapter_id_1", "chapter_id_2"],
    "config": {
      "totalQuestions": 20,
      "difficultyMix": { "easy": 10, "medium": 40, "hard": 50 },
      "questionTypes": ["mcq", "fillblanks"],
      "includeAnswerKey": true
    },
    "duration": 60,
    "schoolName": "Delhi Public School",
    "examName": "Term 1 Examination",
    "instructions": ["All questions are compulsory"]
  }
  ```

#### Public Paper Generation (Lead Magnet)
- **URL**: `/api/v1/question-paper/public/generate`
- **Method**: POST
- **Description**: Generate a free paper and send it via WhatsApp to a prospective lead.
- **Request Body**:
  ```json
  {
    "leadParams": {
      "name": "John Doe",
      "schoolName": "Greenwood High",
      "whatsappNumber": "919876543210"
    },
    "paperParams": {
      "classId": "...",
      "subjectId": "...",
      "chapterIds": ["..."]
    }
  }
  ```

#### Get Paper Preview
- **Response**:
  ```json
  {
    "success": true,
    "message": "Question paper generated...",
    "data": { "_id": "paper_id", "totalMarks": 50, ... }
  }
  ```

#### Get Paper Preview
- **URL**: `/api/v1/question-paper/:paperId/preview`
- **Method**: GET
- **Description**: Get paper details with full question content for preview
- **Parameters**: `paperId` (in URL)

#### Download PDF
- **URL**: `/api/v1/question-paper/:paperId/pdf`
- **Method**: GET
- **Description**: Download the generated question paper as a PDF file
- **Parameters**: `paperId` (in URL)
- **Response**: PDF File Blob

#### Get Paper History
- **URL**: `/api/v1/question-paper/history`
- **Method**: GET
- **Description**: Get all papers generated by the logged-in teacher
- **Query Params**: `page`, `limit`, `classId`, `subjectId`
- **Response**:
  ```json
  {
    "success": true,
    "data": [ { "_id": "...", "title": "..." } ],
    "pagination": { "total": 10, "page": 1, "pages": 2 }
  }
  ```

#### Delete Paper
- **URL**: `/api/v1/question-paper/:paperId`
- **Method**: DELETE
- **Description**: Soft delete a question paper

### Quiz APIs

#### Create Quiz (Teacher)
- **URL**: `/api/v1/quiz`
- **Method**: POST
- **Description**: Create a new quiz in draft status.
- **Request Body**:
  ```json
  {
    "title": "Algebra Weekly Quiz",
    "classId": "...",
    "subjectId": "...",
    "settings": {
      "timeLimit": 30,
      "allowedAttempts": 1
    }
  }
  ```

#### Start Quiz (Student)
- **URL**: `/api/v1/quiz/:quizId/start`
- **Method**: POST
- **Description**: Start an attempt for a published quiz.

#### Submit Answer
- **URL**: `/api/v1/quiz/attempt/:attemptId/answer`
- **Method**: POST
- **Request Body**: `{ "quizQuestionId": "...", "selectedAnswer": "..." }`

### Teacher Dashboard APIs

#### Get Subject Overview
- **URL**: `/api/v1/teacher-dashboard/:teacherId/subject/:subjectId/dashboard`
- **Method**: GET
- **Description**: Returns chapter-wise progress, weak topics, and class activity.

#### Get Student Activity
- **URL**: `/api/v1/teacher-dashboard/:teacherId/subject/:subjectId/activity`
- **Method**: GET

### Supporting APIs

#### Get Leaderboard
- **URL**: `/api/v1/leaderboard`
- **Method**: GET
- **Query Params**: `type` (class/global), `classId`

#### Submit Feedback
- **URL**: `/api/v1/feedback`
- **Method**: POST
- **Request Body**: `{ "type": "...", "message": "..." }`

## New Models (Added)

### StudentTopicProgress Model
```javascript
{
  userId: ObjectId,           // Reference to User
  subjectId: ObjectId,        // Reference to Subject
  chapterId: ObjectId,        // Reference to Chapter
  topicId: ObjectId,          // Reference to Topic
  totalAttempts: Number,      // Total questions attempted
  easyAttempts: Number,       // Easy questions attempted
  mediumAttempts: Number,     // Medium questions attempted
  hardAttempts: Number,       // Hard questions attempted
  easyCorrect: Number,        // Easy correct answers
  mediumCorrect: Number,      // Medium correct answers
  hardCorrect: Number,        // Hard correct answers
  avgTimeSpent: Number,       // Average time in seconds
  lastPracticedAt: Date,      // Last practice timestamp
  masteryScore: Number,       // 0.0 - 1.0 (weighted score)
  masteryState: String        // enum: ['WEAK', 'LEARNING', 'PRACTICING', 'MASTERED']
}
```

### QuestionPaper Model
```javascript
{
  createdBy: ObjectId,        // Reference to User (Teacher)
  title: String,              // Paper Title
  classId: ObjectId,          // Reference to Class
  subjectId: ObjectId,        // Reference to Subject
  chapterIds: [ObjectId],     // Selected Chapters
  config: {
    totalQuestions: Number,
    difficultyMix: {
      easy: Number,
      medium: Number,
      hard: Number
    },
    questionTypes: [String],  // ['mcq', 'fillblanks']
    includeAnswerKey: Boolean
  },
  questionIds: [ObjectId],    // Specific selected questions
  totalMarks: Number,
  duration: Number,           // in minutes
  schoolName: String,
  examName: String,
  instructions: [String],
  status: String,             // 'generated', 'failed'
  isDeleted: Boolean
}
```

### Section Model
```javascript
{
  name: String,               // Section name (e.g., "A", "B")
  schoolId: ObjectId,         // Reference to School
  classId: ObjectId,          // Reference to Class
  isActive: Boolean           // Default: true
}
```

### ChapterTopics Model
```javascript
{
  chapterId: ObjectId,        // Reference to Chapter
  topicId: ObjectId           // Reference to Topic
}
```

### Quiz Model
```javascript
{
  createdBy: ObjectId,
  title: String,
  status: String,             // 'draft', 'published', 'closed'
  settings: {
    timeLimit: Number,
    allowedAttempts: Number,
    passingPercentage: Number
  }
}
```

### Lead Model
```javascript
{
  name: String,
  schoolName: String,
  whatsappNumber: String,
  source: String,             // e.g., 'public_paper_gen'
  converted: Boolean
}
```

## Setup and Development

### Prerequisites
- Node.js
- MongoDB
- npm

### Installation
1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Question Generation Configuration
The following environment variables control the non-blocking question generation pipeline:

| Variable | Default | Description |
|---|---|---|
| `QUESTION_PREFETCH_AHEAD` | `10` | Warm next batch when this many questions remain |
| `QUESTION_MIN_NEW_PER_RUN` | `3` | Minimum new questions per AI run to avoid low-yield flag |
| `QUESTION_LOW_YIELD_LIMIT` | `2` | Consecutive low-yield runs before marking chapter as mastered |
| `QUESTION_HARD_CAP` | `300` | Absolute ceiling — total questions per chapter-selection before forced mastery |

### Development
Run the server in development mode with auto-reload:
```bash
npm run dev
```

Run the server in production mode:
```bash
npm start
```

## Database Initialization Scripts

### Initialize Classes
```bash
node scripts/initClasses.js
```
Initializes all classes (6th to 12th)

### Initialize Subjects
```bash
node scripts/initSubjects.js
```
Initializes subjects for each class

### Initialize Chapters
```bash
node scripts/initChapters.js
```
Initializes chapters for specific class and subject combinations

## Notes

- All models include `isActive` field for soft deletion
- All timestamps are in ISO format
- All IDs are MongoDB ObjectIds
- Error responses follow the format:
  ```json
  {
    "success": false,
    "message": "Error message",
    "error": "Detailed error message"
  }
  ```

## Error Handling

All endpoints include proper error handling for:
- Missing required fields
- Invalid field values
- Database errors
- Invalid ObjectId formats
- Not found resources

## Example Usage

### Get Easy MCQ Questions for a Chapter
```http
GET /api/v1/questions/chapter/65f1a2b3c4d5e6f7a8b9c0d1/type/mcq/difficulty/Easy
```

### Get Hard Fill-in-the-Blank Questions for a Chapter
```http
GET /api/v1/questions/chapter/65f1a2b3c4d5e6f7a8b9c0d1/type/fillblanks/difficulty/Hard
```

