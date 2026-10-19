# AskAide AI - Database Schema

**Last Updated:** 2026-10-18  
**Database:** MongoDB with Mongoose ODM (42 models)

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

User ──→ Referral (one code) ──→ referrals[] (invited friends)
User ──→ Challenge (from one Session) ──→ (N) ChallengeAttempt
User (teacher) ──→ TeacherClass (join link) ──→ (N) TeacherStudent (joinedVia)
User ──→ (N) Notification, (N) UserActivityDay
School ──→ (N) FeeStructure, FeeInvoice, FeePayment, AttendanceDay, TimetableVersion, MarkSheet, ReportCard, Notice, TcCertificate
```

---

## Core Models

### User
**File:** `src/shared/models/user.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| _id | ObjectId | PRIMARY KEY | Auto-generated |
| userName | String | UNIQUE, REQUIRED | Login name |
| email | String | UNIQUE, REQUIRED | User email (can be changed after verifying a code) |
| password | String | REQUIRED for `provider: 'email'`, `select: false` | bcrypt hashed |
| provider | String | ENUM, DEFAULT: email | email, google |
| googleId | String | INDEX, SPARSE | Google account ID |
| accountType | String | REQUIRED, ENUM | SuperAdmin, Principal, Parent, Teacher, Student, NormalUser |
| name | String | REQUIRED | Display name |
| active | Boolean | DEFAULT: true | Account active flag |
| approved | Boolean | DEFAULT: true | Set to `true` at signup; SuperAdmin can toggle it from `/admin` |
| emailOptOut | Boolean | DEFAULT: false | Opted out of emails |
| additionalDetails | ObjectId | REF: Profile, REQUIRED | Profile document |
| class | [ObjectId] | REF: Class | Classes the student can practise |
| subject | [ObjectId] | REF: Subject | Subjects |
| schoolId | ObjectId | REF: School | For institutional users and teachers with class links |
| admissionNo | String | MAX: 30, DEFAULT: null | School admission number, set for school-imported students. Unique per school (partial index on `schoolId` + `admissionNo`) |
| sectionId | ObjectId | REF: Section | Class list the student is on (attendance, marks and billing check entries against it) |
| leftSchoolAt | Date | DEFAULT: null | Set when a TC is issued; the student keeps their history but gets no new attendance or fee bills |
| loginSlipAt | Date | DEFAULT: null | Set for a parent login issued on a printed password slip; only these accounts accept the loose slip ID |
| isDemo | Boolean | DEFAULT: false | Account of the public demo school. Rebuilt nightly, never emailed, excluded from metrics, cannot change its identity |
| lastLoginAt | Date | | Last login |
| loginCount | Number | DEFAULT: 0 | Logins |
| lastActiveAt | Date | | Last signed-in request (updated at most every 15 minutes) |
| acquisition | Object | | First-touch attribution: `source` (referral, challenge, class, organic), `ref`, `utmSource`, `utmMedium`, `utmCampaign`, `landingPath`, `firstSeenAt` |
| createdAt | Date | AUTO | Timestamp |
| updatedAt | Date | AUTO | Timestamp |

**Indexes:** `userName` (unique), `email` (unique), `googleId` (sparse)

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
| schoolName | String | REQUIRED | School name |
| schoolCode | String | REQUIRED, UNIQUE | School code |
| address, phone, email, website, board | String | | Contact and board details |
| isDemo | Boolean | DEFAULT: false | The public demo school (rebuilt nightly, excluded from metrics) |
| kind | String | ENUM, DEFAULT: school | `school`, or `independent` for the private school created for a self-signed-up teacher's first class link |
| ownerTeacherId | ObjectId | REF: User | Teacher who owns an `independent` school |
| createdAt | Date | DEFAULT: now | Timestamp |

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
| teacher_id | ObjectId | REF: User, REQUIRED | Teacher user reference |
| student_id | ObjectId | REF: User, REQUIRED | Student user reference |
| class_id | ObjectId | REF: Class, REQUIRED | Class |
| _subject_id | ObjectId | REF: Subject, REQUIRED | Subject |
| school_id | ObjectId | REF: School, REQUIRED | School |
| section_id | ObjectId | REF: Section | Section reference |
| joinedVia | ObjectId | REF: TeacherClass, INDEX | Set when the student joined through a class link |
| createdAt | Date | AUTO | Assignment date |

**Indexes:** `{ teacher_id, student_id, class_id, _subject_id, school_id }` (unique compound), `joinedVia`

---

### TeacherClass
**File:** `src/modules/teacher/models/teacherClass.model.js`

A teacher's class join link (`/join/:code`).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| code | String | REQUIRED, UNIQUE, uppercase | Join code |
| teacherId | ObjectId | REF: User, REQUIRED, INDEX | Teacher |
| schoolId | ObjectId | REF: School, REQUIRED | Teacher's school (or independent school) |
| classId | ObjectId | REF: Class, REQUIRED | Class |
| subjectId | ObjectId | REF: Subject, REQUIRED | Subject |
| sectionId | ObjectId | REF: Section, DEFAULT: null | Optional section |
| className, subjectName, sectionName | String | | Copied in for the public join page |
| expectedStudents | Number | MIN: 1, MAX: 300 | Class size the teacher expects |
| active | Boolean | DEFAULT: true | Turned-off links reject joins (410) |
| joinsCount | Number | DEFAULT: 0 | Students who joined |

**Indexes:** `code` (unique), `teacherId`, `{ teacherId, classId, subjectId, sectionId }`

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

### UserActivityDay
**File:** `src/shared/models/userActivityDay.model.js`

One row per user per IST calendar day on which they made any signed-in request. Written by the `auth` middleware (`src/shared/utils/activityTracker.js`), at most once per user every 15 minutes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | ObjectId | REF: User, REQUIRED | User reference |
| day | String | REQUIRED | `YYYY-MM-DD` in Asia/Kolkata |
| accountType | String | | Role at the time |
| firstSeenAt | Date | | First request that day |
| lastSeenAt | Date | | Latest recorded request that day |

**Indexes:** `{ userId, day }` (unique compound), `{ day, accountType }`

---

### EmailChangeRequest
**File:** `src/modules/user/models/emailChangeRequest.model.js`

A pending change of a user's login email. The code goes to the new address; the email changes only after it is entered.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | ObjectId | REF: User, REQUIRED, UNIQUE | One pending request per user (asking again replaces it) |
| newEmail | String | REQUIRED, lowercase | Requested address |
| codeHash | String | REQUIRED | SHA-256 of the 6-digit code (the code is never stored) |
| attempts | Number | DEFAULT: 0 | Wrong tries (max 5) |
| expiresAt | Date | REQUIRED | 10 minutes after the request |

**Indexes:** `userId` (unique), TTL index on `expiresAt`

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
| createdBy | ObjectId | REF: User | Teacher who generated; optional for public papers |
| title | String | REQUIRED | Paper title |
| classId | ObjectId | REF: Class, REQUIRED | Target class |
| subjectId | ObjectId | REF: Subject, REQUIRED | Target subject |
| chapterIds | [ObjectId] | REF: Chapter | Covered chapters |
| config | Object | | `totalQuestions` (1–100), `difficultyMix` (`easy`/`medium`/`hard`), `questionTypes` (ENUM: mcq, fillblanks, assertion, short2, short3, long5, case), `includeAnswerKey` (DEFAULT: true) |
| questionIds | [ObjectId] | REF: Question | Practice-bank questions on the paper (kept in sync with `items`; written types are only in `items`) |
| totalMarks | Number | DEFAULT: 0 | Sum of item marks |
| duration | Number | DEFAULT: 60 | Exam duration in minutes |
| schoolName | String | | School name for header |
| examName | String | DEFAULT: 'Examination' | Exam name (e.g., "Term 1") |
| instructions | [String] | | Exam instructions |
| header | Object | | Printed header the teacher fills in: `session`, `classSection`, `examDate` (free text), `autoInstructions` (rebuild instructions from the questions when true) |
| items | [Object] | | The teacher's edited paper, in print order — empty for papers made before editing existed (those are shown from `questionIds`). See below |
| status | String | ENUM | generated, failed |
| isDeleted | Boolean | DEFAULT: false | Soft delete flag |

**`items[]` entries** (`_id` is not stored):

| Field | Type | Description |
|-------|------|-------------|
| source | String, ENUM, REQUIRED | `bank` (from the question store) or `own` (the teacher wrote it) |
| questionId | ObjectId, REF: Question (`source: bank`) | For written types it points at `paperquestions` |
| type | String, ENUM, REQUIRED | mcq, fillblanks, assertion, short2, short3, long5, case |
| difficulty | String, ENUM | Easy, Medium, Hard — lets Swap keep the level |
| text | String, REQUIRED | Case-based: the passage |
| options | [String] | MCQ and assertion-reason options |
| answer | String, DEFAULT: '' | Written questions: the model solution |
| markingScheme | [Object] | Value points: `{ point, marks }` (each `_id` not stored) |
| parts | [Object] | Case-based: `{ text, marks, answer, markingScheme }` (each `_id` not stored) |
| marks | Number, DEFAULT: 1 | Marks follow the type (mcq/fillblanks/assertion 1, short2 2, short3 3, long5 5, case sum of parts) unless the teacher changed them |

**Indexes:** `{ createdBy: 1, createdAt: -1 }`, `{ classId: 1, subjectId: 1 }`

---

### PaperQuestion
**File:** `src/modules/question-paper/models/paperQuestion.model.js` · **MongoDB collection:** `paperquestions`

Written questions for printed question papers: assertion-reason, 2/3/5-mark answers, case-based. Kept **apart** from the student practice bank (`questions`) so practice, quizzes, SEO pages and stats never see these types. Written offline by ai-service `scripts/generate_paper_questions.py` (one chapter at a time, checked by a second model) as `draft`; a person reviews them and sets `live`. Paper generation, Swap and `/public/availability` counts only ever read `live` questions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| classId | ObjectId | REF: Class, REQUIRED | Class |
| subjectId | ObjectId | REF: Subject, REQUIRED | Subject |
| chapterId | ObjectId | REF: Chapter, REQUIRED | Chapter it belongs to |
| type | String | ENUM, REQUIRED | assertion, short2, short3, long5, case |
| marks | Number | REQUIRED | 1 / 2 / 3 / 5 / 4 by type |
| difficulty | String | ENUM, DEFAULT: 'Medium' | Easy, Medium, Hard |
| text | String | REQUIRED | Case-based: the passage; assertion: "Assertion (A): …\nReason (R): …" |
| options | [String] | | Assertion-reason: the four standard CBSE options |
| correctOptionIndex | Number | DEFAULT: null | Assertion-reason only |
| answer | String | DEFAULT: '' | Model solution; assertion: the explanation |
| markingScheme | [Object] | | Value points: `{ point, marks }` (each `_id` not stored) |
| parts | [Object] | | Case-based: `{ text, marks, answer, markingScheme }` — 3 parts, 1 + 1 + 2 marks (each `_id` not stored) |
| status | String | ENUM, DEFAULT: 'draft' | draft, live, rejected |
| check | Mixed | | The checker model's verdict (`pass`/`fail`, issues, flags) |
| generator | Mixed | | Which model wrote it |
| fingerprint | String | REQUIRED | Unique per chapter, so re-runs never duplicate a question or undo a review |
| createdAt, updatedAt | Date | AUTO | Timestamps |

**Indexes:** `{ chapterId: 1, fingerprint: 1 }` (unique), `{ chapterId: 1, type: 1, status: 1 }`

---

### Referral
**File:** `src/modules/referral/models/referral.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | ObjectId | REF: User, REQUIRED, UNIQUE | User who owns the code |
| referralCode | String | REQUIRED, UNIQUE, uppercase | 6-character invite code (no 0/O/1/I) |
| referrals | [Object] | | Invited friends, see below |
| totalRewards | Number | DEFAULT: 0 | Friends who earned this user a reward |
| paperCredits | Number | DEFAULT: 0, MIN: 0 | Practice-paper credits earned (both sides get one per activated friend) |
| papersUsed | Number | DEFAULT: 0, MIN: 0 | Credits spent |
| createdAt, updatedAt | Date | AUTO | Timestamps |

**`referrals[]` entries:**

| Field | Type | Description |
|-------|------|-------------|
| referredUserId | ObjectId (REF: User) | The friend |
| referredName | String | Friend's name at signup |
| source | String (ENUM: link, challenge; DEFAULT: link) | How the friend arrived |
| challengeId | ObjectId (REF: Challenge) | Set when `source` is `challenge` |
| joinedAt | Date | When the friend was credited |
| activatedAt | Date (DEFAULT: null) | Set once the friend has answered 3 questions; rewards are given then |
| rewardClaimed | Boolean (DEFAULT: false) | `false` when the friend activated but the referrer was over the monthly cap |

**Indexes:** `userId` (unique), `referralCode` (unique), `referrals.referredUserId`

---

### Challenge
**File:** `src/modules/challenge/models/challenge.model.js`

A challenge-a-friend link (`/c/:code`): the questions a student answered in one session, frozen with their score.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| code | String | REQUIRED, UNIQUE, uppercase | Share code |
| ownerId | ObjectId | REF: User, REQUIRED, INDEX | Student who sent it |
| ownerName | String | REQUIRED | Owner's first name |
| sessionId | ObjectId | REF: Session, REQUIRED, UNIQUE | One challenge per session |
| classId, subjectId, chapterId | ObjectId | REF: Class / Subject / Chapter | Context |
| className, subjectName, chapterName | String | | Copied in for the public page |
| questionIds | [ObjectId] | REF: Question | 3 to 10 multiple-choice questions, in order |
| ownerScore | Number | REQUIRED, MIN: 0 | Owner's correct answers |
| total | Number | REQUIRED, MIN: 1 | Number of questions |
| attemptsCount | Number | DEFAULT: 0 | Plays so far |
| lastAttemptAt | Date | | Latest play |

**Indexes:** `code` (unique), `sessionId` (unique), `ownerId`

---

### ChallengeAttempt
**File:** `src/modules/challenge/models/challengeAttempt.model.js`

One friend's play of a challenge. Guests play without an account and claim the attempt after signing up.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| challengeId | ObjectId | REF: Challenge, REQUIRED | Challenge |
| userId | ObjectId | REF: User, DEFAULT: null | Player, null until a guest claims |
| name | String | | Guest's typed name, or the account's first name |
| answers | [Object] | | `{ questionId, selected, isCorrect }` per question |
| score | Number | REQUIRED, MIN: 0 | Correct answers (graded on the server) |
| total | Number | REQUIRED | Number of questions |
| outcome | String | REQUIRED, ENUM | won, lost, tie (from the player's side) |
| claimTokenHash | String | `select: false` | SHA-256 of the single-use claim token; removed once claimed |
| claimedAt | Date | | When the attempt was linked to an account |

**Indexes:** `{ challengeId, score: -1, createdAt: 1 }`, `{ userId, challengeId }`

---

### Notification
**File:** `src/modules/notification/models/notification.model.js`

One row in a user's notification bell. Events with the same type and `groupKey` on the same IST day fold into one row.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | ObjectId | REF: User, REQUIRED | Who sees it |
| type | String | REQUIRED, ENUM | challenge_played, friend_joined, gift_unlocked, gift_reminder, badge_earned, class_joined, class_milestone, streak_reminder, homework_reminder |
| groupKey | String | REQUIRED | Target the events are grouped by (for example a challenge code or a class link) |
| day | String | REQUIRED | IST `YYYY-MM-DD`, or `once` for one-time events |
| count | Number | | Events folded into the row |
| actors | [String] | | First names behind the events, newest last (max 5) |
| data | Mixed | | Latest event's details, used to word the row |
| link | String | | Where tapping it goes |
| readAt | Date | | Null while unread |
| lastAt | Date | | Latest event |

**Indexes:** `{ userId, type, groupKey, day }` (unique compound), `{ userId, lastAt: -1 }`, `{ userId, readAt }`, TTL on `lastAt` (60 days)

---

### Goal
**File:** `src/modules/goal/models/goal.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | ObjectId | REF: User, REQUIRED, UNIQUE | Student reference |
| dailyGoal | Number | DEFAULT: 20 | Questions per day target |
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
| lastPracticeDate | String | DEFAULT: null | Last practice date, `YYYY-MM-DD` (IST) |
| streakFreezes.total | Number | DEFAULT: 1 | Weekly freezes allowed |
| streakFreezes.used | Number | DEFAULT: 0 | Weekly freezes used this week |
| streakFreezes.bonus | Number | DEFAULT: 0, MIN: 0 | Earned freezes (referral rewards); never reset, spent after the weekly one |
| weeklyFreezeResetDate | Date | DEFAULT: next Monday | When `used` resets |
| practiceDates | [String] | | Last 90 days of practice dates |
| totalPracticeDays | Number | DEFAULT: 0 | Days practised |

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

## School Operations Models

These models back the school modules (fees, attendance, timetable, notices, gradebook and onboarding). Every row carries `schoolId`, and every route is limited to the caller's school (SuperAdmin excepted). Money is always integer paise.

### FeeHeadMaster
**File:** `src/modules/fees/models/feeHeadMaster.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId | ObjectId | REF: School, REQUIRED | School |
| name | String | REQUIRED, MAX: 60 | Head name (for example Tuition) |
| amountPaise | Number | REQUIRED, INTEGER, MIN: 0 | Default amount |
| type | String | ENUM, DEFAULT: tuition | tuition, transport, exam, admission, hostel, library, activity, other |
| isActive | Boolean | DEFAULT: true | Retired heads stay for history |
| createdBy, updatedBy, deletedBy | ObjectId | REF: User | Who changed it |
| deletedAt | Date | DEFAULT: null | Soft delete |

### FeeStructure
**File:** `src/modules/fees/models/feeStructure.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId | ObjectId | REF: School, REQUIRED | School |
| academicYear | String | REQUIRED | For example `2026-27` |
| classId | ObjectId | REF: Class | Class it is for (null for all) |
| name | String | REQUIRED | Structure name |
| lines | [Object] | REQUIRED, at least 1 | Each line: `headId` (REF: FeeHeadMaster), `name`, `amountPaise`, `type` |
| totalPaise | Number | REQUIRED, INTEGER | Sum of the lines per year |
| installments | Number | DEFAULT: 1, MIN 1, MAX 12 | Number of instalments |
| dueDates | [Date] | | One per instalment |
| lateFinePaisePerDay | Number | DEFAULT: 0 | Late fine per full IST day past the due date |
| advanceDiscountPct | Number | DEFAULT: 0, MIN 0, MAX 50 | Advance-payment discount |
| status | String | ENUM, DEFAULT: DRAFT | DRAFT, PUBLISHED, LOCKED. Heads freeze at the first bill generation |
| publishedBy, publishedAt | ObjectId, Date | | Publication record |

**Indexes:** `{ schoolId, academicYear, classId, name }` (unique), `{ schoolId, status }`

### FeeInvoice
**File:** `src/modules/fees/models/invoice.model.js`

One bill: one student, one structure, one instalment.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId, studentId | ObjectId | REF: School, User, REQUIRED | Owner |
| structureId | ObjectId | REF: FeeStructure, REQUIRED | Source structure |
| academicYear | String | REQUIRED | Year |
| installmentNo | Number | DEFAULT: 1 | Instalment number |
| totalPaise | Number | REQUIRED, INTEGER | Bill amount |
| concessionPaise | Number | DEFAULT: 0 | Concession and advance discount |
| lateFinePaise | Number | DEFAULT: 0 | Late fine accrued so far (only grows) |
| amountDuePaise | Number | REQUIRED, INTEGER | Still to pay |
| amountPaidPaise | Number | DEFAULT: 0 | Paid so far (can exceed the bill; refunded by the principal) |
| status | String | ENUM, DEFAULT: UNPAID | UNPAID, PARTIAL, PAID, OVERDUE, CANCELLED |
| dueDate | Date | | Due date of the instalment |
| idempotencyKey | String | REQUIRED, UNIQUE | `student + structure + installment`, so a retry never bills twice |
| generatedBy, cancelledBy | ObjectId | REF: User | Who generated and who cancelled |
| cancelReason, cancelledAt | String, Date | | Cancellation record |
| replacesInvoiceId | ObjectId | REF: FeeInvoice | Reserved for bill replacement; the current code does not write it |

**Indexes:** `{ schoolId, status, dueDate }`, `{ schoolId, studentId, academicYear }`

### FeePayment
**File:** `src/modules/fees/models/payment.model.js`

Append-only money-in event. Corrections are new REFUND rows, never edits.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId, invoiceId, studentId | ObjectId | REQUIRED | Owner and first bill |
| amountPaise | Number | REQUIRED, INTEGER, MIN: 1 | Amount |
| mode | String | ENUM, REQUIRED | cash, bank-transfer, upi-link, online |
| status | String | ENUM, DEFAULT: SUCCESS | PENDING, SUCCESS, FAILED, REFUNDED |
| transactionRef | String | | UTR or gateway reference. Unique per school when present |
| receiptNo | String | REQUIRED | Receipt number, unique per school |
| receivedBy | ObjectId | REF: User, REQUIRED | Cashier |
| notes | String | MAX: 300 | Notes |
| clientRequestId | String | | One key per screen submit. Unique per school when present, so a double click returns the first receipt |
| reversesPaymentId | ObjectId | REF: FeePayment | The payment a REFUND row reverses. Unique: a payment can be refunded once |
| refundReason | String | | Reason for the refund |
| allocations | [Object] | | For a multi-bill payment: `invoiceId`, `amountPaise`, `discountPaise` per bill. Empty for a single-bill payment |

**Indexes:** `{ schoolId, receiptNo }` (unique), `{ schoolId, transactionRef }` (unique, partial), `{ schoolId, clientRequestId }` (unique, partial), `{ reversesPaymentId }` (unique, partial), `{ invoiceId, status }`

### FeeSettings
**File:** `src/modules/fees/models/feeSettings.model.js`

One row per school.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId | ObjectId | REF: School, UNIQUE | School |
| receiptPrefix | String | DEFAULT: SCH, MAX: 8 | Receipt number prefix |
| receiptCounter | Number | DEFAULT: 0 | Advanced only with atomic `$inc` |
| upiId | String | MAX: 60 | UPI ID shown to parents |
| gatewayProvider, gatewayKeyRef | String | MAX: 40, 120 | Gateway name and the vault key name. The secret itself is never stored here |
| lateFinePaisePerDay | Number | DEFAULT: 0 | School default late fine |
| updatedBy | ObjectId | REF: User | Last editor |

### FeeAudit
**File:** `src/modules/fees/models/feeAudit.model.js`

Who changed a money rule and why.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId | ObjectId | REF: School, REQUIRED | School |
| actorId | ObjectId | REF: User, REQUIRED | Who acted |
| action | String | ENUM, REQUIRED | STRUCTURE_PUBLISH, CONCESSION, INVOICE_CANCEL, REFUND, SETTINGS_CHANGE, MASTER_CHANGE, TC_OVERRIDE, DISCOUNT_RULE |
| entityType, entityId | String, ObjectId | REQUIRED | What changed |
| before, after | Mixed | | Snapshots |
| reason | String | REQUIRED, 5 to 500 chars | Why |

**Indexes:** `{ schoolId, createdAt: -1 }`

### AttendanceDay
**File:** `src/modules/attendance/models/attendanceDay.model.js`

One register per section per IST day. The whole list is submitted at once, and the unique key makes a retry idempotent.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId | ObjectId | REF: School, REQUIRED | School |
| sectionId | ObjectId | REF: Section, REQUIRED | Section |
| date | Date | REQUIRED | IST midnight, stored as UTC |
| status | String | ENUM, DEFAULT: DRAFT | DRAFT, SUBMITTED, LOCKED |
| entries | [Object] | | Per student: `studentId`, `status` (PRESENT, ABSENT, HALFDAY, LEAVE), `source` (manual, device) |
| presentCount | Number | DEFAULT: 0 | Summary count |
| markedBy, lastMarkedBy, editedAfterLockBy | ObjectId | REF: User | Who marked, last changed it, and who edited after a lock |

**Indexes:** `{ sectionId, date }` (unique), `{ schoolId, date, status }`

### AttendancePeriod
**File:** `src/modules/attendance/models/attendancePeriod.model.js`

Period register (only when period tracking is on), one per day and period.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| dayId | ObjectId | REF: AttendanceDay, REQUIRED | Parent day |
| schoolId, sectionId | ObjectId | REQUIRED | Scope |
| date | Date | REQUIRED | Denormalised from the day |
| periodNo | Number | REQUIRED, 1 to 12 | Period |
| subjectId, teacherId | ObjectId | REF: Subject, User | Who taught it |
| substitutionId | ObjectId | REF: Substitution | Set when a cover took the period |
| entries | [Object] | | Per student status, as on AttendanceDay |
| markedBy | ObjectId | REF: User | Who marked it |

**Indexes:** `{ dayId, periodNo }` (unique), `{ schoolId, date }`

### StaffAttendance
**File:** `src/modules/attendance/models/staffAttendance.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId, staffId | ObjectId | REF: School, User, REQUIRED | Staff are the school's teachers and principal |
| date | Date | REQUIRED | IST day |
| status | String | ENUM, DEFAULT: PRESENT | PRESENT, ABSENT, HALFDAY, LEAVE, HOLIDAY |
| leaveType | String | ENUM | CL, SL, EL, LWP |
| source | String | ENUM, DEFAULT: manual | manual, device |
| markedBy, regularizedBy | ObjectId | REF: User | Who marked and who regularised |

**Indexes:** `{ schoolId, staffId, date }` (unique), `{ schoolId, date, status }`

### AbsenteeEvent
**File:** `src/modules/attendance/models/absenteeEvent.model.js`

Absence-message outbox. A row is queued per absent or half-day student with a Hindi and an English message. No sender job is wired yet, so rows stay `PENDING`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId, studentId, sectionId | ObjectId | REQUIRED | Scope |
| date | Date | REQUIRED | Day |
| kind | String | ENUM, REQUIRED | ABSENT, HALFDAY |
| messageHi, messageEn | String | REQUIRED | Message text |
| status | String | ENUM, DEFAULT: PENDING | PENDING, SENT, FAILED |
| idempotencyKey | String | REQUIRED, UNIQUE | One row per student, section and day |

**Indexes:** `{ schoolId, status, date }`

### SchoolSettings (attendance)
**File:** `src/modules/attendance/models/schoolSettings.model.js`

One row per school.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId | ObjectId | REF: School, UNIQUE | School |
| periodTracking | Boolean | DEFAULT: false | Turns on period registers |
| workingDays | [Number] | DEFAULT: [1..6] | 0 = Sunday to 6 = Saturday, IST |
| holidays | [Date] | | Explicit holidays |
| updatedBy | ObjectId | REF: User | Last editor |

### TimetableVersion
**File:** `src/modules/timetable/models/timetableVersion.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId | ObjectId | REF: School, REQUIRED | School |
| academicYear | String | REQUIRED | Year |
| term | String | DEFAULT: Annual | Term name |
| effectiveFrom | Date | REQUIRED | Start of the version's term |
| status | String | ENUM | DRAFT, PUBLISHED |
| createdBy, publishedBy | ObjectId | REF: User | Who created and published |
| publishedAt | Date | DEFAULT: null | Publication time |

**Indexes:** `{ schoolId, academicYear, effectiveFrom: -1 }`, `{ schoolId, status }`

### TimetableSlot
**File:** `src/modules/timetable/models/timetableSlot.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| versionId | ObjectId | REF: TimetableVersion, REQUIRED | Grid version |
| schoolId, sectionId, subjectId | ObjectId | REQUIRED | Scope |
| teacherId | ObjectId | REF: User, REQUIRED | Teacher of the period |
| weekday | Number | REQUIRED | 0 = Sunday to 6 = Saturday |
| periodNo | Number | REQUIRED | Period |

**Indexes:** `{ versionId, sectionId, weekday, periodNo }` (unique), `{ versionId, teacherId, weekday, periodNo }` (unique), `{ schoolId, teacherId, weekday }`

### Substitution
**File:** `src/modules/timetable/models/substitution.model.js`

Cover for one absent teacher's period on one date.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId, sectionId, subjectId | ObjectId | REQUIRED | Scope |
| date | Date | REQUIRED | Day |
| periodNo | Number | REQUIRED | Period |
| absentTeacherId, substituteTeacherId | ObjectId | REF: User, REQUIRED | Who is out and who covers |
| status | String | ENUM | ASSIGNED, CANCELLED |
| assignedBy, cancelledBy | ObjectId | REF: User | Who assigned and cancelled |

**Indexes:** `{ schoolId, sectionId, date, periodNo }` (unique), `{ schoolId, substituteTeacherId, date }`, `{ schoolId, date, status }`

### Notice
**File:** `src/modules/notice/models/notice.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId | ObjectId | REF: School, REQUIRED | School |
| title | String | REQUIRED, MAX: 120 | Title |
| body | String | REQUIRED, MAX: 1000 | Text |
| scope | String | ENUM, REQUIRED | school, class, section |
| classId, sectionId | ObjectId | REF: Class, Section | Audience for class or section notices |
| lastDate | Date | DEFAULT: null | Optional last date |
| createdBy | ObjectId | REF: User, REQUIRED | Author |
| createdByName | String | | Author's name, shown on the parent's notice
| editedAt | Date | DEFAULT: null | Set when edited |

**Indexes:** `{ schoolId, createdAt: -1 }`

### NoticeRead
**File:** `src/modules/notice/models/noticeRead.model.js`

One row when a parent has seen a notice ("seen by").

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| noticeId | ObjectId | REF: Notice, REQUIRED | Notice |
| parentId | ObjectId | REF: User, REQUIRED | Parent who saw it |
| schoolId | ObjectId | REF: School, REQUIRED | School |

**Indexes:** `{ noticeId, parentId }` (unique), `{ parentId }`

### ExamPlan
**File:** `src/modules/gradebook/models/examPlan.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId | ObjectId | REF: School, REQUIRED | School |
| academicYear | String | REQUIRED | Year |
| name | String | REQUIRED, MAX: 80 | Plan name (for example Term 1) |
| exams | [Object] | REQUIRED, at least 1 | Each exam: `key` (MAX 30), `name` (MAX 60), `maxMarks` (MIN 1), `weightage` (0 to 100) |
| status | String | ENUM, DEFAULT: DRAFT | DRAFT, PUBLISHED, LOCKED. LOCKED freezes all sheets and cards |
| createdBy, publishedBy | ObjectId | REF: User | Who created and published |
| publishedAt | Date | DEFAULT: null | Publication time |

**Indexes:** `{ schoolId, academicYear, name }` (unique), `{ schoolId, status }`

### MarkSheet
**File:** `src/modules/gradebook/models/markSheet.model.js`

One grid per section, subject and exam.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| planId | ObjectId | REF: ExamPlan, REQUIRED | Plan |
| schoolId, sectionId, subjectId | ObjectId | REQUIRED | Scope |
| examKey | String | REQUIRED | Exam within the plan |
| maxMarks | Number | REQUIRED, MIN 1 | Snapshot taken at submit, so later plan edits never rewrite marks |
| entries | [Object] | | Per student: `studentId`, `marks` (null = not entered yet, distinct from 0), `absent` |
| status | String | ENUM, DEFAULT: DRAFT | DRAFT, SUBMITTED, LOCKED |
| markedBy, lastMarkedBy | ObjectId | REF: User | Who marked |

**Indexes:** `{ planId, sectionId, subjectId, examKey }` (unique), `{ schoolId, sectionId }`

### ReportCard
**File:** `src/modules/gradebook/models/reportCard.model.js`

An immutable published snapshot per student per plan. Republishing needs the principal and a reason.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| planId | ObjectId | REF: ExamPlan, REQUIRED | Plan |
| schoolId, studentId | ObjectId | REQUIRED | Scope |
| subjects | [Object] | | Per subject: `subjectId`, `subjectName`, `exams` (`key`, `obtained`, `max`, `absent`, `counted`), `totalObtained`, `totalMax`, `pct`, `grade` |
| weightedPct | Number | REQUIRED, 0 to 100 | Weighted percentage over exams entered so far |
| grade | String | REQUIRED, MAX: 3 | CBSE-style grade |
| attendancePct | Number | DEFAULT: null | Attendance percentage for the card |
| attendanceDays | Object | | `present`, `total` |
| remark | String | MAX: 300 | Remark on the card |
| status | String | ENUM, DEFAULT: PUBLISHED | PUBLISHED |
| publishedBy, publishedAt | ObjectId, Date | REQUIRED | Who published and when |

**Indexes:** `{ planId, studentId }` (unique), `{ schoolId, studentId }`

### TcCertificate
**File:** `src/modules/onboarding/models/tcCertificate.model.js`

Transfer certificate record. A BLOCKED row is kept as a paper trail for each refused request.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId, studentId | ObjectId | REQUIRED | Scope |
| tcNo | String | REQUIRED | Certificate number, unique per school |
| academicYear | String | REQUIRED | Year |
| duesSnapshotPaise | Number | REQUIRED, INTEGER | Open dues at the time of the request |
| status | String | ENUM | ISSUED, BLOCKED |
| reason | String | REQUIRED, 5 to 500 chars | Reason for the request |
| issuedBy, overrideBy | ObjectId | REF: User | Who requested and who overrode the dues block |

**Indexes:** `{ schoolId, tcNo }` (unique), `{ schoolId, studentId }`

### TcCounter
**File:** `src/modules/onboarding/models/tcCounter.model.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| schoolId | ObjectId | REF: School, UNIQUE | School |
| prefix | String | DEFAULT: TC, MAX: 8 | TC number prefix |
| counter | Number | DEFAULT: 0 | Advanced with atomic `$inc` |
| updatedBy | ObjectId | REF: User | Last editor |

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

### Index Creation at Startup

**File:** `src/shared/utils/ensureIndexes.js`

The server builds every index declared in the models itself. After the database connects, `index.js` calls `ensureIndexes()` in the background, which runs `Model.createIndexes()` for every registered model.

- Mongoose's automatic index build does nothing when the connection uses the `secondaryPreferred` read preference (as `config/db.config.js` does). `createIndexes()` is a write, so it reaches the primary.
- Existing indexes are left alone; nothing is dropped.
- A model whose indexes fail is logged and does not stop the server.

No manual script is needed. (`scripts/` is gitignored, so an older `scripts/createIndexes.js` may not exist in a given checkout.)

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

*Last Updated: 2026-10-10*

*See [ARCHITECTURE.md](../architecture) for how models are used in the application.*

