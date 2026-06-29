# Frontend Refactoring Guide

## Overview
This document outlines the necessary changes to modernize the codebase, improve maintainability, and fix architectural inconsistencies found during the December 2025 code review.

---

## 🚀 Priority 1: Critical Cleanup

### 1. Remove Duplicate Service Layer
**Issue**: Two competing layers for API calls (`src/api` vs `src/services`) cause confusion. `src/services` is legacy.
**Action**:
- [ ] **Delete** the `src/services` directory entirely.
- [ ] **Verify** `src/api/endpoints.js` contains all endpoint constants that were in `services/api.js`.
- [ ] **Verify** `src/api/auth.api.js` contains all auth logic that was in `services/operations`.
- [ ] **Update Imports**: Search for any imports from `../services/...` and update them to use `@/api` or relative paths to `src/api`.

### 2. Fix Environment Variables (Vite Standard)
**Issue**: The code uses `process.env.REACT_APP_` (Create React App style) which does not work natively with Vite in production logic without plugins.
**Action**:
- [ ] **Search & Replace**: Global search for `process.env.REACT_APP_` and replace with `import.meta.env.VITE_`.
- [ ] **Update .env**: Ensure your local `.env` file uses `VITE_` prefix for all client-side variables (e.g., `VITE_API_URL`).
- [ ] **Check `src/api/axios.js`**: Confirm it uses `import.meta.env.VITE_API_URL`.

---

## 🛠 Priority 2: Component Modularity

### 3. Refactor `QuestionPractice.jsx`
**Issue**: File is ~1000 lines, mixing UI, speech recognition, and complex session logic.
**Action**:
- [ ] **Extract Hooks**:
    - Create `src/hooks/useSpeechRecognition.js` for the speech-to-text logic.
    - Create `src/hooks/useSession.js` for managing `sessionHistory` and `currentQuestion`.
- [ ] **Extract Components**:
    - Move the typing animation logic to `src/components/common/Typewriter.jsx`.
    - Extract the question rendering card to `src/components/study/QuestionCard.jsx`.

### 4. Refactor `LandingPage.jsx`
**Issue**: Large file with many hardcoded sections.
**Action**:
- [ ] Create `src/components/pages/landing/` directory.
- [ ] Extract sections into separate files:
    - `HeroSection.jsx`
    - `FeaturesSection.jsx`
    - `TestimonialsSection.jsx`
    - `FooterSection.jsx`

---

## 🧹 Priority 3: Code Quality

### 5. Type Safety (Future Proofing)
**Recommendation**: The project has `tsconfig.json` but uses `.jsx`.
**Action**:
- [ ] Start renaming files from `.jsx` to `.tsx` one by one.
- [ ] Fix basic type errors (add `any` if needed temporarily, then refine).
- [ ] Define interfaces for your core data models: `User`, `Question`, `Session`.

### 6. Linting & Formatting
**Action**:
- [ ] Run `npm run lint` and fix all warnings (unused variables, missing dependencies in useEffect).
- [ ] Ensure Prettier is set up and running to enforce consistent formatting.

---

## Verification Checklist
After making these changes, verify:
1.  **Build**: `npm run build` completes without errors.
2.  **Auth**: Login and Signup flow works.
3.  **Study**: Can start a session, answer questions, and view results.
4.  **Admin**: Admin dashboard still loads data correctly (since it might use legacy services).
