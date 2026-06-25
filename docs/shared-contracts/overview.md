# Shared Contracts

TypeScript type definitions, JSON Schema mirrors, and API endpoint documentation shared across the Frontend, Backend, and AI Service repositories.

## Purpose

When a change affects a request/response shape crossing the Backend ↔ AI Service boundary, the shared contracts ensure all three services stay in sync.

## Files

| File | Purpose |
|------|---------|
| `api-definitions.md` | Complete API endpoint reference for Backend and AI Service |
| `integration-guide.md` | Cross-repo contract documentation and setup workflows |
| `development/quick-start.md` | One-command setup guide for all three repos |
| `development/mcp-setup.md` | MCP server configuration for Cursor/WindSurf/Cline |
| `product/competitor-feature-matrix.md` | Feature comparison across 8 EdTech competitors |
| `product/competitor-research.md` | In-depth competitor research and gap analysis |
| `product/duplicate-questions-investigation.md` | Root cause analysis of duplicate question generation |
| `product/growth-strategy.md` | SEO, partnerships, and market penetration strategy |
| `audits/pre-launch-audit-report.md` | Pre-launch security and readiness audit |
| `audits/product-audit-report.md` | Comprehensive product audit with fix status |

## API Response Envelope

All Backend endpoints return:
```json
{ "success": true, "message": "...", "data": { ... } }
```

## Data Models (TypeScript)

See `data-models.ts` for shared types including:
- `AIQueryRequest` / `AIQueryResponse` — RAG query
- `AIGenerateQuestionsRequest` / `AIGenerateQuestionsResponse` — Question generation
- `AIDocumentUploadRequest` / `AIDocumentUploadResponse` — Document pipeline
- `AIInsightRequest` / `AIInsightResponse` — Learning insights
- `AIAssistantRequest` / `AIAssistantResponse` — AI assistant

## Workflow

When making cross-repo changes:
1. Update `api-definitions.md` for endpoint changes
2. Update `data-models.ts` for model changes
3. Update `data-models.schema.json` (JSON Schema mirror)
