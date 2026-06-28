# AskAide Docs — Merge / Separate Reorganization Plan

> **STATUS: EXECUTED (2026-06-28).** All 5 phases applied. Nothing was deleted — files that left the published site were **moved**, not removed: duplicates/superseded → `docs/_archive/`, internal AI-agent tooling → `docs/_internal/` (both folders are `_`-prefixed, so Docusaurus excludes them from the built site but keeps them in the repo). Merges and canonical banners applied as below. `npm run build` passes clean. See the "What was actually done" section at the bottom.


**Scope:** `askaide-docs/docs/` (Docusaurus source only — ignores `build/`, `.docusaurus/`).
**Goal:** Eliminate duplicate docs, establish a single source of truth for cross-cutting topics, and keep genuinely distinct docs separate.

Source files today: **95 markdown files** across `intro`, four service sections (`frontend`, `backend`, `ai-service`, `shared-contracts`), and a top-level `reference/` ("Guides & Reference").

---

## The core problem

There are **two kinds of duplication**:

1. **Within a service section** — the same topic split into two near-identical files (e.g. `testing.md` + `testing-strategy.md`, `changelog.md` + `api-changelog.md`, two product intros, an exact-copy audit file).
2. **Cross-cutting** — the top-level `reference/` section re-documents things the service sections already cover (setup, API, integration, user manual). These need **one canonical doc**, with the others trimmed to service-specific specifics + a link.

A third issue: a few **internal AI-agent tooling docs** ("multi-expert team", an AI research prompt) are mixed into published end-user docs and should move out.

---

## Decision key

- **MERGE** — combine into one file, delete the others.
- **CANONICAL** — designate one file as the source of truth; trim the duplicates to service-specific notes + a link up.
- **KEEP** — genuinely distinct; leave separate (may rename for clarity).
- **MOVE OUT** — internal tooling; remove from published docs.

---

## A. MERGE (within-section duplicates)

| # | Section | Files | Action | Reason |
|---|---------|-------|--------|--------|
| A1 | frontend | `development/testing.md` + `development/testing-strategy.md` | MERGE → `development/testing.md` | strategy file is just the exec summary of the detailed one |
| A2 | frontend | `audits/code-audit.md` + `audits/frontend-audit.md` | DELETE `frontend-audit.md` | **byte-for-byte identical** (both 568 words) |
| A3 | frontend | `development/changelog.md` + `development/proposed-changes.md` + `development/refactoring-guide.md` | MERGE → `changelog.md` (shipped) + keep `proposed-changes.md` (roadmap); DELETE `refactoring-guide.md` (fold its P1–P3 list into proposed-changes) | refactoring-guide is a 72-line stub already covered by the roadmap's priority matrix |
| A4 | backend | `development/testing.md` + `development/testing-strategy.md` | MERGE → `development/testing.md` | same split as frontend |
| A5 | backend | `development/changelog.md` + `development/api-changelog.md` | MERGE → `changelog.md` with an "API Surface" section | api-changelog is a subset of the full changelog |
| A6 | backend | `product/PRODUCT-INTRODUCTION.md` + `product/backend-overview-for-pm.md` | MERGE → one product intro (keep the clearer `PRODUCT-INTRODUCTION.md`) | ~90% overlap, same audience (PM/business) |
| A7 | ai-service | `development/integration-plan.md` + `development/integration-plan-full.md` | DELETE `integration-plan-full.md` | stale near-duplicate draft of the current plan |

---

## B. CANONICAL (cross-cutting — pick one source of truth, trim the rest)

The top-level `reference/` docs are the most complete and polished, so they become canonical for **cross-service** concerns. Per-service docs keep only what is genuinely service-specific and link up.

| # | Canonical (source of truth) | Trim / point to it | Action |
|---|------------------------------|--------------------|--------|
| B1 | `reference/api-reference.md` (full Backend + AI API) | `backend/development/api-documentation.md`, `shared-contracts/api-definitions.md` | Make api-reference canonical. **DELETE** `backend/development/api-documentation.md` (superseded). Keep `shared-contracts/api-definitions.md` only as the internal contract/schema doc (rename → `api-contracts.md`), linking to api-reference for full detail. |
| B2 | `reference/getting-started.md` (full-stack local setup) | `shared-contracts/development/quick-start.md`, `frontend/development/setup.md`, `backend/development/setup.md`, `ai-service/development/setup.md` | Make getting-started canonical. Per-service `setup.md` keep **only service-specific config** (env vars, ports, seeds) + link up. |
| B3 | `reference/integration.md` (cross-service data flows) | `shared-contracts/integration-guide.md` | Make integration.md canonical. Note: `integration-guide.md` is mis-titled — it's actually about the internal "multi-expert team", not service integration → see D. |
| B4 | `reference/user-guide.md` (Student/Teacher/Parent/Admin) | `frontend/features/product-manual.md` | Make user-guide canonical. Trim product-manual to a short summary + link. |
| B5 | `reference/developer-guide.md` | — | **KEEP AS-IS** — legitimate cross-cutting contribution guide, no real duplication. |

> **Decision (confirmed):** Top-level `reference/` is the canonical source for cross-cutting topics; per-service setup/API docs get trimmed to service-specifics + a link up. (Chosen over the reverse "service-docs-canonical, reference-as-hub" option.)

---

## C. KEEP SEPARATE (distinct purpose — do not merge)

- **Audits are distinct lenses, not duplicates** — keep all of:
  - frontend: `audits/code-audit.md` (strategic SaaS fit) vs `audits/production-readiness.md` (tactical module readiness). *Rename `code-audit.md` → `strategic-audit.md` for clarity.*
  - backend: `audits/audit-report.md` (code health) vs `audits/production-readiness.md` (operational) vs `audits/data-gap-analysis.md` (content completeness).
  - ai-service: `audits/production-readiness.md` (code health) vs `audits/dataset-audit.md` (data integrity).
  - shared-contracts: `audits/pre-launch-audit-report.md` (technical/security) vs `audits/product-audit-report.md` (product/business).
- **Product strategy vs monetization** — backend `product/growth-analysis.md` vs `product/pricing.md`; keep separate.
- **Competitor docs** — shared-contracts `product/competitor-feature-matrix.md` (quick matrix) vs `product/competitor-research.md` (deep intel); complementary.
- **Backend reference trio** — `api-documentation` (→ deleted, see B1), `reference/system-design.md`, `reference/database-schema.md` are distinct. ⚠️ `system-design.md` is **incomplete (cuts off mid-page)** — finish it or fold into `architecture.md`.
- **ai-service reference** — `reference/documentation.md` (5,954-word deep reference) is the real source of truth; keep `overview.md` short (it's the sidebar landing page) and `architecture.md` as a diagram-level summary — **trim both so they don't restate `documentation.md`**.
- **ai-service features** — `ai-features-quickref.md` (internal Python API) vs `cross-repo-map.md` (repo contracts); keep both.

---

## D. MOVE OUT of published docs (internal AI-agent tooling)

These describe the internal multi-expert/agent workflow and don't belong in user/integrator-facing docs:

| File | Action |
|------|--------|
| `reference/multi-expert-team-guide.md` | MOVE OUT → e.g. project-root `.agent/` or `CONTRIBUTING.md` |
| `shared-contracts/integration-guide.md` | This is multi-expert content mis-titled as integration → MOVE OUT (or rename `multi-expert-team.md`); real integration content lives in `reference/integration.md` (B3) |
| `shared-contracts/development/quick-start.md` | "Multi-Expert Team Setup" — internal; MOVE OUT (real setup = `reference/getting-started.md`, B2) |
| `frontend/reference/ai-research-prompt.md` | LLM prompt template, not docs → MOVE to a `prompts/` location or delete |

---

## E. RELOCATE / RENAME (misplaced, not duplicated)

- `frontend/development/refactoring-guide.md` → deleted in A3.
- `backend/development/quiz-test-cases.md` → 900-line manual test script; move next to the quiz module's tests, not in published docs.
- `frontend/reference/progress.md` + `backend/reference/progress.md` → status trackers, not reference; consolidate into each section's changelog/roadmap or move to a project-status doc.
- `frontend/overview.md` vs `frontend/product/product-overview.md` vs `frontend/product/project-overview.md` → keep all three (technical / product-strategy / project-anatomy), but the naming collision is confusing; rename `overview.md`'s heading to "Technical Overview".

---

## Proposed end state (counts)

- **Delete:** ~5 files (`frontend-audit`, `refactoring-guide`, `api-changelog`, `integration-plan-full`, `backend/api-documentation`).
- **Merge down:** ~4 pairs (FE testing, BE testing, BE product intro — into existing files).
- **Move out of published docs:** ~4 internal-tooling files.
- **Trim to service-specific + link:** 4 setup docs, product-manual, api-definitions.
- **Keep / rename:** everything else.

Net: ~95 → ~82 published docs, with clear single sources of truth and no internal tooling leaking into user docs.

---

## Execution phases (each independently shippable)

1. **Phase 1 — Safe deletes & exact-dup merges** (no content loss): A2, A7, A3 (delete refactoring-guide), B1 delete of `backend/api-documentation.md`.
2. **Phase 2 — Within-section merges** (need careful content union): A1, A4, A5, A6.
3. **Phase 3 — Move internal tooling out** (D) and relocate misplaced files (E).
4. **Phase 4 — Canonical-source consolidation** (B1–B4): designate canonical, trim per-service docs to specifics + links. *Largest change — confirm direction first.*
5. **Phase 5 — Update `sidebars.js`** to drop deleted entries, add the trimmed/renamed paths, and (optionally) restructure the "Guides & Reference" section as the canonical hub.

> Every phase must update `sidebars.js` (and any in-doc cross-links) for the files it touches, or the Docusaurus build breaks on dangling sidebar IDs.

---

## What was actually done (execution log)

**Moved to `docs/_archive/`** (duplicates / superseded / merged-away sources — kept, not deleted):
- `frontend-audit.md` (exact dup of code-audit)
- `ai-service-integration-plan-full.md` (stale draft)
- `backend-api-documentation.md` (superseded by reference/api-reference)
- `frontend-testing-strategy.md`, `backend-testing-strategy.md` (merged into each section's `testing.md`)
- `backend-api-changelog.md` (merged into `backend/development/changelog.md` → "API Surface History")
- `backend-overview-for-pm.md` (merged into `backend/product/PRODUCT-INTRODUCTION.md`)
- `frontend-refactoring-guide.md` (folded into `frontend/development/proposed-changes.md` → "Refactoring Backlog")

**Moved to `docs/_internal/`** (internal AI-agent tooling / QA artifacts / redundant status trackers):
- `multi-expert-team-guide.md`, `shared-contracts-integration-guide.md`, `shared-contracts-quick-start.md` (all multi-expert team tooling)
- `frontend-ai-research-prompt.md` (LLM prompt template)
- `backend-quiz-test-cases.md` (manual QA script)
- `frontend-progress.md`, `backend-progress.md` (status trackers, superseded by changelog/roadmap)

**Merged (content unioned into the kept file):** FE testing, BE testing, BE changelog, BE product intro, FE refactoring backlog.

**Renamed:** `frontend/audits/code-audit.md` → `frontend/audits/strategic-audit.md`.

**Canonical banners added** (per-service docs now point up to the canonical `reference/` doc): FE/BE/AI `development/setup.md` → Getting Started; `frontend/features/product-manual.md` → User Guide; `shared-contracts/api-definitions.md` → API Reference (and retitled "API Contracts").

**sidebars.js** updated for every removed/renamed entry; dangling links in `intro.md` and `quiz-module-api.md` repointed. `npm run build` → SUCCESS.

> To permanently delete the archived/internal files later, just `rm -r docs/_archive docs/_internal`. To restore any to the site, move it back under its section and re-add it to `sidebars.js`.
