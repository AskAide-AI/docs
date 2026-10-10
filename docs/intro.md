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
| [Frontend](/docs/frontend/overview) | React 18 + Vite + Tailwind | Student, teacher, principal, parent & admin SPA |
| [Backend](/docs/backend/overview) | Express.js + MongoDB | API server, auth, business logic, scheduled jobs |
| [AI Service](/docs/ai-service/overview) | FastAPI + Python | RAG, embeddings, LLM, question gen |
| [Shared Contracts](/docs/shared-contracts/overview) | TypeScript + JSON Schema | Cross-repo type & API definitions |

## Repository Quick Reference

Each section covers:
- **Architecture** — system design, data flow, routing
- **Features** — key capabilities and how they work
- **Development** — setup, conventions, testing
- **Reference** — environment variables, API endpoints

## What the Platform Does

- **Students:** chapter-wise AI-generated practice (Classes 6–12) with explanations, topic mastery tracking, quizzes, streaks, badges and a weekly leaderboard
- **Challenge a friend:** turn a finished practice session into a link friends can play without an account
- **Refer & Earn:** invite friends; when a friend answers 10 questions, both get a free practice paper and a streak shield
- **Notifications:** an in-app bell for challenge plays, friends joining, gifts, badges and class activity
- **Teachers:** free self-signup (email or Google), class join links, class dashboards, quizzes, question papers and an AI assistant
- **Principals, parents and admins:** school-level dashboards, linked children's progress, curriculum and chapter PDF management
- **Everyone:** edit your name and change your sign-in email with a confirmation code

For the details, see the [End-User Guide](/docs/reference/user-guide) and the [API Reference](/docs/reference/api-reference).

## Quick Start

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd Backend && npm install && npm run dev

# AI Service
cd ai-service && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
```

See [Getting Started](/docs/reference/getting-started) for detailed setup.
