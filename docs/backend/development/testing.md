# AskAide AI - Testing

**Last Updated:** 2026-05-04

---

## Current Status

> ✅ **Tests are implemented.** 10 test files exist across modules, covering auth, content, progress, questions, quiz, teacher, supporting, school, question-paper, and user services.

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
        ├── content/tests/content.service.test.js
        ├── progress/tests/progress.service.test.js
        ├── questions/tests/questions.service.test.js
        ├── quiz/tests/quiz.service.test.js
        ├── question-paper/tests/questionPaper.service.test.js
        ├── school/tests/school.service.test.js
        ├── supporting/tests/supporting.service.test.js
        ├── teacher/tests/teacher.service.test.js
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
| User | `user.service.test.js` | User CRUD, profile management |
| Content | `content.service.test.js` | Chapters CRUD, PDF upload |
| Questions | `questions.service.test.js` | Question retrieval, AI generation |
| Progress | `progress.service.test.js` | Mastery scoring, topic progress |
| Quiz | `quiz.service.test.js` | Quiz CRUD, attempts, grading |
| Teacher | `teacher.service.test.js` | Teacher-student relationships |
| School | `school.service.test.js` | School/section management |
| Supporting | `supporting.service.test.js` | Achievements, API logs |
| Question Paper | `questionPaper.service.test.js` | Paper generation, PDF export |

---

## Known Gaps

- No integration tests (API endpoint level with supertest)
- No coverage thresholds configured
- Tests use mocked DB — no `mongodb-memory-server` in-memory integration tests

**Modules without tests:** `ai-assistant`, `goal`, `parent`, `referral` (10/14 modules = 71% have tests).

---

## Recommended Coverage Expansion

### Phase 1 (Next Sprint)
1. **ai-assistant** — content generation calls, clarify flow, error handling
2. **goal** — CRUD operations and daily reset logic

### Phase 2
1. **parent** — dashboard data aggregation
2. **referral** — code generation and redemption

### Phase 3
1. Integration tests for cross-module flows (auth → study → progress)
2. AI Service call mocking for deterministic tests

### Coverage Targets

| Metric | Current | Target |
|--------|---------|--------|
| Modules with tests | 10/14 (71%) | 14/14 (100%) |
| Service method coverage | ~40% | 70%+ |
| Controller coverage | 0% | 50%+ |
| Integration tests | 0 | 3 critical flows |

### What to Test
- **Service layer (primary):** business logic, edge cases (missing data, invalid IDs), error handling, mocked AI Service calls
- **Controller layer:** Joi request validation, role-guard enforcement, `sendSuccess()` response format
- **Skip:** Mongoose internals, third-party APIs (mock them), DB performance
