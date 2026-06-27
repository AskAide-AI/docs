# AskAide AI — RAG Evaluation & Benchmarking

Two offline tools for measuring the RAG pipeline. **Neither is imported by the
service**, and their heavy dependencies stay out of `requirements.txt` so the
512 MB production image is unaffected. Run these locally or in CI.

| Tool | File | Measures | Needs |
|---|---|---|---|
| **Quality eval** (RAGAS) | `ragas_eval.py` | faithfulness, answer relevancy, context precision/recall | `requirements-eval.txt` + service `.env` (Qdrant/LLM reachable) |
| **Perf benchmark** | `benchmark.py` | latency p50/p90/p95/p99, throughput, TTFT, error rate | only `httpx` (already a service dep) + a **running** server |

---

## 1. Quality eval (RAGAS)

Runs each test question through the *same* pipeline `/query` uses
(`RAGSystem.search` → `QueryService.query`), capturing the retrieved contexts
(which the HTTP endpoint doesn't return) and the generated answer, then scores
with RAGAS.

```bash
# from the ai-service root, with the service venv active and .env present
pip install -r eval/requirements-eval.txt
python -m eval.ragas_eval --dataset eval/dataset.example.jsonl --out eval/results.json
```

**Dataset** (`dataset.example.jsonl`, one JSON object per line):

```json
{"query": "...", "class_id": "...", "subject_id": "...", "chapter_ids": ["..."], "ground_truth": "optional reference answer"}
```

Replace the `REPLACE_*` ids with **real ids from your Qdrant payloads** — the
same ones Backend sends to `/query`. If the filters don't match an ingested
chapter, retrieval returns nothing and scores collapse to ~0 (that's a signal
your ids are wrong, not that the pipeline is bad).

`ground_truth` is optional. Without it you still get **faithfulness** and
**answer_relevancy**; with it you also get **context_precision** and
**context_recall**.

### RAGAS judge configuration

RAGAS needs its own judge LLM + embeddings. It reuses your existing keys — no
new accounts. Configure via env (all optional):

| Env | Default | Notes |
|---|---|---|
| `RAGAS_JUDGE_PROVIDER` | `openrouter` | `openrouter` \| `openai` \| `google` |
| `RAGAS_JUDGE_MODEL` | provider default | e.g. `openai/gpt-4o-mini` for OpenRouter |
| `RAGAS_EMBED_PROVIDER` | auto-detect | `openai` \| `google` (OpenRouter has no embeddings API) |
| `RAGAS_EMBED_MODEL` | provider default | |

Reused keys: `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`.

**Verified config for this deployment** (judge on OpenRouter, embeddings on
Gemini — and `EMBEDDING_PROVIDERS=google` so retrieval matches how the Qdrant
vectors were ingested; querying with a different embedder searches a mismatched
vector space and scores collapse):

```bash
EMBEDDING_PROVIDERS=google \
RAGAS_JUDGE_PROVIDER=openrouter RAGAS_JUDGE_MODEL=openai/gpt-4o-mini \
RAGAS_EMBED_PROVIDER=google RAGAS_EMBED_MODEL=models/gemini-embedding-001 \
PYTHONPATH="$PWD" venv/bin/python -m eval.ragas_eval \
  --dataset eval/dataset.example.jsonl --out eval/results.json
```

---

## 2. Perf benchmark

Load-tests a **running** server. Start it first:

```bash
uvicorn main:app --port 8000
```

Then, in another shell:

```bash
# core RAG path: 100 requests, 10 concurrent
python -m eval.benchmark --endpoint /query --payloads eval/payloads.example.json -n 100 -c 10

# streaming endpoint: measure time-to-first-token
python -m eval.benchmark --endpoint /ai-agent/stream --payloads eval/agent_payloads.json --stream -n 50 -c 5

# save raw numbers for CI trend tracking
python -m eval.benchmark --endpoint /query --payloads eval/payloads.example.json -n 100 -c 10 --out eval/bench.json
```

The payload file is a JSON array of request bodies (cycled round-robin). Edit
`payloads.example.json` with real ids before running, or point `--payloads` at
your own file.

| Flag | Default | Meaning |
|---|---|---|
| `--url` | `http://localhost:8000` | Base URL |
| `--endpoint` | `/query` | Path to hit |
| `-n / --requests` | `100` | Total requests |
| `-c / --concurrency` | `10` | Max in flight |
| `--stream` | off | SSE mode: report TTFT instead of full latency |
| `--timeout` | `120` | Per-request timeout (s) |
| `--out` | — | Write summary JSON |

> Tip: against the Render free tier the first request pays a cold-start penalty.
> Send a warm-up request (or a small `-n` run) before the measured run.

---

## 3. Embedding A/B experiment

`embedding_experiment.py` isolates a single retrieval variable and scores it
against the **live** collection (no re-ingest). It was used to prove that
Gemini queries should be embedded with `taskType=RETRIEVAL_QUERY` rather than
`RETRIEVAL_DOCUMENT` — that change more than doubled `context_precision`
(0.099 → 0.210) and is now applied in `utils/embedding.py` +
`db/qdrant_db.py` (query path only; stored vectors already use the document
task type, so nothing needs re-embedding).

```bash
EMBEDDING_PROVIDERS=google RAGAS_JUDGE_PROVIDER=openrouter \
RAGAS_JUDGE_MODEL=openai/gpt-4o-mini \
PYTHONPATH="$PWD" venv/bin/python -m eval.embedding_experiment \
  --dataset eval/dataset.example.jsonl
```

Use the same pattern to test other levers (chunk size, embedding dim, adding a
reranker) before committing to a full re-ingest.

## Why these and not the NVIDIA skills

These cover the value of NVIDIA's `rag-eval` (RAGAS) and `rag-perf` without the
NVIDIA hardware/NIM/NGC requirements — RAGAS is provider-neutral and the
benchmark is plain `httpx`. If you later self-host on NVIDIA GPUs, the NVIDIA
blueprints become worth revisiting; until then these run on your current stack.
