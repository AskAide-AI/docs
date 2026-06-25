# Question Generation & Endless-Practice Flow

Cross-service reference for how study-session questions are served, generated,
and "run out" gracefully. Touches all three repos:

```
Frontend (useQuestionPolling) ─▶ Backend (questions.service) ─▶ AI Service (/generate-questions)
```

Owner of the logic: `Backend/src/modules/questions/services/questions.service.js`.
Client: `Frontend/src/hooks/useQuestionPolling.js` + `components/study/QuestionPractice.jsx`.

---

## 1. The contract

`GET /questions/batch/chapter/:chapterId/type/:type/difficulty/:difficulty/session/:sessionId[?retry=true&limit=10]`

This endpoint is a **fast, non-blocking status check** — it NEVER awaits the AI
call. All generation runs as a fire-and-forget background task; the client polls
until questions arrive or it hits a terminal state.

Response is the standard envelope; the batch result lives one level deep:

```jsonc
{ "success": true, "message": "Questions batch fetched successfully",
  "data": { "success": true, "data": [/* questions */], "status": "...", "message": "..." } }
```

`data.status` values the client acts on:

| status        | meaning                                          | client action                          |
|---------------|--------------------------------------------------|----------------------------------------|
| _(absent)_    | `data.data` has questions                         | render them, stop polling              |
| `generating`  | a background job is in flight                      | poll again in 5s, **no** `retry` flag  |
| `failed`      | last generation errored                           | re-kick with `retry=true` (max 2x); backend auto-recovers after 2 min cooldown |
| `mastered`    | chapter is tapped out (content-complete)          | terminal — celebrate, offer next step  |

> ⚠️ The status lives at `data.status`, **not** the top level. Reading it at the
> wrong depth is the original bug that caused the request storm (see §5).

---

## 2. Backend state machine (`_handleNoQuestions`)

When a session has no unanswered questions left:

1. **Job `processing` & fresh** → return `generating` (never block).
2. **Job `processing` & stale (>5 min)** → atomically restart it (timestamp-guarded
   so only one request relaunches), return `generating`.
3. **Job `failed` & cooldown elapsed (>2 min)** → auto-recover (atomically reset to
   `processing`), restart background generation, return `generating`.
4. **Content-complete?** (see §3) → return `mastered`. Terminal, *even on retry*.
5. **Job `failed` & cooldown not elapsed** → return `failed`.
6. **Otherwise** (no job / completed pool drained / failed+retry) → **endless
   practice**: atomically claim the job and start background generation, return
   `generating`.

### Race safety

- `questionGenerationJob` has a **unique** compound index on
  `(chapterId, questionType, difficulty)`.
- `_claimGenerationJob` does an upsert with a `status: { $ne: 'processing' }`
  filter. Concurrent first-time requests collide on duplicate-key (11000) → only
  one wins → no duplicate AI generations.

### Timeouts (must stay ordered)

- AI fetch abort: **4 min** (`AI_REQUEST_TIMEOUT_MS`).
- Stale-job threshold: **5 min** (`STALE_TIMEOUT_MS`).
- Frontend poll interval: **5 s**; total budget **~5 min** (`MAX_POLLS`).

A hung AI call aborts (→ `failed`) *before* the stale logic could spawn a
duplicate. Polls are far under the 30 s axios timeout because the endpoint
returns instantly.

---

## 3. Endless practice that masters *honestly* (yield-based)

Goal: the student practises as long as they want, with genuinely-new questions —
and mastery fires only when the chapter is *actually* exhausted, never on
duplicate volume. Three mechanisms make this correct:

1. **Context rotation (AI service).** `search_topics_rag` pulls a broad pool of
   the chapter's chunks (`QG_CANDIDATE_POOL`) and **randomly samples**
   `QG_CANDIDATE_SAMPLE` of them per call. Successive generations draw on
   different material instead of always rewording the first ~10 chunks.
   > This was the critical bug: a plain `scroll(limit=10)` returned the *same*
   > chunks every call, so "endless" generation could only reword the chapter's
   > opening pages — and a count-based cap would have counted those duplicates as
   > mastery. Verified against real data: chapters span 1–208 chunks.
2. **Dedup on insert (backend).** `_dedupeNewQuestions` drops any question whose
   normalized text already exists for the chapter (or repeats within the batch).
   Only genuinely-new questions are saved and counted.
3. **Yield-based mastery (backend).** A generation run that adds fewer than
   `MIN_NEW_PER_RUN` new questions is "low yield". After `LOW_YIELD_LIMIT`
   *consecutive* low-yield runs (tracked in `job.lowYieldStreak`, reset on any
   productive run) the selection is `contentComplete`. `HARD_CAP` is only an
   absolute cost ceiling. **No guessed number drives mastery** — the chapter's
   own content does.

Plus:
- **Prefetch:** when `≤ PREFETCH_AHEAD` unanswered questions remain,
  `getQuestionsBatch` warms the next batch in the background → no mid-session wait.
- **Mastery moment:** once content-complete, draining the pool returns `mastered`;
  the UI celebrates (🏆) and points to the next chapter / difficulty / finishing.
  A new session reshuffles the existing pool.
- Generation targets the requested `difficulty` (passed to the AI, lowercased).

> **Why not a chunk-count or fixed cap?** Because the generator's output isn't
> guaranteed distinct, a raw count is inflated by duplicates and would declare
> false mastery. Yield is the only signal that reflects *distinct* content
> remaining. See §4.

### Config knobs

Backend `.env`:
```env
QUESTION_PREFETCH_AHEAD=10   # warm next batch when this many or fewer remain
QUESTION_MIN_NEW_PER_RUN=3   # a run adding fewer new questions = "low yield"
QUESTION_LOW_YIELD_LIMIT=2   # consecutive low-yield runs before mastery
QUESTION_HARD_CAP=300               # absolute cost ceiling per (chapter,type,difficulty)
QUESTION_FAILED_COOLDOWN_MS=120000  # auto-recover failed jobs after 2 min (was: permanent death)
```
AI service `.env`:
```env
QG_CANDIDATE_POOL=200        # chapter chunks considered per generation
QG_CANDIDATE_SAMPLE=12       # chunks randomly fed to the LLM per call
```

Structured logging (Winston) now covers the full generation lifecycle — every status transition, DB error, and retry is logged with metadata at info/warn/error levels.

---

## 4. Why mastery instead of infinite identical questions

- A chapter's source content is finite; past ~100–150 the LLM only produces
  reworded duplicates. Re-drilling those is weak learning (recognition, not recall).
- The students who hit the wall are the top 1–5% most engaged — highest LTV and
  your advocates. Handle the moment as an **achievement**, not an error.
- A celebration + clear next step deepens the loop (chapter → chapter → revision →
  exam prep) and is a natural premium/upsell point — without burning LLM budget.

---

## 5. Edge cases covered

- Status read at correct envelope depth (the original storm bug).
- `retry=true` no longer blocks the request on a synchronous AI call.
- No duplicate concurrent generations (atomic claim + unique index).
- Stuck/crashed jobs auto-restart after 5 min, guarded against double-restart.
- Network/axios timeout resumes **plain** polling (never retries → no storm).
- Tab hidden pauses polling; unmount clears the timer.
- Generation only ever reworded the first ~10 chunks → fixed by context rotation.
- Count inflated by duplicate questions → fixed by dedup-on-insert; mastery is
  yield-based, not count-based.
- One unlucky low-yield random sample → can't trigger mastery (needs
  `LOW_YIELD_LIMIT` consecutive low-yield runs).
- AI returns nothing and no questions exist → genuine `failed` (client may retry).
- Tapped out before the student ever saw a question → friendly "try later".
- Failed jobs auto-recover after 2 min cooldown (was: permanent death).
- Non-11000 DB errors in job claim return graceful `generating` instead of 500.
- Structured logging for generation lifecycle (info/warn/error with metadata).
- All existing tests updated (48 tests).

---

## 6. Roadmap — fallback ladder (future phases)

Done: non-blocking polling, endless practice, prefetch, **context rotation +
dedup-on-insert + yield-based mastery**, mastery moment, failed-job auto-recovery,
DB error resilience, structured production logging, updated test suite (48 tests).

When fresh-distinct questions run low, walk this ladder (cheapest + most valuable
first) instead of only generating or only stopping:

| Tier | Serve | LLM cost | Value | Status |
|------|-------|----------|-------|--------|
| 1 | **Mistakes-first / spaced repetition** (re-serve wrong/hard answers, spaced) | none | highest | TODO |
| 2 | **Difficulty escalation** (Easy → Medium → Hard) | none | high | TODO |
| 3 | **Question-type switch** (MCQ ↔ fillblanks on same topics) | none | medium | TODO |
| 4 | **Synthetic variants** (vary numbers/scenarios for numeric subjects) | low | medium | TODO |
| 5 | **Cross-chapter mixed revision** ("revision mode", exam-prep) | none | high | TODO |
| 6 | **Recycle reshuffled** (re-serve previously-correct) | none | low | last resort |

Tiers 1–2 reuse data already in `UserAnswer` + topic progress; they're the
highest ROI next step and also award the existing badge/mastery systems.

### Also worth doing later

- **Semantic dedup:** `_dedupeNewQuestions` catches verbatim / punctuation-only
  repeats via normalized text. Reworded-but-equivalent questions still pass — an
  embedding-similarity check would catch those (the AI service already has an
  embedding pipeline to reuse).
- **Badge wiring:** fire a "Chapter Mastered" badge on the `mastered` event via the
  existing badge system (`POST /badges/check`).
