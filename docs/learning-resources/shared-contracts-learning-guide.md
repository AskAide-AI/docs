# Shared Contracts Learning Guide

A guide to understanding the **AskAide AI Shared Contracts** -- the contract-first API layer that keeps our three services in sync.

---

## What's Inside

1. [What Are Shared Contracts?](#what-are-shared-contracts)
2. [Tech Stack](#tech-stack)
3. [File Structure](#file-structure)
4. [How They're Used](#how-theyre-used)
5. [Reference Material](#reference-material)

---

## What Are Shared Contracts?

Shared contracts define the **API surface** of the entire AskAide platform. Instead of each service defining its own types and hoping they match, the contracts are:

- **Single source of truth** for request/response shapes
- **Language-agnostic** (TypeScript for type definitions, Markdown for documentation)
- **Referenced by all three services** during development

When you need to add a new API endpoint or change an existing one, you update the shared contracts first, then implement in Backend + Frontend + AI Service.

---

## Tech Stack

| What | Technology |
|------|-----------|
| Types | TypeScript interfaces (`.ts`) |
| JSON Schema | auto-generated from `.ts` |
| API Docs | Markdown (`.md`) |
| Packaging | None -- consumed by reference, not as an npm package |

---

## File Structure

```
shared-contracts/
- data-models.ts            # All TypeScript interfaces (request/response types)
- data-models.schema.json   # JSON Schema mirror of data-models.ts
- api-definitions.md        # All API endpoint definitions with request/response examples
```

---

## How They're Used

### Development Workflow
1. **Design** -- Define or update the interface in `data-models.ts`
2. **Document** -- Update `api-definitions.md` with the endpoint, method, URL, request/response shapes
3. **Implement** -- Build the endpoint in Backend, the API call in Frontend, and the service in AI Service

### What's Defined
- AI request/response types (query, upload, question generation)
- User and auth types
- Study session types
- Content types (chapters, subjects, topics)
- Quiz and question paper types
- Error response format

---

## Reference Material

### AskAide AI Specific
| Resource | Location |
|----------|----------|
| API Definitions (all endpoints) | `shared-contracts/api-definitions.md` |
| Data Models (TypeScript) | `shared-contracts/data-models.ts` |
| Data Models (JSON Schema) | `shared-contracts/data-models.schema.json` |

### External
| Topic | Resource |
|-------|----------|
| **TypeScript Interfaces** | [typescriptlang.org](https://www.typescriptlang.org/docs/handbook/interfaces.html) |
| **JSON Schema** | [json-schema.org](https://json-schema.org/learn/) |
| **REST API Design** | [restfulapi.net](https://restfulapi.net/) |
