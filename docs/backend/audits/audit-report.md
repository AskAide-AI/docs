# Backend Codebase Audit & Best Practices Report

## Executive Summary
This document outlines the findings from a "Staff Backend Engineer" level audit of the current backend codebase. The goal is to identify areas for improvement to align with industry best practices, lessen technical debt, and improve scalability, security, and maintainability.

## 1. Project Architecture & Structure

### Current State
- **Pattern**: MVC (Model-View-Controller) where "Views" are API responses.
- **Logic Placement**: Business logic is currently tightly coupled within **Controllers** (e.g., `auth.controller.js`, `questions.controller.js`).
- **Issues**:
    - Hard to test controllers in isolation.
    - specialized logic (like AI generation, OTP handling) is mixed with HTTP request handling.
    - Code duplication potential is high.

### Recommendations (✅ Adopted)
- **Adopt Service-Oriented Architecture (within Monolith)**:
    - **Implemented via `api-module-scaffold`**: The project now uses structured Service-Oriented Modules (`src/modules/<module-name>/`).
    - **Controllers**: Handlers are kept thin, utilizing `asyncHandler`.
    - **Services**: Business logic is isolated into singleton service classes.

## 2. Validation & Type Safety

### Current State
- **Validation**: Manual validation using `if (!field) ...` blocks inside controllers.
- **Issues**: Error prone, repetitive, and inconsistent error messages.

### Recommendations (✅ Adopted)
- **Use a Validation Library**: Adopted **Joi** for defining schemas.
- **Middleware**: Validation middleware is standard, with schemas located in `validators/` directories of each module.

```javascript
// Example Zod Usage
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  // ...
});
```

## 3. Error Handling

### Current State
- **Pattern**: `try/catch` blocks in every controller method.
- **Response**: `res.status(500).json({ error: e.message })`.
- **Issues**:
    - Repetitive boilerplate.
    - Inconsistent error status codes.
    - Security risk: sending raw `error.message` to client can leak database details or stack traces.

### Recommendations (✅ Adopted)
- **AppHelper / AsyncWrapper**: Adopted `asyncHandler` wrapper for all controllers.
- **Centralized Error Middleware**: Standardized error handling middleware.
- **Custom Error Classes**: Adopted `AppError` class. Each module extends this for specific errors (e.g., `ModuleNameError`).

## 4. Database & ORM

### Current State
- **Dual ORMs**: Both `mongoose` and `@prisma/client` are installed. The codebase actively uses Mongoose.
- **Connection**: logic in `db.config.js` has a strict check: `if(NODE_ENV == "development") await mongoose.connect(...)`.
- **Critical Risk**: This means in `production` environment, the DB **will not connect**.

### Recommendations (✅ Adopted)
- **Consolidate ORMs**: Consolidated to **Mongoose** as dictated by the `database-patterns` skill.
- **Fix Connection Logic**: Addressed through standard `server.config.js` and `db.config.js` setups.
- **indexes**: Proper schema design patterns are now established in `database-patterns`.

## 5. Security

### Current State
- **Secrets**: `feedback-form-....json` (Google Service Account) appears to be in the codebase (based on file list). **This is a severe security risk.**
- **Env Vars**: `.env` is used, which is good.
- **Rate Limiting**: Present in `index.js`, which is good.
- **Auth**: JWT used in `auth.controller.js`.

### Recommendations
- **Remove Secrets**: Delete `.json` key files from repo immediately and add to `.gitignore`. Load these creds from Environment Variables.
- **Helmet**: Install `helmet` middleware to set secure HTTP headers.
- **Sanitization**: Use `express-mongo-sanitize` to prevent NoSQL injection.

## 6. Async Processing & Background Jobs

### Current State
- **Handling**: `questions.controller.js` calls `generateQuestionsBackground` without awaiting it.
- **Issues**: In a serverless or containerized environment (AWS Lambda, Docker, Kubernetes), the process might be killed immediately after the HTTP response is sent, killing the background job.

### Recommendations
- **Message Queue**: Use **BullMQ** (with Redis) for robust background processing.
- **Retry Logic**: Queues handle retries, backoff, and failure logging out-of-the-box.

## 7. Logging

### Current State
- **Custom Middleware**: `apiLogger` intercepts `res.send` and saves full request/response to MongoDB.
- **Issues**:
    - **Performance**: High DB write load for every request.
    - **Storage**: Storing full response bodies (PDFs, large lists) will bloat DB.
    - **Privacy**: May log sensitive user data if not scrubbed.

### Recommendations
- **Logger Lib**: Use **Winston** or **Pino**.
- **Transport**: Log to `stdout` (standard out) and let the infrastructure (Docker/AWS CloudWatch) capture it. Don't write to DB synchronously from the app.
- **Scrubbing**: Ensure passwords/tokens are scrubbed from logs.

## 8. Testing

### Current State
- **Tests**: None observable (`package.json` test script is empty).

### Recommendations (✅ Adopted)
- **Framework**: **Jest** is set up and configured for ESM using `NODE_OPTIONS=--experimental-vm-modules jest`.
- **Strategy**:
    - **Unit Tests**: The standard is to test the **service layer** (business logic).
    - **Mocking**: Follows the `jest.unstable_mockModule` pattern.

## Action Plan Checklist

> **Last Reviewed**: 2026-01-04

- [ ] **Immediate Fix**: Remove Google JSON key from repo. *(Verify if still present)*
- [ ] **High**: Fix `db.config.js` production connection logic. *(Check current implementation)*
- [x] **High**: Setup `services/` folder and move Auth logic first. (Addressed by new modular scaffold)
- [x] **Medium**: Install `zod` and create validation middleware. (Addressed by Joi validators)
- [x] **Medium**: Setup Global Error Handler. (Addressed by centralized AppError and asyncHandler)
- [ ] **Long-term**: Implement BullMQ for question generation. *(Currently using background functions)*
- [ ] **Long-term**: Write initial integration tests for Auth flow.

---
*Note: This audit was originally performed on 2025-12-21. Some items may have been addressed. Recommend re-audit before major releases.*
