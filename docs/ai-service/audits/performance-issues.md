---
sidebar_label: Performance Issues
title: AI Service & Question Generation — Performance Issues
description: Audit of latency bottlenecks across the question generation pipeline, document upload, and cold-start behaviour. Prioritised by user impact.
---

# Performance Issues — AI Service & Question Generation

**Audit date:** 2026-06-30  
**Scope:** `ai-service/` (FastAPI) + `Backend/src/modules/questions/` (Express)

---

## Context

The single highest-impact latency event is: **a student opens a chapter that has never had questions generated**. The student sees a "generating…" spinner and must wait up to 2–4 minutes before they can answer their first question. Everything below traces every contributing factor to that wait and other slow paths.

---

## Issue 1 — No Proactive Question Generation After PDF Upload

**Severity: Critical**  
**File:** `Backend/src/modules/content/services/content.service.js` (upload handler), `Backend/src/modules/questions/services/questions.service.js`

When a teacher uploads a chapter PDF, the upload pipeline processes the document and marks the task complete. It does **not** trigger question generation. The first student to open that chapter pays the full cold-start penalty — waiting while 30 questions are generated on-demand.

**Fix:** After `upload-document` completes successfully, fire a background call to `_startBackgroundGeneration` for the chapter across all type × difficulty combinations (`mcq` × `easy/medium/hard`, `fillblanks` × `easy/medium/hard`). This pre-warms the question pool while no user is waiting.

---

## Issue 2 — Synchronous Blocking on First Question Request

**Severity: Critical**  
**File:** `Backend/src/modules/questions/services/questions.service.js:134–168` (`getQuestionsBatch`)

When a chapter has zero questions, `getQuestionsBatch` fires off `_startBackgroundGeneration` and immediately returns `{ status: 'generating' }`. The frontend then polls. The first generation call to the AI service requests **30 questions in one LLM round-trip**, which takes 30–90 seconds on average (longer on cold AI service starts). The student is blocked for the entire duration.

**Fix:** Generate a **smaller first batch** (e.g. 5–8 questions) so the student gets something to answer quickly, then background-generate the remaining questions. Split the request: first call `n=8`, return as soon as those are ready; second call fetches the full 30.

---

## Issue 3 — Lazy-Loaded Singletons Add Latency on First Request

**Severity: High**  
**File:** `ai-service/services/shared.py`, `ai-service/main.py:143–168` (lifespan hook)

`RAGSystem`, `Embedding`, `QdrantDB`, and `TopicSearch` are all lazy singletons — they initialise on first use, not at startup. The startup lifespan only warms `MongoDB` and `LLMService`. The very first `/generate-questions` call after a cold start or restart initialises all four of these serially, adding **10–30 seconds** before the actual Qdrant search begins.

**Fix:** Add `get_rag_system()` and `get_generate_question_service()` to the lifespan warmup block, behind a `try/except` so startup still succeeds if Qdrant is unreachable.

---

## Issue 4 — Qdrant Keep-Alive Fires Only Every 12 Hours

**Severity: High**  
**File:** `ai-service/main.py:266–276` (`keep_alive_qdrant`)

The Qdrant keep-alive pings every 43,200 seconds (12 hours). On Qdrant Cloud free tiers, collections may sleep after 30–60 minutes of inactivity. A student arriving after a period of inactivity triggers a Qdrant cold start on top of every other latency.

**Fix:** Reduce Qdrant keep-alive interval to match inactivity sleep threshold (typically 1800–3600 seconds).

---

## Issue 5 — Sequential LLM Retry Loop in Question Generation

**Severity: High**  
**File:** `ai-service/services/generate_question_service.py:197–255` (`_generate_with_retry`)

When the LLM returns invalid questions (missing options, no blank marker), `_generate_with_retry` re-calls the LLM sequentially — attempt 1, validate, attempt 2, validate, attempt 3. With `MAX_GENERATION_RETRIES=3` and each call taking 15–30 seconds, worst-case total is **60–90 seconds** just for question generation retries.

The retry also builds a `retry_context` string that grows with each pass, increasing token usage.

**Fix:** Request a modestly larger `n` on the first attempt (e.g. ask for 40 when 30 are needed) to compensate for the expected invalid rate, reducing retry rounds. Track invalid rate per LLM provider and tune `n` accordingly.

---

## Issue 6 — Stale Job Detection Timeout Is 5 Minutes

**Severity: High**  
**File:** `Backend/src/modules/questions/services/questions.service.js:221–248` (`_handleNoQuestions`)

If a generation job crashes mid-flight (process restart, OOM, hung AI call), the next student who requests questions will see `status: 'generating'` for up to **5 minutes** before the stale-restart logic kicks in (`STALE_TIMEOUT_MS = 5 * 60 * 1000`). This is a silent bad UX cliff — the student sees a spinner with no indication anything is wrong.

**Fix:** Reduce stale timeout to 2–3 minutes. Add a `lastHeartbeat` field to `QuestionGenerationJob` that the AI service updates mid-generation so genuinely active jobs aren't mistaken for stuck ones.

---

## Issue 7 — Backend Has No Warmup Call to AI Service at Startup

**Severity: Medium**  
**File:** `Backend/index.js` (startup), `Backend/src/modules/questions/services/questions.service.js:565–591` (`_callAIService`)

The Backend makes no lightweight ping or warmup request to the AI service at startup. After a Backend restart, the first student question request triggers both a Backend cold start and an AI service cold start in series.

**Fix:** Add a non-blocking startup ping to `AI_ENDPOINT/ping` in `Backend/index.js` so Render wakes the AI service container before a student request arrives.

---

## Issue 8 — `generate-questions` Runs Synchronously on the FastAPI Event Loop

**Severity: Medium**  
**File:** `ai-service/main.py:319–352` (`generate_questions` route)

The `/generate-questions` endpoint calls `service.generate_questions_for_topic_list()` directly — a blocking Python call — inside an `async def` route handler **without** `asyncio.to_thread`. This blocks the entire FastAPI event loop for the duration of the LLM call (30–90s), meaning no other requests can be served during generation.

**Fix:** Wrap the synchronous service call in `await asyncio.to_thread(service.generate_questions_for_topic_list, ...)` to free the event loop.

---

## Issue 9 — `regenerate_topics_from_qdrant` Updates Qdrant One Point at a Time

**Severity: Medium**  
**File:** `ai-service/services/rag.py:641–666` (`regenerate_topics_from_qdrant`)

In the payload update loop, `self.db.client.set_payload()` is called **once per chunk** in a `for` loop. For a chapter with 200 chunks, this is 200 sequential Qdrant round-trips. This makes topic regeneration extremely slow for large chapters.

**Fix:** Batch the `set_payload` calls. Qdrant's `set_payload` accepts a list of point IDs — collect all updates per unique payload value and call once per group, or use `overwrite_payload` with a batch filter.

---

## Issue 10 — `getPublicQuestionsBatch` Loads All Chapter Questions into Memory

**Severity: Medium**  
**File:** `Backend/src/modules/questions/services/questions.service.js:175–189` (`getPublicQuestionsBatch`)

`getPublicQuestionsBatch` does `Question.find({ chapterId })` — fetching **all questions** for the chapter into memory — then shuffles in JS and takes 3. For chapters with hundreds of questions, this fetches far more data than needed.

**Fix:** Use `.limit()` with a random `skip` (or MongoDB `$sample` aggregation) to fetch only 3 documents from the database without loading the full collection.

```js
// Replace with:
const questions = await Question.aggregate([
    { $match: { chapterId: new mongoose.Types.ObjectId(chapterId) } },
    { $sample: { size: 3 } },
    { $project: { questionText: 1, options: 1, questionType: 1, difficulty: 1, topicIds: 1 } }
]);
```

---

## Issue 11 — No Redis Caching for Question Generation Context

**Severity: Medium**  
**File:** `ai-service/services/generate_question_service.py:57–126` (`generate_questions_for_topic_list`)

Every call to `/generate-questions` for the same chapter fetches topics from MongoDB (`get_topics_mongo`) and runs a Qdrant filter search (`search_by_filter`). Redis exists in the stack (`utils/cache.py`) but is not used here. For chapters where many students are generating questions simultaneously, this means redundant DB and vector searches.

**Fix:** Cache the RAG candidate chunks per `(chapter_id, topic_names_hash)` in Redis with a short TTL (5–10 minutes). Topic resolution from MongoDB can similarly be cached per `(subject_id, topic_names)`.

---

## Issue 12 — Upload Pipeline Does Not Trigger After-Upload Indexing Events

**Severity: Medium**  
**File:** `ai-service/main.py:367–403` (`_run_upload_background`)

After a successful upload, the task is marked `completed` and the temp file is deleted — but nothing else happens. There's no webhook, event, or callback to the Backend to signal that the chapter is ready for question generation. The Backend currently only learns via polling `/upload-status/{task_id}`.

**Fix:** Add an optional `callback_url` parameter to `/upload-document`. On upload completion, POST the result to `callback_url`. The Backend can then immediately trigger question pre-generation for the chapter without waiting for a student to open it.

---

## Issue 13 — LLM Client Initialised Twice (RAGSystem + GenerateQuestionService)

**Severity: Low**  
**File:** `ai-service/services/rag.py:59–63`, `ai-service/services/generate_question_service.py:41–43`

Both `RAGSystem.__init__` and `GenerateQuestionService.__init__` call `get_llm_service_class()()` if no `llm_service` is injected. When the shared singletons (`get_rag_system()`, `get_generate_question_service()`) are wired correctly in `services/shared.py` this is fine, but if either is instantiated outside shared.py the LLM client is duplicated in memory — a waste on the 512 MB Render tier.

**Fix:** Already documented in CLAUDE.md ("Memory Rule"); ensure no code outside `shared.py` calls `RAGSystem()` or `GenerateQuestionService()` directly.

---

## Issue 14 — No Progress Feedback During Long Generation Wait

**Severity: Low (UX)**  
**File:** `Backend/src/modules/questions/services/questions.service.js:198–288` (`_handleNoQuestions`)

When generation is in progress, the API returns `{ status: 'generating', message: 'Generation in progress.' }` — a static string. The frontend can only poll; there's no progress percentage, estimated time remaining, or stage indication. For a 60-second wait, users have no idea if something is working.

**Fix:** Add a `stage` field to `QuestionGenerationJob` (`rag_retrieval` → `llm_generating` → `saving`) and return it in the `generating` response. The frontend can show "Searching chapter content…" → "Writing questions…" → "Almost ready…" to reduce perceived wait time.

---

## Summary Table

| # | Issue | Severity | File(s) | Expected Gain |
|---|-------|----------|---------|---------------|
| 1 | No proactive generation after upload | Critical | `content.service.js` | Eliminates cold-start for all students after first upload |
| 2 | First batch requests 30 questions at once | Critical | `questions.service.js` | Student gets first questions 4–6× faster |
| 3 | Lazy singletons not warmed at startup | High | `shared.py`, `main.py` | −10–30s per cold restart |
| 4 | Qdrant keep-alive every 12 hours | High | `main.py` | Prevents Qdrant sleep-triggered latency |
| 5 | Sequential LLM retry loop | High | `generate_question_service.py` | −30–60s worst case |
| 6 | 5-min stale job timeout | High | `questions.service.js` | Student spinner reduced from 5 min to 2–3 min |
| 7 | No backend warmup ping to AI service | Medium | `Backend/index.js` | Prevents compounded cold start |
| 8 | Blocking LLM call on FastAPI event loop | Medium | `main.py` | Unblocks concurrent requests during generation |
| 9 | Qdrant one-by-one payload update | Medium | `rag.py` | 10–100× faster topic regeneration |
| 10 | `getPublicQuestionsBatch` loads all docs | Medium | `questions.service.js` | Reduces DB read by ~100× for large chapters |
| 11 | No Redis cache for RAG candidates | Medium | `generate_question_service.py` | Reduces repeat Qdrant searches |
| 12 | No after-upload callback / event | Medium | `main.py` | Enables proactive pre-generation |
| 13 | LLM client duplicated outside shared.py | Low | `rag.py`, `generate_question_service.py` | Memory safety on 512 MB tier |
| 14 | No generation progress stages | Low (UX) | `questions.service.js` | Reduces perceived wait time |
