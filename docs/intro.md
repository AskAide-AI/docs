# AskAide AI Documentation

Welcome to the AskAide AI knowledge base. This site contains documentation for all services in the monorepo.

## Services

- [Frontend](/docs/frontend/) - React 18 + Vite SPA (student/teacher/admin UI)
- [Backend](/docs/backend/) - Express.js + MongoDB (API server, auth, business logic)
- [AI Service](/docs/ai-service/) - FastAPI + Python (RAG, embeddings, LLM, question generation)
- [Shared Contracts](/docs/shared-contracts/) - TypeScript types & API definitions

## Architecture

```
Browser
  └─▶ Frontend (Vite :5173)
        └─▶ Backend (Express :4000)
              └─▶ AI Service (FastAPI :8000)
```

Frontend never calls AI Service directly — everything is proxied through Backend.
