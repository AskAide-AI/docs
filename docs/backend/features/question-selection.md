# Question Selection & Generation Flow

## Overview

When a student requests questions for a practice session, the backend uses a **non-blocking polling architecture**. The endpoint is a fast status check — it **never** awaits the AI call. All generation runs as a fire-and-forget background task; the client polls until questions arrive or it hits a terminal state.

## How Questions Are Selected

1. **Within a Session**: Questions are **distinct** — the same question won't repeat in the same session
2. **Selection**: Questions are fetched from the existing DB pool (shuffled in JS, not via `$sample`)
3. **Exclusion**: Already-answered questions in this session are excluded
4. **No questions left?** The backend enters the generation state machine (see below)

## The Polling Contract

`GET /questions/batch/chapter/:chapterId/type/:type/difficulty/:difficulty/session/:sessionId[?retry=true&limit=10]`

Returns in the standard envelope — the batch result lives at `data`:

```jsonc
{ "success": true, "message": "...",
  "data": { "success": true, "data": [/* questions */], "status": "...", "message": "..." } }
```

`data.status` values:

| status | meaning | client action |
|--------|---------|---------------|
| *(absent)* | `data.data` has questions | render them, stop polling |
| `generating` | background job in flight | poll again in 5s, **no** `retry` flag |
| `failed` | last generation errored | re-kick with `retry=true` (max 2x); backend auto-recovers after 2 min |
| `mastered` | chapter is content-complete | terminal — celebrate, offer next step |

> `status` lives at `data.status`, **not** the top level.

## Generation State Machine (`_handleNoQuestions`)

When the pool is empty:

1. **Job `processing` & fresh** → return `generating`
2. **Job `processing` & stale (>5 min)** → atomically restart (timestamp-guarded), return `generating`
3. **Job `failed` & cooldown elapsed (>2 min)** → auto-recover to `processing`, restart, return `generating`
4. **Content-complete?** → return `mastered` (terminal, even on retry)
5. **Job `failed` & cooldown not elapsed** → return `failed`
6. **Otherwise** → endless practice: atomically claim job, start background gen, return `generating`

### Race Safety

- `questionGenerationJob` has a **unique** compound index on `(chapterId, questionType, difficulty)`
- `_claimGenerationJob` does an upsert with `status: { $ne: 'processing' }` filter; concurrent requests collide on duplicate-key (11000) → only one wins

## Endless Practice & Honest Mastery (Yield-Based)

Three mechanisms prevent false mastery from duplicate volume:

1. **Context rotation** (AI service) — random sample of chapter chunks per call instead of always rewording the same pages
2. **Dedup on insert** — `_dedupeNewQuestions` drops any question whose normalized text already exists for the chapter
3. **Yield-based mastery** — a generation run adding fewer than `MIN_NEW_PER_RUN` new questions is "low yield". After `LOW_YIELD_LIMIT` consecutive low-yield runs, the selection is `contentComplete`. `HARD_CAP` is only a cost ceiling.

### Prefetch

When `<= PREFETCH_AHEAD` unanswered questions remain, `getQuestionsBatch` warms the next batch in the background — no mid-session wait.

### Failed-Job Auto-Recovery

A failed generation job is automatically restarted after the 2-minute cooldown expires, atomically resetting to `processing`.

## Config Knobs (Backend `.env`)

```
QUESTION_PREFETCH_AHEAD=10    # warm next batch when this many or fewer remain
QUESTION_MIN_NEW_PER_RUN=3    # a run adding fewer new questions = "low yield"
QUESTION_LOW_YIELD_LIMIT=2    # consecutive low-yield runs before mastery
QUESTION_HARD_CAP=300         # absolute cost ceiling per (chapter,type,difficulty)
```

## Code Location

- `src/modules/questions/services/questions.service.js` — core selection & generation logic
- `src/modules/questions/models/questionGenerationJob.model.js` — job status model
- `Frontend/src/hooks/useQuestionPolling.js` — client-side polling hook

## Behavior Summary

| Scenario | Behavior |
|----------|----------|
| Same session, batch 1 | Get 10 random questions from pool |
| Same session, batch 2 | Get 10 **different** random questions (excludes batch 1) |
| Pool runs low | Background prefetch warms new questions |
| Pool empty, gen running | Returns `generating`, client polls |
| Pool empty, content complete | Returns `mastered` (terminal) |
| Generation failed | Returns `failed`, auto-recovers after 2 min |
| New session | Fresh start — can see any question (including previous session's pool) |
