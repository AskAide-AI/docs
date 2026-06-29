# AI Service Learning Guide

A comprehensive guide to understanding the **AskAide AI Service** -- its tech stack, core AI/RAG concepts, architecture, and the key technologies used. Whether you are a beginner getting started or a developer ramping up on this project, this guide points you to what you need to know.

---

## What's Inside

1. [Tech Stack Overview](#tech-stack-overview)
2. [Core AI Concepts](#core-ai-concepts)
3. [Architecture & Project Structure](#architecture--project-structure)
4. [Deep Dive into Key Technologies](#deep-dive-into-key-technologies)
5. [LLM & AI Concepts Explained](#llm--ai-concepts-explained)
6. [Reference Material](#reference-material)

---

## Tech Stack Overview

| Layer | Technology | What it does |
|-------|-----------|-------------|
| **Runtime** | Python 3.11+ | The language the service is written in |
| **Framework** | FastAPI | High-performance async web framework for building APIs |
| **Server** | Uvicorn | Ultra-fast ASGI server (runs FastAPI) |
| **Vector DB** | Qdrant | Stores document embeddings for semantic search |
| **Database** | MongoDB | Stores chapter topics, subjects, teacher-student records |
| **Cache** | Redis | Pub/sub and caching |
| **LLM Client** | openai, google-generativeai, anthropic | Multiple LLM provider SDKs |
| **PDF Parsing** | pypdfium2, python-docx | Extract text from PDFs and Word documents |
| **Logging** | structlog, python-logging-loki | Structured logging and log shipping to Loki |
| **Config** | pydantic-settings | Environment variable management and validation |
| **HTTP Client** | httpx | Async HTTP requests |
| **Utilities** | rapidfuzz, numpy | Fuzzy matching and numerical operations |
| **Retry Logic** | tenacity | Retry decorators for external API calls |
| **Streaming** | sse-starlette | Server-Sent Events for streaming responses |

---

## Core AI Concepts

### Retrieval-Augmented Generation (RAG)
The core of the AI service. RAG is a technique that improves LLM responses with external knowledge.

**How it works:**
1. **Documents are ingested** -- Text is extracted from PDFs/DOCX files.
2. **Text is chunked** -- The document is broken into smaller sections (e.g., 512 characters with 50 overlap).
3. **Chunks are embedded** -- Each chunk is converted into a vector (a list of numbers) that represents its semantic meaning.
4. **Vectors are stored** -- These vectors are saved in a vector database (Qdrant).
5. **Query is embedded** -- When a user asks a question, it is also converted into a vector.
6. **Similarity search** -- The system finds the stored vectors most similar to the query vector.
7. **Context is retrieved** -- The original text chunks for those vectors are fetched.
8. **LLM generates response** -- The LLM uses the retrieved context + the original question to generate an accurate, grounded answer.

### Embeddings & Vector Search
- **Embedding**: Converting text into a mathematical representation (vector). Two semantically similar sentences will have very similar vectors.
- **Vector Search**: Finding the closest vectors in a high-dimensional space using algorithms like cosine similarity. Qdrant uses approximate nearest neighbors (ANN) for fast search.
- **Vector Dimension**: The length of the vector (e.g., 384, 512). All embeddings must match the database's vector size. The service auto-normalizes embeddings to a fixed size.

### Document Chunking
- Documents are too large to send to an LLM as-is.
- Chunking breaks them into smaller, manageable pieces.
- The project uses configurable chunk sizes (default: 512 chars, 50 overlap), plus larger chunks for summarization (1000 chars).

---

## Architecture & Project Structure

```
ai-service/
- main.py                 # FastAPI entry point with all endpoints
- config.py               # Pydantic settings (env vars)
- logger.py               # Structured logging setup
- requirements.txt        # Python dependencies
- db/
  - qdrant_db.py          # Qdrant vector database client
  - mongo_db.py           # MongoDB connection + CRUD helpers
  - redis_db.py           # Redis pub/sub and caching
- services/
  - upload_service.py       # Document ingestion (chunk, embed, store)
  - query_service.py        # Semantic search + RAG response generation
  - generate_question_service.py # AI-powered question generation
  - llm_insights.py         # AI learning insights for students
  - rag.py                  # Core RAG orchestration
  - education_ai_agent.py   # Teacher content generation agent
  - llm_service.py          # LLM provider factory (gets OpenAI, Gemini, etc.)
  - shared.py               # Singleton registry (lazy-init services)
- llm/
  - llm_open_router.py    # OpenRouter provider
  - llm_open_ai.py        # OpenAI provider
  - llm_gemini.py         # Google Gemini provider
  - llm_anthropic.py      # Anthropic provider
- utils/
  - embedding.py          # Embedding provider chain (Ollama, Google, OpenAI)
  - chunker.py            # Text chunking logic
  - prompt.py             # LLM prompt templates
  - schema.py             # Pydantic request/response schemas
  - response_format.py    # Structured output formatting
  - topic_search.py       # Topic-based document search
  - ...                   # Various utilities
```

### Key Files to Know
- `main.py` -- All FastAPI routes live here (upload, query, question generation, AI insights, education AI agent).
- `config.py` -- All settings loaded from environment variables using Pydantic. Handles multiple embedding/LLM providers.
- `services/shared.py` -- Important: Lazy singleton registry. Heavy objects (embedders, LLM clients) are NOT created at startup to save memory (512 MB limit on Render free tier).
- `db/qdrant_db.py` -- All Qdrant vector database operations (insert chunks, search, delete).
- `db/mongo_db.py` -- MongoDB connection using PyMongo (not Mongoose, this is Python).
- `services/llm_service.py` -- Factory that returns the correct LLM provider based on `LLM_PROVIDER` env var.
- `utils/embedding.py` -- Embedding provider factory with fallback chain (tries Ollama, then Google, etc.).

---

## Deep Dive into Key Technologies

### FastAPI & Uvicorn
FastAPI is a modern, fast (high-performance) Python web framework. It is built on top of Starlette and Pydantic.

**What to learn:**
- Defining routes (`@app.get()`, `@app.post()`)
- Pydantic models for request/response validation (`QueryRequest`, `QueryResponse`)
- Dependency injection (`Depends()`)
- Background tasks and `async`/`await`
- ASGI lifespan events (startup/shutdown)
- Uvicorn as the ASGI server (`uvicorn main:app --reload`)

### Qdrant (Vector Database)
Qdrant is an open-source vector database that stores and searches millions of vectors efficiently.

**What to learn:**
- Collections (like tables) and vectors (documents)
- Payloads (metadata attached to vectors, e.g., chapter_id, subject_id)
- Similarity search (cosine similarity for nearest neighbors)
- Filtering by payload (e.g., only search within a specific chapter)

### MongoDB (PyMongo)
The Python native driver for MongoDB. The service uses it for metadata (topics, teacher-student assignments, etc.).

**What to learn:**
- Connecting with `pymongo.MongoClient`
- CRUD operations: `insert_one`, `find`, `update_one`, `delete_one`
- Collections and documents

### Pydantic & Pydantic Settings
Pydantic is a data validation library. Pydantic Settings extends it to load `.env` files and typecast environment variables.

**What to learn:**
- Defining models with type hints
- Validation (e.g., `port: int`, `host: str`)
- Loading from environment variables (`Field(validation_alias="QDRANT_HOST")`)

### Redis
Used for pub/sub messaging and potentially caching. Redis is an in-memory data store known for its speed.

**What to learn:**
- Key-value operations
- Publish/subscribe patterns
- Redis connection in Python with `redis` library

---

## LLM & AI Concepts Explained

### Large Language Models (LLMs)
LLMs are AI models (like GPT-4, Claude, Gemini) trained on massive amounts of text. They can generate human-like text, answer questions, summarize, translate, and more. The service supports switching between providers (OpenRouter, OpenAI, Gemini, Anthropic) via a factory pattern.

### Embedding Models
Embedding models convert text into vectors. Examples used by the service:
- **Ollama models** (local, free)
- **Google (Gemini)** embedding API
- **OpenAI** (text-embedding-3-small)

### Context Rotation
For question generation, the service does not always pick the first chunks of a document. It uses a "context rotation" strategy: it considers a large pool of candidate chunks (default 200), samples a smaller subset (default 12), and feeds those to the LLM. This ensures questions are generated from diverse parts of the chapter.

### Streaming Responses
The AI agent can stream responses token-by-token using Server-Sent Events (SSE). This gives users the feeling of a real-time conversation.

### Rate Limiting
All endpoints (except `/ping`, `/health`) are rate-limited to 200 requests per 60 seconds per IP to prevent abuse.

---

## Reference Material

### Official Docs & Learning
| Topic | Resource |
|-------|----------|
| **Python 3.11+** | [docs.python.org/3.11](https://docs.python.org/3.11/) -- Python language docs |
| **FastAPI** | [fastapi.tiangolo.com](https://fastapi.tiangolo.com) -- Fast, modern web framework |
| **Uvicorn** | [uvicorn.org](https://uvicorn.org) -- ASGI web server |
| **Pydantic** | [docs.pydantic.dev](https://docs.pydantic.dev) -- Data validation |
| **Qdrant** | [qdrant.tech/documentation](https://qdrant.tech/documentation/) -- Vector database |
| **MongoDB (PyMongo)** | [pymongo documentation](https://www.mongodb.com/docs/languages/python/pymongo-driver/current/) -- Python MongoDB driver |
| **Redis** | [redis.io/docs](https://redis.io/docs/) -- In-memory data store |
| **OpenAI SDK** | [platform.openai.com/docs](https://platform.openai.com/docs) -- OpenAI API |
| **Google Gemini** | [ai.google.dev/gemini-api](https://ai.google.dev/gemini-api/docs) -- Gemini SDK |
| **Anthropic SDK** | [docs.anthropic.com](https://docs.anthropic.com) -- Claude API |
| **OpenRouter** | [openrouter.ai/docs](https://openrouter.ai/docs) -- Unified LLM API gateway |
| **Embeddings 101** | [cohere.com/llm-university/embeddings](https://docs.cohere.com/docs/embeddings) -- General concept |
| **What is RAG?** | [IBM: What is RAG](https://research.ibm.com/blog/retrieval-augmented-generation-RAG) -- RAG explained |
| **Sentence Transformers** | [sbert.net](https://sbert.net/) -- Embedding models |
| **S.Starlette** | [starlette.io](https://www.starlette.io/) -- ASGI framework (FastAPI base) |

### AskAide AI Specific
| Resource | Location |
|----------|----------|
| AI Service README | `ai-service/README.md` |
| AI Service Architecture | AskAide Docs: `docs/ai-service/architecture.md` |
| AI Service Overview | AskAide Docs: `docs/ai-service/overview.md` |
| AI Service Setup | AskAide Docs: `docs/ai-service/development/setup.md` |
| AI Integration Plan | AskAide Docs: `docs/ai-service/development/integration-plan.md` |
| AI Features Quick Ref | AskAide Docs: `docs/ai-service/features/ai-features-quickref.md` |
| Cross-Repo Map | AskAide Docs: `docs/ai-service/features/cross-repo-map.md` |

### Recommended Learning Path
1. **Learn Python basics** (syntax, functions, async/await)
2. **Learn FastAPI** (routes, Pydantic models, async handlers)
3. **Understand RAG concept** (ingestion, embedding, similarity search, generation)
4. **Learn Qdrant basics** (collections, vectors, payloads, similarity search)
5. **Learn PyMongo** (connecting, CRUD operations)
6. **Understand embedding models** (what they are, how similarity works)
7. **Explore the codebase** (`main.py` -> `services/` -> `db/` -> `utils/`)
8. **Try uploading a document and querying it** to see RAG in action
