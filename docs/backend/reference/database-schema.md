# AskAide AI - Database Schema

**Last Updated:** 2026-02-02  
**Database:** MongoDB with Mongoose ODM

---

## Entity Relationship Overview

```
School (1) ──→ (N) Section ──→ Class
                      │
                      ↓
User ──→ Role (student/teacher/principal/parent/admin)
  │
  ├──→ School (optional)
  ├──→ Class (for students)
  └──→ TeacherStudent (linking)

Class (1) ──→ (N) Subject (1) ──→ (N) Chapter (N) ←──→ (M) Topic
                                          │
                                          ↓
                                    Question ──→ Topic
                                          │
                                          ↓
                                    UserAnswer ──→ StudentTopicProgress
```

---

## Core Models

### User
**File:** `src/shared/models/user.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| _id | ObjectId | PRIMARY KEY | Auto-generated |
| email | String | UNIQUE, REQUIRED | User email |
| password | String | REQUIRED | bcrypt hashed |
| name | String | REQUIRED | Display name |
| role | String | REQUIRED, ENUM | student, teacher, principal, parent, admin |
| classId | ObjectId | REF: Class | For students |
| schoolId | ObjectId | REF: School | For institutional users |
| isActive | Boolean | DEFAULT: true | Soft delete flag |
| createdAt | Date | AUTO | Timestamp |
| updatedAt | Date | AUTO | Timestamp |

**Indexes:** `email` (unique)

---

### Profile
**File:** `src/shared/models/profile.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | ObjectId | REF: User, REQUIRED | User reference |
| phone | String | | Phone number |
| avatar | String | | Profile image URL |
| bio | String | | User biography |

---

### School
**File:** `src/modules/school/models/school.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| name | String | REQUIRED | School name |
| address | String | | Physical address |
| isActive | Boolean | DEFAULT: true | Soft delete flag |

---

### Section
**File:** `src/modules/school/models/section.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| name | String | REQUIRED | Section name (A, B, C) |
| schoolId | ObjectId | REF: School, REQUIRED | School reference |
| classId | ObjectId | REF: Class, REQUIRED | Class reference |
| isActive | Boolean | DEFAULT: true | Soft delete flag |

**Indexes:** `{ schoolId, classId, name }` (unique compound)

---

### Class
**File:** `src/modules/content/models/class.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| grade | Number | REQUIRED, MIN: 6, MAX: 12 | Numeric grade |
| name | String | REQUIRED, ENUM | 6th, 7th, 8th, 9th, 10th, 11th, 12th |
| isActive | Boolean | DEFAULT: true | Soft delete flag |

---

### Subject
**File:** `src/modules/content/models/subject.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| name | String | REQUIRED | Subject name |
| code | String | REQUIRED | Short code (MAT, ENG, etc.) |
| classId | ObjectId | REF: Class, REQUIRED | Class reference |
| isActive | Boolean | DEFAULT: true | Soft delete flag |

---

### Chapter
**File:** `src/modules/content/models/chapter.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| name | String | REQUIRED | Chapter name |
| subjectId | ObjectId | REF: Subject, REQUIRED | Subject reference |
| classId | ObjectId | REF: Class, REQUIRED | Class reference |
| order | Number | REQUIRED | Display order |
| pdfUrl | String | | Uploaded PDF URL |
| isActive | Boolean | DEFAULT: true | Soft delete flag |

---

### Topic
**File:** `src/modules/content/models/topic.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| name | String | REQUIRED | Topic name |
| description | String | | Topic description |
| isActive | Boolean | DEFAULT: true | Soft delete flag |

---

### ChapterTopics
**File:** `src/modules/content/models/chapterTopics.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| chapterId | ObjectId | REF: Chapter, REQUIRED | Chapter reference |
| topicId | ObjectId | REF: Topic, REQUIRED | Topic reference |

**Purpose:** Many-to-many junction table

---

## Question & Answer Models

### Question
**File:** `src/modules/questions/models/question.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| chapterId | ObjectId | REF: Chapter | Chapter reference |
| topicId | ObjectId | REF: Topic | Topic reference |
| questionText | String | REQUIRED | Question content |
| options | [String] | | MCQ options |
| correctAnswer | String | REQUIRED | Correct answer |
| explanation | String | REQUIRED | Answer explanation |
| questionType | String | REQUIRED, ENUM | mcq, fillblanks |
| difficulty | String | REQUIRED, ENUM | Easy, Medium, Hard |

---

### QuestionGenerationJob
**File:** `src/modules/questions/models/questionGenerationJob.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| chapterId | ObjectId | REF: Chapter, REQUIRED | Chapter reference |
| status | String | ENUM | pending, processing, completed, failed |
| questionsGenerated | Number | DEFAULT: 0 | Count of questions |
| error | String | | Error message if failed |
| startedAt | Date | | Processing start time |
| completedAt | Date | | Completion time |

---

### Session
**File:** `src/modules/progress/models/session.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | ObjectId | REF: User, REQUIRED | User reference |
| classId | ObjectId | REF: Class | Class reference |
| subject | String | REQUIRED | Subject name |
| chapter | String | REQUIRED | Chapter name |
| questionType | String | REQUIRED, ENUM | mcq, fillblanks |
| difficulty | String | REQUIRED, ENUM | Easy, Medium, Hard |
| score | Number | DEFAULT: 0 | Final score |
| endedAt | Date | | Session end time |

---

### UserAnswer
**File:** `src/modules/progress/models/userAnswer.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | ObjectId | REF: User, REQUIRED | User reference |
| sessionId | ObjectId | REF: Session, REQUIRED | Session reference |
| questionId | ObjectId | REF: Question, REQUIRED | Question reference |
| topicId | ObjectId | REF: Topic | **NEW** Topic reference |
| userAnswer | String | REQUIRED | User's answer |
| isCorrect | Boolean | REQUIRED | Correctness flag |
| timeSpent | Number | | Seconds taken |
| difficulty | String | ENUM | Easy, Medium, Hard |

---

## Progress Tracking

### StudentTopicProgress
**File:** `src/modules/progress/models/studentTopicProgress.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | ObjectId | REF: User, REQUIRED | User reference |
| subjectId | ObjectId | REF: Subject, REQUIRED | Subject reference |
| chapterId | ObjectId | REF: Chapter, REQUIRED | Chapter reference |
| topicId | ObjectId | REF: Topic, REQUIRED | Topic reference |
| totalAttempts | Number | DEFAULT: 0 | Total questions attempted |
| easyAttempts | Number | DEFAULT: 0 | Easy questions attempted |
| mediumAttempts | Number | DEFAULT: 0 | Medium questions attempted |
| hardAttempts | Number | DEFAULT: 0 | Hard questions attempted |
| easyCorrect | Number | DEFAULT: 0 | Easy correct answers |
| mediumCorrect | Number | DEFAULT: 0 | Medium correct answers |
| hardCorrect | Number | DEFAULT: 0 | Hard correct answers |
| avgTimeSpent | Number | | Average time in seconds |
| lastPracticedAt | Date | | Last practice timestamp |
| masteryScore | Number | 0.0 - 1.0 | Weighted mastery score |
| masteryState | String | ENUM | WEAK, LEARNING, PRACTICING, MASTERED |

**Indexes:** `{ userId, topicId }` (compound)

**Mastery Calculation:**
```javascript
masteryScore = (easyCorrect × 0.25 + mediumCorrect × 0.35 + hardCorrect × 0.40) 
             / (easyAttempts × 0.25 + mediumAttempts × 0.35 + hardAttempts × 0.40)
```

---

## Relationship Models

### TeacherStudent
**File:** `src/modules/teacher/models/teacherStudent.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| teacherId | ObjectId | REF: User, REQUIRED | Teacher user reference |
| studentId | ObjectId | REF: User, REQUIRED | Student user reference |
| sectionId | ObjectId | REF: Section | Section reference |
| createdAt | Date | AUTO | Assignment date |

**Indexes:** `{ teacherId, studentId }` (unique compound)

---

## Supporting Models

### Achievement
**File:** `src/modules/supporting/models/achievement.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | ObjectId | REF: User, REQUIRED | User reference |
| type | String | REQUIRED | Achievement type |
| earnedAt | Date | AUTO | Date earned |

---

### OTP
**File:** `src/shared/models/otp.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| email | String | REQUIRED | User email |
| otp | String | REQUIRED | 6-digit OTP |
| expiresAt | Date | REQUIRED | Expiration time |
| verified | Boolean | DEFAULT: false | Verification status |

**Indexes:** TTL index on `expiresAt`

---

### ApiLog
**File:** `src/modules/supporting/models/apiLog.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| method | String | | HTTP method |
| url | String | | Request URL |
| statusCode | Number | | Response status |
| requestBody | Object | | Request payload |
| responseBody | Object | | Response payload |
| userId | ObjectId | REF: User | Authenticated user |
| ip | String | | Client IP |
| userAgent | String | | Client user agent |
| duration | Number | | Request duration (ms) |
| createdAt | Date | AUTO | Timestamp |

---

## Quiz Module

### Quiz
**File:** `src/modules/quiz/models/quiz.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| _id | ObjectId | PRIMARY KEY | Auto-generated |
| createdBy | ObjectId | REF: User | Teacher who created |
| title | String | REQUIRED | Quiz title |
| description | String | | Optional description |
| classId | ObjectId | REF: Class | Target class |
| subjectId | ObjectId | REF: Subject | Target subject |
| chapterIds | [ObjectId] | REF: Chapter | Covered chapters |
| sectionIds | [ObjectId] | REF: Section | Target sections |
| settings.timeLimit | Number | DEFAULT: null | Minutes (null = no limit) |
| settings.shuffleQuestions | Boolean | DEFAULT: false | Randomize question order |
| settings.shuffleOptions | Boolean | DEFAULT: false | Randomize option order |
| settings.showAnswersAfter | String | ENUM | immediately, submission, deadline, never |
| settings.allowedAttempts | Number | DEFAULT: 1 | Max attempts (null = unlimited) |
| settings.passingPercentage | Number | DEFAULT: 50 | Pass threshold |
| settings.deadline | Date | DEFAULT: null | Optional deadline |
| status | String | ENUM | draft, published, closed |
| totalQuestions | Number | DEFAULT: 0 | Question count |
| totalMarks | Number | DEFAULT: 0 | Total available marks |
| publishedAt | Date | | Publication timestamp |
| closedAt | Date | | Closure timestamp |
| isDeleted | Boolean | DEFAULT: false | Soft delete flag |

**Indexes:** `{ createdBy, status }`, `{ classId, subjectId, status }`, `{ status, settings.deadline }`

---

### QuizQuestion
**File:** `src/modules/quiz/models/quizQuestion.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| quizId | ObjectId | REF: Quiz | Parent quiz |
| questionId | ObjectId | REF: Question | Question bank reference |
| order | Number | REQUIRED | Display order |
| marks | Number | DEFAULT: 1 | Points for this question |
| isCustom | Boolean | DEFAULT: false | Custom question flag |
| customQuestion | Object | | Optional custom question data |
| customQuestion.questionText | String | | Question text |
| customQuestion.options | [Object] | | MCQ options |
| customQuestion.correctAnswer | String | | Correct answer |
| customQuestion.explanation | String | | Answer explanation |
| customQuestion.questionType | String | ENUM | mcq, fillblanks |
| customQuestion.difficulty | String | ENUM | Easy, Medium, Hard |

**Indexes:** `{ quizId, order }`

---

### QuizAttempt
**File:** `src/modules/quiz/models/quizAttempt.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| studentId | ObjectId | REF: User, REQUIRED | Student reference |
| quizId | ObjectId | REF: Quiz, REQUIRED | Quiz reference |
| attemptNumber | Number | REQUIRED | Attempt sequence (1st, 2nd, etc.) |
| startedAt | Date | | Attempt start time |
| submittedAt | Date | | Submission time |
| timeSpent | Number | | Seconds spent |
| status | String | REQUIRED, ENUM | in_progress, completed, abandoned |
| totalQuestions | Number | REQUIRED | Questions in quiz |
| totalAnswers | Number | | Questions answered |
| totalCorrectAnswers | Number | | Correct answers |
| score | Number | | Marks obtained |
| percentage | Number | | Calculated percentage |
| passed | Boolean | | Based on passingPercentage |

**Indexes:** `{ studentId, quizId }`, `{ quizId, status }`, `{ studentId, quizId, attemptNumber }` (unique)

---

### QuizAnswer
**File:** `src/modules/quiz/models/quizAnswer.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| quizAttemptId | ObjectId | REF: QuizAttempt, REQUIRED | Attempt reference |
| quizQuestionId | ObjectId | REF: QuizQuestion, REQUIRED | Question reference |
| selectedAnswer | String | REQUIRED | Student's answer |
| isCorrect | Boolean | REQUIRED | Correctness flag |
| marksObtained | Number | REQUIRED | Points for this answer |
| answeredAt | Date | DEFAULT: now | Answer timestamp |
| timeTaken | Number | REQUIRED | Seconds for this question |

**Indexes:** `{ quizAttemptId }`, `{ quizQuestionId }`

---

---

### Lead
**File:** `src/modules/question-paper/models/lead.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| name | String | REQUIRED | Prospect name |
| schoolName | String | REQUIRED | Prospect school |
| whatsappNumber | String | REQUIRED | Contact number |
| source | String | DEFAULT: 'public_paper_gen' | Lead source |
| converted | Boolean | DEFAULT: false | Whether became a user |
| paperIds | [ObjectId] | REF: QuestionPaper | Papers requested |
| createdAt | Date | AUTO | Timestamp |

---

## Additional Models

### QuestionPaper
**File:** `src/modules/question-paper/models/questionPaper.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| title | String | REQUIRED | Paper title |
| createdBy | ObjectId | REF: User, REQUIRED | Teacher who generated |
| schoolName | String | | School name for header |
| examName | String | | Exam name (e.g., "Term 1") |
| classId | ObjectId | REF: Class | Target class |
| subjectId | ObjectId | REF: Subject | Target subject |
| chapterIds | [ObjectId] | REF: Chapter | Covered chapters |
| config | Object | | Difficulty mix, question types, total questions |
| duration | Number | | Exam duration in minutes |
| instructions | [String] | | Exam instructions |
| questions | [Object] | | Generated question references with marks |
| totalMarks | Number | | Total marks |
| includeAnswerKey | Boolean | DEFAULT: true | Include answer key |
| status | String | ENUM | draft, generated |
| isDeleted | Boolean | DEFAULT: false | Soft delete flag |

---

### Referral
**File:** `src/modules/referral/models/referral.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | ObjectId | REF: User, REQUIRED | User who owns the code |
| code | String | REQUIRED, UNIQUE | Referral code |
| redeemedBy | [ObjectId] | REF: User | Users who redeemed this code |
| createdAt | Date | AUTO | Timestamp |

**Indexes:** `{ code }` (unique)

---

### Goal
**File:** `src/modules/goal/models/goal.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | ObjectId | REF: User, REQUIRED, UNIQUE | Student reference |
| dailyGoal | Number | DEFAULT: 10 | Questions per day target |
| lastResetDate | Date | | Last daily reset timestamp |
| createdAt | Date | AUTO | Timestamp |
| updatedAt | Date | AUTO | Timestamp |

---

### ParentStudent
**File:** `src/modules/parent/models/parentStudent.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| parentId | ObjectId | REF: User, REQUIRED | Parent user |
| studentId | ObjectId | REF: User, REQUIRED | Linked student |
| relationship | String | | Optional label (e.g., "son", "daughter") |
| createdAt | Date | AUTO | Timestamp |

**Indexes:** `{ parentId, studentId }` (unique compound)

---

### Streak
**File:** `src/modules/progress/models/streak.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | ObjectId | REF: User, REQUIRED, UNIQUE | Student reference |
| currentStreak | Number | DEFAULT: 0 | Consecutive days practiced |
| longestStreak | Number | DEFAULT: 0 | All-time best streak |
| lastPracticedDate | Date | | Last practice date |
| freezesAvailable | Number | DEFAULT: 0 | Streak freezes available |
| freezesUsed | Number | DEFAULT: 0 | Freezes consumed |

---

### DailyChallenge
**File:** `src/modules/progress/models/dailyChallenge.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | ObjectId | REF: User, REQUIRED | Student reference |
| date | Date | REQUIRED | Challenge date |
| questionsToSolve | Number | DEFAULT: 10 | Target questions |
| questionsSolved | Number | DEFAULT: 0 | Questions completed |
| completed | Boolean | DEFAULT: false | Challenge completion flag |
| completedAt | Date | | Completion timestamp |

**Indexes:** `{ userId, date }` (unique compound)

---

### SessionFeedback
**File:** `src/modules/progress/models/sessionFeedback.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | ObjectId | REF: User, REQUIRED | User reference |
| sessionId | ObjectId | REF: Session | Session reference |
| reaction | String | ENUM | happy, neutral, sad |
| npsScore | Number | MIN: 0, MAX: 10 | Net Promoter Score |
| feedbackText | String | | Optional comments |
| createdAt | Date | AUTO | Timestamp |

---

## Database Indexes

### Overview
Database indexes are critical for query performance. The following indexes have been optimized for common query patterns.

### Question Model Indexes
**File:** `src/modules/questions/models/question.model.js`

```javascript
// Compound index for question bank queries
{ chapterId: 1, questionType: 1, difficulty: 1 }

// Additional indexes for filtered lookups
{ chapterId: 1 }
{ difficulty: 1 }
{ questionType: 1 }

// Optimized indexes for common query patterns
{ chapterId: 1, questionType: 1, difficulty: 1, createdAt: -1 }
{ chapterId: 1, createdAt: -1 }
```

**Purpose:**
- Fast retrieval of questions by chapter, type, and difficulty
- Optimized for question bank search and batch retrieval
- Supports sorting by creation date

---

### UserAnswer Model Indexes
**File:** `src/modules/progress/models/userAnswer.model.js`

```javascript
// Session-based queries
{ userId: 1, sessionId: 1, createdAt: -1 }

// User progress tracking
{ userId: 1, subjectId: 1, chapterId: 1 }

// Optimized indexes for common query patterns
{ sessionId: 1 }
{ userId: 1, createdAt: -1 }
{ userId: 1, subjectId: 1, chapterId: 1, difficulty: 1 }
```

**Purpose:**
- Fast retrieval of user answers for sessions
- Optimized for progress calculations and dashboard aggregations
- Supports filtering by subject, chapter, and difficulty

---

### Session Model Indexes
**File:** `src/modules/progress/models/session.model.js`

```javascript
// User session history
{ userId: 1 }
{ userId: 1, chapter: 1 }
{ userId: 1, subject: 1 }
{ userId: 1, createdAt: -1 }

// Optimized indexes for common query patterns
{ userId: 1, endedAt: 1, createdAt: -1 }
```

**Purpose:**
- Fast retrieval of user sessions
- Optimized for "continue where you left off" functionality
- Supports session history and filtering

---

### QuizAnswer Model Indexes
**File:** `src/modules/quiz/models/quizAnswer.model.js`

```javascript
// Attempt-based queries
{ quizAttemptId: 1 }
{ quizQuestionId: 1 }

// Optimized indexes for common query patterns
{ quizAttemptId: 1, answeredAt: -1 }
```

**Purpose:**
- Fast retrieval of quiz answers for attempts
- Optimized for quiz analytics and question analysis
- Supports sorting by answer time

---

### Index Creation Script

**File:** `scripts/createIndexes.js`

To create all indexes in production:

```bash
node scripts/createIndexes.js
```

This script will:
1. Connect to MongoDB
2. Create all indexes defined in models
3. Display index creation status
4. Show final index summary

---

## Performance Considerations

### Query Optimization Best Practices

1. **Use `.lean()` for read-only queries**
   - Reduces memory overhead
   - Faster query execution
   - No Mongoose document methods needed

2. **Use projection to limit fields**
   - Only fetch needed fields
   - Reduces data transfer
   - Improves query speed

3. **Use aggregation for complex queries**
   - Single query instead of multiple
   - All processing in database
   - Better performance for data enrichment

4. **Use caching for frequently accessed data**
   - 95% faster for cached requests
   - Reduces database load
   - Better scalability

### Index Usage Monitoring

Monitor index usage with MongoDB:

```javascript
// Check index usage
db.collection.getIndexes()

// Check query execution plan
db.collection.find({}).explain("executionStats")
```

Target metrics:
- Index hit ratio: > 95%
- Average query time: < 50ms
- Slow queries (>100ms): < 5%

---

*Last Updated: 2026-05-04*

*See [ARCHITECTURE.md](./ARCHITECTURE.md) for how models are used in the application.*

