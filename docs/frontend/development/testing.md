# Testing Documentation

> Testing strategy and how to run tests for the AskAideAI frontend.
> Last Updated: October 10, 2026

---

## Current Status

Vitest and React Testing Library are set up, and the frontend has **23 test files**, all in `src/__tests__/` (no co-located tests). Coverage is still thin: the files guard specific flows and past bugs rather than whole areas. There is no coverage report, no end-to-end suite, and no CI, so tests only run when someone runs them.

---

## Testing Priority Matrix

| Priority | Area | Rationale |
|----------|------|-----------|
| P0 | Auth flows (login, signup, password reset, token refresh) | Blocks all user access |
| P0 | Study session (question load, answer submit) | Core product value |
| P1 | Quiz attempt and submission | Student assessment flow |
| P1 | Admin CRUD operations | Data integrity |
| P1 | Challenge, referral and class-join flows | How new students arrive |
| P2 | Dashboard rendering | Visual, less business-critical |
| P2 | Blog / SEO pages | Static content |
| P3 | UI component library | Shared primitives |

---

## Testing Stack

| Tool | Purpose | Status |
|------|---------|--------|
| Vitest 4 | Test runner (config in the `test` block of `vite.config.ts`, `jsdom` environment, globals on) | Installed |
| React Testing Library + `user-event` | Component testing utilities | Installed |
| `@testing-library/jest-dom` | DOM matchers, loaded by `src/setupTests.js` | Installed |
| `vi.mock` | Mocking `src/api/*` modules and `react-router-dom` | Used instead of MSW |
| Playwright 1.63 | Manual, CLI-driven browser checks (`npx playwright cli`), not a test suite | Installed |

---

## Test Structure

```
src/
└── __tests__/                         # every test file, flat
    ├── navigation-role-model.test.jsx # component / config tests (.jsx)
    ├── token-refresh.test.js          # pure logic tests (.js)
    └── ...
```

Imports are relative (`../components/...`, `../api/...`). There are no path aliases, so `@/store`-style imports won't resolve.

---

## Test Commands

```bash
# Run all tests once
npm test                     # vitest run

# Watch mode
npm run test:watch

# One file, or one test by name
npx vitest run src/__tests__/navigation-role-model.test.jsx
npx vitest run -t "should pass a smoke test"
```

There is no `test:coverage` or `test:e2e` script.

---

## Current Test Files

| File | Covers |
|------|--------|
| `admin-ai-feature-models.test.jsx` | AI System "Model per feature" card |
| `admin-ai-system.test.jsx` | AI System tab: status, test, switch the live model |
| `auth-login-field.test.jsx` | Email-or-username field, role-based redirect after login |
| `badge-unlock-flow.test.jsx` | Badge check maps `{ badgeId, title }` to IDs; unknown badges are skipped so the result card opens |
| `challenge-gift-note.test.jsx` | Gift progress note on challenge pages |
| `challenge-share-card.test.jsx` | Challenge button hidden for short sessions; creates the challenge and opens WhatsApp |
| `curriculum-static-class-6-8.test.js` | Class 6–8 curriculum data and route counts |
| `navigation-role-model.test.jsx` | Which nav items each role sees |
| `notifications-bell.test.jsx` | Unread count, opening the panel marks read, row navigation, empty state, `timeAgo` |
| `onboarding-first-session.test.jsx` | First-run gate and the onboarding → study handoff |
| `placeholder.test.jsx` | The original `1 + 1` smoke test |
| `prerender-route-matcher.test.js` | Prerender URL → page loader (incl. About, Pricing, How it works) |
| `profile-email-change.test.jsx` | Email changes only after the code; name edit saves |
| `question-practice-answer-saving.test.jsx` | Each answer saved at once; session ended on leave and with `keepalive` on tab close |
| `referral-attribution.test.js` | First-touch `?ref=` and UTM capture; pending challenge claim and class join |
| `seo-chapter-page-class-number.test.jsx` | Real class number in SEO chapter copy |
| `seo-chapter-page-legacy-slug.test.jsx` | Legacy chapter URLs redirect; unknown slugs still 404 |
| `seo-class-hub-page.test.jsx` | Class hub lists the right subjects |
| `seo-subject-page-chapter-links.test.jsx` | Distinct chapter link slugs |
| `strip-inline-markdown.test.js` | `stripInlineMarkdown` helper |
| `teacher-ai-clarification.test.jsx` | Teacher AI generator clarification round-trip |
| `token-refresh.test.js` | One refresh per tab and across tabs; `authorizedFetch` refresh-and-retry |
| `try-choice.test.js` | Chapter remembered from `/try`: used once, expires after a day |

---

## Component Testing Example

Mock the API module, render inside a minimal store and a `MemoryRouter`, then drive it with `user-event` (abridged from `notifications-bell.test.jsx`):

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({ unreadCount: vi.fn(), list: vi.fn(), markRead: vi.fn() }));
vi.mock('../api/notification.api', () => ({ notificationApi: api }));

import NotificationBell from '../components/notifications/NotificationBell';
import NotificationCenter from '../components/notifications/NotificationCenter';

const store = configureStore({ reducer: () => ({ auth: { token: 't' }, profile: { user: { _id: 'u1' } } }) });

describe('notification bell', () => {
  it('shows the unread count, opens the list and marks it read', async () => {
    api.unreadCount.mockResolvedValue(2);
    api.list.mockResolvedValue({ items: [], hasMore: false, nextCursor: null, unread: 2 });
    api.markRead.mockResolvedValue({ updated: 2, unread: 0 });

    render(
      <Provider store={store}>
        <MemoryRouter><NotificationBell /><NotificationCenter /></MemoryRouter>
      </Provider>
    );

    await userEvent.click(await screen.findByRole('button', { name: /2 unread/i }));
    await waitFor(() => expect(api.markRead).toHaveBeenCalledWith({ all: true }));
  });
});
```

---

## Logic Testing Example

Pure helpers need no rendering. `localStorage` comes from `jsdom` (from `try-choice.test.js`):

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { saveTryChoice, takeTryChoice, peekTryChoice } from '../utils/tryChoice';

const CHOICE = { classId: 'c1', subjectId: 's1', subject: 'Science', chapterId: 'ch1', chapter: 'Light' };

beforeEach(() => localStorage.clear());
afterEach(() => vi.useRealTimers());

describe('tryChoice', () => {
  it('is used once: take clears it', () => {
    saveTryChoice(CHOICE);
    expect(takeTryChoice()).toMatchObject(CHOICE);
    expect(takeTryChoice()).toBeNull();
  });

  it('expires after a day', () => {
    vi.useFakeTimers();
    saveTryChoice(CHOICE);
    vi.advanceTimersByTime(25 * 60 * 60 * 1000);
    expect(peekTryChoice()).toBeNull();
  });
});
```

---

## Browser Checks (Playwright CLI)

There is no Playwright test suite. To check a change in a real browser, `node scripts/pw-auth.mjs <role> --target=local` signs in through the Backend API and writes a storage-state file (roles: student, teacher, principal, superadmin). `npx playwright cli` then opens pages with that state and writes snapshots, console output and screenshots to `.playwright-cli/`. Check small phones too (320, 360, 375 and 412 px wide): Playwright's "iPhone SE" preset is 320 px.

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

Next targets: the `useQuestionPolling` hook (loading/polling/mastered states), protected-route redirects, and the quiz attempt flow. The Axios refresh logic is now covered by `token-refresh.test.js`.

---

## Manual Testing Checklist

Automated tests cover only parts of the app. Before a release, also check:

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error shown)
- [ ] Signup (email and Google), including `/signup?role=teacher`
- [ ] Password reset flow
- [ ] Edit name; change email with the 6-digit code
- [ ] Two tabs open past the 2-hour token expiry both stay signed in
- [ ] Logout

### Study Flow
- [ ] Select class, subject, chapter
- [ ] Start practice session
- [ ] Answer questions; switch tabs mid-session (no warning)
- [ ] View session results; Challenge on WhatsApp is visible without scrolling on a 320 px phone

### Sharing and Notifications
- [ ] Open a challenge link signed out, play, then sign up and see the results
- [ ] Teacher creates a class link; a new student joins through `/join/...`
- [ ] Bell shows the unread count; opening the panel marks all read

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
