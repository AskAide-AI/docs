# Shared Contracts

TypeScript type definitions, JSON Schema mirrors, and API endpoint documentation shared across the Frontend, Backend, and AI Service repositories.

## Purpose

When a change affects a request/response shape crossing the Backend ↔ AI Service (or Backend ↔ Frontend) boundary, the shared contracts ensure all three services stay in sync. The repo holds documentation and types only; there is no runnable code or build.

## Files

| File | Purpose |
|------|---------|
| `api-definitions.md` | Endpoint catalog for Backend and AI Service ([copy on this site](./api-definitions.md)) |
| `data-models.ts` | Canonical TypeScript types for request/response shapes |
| `data-models.schema.json` | Hand-maintained JSON Schema mirror of `data-models.ts` |
| `integration-guide.md` | Cross-repo contract documentation and setup workflows |
| `QUICK_START.md` | Setup guide for all three repos |

MCP server configuration for Cursor/WindSurf/Cline is described on this site under [MCP setup](./development/mcp-setup.md).

## API Response Envelope

All Backend endpoints return:
```json
{ "success": true, "message": "...", "data": { ... } }
```

Paginated lists sit under `data.items`. Errors return `{ "success": false, "message": "...", "code": "..." }`.

## Data Models (TypeScript)

See `data-models.ts` for shared types including:
- `AIQueryRequest` / `AIQueryResponse` — RAG query
- `AIGenerateQuestionsRequest` / `AIGenerateQuestionsResponse` — Question generation
- `AIDocumentUploadRequest` / `AIDocumentUploadResponse` — Document pipeline
- `AIInsightRequest` / `AIInsightResponse` — Learning insights
- `AIAssistantRequest` / `AIAssistantResponse` — AI assistant
- `LlmStatus`, `LlmTestRequest` / `LlmTestResult`, `LlmSwitchResult`, `LlmFeatureRequest` / `LlmFeatureSwitchResult` — live LLM switching and per-feature models (SuperAdmin AI System tab)
- `UserAcquisition`, `ReferralAttribution` — signup attribution (invite code, challenge, UTMs)
- `ReferralSummary`, `PracticePaperRedeemResult` — Refer & Earn
- `ChallengeSummary`, `PublicChallenge`, `ChallengeAttemptResult`, `ChallengeClaimResult`, `ChallengeReview`, `MyChallenge`, `ChallengeGiftStatus` — challenge a friend
- `ClassLinkSummary`, `MyClassLinks`, `ClassLinkPublic`, `ClassJoinResult`, `ClassReport`, `TeacherCertificate` — teacher class join links
- `NotificationItem`, `NotificationList`, `NotificationReadResult` — in-app notifications

## Workflow

When making cross-repo changes:
1. Update `api-definitions.md` for endpoint changes
2. Update `data-models.ts` for model changes
3. Update `data-models.schema.json` (JSON Schema mirror)
4. Update the implementations to match: Backend (Mongoose + `sendSuccess()`), AI Service (Pydantic, `utils/schema.py`) and frontend (`src/api/*`)
