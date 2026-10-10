# AskAide AI - Testing

**Last Updated:** 2026-10-10

---

## Current Status

> ✅ **Tests are implemented.** 20 test files exist across 14 of the 19 modules, covering auth, user, content, questions, progress, quiz, teacher, school, principal, question-paper, supporting, referral, challenge and notification.

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
        ├── principal/tests/principalAccount.service.test.js
        ├── principal/tests/principalDashboard.service.test.js
        ├── progress/tests/progress.service.test.js
        ├── question-paper/tests/questionPaper.service.test.js
        ├── questions/tests/questions.service.test.js
        ├── quiz/tests/quiz.service.test.js
        ├── referral/tests/referral.service.test.js
        ├── school/tests/school.service.test.js
        ├── supporting/tests/llmSystem.service.test.js
        ├── supporting/tests/llmSystem.validator.test.js
        ├── supporting/tests/supporting.service.test.js
        ├── teacher/tests/teacher.service.test.js
        ├── teacher/tests/teacherClass.service.test.js
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

// Mock Mongoose model BEFORE dynamic import
jest.unstable_mockModule('../../models/quizAttempt.model.js', () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    // ... other methods
  }
}));

// Dynamic import after mocking
const { default: QuizAttempt } = await import('../../models/quizAttempt.model.js');
const { quizService } = await import('../services/quiz.service.js');

describe('Quiz Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a quiz attempt', async () => {
    QuizAttempt.create.mockResolvedValue({ _id: '123', status: 'in_progress' });
    const result = await quizService.startQuiz('student1', 'quiz1');
    expect(result.status).toBe('in_progress');
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
| Progress | `progress.service.test.js` | Mastery scoring, topic progress |
| Quiz | `quiz.service.test.js` | Quiz CRUD, attempts, grading |
| Teacher | `teacher.service.test.js` | Teacher-student relationships |
| Teacher | `teacherClass.service.test.js` | Class join links, independent schools, report and certificate unlocks |
| School | `school.service.test.js` | School/section management |
| Principal | `principalAccount.service.test.js`, `principalDashboard.service.test.js` | Principal accounts, school-scoped dashboards |
| Supporting | `supporting.service.test.js` | Achievements, API logs |
| Supporting | `llmSystem.service.test.js`, `llmSystem.validator.test.js` | AI System proxy and input validation |
| Question Paper | `questionPaper.service.test.js` | Paper generation, PDF export |
| Referral | `referral.service.test.js` | Signup attribution, activation at 10 answers, monthly cap, practice-paper credits |
| Challenge | `challenge.service.test.js` | Create from session, server-side scoring, claim tokens, referral credit |
| Notification | `notification.service.test.js` | Grouping per day, one-time events, list, unread count, mark read |

---

## Known Gaps

- No integration tests (API endpoint level with supertest)
- No coverage thresholds configured
- Tests use mocked DB — no `mongodb-memory-server` in-memory integration tests

**Modules without tests:** `ai-assistant`, `campaign`, `feedback`, `goal`, `parent` (14/19 modules = 74% have tests).

---

## Recommended Coverage Expansion

### Phase 1 (Next Sprint)
1. **ai-assistant** — content generation calls, clarify flow, error handling
2. **goal** — CRUD operations and daily reset logic

### Phase 2
1. **parent** — dashboard data aggregation
2. **campaign** and **feedback** — campaign sends, unsubscribe tokens, suggestion moderation

### Phase 3
1. Integration tests for cross-module flows (auth → study → progress)
2. AI Service call mocking for deterministic tests

### Coverage Targets

| Metric | Current | Target |
|--------|---------|--------|
| Modules with tests | 14/19 (74%) | 19/19 (100%) |
| Service method coverage | ~40% | 70%+ |
| Controller coverage | 0% | 50%+ |
| Integration tests | 0 | 3 critical flows |

### What to Test
- **Service layer (primary):** business logic, edge cases (missing data, invalid IDs), error handling, mocked AI Service calls
- **Controller layer:** Joi request validation, role-guard enforcement, `sendSuccess()` response format
- **Skip:** Mongoose internals, third-party APIs (mock them), DB performance
