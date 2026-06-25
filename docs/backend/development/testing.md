# Quiz Module Test Cases

> Comprehensive manual testing guide for Teacher and Student quiz flows

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Teacher Flow Test Cases](#teacher-flow-test-cases)
   - [Quiz Creation](#1-quiz-creation)
   - [Question Management](#2-question-management)
   - [Quiz Status Management](#3-quiz-status-management)
   - [Quiz Analytics](#4-quiz-analytics)
3. [Student Flow Test Cases](#student-flow-test-cases)
   - [Available Quizzes](#5-available-quizzes)
   - [Quiz Attempt](#6-quiz-attempt)
   - [Results & History](#7-results--history)
4. [Edge Cases & Error Handling](#edge-cases--error-handling)

---

## Prerequisites

Before testing, ensure you have:
- [ ] A **Teacher account** assigned to at least one class/subject
- [ ] A **Student account** affiliated with the teacher's class
- [ ] Questions in the **Question Bank** for the class/subject chapters
- [ ] API testing tool (Postman/Insomnia) or Frontend access

---

## Teacher Flow Test Cases

### 1. Quiz Creation

#### TC-1.1: Create Quiz with Valid Data
| Field | Details |
|-------|---------|
| **Endpoint** | `POST /api/v1/quiz` |
| **Auth** | Teacher JWT Token |

**Request Body:**
```json
{
  "title": "Chapter 1 Weekly Quiz",
  "description": "Test your understanding of Chapter 1",
  "classId": "<valid_class_id>",
  "subjectId": "<valid_subject_id>",
  "chapterIds": ["<chapter_id_1>", "<chapter_id_2>"],
  "settings": {
    "timeLimit": 30,
    "shuffleQuestions": true,
    "shuffleOptions": true,
    "showAnswersAfter": "submission",
    "allowedAttempts": 2,
    "passingPercentage": 60,
    "deadline": "2026-01-30T23:59:59Z"
  }
}
```

**Expected Result:**
- ✅ Status: `201 Created`
- ✅ Quiz created with `status: "draft"`
- ✅ `createdBy` matches teacher ID
- ✅ `totalQuestions: 0`, `totalMarks: 0`

---

#### TC-1.2: Create Quiz without Title (Required Field)
**Request Body:**
```json
{
  "classId": "<valid_class_id>",
  "subjectId": "<valid_subject_id>"
}
```

**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error: "Title is required"

---

#### TC-1.3: Create Quiz without ClassId/SubjectId
**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error: "Class ID and Subject ID are required"

---

#### TC-1.4: Create Quiz for Unassigned Class
| Scenario | Teacher NOT assigned to the specified class |
|----------|---------------------------------------------|

**Expected Result:**
- ❌ Status: `403 Forbidden`
- ❌ Error: "You are not assigned to this class/subject"

---

#### TC-1.5: Create Quiz with Invalid Settings
**Test Cases:**
| Setting | Invalid Value | Expected Error |
|---------|---------------|----------------|
| `timeLimit` | `-10` | Invalid time limit |
| `allowedAttempts` | `0` | At least 1 attempt required |
| `passingPercentage` | `150` | Must be between 0-100 |
| `showAnswersAfter` | `"invalid"` | Invalid enum value |

---

### 2. Question Management

#### TC-2.1: Search Questions from Question Bank
| **Endpoint** | `GET /api/v1/quiz/questions/search` |
|--------------|-------------------------------------|

**Query Parameters:**
```
?chapterIds=<chapter_id>&classId=<class_id>&subjectId=<subject_id>&difficulty=Medium&questionType=mcq&page=1&limit=20
```

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Returns paginated list of questions
- ✅ Each question has: `questionText`, `options`, `correctAnswer`, `explanation`, `difficulty`

---

#### TC-2.2: Search with excludeQuizId Filter
| Scenario | Exclude questions already in a quiz |
|----------|-------------------------------------|

**Query:**
```
?chapterIds=<id>&classId=<id>&subjectId=<id>&excludeQuizId=<quiz_id>
```

**Expected Result:**
- ✅ Questions already added to the specified quiz are NOT returned

---

#### TC-2.3: Add Questions from Question Bank to Quiz
| **Endpoint** | `POST /api/v1/quiz/:quizId/questions` |
|--------------|---------------------------------------|

**Request Body:**
```json
{
  "questions": [
    { "questionId": "<question_bank_id_1>", "marks": 1 },
    { "questionId": "<question_bank_id_2>", "marks": 2 },
    { "questionId": "<question_bank_id_3>", "marks": 1 }
  ]
}
```

**Expected Result:**
- ✅ Status: `201 Created`
- ✅ Response: `{ added: 3, totalQuestions: 3, totalMarks: 4 }`
- ✅ Quiz `totalQuestions` and `totalMarks` updated

---

#### TC-2.4: Add Custom Question to Quiz
**Request Body:**
```json
{
  "questions": [
    {
      "marks": 2,
      "customQuestion": {
        "questionText": "What is 2 + 2?",
        "options": ["2", "3", "4", "5"],
        "correctAnswer": "4",
        "explanation": "Basic addition",
        "questionType": "mcq",
        "difficulty": "Easy"
      }
    }
  ]
}
```

**Expected Result:**
- ✅ Status: `201 Created`
- ✅ `isCustom: true` in QuizQuestion record

---

#### TC-2.5: Add Questions to Published Quiz
| Scenario | Quiz is already published |
|----------|---------------------------|

**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error: "Cannot modify published quiz"

---

#### TC-2.6: Add Duplicate Question
| Scenario | Question already exists in quiz |
|----------|--------------------------------|

**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error: "Question already exists in quiz" (or skip silently)

---

#### TC-2.7: Remove Question from Quiz
| **Endpoint** | `DELETE /api/v1/quiz/:quizId/questions/:questionId` |
|--------------|-----------------------------------------------------|

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Question removed
- ✅ Remaining questions reordered
- ✅ `totalQuestions` and `totalMarks` updated

---

#### TC-2.8: Remove Question from Published Quiz
**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error: "Cannot modify published quiz"

---

#### TC-2.9: Reorder Questions
| **Endpoint** | `PUT /api/v1/quiz/:quizId/questions/reorder` |
|--------------|----------------------------------------------|

**Request Body:**
```json
{
  "order": ["<quizQuestionId_3>", "<quizQuestionId_1>", "<quizQuestionId_2>"]
}
```

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Questions reordered according to new array

---

### 3. Quiz Status Management

#### TC-3.1: Get Quiz Details
| **Endpoint** | `GET /api/v1/quiz/:quizId` |
|--------------|----------------------------|

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Returns quiz with populated class, subject, chapters
- ✅ Returns associated questions

---

#### TC-3.2: Update Draft Quiz
| **Endpoint** | `PUT /api/v1/quiz/:quizId` |
|--------------|----------------------------|

**Request Body:**
```json
{
  "title": "Updated Quiz Title",
  "settings": {
    "timeLimit": 45,
    "passingPercentage": 70
  }
}
```

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Quiz updated with new values

---

#### TC-3.3: Update Published Quiz
**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error: "Cannot update published quiz"

---

#### TC-3.4: Delete Draft Quiz
| **Endpoint** | `DELETE /api/v1/quiz/:quizId` |
|--------------|-------------------------------|

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ `deleteType: "hard"` - Quiz and QuizQuestions permanently deleted
- ✅ Quiz completely removed from database

---

#### TC-3.5: Delete Published Quiz - Active Deadline ⚠️ UPDATED
| Scenario | Published quiz with deadline NOT passed |
|----------|----------------------------------------|

**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error Code: `QUIZ_ACTIVE`
- ❌ Error: "Cannot delete an active published quiz. Wait for the deadline to pass or close the quiz first."

---

#### TC-3.5a: Delete Published Quiz - Expired Deadline ⚠️ NEW
| Scenario | Published quiz with deadline PASSED |
|----------|-------------------------------------|

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ `deleteType: "soft"` - Quiz soft-deleted (data preserved)
- ✅ Quiz sets `isDeleted: true`, `deletedAt` timestamp
- ✅ Quiz no longer appears in teacher quiz list
- ✅ Student attempt data preserved

---

#### TC-3.5b: Delete Closed Quiz ⚠️ NEW
| Scenario | Quiz is closed |
|----------|----------------|

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ `deleteType: "soft"` - Quiz soft-deleted (data preserved)
- ✅ Quiz sets `isDeleted: true`, `deletedAt` timestamp
- ✅ Student attempt history preserved

---

#### TC-3.5c: Force Delete Active Published Quiz ⚠️ NEW
| Scenario | Published quiz with active deadline + forceDelete flag |
|----------|--------------------------------------------------------|

**Endpoint:** `DELETE /api/v1/quiz/:quizId?forceDelete=true`

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ `deleteType: "soft"` - Quiz soft-deleted
- ⚠️ Use with caution - removes active quiz from students

---

#### TC-3.5d: Delete Already Deleted Quiz ⚠️ NEW
| Scenario | Quiz already soft-deleted |
|----------|---------------------------|

**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error Code: `ALREADY_DELETED`
- ❌ Error: "Quiz is already deleted"

---

#### TC-3.6: Publish Quiz without Questions
| Scenario | Quiz has 0 questions |
|----------|---------------------|

**Endpoint:** `POST /api/v1/quiz/:quizId/publish`

**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error: "Cannot publish quiz without questions"

---

#### TC-3.6a: Publish Quiz with Expired Deadline ⚠️ NEW
| Scenario | Quiz has a deadline in the past |
|----------|--------------------------------|

**Endpoint:** `POST /api/v1/quiz/:quizId/publish`

**Test Setup:**
- Create quiz with `settings.deadline` set to a past date

**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error Code: `DEADLINE_EXPIRED`
- ❌ Error: "Cannot publish a quiz with a deadline in the past. Please update the deadline first."

**Fix Required:**
- Teacher must either update deadline to future date or remove deadline before publishing

---

#### TC-3.7: Publish Quiz Successfully
| Scenario | Quiz has at least 1 question and valid deadline |
|----------|------------------------------------------------|

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ `status` changed to `"published"`
- ✅ `publishedAt` timestamp set

---

#### TC-3.8: Publish Already Published Quiz
**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error: "Quiz is already published"

---

#### TC-3.9: Close Quiz
| **Endpoint** | `POST /api/v1/quiz/:quizId/close` |
|--------------|-----------------------------------|

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ `status` changed to `"closed"`
- ✅ `closedAt` timestamp set

---

#### TC-3.10: Close Draft Quiz
**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error: "Can only close published quizzes"

---

#### TC-3.11: Clone Quiz
| **Endpoint** | `POST /api/v1/quiz/:quizId/clone` |
|--------------|-----------------------------------|

**Request Body (optional):**
```json
{
  "title": "Cloned Quiz - Copy"
}
```

**Expected Result:**
- ✅ Status: `201 Created`
- ✅ New quiz created with `status: "draft"`
- ✅ All questions copied
- ✅ Original quiz unchanged

---

#### TC-3.12: Get Teacher's Quizzes
| **Endpoint** | `GET /api/v1/quiz/teacher/:teacherId` |
|--------------|---------------------------------------|

**Query Parameters:**
```
?status=published&classId=<id>&subjectId=<id>&page=1&limit=10
```

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Paginated list of teacher's quizzes
- ✅ Filters applied correctly

---

### 4. Quiz Analytics

#### TC-4.1: Get Quiz Analytics
| **Endpoint** | `GET /api/v1/quiz/:quizId/analytics` |
|--------------|--------------------------------------|

**Expected Result (Published Quiz with Attempts):**
```json
{
  "success": true,
  "data": {
    "quiz": { ... },
    "summary": {
      "totalStudents": 25,
      "totalAttempts": 30,
      "completedAttempts": 28,
      "averageScore": 75.5,
      "passRate": 80,
      "averageTimeSpent": 1200
    },
    "questionAnalysis": [
      {
        "questionId": "...",
        "questionText": "...",
        "totalAnswered": 28,
        "correctAnswers": 20,
        "correctPercentage": 71.4
      }
    ],
    "scoreDistribution": { ... }
  }
}
```

---

#### TC-4.2: Get Analytics for Draft Quiz
**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Analytics show 0 attempts

---

---

## Student Flow Test Cases

### 5. Available Quizzes

#### TC-5.1: Get Available Quizzes
| **Endpoint** | `GET /api/v1/quiz/student/available` |
|--------------|--------------------------------------|

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Returns only `published` quizzes
- ✅ Quizzes belong to student's affiliated classes
- ✅ Each quiz shows: title, subject, class, deadline, attempt info

---

#### TC-5.2: Filter Quizzes by Subject/Class
**Query:**
```
?subjectId=<id>&classId=<id>
```

**Expected Result:**
- ✅ Only matching quizzes returned

---

#### TC-5.3: Quiz with Passed Deadline
| Scenario | Quiz deadline has passed |
|----------|--------------------------|

**Expected Result:**
- ✅ Quiz still appears in list BUT...
- ✅ Starting new attempt should fail (see TC-6.4)

---

#### TC-5.4: Quiz with Max Attempts Reached
| Scenario | Student used all allowed attempts |
|----------|-----------------------------------|

**Expected Result:**
- ✅ Quiz appears with indicator "Max attempts reached"
- ✅ Cannot start new attempt

---

### 6. Quiz Attempt

#### TC-6.1: Start Quiz Attempt
| **Endpoint** | `POST /api/v1/quiz/:quizId/start` |
|--------------|-----------------------------------|

**Expected Result:**
- ✅ Status: `201 Created`
- ✅ New `QuizAttempt` created with `status: "in_progress"`
- ✅ Returns: attempt details, questions, quiz settings
- ✅ `attemptNumber` incremented correctly

---

#### TC-6.2: Start Quiz - Resume In-Progress Attempt
| Scenario | Student has an existing in-progress attempt |
|----------|---------------------------------------------|

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Returns existing attempt (NOT creating new one)
- ✅ Returns questions with already-submitted answers marked

---

#### TC-6.3: Start Quiz - Max Attempts Reached
| Scenario | Student has used all `allowedAttempts` |
|----------|----------------------------------------|

**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error: "Maximum attempts reached"

---

#### TC-6.4: Start Quiz - Deadline Passed
| Scenario | Quiz deadline has passed |
|----------|--------------------------|

**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error: "Quiz deadline has passed"

---

#### TC-6.5: Start Quiz - Quiz Not Published
| Scenario | Quiz is still in draft status |
|----------|-------------------------------|

**Expected Result:**
- ❌ Status: `404 Not Found`
- ❌ Error: "Quiz not found"

---

#### TC-6.6: Start Quiz - Student Not Affiliated
| Scenario | Student not affiliated with quiz's class |
|----------|------------------------------------------|

**Expected Result:**
- ❌ Status: `403 Forbidden`
- ❌ Error: "You are not enrolled in this class"

---

#### TC-6.7: Submit Answer (Question by Question)
| **Endpoint** | `POST /api/v1/quiz/attempt/:attemptId/answer` |
|--------------|-----------------------------------------------|

**Request Body:**
```json
{
  "quizQuestionId": "<quiz_question_id>",
  "selectedAnswer": "Option B"
}
```

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Answer saved immediately
- ✅ Response shows if correct (based on `showAnswersAfter` setting)

---

#### TC-6.8: Submit Answer - Already Answered Question
| Scenario | Updating previously submitted answer |
|----------|--------------------------------------|

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Answer updated (replacing old answer)

---

#### TC-6.9: Submit Answer - Invalid Attempt ID
**Expected Result:**
- ❌ Status: `404 Not Found`
- ❌ Error: "Attempt not found"

---

#### TC-6.10: Submit Answer - Attempt Already Completed
| Scenario | Quiz already submitted |
|----------|------------------------|

**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error: "Quiz already submitted"

---

#### TC-6.11: Submit Answer - Time Limit Exceeded
| Scenario | Quiz has time limit and time is up |
|----------|-----------------------------------|

**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error: "Time limit exceeded"
- ✅ Quiz auto-submitted with current answers

---

#### TC-6.12: Submit Entire Quiz
| **Endpoint** | `POST /api/v1/quiz/attempt/:attemptId/submit` |
|--------------|-----------------------------------------------|

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Attempt `status` changed to `"completed"`
- ✅ `submittedAt` timestamp set
- ✅ Score calculated and stored
- ✅ Response includes: totalQuestions, totalAnswered, correctAnswers, score, percentage, passed

---

#### TC-6.13: Submit Quiz with Unanswered Questions
| Scenario | Some questions left unanswered |
|----------|--------------------------------|

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Unanswered questions marked as incorrect (0 marks)
- ✅ `totalAnswered` reflects actual answered count

---

#### TC-6.14: Submit Already Submitted Quiz
**Expected Result:**
- ❌ Status: `400 Bad Request`
- ❌ Error: "Quiz already submitted"

---

#### TC-6.15: Verify Question Shuffling
| Scenario | `shuffleQuestions: true` in settings |
|----------|--------------------------------------|

**Test Steps:**
1. Start attempt with shuffleQuestions enabled
2. Note question order
3. Start another attempt (if allowed)
4. Verify question order is different

---

#### TC-6.16: Verify Option Shuffling
| Scenario | `shuffleOptions: true` in settings |
|----------|-------------------------------------|

**Test:** Options within questions appear in random order

---

### 7. Results & History

#### TC-7.1: Get Attempt Result - showAnswersAfter: "immediately"
| **Endpoint** | `GET /api/v1/quiz/attempt/:attemptId/result` |
|--------------|----------------------------------------------|

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Full result with correct answers shown
- ✅ Each question shows: student answer, correct answer, explanation

---

#### TC-7.2: Get Result - showAnswersAfter: "submission"
| Scenario | Only show after quiz submitted |
|----------|--------------------------------|

**Expected Result:**
- ✅ Answers visible only after `status: "completed"`

---

#### TC-7.3: Get Result - showAnswersAfter: "deadline"
| Scenario | Answers visible only after deadline |
|----------|-------------------------------------|

**Expected Result:**
- ✅ Before deadline: `showAnswers: false`
- ✅ After deadline: `showAnswers: true`

---

#### TC-7.4: Get Result - showAnswersAfter: "never"
| Scenario | Answers never shown |
|----------|---------------------|

**Expected Result:**
- ✅ Score and percentage shown
- ✅ Correct answers NOT revealed
- ✅ `showAnswers: false`

---

#### TC-7.5: Get Quiz History
| **Endpoint** | `GET /api/v1/quiz/student/history` |
|--------------|-------------------------------------|

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Paginated list of all attempts
- ✅ Shows: quiz title, attempt date, score, percentage, passed status

---

#### TC-7.6: Filter History by Subject
**Query:**
```
?subjectId=<id>&page=1&limit=10
```

**Expected Result:**
- ✅ Only attempts for specified subject returned

---

---

## Edge Cases & Error Handling

### Authentication & Authorization

| Test ID | Scenario | Expected |
|---------|----------|----------|
| EC-1 | No auth token | `401 Unauthorized` |
| EC-2 | Invalid/expired token | `401 Unauthorized` |
| EC-3 | Student accessing teacher endpoints | `403 Forbidden` |
| EC-4 | Teacher accessing another teacher's quiz | `403 Forbidden` |
| EC-5 | Student accessing quiz from unaffiliated class | `403 Forbidden` |

---

### Invalid Data

| Test ID | Scenario | Expected |
|---------|----------|----------|
| EC-6 | Invalid MongoDB ObjectId format | `400 Bad Request` |
| EC-7 | Non-existent quizId | `404 Not Found` |
| EC-8 | Non-existent attemptId | `404 Not Found` |
| EC-9 | Empty questions array when adding | `400 Bad Request` |
| EC-10 | Invalid questionId in questions array | `400 Bad Request` or skip |

---

### Concurrent Operations

| Test ID | Scenario | Expected |
|---------|----------|----------|
| EC-11 | Two sessions submitting same answer simultaneously | One succeeds, one updates |
| EC-12 | Teacher publishes while student starting attempt | Handled gracefully |
| EC-13 | Multiple browser tabs with same quiz | Sync answers correctly |

---

### Time-Related Edge Cases

| Test ID | Scenario | Expected |
|---------|----------|----------|
| EC-14 | Submit answer at exact time limit | Should accept if within limit |
| EC-15 | Submit quiz milliseconds after deadline | Should reject |
| EC-16 | Server time vs client time mismatch | Trust server time |
| EC-17 | Quiz with `timeLimit: null` (no limit) | Unlimited time allowed |
| EC-18 | Quiz with `deadline: null` (no deadline) | Always accessible |

---

### Special Quiz Configurations

| Test ID | Scenario | Expected |
|---------|----------|----------|
| EC-19 | `allowedAttempts: 1` - Retry behavior | Cannot retry after completion |
| EC-20 | `passingPercentage: 0` | Everyone passes |
| EC-21 | `passingPercentage: 100` | Only perfect score passes |
| EC-22 | Quiz with 1 question | Works correctly |
| EC-23 | Quiz with 100+ questions | Performance acceptable, pagination |

---

## Quick Reference: API Endpoints

### Teacher Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/quiz/questions/search` | Search question bank |
| POST | `/api/v1/quiz` | Create quiz |
| GET | `/api/v1/quiz/:quizId` | Get quiz details |
| PUT | `/api/v1/quiz/:quizId` | Update quiz |
| DELETE | `/api/v1/quiz/:quizId` | Delete quiz (draft=hard, published/closed=soft) |
| DELETE | `/api/v1/quiz/:quizId?forceDelete=true` | Force delete active published quiz |
| GET | `/api/v1/quiz/teacher/:teacherId` | Get teacher's quizzes |
| POST | `/api/v1/quiz/:quizId/publish` | Publish quiz |
| POST | `/api/v1/quiz/:quizId/close` | Close quiz |
| POST | `/api/v1/quiz/:quizId/clone` | Clone quiz |
| POST | `/api/v1/quiz/:quizId/questions` | Add questions |
| DELETE | `/api/v1/quiz/:quizId/questions/:questionId` | Remove question |
| PUT | `/api/v1/quiz/:quizId/questions/reorder` | Reorder questions |
| GET | `/api/v1/quiz/:quizId/analytics` | Get analytics |

### Student Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/quiz/student/available` | Get available quizzes |
| GET | `/api/v1/quiz/student/history` | Get quiz history |
| POST | `/api/v1/quiz/:quizId/start` | Start quiz attempt |
| POST | `/api/v1/quiz/attempt/:attemptId/answer` | Submit answer |
| POST | `/api/v1/quiz/attempt/:attemptId/submit` | Submit entire quiz |
| GET | `/api/v1/quiz/attempt/:attemptId/result` | Get attempt result |

---

## Test Data Checklist

Before testing, prepare:
- [ ] 2+ Teacher accounts (for cross-teacher access tests)
- [ ] 3+ Student accounts in different classes
- [ ] At least 10 questions in question bank
- [ ] Classes with both teacher assignments and student affiliations
- [ ] Valid class → subject → chapter hierarchy

---

*Last Updated: January 19, 2026*
