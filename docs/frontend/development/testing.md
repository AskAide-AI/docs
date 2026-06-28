# Testing Documentation

> Testing strategy and how to run tests for the AskAideAI frontend.
> Last Updated: June 26, 2026

---

## Current Status

> **Note:** Automated testing is not yet implemented — the project has zero test files and all testing is currently manual. This document outlines the recommended strategy and how tests will run once introduced.

---

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

---

## Recommended Testing Stack

| Tool | Purpose |
|------|---------|
| Vitest | Test runner (native to the Vite ecosystem) |
| React Testing Library | Component testing utilities |
| MSW | API mocking |
| Playwright | End-to-end testing (critical paths only) |

---

## Proposed Test Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Login.test.jsx    # Component tests
│   └── ...
├── hooks/
│   ├── useAuth.js
│   └── useAuth.test.js       # Hook tests
├── utils/
│   ├── formatDate.js
│   └── formatDate.test.js    # Unit tests
└── __tests__/                 # Integration tests
    └── e2e/                   # E2E tests
        └── login.spec.js
```

---

## Test Commands (When Implemented)

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

---

## Component Testing Example

```jsx
// Login.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store';
import Login from './Login';

const renderLogin = () => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </Provider>
  );
};

describe('Login Component', () => {
  it('renders login form', () => {
    renderLogin();
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
  
  it('shows validation errors for empty fields', async () => {
    renderLogin();
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });
  
  it('submits form with valid data', async () => {
    renderLogin();
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      // Assert login API was called or navigation occurred
    });
  });
});
```

---

## Hook Testing Example

```jsx
// useAuth.test.js
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { useAuth } from './useAuth';

const wrapper = ({ children }) => (
  <Provider store={store}>{children}</Provider>
);

describe('useAuth Hook', () => {
  it('returns initial auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
  
  it('logs in user successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
```

---

## API Mocking with MSW

```jsx
// mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
  rest.post('/api/v1/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        token: 'mock-token',
      })
    );
  }),
  
  rest.get('/api/v1/profile/userDetails', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
      })
    );
  }),
];

// mocks/server.js
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

---

## E2E Testing Example (Playwright)

```javascript
// e2e/login.spec.js
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('user can log in', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
  
  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toBeVisible();
  });
});
```

---

## Testing Best Practices

### What to Test
- ✅ Component rendering with different props
- ✅ User interactions (clicks, typing, form submissions)
- ✅ Conditional rendering
- ✅ Error states and loading states
- ✅ API integration (with mocked responses)
- ✅ Custom hooks logic
- ✅ Utility functions

### What NOT to Test
- ❌ Third-party library internals
- ❌ Implementation details
- ❌ CSS styles (use visual regression instead)
- ❌ Type checking (TypeScript does this)

---

## Coverage Goals (Future)

| Metric | Target |
|--------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

### Phased Rollout

| Phase | Target | Timeline |
|-------|--------|----------|
| Phase 1 | P0 areas: 70% coverage | First sprint |
| Phase 2 | P1–P2 areas: 60% coverage | Second sprint |
| Phase 3 | E2E for 3 critical paths | Third sprint |

Priority targets for the first pass: the `useQuestionPolling` hook (loading/polling/mastered states), auth form validation + protected-route redirects, and the Axios JWT/error interceptors.

---

## Manual Testing Checklist

Until automated tests are implemented, use this checklist:

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error shown)
- [ ] Signup and email verification
- [ ] Password reset flow
- [ ] Logout

### Study Flow
- [ ] Select class, subject, chapter
- [ ] Start practice session
- [ ] Answer questions
- [ ] View session results

### Progress
- [ ] View subject progress
- [ ] View chapter details
- [ ] AI insights display

### Admin Panel
- [ ] Create/edit/delete schools
- [ ] Manage teachers and students
- [ ] Upload chapter PDFs

---

*Document maintained by AskAideAI Development Team*
