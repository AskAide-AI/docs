# AI Features Integration Plan (PROPOSED / FUTURE WORK)
## AskAide Platform - Full Stack Implementation

> **⚠️ THIS IS A PROPOSAL — NOT CURRENTLY IMPLEMENTED AS HTTP ENDPOINTS**
> 
> The AI features described here (enhanced search, learning paths, adaptive practice, socratic discussion) are fully implemented as **internal Python modules** in `services/ai/` but are **NOT exposed as HTTP API endpoints**. This document outlines the proposed integration plan for exposing them via `main.py` once the new endpoints are added.
> 
> **Current status:** All `services/ai/` modules exist and are testable via Python imports. The `AIOrchestrator` in `orchestrator.py` provides a unified interface. Only HTTP routing is missing.

---

## Architecture Overview

> **Note:** The architecture shown below is the **target state** after implementation. Currently Frontend calls Backend, which calls AI Service only for the existing endpoints listed in `CLAUDE.md`.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │   Search    │ │   Quiz      │ │   Learning   │ │ Discussion  │   │
│  │   Page      │ │   Page      │ │   Path       │ │   Page      │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Express)                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │   Search    │ │   Quiz      │ │   Learning   │ │   Student   │   │
│  │   Routes    │ │   Routes    │ │   Routes     │ │   Routes    │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                    │                   │                   │
                    ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          AI SERVICE (FastAPI)                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │   Query     │ │   Adaptive  │ │   Concept   │ │   Socratic  │   │
│  │   Expansion │ │   Questions │ │   Graph     │ │   Generator  │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA STORES                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │   Qdrant   │ │   MongoDB   │ │   Redis     │ │   MongoDB   │   │
│  │  (Vectors) │ │  (Topics)   │ │  (Cache)    │ │ (Students)  │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: AI Service Changes

### 1.1 New API Endpoints to Add

```python
# main.py additions

from services.ai import get_ai_orchestrator
from utils.metrics import get_metrics

orchestrator = get_ai_orchestrator()

# ─────────────────────────────────────────────────────────────
# LEARNING PATH ENDPOINTS
# ─────────────────────────────────────────────────────────────

@app.post("/v1/learning-path")
async def get_learning_path(
    target_concept: str,
    student_id: str,
    known_concepts: Optional[List[str]] = None
):
    """
    Get optimal learning path for a concept.
    
    Request:
    {
        "target_concept": "Machine Learning",
        "student_id": "student_123",
        "known_concepts": ["Python", "Statistics"]
    }
    
    Response:
    {
        "concepts": [
            {"id": "1", "name": "Statistics Basics", "difficulty": "beginner"},
            {"id": "2", "name": "Linear Algebra", "difficulty": "intermediate"},
            {"id": "3", "name": "Machine Learning", "difficulty": "advanced"}
        ],
        "estimated_time_minutes": 180,
        "prerequisites": ["Statistics"]
    }
    """
    try:
        path = orchestrator.get_learning_path(
            target_concept=target_concept,
            student_id=student_id,
            known_concepts=known_concepts
        )
        return path
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# PRACTICE/QUIZ ENDPOINTS
# ─────────────────────────────────────────────────────────────

@app.post("/v1/practice/generate")
async def generate_practice(
    topic: str,
    student_id: str,
    question_count: int = 10
):
    """
    Generate adaptive practice questions.
    
    Request:
    {
        "topic": "Photosynthesis",
        "student_id": "student_123",
        "question_count": 10
    }
    
    Response:
    {
        "questions": [
            {
                "id": "q1",
                "text": "What is the primary product of photosynthesis?",
                "type": "MCQ",
                "options": ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
                "difficulty": "intermediate",
                "correct_answer": "Oxygen"
            }
        ],
        "metadata": {
            "topic": "Photosynthesis",
            "difficulty": "intermediate",
            "estimated_time_minutes": 15
        }
    }
    """
    try:
        practice = orchestrator.generate_practice(
            topic=topic,
            student_id=student_id,
            question_count=question_count
        )
        return practice
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/practice/submit")
async def submit_answer(
    student_id: str,
    concept: str,
    correct: bool,
    response_time_seconds: float,
    question_id: str
):
    """
    Submit answer to update mastery tracking.
    
    Request:
    {
        "student_id": "student_123",
        "concept": "Photosynthesis",
        "correct": true,
        "response_time_seconds": 15.5,
        "question_id": "q1"
    }
    
    Response:
    {
        "mastery_updated": true,
        "current_mastery": 0.65,
        "next_recommended_topic": "Cellular Respiration"
    }
    """
    try:
        gen = AdaptiveQuestionGenerator()
        gen.update_mastery(student_id, concept, correct, response_time_seconds)
        
        recommendations = gen.generate_practice_recommendations(student_id)
        
        return {
            "mastery_updated": True,
            "current_mastery": recommendations.get("current_mastery", 0),
            "focus_areas": recommendations.get("focus_areas", []),
            "recommended_difficulty": recommendations.get("recommended_difficulty")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/v1/practice/recommendations/{student_id}")
async def get_recommendations(student_id: str):
    """
    Get personalized practice recommendations.
    """
    try:
        recs = orchestrator.get_practice_recommendations(student_id)
        return recs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# DISCUSSION/SOCRATIC ENDPOINTS
# ─────────────────────────────────────────────────────────────

@app.post("/v1/discussion/generate")
async def generate_discussion(
    topic: str,
    context: Optional[str] = None,
    difficulty: str = "intermediate"
):
    """
    Generate Socratic discussion guide.
    
    Request:
    {
        "topic": "Climate Change",
        "context": "Optional context from documents",
        "difficulty": "intermediate"
    }
    
    Response:
    {
        "opening": {
            "objective": "Establish understanding",
            "questions": ["What is climate?", "What causes change?"]
        },
        "exploration": {
            "objective": "Deep analysis",
            "questions": ["What evidence exists?", "What are the mechanisms?"]
        },
        "synthesis": {
            "objective": "Integration",
            "questions": ["What are the implications?", "What can we do?"]
        },
        "total_questions": 11,
        "estimated_time_minutes": 30
    }
    """
    try:
        discussion = orchestrator.discuss_topic(
            topic=topic,
            context=context,
            difficulty=difficulty
        )
        return discussion
    except Exception as e:
        raise HTTPException(status_code=Enhanced 500, detail=str(e))


@app.post("/v1/discussion/followup")
async def get_followup_question(
    topic: str,
    previous_question: str,
    student_response: str
):
    """
    Get follow-up question based on student response.
    """
    try:
        socratic = SocraticQuestionGenerator()
        followup = socratic.generate_follow_up(
            topic=topic,
            previous_question=previous_question,
            student_response=student_response
        )
        return {"followup": followup}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# ENHANCED SEARCH (Multi-hop)
# ─────────────────────────────────────────────────────────────

@app.post("/v1/search/enhanced")
async def enhanced_search(
    query: str,
    student_id: Optional[str] = None,
    use_expansion: bool = True,
    use_multi_hop: bool = True,
    filters: Optional[Dict[str, Any]] = None
):
    """
    Enhanced search with query expansion and multi-hop reasoning.
    
    Request:
    {
        "query": "How does photosynthesis affect climate?",
        "student_id": "student_123",
        "use_expansion": true,
        "use_multi_hop": true,
        "filters": {"subject_id": "biology"}
    }
    
    Response:
    {
        "answer": "Photosynthesis affects climate by...",
        "confidence": 0.85,
        "sources": [...],
        "reasoning_chain": [
            {"step": 1, "question": "What is photosynthesis?", "answer": "..."},
            {"step": 2, "question": "How does it affect CO2?", "answer": "..."}
        ]
    }
    """
    try:
        result = orchestrator.enhanced_search(
            query=query,
            student_id=student_id,
            use_expansion=use_expansion,
            use_multi_hop=use_multi_hop,
            filters=filters
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# CONCEPT EXTRACTION (for document upload)
# ─────────────────────────────────────────────────────────────

@app.post("/v1/concepts/extract")
async def extract_concepts(
    subject_id: str,
    chapter_id: str
):
    """
    Extract concepts from uploaded documents.
    Called automatically after document upload.
    """
    # This will be called internally after document upload
    # to build the concept graph
    pass
```

### 1.2 Environment Variables to Add

```bash
# .env additions

# AI Feature Flags
ENABLE_QUERY_EXPANSION=true
ENABLE_MULTI_HOP=true
ENABLE_ADAPTIVE_QUESTIONS=true
ENABLE_SOCRATIC=true
ENABLE_LEARNING_PATHS=true

# Caching
CACHE_AI_RESPONSES=true
AI_CACHE_TTL_SECONDS=3600

# Rate Limiting
AI_MAX_REQUESTS_PER_MINUTE=30
```

---

## Part 2: Backend (Express) Changes

### 2.1 New Routes to Add

```javascript
// routes/aiFeatures.js

const express = require('express');
const router = express.Router();
const axios = require('axios');

const AI_ENDPOINT = process.env.AI_ENDPOINT || 'http://localhost:8000';

// ─────────────────────────────────────────────────────────────
// LEARNING PATH
// ─────────────────────────────────────────────────────────────

router.post('/learning-path', async (req, res) => {
    try {
        const { target_concept, student_id, known_concepts } = req.body;
        
        const response = await axios.post(`${AI_ENDPOINT}/v1/learning-path`, {
            target_concept,
            student_id,
            known_concepts
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────
// PRACTICE/QUIZ
// ─────────────────────────────────────────────────────────────

router.post('/practice/generate', async (req, res) => {
    try {
        const { topic, student_id, question_count } = req.body;
        
        const response = await axios.post(`${AI_ENDPOINT}/v1/practice/generate`, {
            topic,
            student_id,
            question_count
        });
        
        // Store quiz session in MongoDB
        const quizSession = {
            student_id,
            topic,
            questions: response.data.questions,
            started_at: new Date(),
            status: 'in_progress'
        };
        
        await QuizSession.create(quizSession);
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/practice/submit', async (req, res) => {
    try {
        const { student_id, concept, correct, response_time_seconds, question_id } = req.body;
        
        const response = await axios.post(`${AI_ENDPOINT}/v1/practice/submit`, {
            student_id,
            concept,
            correct,
            response_time_seconds,
            question_id
        });
        
        // Update quiz session in MongoDB
        await QuizSession.updateOne(
            { student_id, 'questions.id': question_id, status: 'in_progress' },
            { 
                $set: { 
                    'questions.$.answered': true,
                    'questions.$.correct': correct,
                    'questions.$.response_time': response_time_seconds
                }
            }
        );
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/practice/recommendations/:student_id', async (req, res) => {
    try {
        const { student_id } = req.params;
        
        const response = await axios.get(
            `${AI_ENDPOINT}/v1/practice/recommendations/${student_id}`
        );
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────
// DISCUSSION
// ─────────────────────────────────────────────────────────────

router.post('/discussion/generate', async (req, res) => {
    try {
        const { topic, context, difficulty } = req.body;
        
        const response = await axios.post(`${AI_ENDPOINT}/v1/discussion/generate`, {
            topic,
            context,
            difficulty
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/discussion/followup', async (req, res) => {
    try {
        const { topic, previous_question, student_response } = req.body;
        
        const response = await axios.post(`${AI_ENDPOINT}/v1/discussion/followup`, {
            topic,
            previous_question,
            student_response
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────
// ENHANCED SEARCH
// ─────────────────────────────────────────────────────────────

router.post('/search/enhanced', async (req, res) => {
    try {
        const { query, student_id, use_expansion, use_multi_hop, filters } = req.body;
        
        const response = await axios.post(`${AI_ENDPOINT}/v1/search/enhanced`, {
            query,
            student_id,
            use_expansion,
            use_multi_hop,
            filters
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

### 2.2 New MongoDB Models

```javascript
// models/QuizSession.js

const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    id: String,
    text: String,
    type: String, // 'MCQ', 'TRUE_FALSE', 'SHORT_ANSWER'
    options: [String],
    correct_answer: String,
    explanation: String,
    difficulty: String,
    bloom_level: String,
    answered: { type: Boolean, default: false },
    correct: Boolean,
    response_time: Number
});

const QuizSessionSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    topic: String,
    subject_id: String,
    chapter_id: String,
    questions: [QuestionSchema],
    current_index: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    started_at: Date,
    completed_at: Date,
    total_time_seconds: Number
});

module.exports = mongoose.model('QuizSession', QuizSessionSchema);


// models/StudentProgress.js

const mongoose = require('mongoose');

const ConceptMasterySchema = new mongoose.Schema({
    concept: String,
    mastery: { type: Number, default: 0 }, // 0.0 to 1.0
    questions_attempted: { type: Number, default: 0 },
    questions_correct: { type: Number, default: 0 },
    avg_response_time: { type: Number, default: 0 },
    last_practiced: Date,
    preferred_difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' }
});

const StudentProgressSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subject_id: String,
    concept_mastery: [ConceptMasterySchema],
    total_practice_time: { type: Number, default: 0 },
    total_quizzes_taken: { type: Number, default: 0 },
    average_score: { type: Number, default: 0 },
    current_streak: { type: Number, default: 0 }, // days
    longest_streak: { type: Number, default: 0 },
    last_active: Date,
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudentProgress', StudentProgressSchema);


// models/LearningPath.js

const mongoose = require('mongoose');

const PathStepSchema = new mongoose.Schema({
    order: Number,
    concept_id: String,
    concept_name: String,
    difficulty: String,
    estimated_minutes: Number,
    status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
    started_at: Date,
    completed_at: Date
});

const LearningPathSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    target_concept: String,
    steps: [PathStepSchema],
    total_estimated_minutes: Number,
    progress_percentage: { type: Number, default: 0 },
    created_at: Date,
    last_accessed: Date,
    status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' }
});

module.exports = mongoose.model('LearningPath', LearningPathSchema);
```

### 2.3 Updated Routes Index

```javascript
// routes/index.js

const aiFeaturesRouter = require('./aiFeatures');
// const quizRouter = require('./quiz'); // existing

router.use('/ai', aiFeaturesRouter);

module.exports = router;
```

---

## Part 3: Frontend (React) Changes

### 3.1 New Components to Create

```
src/
├── components/
│   └── ai-features/
│       ├── LearningPath/
│       │   ├── LearningPathCard.jsx
│       │   ├── PathProgress.jsx
│       │   └── ConceptNode.jsx
│       ├── Quiz/
│       │   ├── AdaptiveQuiz.jsx
│       │   ├── QuestionCard.jsx
│       │   ├── QuizProgress.jsx
│       │   └── QuizResults.jsx
│       ├── Discussion/
│       │   ├── DiscussionGuide.jsx
│       │   ├── SocraticQuestion.jsx
│       │   └── ResponseInput.jsx
│       └── Search/
│           ├── EnhancedSearch.jsx
│           ├── ReasoningChain.jsx
│           └── RelatedConcepts.jsx
```

### 3.2 Component Examples

```jsx
// components/ai-features/Quiz/AdaptiveQuiz.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuestionCard from './QuestionCard';
import QuizProgress from './QuizProgress';
import QuizResults from './QuizResults';

const API_URL = import.meta.env.VITE_API_URL;

export default function AdaptiveQuiz({ topic, studentId, onComplete }) {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [startTime, setStartTime] = useState(null);
    const [results, setResults] = useState(null);

    useEffect(() => {
        generateQuiz();
    }, [topic, studentId]);

    const generateQuiz = async () => {
        try {
            const response = await axios.post(`${API_URL}/ai/practice/generate`, {
                topic,
                student_id: studentId,
                question_count: 10
            });
            setQuestions(response.data.questions);
            setStartTime(Date.now());
            setLoading(false);
        } catch (error) {
            console.error('Failed to generate quiz:', error);
        }
    };

    const handleAnswer = async (answer, timeSpent) => {
        const question = questions[currentIndex];
        
        // Submit answer to update mastery
        await axios.post(`${API_URL}/ai/practice/submit`, {
            student_id: studentId,
            concept: topic,
            correct: answer === question.correct_answer,
            response_time_seconds: timeSpent,
            question_id: question.id
        });

        // Move to next question
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            // Quiz complete
            setResults({
                score: questions.filter((q, i) => 
                    // calculate score
                ).length,
                total: questions.length,
                timeSpent: Date.now() - startTime
            });
            onComplete?.(results);
        }
    };

    if (loading) return &lt;div className="loading">Generating quiz...</div>;
    if (results) return <QuizResults results={results} />;

    return (
        &lt;div className="adaptive-quiz">
            <QuizProgress 
                current={currentIndex + 1} 
                total={questions.length} 
            />
            <QuestionCard 
                question={questions[currentIndex]}
                onAnswer={handleAnswer}
            />
        </div>
    );
}


// components/ai-features/LearningPath/LearningPathCard.jsx

import React from 'react';
import { ChevronRight, CheckCircle, PlayCircle } from 'lucide-react';

export default function LearningPathCard({ path, onSelectConcept }) {
    const completedSteps = path.concepts.filter(c => c.status === 'completed').length;
    const progress = (completedSteps / path.concepts.length) * 100;

    return (
        &lt;div className="learning-path-card">
            &lt;h3>Learning Path: {path.target_concept}</h3>
            &lt;div className="progress-bar">
                &lt;div className="progress" style={{ width: `${progress}%` }} />
            </div>
            <p>{completedSteps} of {path.concepts.length} completed</p>
            <p>Estimated time: {path.estimated_time_minutes} minutes</p>

            &lt;div className="path-steps">
                {path.concepts.map((concept, index) => (
                    &lt;div 
                        key={concept.id}
                        className={`concept-node ${concept.status}`}
                        onClick={() => onSelectConcept(concept)}
                    >
                        &lt;div className="node-indicator">
                            {concept.status === 'completed' ? (
                                <CheckCircle className="text-green-500" />
                            ) : (
                                &lt;span>{index + 1}</span>
                            )}
                        </div>
                        &lt;div className="node-content">
                            &lt;h4>{concept.name}</h4>
                            &lt;span className="difficulty">{concept.difficulty}</span>
                        </div>
                        <ChevronRight />
                    </div>
                ))}
            </div>
        </div>
    );
}


// components/ai-features/Discussion/DiscussionGuide.jsx

import React, { useState } from 'react';
import SocraticQuestion from './SocraticQuestion';
import ResponseInput from './ResponseInput';

export default function DiscussionGuide({ topic, initialGuide }) {
    const [currentSection, setCurrentSection] = useState('opening');
    const [responses, setResponses] = useState({});

    const sections = [
        { key: 'opening', title: 'Warm Up', icon: '🔥' },
        { key: 'exploration', title: 'Deep Dive', icon: '🔍' },
        { key: 'synthesis', title: 'Reflection', icon: '💭' }
    ];

    const handleResponse = (question, response) => {
        setResponses(prev => ({
            ...prev,
            [question]: response
        }));
    };

    return (
        &lt;div className="discussion-guide">
            &lt;div className="section-tabs">
                {sections.map(section => (
                    &lt;button
                        key={section.key}
                        className={currentSection === section.key ? 'active' : ''}
                        onClick={() => setCurrentSection(section.key)}
                    >
                        &lt;span>{section.icon}</span>
                        {section.title}
                    </button>
                ))}
            </div>

            &lt;div className="questions-list">
                {initialGuide[currentSection]?.questions.map((q, i) => (
                    &lt;div key={i} className="question-item">
                        <SocraticQuestion question={q} />
                        <ResponseInput 
                            onSubmit={(response) => handleResponse(q, response)}
                            placeholder="Share your thoughts..."
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}


// components/ai-features/Search/EnhancedSearch.jsx

import React, { useState } from 'react';
import ReasoningChain from './ReasoningChain';

export default function EnhancedSearch({ initialQuery, filters }) {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showReasoning, setShowReasoning] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/api/ai/search/enhanced', {
                query,
                filters,
                use_expansion: true,
                use_multi_hop: true
            });
            setResults(response.data);
        } finally {
            setLoading(false);
        }
    };

    return (
        &lt;div className="enhanced-search">
            &lt;div className="search-input">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a complex question..."
                />
                &lt;button onClick={handleSearch} disabled={loading}>
                    {loading ? 'Thinking...' : 'Ask'}
                </button>
            </div>

            {results && (
                <>
                    &lt;div className="answer-section">
                        &lt;h3>Answer</h3>
                        <p>{results.answer}</p>
                        &lt;div className="confidence">
                            Confidence: {Math.round(results.confidence * 100)}%
                        </div>
                    </div>

                    {results.reasoning_chain && results.reasoning_chain.length > 0 && (
                        &lt;button onClick={() => setShowReasoning(!showReasoning)}>
                            {showReasoning ? 'Hide' : 'Show'} Reasoning Chain
                        </button>
                    )}

                    {showReasoning && (
                        <ReasoningChain chain={results.reasoning_chain} />
                    )}

                    &lt;div className="sources">
                        &lt;h4>Sources</h4>
                        {results.sources?.slice(0, 3).map((source, i) => (
                            &lt;div key={i} className="source-card">
                                <p>{source.text?.substring(0, 100)}...</p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
```

### 3.3 Pages to Create/Update

```jsx
// pages/QuizPage.jsx

import React from 'react';
import AdaptiveQuiz from '../components/ai-features/Quiz/AdaptiveQuiz';
import QuizResults from '../components/ai-features/Quiz/QuizResults';

export default function QuizPage() {
    const { topic, studentId } = useParams();
    
    return (
        &lt;div className="quiz-page">
            <h1>Practice: {topic}</h1>
            <AdaptiveQuiz 
                topic={topic} 
                studentId={studentId}
                onComplete={(results) => {
                    // Show results + recommendations
                }}
            />
        </div>
    );
}


// pages/LearningPathPage.jsx

import React, { useEffect, useState } from 'react';
import LearningPathCard from '../components/ai-features/LearningPath/LearningPathCard';
import axios from 'axios';

export default function LearningPathPage({ concept, studentId }) {
    const [path, setPath] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.post('/api/ai/learning-path', {
            target_concept: concept,
            student_id: studentId
        }).then(res => {
            setPath(res.data);
            setLoading(false);
        });
    }, [concept, studentId]);

    if (loading) return <Loading />;

    return (
        &lt;div className="learning-path-page">
            <h1>Your Path to {concept}</h1>
            <LearningPathCard 
                path={path}
                onSelectConcept={(c) => {
                    // Navigate to concept content
                }}
            />
        </div>
    );
}


// pages/DiscussionPage.jsx

import React, { useState } from 'react';
import DiscussionGuide from '../components/ai-features/Discussion/DiscussionGuide';
import axios from 'axios';

export default function DiscussionPage({ topic }) {
    const [guide, setGuide] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.post('/api/ai/discussion/generate', {
            topic,
            difficulty: 'intermediate'
        }).then(res => {
            setGuide(res.data);
            setLoading(false);
        });
    }, [topic]);

    if (loading) return <Loading />;

    return (
        &lt;div className="discussion-page">
            <h1>Discussion: {topic}</h1>
            <p className="objective">
                {guide.exploration.objective}
            </p>
            <DiscussionGuide topic={topic} initialGuide={guide} />
        </div>
    );
}
```

### 3.4 Navigation Updates

```jsx
// App.jsx or navigation component

<Routes>
    {/* Existing */}
    <Route path="/subjects" element={<SubjectsPage />} />
    <Route path="/chapters/:id" element={<ChapterPage />} />
    
    {/* New AI Feature Pages */}
    <Route path="/quiz/:topic" element={<QuizPage />} />
    <Route path="/learning-path/:concept" element={<LearningPathPage />} />
    <Route path="/discussion/:topic" element={<DiscussionPage />} />
</Routes>
```

---

## Part 4: Data Flow Examples

### 4.1 Student Takes Quiz Flow

```
Frontend                    Backend                     AI Service
   │                           │                           │
   │─POST /ai/practice/generate                        │
   │  {topic, student_id}      │                           │
   │──────────────────────────>│                           │
   │                           │─POST /v1/practice/generate │
   │                           │──────────────────────────>│
   │                           │                           │
   │                           │    {questions: [...]}      │
   │                           │<──────────────────────────│
   │    {questions: [...]}     │                           │
   │<─────────────────────────│                           │
   │                           │                           │
   │        [Student answers question]                    │
   │                           │                           │
   │─POST /ai/practice/submit                            │
   │  {correct, time, ...}   │                           │
   │──────────────────────────>│                           │
   │                           │─POST /v1/practice/submit   │
   │                           │──────────────────────────>│
   │                           │                           │
   │                           │    {mastery: 0.65, ...}   │
   │                           │<──────────────────────────│
   │    {updated mastery}      │                           │
   │<─────────────────────────│                           │
```

### 4.2 Learning Path Generation Flow

```
Frontend                    Backend                     AI Service
   │                           │                           │
   │─POST /ai/learning-path                              │
   │  {concept, student_id}  │                           │
   │─────────────────────────>│                          │
   │                           │─Get student known concepts│
   │                           │  from MongoDB             │
   │                           │─POST /v1/learning-path   │
   │                           │──────────────────────────>│
   │                           │                           │
   │                           │  {concepts: [...]}       │
   │                           │<──────────────────────────│
   │  {learning path}         │                           │
   │<─────────────────────────│                           │
   │                           │─Save to MongoDB           │
   │                           │                           │
```

---

## Part 5: Implementation Timeline

### Phase 1: Core Infrastructure (Week 1)
- [ ] Backend: Add AI routes
- [ ] Backend: Add MongoDB models (QuizSession, StudentProgress)
- [ ] AI Service: Add endpoints
- [ ] Basic integration test

### Phase 2: Quiz Feature (Week 2)
- [ ] Frontend: Quiz components
- [ ] Frontend: Quiz page
- [ ] Backend: Connect quiz routes
- [ ] Test full flow

### Phase 3: Learning Paths (Week 3)
- [ ] Frontend: Learning path components
- [ ] AI Service: Concept extraction
- [ ] Backend: Learning path routes
- [ ] Test prerequisite logic

### Phase 4: Discussion (Week 4)
- [ ] Frontend: Discussion components
- [ ] AI Service: Socratic endpoints
- [ ] Test follow-up flow

### Phase 5: Enhanced Search (Week 5)
- [ ] Frontend: Enhanced search UI
- [ ] Reasoning chain display
- [ ] Performance optimization

---

## Summary: What Each Team Does

| Component | Backend | Frontend | AI Service |
|----------|---------|----------|------------|
| Quiz | Routes + Models | Quiz UI + Progress | Generate + Track |
| Learning Path | Routes + Store | Path visualization | Calculate path |
| Discussion | Routes | Guide UI + Follow-up | Generate questions |
| Enhanced Search | Proxy routes | Search UI + Reasoning | Expand + Reason |

---

## Cost Estimate (Optional)

| Resource | Usage | Cost |
|----------|-------|------|
| LLM API calls | ~100/day/student | $0.01-0.10/student |
| Embeddings | Cached | ~$0.01/student |
| Compute | Minimal | Included |

For 1000 students: ~$10-100/month for AI features

---

## Questions to Decide

1. **Which features first?** (Quiz vs Learning Path vs Discussion)
2. **Quiz per chapter or per subject?**
3. **Track mastery per concept or per chapter?**
4. **Require login for personalized features?**
5. **Free tier limits?** (e.g., 10 questions/day free)

---

Is this comprehensive enough? Should I dive deeper into any specific area?
