# AI Service Quick Reference

> **⚠️ IMPORTANT — Internal Python API Only**
> All features documented here use the `services.ai` Python module directly via `from services.ai import get_ai_orchestrator`. These are **NOT yet exposed as HTTP API endpoints**. They are fully implemented and ready for Backend integration once API routes are added to `main.py`. See `INTEGRATION_PLAN.md` for proposed HTTP API mappings (future work).

## Cheat Sheet for AI Features

### Import Once
```python
from services.ai import get_ai_orchestrator
orchestrator = get_ai_orchestrator()
```

---

## 1. Enhanced Search (Use Every Time)
```python
result = orchestrator.enhanced_search(
    query="Explain photosynthesis",
    use_expansion=True,     # Add synonyms/related terms
    use_multi_hop=True,    # Complex reasoning
    filters={"subject_id": "biology"}
)
print(result.answer)
```

---

## 2. Learning Path (Course Planning)
```python
path = orchestrator.get_learning_path(
    target_concept="Neural Networks",
    student_id="student_123",
    known_concepts=["Python", "Statistics"]
)
print(f"Learn: {[c['name'] for c in path.learning_path]}")
print(f"Time: {path.estimated_time_minutes} min")
```

---

## 3. Adaptive Practice (Personalized Quizzes)
```python
quiz = orchestrator.generate_practice(
    topic="Biology",
    student_id="student_123",
    question_count=10
)
for q in quiz['questions']:
    print(f"{q['text']}")
```

---

## 4. Socratic Discussion (Critical Thinking)
```python
guide = orchestrator.discuss_topic(
    topic="Climate Change",
    difficulty="intermediate"
)
print(f"Questions: {guide['total_questions']}")
for q in guide['exploration']['questions']:
    print(f"  - {q}")
```

---

## 5. Concept Extraction (From Documents)
```python
concepts = orchestrator.extract_concepts(
    text=document_text,
    subject_id="physics",
    chapter_id="mechanics"
)
for c in concepts:
    print(f"{c['name']} (needs: {c['prerequisites']})")
```

---

## 6. Multi-hop Reasoning (Complex Questions)
```python
result = orchestrator.enhanced_search(
    query="How does X affect Y?",
    use_multi_hop=True
)
for step in result.reasoning_steps:
    print(f"Q: {step['question']}")
    print(f"A: {step['answer']}\n")
```

---

## 7. Track Student Progress
```python
from services.ai import AdaptiveQuestionGenerator

gen = AdaptiveQuestionGenerator()
gen.update_mastery("student_123", "Photosynthesis", correct=True, response_time=15.0)

recs = gen.generate_practice_recommendations("student_123")
print(f"Focus: {recs['focus_areas']}")
print(f"Difficulty: {recs['recommended_difficulty']}")
```

---

## Feature Selection Guide

| Need | Feature | Example |
|------|---------|---------|
| Better search | Query Expansion | Every search |
| Complex questions | Multi-hop RAG | "How does X relate to Y?" |
| Learning order | Concept Graph | Course prerequisites |
| Deeper thinking | Socratic | Discussion prep |
| Practice quizzes | Adaptive Questions | Test generation |
| Smart chunking | Semantic Chunking | Document ingestion |
| Everything | AI Orchestrator | Production use |

---

## Decision Tree

```
Need help?
│
├─ Better search results?
│  └─ Use enhanced_search(use_expansion=True)
│
├─ Complex reasoning?
│  └─ Use enhanced_search(use_multi_hop=True)
│
├─ Build learning path?
│  └─ Use get_learning_path()
│
├─ Generate practice?
│  ├─ Specific difficulty → QuizBuilder
│  └─ Adaptive to student → generate_practice(student_id=...)
│
├─ Discussion questions?
│  └─ Use discuss_topic()
│
└─ Everything?
   └─ Use get_ai_orchestrator()
```

---

## Common Patterns

### Student Onboarding
```python
# 1. Extract concepts from uploaded documents
concepts = orchestrator.extract_concepts(text, subject_id, chapter_id)

# 2. Build initial learning path
path = orchestrator.get_learning_path(target_concept=first_topic)

# 3. Generate practice
quiz = orchestrator.generate_practice(topic, student_id)
```

### Quiz Generation
```python
# 1. Get student level
profile = gen.get_student_profile(student_id)

# 2. Generate adaptive quiz
quiz = gen.generate_adaptive(student_id, topics, count=10)

# 3. Track performance
gen.update_mastery(student_id, topic, correct, response_time)
```

### Study Session
```python
# 1. Get discussion guide
guide = orchestrator.discuss_topic(topic)

# 2. Start with expanded search
search = orchestrator.enhanced_search(query)

# 3. Get practice recommendations
recs = orchestrator.get_practice_recommendations(student_id)
```

---

## Configuration

```python
# Query Expansion
expander = QueryExpander()
result = expander.expand(query, mode="full")

# Multi-hop RAG
rag = MultiHopRAG()
rag.max_hops = 5  # Max reasoning steps

# Semantic Chunking
chunker = SemanticChunker(target_size=500, overlap=50)

# Adaptive Questions
gen = AdaptiveQuestionGenerator()
gen.update_mastery(student_id, concept, correct, time)
```

---

## Error Handling

```python
try:
    result = orchestrator.enhanced_search(query)
except LLMServiceUnavailable:
    # Fallback to basic search
    result = basic_search(query)
except Exception as e:
    logger.error(f"AI service error: {e}")
    # Return graceful error
    return {"error": "AI temporarily unavailable"}
```

---

## Performance Tips

| Feature | Optimization |
|---------|-------------|
| Query Expansion | Cache expanded queries |
| Multi-hop RAG | Limit max_hops for simple queries |
| Concept Graph | Build once, cache per subject |
| Adaptive Questions | Batch updates |
| Semantic Chunking | Process offline |

---

## Debug Mode

```python
import logging
logging.getLogger("services.ai").setLevel(logging.DEBUG)

# See detailed logs
orchestrator = get_ai_orchestrator()
result = orchestrator.enhanced_search("query")
# DEBUG output shows expansion, reasoning, etc.
```
