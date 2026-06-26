# AI Service Troubleshooting Guide

Common issues and solutions when working with the AskAideAI AI Service.

## Server Startup Issues

### Uvicorn fails to start
**Symptoms:** `ModuleNotFoundError`, port in use
**Solutions:**
1. Activate virtual environment: `source venv/bin/activate`
2. Install deps: `pip install -r requirements.txt`
3. Kill process on port 8000
4. Check Python version (3.11+ required)

### MongoDB connection fails
**Symptoms:** `ServerSelectionTimeoutError`
**Solutions:**
1. Verify `MONGO_URI` in `.env`
2. Check MongoDB is running
3. Ensure IP whitelist includes your host (Atlas)

### Qdrant connection fails
**Symptoms:** Qdrant operations timeout or fail
**Solutions:**
1. Verify `QDRANT_HOST` and `QDRANT_API_KEY` in `.env`
2. Check Qdrant service is running
3. Verify the collection exists: `QDRANT_COLLECTION_NAME`

### Redis connection fails
**Symptoms:** Redis operations fail
**Solutions:**
1. Verify `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` in `.env`
2. Check Redis service is running
3. For Upstash: use `REDIS_HOST` (not localhost)

## LLM Issues

### LLM provider returns errors
**Symptoms:** Question generation or summarization fails
**Solutions:**
1. Verify `LLM_PROVIDER` is set correctly (`openrouter`, `openai`, `gemini`, `anthropic`)
2. Check the corresponding API key is set
3. Verify API key has sufficient quota
4. Check AI Service logs for the specific error

### LLM response is slow
**Symptoms:** Generation takes >30 seconds
**Solutions:**
1. Check LLM provider status page
2. Consider switching providers
3. Reduce chunk sizes in `.env`

### Structured output parsing fails
**Symptoms:** LLM returns malformed JSON
**Solutions:**
1. Check `ResponseSchema` in `utils/response_format.py`
2. Verify the schema matches the LLM's capabilities
3. Add retry logic (LLM calls are generators — iterate fully)

## Embedding Issues

### Embedding provider chain fails
**Symptoms:** All embedding providers return errors
**Solutions:**
1. Check `EMBEDDING_PROVIDERS` order (comma-separated, tried left-to-right)
2. For `ollama`: verify `OLLAMA_BASE_URL` and model name
3. For `google`/`openai`: check API keys
4. Embeddings auto-pad/truncate to `QDRANT_VECTOR_SIZE`

### Vector dimension mismatch
**Symptoms:** Qdrant rejects vectors with wrong dimensions
**Solutions:**
1. All embeddings auto-normalize to `QDRANT_VECTOR_SIZE` (default 1024)
2. If changing dimensions, recreate the Qdrant collection

## Document Upload Issues

### Upload returns error immediately
**Solutions:**
1. Check file format (TXT, PDF, DOCX supported)
2. Verify file is not corrupted
3. Check upload semaphore (max 5 concurrent uploads)

### Upload succeeds but processing fails
**Symptoms:** Task status shows "failed"
**Solutions:**
1. Check task status: `GET /upload-status/{task_id}`
2. Look for chunking or LLM errors in logs
3. Try re-uploading the document

### Topics not extracted after upload
**Solutions:**
1. Check if LLM summarization step succeeded
2. Verify topic extraction ran in the pipeline
3. Use `POST /sync-chapter-topics` to sync Qdrant → MongoDB

## Search & Query Issues

### Search returns no results
**Solutions:**
1. Verify documents have been uploaded and indexed
2. Check Qdrant collection has vectors
3. Try a different query or adjust chunking parameters

### Search returns irrelevant results
**Solutions:**
1. Check `QDRANT_CHUNK_SIZE` (smaller = more precise)
2. Verify embedding provider is working correctly
3. Check topic filtering is applied correctly

## Memory Issues

### Out of memory on 512 MB plan
**Symptoms:** Service crashes with OOM error
**Solutions:**
1. Never instantiate heavy objects in `__init__` — use `services/shared.py` singletons
2. Always `del raw_text` after chunking
3. Reduce `BATCH_SIZE` and `MAX_WORKERS`
4. Check for memory leaks in long-running services
