# AskAide AI Service — Production Readiness Assessment

**Date:** May 2026
**Repo:** `D:\AskAide AI\ai-service`
**Stack:** Python 3.11+, FastAPI, Qdrant (vector DB), MongoDB, Redis, Gemini/OpenAI/Anthropic/OpenRouter

---

## Executive Summary

| Metric | Status |
|--------|--------|
| **Total Components** | 18 |
| **HIGH Readiness** | 5 (LLM Base ABC, OpenAI provider, Anthropic provider, Qdrant wrapper, Embedding service) |
| **MEDIUM Readiness** | 9 (main.py, RAG engine, LLM insights, OpenRouter, Gemini, MongoDB, Redis, Schema, Service singletons) |
| **LOW Readiness** | 4 (Upload service, Query service, Question gen service, both test files) |
| **Overall** | **LOW-MEDIUM** — Solid architecture but critical gaps in security, testing, and configuration |
| **Test Coverage** | **CRITICAL** — Zero real tests; files are manual scripts with no assertions |
| **Security** | **LOW** — No auth, no rate limiting, no file size limits, error details leaked |

---

## Component-by-Component Assessment

### 1. `main.py` (All Endpoints) — MEDIUM READINESS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Error Handling | ✅ MEDIUM | Try/catch on all endpoints, proper HTTP codes (400/500/503) |
| Leaks Details? | ❌ **YES** | Every `raise HTTPException(status_code=500, detail=str(e))` leaks internal errors |
| Validation | ✅ HIGH | Pydantic models for all requests/responses |
| Logging | ✅ MEDIUM | `logger.exception()` used, but no structured logs |
| Auth | ✅ **DONE** | API key middleware (`verify_api_key`) skipping `/ping`, `/health`, `/docs` |
| Rate Limiting | ✅ **DONE** | In-memory rate limiter (200 req/60s), skipping `/ping`, `/health` |
| File Size Limit | ✅ **DONE** | 10 MB max enforced in `_validate_upload_file` |

**Action Items:**
| ID | Issue | Severity | Effort | Priority |
|----|-------|----------|--------|----------|
| AI-02 | Replace `str(e)` with generic error messages | HIGH | 0.5 day | **P1** |
| AI-05 | Add structured JSON logging with correlation IDs | MEDIUM | 0.5 day | **P2** |
| AI-06 | Add startup config validation (verify all env vars exist) | HIGH | 0.5 day | **P1** |

---

### 2. `services/rag.py` (Core RAG Engine) — LOW-MEDIUM READINESS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Error Handling | ✅ MEDIUM | Try/catch in `process_chunk`, `delete_document`; NO try/catch in `add_document` |
| Validation | ✅ N/A | Internal service |
| Logging | ✅ MEDIUM | Sparse logging in hot paths |
| Code Quality | ✅ MEDIUM | Well-structured but mixed abstraction levels |

**Critical Issues:**
- `add_document()` has no try/catch around entire ingestion pipeline — one failure loses everything
- Recursive summarization loop has **no max-iterations guard** (only character count check)
- `build_filter_nested` silently skips unsupported types
- `vector_size=384` hardcoded while also configurable via env var

**Action Items:**
| ID | Issue | Severity | Effort | Priority |
|----|-------|----------|--------|----------|
| AI-07 | Add try/catch wrapping to `add_document()` ingestion pipeline | HIGH | 0.5 day | **P1** |
| AI-08 | Add max-iterations guard to recursive summarization loop | MEDIUM | 0.25 day | **P2** |
| AI-09 | Remove hardcoded `vector_size`, use env var consistently | LOW | 0.25 day | MEDIUM |
| AI-10 | Add proper error handling in `build_filter_nested` for unsupported types | LOW | 0.25 day | LOW |

---

### 3. `services/upload_service.py` — LOW READINESS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Error Handling | ✅ MEDIUM | No try/catch in `upload_document` (relies on rag.py) |
| Validation | ✅ MEDIUM | Validates via dependency injection |
| Logging | ✅ MEDIUM | Minimal logging |
| Code Quality | ✅ MEDIUM | Clean but reuses `is_already_exists` in confusing way |

**Action Items:**
| ID | Issue | Severity | Effort | Priority |
|----|-------|----------|--------|----------|
| AI-11 | Add try/catch in `upload_document` at service level | MEDIUM | 0.5 day | MEDIUM |
| AI-12 | Clean up confusing `is_already_exists` dual-purpose usage | LOW | 0.25 day | LOW |

---

### 4. `services/query_service.py` — LOW-MEDIUM READINESS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Error Handling | ✅ HIGH | Try/catch with `logger.exception` |
| Validation | ✅ MEDIUM | Validated at route level |
| Logging | ✅ MEDIUM | Adequate logging |
| Code Quality | ❌ LOW | Docstring says "Upload Service" (copy-paste error) |

**Action Items:**
| ID | Issue | Severity | Effort | Priority |
|----|-------|----------|--------|----------|
| AI-13 | Fix copy-paste docstring in `query_service.py` | LOW | 0.1 day | MEDIUM |
| AI-14 | Add Redis caching for frequent/RAG queries | MEDIUM | 1 day | **P2** |

---

### 5. `services/generate_question_service.py` — LOW READINESS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Error Handling | ❌ LOW | No try/catch at service level |
| Validation | ✅ MEDIUM | Schema validated at route |
| Logging | ✅ MEDIUM | Logs entry/exit |
| Code Quality | ✅ MEDIUM | Clean, logical flow |
| Security | ❌ LOW | Unvalidated topic input passed to LLM prompt |

**Action Items:**
| ID | Issue | Severity | Effort | Priority |
|----|-------|----------|--------|----------|
| AI-15 | Add try/catch wrapping at service level | HIGH | 0.5 day | **P1** |
| AI-16 | Add input sanitization/schema validation for topic text | MEDIUM | 0.5 day | **P2** |

---

### 6. `services/llm_insights.py` — LOW-MEDIUM READINESS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Error Handling | ✅ HIGH | Comprehensive try/catch, ObjectId validation |
| Validation | ❌ LOW | No input validation beyond ObjectId |
| Logging | ✅ HIGH | Detailed logging |
| Code Quality | ✅ MEDIUM | Duplicates logic from `test_progress.py` |

**Action Items:**
| ID | Issue | Severity | Effort | Priority |
|----|-------|----------|--------|----------|
| AI-17 | Add input validation for insight request parameters | MEDIUM | 0.5 day | MEDIUM |
| AI-18 | Add pagination for MongoDB queries | MEDIUM | 0.5 day | **P2** |

---

### 7. `services/llm_service.py` (Abstract Base) — HIGH READINESS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Error Handling | ✅ HIGH | Base class handles errors for summary/question generation |
| Validation | ✅ N/A | Interface only |
| Logging | ✅ MEDIUM | Warnings on fallbacks |
| Code Quality | ✅ HIGH | Clean ABC with factory pattern |

**Action Items:** None

---

### 8. LLM Providers

| Provider | Readiness | Notes | Action Items |
|----------|-----------|-------|-------------|
| `llm_open_ai.py` | **HIGH** | Clean OpenAI SDK usage, official client | None |
| `llm_anthropic.py` | **HIGH** | Clean SDK, proper tool handling | None |
| `llm_gemini.py` | **MEDIUM** | Logs full chunk text at info level (PII risk); official SDK | AI-19: Reduce log level of chunk text |
| `llm_open_router.py` | **LOW** | Mixes streaming/non-streaming poorly; iterates same response twice; uses `requests` lib (no pool); 30s hard timeout | AI-20: Fix streaming logic bug; AI-21: Switch to httpx with pool |

---

### 9. Database Wrappers

| Component | Readiness | Notes | Action Items |
|-----------|-----------|-------|-------------|
| `db/mongo_db.py` | **MEDIUM** | Sync driver, no pooling config | AI-22: Add connection pooling config |
| `db/qdrant_db.py` | **HIGH** | Clean, batch upsert, proper abstractions | None |
| `db/redis_db.py` | **HIGH** | Clean, well-documented, pub/sub support | None |

---

### 10. Utilities

| Component | Readiness | Notes | Action Items |
|-----------|-----------|-------|-------------|
| `utils/schema.py` | **HIGH** | Well-defined Pydantic models | AI-23: Add `Literal` type constraints; AI-24: Add `ge`/`le` to numeric fields |
| `utils/embedding.py` | **HIGH** | Elegant provider registry with fallback chain | None |
| `utils/chunker.py` | **MEDIUM** | Functional, could be optimized | None |
| `utils/prompt.py` | **MEDIUM** | Template-based, functional | None |

---

### 11. Tests — CRITICAL

| Criterion | Status | Notes |
|-----------|--------|-------|
| **Automated Tests** | ❌ **ZERO** | Both test files are manual scripts — no assertions, always pass |
| `test_api_endpoints.py` | ❌ Manual script | Prints output, no assertions, hardcoded IDs |
| `test_progress.py` | ❌ Manual script | Duplicates `llm_insights.py` logic with print statements |

**Action Items:**
| ID | Issue | Severity | Effort | Priority |
|----|-------|----------|--------|----------|
| AI-25 | Write unit tests for RAG engine with mocked Qdrant | **CRITICAL** | 2 days | **P0** |
| AI-26 | Write unit tests for LLM providers with mocked API | **CRITICAL** | 1 day | **P0** |
| AI-27 | Write unit tests for document upload pipeline | HIGH | 1 day | **P1** |
| AI-28 | Write integration tests for question generation | HIGH | 1 day | **P1** |
| AI-29 | Add pytest configuration and CI workflow | HIGH | 0.5 day | **P1** |

---

### 12. Orphan/Dead Code

| File | Issue | Action |
|------|-------|--------|
| `utils/embedding copy.py` | Duplicate of `embedding.py` | Delete |
| `services/ai_services.py` | Dead code — duplicates `service.py` | Delete |

**Action Items:**
| ID | Issue | Severity | Effort | Priority |
|----|-------|----------|--------|----------|
| AI-30 | Delete `utils/embedding copy.py` | MEDIUM | 0.1 day | **P1** |
| AI-31 | Delete `services/ai_services.py` | MEDIUM | 0.1 day | **P1** |

---

## Consolidated Action Items by Priority

### P0 — Immediate (Security & Reliability)

| ID | Component | Issue | Effort |
|----|-----------|-------|--------|
| AI-01 | main.py | Add authentication middleware | 1 day |
| AI-25 | tests | Write unit tests for RAG engine | 2 days |
| AI-26 | tests | Write unit tests for LLM providers | 1 day |
| AI-30 | utils | Delete `embedding copy.py` | 0.1 day |
| AI-31 | services | Delete `ai_services.py` | 0.1 day |

### P1 — This Sprint

| ID | Component | Issue | Effort |
|----|-----------|-------|--------|
| AI-02 | main.py | Fix error detail leakage (str(e)) | 0.5 day |
| AI-03 | main.py | Add rate limiting | 0.5 day |
| AI-04 | main.py | Add file size validation | 0.25 day |
| AI-06 | main.py | Add startup config validation | 0.5 day |
| AI-07 | rag.py | Add try/catch to add_document pipeline | 0.5 day |
| AI-15 | generate_question | Add try/catch at service level | 0.5 day |
| AI-27 | tests | Document upload pipeline tests | 1 day |
| AI-28 | tests | Question generation integration tests | 1 day |
| AI-29 | tests | Add pytest config + CI workflow | 0.5 day |
| AI-20 | llm_open_router | Fix streaming logic bug | 0.5 day |
| AI-21 | llm_open_router | Switch to httpx with connection pool | 0.5 day |

### P2 — This Iteration

| ID | Component | Issue | Effort |
|----|-----------|-------|--------|
| AI-05 | main.py | Add structured JSON logging | 0.5 day |
| AI-08 | rag.py | Add max-iterations guard to summarization loop | 0.25 day |
| AI-14 | query_service | Add Redis caching for RAG queries | 1 day |
| AI-18 | llm_insights | Add pagination for MongoDB queries | 0.5 day |
| AI-19 | llm_gemini | Fix PII leak — reduce chunk log level | 0.25 day |
| AI-22 | mongo_db | Add connection pooling config | 0.5 day |
| AI-23 | schema.py | Add Literal type constraints | 0.5 day |
| AI-24 | schema.py | Add ge/le to numeric fields | 0.25 day |
| AI-16 | generate_question | Add input sanitization | 0.5 day |

### P3 — Backlog

| ID | Component | Issue | Effort |
|----|-----------|-------|--------|
| AI-09 | rag.py | Remove hardcoded vector_size | 0.25 day |
| AI-10 | rag.py | Handle unsupported types in build_filter_nested | 0.25 day |
| AI-11 | upload_service | Add service-level try/catch | 0.5 day |
| AI-12 | upload_service | Clean up is_already_exists usage | 0.25 day |
| AI-13 | query_service | Fix copy-paste docstring | 0.1 day |
| AI-17 | llm_insights | Add input validation | 0.5 day |

---

## Dependency Pinning Status

| Dependency | Pinned? | Status |
|------------|---------|--------|
| `fastapi` | ❌ No version | Unstable — will break on major releases |
| `redis` | ❌ No version | Unstable |
| `pymongo` | ❌ No version | Unstable |
| `qdrant-client` | ❌ No version | Unstable |
| `google-genai` | ❌ No version | Unstable |
| `openai` | ❌ No version | Unstable |
| `anthropic` | ❌ No version | Unstable |
| `sentence-transformers` | ❌ No version | Unstable |

**Action:** Pin ALL dependencies to stable versions in `requirements.txt`

---

## Security Checklist

| Item | Status | Notes |
|------|--------|-------|
| Authentication | ❌ NONE | No API key or JWT check |
| Authorization | ❌ NONE | No role-based access |
| Rate Limiting | ❌ NONE | No request throttling |
| Input Validation | ✅ HIGH | Pydantic at route level |
| File Size Limits | ❌ NONE | Any file size accepted |
| CORS | ❌ NONE | Not configured |
| Error Leakage | ❌ YES | `str(e)` exposes internals |
| API Keys in Env | ✅ YES | All keys from env vars |
| .gitignore | ✅ YES | .env correctly excluded |
| Request Body Limits | ❌ NONE | No max_body_size in FastAPI |

---

## Scoring Methodology

Each component was assessed on 7 criteria:
- **Error Handling**: try/catch coverage, exception logging, graceful degradation
- **Validation**: Input validation, Pydantic schemas
- **Logging**: Logger presence, log levels, structured vs plain text
- **Tests**: Automated test existence, assertions, coverage
- **Code Quality**: Architecture, abstractions, documentation, DRY
- **Security**: Auth, input sanitization, rate limiting, file limits
- **Performance**: Caching, async usage, connection pooling, batching

**Overall Rating Scale:**
- **HIGH**: 6/7 criteria met, secure, tested, well-architected
- **MEDIUM**: 4-5/7 criteria met, some gaps
- **LOW**: &lt;4 criteria met, critical gaps in security or testing
