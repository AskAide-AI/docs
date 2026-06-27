# System Design Overview: AskAide Backend

## 1. Database Design
- The backend uses **MongoDB** with **Mongoose** ODM.
- Each model is a separate file in `models/` (e.g., `user.model.js`, `chapter.model.js`).

### Current Models (30 total)
| Model | Module | Purpose |
|-------|--------|---------|
| `User` | `shared` | Core user with roles (student, teacher, principal, etc.) |
| `Profile` | `shared` | Extended user profile data |
| `OTP` | `shared` | One-time passwords for verification |
| `School` | `school` | School entity for institutional users |
| `Section` | `school` | Class sections (e.g., "9th-A", "9th-B") |
| `Class` | `content` | Academic standards/grades (6th-12th) |
| `Subject` | `content` | Subjects linked to classes |
| `Chapter` | `content` | Units within subjects (supports PDF uploads) |
| `Topic` | `content` | Granular concepts within chapters |
| `ChapterTopics` | `content` | Many-to-many: Chapter ↔ Topic relations |
| `Question` | `questions` | Question bank (MCQ, Fill-in-blanks) |
| `QuestionGenerationJob` | `questions` | Tracks AI question generation tasks with status, yield, and content-complete flags |
| `QuestionPaper` | `question-paper` | Generated exam papers with marks, duration, and sections |
| `Lead` | `question-paper` | Prospective users from public paper generation |
| `Session` | `progress` | Practice session tracking |
| `UserAnswer` | `progress` | Individual answer records with topic linking |
| `StudentTopicProgress` | `progress` | Topic mastery tracking per student |
| `SessionFeedback` | `progress` | Post-session ratings and feedback |
| `DailyChallenge` | `progress` | Rotating daily practice challenges |
| `Streak` | `progress` | Daily practice streak logging |
| `TeacherStudent` | `teacher` | Teacher-student relationships |
| `ParentStudent` | `parent` | Parent-child linking |
| `Quiz` | `quiz` | Teacher-created quiz definitions |
| `QuizQuestion` | `quiz` | Questions within a quiz |
| `QuizAttempt` | `quiz` | Student quiz attempts with timing |
| `QuizAnswer` | `quiz` | Individual answers within quiz attempts |
| `Goal` | `goal` | Student daily question-answer targets |
| `Referral` | `referral` | Invite codes with redemption tracking |
| `Achievement` | `supporting` | Student achievements/badges |
| `ApiLog` | `supporting` | API request/response logging |

### Entity Relationships
```
School (1) ──→ (N) Section ──→ Class
                      │
                      ↓
User ──→ Role (student/teacher/principal/parent)
  │
  ├──→ School (optional)
  ├──→ Class (students)
  └──→ TeacherStudent (linking teachers to students)

Class (1) ──→ (N) Subject (1) ──→ (N) Chapter (N) ←──→ (M) Topic
                                          │
                                          ↓
                                    Question ──→ Topic
                                          │
                                          ↓
                                    UserAnswer ──→ StudentTopicProgress
```

## 2. Code Architecture

### Pattern: Service-Oriented Modules (within Monolith)
- **Modules** (`src/modules/<module-name>/`): Feature-based modular structure
- **Controllers** (`controllers/`): Thin HTTP handlers using `asyncHandler` wrapper
- **Services** (`services/`): Business logic classes (singleton pattern)
- **Validators** (`validators/`): Joi schemas for request validation
- **Routes** (`routes/`): Express routes with Swagger JSDoc, wired into `routes/v1/`
- **Models** (`models/`): Module-specific Mongoose models (shared models in `src/shared/models/`)
- **Tests** (`tests/`): Jest unit tests for services using `unstable_mockModule` for ESM
- **Middleware** (`src/shared/middleware/`): Auth, logging, validation, and error handling
- **Utils** (`src/shared/utils/`): Helper functions, external integrations
- **Jobs** (`src/shared/jobs/`): Background tasks and scheduled jobs
- **Config** (`config/`): Database, server, and environment config

### Folder Structure
```
Backend/
├── config/           # DB connection, server config, swagger
├── src/
│   ├── modules/      # Feature modules (e.g., auth, questions, sessions)
│   │   └── <module-name>/
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── routes/
│   │       ├── validators/
│   │       ├── models/      # (Optional)
│   │       └── tests/
│   └── shared/       # Shared models, middleware, utils, jobs
├── routes/v1/        # Main API version routing (mounts module routes)
├── scripts/          # Database seeding, bulk operations
├── docs/             # Documentation (you are here!)
└── index.js          # App entry point
```

## 3. API Design
- **RESTful**: Resources follow REST conventions (`/api/v1/{resource}`)
- **Versioned**: All routes under `/api/v1/`
- **Auth**: JWT-based authentication via middleware
- **Rate Limiting**: Applied globally in `index.js`

### Key API Groups
- `/api/v1/user` - Authentication, profile management
- `/api/v1/study` - Study configuration
- `/api/v1/chapters` - Chapter and PDF management
- `/api/v1/questions` - Question bank, batch retrieval
- `/api/v1/sessions` - Practice sessions
- `/api/v1/student-progress` - Topic mastery tracking
- `/api/v1/leaderboard` - Rankings
- `/api/v1/schools` - School management
- `/api/v1/sections` - Class section management
- `/api/v1/teachers` - Teacher APIs
- `/api/v1/students` - Student APIs

## 4. Progress Tracking System

### Topic Mastery Flow
```
1. Student answers question
         ↓
2. UserAnswer created (with topicId)
         ↓
3. StudentTopicProgress updated
   - Difficulty-weighted scoring
   - Easy: 25%, Medium: 35%, Hard: 40%
         ↓
4. Mastery State calculated
   - WEAK (<35%)
   - LEARNING (35-60%)
   - PRACTICING (60-80%)
   - MASTERED (>80%)
```

### Coverage vs Mastery
- **Coverage**: % of topics attempted in a chapter
- **Mastery**: Weighted accuracy across attempted topics

## 5. External Integrations
- **AI Question Generation**: External service for generating questions from PDFs
- **AI Insights**: External service for learning recommendations
- **Google Sheets**: Feedback collection
- **Email Service**: OTP and notifications

---

*Last Updated: 2026-06-25*
