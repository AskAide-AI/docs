# Data Gap Analysis — Content Hierarchy

**Date:** 2026-05-08 (updated)  
**Database:** `user` (MongoDB)

## Overview

Analysis of content completeness across the hierarchy:  
`Classes → Subjects → Chapters → Topics → Questions`

## Counts

| Entity | Total | Complete | Gap | Gap % |
|--------|-------|----------|-----|-------|
| Classes | 7 | 7 | 0 | 0% |
| Subjects | 43 | 43 | 0 | 0% |
| Chapters | 574 | 157 (have topics) | 417 | 72.6% |
| Topics | 1499 | 101 (have questions) | 1398 | 93% |
| Questions | 1275 | — | — | — |

## Class-Level Summary

| Class | Subjects | Chapters | Chapters w/ Topics | Chapters w/o Topics |
|-------|----------|----------|-------------------|-------------------|
| 6th | 5 | 51 | 0 | 51 |
| 7th | 5 | 72 | 0 | 72 |
| 8th | 5 | 59 | 0 | 59 |
| 9th | 5 | 76 | 76 | 0 |
| 10th | 5 | 82 | 81 | 1 |
| 11th | 9 | 116 | 0 | 116 |
| 12th | 9 | 118 | 0 | 118 |

## Chapters Without Topics (417 total)

### Class 6th — All 51 chapters lack topics

| Subject | Code | Total Ch | Without Topics |
|---------|------|----------|----------------|
| Mathematics | MAT | 10 | 10 |
| English | ENG | 2 | 2 |
| Hindi | HIN | 13 | 13 |
| Social Studies | SOC | 14 | 14 |
| Science | SCI | 12 | 12 |

### Class 7th — All 72 chapters lack topics

| Subject | Code | Total Ch | Without Topics |
|---------|------|----------|----------------|
| Mathematics | MAT | 15 | 15 |
| English | ENG | 15 | 15 |
| Hindi | HIN | 10 | 10 |
| Social Studies | SOC | 20 | 20 |
| Science | SCI | 12 | 12 |

### Class 8th — All 59 chapters lack topics

| Subject | Code | Total Ch | Without Topics |
|---------|------|----------|----------------|
| Mathematics | MAT | 14 | 14 |
| English | ENG | 15 | 15 |
| Hindi | HIN | 10 | 10 |
| Social Studies | SOC | 7 | 7 |
| Science | SCI | 13 | 13 |

### Class 9th — All 76 chapters have topics ✅

### Class 10th — 1 chapter lacks topics

| Subject | Code | Total Ch | Without Topics | Missing Chapters |
|---------|------|----------|----------------|-----------------|
| Mathematics | MAT | 14 | 0 | — |
| English | ENG | 18 | 0 | — |
| Hindi | HIN | 17 | 1 | 3. Kritika |
| Science | SCI | 11 | 0 | — |
| Social Studies | SOC | 22 | 0 | — |

### Class 11th — All 116 chapters lack topics

| Subject | Code | Total Ch | Without Topics |
|---------|------|----------|----------------|
| Mathematics | MAT | 14 | 14 |
| English | ENG | 16 | 16 |
| Physics | PHY | 14 | 14 |
| Chemistry | CHE | 9 | 9 |
| Biology | BIO | 19 | 19 |
| Computer Science | COM | 11 | 11 |
| Economics | ECO | 13 | 13 |
| Business Studies | BUS | 11 | 11 |
| Accountancy | ACC | 9 | 9 |

### Class 12th — All 118 chapters lack topics

| Subject | Code | Total Ch | Without Topics |
|---------|------|----------|----------------|
| Mathematics | MAT | 13 | 13 |
| English | ENG | 19 | 19 |
| Physics | PHY | 14 | 14 |
| Chemistry | CHE | 10 | 10 |
| Biology | BIO | 13 | 13 |
| Computer Science | COM | 13 | 13 |
| Economics | ECO | 14 | 14 |
| Business Studies | BUS | 11 | 11 |
| Accountancy | ACC | 11 | 11 |

## Chapters Without Questions (148)

Only 12 of 160 chapters have questions. These are concentrated in:

- **9th English** — 18 chapters (mostly covered)
- **9th Hindi** — 13 chapters (mostly covered)
- **10th English** — 18 chapters (mostly covered)
- **10th Hindi** — 17 chapters (mostly covered)
- **10th Science** — 2 of 11 chapters have questions
- **9th Math** — partial coverage
- **6th English** — 2 chapters (partial)

Every other chapter across all classes has zero questions.

## Topics Without Questions (1,398 of 1,499)

93% of topics have no questions linked. Only 101 topics (6.7%) have at least one question.

Additionally, 146 topics (9.7%) are not linked to any chapter via `chaptertopics`.

## Priority Actions

1. **Add topics** for 417 chapters across Classes 6, 7, 8, 11, and 12 (all subjects) and 10th Hindi (1 chapter)
2. **Add questions** for topics that have none (1,398 of 1,499)
3. **Link orphan topics** (146) to chapters
4. **Fix 10th Hindi** — chapter "3. Kritika" is missing topic links
