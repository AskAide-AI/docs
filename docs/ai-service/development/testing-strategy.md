# AI Service Testing Strategy

Current status and recommended approach for testing the AskAideAI AI Service.

## Current Status

**5 test files exist:**
- `tests/test_api_endpoints.py` — API endpoint integration tests
- `tests/test_progress.py` — Progress tracking tests
- `tests/test_teacher_agent.py` — Teacher AI agent tests
- `tests/unit/test_chunker.py` — Text chunker unit tests
- `tests/unit/test_config.py` — Configuration tests
- `tests/unit/test_rag_filter.py` — RAG filter tests

All tests use pytest.

## Running Tests

```bash
pytest tests/ -v                # All tests
pytest tests/test_api_endpoints.py -v  # Single file
pytest tests/unit/ -v           # Unit tests only
```

## Coverage Gaps

| Area | Tests Exist | Priority |
|------|-------------|----------|
| Chunker | Yes | — |
| Config | Yes | — |
| RAG filter | Yes | — |
| API endpoints | Yes (basic) | — |
| Progress | Yes | — |
| Teacher agent | Yes (basic) | — |
| **UploadService** | **No** | **High** |
| **QueryService** | **No** | **High** |
| **GenerateQuestionService** | **No** | **High** |
| **LLMInsightsService** | **No** | **Medium** |
| **TopicSyncService** | **No** | **Medium** |
| **Embedding** | **No** | **Medium** |
| **LLM providers** | **No** | **Low** |

## Recommended Test Expansion

### Phase 1
1. **UploadService** — Test document ingestion pipeline (chunking → embedding → Qdrant)
2. **QueryService** — Test semantic search and RAG response generation

### Phase 2
1. **GenerateQuestionService** — Test question generation with mocked LLM
2. **LLMInsightsService** — Test insight generation with mocked LLM

### Phase 3
1. Integration tests for full pipeline (upload → search → generate)
2. Provider-specific tests with mocked HTTP calls

## Testing Patterns

### Service with DI (singleton pattern from `services/shared.py`)
```python
# conftest.py
@pytest.fixture
def mock_llm_service(mocker):
    mock = mocker.MagicMock()
    mock.generate.return_value = [{"response": {"summary": "test"}}]
    return mock

@pytest.fixture
def service(mock_llm_service):
    from services.upload_service import UploadService
    return UploadService(llm_service=mock_llm_service)
```

### FastAPI endpoint test
```python
def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

### Mocking Qdrant/MongoDB
```python
@pytest.fixture
def mock_qdrant(mocker):
    mock = mocker.patch("db.qdrant_db.QdrantDB")
    mock.return_value.search.return_value = [...]
    return mock
```

## Coverage Goals

| Metric | Current | Target |
|--------|---------|--------|
| Services tested | 3/10 (30%) | 8/10 (80%) |
| Unit test coverage | ~20% | 60%+ |
| Integration tests | 3 files | 8+ critical paths |
| API endpoint coverage | Basic | All endpoints |
