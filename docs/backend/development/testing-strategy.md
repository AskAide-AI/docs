# Backend Testing Strategy

Current status and recommended approach for testing the AskAideAI backend.

## Current Status

**10 test files exist** across 10 modules (auth, content, progress, questions, quiz, question-paper, school, supporting, teacher, user).

**Modules WITHOUT tests:** `ai-assistant`, `goal`, `parent`, `referral`

All tests use:
- Jest with `--experimental-vm-modules` for ESM support
- `jest.unstable_mockModule` for mocking
- Mongoose model mocking by mocking the module path

## Test Infrastructure

### Running Tests
```bash
npm test                           # All tests
NODE_OPTIONS=--experimental-vm-modules npx jest src/modules/auth/tests/auth.service.test.js  # Single file
```

### Mocking Pattern
```javascript
import { jest } from '@jest/globals';

// Mock BEFORE dynamic import
jest.unstable_mockModule('../models/chapter.model.js', () => ({
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    // ... other methods used
  }
}));

// Dynamic import AFTER mocking
const { yourService } = await import('../services/your.service.js');
```

## Coverage Gaps

| Module | Tests Exist | Priority for Coverage |
|--------|-------------|----------------------|
| auth | Yes | — |
| content | Yes | — |
| progress | Yes | — |
| questions | Yes | — |
| quiz | Yes | — |
| question-paper | Yes | — |
| school | Yes | — |
| supporting | Yes | — |
| teacher | Yes | — |
| user | Yes | — |
| **ai-assistant** | **No** | **High** |
| **goal** | **No** | **Medium** |
| **parent** | **No** | **Medium** |
| **referral** | **No** | **Low** |

## Recommended Coverage Expansion

### Phase 1 (Next Sprint)
1. **ai-assistant** — Test content generation calls, clarify flow, error handling
2. **goal** — Test CRUD operations and daily reset logic

### Phase 2
1. **parent** — Test dashboard data aggregation
2. **referral** — Test code generation and redemption

### Phase 3
1. Integration tests for cross-module flows (auth → study → progress)
2. AI Service call mocking for deterministic tests

## What to Test

### Service Layer (Primary Focus)
- Business logic: inputs → expected outputs
- Edge cases: missing data, invalid IDs
- Error handling: exceptions → proper error responses
- AI Service integration: mock HTTP calls

### Controller Layer
- Request validation via Joi schemas
- Role guard enforcement
- Response format via `sendSuccess()`

### What NOT to Test
- Mongoose internals (trust the ODM)
- Third-party APIs (mock them)
- Database performance (covered by integration tests)

## Coverage Goals

| Metric | Current | Target |
|--------|---------|--------|
| Modules with tests | 10/14 (71%) | 14/14 (100%) |
| Service method coverage | ~40% | 70%+ |
| Controller coverage | 0% | 50%+ |
| Integration tests | 0 | 3 critical flows |
