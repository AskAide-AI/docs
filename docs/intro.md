# AskAide AI Documentation

Welcome to the AskAide AI knowledge base. This site contains documentation for all services in the monorepo.

## Architecture Overview

```
Browser
  └─▶ Frontend (Vite :5173)
        └─▶ Backend (Express :4000)
              └─▶ AI Service (FastAPI :8000)
```

Frontend never calls AI Service directly — everything is proxied through Backend.

## Services

| Service | Stack | Purpose |
|---------|-------|---------|
| [Frontend](/docs/frontend/overview) | React 18 + Vite + Tailwind | Student, teacher & admin SPA |
| [Backend](/docs/backend/overview) | Express.js + MongoDB | API server, auth, business logic |
| [AI Service](/docs/ai-service/overview) | FastAPI + Python | RAG, embeddings, LLM, question gen |
| [Shared Contracts](/docs/shared-contracts/overview) | TypeScript + JSON Schema | Cross-repo type & API definitions |

## Repository Quick Reference

Each section covers:
- **Architecture** — system design, data flow, routing
- **Features** — key capabilities and how they work
- **Development** — setup, conventions, testing
- **Reference** — environment variables, API endpoints
- **Audits** — security, production readiness, data quality

## Quick Start

```bash
# Frontend
cd Frontend && npm install && npm run dev

# Backend
cd Backend && npm install && npm run dev

# AI Service
cd ai-service && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
```

See [Quick Start Guide](/docs/shared-contracts/development/quick-start) for detailed setup.
