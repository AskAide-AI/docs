# RAG System API

A Retrieval-Augmented Generation (RAG) system with FastAPI, Qdrant, and advanced AI capabilities for educational platforms.

## Quick Start

```bash
# Start Qdrant
docker run -p 6333:6333 qdrant/qdrant

# Start server
uvicorn main:app --reload --port 8000
```

Then visit http://localhost:8000/docs for the API documentation.

---

## Features

### Basic RAG
- Document upload (PDF, DOCX, TXT)
- Semantic search with Qdrant
- Multi-format document support

### Advanced AI (services/ai/)
| Feature | Purpose |
|---------|---------|
| **Query Expansion** | Better search with synonyms, concepts |
| **Multi-hop RAG** | Complex reasoning across documents |
| **Concept Graph** | Learning paths & prerequisites |
| **Socratic Questions** | Critical thinking exercises |
| **Adaptive Questions** | Personalized practice quizzes |
| **Semantic Chunking** | Intelligent document splitting |

---

## Usage Examples

### Basic Search
```python
import httpx

response = httpx.post("http://localhost:8000/query", json={
    "query": "What is photosynthesis?",
    "limit": 5
})
print(response.json())
```

### Enhanced Search (via AI Orchestrator — Internal Python API)
```python
from services.ai import get_ai_orchestrator

orchestrator = get_ai_orchestrator()

# Enhanced search with query expansion
result = orchestrator.enhanced_search(
    query="Explain the water cycle",
    use_expansion=True,
    filters={"subject_id": "science"}
)

# Learning path generation
path = orchestrator.get_learning_path(
    target_concept="Neural Networks",
    student_id="student_123",
    known_concepts=["Python", "Statistics"]
)

# Adaptive practice
quiz = orchestrator.generate_practice(
    topic="Biology",
    student_id="student_123",
    question_count=10
)
```

> **Note:** The AIOrchestrator and all `services/ai/` modules are implemented in Python code but **not yet exposed as HTTP API endpoints**. These features are available via Python imports only. See `docs/INTEGRATION_PLAN.md` for proposed API endpoints.

---

## API Endpoints

### Core RAG
- `POST /upload-document` - Upload document (PDF, DOCX, TXT)
- `POST /upload-status/{task_id}` - Poll document ingestion status
- `POST /query` - Search documents with RAG
- `POST /search-document` - Check if document exists in vector store
- `POST /generate-questions` - Generate AI-powered questions from chapter content
- `POST /delete-document` - Delete document and its embeddings
- `POST /regenerate-topics` - Regenerate topics from uploaded documents
- `POST /sync-chapter-topics` - Sync chapter topics with MongoDB

### AI Agent
- `POST /ai-agent` - Non-streaming AI agent response
- `POST /ai-agent/stream` - Streaming AI agent response (SSE)
- `GET /ai-agent/classes` - List classes for agent context
- `GET /ai-agent/chapters` - List chapters for agent context
- `GET /ai-agent/tasks` - List pending agent tasks
- `GET /ai-agent/health` - Agent subsystem health
- `POST /ai-agent/modify` - Modify agent generation parameters
- `GET /ai-agent/history` - Get agent generation history
- `GET /ai-agent/generation/{generation_id}` - Get specific generation details

### Conversations
- `POST /conversations` - Create a new conversation
- `GET /conversations` - List conversations
- `GET /conversations/{conversation_id}/messages` - Get conversation messages
- `POST /conversations/{conversation_id}/messages` - Add message to conversation
- `DELETE /conversations/{conversation_id}` - Delete a conversation

### AI Insights
- `GET /ai-insights/subject` - Subject-level learning insights
- `GET /ai-insights/chapter` - Chapter-level learning insights
- `GET /ai-insights/teacher/class` - Teacher class insights

### Monitoring
- `GET /health` - Health check with details
- `GET /health/live` - Kubernetes liveness probe
- `GET /health/ready` - Kubernetes readiness probe
- `GET /metrics` - Prometheus metrics

---

## AI Capabilities

See [AI Features Guide](docs/AI_FEATURES_QUICKREF.md) for detailed usage.

### Example: Student Learning Path
```python
from services.ai import ConceptDependencyGraph, CurriculumBuilder

# Extract concepts from documents
graph = ConceptDependencyGraph()
concepts = graph.extract_concepts_from_document(
    text=chapter_text,
    subject_id="physics",
    chapter_id="mechanics"
)

# Find learning path
path = graph.find_learning_path(
    target_concept="Quantum Physics",
    current_knowledge=["Classical Mechanics", "Waves"]
)

print(f"Learn in order: {[c.name for c in path.concepts]}")
print(f"Time needed: {path.total_duration_minutes} min")
```

### Example: Adaptive Practice
```python
from services.ai import AdaptiveQuestionGenerator, DifficultyLevel

gen = AdaptiveQuestionGenerator()

# Generate questions at right difficulty
questions = gen.generate_for_concept(
    concept="Photosynthesis",
    difficulty=DifficultyLevel.INTERMEDIATE,
    count=10
)

# Track student progress
gen.update_mastery(
    student_id="student_123",
    concept="Photosynthesis",
    correct=True,
    response_time=20.0
)

# Get recommendations
recs = gen.generate_practice_recommendations("student_123")
print(f"Focus on: {recs['focus_areas']}")
```

### Example: Socratic Discussion
```python
from services.ai import SocraticQuestionGenerator

socratic = SocraticQuestionGenerator()

# Generate critical thinking questions
discussion = socratic.generate_questions(
    topic="Climate Change",
    count=7
)

for q in discussion.questions:
    print(f"[{q.question_type.value}] {q.question}")
```

---

## Configuration

Set these environment variables (optional - defaults work out of box):

```bash
# Qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_VECTOR_SIZE=384

# LLM Provider
LLM_PROVIDER=openrouter  # or: openai, gemini, anthropic
OPENROUTER_API_KEY=sk_...

# Embeddings
EMBEDDING_PROVIDERS=ollama,google
OLLAMA_BASE_URL=http://localhost:11434

# Processing
QDRANT_CHUNK_SIZE=512
QDRANT_BATCH_SIZE=32

# Question Generation — Context Rotation
QG_CANDIDATE_POOL=200    # Chapter chunks to consider per generation
QG_CANDIDATE_SAMPLE=12   # Chunks randomly sampled and fed to the LLM
```

---

## Project Structure

```
ai-service/
├── main.py                    # FastAPI app
├── config.py                  # Settings (Pydantic)
├── config.yaml                # Configuration
│
├── services/
│   ├── rag.py                 # Core RAG system
│   ├── upload_service.py       # Document ingestion
│   ├── query_service.py       # Search service
│   ├── generate_question_service.py
│   ├── llm_insights.py
│   └── ai/                    # AI enhancements
│       ├── __init__.py
│       ├── orchestrator.py     # Unified AI API
│       ├── query_expansion.py  # Query enhancement
│       ├── multi_hop_rag.py    # Complex reasoning
│       ├── concept_graph.py    # Learning paths
│       ├── socratic.py         # Critical thinking
│       ├── adaptive_questions.py
│       └── semantic_chunking.py
│
├── db/
│   ├── qdrant_db.py          # Vector DB
│   ├── mongo_db.py           # Metadata
│   └── redis_db.py           # Cache & pub/sub
│
├── utils/
│   ├── embedding.py           # Embedding providers
│   ├── chunker.py            # Text splitting
│   ├── cache.py              # Redis caching
│   ├── metrics.py            # Monitoring
│   └── validators.py         # Input validation
│
├── tests/
│   └── unit/                 # Unit tests
│
└── docs/
    └── AI_FEATURES_QUICKREF.md
```

---

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
pytest tests/ -v

# Lint
ruff check . --fix

# Type check
mypy . --ignore-missing-imports

# Start server
uvicorn main:app --reload --port 8000
```

---

## Troubleshooting

### Qdrant connection fails
```bash
docker run -p 6333:6333 qdrant/qdrant
```

### Import errors
```bash
pip install -r requirements.txt
```

### Slow embedding generation
```bash
# Use Ollama locally
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

---

## Documentation

- [AI Features Guide](docs/AI_FEATURES_QUICKREF.md) - Detailed AI usage
- [Improvement Guide](.agent/skills/ai-service-improvement/SKILL.md) - Best practices
- [Cross-repo Integration](CROSS_REPO_MAP.md) - Backend integration
