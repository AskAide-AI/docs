# Duplicate Question Generation — Investigation & Fix Plan

> **Status:** Investigated, fix deferred ("we'll do it later").
> **Date:** 2026-06-24
> **Scope:** Backend (`Backend/`) + AI Service (`ai-service/`) question-generation pipeline.

## TL;DR

Class 8th Mathematics chapter **"A Square and A Cube"** (`chapterId: 69fd8e3f06c08269fd994802`)
has **duplicate questions** in the `user.questions` collection. Root cause is a
**memoryless generator**: each generation run regenerates overlapping questions because
it has no awareness of questions already saved for the chapter, and nothing dedupes before insert.

---

## Evidence

### Duplicate findings (exact text matches, normalized = trimmed + lowercased)

- **70** total questions in the chapter.
- **10** unique question texts are duplicated, spanning **22 documents** → **12 redundant copies**.
- De-duping would bring the chapter 70 → 58 distinct questions.

| # | Question | Copies |
|---|----------|--------|
| 1 | What is the smallest square number divisible by 4, 9, and 10? | 3 |
| 2 | What is the prime factorization of 1728? | 3 |
| 3 | What is the square root of 1936? | 2 |
| 4 | What is the last digit of the square of a number ending with 9? | 2 |
| 5 | What is the prime factorization of 324? | 2 |
| 6 | How many numbers lie between the squares of 99 and 100? | 2 |
| 7 | What is the smallest number of cubes of side 1 cm needed to make a cube of side 4 cm? | 2 |
| 8 | What is the smallest number by which 9408 must be multiplied to make it a perfect square? | 2 |
| 9 | What is the last digit of the square root of a number ending with 6? | 2 |
| 10 | How many numbers lie between the squares of 16 and 17? | 2 |

**Key fact:** all duplicates are **exact text matches** (cross-batch), not reworded near-duplicates.

### Batches were sequential, NOT concurrent

The 70 questions came from **3 separate generation runs**, ~40–66s apart:

| Batch | `_id` prefix | Timestamp (2026-06-24) | Questions |
|-------|-------------|------------------------|-----------|
| 1 | `6a3bb1bd…` | 10:30:21 | 23 |
| 2 | `6a3bb1e5…` | 10:31:01 (+40s) | 24 |
| 3 | `6a3bb227…` | 10:32:07 (+66s) | 23 |

Within each batch the `createdAt` differs by only ~1ms (single `insertMany()`).
→ The **race condition is NOT what caused this**; it was repeated/sequential re-triggers
(retry, repeated "generate" clicks, or a job re-run) feeding a memoryless generator.

---

## Root causes (by layer)

### 1. AI Service is memoryless — `ai-service/services/generate_question_service.py`
`generate_questions_for_topic_list()` builds RAG context + calls the LLM but **never passes
existing chapter questions** to the prompt. Same chapter + same RAG context + same prompt →
same questions regenerated on each run. The `is_distinct` flag only controls topic spread
*within one batch*, not across runs.

### 2. Dead dedup utility — `ai-service/utils/question_utils.py:99` `deduplicate_by_similarity()`
- Exists (cosine ≥ 0.92) but is **never called**.
- Reads `item["embedding"]`, but generated questions are plain text → would need embedding first.
- Only dedupes **within the list passed in** — has **no DB awareness**, so it would NOT catch
  the cross-batch dups we actually have.
- Minor: re-imports sklearn inside the O(n²) inner loop (line 135).

### 3. Backend — `Backend/src/modules/questions/services/questions.service.js`
- **Blind insert (~L238):** `Question.insertMany()` with **no existence/text check**.
- **No unique index** in `Backend/src/modules/questions/models/question.model.js` (L44–52) —
  nothing prevents duplicates at the DB level.
- **Race condition (~L205–214):** job "lock" (`findOneAndUpdate` upsert) is not atomic with
  launching the background task → two concurrent requests could both generate. *(Latent bug;
  not the cause of this incident, but should be fixed.)*
- **Retry (~L189–200):** re-runs generation without checking what a partially-successful first
  run already inserted.

---

## Decisions made during investigation

- **Option "feed existing questions into the prompt":** naive full-text injection (text + options
  + explanations) is rejected — it bloats context and grows unbounded per run. **Trimmed version
  is acceptable:** pass only existing question *stems* (`questionText`, no options/explanation),
  ~70 stems ≈ ~1k tokens — cheap and effective.
- **Wiring the dedup utility:** low-risk but low-value as-is (in-batch only, needs embeddings,
  adds cost/failure mode on 512MB Render tier). Only worth it later for *reworded* near-dups,
  and only after extending it to compare against the DB.

---

## Fix plan (ranked, do later)

1. **[MUST] Pre-insert exact-text dedup + unique index — Backend.**
   - Before `Question.insertMany()` (`questions.service.js:~238`), drop any `questionText`
     already present for that `chapterId`.
   - Add unique index `(chapterId, questionText)` in `question.model.js`.
   - **This alone fully solves the observed problem** (all dups are exact text matches), with
     zero LLM/embedding cost.
2. **[SHOULD] Trimmed Option 1 — AI Service.** Pass existing question stems into the generation
   prompt so the LLM avoids repeats at the source.
3. **[SHOULD] Close the race condition — Backend.** Make the job lock atomic with task launch
   (e.g. atomic status transition / guard re-entry) to prevent concurrent generation.
4. **[OPTIONAL] Semantic dedup — AI Service.** Extend `deduplicate_by_similarity()` to embed new
   questions and compare against existing DB question embeddings; catches reworded near-dups.

---

## Cleanup of existing data (separate task)

- 12 redundant copies could be removed (keep oldest of each of the 10 duplicated texts).
- **Not yet done** — only read access used during investigation. Recommend confirming full
  documents (options/answers) are identical before deleting, then delete keeping the lowest `_id`.

---

## Notes

- The `code-review-graph` MCP was **empty/never built** at investigation time (0 nodes, 0 repos
  registered). Findings above came from direct source reads, not the graph. Build the graph first
  if impact analysis is wanted before editing `questions.service.js`.
