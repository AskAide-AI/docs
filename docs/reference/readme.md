# AskAide AI — Master Documentation Hub

> **AI-powered adaptive learning platform for Indian students (Classes 6–12)**
> Personalized education at scale through AI automation.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Service Architecture](#service-architecture)
- [Quick Navigation by Role](#quick-navigation-by-role)
- [Documentation Index](#documentation-index)
- [Environment Setup](#environment-setup)
- [Contributing](#contributing)
- [Support](#support)

---

## Project Overview

**AskAide AI** is an advanced EdTech platform that delivers AI-powered adaptive learning for Indian students in classes 6 through 12. Unlike traditional LMS platforms that host static content, AskAide AI dynamically generates practice questions, tracks detailed topic mastery, and provides real-time AI tutoring.

Built as a B2B platform for schools, it offers role-based access for Students, Teachers, Parents, and Administrators — each with tailored workflows and dashboards.

### Target Audience

| Role | Description |
|------|-------------|
| **Students** (Classes 6–12) | Primary end-users focusing on learning and practice |
| **Teachers** | Monitor student performance, generate question papers, guide learning |
| **Parents** | Track their child's academic progress |
| **School Administrators** | Manage school onboarding, user rosters, curriculum, and analytics |
| **SuperAdmins** | Platform-wide management and configuration |

### Core Value Proposition

- **Infinite Practice**: AI generates unlimited curriculum-aligned questions
- **Topic Mastery Tracking**: Granular progress at the sub-topic level
- **AI Coaching**: Personalized learning recommendations based on performance
- **Automated Exam Papers**: Professional question papers generated in seconds
- **School Management**: Multi-tenant architecture for institutional deployment

---

## Key Features

### Adaptive Study Engine
- Dynamic MCQ and Fill-in-the-Blanks question generation
- Three difficulty modes: Easy, Medium, Hard
- Real-time answer feedback with detailed explanations
- Session-based practice with score tracking

### Intelligent Analytics
- Topic mastery scoring (0–100%) per sub-topic
- Subject coverage vs. mastery depth visualization
- AI-powered personalized learning insights
- Session history and performance trends

### Question Paper Generator
- AI-powered paper assembly with customizable constraints
- Configurable difficulty mix, total marks, and duration
- PDF export with answer keys for teachers
- Public lead magnet page for B2B marketing

### Institution Management
- Multi-school, multi-class, multi-section hierarchy
- Bulk CSV upload for teachers and students
- AI-powered curriculum ingestion from textbook PDFs
- Teacher-student assignment and section management

### Teacher Dashboard
- Class-level performance analytics
- Student activity monitoring
- Weak topic identification across sections
- Question paper generation and history

---

## Tech Stack

| Layer | Technology | Details |
|-------|------------|---------|
| **Frontend** | React 18 + Vite | TypeScript (partial migration), Tailwind CSS, Material UI, Redux Toolkit, React Router (lazy-loaded) |
| **Backend** | Express.js + MongoDB | Node.js, Mongoose ODM, JWT auth (HTTP-only cookies), Winston logging, Swagger docs |
| **AI Service** | FastAPI + Python | RAG pipeline, Qdrant vector DB, Redis caching, multi-provider LLM support |
| **Databases** | MongoDB Atlas + Qdrant + Redis | Metadata, vector embeddings, caching/pub-sub |
| **LLM Providers** | OpenRouter / OpenAI / Gemini / Anthropic | Configurable via `LLM_PROVIDER` env var |
| **Embeddings** | Ollama / OpenAI / Google / External | Fallback chain via `EMBEDDING_PROVIDERS` env var |
| **Deployment** | Render (Backend) + Docker (AI/Qdrant) | Production URLs at `askaideaibackend.onrender.com` and `ai-service.askaide.ai` |

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Frontend (React 18 + Vite)                      │
│                  Port: 5173                                      │
│                                                                  │
│  • Student study sessions, progress dashboards                   │
│  • Teacher analytics, question paper generation                  │
│  • Admin school/user management                                  │
│  • Parent progress tracking                                      │
│                                                                  │
│  VITE_API_URL → http://localhost:4000/api/v1                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST API calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                Backend (Express.js + MongoDB)                     │
│                Port: 4000                                        │
│                                                                  │
│  • JWT authentication & role-based access control                │
│  • 14 feature modules (auth, content, quiz, progress, etc.)      │
│  • Request validation, error handling, rate limiting             │
│  • Proxies all AI requests to AI Service                         │
│                                                                  │
│  AI_ENDPOINT → http://localhost:8000                            │
│  AI_QUESTION_REQ_URL → http://localhost:8000/generate-questions │
└──────────┬──────────────────────────────────┬───────────────────┘
           │ HTTP calls to AI Service          │ MongoDB
           ▼                                    ▼
┌──────────────────────────────┐      ┌──────────────────┐
│    AI Service (FastAPI)       │      │   MongoDB Atlas   │
│    Port: 8000                 │      │                  │
│                               │      │   study_platform │
│  • RAG pipeline               │      │   ai_service     │
│  • Document ingestion         │      └──────────────────┘
│  • Semantic search            │
│  • Question generation        │      ┌──────────────────┐
│  • AI learning insights       │      │     Qdrant       │
│  • Concept graph & learning   │      │  Vector Storage  │
│    path generation            │      └──────────────────┘
│                               │
│  LLM_PROVIDER → openrouter   │      ┌──────────────────┐
│  EMBEDDING_PROVIDERS → ollama │      │      Redis       │
│                               │      │  Cache + Pub/Sub │
└───────────────────────────────┘      └──────────────────┘
```

### Request Flow

```
Browser → Frontend → Backend → AI Service
                    ↓              ↓
                 MongoDB       Qdrant + Redis
```

**Important:** Frontend **never** calls AI Service directly — all AI requests are proxied through Backend.

---

## Quick Navigation by Role

### 🎓 Student

Start practicing and track your learning progress.

| What you need | Where to go |
|---------------|-------------|
| Start a study session | [Study Flow Guide](../frontend/docs/frontend/STUDY_SESSION_FLOW.md) |
| View your progress | [Product Manual — Student Workflow](../frontend/docs/PRODUCT_MANUAL.md#workflow-1-start-a-study-session) |
| Understand question types | [Backend API — Question APIs](../Backend/readme.md#question-apis) |
| See AI recommendations | [AI Features Quick Reference](../ai-service/docs/AI_FEATURES_QUICKREF.md) |

### 👩‍🏫 Teacher

Monitor students, generate papers, and guide learning.

| What you need | Where to go |
|---------------|-------------|
| Teacher dashboard overview | [Teacher Dashboard API — Backend](../Backend/docs/frontend/TEACHER_DASHBOARD_API.md) |
| Teacher dashboard API — Frontend | [Teacher Dashboard API — Frontend](../frontend/docs/frontend/TEACHER_DASHBOARD_API.md) |
| Generate question papers | [Product Manual — Teacher Workflow](../frontend/docs/PRODUCT_MANUAL.md#workflow-generate-question-papers) |
| Quiz module integration | [Quiz Module API](../Backend/docs/frontend/QUIZ_MODULE_API.md) |
| Question selection system | [Question Selection System](../Backend/docs/backend/QUESTION_SELECTION.md) |

### 👨‍👩‍👧 Parent

Track your child's academic progress.

| What you need | Where to go |
|---------------|-------------|
| Parent module overview | [Backend Architecture](../Backend/docs/backend/ARCHITECTURE.md) |
| Student progress data | [Student Progress APIs](../Backend/readme.md#student-progress-apis) |
| AI insights explanation | [AI Features Quick Reference](../ai-service/docs/AI_FEATURES_QUICKREF.md) |

### 🛠️ Administrator (SuperAdmin)

Manage schools, users, and platform configuration.

| What you need | Where to go |
|---------------|-------------|
| School onboarding | [Product Manual — Admin Workflow](../frontend/docs/PRODUCT_MANUAL.md#workflow-1-onboard-a-school--users) |
| User management (bulk upload) | [Backend Features](../Backend/docs/backend/FEATURES.md) |
| Curriculum management | [Content Service Integration](../ai-service/CROSS_REPO_MAP.md#document-upload-pipeline) |
| Section management | [Backend API — Section APIs](../Backend/readme.md#section-management-apis) |
| Teacher-student linking | [Backend API — Teacher-Student APIs](../Backend/readme.md#teacher-student-apis) |
| System deployment | [Backend Deployment Guide](../Backend/docs/backend/DEPLOYMENT.md) |

### 💻 Developer

Set up, contribute, and maintain the platform.

| What you need | Where to go |
|---------------|-------------|
| Local environment setup | [Environment Setup](#environment-setup) |
| Frontend architecture | [Frontend Architecture](../frontend/docs/frontend/ARCHITECTURE.md) |
| Backend architecture | [Backend Architecture](../Backend/docs/backend/ARCHITECTURE.md) |
| AI service architecture | [AI Service README](../ai-service/README.md) |
| Cross-repo integration | [Cross-Repository Map](../ai-service/CROSS_REPO_MAP.md) |
| API contracts | [API Definitions](../shared-contracts/api-definitions.md) |
| Shared data models | [Data Models](../shared-contracts/data-models.ts) |
| Contributing guidelines | [Contributing](#contributing) |

---

## Documentation Index

### Root Level

| Document | Description |
|----------|-------------|
| [CLAUDE.md](../CLAUDE.md) | Root monorepo overview, service connections, env vars, task routing |

### Frontend (`frontend/`)

#### Core Documentation
| Document | Description |
|----------|-------------|
| [README.md](../frontend/README.md) | Project overview, tech stack, getting started |
| [CLAUDE.md](../frontend/CLAUDE.md) | Tech overview and development commands |
| [AGENTS.md](../frontend/AGENTS.md) | Custom agent definitions for common workflows |
| [project_overview.md](../frontend/project_overview.md) | Detailed architecture and feature breakdown |
| [product.md](../frontend/product.md) | Product identity, target audience, business context |
| [REFACTORING_GUIDE.md](../frontend/REFACTORING_GUIDE.md) | Refactoring patterns and guidelines |
| [audit.md](../frontend/audit.md) | Code audit and quality report |

#### Technical Docs (`frontend/docs/frontend/`)
| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](../frontend/docs/frontend/ARCHITECTURE.md) | Frontend architecture and design patterns |
| [API-INTEGRATION.md](../frontend/docs/frontend/API-INTEGRATION.md) | API client setup and integration patterns |
| [COMPONENT-LIBRARY.md](../frontend/docs/frontend/COMPONENT-LIBRARY.md) | Reusable component documentation |
| [DEPENDENCIES.md](../frontend/docs/frontend/DEPENDENCIES.md) | Package dependencies and versions |
| [DEPLOYMENT.md](../frontend/docs/frontend/DEPLOYMENT.md) | Production deployment guide |
| [FEATURES.md](../frontend/docs/frontend/FEATURES.md) | Feature implementation details |
| [FORMS-AND-VALIDATION.md](../frontend/docs/frontend/FORMS-AND-VALIDATION.md) | Form handling with React Hook Form + Zod |
| [PAGES-AND-ROUTES.md](../frontend/docs/frontend/PAGES-AND-ROUTES.md) | Route definitions and page components |
| [PERFORMANCE.md](../frontend/docs/frontend/PERFORMANCE.md) | Performance optimization guide |
| [ACCESSIBILITY.md](../frontend/docs/frontend/ACCESSIBILITY.md) | Accessibility and i18n standards |
| [SEO-CHECKLIST.md](../frontend/docs/frontend/SEO-CHECKLIST.md) | SEO implementation checklist |
| [STATE-MANAGEMENT.md](../frontend/docs/frontend/STATE-MANAGEMENT.md) | Redux Toolkit state patterns |
| [STYLING-GUIDE.md](../frontend/docs/frontend/STYLING-GUIDE.md) | Tailwind CSS + CSS variables styling guide |
| [STUDY_SESSION_FLOW.md](../frontend/docs/frontend/STUDY_SESSION_FLOW.md) | Study session user flow |
| [TESTING.md](../frontend/docs/frontend/TESTING.md) | Testing strategy and examples |
| [SETUP.md](../frontend/docs/frontend/SETUP.md) | Development environment setup |
| [CHANGELOG.md](../frontend/docs/frontend/CHANGELOG.md) | Frontend changelog |
| [PROGRESS.md](../frontend/docs/frontend/PROGRESS.md) | Development progress tracking |

#### Product & Research
| Document | Description |
|----------|-------------|
| [PRODUCT_MANUAL.md](../frontend/docs/PRODUCT_MANUAL.md) | Complete product guide and user workflows |
| [AI_RESEARCH_PROMPT.md](../frontend/docs/AI_RESEARCH_PROMPT.md) | AI research prompts and patterns |
| [production-readiness.md](../frontend/docs/production-readiness.md) | Production readiness checklist |

---

### Backend (`Backend/`)

#### Core Documentation
| Document | Description |
|----------|-------------|
| [readme.md](../Backend/readme.md) | API documentation, models, endpoints, setup |
| [CLAUDE.md](../Backend/CLAUDE.md) | Backend architecture, commands, env vars |
| [AGENTS.md](../Backend/AGENTS.md) | Agent guide with commands, architecture, testing |
| [MULTI_EXPERT_TEAM_GUIDE.md](../Backend/MULTI_EXPERT_TEAM_GUIDE.md) | Multi-expert team collaboration guide |

#### Technical Docs (`Backend/docs/backend/`)
| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](../Backend/docs/backend/ARCHITECTURE.md) | System architecture and module structure |
| [API-DOCUMENTATION.md](../Backend/docs/backend/API-DOCUMENTATION.md) | Detailed API reference |
| [AUTHENTICATION.md](../Backend/docs/backend/AUTHENTICATION.md) | JWT auth implementation and role guards |
| [DATABASE-SCHEMA.md](../Backend/docs/backend/DATABASE-SCHEMA.md) | MongoDB schema definitions |
| [DEPLOYMENT.md](../Backend/docs/backend/DEPLOYMENT.md) | Production deployment guide |
| [DEPENDENCIES.md](../Backend/docs/backend/DEPENDENCIES.md) | Package dependencies |
| [ERROR-HANDLING.md](../Backend/docs/backend/ERROR-HANDLING.md) | Error handling patterns |
| [FEATURES.md](../Backend/docs/backend/FEATURES.md) | Feature implementation details |
| [PROJECT-OVERVIEW.md](../Backend/docs/backend/PROJECT-OVERVIEW.md) | Project overview and goals |
| [PROGRESS.md](../Backend/docs/backend/PROGRESS.md) | Development progress |
| [QUESTION_SELECTION.md](../Backend/docs/backend/QUESTION_SELECTION.md) | Question selection algorithm |
| [SECURITY.md](../Backend/docs/backend/SECURITY.md) | Security implementation |
| [SETUP.md](../Backend/docs/backend/SETUP.md) | Development setup guide |
| [TESTING.md](../Backend/docs/backend/TESTING.md) | Testing strategy (Jest + ESM) |
| [CHANGELOG.md](../Backend/docs/backend/CHANGELOG.md) | Backend changelog |

#### Frontend Integration Docs
| Document | Description |
|----------|-------------|
| [TEACHER_DASHBOARD_API.md](../Backend/docs/frontend/TEACHER_DASHBOARD_API.md) | Teacher dashboard API contract |
| [QUIZ_MODULE_API.md](../Backend/docs/frontend/QUIZ_MODULE_API.md) | Quiz module API contract |

#### Strategy & Analysis
| Document | Description |
|----------|-------------|
| [Backend_Overview_for_PM.md](../Backend/docs/Backend_Overview_for_PM.md) | Overview for product managers |
| [backend_system_design.md](../Backend/docs/backend_system_design.md) | System design document |
| [backend_audit_report.md](../Backend/docs/backend_audit_report.md) | Backend audit report |
| [DATA-GAP-ANALYSIS.md](../Backend/docs/DATA-GAP-ANALYSIS.md) | Data gap analysis |
| [QUIZ_MODE_IMPLEMENTATION_PLAN.md](../Backend/docs/QUIZ_MODE_IMPLEMENTATION_PLAN.md) | Quiz mode implementation plan |
| [PRODUCT-INTRODUCTION.md](../Backend/docs/PRODUCT-INTRODUCTION.md) | Product introduction document |
| [production-readiness.md](../Backend/docs/production-readiness.md) | Production readiness checklist |
| [schools_pricing_and_marketing.md](../Backend/docs/schools_pricing_and_marketing.md) | Pricing and marketing strategy |
| [quiz-test-cases.md](../Backend/docs/quiz-test-cases.md) | Quiz test cases |
| [strategic-growth-analysis.md](../Backend/docs/strategic-growth-analysis.md) | Strategic growth analysis |

#### Archive
| Document | Description |
|----------|-------------|
| [implementation_features.md](../Backend/docs/archive/implementation_features.md) | Archived feature implementations |
| [folder_structure_best_practices.md](../Backend/docs/archive/folder_structure_best_practices.md) | Folder structure guidelines |
| [AskAide_Comprehensive_Architecture.md](../Backend/docs/archive/AskAide_Comprehensive_Architecture.md) | Comprehensive architecture overview |

---

### AI Service (`ai-service/`)

#### Core Documentation
| Document | Description |
|----------|-------------|
| [README.md](../ai-service/README.md) | Quick start, API reference, project structure |
| [CLAUDE.md](../ai-service/CLAUDE.md) | AI service architecture, commands, env vars |
| [AGENTS.md](../ai-service/AGENTS.md) | Agent guide with skills and patterns |
| [CROSS_REPO_MAP.md](../ai-service/CROSS_REPO_MAP.md) | Cross-repository integration map |
| [DOCUMENTATION.md](../ai-service/DOCUMENTATION.md) | Comprehensive documentation index |
| [DATASET_AUDIT.md](../ai-service/DATASET_AUDIT.md) | Dataset audit report |
| [copilot-instructions.md](../ai-service/copilot-instructions.md) | Copilot instructions for AI agents |

#### Technical Docs (`ai-service/docs/`)
| Document | Description |
|----------|-------------|
| [AI_FEATURES_QUICKREF.md](../ai-service/docs/AI_FEATURES_QUICKREF.md) | AI features quick reference guide |
| [INTEGRATION_PLAN.md](../ai-service/docs/INTEGRATION_PLAN.md) | Integration planning document |
| [INTEGRATION_PLAN_FULL.md](../ai-service/docs/INTEGRATION_PLAN_FULL.md) | Full integration plan details |
| [production-readiness.md](../ai-service/docs/production-readiness.md) | Production readiness checklist |

---

### Shared Contracts (`shared-contracts/`)

| Document | Description |
|----------|-------------|
| [api-definitions.md](../shared-contracts/api-definitions.md) | All API endpoint definitions |
| [QUICK_START.md](../shared-contracts/QUICK_START.md) | Quick start guide for contracts |
| [integration-guide.md](../shared-contracts/integration-guide.md) | Integration guide for cross-service contracts |

#### Research & Strategy (`shared-contracts/docs/`)
| Document | Description |
|----------|-------------|
| [CLAUDE.md](../shared-contracts/docs/CLAUDE.md) | Contracts documentation guide |
| [competitor-feature-matrix.md](../shared-contracts/docs/competitor-feature-matrix.md) | Competitor feature comparison |
| [competitor-research.md](../shared-contracts/docs/competitor-research.md) | Competitor research analysis |
| [growth-and-visibility-strategy.md](../shared-contracts/docs/growth-and-visibility-strategy.md) | Growth strategy document |

---

## Environment Setup

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | Backend runtime |
| Python | 3.10+ | AI service runtime |
| MongoDB | 6.0+ | Primary database (or MongoDB Atlas) |
| Qdrant | Latest | Vector database (Docker recommended) |
| Redis | 7.0+ | Caching and pub-sub |
| npm | 9+ | Package manager |

### Quick Start

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd "AskAide AI"
```

#### 2. Backend Setup

```bash
cd Backend
cp .env.example .env    # Configure environment variables
npm install
npm run dev             # Starts on port 4000
```

#### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env    # Set VITE_API_URL=http://localhost:4000/api/v1
npm install
npm run dev             # Starts on port 5173
```

#### 4. AI Service Setup

```bash
cd ai-service
cp .env.example .env    # Configure LLM provider, Qdrant, MongoDB, Redis
pip install -r requirements.txt

# Start Qdrant
docker run -p 6333:6333 qdrant/qdrant

# Start AI service
uvicorn main:app --reload --port 8000
```

### Environment Variables

#### Backend (`.env`)
```env
PORT=4000
DATABASE_URL=mongodb://localhost:27017/study_platform
JWT_SECRET=your-secret-key
AI_ENDPOINT=http://localhost:8000
AI_QUESTION_REQ_URL=http://localhost:8000/generate-questions
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
EMAIL_USER=...
EMAIL_PASS=...
```

#### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:4000/api/v1
```

#### AI Service (`.env`)
```env
SELF_API_URL=http://localhost:8000
LLM_PROVIDER=openrouter          # openrouter | openai | gemini | anthropic
OPENROUTER_API_KEY=sk_...
EMBEDDING_PROVIDERS=ollama,google # ollama,external,openai,google
OLLAMA_BASE_URL=http://localhost:11434
QDRANT_HOST=localhost
QDRANT_PORT=6333
MONGO_URI=mongodb://localhost:27017/ai_service
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Contributing

### Development Workflow

1. **Fork and clone** the repository
2. **Create a feature branch** from `main`
3. **Set up** all three services locally (see [Environment Setup](#environment-setup))
4. **Make changes** following the coding standards below
5. **Test** your changes across affected services
6. **Submit a pull request** with a clear description

### Coding Standards

| Service | Lint | Type Check | Format |
|---------|------|------------|--------|
| **Frontend** | `npm run lint` | — | Prettier |
| **Backend** | `npm run lint` | — | — |
| **AI Service** | `ruff check .` | `mypy . --ignore-missing-imports` | `ruff format .` |

### Branch Naming

```
feat/short-description
fix/issue-number-description
docs/update-description
refactor/component-name
```

### Commit Messages

```
feat: add student progress API endpoint
fix: resolve quiz timer synchronization issue
docs: update API documentation for question papers
refactor: extract auth middleware into shared module
```

### Cross-Repo Changes

When modifying APIs or data structures that cross service boundaries:

1. Update `shared-contracts/data-models.ts` (TypeScript types)
2. Update `shared-contracts/data-models.schema.json` (JSON Schema)
3. Update `shared-contracts/api-definitions.md` (endpoint docs)
4. Update the affected service implementations
5. Verify integration between services

### Testing

| Service | Command | Framework |
|---------|---------|-----------|
| **Frontend** | `npm run build` | Build verification |
| **Backend** | `npm test` | Jest with ESM |
| **AI Service** | `pytest tests/ -v` | Pytest |

### Key Patterns

- **Frontend**: React Hook Form + Zod for forms, Redux Toolkit for state, Tailwind CSS only (no inline styles)
- **Backend**: Module-based architecture, `sendSuccess()` response format, `AppError` class for errors
- **AI Service**: Pydantic schemas, service layer pattern, LLM provider abstraction

---

## Support

### Documentation Issues

If you find outdated or missing documentation, please open an issue with:
- The document path
- What's missing or incorrect
- Suggested updates

### Getting Help

- **Architecture questions**: See the [Cross-Repository Map](../ai-service/CROSS_REPO_MAP.md)
- **API reference**: See [API Definitions](../shared-contracts/api-definitions.md)
- **Setup issues**: Check each service's `SETUP.md` document
- **Contributing**: Review this document's [Contributing](#contributing) section

---

## License

This project is proprietary. All rights reserved by the AskAide AI team.

---

*Last updated: June 2026*
