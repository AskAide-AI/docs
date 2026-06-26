# Frontend Testing Strategy

Current status and recommended approach for testing the AskAideAI frontend.

## Current Status

**No automated tests exist.** The project has zero test files. All testing is done manually.

This document outlines the recommended strategy for introducing tests.

## Testing Priority Matrix

| Priority | Area | Rationale |
|----------|------|-----------|
| P0 | Auth flows (login, signup, password reset) | Blocks all user access |
| P0 | Study session (question load, answer submit) | Core product value |
| P1 | Quiz attempt and submission | Student assessment flow |
| P1 | Admin CRUD operations | Data integrity |
| P2 | Dashboard rendering | Visual, less business-critical |
| P2 | Blog / SEO pages | Static content |
| P3 | UI component library | Shared primitives |

## Recommended Stack

| Tool | Purpose |
|------|---------|
| Vitest | Test runner (already in Vite ecosystem) |
| React Testing Library | Component testing |
| MSW | API mocking |
| Playwright | E2E testing (critical paths only) |

## Test Structure

```
src/
├── __tests__/
│   ├── components/    # Component tests
│   ├── hooks/         # Custom hook tests
│   └── utils/         # Utility function tests
└── mocks/
    ├── server.js      # MSW server setup
    └── handlers.js    # API mock handlers
```

## What to Test

### Auth Components
- Login form renders and validates
- Signup triggers OTP flow
- Protected routes redirect unauthenticated users
- Role-protected routes block wrong roles

### Study Flow (P0)
- `useQuestionPolling` hook — loading, polling, mastered states
- Question display renders MCQ and fill-in-blanks
- Answer submission updates session state
- Session completion shows results modal

### Quiz Flow (P1)
- Quiz list renders available quizzes
- Quiz attempt loads questions with timer
- Answer submission auto-saves
- Quiz submission shows result breakdown

### API Layer
- Axios interceptor injects JWT token
- Error interceptor handles 401/500 responses
- Response normalization handles paginated vs flat shapes

## What NOT to Test (initially)

- Visual/design details (use manual review)
- Third-party library internals
- Animation timing
- Exact CSS values

## Coverage Goals

| Phase | Target | Timeline |
|-------|--------|----------|
| Phase 1 | P0 areas: 70% coverage | First sprint |
| Phase 2 | P1-P2 areas: 60% coverage | Second sprint |
| Phase 3 | E2E for 3 critical paths | Third sprint |
