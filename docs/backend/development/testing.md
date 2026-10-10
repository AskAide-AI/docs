# AskAide AI - Testing

**Last Updated:** 2026-10-10

---

## Current Status

> ✅ **Tests are implemented.** 25 test files exist across 15 of the 19 modules, covering auth, user, content, questions, progress, quiz, teacher, school, principal, parent, question-paper, supporting, referral, challenge and notification. Most test a service with mocked models; a few test a controller or mount a real router (see [Route Tests](#route-tests)).

---

## Testing Stack

| Tool | Purpose |
|------|---------|
| **Jest** | Test runner and assertion library |
| **jest.unstable_mockModule** | ESM-compatible module mocking |

Mongoose models are mocked using `jest.unstable_mockModule` (not `mongodb-memory-server`).

---

## Test Structure

Tests live alongside their modules in `src/modules/*/tests/`:

```
Backend/
└── src/
    └── modules/
        ├── auth/tests/auth.service.test.js
        ├── auth/tests/activityTracker.test.js
        ├── auth/tests/refreshRotation.test.js
        ├── challenge/tests/challenge.service.test.js
        ├── content/tests/content.service.test.js
        ├── notification/tests/notification.service.test.js
        ├── parent/tests/parentDashboard.routes.test.js
        ├── principal/tests/principalAccount.service.test.js
        ├── principal/tests/principalDashboard.service.test.js
        ├── progress/tests/progress.service.test.js
        ├── progress/tests/userDataRoutes.test.js
        ├── question-paper/tests/questionPaper.service.test.js
        ├── questions/tests/questions.service.test.js
        ├── quiz/tests/quiz.controller.test.js
        ├── quiz/tests/quiz.service.test.js
        ├── referral/tests/referral.service.test.js
        ├── school/tests/school.service.test.js
        ├── supporting/tests/llmSystem.service.test.js
        ├── supporting/tests/llmSystem.validator.test.js
        ├── supporting/tests/supporting.service.test.js
        ├── teacher/tests/principalScope.routes.test.js
        ├── teacher/tests/teacher.service.test.js
        ├── teacher/tests/teacherClass.service.test.js
        ├── teacher/tests/teacherDashboard.routes.test.js
        └── user/tests/user.service.test.js
```

---

## Running Tests

### package.json Scripts
```json
{
  "scripts": {
    "test": "NODE_OPTIONS=--experimental-vm-modules jest"
  }
}
```

### Commands
```bash
# Run all tests
npm test

# Run a single test file
NODE_OPTIONS=--experimental-vm-modules npx jest src/modules/auth/tests/auth.service.test.js
```

---

## Testing Pattern

### ESM + MockModule Pattern

All tests use `jest.unstable_mockModule` for ESM-compatible mocking:

```javascript
import { jest } from '@jest/globals';

// Mock the Mongoose models BEFORE the dynamic import
const mockQuiz = { findById: jest.fn() };
const mockTeacherStudent = { findOne: jest.fn() };
jest.unstable_mockModule('../models/index.js', () => ({
  Quiz: mockQuiz,
  QuizQuestion: {},
  QuizAttempt: {},
  QuizAnswer: {},
  // ... other methods and models
}));
jest.unstable_mockModule('../../teacher/models/index.js', () => ({
  TeacherStudent: mockTeacherStudent,
}));

// Dynamic import after mocking
const { default: quizService } = await import('../services/quiz.service.js');

describe('Quiz Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refuses a student who is not assigned to the quiz', async () => {
    mockQuiz.findById.mockResolvedValue({ _id: 'quiz1', createdBy: 'teacher1', status: 'published', settings: {} });
    mockTeacherStudent.findOne.mockResolvedValue(null);
    await expect(quizService.startQuizAttempt('student1', 'quiz1'))
      .rejects.toMatchObject({ statusCode: 403, code: 'ACCESS_DENIED' });
  });
});
```

---

## Test Coverage by Module

| Module | Test File | Key Coverage |
|--------|-----------|-------------|
| Auth | `auth.service.test.js` | Login, signup, OTP, JWT |
| Auth | `refreshRotation.test.js` | Single-use refresh tokens (atomic claim) |
| Auth | `activityTracker.test.js` | Daily-active rows, IST day, write throttling |
| User | `user.service.test.js` | User CRUD, profile management, name change, email change codes |
| Content | `content.service.test.js` | Chapters CRUD, PDF upload |
| Questions | `questions.service.test.js` | Question retrieval, AI generation, option shuffling, public preview matching |
| Progress | `progress.service.test.js` | Mastery scoring, topic progress, mastery summary topic names |
| Progress | `userDataRoutes.test.js` | Routes keyed by `/:userId` serve only that user or a SuperAdmin (`NOT_YOUR_DATA`); `use-freeze` and daily-challenge `complete` failures return `success: false`; `canAccessUser` |
| Quiz | `quiz.service.test.js` | Quiz CRUD, starting and resuming attempts, stable shuffle, grading, `canRetry`, student quiz list, history, per-question analysis |
| Quiz | `quiz.controller.test.js` | Only the quiz's teacher or a SuperAdmin reads the full quiz; teacher quiz list access |
| Teacher | `teacher.service.test.js` | Teacher-student relationships |
| Teacher | `teacherClass.service.test.js` | Class join links, independent schools, report and certificate unlocks |
| Teacher | `teacherDashboard.routes.test.js` | A teacher opens only their own dashboard; SuperAdmin opens any |
| Teacher | `principalScope.routes.test.js` | Principal teacher, school and section routes stay inside the principal's school; `NO_SCHOOL`; SuperAdmin unlimited |
| Parent | `parentDashboard.routes.test.js` | Child routes validate only the ids in the path; the parent comes from the token |
| School | `school.service.test.js` | School/section management |
| Principal | `principalAccount.service.test.js`, `principalDashboard.service.test.js` | Principal accounts, school-scoped dashboards |
| Supporting | `supporting.service.test.js` | Achievements, API logs |
| Supporting | `llmSystem.service.test.js`, `llmSystem.validator.test.js` | AI System proxy and input validation |
| Question Paper | `questionPaper.service.test.js` | Paper generation, PDF export |
| Referral | `referral.service.test.js` | Signup attribution, activation at 10 answers, monthly cap, practice-paper credits |
| Challenge | `challenge.service.test.js` | Create from session, server-side scoring, claim tokens, referral credit |
| Notification | `notification.service.test.js` | Grouping per day, one-time events, list, unread count, mark read |

---

## Route Tests

`parentDashboard.routes.test.js`, `userDataRoutes.test.js`, `teacherDashboard.routes.test.js` and `principalScope.routes.test.js` check the role and ownership guards end to end through the real router. Each mounts the router on a bare Express app listening on a random port, signs test JWTs with a test `JWT_SECRET`, and calls it with `fetch`; the controllers or services behind it are mocked. There is no supertest dependency.

---

## Known Gaps

- No integration tests across modules or against a real database
- No coverage thresholds configured
- Tests use mocked DB — no `mongodb-memory-server` in-memory integration tests

**Modules without tests:** `ai-assistant`, `campaign`, `feedback`, `goal` (15/19 modules = 79% have tests).

---

## Recommended Coverage Expansion

### Phase 1 (Next Sprint)
1. **ai-assistant** — content generation calls, clarify flow, error handling
2. **goal** — CRUD operations and daily reset logic

### Phase 2
1. **parent** — dashboard data aggregation (the routes are covered; the service is not)
2. **campaign** and **feedback** — campaign sends, unsubscribe tokens, suggestion moderation

### Phase 3
1. Integration tests for cross-module flows (auth → study → progress)
2. AI Service call mocking for deterministic tests

### Coverage Targets

| Metric | Current | Target |
|--------|---------|--------|
| Modules with tests | 15/19 (79%) | 19/19 (100%) |
| Service method coverage | ~40% | 70%+ |
| Controller coverage | 1 controller, 4 route files | 50%+ |
| Integration tests | 0 | 3 critical flows |

### What to Test
- **Service layer (primary):** business logic, edge cases (missing data, invalid IDs), error handling, mocked AI Service calls
- **Controller layer:** Joi request validation, role-guard enforcement, `sendSuccess()` response format
- **Skip:** Mongoose internals, third-party APIs (mock them), DB performance
