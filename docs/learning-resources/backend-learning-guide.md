# Backend Learning Guide

A comprehensive guide to understanding the **AskAide AI Backend** -- its tech stack, concepts, architecture, and the key technologies used. Whether you are a beginner getting started or a developer ramping up on this project, this guide points you to what you need to know.

---

## What's Inside

1. [Tech Stack Overview](#tech-stack-overview)
2. [Core Concepts](#core-concepts)
3. [Architecture & Project Structure](#architecture--project-structure)
4. [Deep Dive into Key Technologies](#deep-dive-into-key-technologies)
5. [API Design & Conventions](#api-design--conventions)
6. [Testing & Quality](#testing--quality)
7. [Reference Material](#reference-material)

---

## Tech Stack Overview

| Layer | Technology | What it does |
|-------|-----------|-------------|
| **Runtime** | Node.js 23 | JavaScript engine/server runtime |
| **Framework** | Express 4 | Web framework for REST APIs |
| **Database** | MongoDB | NoSQL document database |
| **ODM** | Mongoose 8 | Object-Document Mapper for MongoDB |
| **Authentication** | JWT + bcrypt + Google OAuth | Secure login and user sessions |
| **Validation** | Joi + custom middleware | API request validation |
| **Logging** | Winston | Application logging with daily rotation |
| **Security** | Helmet + express-rate-limit | HTTP security headers & rate limiting |
| **Documentation** | Swagger (swagger-jsdoc + swagger-ui-express) | API documentation |
| **PDF Generation** | Puppeteer-core + @sparticuz/chromium | Headless browser PDF generation |
| **Email** | Nodemailer | Sending transactional emails |
| **Cron Jobs** | node-cron | Scheduled background tasks |
| **Compression** | compression | Gzip response compression |
| **Testing** | Jest (ESM) | Unit testing framework |
| **Linting** | ESLint 9 (Flat Config) | Code linting and style enforcement |

---

## Core Concepts

### REST API
The backend exposes a REST (Representational State Transfer) API. It means:
- Resources (Users, Chapters, Questions, Sessions) are accessed via HTTP methods (`GET`, `POST`, `PUT`, `DELETE`).
- URLs follow a resource-based pattern: `/api/v1/users`, `/api/v1/questions/chapter/:id`.
- The response format is standardized across all endpoints.

### Authentication & Authorization
- **JWT (JSON Web Tokens)**: After login, the server issues a token that the client includes in every request (`Authorization: Bearer <token>`). The server verifies this token to identify the user.
- **Role-Based Access Control (RBAC)**: Middleware checks if a user has a required role (e.g., `isTeacher`, `isAdmin`) before allowing access to a route.
- **Password Security**: Passwords are hashed using `bcrypt` before being stored in the database. Password reset tokens are SHA-256 hashed before DB storage.

### NoSQL / Document Database (MongoDB)
Unlike relational (SQL) databases, MongoDB stores data as flexible JSON-like documents (BSON). This suits rapidly evolving schemas common in modern web apps.
- **Collections** ~= Tables (e.g., `users`, `chapters`, `questions`).
- **Documents** ~= Rows (individual records within a collection).
- **Mongoose** provides schema validation and an elegant ODM layer over raw MongoDB.

### Modular Architecture
The backend is split into "modules," each representing a domain:
- **auth**: Login, signup, password reset
- **content**: Classes, subjects, chapters, topics
- **questions**: Question storage and generation
- **progress**: Student learning progress (sessions, answers, streaks, badges)
- **quiz**: Teacher-created quizzes
- **teacher**: Teacher dashboard and student assignments
- **principal**: School-level analytics and oversight
- **supporting**: Leaderboards, feedback, admin metrics

Each module contains its own `controller`, `service`, `model`, `routes`, and `validator` files.

### ESM (ECMAScript Modules)
The project uses native ES module syntax (`import` / `export`) instead of CommonJS (`require` / `module.exports`). This requires `NODE_OPTIONS=--experimental-vm-modules` for Jest.

---

## Architecture & Project Structure

```
Backend/
- index.js                          # Entry point: sets up Express, middleware, routes
- config/
  - server.config.js              # Environment variables: PORT, ATLAS_DB_URL, NODE_ENV
  - swagger.config.js             # Swagger docs configuration
- routes/
  - v1/
    - index.js                  # Aggregates all v1 module routes
- src/
  - modules/                      # Domain modules (auth, content, progress, ...)
    - auth/
    - content/
    - progress/
    - quiz/
    - teacher/
    - ... (14 total modules)
  - shared/                       # Shared utilities, middleware, models
    - middleware/
      - auth.js                 # JWT auth, role guards
      - apiLogger.middleware.js # Winston request/response logging
      - errorHandler.js         # Global error handler (AppError-based)
      - validate.js             # Joi validation wrapper
    - utils/
      - responseHandler.js    # sendSuccess(res, message, data) helper
      - ...                     # Other shared utilities
```

### Key Files to Know
- `index.js` -- Creates the Express app, applies global middleware (helmet, rate limit, CORS, compression), mounts routes, connects to MongoDB, and starts the server.
- `config/server.config.js` -- Loads `.env` variables (PORT, JWT_SECRET, MONGO_URI, etc.).
- `routes/v1/index.js` -- Imports all module routes and mounts them under `/api/v1`.
- `src/modules/<name>/` -- Each module is self-contained with its own controller, service, model, route, etc.

---

## Deep Dive into Key Technologies

### Express.js
The web application framework. It handles routing, middleware, and HTTP request/response handling.

**What to learn:**
- `app.get()`, `app.post()`, `app.use()` -- Routes and middleware
- `req`, `res` objects -- Reading request data and sending responses
- Middleware pattern (functions that run before your route handler)
- Express Router (modular routes)

### MongoDB & Mongoose
MongoDB is the database; Mongoose provides schema definitions, validation, and a query interface.

**What to learn:**
- Defining schemas (`new mongoose.Schema({ ... })`)
- Creating models (`mongoose.model('Name', schema)`)
- CRUD operations (`.find()`, `.findOne()`, `.create()`, `.findByIdAndUpdate()`, `.findByIdAndDelete()`)
- Virtuals and instance/static methods

### JWT (JSON Web Tokens)
JWT is used for stateless authentication. After login, the server sends a token (instead of a session ID), which the client stores and sends with every request.

**What to learn:**
- Signing tokens (`jsonwebtoken.sign`)
- Verifying tokens (`jsonwebtoken.verify`)
- Extracting the token from the `Authorization` header or cookies
- Token expiration and refresh token strategy

### Joi Validation
Joi is used to validate incoming API request bodies before they reach controllers. This prevents bad data from hitting the database.

**What to learn:**
- Defining schemas (`Joi.object({ name: Joi.string().required() })`)
- Validation functions (`.validate()`, `.validateAsync()`)
- Custom validation rules and error messages

### Winston Logging
Winston is a multi-transport logging library. The project logs to files with daily rotation and can ship logs to Grafana Loki.

**What to learn:**
- Log levels (error, warn, info, debug, etc.)
- Transports (console, file, remote)
- Daily log rotation with `winston-daily-rotate-file`
- Structured/contextual logging with `winston` + `structlog`

### Puppeteer & Chrome Headless
Used for PDF generation. Puppeteer controls a headless Chrome/Chromium browser to render HTML as a PDF.

**What to learn:**
- Launching headless browser (`puppeteer.launch()`)
- Generating PDF from HTML (`page.pdf()`)
- The `@sparticuz/chromium` package (lightweight Chromium for server environments)

---

## API Design & Conventions

### Standardized Response Format
All API endpoints return a consistent JSON structure:
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```
Errors include a `message` and an `error` field.

### Pagination
List endpoints often support `page` and `limit` query parameters for pagination.

### Error Handling
A global `errorHandler.js` catches all errors. Custom `AppError` class is thrown from services for predictable error responses.

---

## Testing & Quality

### Jest with ESM
The project uses Jest for unit testing. Because it uses ESM, you must run tests with:
```bash
NODE_OPTIONS=--experimental-vm-modules npx jest
```

**Key patterns:**
- Mocking modules with `jest.unstable_mockModule()` before dynamic `import()`
- Mocking Mongoose models by file path
- Testing service layer logic (controllers and routes are often tested via integration/e2e)

### ESLint (Flat Config)
Uses ESLint 9 with the new flat config format (`eslint.config.js`). It ensures code quality and consistent style across the codebase.

---

## Reference Material

### Official Docs & Learning
| Topic | Resource |
|-------|----------|
| **Node.js** | [nodejs.org/docs](https://nodejs.org/docs) -- JavaScript runtime |
| **Express.js** | [expressjs.com](https://expressjs.com) -- Web framework |
| **MongoDB** | [mongodb.com/docs](https://www.mongodb.com/docs/) -- Document DB |
| **Mongoose** | [mongoosejs.com](https://mongoosejs.com) -- MongoDB ODM |
| **JWT** | [jwt.io/introduction](https://jwt.io/introduction) -- Token standard |
| **bcrypt** | [npm bcrypt](https://www.npmjs.com/package/bcrypt) -- Password hashing |
| **Joi** | [joi.dev](https://joi.dev/) -- Schema validation |
| **Winston** | [github.com/winstonjs](https://github.com/winstonjs/winston) -- Logging |
| **Helmet** | [helmetjs.github.io](https://helmetjs.github.io/) -- Security middleware |
| **Puppeteer** | [pptr.dev](https://pptr.dev/) -- Headless browser for PDFs |
| **Jest** | [jestjs.io](https://jestjs.io) -- Testing framework |
| **ESLint** | [eslint.org](https://eslint.org) -- Linter |
| **Shared API Contracts** | AskAide Docs: `docs/shared-contracts/api-definitions.md` |

### AskAide AI Specific
| Resource | Location |
|----------|----------|
| Backend README | `Backend/readme.md` |
| Backend Architecture | AskAide Docs: `docs/backend/architecture.md` |
| Backend Setup | AskAide Docs: `docs/backend/development/setup.md` |
| Backend Dependencies | AskAide Docs: `docs/backend/development/dependencies.md` |
| Authentication Guide | AskAide Docs: `docs/backend/development/authentication.md` |
| API Reference (Shared) | AskAide Docs: `docs/shared-contracts/api-definitions.md` |
| Backend Testing Strategy | AskAide Docs: `docs/backend/development/testing.md` |
| Error Handling | AskAide Docs: `docs/backend/development/error-handling.md` |
| Security | AskAide Docs: `docs/backend/development/security.md` |

### Recommended Learning Path
1. **Learn Node.js + Express** (GET/POST, middleware, routing)
2. **Learn MongoDB basics** (documents, collections, CRUD)
3. **Learn Mongoose** (schemas, models, queries, validation)
4. **Learn JWT** (signing, verifying, tokens vs sessions)
5. **Learn Joi** (request validation)
6. **Study the project architecture** (modular structure, middleware chain)
7. **Explore a module** (e.g., auth or content) to see the full request lifecycle
8. **Write a test for a service** using Jest + ESM mocking
