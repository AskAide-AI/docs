# AI Features Integration Plan (Based on Existing Codebase)

> **⚠️ NOTE — Some Features Are Internal Python APIs Only**
> This document describes current and proposed integrations. The AI orchestration features (enhanced search, learning paths, adaptive practice, socratic discussion) are implemented as `services/ai/` Python modules but require new HTTP endpoints in `main.py` to be accessible from Backend. This document covers both what exists and what's planned.

## Current Architecture

```
FRONTEND (React)          BACKEND (Express)              AI SERVICE (FastAPI)
     │                           │                              │
     ├── study.api.js ───────> ├── routes/v1/ ─────────────> │ /upload-document
     ├── quiz.api.js ───────> │ /routes/quiz ────────────> │ /generate-questions
     ├── topicProgress ─────> │ /routes/progress ────────> │ /ai-insights/*
     │                           │                              │
     │                     content.service.js                  │
     │                     topicProgress.controller.js         │
```

---

## Part 1: AI Service Changes (This Repo)

### New Endpoints to Add in `main.py`

Based on existing patterns (`/ai-insights/chapter`, `/ai-insights/subject`):

```python
# Add these after existing AI endpoints (around line 330 in main.py)

# ─────────────────────────────────────────────────────────────
# AI ENHANCED FEATURES ENDPOINTS
# ─────────────────────────────────────────────────────────────

from services.ai import get_ai_orchestrator

orchestrator = get_ai_orchestrator()


@app.post("/v1/learning-path")
async def get_learning_path(
    target_concept: str,
    student_id: str,
    known_concepts: Optional[List[str]] = None
):
    """
    Get optimal learning path for a concept.
    Matches existing pattern: /ai-insights/chapter
    """
    try:
        path = orchestrator.get_learning_path(
            target_concept=target_concept,
            student_id=student_id,
            known_concepts=known_concepts
        )
        return {"success": True, "data": path}
    except Exception as e:
        logger.exception(f"Learning path failed: {e}")
        return {"success": False, "error": str(e)}, 500


@app.post("/v1/practice/generate")
async def generate_practice(
    topic: str,
    student_id: str,
    question_count: int = 10
):
    """
    Generate adaptive practice questions.
    Uses same pattern as /generate-questions
    """
    try:
        practice = orchestrator.generate_practice(
            topic=topic,
            student_id=student_id,
            question_count=question_count
        )
        return {"success": True, "data": practice}
    except Exception as e:
        logger.exception(f"Practice generation failed: {e}")
        return {"success": False, "error": str(e)}, 500


@app.post("/v1/practice/submit")
async def submit_practice_answer(
    student_id: str,
    concept: str,
    correct: bool,
    response_time_seconds: float,
    question_id: str
):
    """
    Submit answer to update mastery tracking.
    """
    try:
        from services.ai import AdaptiveQuestionGenerator
        gen = AdaptiveQuestionGenerator()
        gen.update_mastery(student_id, concept, correct, response_time_seconds)
        
        recommendations = gen.generate_practice_recommendations(student_id)
        
        return {
            "success": True,
            "data": {
                "mastery_updated": True,
                "recommendations": recommendations
            }
        }
    except Exception as e:
        logger.exception(f"Submit answer failed: {e}")
        return {"success": False, "error": str(e)}, 500


@app.get("/v1/practice/recommendations/{student_id}")
async def get_practice_recommendations(student_id: str):
    """
    Get personalized practice recommendations.
    """
    try:
        recs = orchestrator.get_practice_recommendations(student_id)
        return {"success": True, "data": recs}
    except Exception as e:
        logger.exception(f"Recommendations failed: {e}")
        return {"success": False, "error": str(e)}, 500


@app.post("/v1/discussion/generate")
async def generate_discussion(
    topic: str,
    context: Optional[str] = None,
    difficulty: str = "intermediate"
):
    """
    Generate Socratic discussion guide.
    """
    try:
        discussion = orchestrator.discuss_topic(
            topic=topic,
            context=context,
            difficulty=difficulty
        )
        return {"success": True, "data": discussion}
    except Exception as e:
        logger.exception(f"Discussion generation failed: {e}")
        return {"success": False, "error": str(e)}, 500


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
        from services.ai import SocraticQuestionGenerator
        socratic = SocraticQuestionGenerator()
        followup = socratic.generate_follow_up(
            topic=topic,
            previous_question=previous_question,
            student_response=student_response
        )
        return {"success": True, "data": {"followup": followup}}
    except Exception as e:
        logger.exception(f"Followup generation failed: {e}")
        return {"success": False, "error": str(e)}, 500


@app.post("/v1/search/enhanced")
async def enhanced_search(
    query: str,
    student_id: Optional[str] = None,
    filters: Optional[Dict[str, Any]] = None
):
    """
    Enhanced search with query expansion and multi-hop reasoning.
    Replaces basic search for complex queries.
    """
    try:
        result = orchestrator.enhanced_search(
            query=query,
            student_id=student_id,
            filters=filters
        )
        return {"success": True, "data": result}
    except Exception as e:
        logger.exception(f"Enhanced search failed: {e}")
        return {"success": False, "error": str(e)}, 500
```

### Environment Variables to Add

```bash
# .env additions
AI_ENDPOINT=http://localhost:8000
AI_QUESTION_REQ_URL=http://localhost:8000/generate-questions

# Feature flags
ENABLE_LEARNING_PATHS=true
ENABLE_ADAPTIVE_QUESTIONS=true
ENABLE_SOCRATIC=true
```

---

## Part 2: Backend (Express) Changes

### File: `src/modules/progress/routes/topicProgress.routes.js`

Add these routes (following existing pattern):

```javascript
// src/modules/progress/routes/topicProgress.routes.js

// Add after existing AI insight routes...

/**
 * @swagger
 * /api/v1/topic-progress/learning-path:
 *   post:
 *     summary: Get learning path for a concept
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               target_concept:
 *                 type: string
 *               student_id:
 *                 type: string
 *               known_concepts:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Learning path data
 */
router.post('/learning-path', auth, topicProgressController.getLearningPath);

/**
 * @swagger
 * /api/v1/topic-progress/practice/generate:
 *   post:
 *     summary: Generate adaptive practice questions
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *               student_id:
 *                 type: string
 *               question_count:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Practice questions
 */
router.post('/practice/generate', auth, topicProgressController.generatePractice);

/**
 * @swagger
 * /api/v1/topic-progress/practice/submit:
 *   post:
 *     summary: Submit practice answer
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               student_id:
 *                 type: string
 *               concept:
 *                 type: string
 *               correct:
 *                 type: boolean
 *               response_time_seconds:
 *                 type: number
 *               question_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mastery updated
 */
router.post('/practice/submit', auth, topicProgressController.submitPracticeAnswer);

/**
 * @swagger
 * /api/v1/topic-progress/practice/recommendations/:student_id:
 *   get:
 *     summary: Get practice recommendations
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: student_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recommendations
 */
router.get('/practice/recommendations/:student_id', auth, topicProgressController.getRecommendations);

/**
 * @swagger
 * /api/v1/topic-progress/discussion/generate:
 *   post:
 *     summary: Generate Socratic discussion
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *               context:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *     responses:
 *       200:
 *         description: Discussion guide
 */
router.post('/discussion/generate', auth, topicProgressController.generateDiscussion);

/**
 * @swagger
 * /api/v1/topic-progress/search/enhanced:
 *   post:
 *     summary: Enhanced search with AI
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *               student_id:
 *                 type: string
 *               filters:
 *                 type: object
 *     responses:
 *       200:
 *         description: Enhanced search results
 */
router.post('/search/enhanced', auth, topicProgressController.enhancedSearch);
```

### File: `src/modules/progress/controllers/topicProgress.controller.js`

Add these controllers (following existing pattern):

```javascript
// src/modules/progress/controllers/topicProgress.controller.js

// Add after existing getSubjectAiInsights controller...

export const getLearningPath = asyncHandler(async (req, res) => {
    const { target_concept, student_id, known_concepts } = req.body;

    if (!target_concept || !student_id) {
        return sendError(res, 'Target concept and student ID are required', 400);
    }

    try {
        const aiResponse = await fetch(`${process.env.AI_ENDPOINT}/v1/learning-path`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                target_concept,
                student_id,
                known_concepts: known_concepts || []
            })
        });

        if (!aiResponse.ok) {
            throw new Error(`AI Service returned ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        return sendSuccess(res, null, aiData);
    } catch (error) {
        console.error('Learning path error:', error);
        return sendError(res, 'Failed to generate learning path', 500);
    }
});

export const generatePractice = asyncHandler(async (req, res) => {
    const { topic, student_id, question_count } = req.body;

    if (!topic || !student_id) {
        return sendError(res, 'Topic and student ID are required', 400);
    }

    try {
        const aiResponse = await fetch(`${process.env.AI_ENDPOINT}/v1/practice/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic,
                student_id,
                question_count: question_count || 10
            })
        });

        if (!aiResponse.ok) {
            throw new Error(`AI Service returned ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        return sendSuccess(res, null, aiData);
    } catch (error) {
        console.error('Practice generation error:', error);
        return sendError(res, 'Failed to generate practice', 500);
    }
});

export const submitPracticeAnswer = asyncHandler(async (req, res) => {
    const { student_id, concept, correct, response_time_seconds, question_id } = req.body;

    if (!student_id || !concept || correct === undefined) {
        return sendError(res, 'Missing required fields', 400);
    }

    try {
        const aiResponse = await fetch(`${process.env.AI_ENDPOINT}/v1/practice/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id,
                concept,
                correct,
                response_time_seconds: response_time_seconds || 0,
                question_id: question_id || ''
            })
        });

        if (!aiResponse.ok) {
            throw new Error(`AI Service returned ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        
        // Also save to MongoDB for persistence
        await updateStudentMastery(student_id, concept, correct, response_time_seconds);
        
        return sendSuccess(res, null, aiData);
    } catch (error) {
        console.error('Submit answer error:', error);
        return sendError(res, 'Failed to submit answer', 500);
    }
});

export const getRecommendations = asyncHandler(async (req, res) => {
    const { student_id } = req.params;

    if (!student_id) {
        return sendError(res, 'Student ID is required', 400);
    }

    try {
        const aiResponse = await fetch(
            `${process.env.AI_ENDPOINT}/v1/practice/recommendations/${student_id}`
        );

        if (!aiResponse.ok) {
            throw new Error(`AI Service returned ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        return sendSuccess(res, null, aiData);
    } catch (error) {
        console.error('Recommendations error:', error);
        return sendError(res, 'Failed to get recommendations', 500);
    }
});

export const generateDiscussion = asyncHandler(async (req, res) => {
    const { topic, context, difficulty } = req.body;

    if (!topic) {
        return sendError(res, 'Topic is required', 400);
    }

    try {
        const aiResponse = await fetch(`${process.env.AI_ENDPOINT}/v1/discussion/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic,
                context: context || null,
                difficulty: difficulty || 'intermediate'
            })
        });

        if (!aiResponse.ok) {
            throw new Error(`AI Service returned ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        return sendSuccess(res, null, aiData);
    } catch (error) {
        console.error('Discussion generation error:', error);
        return sendError(res, 'Failed to generate discussion', 500);
    }
});

export const enhancedSearch = asyncHandler(async (req, res) => {
    const { query, student_id, filters } = req.body;

    if (!query) {
        return sendError(res, 'Query is required', 400);
    }

    try {
        const aiResponse = await fetch(`${process.env.AI_ENDPOINT}/v1/search/enhanced`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                student_id: student_id || null,
                filters: filters || null
            })
        });

        if (!aiResponse.ok) {
            throw new Error(`AI Service returned ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        return sendSuccess(res, null, aiData);
    } catch (error) {
        console.error('Enhanced search error:', error);
        return sendError(res, 'Failed to perform search', 500);
    }
});

// Helper function to persist mastery to MongoDB
async function updateStudentMastery(studentId, concept, correct, responseTime) {
    // Implementation depends on existing StudentProgress model
    // This updates the local MongoDB for persistence
    await StudentProgress.findOneAndUpdate(
        { student_id: studentId },
        {
            $set: {
                [`concept_mastery.${concept}`]: correct ? 1 : 0, // Simplified
                last_updated: new Date()
            }
        },
        { upsert: true }
    );
}
```

### File: `src/modules/progress/index.js`

Update exports:

```javascript
// src/modules/progress/index.js

export * from './controllers/topicProgress.controller.js';
// ... existing exports
```

### File: `src/modules/progress/routes/index.js`

Add new routes:

```javascript
// src/modules/progress/routes/index.js

import express from 'express';
import * as topicProgressController from '../controllers/topicProgress.controller.js';
import { auth } from '../../../shared/middleware/index.js';

const router = express.Router();

// ... existing routes ...

router.post('/learning-path', auth, topicProgressController.getLearningPath);
router.post('/practice/generate', auth, topicProgressController.generatePractice);
router.post('/practice/submit', auth, topicProgressController.submitPracticeAnswer);
router.get('/practice/recommendations/:student_id', auth, topicProgressController.getRecommendations);
router.post('/discussion/generate', auth, topicProgressController.generateDiscussion);
router.post('/search/enhanced', auth, topicProgressController.enhancedSearch);

export default router;
```

---

## Part 3: Frontend (React) Changes

### File: `src/api/study.api.js`

Add new API functions (following existing pattern):

```javascript
// src/api/study.api.js

// Add these functions after existing ones (around line 450)...

// ==================== AI ENHANCED FEATURES ====================

/**
 * Get learning path for a concept
 * @param {string} targetConcept - Target concept to learn
 * @param {string} studentId - Student ID
 * @param {string[]} knownConcepts - Already known concepts
 * @returns {Promise} Learning path data
 */
fetchLearningPath: async (targetConcept, studentId, knownConcepts = []) => {
    try {
        const response = await api.post('/topic-progress/learning-path', {
            target_concept: targetConcept,
            student_id: studentId,
            known_concepts: knownConcepts
        });
        if (response.data && response.data.success) {
            return response.data.data;
        }
        throw new Error('Invalid response');
    } catch (err) {
        console.error('Fetch learning path error:', err);
        throw err;
    }
},

/**
 * Generate adaptive practice questions
 * @param {string} topic - Topic for practice
 * @param {string} studentId - Student ID
 * @param {number} questionCount - Number of questions
 * @returns {Promise} Practice questions
 */
generatePractice: async (topic, studentId, questionCount = 10) => {
    try {
        const response = await api.post('/topic-progress/practice/generate', {
            topic,
            student_id: studentId,
            question_count: questionCount
        });
        if (response.data && response.data.success) {
            return response.data.data;
        }
        throw new Error('Invalid response');
    } catch (err) {
        console.error('Generate practice error:', err);
        throw err;
    }
},

/**
 * Submit practice answer
 * @param {Object} data - Answer data
 * @returns {Promise} Updated mastery
 */
submitPracticeAnswer: async (data) => {
    try {
        const response = await api.post('/topic-progress/practice/submit', data);
        if (response.data && response.data.success) {
            return response.data.data;
        }
        throw new Error('Invalid response');
    } catch (err) {
        console.error('Submit practice answer error:', err);
        throw err;
    }
},

/**
 * Get practice recommendations
 * @param {string} studentId - Student ID
 * @returns {Promise} Recommendations
 */
fetchPracticeRecommendations: async (studentId) => {
    try {
        const response = await api.get(`/topic-progress/practice/recommendations/${studentId}`);
        if (response.data && response.data.success) {
            return response.data.data;
        }
        throw new Error('Invalid response');
    } catch (err) {
        console.error('Fetch recommendations error:', err);
        throw err;
    }
},

/**
 * Generate Socratic discussion
 * @param {string} topic - Discussion topic
 * @param {string} context - Optional context
 * @param {string} difficulty - Difficulty level
 * @returns {Promise} Discussion guide
 */
generateDiscussion: async (topic, context = null, difficulty = 'intermediate') => {
    try {
        const response = await api.post('/topic-progress/discussion/generate', {
            topic,
            context,
            difficulty
        });
        if (response.data && response.data.success) {
            return response.data.data;
        }
        throw new Error('Invalid response');
    } catch (err) {
        console.error('Generate discussion error:', err);
        throw err;
    }
},

/**
 * Enhanced search with AI
 * @param {string} query - Search query
 * @param {string} studentId - Student ID (optional)
 * @param {Object} filters - Search filters (optional)
 * @returns {Promise} Enhanced search results
 */
enhancedSearch: async (query, studentId = null, filters = null) => {
    try {
        const response = await api.post('/topic-progress/search/enhanced', {
            query,
            student_id: studentId,
            filters
        });
        if (response.data && response.data.success) {
            return response.data.data;
        }
        throw new Error('Invalid response');
    } catch (err) {
        console.error('Enhanced search error:', err);
        throw err;
    }
},
```

### New Components to Create

#### File: `src/components/study/AdaptiveQuiz.jsx`

```jsx
// src/components/study/AdaptiveQuiz.jsx

import React, { useState, useEffect } from 'react';
import { studyApi } from '../../api/study.api';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

export default function AdaptiveQuiz({ topic, studentId, onComplete }) {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [startTime, setStartTime] = useState(null);

    useEffect(() => {
        loadQuiz();
    }, [topic, studentId]);

    const loadQuiz = async () => {
        try {
            setLoading(true);
            const data = await studyApi.generatePractice(topic, studentId);
            setQuestions(data.questions || []);
            setStartTime(Date.now());
        } catch (error) {
            console.error('Failed to load quiz:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (answer) => {
        setSelectedAnswer(answer);
        setShowResult(true);

        const timeSpent = (Date.now() - startTime) / 1000;
        const currentQuestion = questions[currentIndex];
        const isCorrect = answer === currentQuestion.correct_answer;

        // Submit to update mastery
        try {
            await studyApi.submitPracticeAnswer({
                student_id: studentId,
                concept: topic,
                correct: isCorrect,
                response_time_seconds: timeSpent,
                question_id: currentQuestion.id
            });
        } catch (error) {
            console.error('Failed to submit answer:', error);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedAnswer(null);
            setShowResult(false);
            setStartTime(Date.now());
        } else {
            onComplete?.(questions);
        }
    };

    if (loading) {
        return (
            &lt;div className="flex items-center justify-center p-8">
                &lt;div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                &lt;span className="ml-4">Generating questions...</span>
            </div>
        );
    }

    if (questions.length === 0) {
        return &lt;div className="p-4 text-center">No questions available</div>;
    }

    const currentQuestion = questions[currentIndex];

    return (
        &lt;div className="max-w-2xl mx-auto p-4">
            {/* Progress */}
            &lt;div className="mb-6">
                &lt;div className="flex justify-between text-sm text-gray-600 mb-2">
                    &lt;span>Question {currentIndex + 1} of {questions.length}</span>
                    &lt;span>{topic}</span>
                </div>
                &lt;div className="w-full bg-gray-200 rounded-full h-2">
                    &lt;div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            &lt;div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                &lt;h3 className="text-lg font-medium mb-4">{currentQuestion.text}</h3>

                {currentQuestion.options && (
                    &lt;div className="space-y-3">
                        {currentQuestion.options.map((option, idx) => {
                            let optionClass = 'border-gray-200 hover:border-blue-500';
                            
                            if (showResult) {
                                if (option === currentQuestion.correct_answer) {
                                    optionClass = 'border-green-500 bg-green-50';
                                } else if (option === selectedAnswer && option !== currentQuestion.correct_answer) {
                                    optionClass = 'border-red-500 bg-red-50';
                                }
                            } else if (selectedAnswer === option) {
                                optionClass = 'border-blue-500 bg-blue-50';
                            }

                            return (
                                &lt;button
                                    key={idx}
                                    onClick={() => !showResult && handleAnswer(option)}
                                    disabled={showResult}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${optionClass}`}
                                >
                                    &lt;span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {option}
                                    {showResult && option === currentQuestion.correct_answer && (
                                        <Check className="inline ml-2 text-green-600 w-5 h-5" />
                                    )}
                                    {showResult && option === selectedAnswer && option !== currentQuestion.correct_answer && (
                                        <X className="inline ml-2 text-red-600 w-5 h-5" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {showResult && currentQuestion.explanation && (
                    &lt;div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                            &lt;strong>Explanation:</strong> {currentQuestion.explanation}
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            {showResult && (
                &lt;button
                    onClick={handleNext}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                    {currentIndex < questions.length - 1 ? (
                        <>Next <ChevronRight className="ml-2 w-5 h-5" /></>
                    ) : (
                        <>Complete Quiz</>
                    )}
                </button>
            )}
        </div>
    );
}
```

#### File: `src/components/study/LearningPathCard.jsx`

```jsx
// src/components/study/LearningPathCard.jsx

import React from 'react';
import { ChevronRight, CheckCircle, PlayCircle, Clock } from 'lucide-react';

export default function LearningPathCard({ path, onSelectConcept, onStart }) {
    if (!path || !path.learning_path) {
        return &lt;div className="p-4">No learning path available</div>;
    }

    const completedCount = path.learning_path.filter(c => c.status === 'completed').length;
    const progress = (completedCount / path.learning_path.length) * 100;

    return (
        &lt;div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            &lt;div className="p-6 border-b">
                &lt;h3 className="text-xl font-bold mb-2">Learning Path: {path.target_concept || 'Untitled'}</h3>
                
                &lt;div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    &lt;span>{completedCount} of {path.learning_path.length} completed</span>
                    &lt;span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {path.estimated_time_minutes || 0} min
                    </span>
                </div>

                &lt;div className="w-full bg-gray-200 rounded-full h-2">
                    &lt;div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Path Steps */}
            &lt;div className="divide-y">
                {path.learning_path.map((concept, index) => (
                    &lt;div
                        key={concept.id || index}
                        className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                            concept.status === 'completed' ? 'bg-green-50' : ''
                        }`}
                        onClick={() => onSelectConcept?.(concept)}
                    >
                        &lt;div className="flex items-center space-x-4">
                            &lt;div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                concept.status === 'completed'
                                    ? 'bg-green-500 text-white'
                                    : concept.status === 'in_progress'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-600'
                            }`}>
                                {concept.status === 'completed' ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    &lt;span className="text-sm font-medium">{index + 1}</span>
                                )}
                            </div>
                            &lt;div>
                                &lt;h4 className="font-medium">{concept.name}</h4>
                                &lt;span className="text-xs text-gray-500 capitalize">{concept.difficulty}</span>
                            </div>
                        </div>

                        {concept.status !== 'completed' && (
                            <PlayCircle className="w-6 h-6 text-blue-500" />
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                ))}
            </div>

            {/* Action */}
            {onStart && (
                &lt;div className="p-4 bg-gray-50">
                    &lt;button
                        onClick={onStart}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Start Learning Path
                    </button>
                </div>
            )}
        </div>
    );
}
```

#### File: `src/components/study/DiscussionGuide.jsx`

```jsx
// src/components/study/DiscussionGuide.jsx

import React, { useState } from 'react';
import { ChevronRight, MessageCircle } from 'lucide-react';

export default function DiscussionGuide({ guide, onSubmitResponse }) {
    const [currentSection, setCurrentSection] = useState('opening');
    const [responses, setResponses] = useState({});
    const [activeQuestion, setActiveQuestion] = useState(null);

    if (!guide) {
        return &lt;div className="p-4">No discussion guide available</div>;
    }

    const sections = [
        { key: 'opening', title: 'Warm Up', icon: '🔥', questions: guide.opening?.questions || [] },
        { key: 'exploration', title: 'Deep Dive', icon: '🔍', questions: guide.exploration?.questions || [] },
        { key: 'synthesis', title: 'Reflection', icon: '💭', questions: guide.synthesis?.questions || [] }
    ];

    const currentQuestions = sections.find(s => s.key === currentSection)?.questions || [];

    const handleResponse = (question, response) => {
        setResponses(prev => ({ ...prev, [question]: response }));
        onSubmitResponse?.(question, response);
    };

    return (
        &lt;div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Section Tabs */}
            &lt;div className="flex border-b">
                {sections.map(section => (
                    &lt;button
                        key={section.key}
                        onClick={() => setCurrentSection(section.key)}
                        className={`flex-1 py-4 px-6 text-center transition-colors ${
                            currentSection === section.key
                                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        &lt;span className="mr-2">{section.icon}</span>
                        {section.title}
                    </button>
                ))}
            </div>

            {/* Section Content */}
            &lt;div className="p-6">
                &lt;div className="mb-6">
                    &lt;h3 className="text-lg font-medium mb-2">
                        {sections.find(s => s.key === currentSection)?.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {guide[currentSection]?.objective || 'Explore this topic deeply'}
                    </p>
                </div>

                &lt;div className="space-y-6">
                    {currentQuestions.map((question, index) => (
                        &lt;div key={index} className="border rounded-lg p-4">
                            &lt;div className="flex items-start space-x-3 mb-3">
                                &lt;div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                                    {index + 1}
                                </div>
                                <p className="text-lg font-medium flex-1">{question}</p>
                            </div>

                            {responses[question] ? (
                                &lt;div className="ml-11 p-3 bg-green-50 rounded-lg">
                                    <p className="text-green-800">{responses[question]}</p>
                                </div>
                            ) : (
                                <textarea
                                    className="ml-11 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    placeholder="Share your thoughts..."
                                    onBlur={(e) => handleResponse(question, e.target.value)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation */}
            &lt;div className="p-4 bg-gray-50 flex justify-between">
                &lt;button
                    onClick={() => {
                        const currentIdx = sections.findIndex(s => s.key === currentSection);
                        if (currentIdx > 0) setCurrentSection(sections[currentIdx - 1].key);
                    }}
                    disabled={currentSection === 'opening'}
                    className="px-4 py-2 text-gray-600 disabled:opacity-50"
                >
                    Previous
                </button>
                &lt;button
                    onClick={() => {
                        const currentIdx = sections.findIndex(s => s.key === currentSection);
                        if (currentIdx < sections.length - 1) setCurrentSection(sections[currentIdx + 1].key);
                    }}
                    disabled={currentSection === 'synthesis'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
```

### Integration Points in Existing Components

#### File: `src/components/study/QuestionPractice.jsx`

Add "Adaptive Practice" button after existing practice options:

```jsx
// Add after existing practice session buttons...

{/* AI Enhanced Features */}
&lt;div className="mt-4 pt-4 border-t">
    &lt;h4 className="text-sm font-medium text-gray-700 mb-2">AI Enhanced</h4>
    &lt;div className="grid grid-cols-2 gap-2">
        &lt;button
            onClick={() => startAdaptivePractice()}
            className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-left"
        >
            &lt;span className="block font-medium">Adaptive Quiz</span>
            &lt;span className="text-xs">Personalized to your level</span>
        </button>
        &lt;button
            onClick={() => startLearningPath()}
            className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-left"
        >
            &lt;span className="block font-medium">Learning Path</span>
            &lt;span className="text-xs">Follow optimal order</span>
        </button>
    </div>
</div>
```

#### File: `src/components/study/StudyConfig.jsx`

Add new study modes:

```jsx
// Add after existing difficulty selection...

&lt;div className="mb-4">
    &lt;label className="block text-sm font-medium text-gray-700 mb-2">
        Study Mode
    </label>
    &lt;div className="grid grid-cols-2 gap-2">
        &lt;button
            onClick={() => setStudyMode('practice')}
            className={`p-3 rounded-lg border-2 ${
                studyMode === 'practice' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
        >
            Standard Practice
        </button>
        &lt;button
            onClick={() => setStudyMode('adaptive')}
            className={`p-3 rounded-lg border-2 ${
                studyMode === 'adaptive' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
            }`}
        >
            Adaptive Quiz
        </button>
    </div>
</div>
```

---

## Part 4: Where Each Feature Appears in UI

### Student Dashboard
```
Student Dashboard
├── Quick Actions
│   ├── [New] Adaptive Quiz → Generates personalized questions
│   └── [New] Learning Path → Shows prerequisite chain
│
├── Continue Learning
│   └── [Enhanced] AI-powered recommendations
│
├── Study Sessions
│   └── [Existing] Study Config → [New] Add Adaptive Practice option
│
├── Discussion Board (NEW)
│   └── Socratic Questions per topic
```

### Topic/Chapter Page
```
Chapter Page
├── Topics List
│   └── [New] Learning Path button per topic
│
├── AI Insights (Existing)
│   └── [Enhanced] Enhanced search with reasoning chain
│
├── Practice (Existing)
│   └── [New] Adaptive Quiz option
│
└── [New] Discussion Guide button
```

---

## Part 5: Database Changes (MongoDB)

### New Collection: `student_mastery`

```javascript
// Backend: src/modules/progress/models/StudentMastery.js

import mongoose from 'mongoose';

const ConceptMasterySchema = new mongoose.Schema({
    concept_name: { type: String, required: true },
    mastery_score: { type: Number, default: 0, min: 0, max: 1 },
    questions_attempted: { type: Number, default: 0 },
    questions_correct: { type: Number, default: 0 },
    avg_response_time: { type: Number, default: 0 },
    last_practiced: { type: Date, default: Date.now },
    preferred_difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
    }
});

const StudentMasterySchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    concepts: [ConceptMasterySchema],
    updated_at: { type: Date, default: Date.now }
});

export default mongoose.model('StudentMastery', StudentMasterySchema);
```

---

## Summary: Files to Change

### AI Service (This Repo)
| File | Changes |
|------|---------|
| `main.py` | Add 7 new endpoints |
| `config.py` | Add feature flags |
| `.env.example` | Document new vars |

### Backend (Express)
| File | Changes |
|------|---------|
| `routes/topicProgress.routes.js` | Add 6 new routes |
| `controllers/topicProgress.controller.js` | Add 6 new controllers |
| `index.js` | Export new routes |
| `models/StudentMastery.js` | New model for mastery tracking |

### Frontend (React)
| File | Changes |
|------|---------|
| `api/study.api.js` | Add 6 new API functions |
| `components/study/AdaptiveQuiz.jsx` | New component |
| `components/study/LearningPathCard.jsx` | New component |
| `components/study/DiscussionGuide.jsx` | New component |
| `components/study/QuestionPractice.jsx` | Add AI feature buttons |
| `components/study/StudyConfig.jsx` | Add adaptive mode option |

---

## Decision Points

1. **Which feature first?**
   - Recommend: Adaptive Quiz (easiest integration, visible impact)
   
2. **Student mastery storage?**
   - AI Service (in-memory) + MongoDB (persistent) - Need to decide sync strategy

3. **Learning path data source?**
   - Extract from existing topics in MongoDB
   - Or generate on-demand from document content

4. **Free tier limits?**
   - Suggest: 10 adaptive questions/day free, unlimited for premium
