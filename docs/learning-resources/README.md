# AskAide AI Learning Resources

Welcome! These guides help anyone learn the technologies, concepts, and architecture behind each of our three core services. Whether you are onboarding as a new developer, switching stacks, or just want to understand how something works, these docs are for you.

- **[Frontend Learning Guide](frontend-learning-guide.md)** — everything about React, Vite, Tailwind, Redux Toolkit, and how our UI is built
- **[Backend Learning Guide](backend-learning-guide.md)** — Express, MongoDB, Mongoose, JWT, and the modular API architecture
- **[AI Service Learning Guide](ai-service-learning-guide.md)** — Python, FastAPI, RAG, Qdrant, embeddings, and LLM integrations
- **[Shared Contracts Guide](shared-contracts-learning-guide.md)** — the API contract layer shared across all services

Each guide covers the tech stack, core concepts, architecture, and reference materials.

---

## Guides At-A-Glance

| Guide | Language/Framework | Key Concepts | Main Database |
|-------|------------------|-------------|-------------|
| [Frontend](frontend-learning-guide.md) | React 18, Vite, Tailwind CSS, Redux Toolkit, JSX | Components, SPA routing, lazy loading, state management, role-based access | N/A (consumes REST API) |
| [Backend](backend-learning-guide.md) | Node.js, Express, ESM, Mongoose, JWT | REST API, modular architecture, RBAC, validation, PDF generation | MongoDB |
| [AI Service](ai-service-learning-guide.md) | Python 3.11+, FastAPI, Pydantic, PyMongo | RAG, vector search, embeddings, LLM providers, streaming, chunking | MongoDB, Qdrant |
| [Shared Contracts](shared-contracts-learning-guide.md) | TypeScript, Markdown, JSON Schema | API contract-first design, cross-service type safety | N/A (docs + types) |

---

## What These Guides Cover

Each guide provides:

1. **Tech Stack Table** — What technologies are used and what they do
2. **Core Concepts** — Fundamental ideas you need to understand before diving into code
3. **Architecture & Project Structure** — How the repository is organized
4. **Deep Dive into Key Technologies** — Detailed explanations with practical tips
5. **Reference Material** — Links to official docs, AskAide-specific docs, project files, and recommended learning resources

---

## How to Use These Guides

### If you are new to a stack
1. Read the guide cover-to-cover
2. Follow the "Recommended Learning Path" at the end
3. Use the "Reference Material" section for deeper dives into specific topics

### If you are ramping up on the project
1. Skim the Tech Stack and Core Concepts sections
2. Study the Architecture & Project Structure to understand how files are organized
3. Refer to the AskAide-specific resources in the Reference Material table to find internal docs

### If you need a quick reference
- Use the **Reference Material** section at the end of each guide for quick links to docs
- Each table links directly to official documentation and AskAide-specific resources

---

## Cross-Stack Integration

The three services connect in a specific way that is important to understand:

```
Browser -> Frontend (:5173) -> Backend (:4000) -> AI Service (:8000)
```

- The **Frontend** never calls the AI Service directly
- All AI requests proxy through the **Backend**
- The **AI Service** requires an `x-api-key` header for authentication
- The **Backend** and **AI Service** both talk to **MongoDB**
- The **AI Service** also uses **Qdrant** (vector DB) and **Redis** (cache)

Understanding this flow is critical when debugging issues or adding new AI features.

---

## Want to Contribute?

These guides are living documents. If you find outdated links, missing concepts, or better resources, please update the relevant guide and share the improvements with the team.
