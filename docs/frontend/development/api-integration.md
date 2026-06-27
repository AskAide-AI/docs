# API Integration

> How the frontend connects to backend APIs.
> Last Updated: January 19, 2026

---

## Configuration

**Library:** Axios
**Version:** 1.6.x
**Base URL:** `import.meta.env.VITE_API_URL` or `https://askaideaibackend.onrender.com/api/v1`
**Location:** `/src/api/`

---

## API Client Setup

**File:** `/src/api/axios.js`

> Note: The older `src/services/` layer is legacy. All new API code should use `src/api/`.

**Available API modules:**
- `src/api/ai-assistant.api.js` — AI Assistant
- `src/api/admin.api.js` — Admin CRUD
- `src/api/teacher-dashboard.api.js` — Teacher Dashboard
- `src/api/parent.api.js` — Parent Dashboard
- `src/api/goal.api.js` — Daily Goals
- `src/api/referral.api.js` — Referral System
- `src/api/stats.api.js` — Public Stats
- `src/api/profile.api.js` — Profile Management

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  'https://askaideaibackend.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const tokenString = localStorage.getItem('token');
  if (tokenString) {
    try {
      const token = JSON.parse(tokenString);
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      config.headers.Authorization = `Bearer ${tokenString}`;
    }
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
      if (error.response.status === 401) {
        // Handle unauthorized (optional redirect)
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## API Endpoints

**File:** `/src/api/endpoints.js`

| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | `/authenticate/login` | User login |
| Auth | `/authenticate/signup` | User registration |
| Auth | `/authenticate/sendotp` | Send OTP for login |
| Auth | `/authenticate/verify-email` | Verify OTP and login |
| Auth | `/auth/changepassword` | Change password |
| Profile | `/profile/getUserDetails` | Get user profile |
| Profile | `/profile/updateProfile` | Update profile |
| Profile | `/profile/updateDisplayPicture` | Upload profile photo |
| Profile | `/profile/deleteProfilePhoto` | Remove profile photo |
| Content | `/study/configuration` | Get classes with subjects |
| Content | `/topics/class/:classId/subject/:subjectId` | Get topics for class/subject |
| Content | `/chapters/class/:classId/subject/:subjectId` | Get chapters for class/subject |
| Content | `/chapters/check-rag-status` | Check AI RAG status |
| Questions | `/questions/batch/chapter/:chapterId/type/:type/difficulty/:difficulty/session/:sessionId` | Get question batch |
| | | **Response `status` field:** `generating` — batch is being built by AI; `failed` — generation errored; `mastered` — all questions answered correctly |
| Sessions | `/sessions` | Create session |
| Sessions | `/sessions/:sessionId/end` | End session (PATCH) |
| Sessions | `/sessions/last-incomplete/:userId` | Get last incomplete session |
| Answers | `/user-answers/batch` | Submit answers batch |
| Progress | `/topic-progress/progress/:userId/subject/:subjectId` | Subject progress |
| Progress | `/topic-progress/progress/:userId/chapter/:chapterId` | Chapter progress |
| Progress | `/topic-progress/ai-insights/userid/:userId/chapter/:chapterId` | AI chapter insights |
| Progress | `/topic-progress/ai-insights/userid/:userId/subject/:subjectId` | AI subject insights |
| Quiz | `/quiz` | Create quiz |
| Quiz | `/quiz/:quizId` | Get/update/delete quiz |
| Quiz | `/quiz/teacher/:teacherId` | List teacher's quizzes |
| Quiz | `/quiz/:quizId/publish` | Publish quiz |
| Quiz | `/quiz/:quizId/close` | Close quiz |
| Quiz | `/quiz/:quizId/analytics` | Quiz analytics |
| Quiz | `/quiz/student/available` | Available quizzes (student) |
| Quiz | `/quiz/:quizId/start` | Start quiz attempt |
| Quiz | `/quiz/attempt/:attemptId/answer` | Submit answer |
| Quiz | `/quiz/attempt/:attemptId/submit` | Submit quiz |
| Quiz | `/quiz/attempt/:attemptId/result` | Get attempt result |
| Quiz | `/quiz/student/history` | Quiz history |
| Admin | `/schools` | School CRUD |
| Admin | `/teachers` | Teacher management |
| Admin | `/teachers/bulk` | Bulk teacher creation |
| Admin | `/students` | Student management |
| Admin | `/sections` | Section management |
| Admin | `/chapters/create-with-pdf` | Chapter PDF upload |
| Admin | `/chapters` | Chapter management |
| Teacher Dashboard | `/teacher-dashboard/:teacherId/my-assignments` | Get teacher assignments |
| Teacher Dashboard | `/teacher-dashboard/:teacherId/subject/:subjectId/dashboard` | Subject overview |
| Teacher Dashboard | `/teacher-dashboard/:teacherId/subject/:subjectId/students` | Students with progress |
| Teacher Dashboard | `/teacher-dashboard/:teacherId/subject/:subjectId/chapter/:chapterId/analytics` | Chapter analytics |
| Teacher Dashboard | `/teacher-dashboard/:teacherId/subject/:subjectId/weak-topics` | Weak topics report |
| Teacher Dashboard | `/teacher-dashboard/:teacherId/subject/:subjectId/activity` | Activity feed |
| Teacher Dashboard | `/teacher-dashboard/:teacherId/student/:studentId/subject/:subjectId/progress` | Individual student progress |
| Question Paper | `/question-paper` | Generate paper (Teacher) |
| Question Paper | `/question-paper/:paperId/preview` | Preview paper |
| Question Paper | `/question-paper/:paperId/pdf` | Download PDF |
| Question Paper | `/question-paper/:paperId` | Delete paper (DEL) |
| Question Paper | `/question-paper/public/generate` | Generate public paper (Lead magnet) |
| AI Assistant | `/ai-assistant` | Generate content |
| AI Assistant | `/ai-assistant/continue` | Follow-up clarification |
| AI Assistant | `/ai-assistant/conversations` | List conversations |
| AI Assistant | `/ai-assistant/conversations/:id/messages` | Get conversation messages |
| AI Assistant | `/ai-assistant/stream` | Streamed content |
| Parent Dashboard | `/parent-dashboard/children` | Get linked children |
| Parent Dashboard | `/parent-dashboard/child/:studentId/overview` | Child overview |
| Parent Dashboard | `/parent-students/links` | Parent-student links |
| Streaks | `/streaks/:userId` | Get streak info |
| Streaks | `/streaks/:userId/use-freeze` | Use streak freeze |
| Daily Challenge | `/daily-challenge/:userId` | Get today's challenge |
| Daily Challenge | `/daily-challenge/:userId/complete` | Complete challenge |
| Badges | `/badges/:userId` | Get user badges |
| Badges | `/badges/check` | Check badge awards |
| Session Feedback | `/session-feedback/reaction` | Submit emoji reaction |
| Session Feedback | `/session-feedback/nps` | Submit NPS score |
| Session Feedback | `/session-feedback/nps/check/:userId` | Check NPS due |
| Goals | `/goals` | Get/update daily goals |
| Referral | `/referral/my-code` | Get referral code |
| Referral | `/referral/redeem/:code` | Redeem referral code |
| Stats | `/stats/public` | Public platform stats |
| Leaderboard | `/leaderboard` | Global leaderboard |
| Leaderboard | `/leaderboard/class/:classId` | Class leaderboard |
| Question Paper | `/question-paper/history` | Get generation history |
| Question Paper | `/question-paper/:paperId/preview` | Get paper preview |
| Question Paper | `/question-paper/:paperId` | Delete paper |
| Question Paper | `/question-paper/:paperId/pdf` | Download paper PDF |

---

## Service Files

### Auth Service
**File:** `/src/api/auth.api.js`

The Auth API uses Redux Thunks to handle authentication state and side effects.

```javascript
import api from './axios';
import { setLoading, setToken } from '../store/slices/authSlice';
import { ENDPOINTS } from './endpoints';
import toast from 'react-hot-toast';

/**
 * Sign up a new user
 */
export function signUp(accountType, userName, email, password, confirmPassword, navigate, name) {
    return async (dispatch) => {
        const toastId = toast.loading('Processing...');
        dispatch(setLoading(true));
        try {
            const response = await api.post(ENDPOINTS.AUTH.SIGNUP, {
                userName, email, password, confirmPassword, accountType, name,
            });

            if (!response.data.success) {
                throw new Error(response.data.message);
            }

            toast.success('Signup successful');
            navigate('/login');
        } catch (e) {
            console.error('SIGNUP API ERROR', e);
            const errorMessage = e.response?.data?.message || e.message || 'Signup failed';
            toast.error(errorMessage);
            throw new Error(errorMessage); // Propagate error for UI handling
        } finally {
            dispatch(setLoading(false));
            toast.dismiss(toastId);
        }
    };
}

/**
 * Log in an existing user
 */
export function login(userName, password, navigate, setLoginError) {
    return async (dispatch) => {
        // ... implementation
    };
}
```

---

### Study Service
**File:** `/src/api/study.api.js`

```javascript
import api from './axios';

export const studyService = {
  getClasses: async () => {
    const response = await api.get('/study/configuration/classes');
    return response.data;
  },
  
  getSubjects: async (classId) => {
    const response = await api.get(`/study/configuration/subjects?classId=${classId}`);
    return response.data;
  },
  
  getChapters: async (subjectId) => {
    const response = await api.get(`/study/configuration/chapters/${subjectId}`);
    return response.data;
  },
  
  getQuestions: async (chapterId, questionType, difficulty, sessionId) => {
    const response = await api.get(`/questions/batch/chapter/${chapterId}/type/${questionType}/difficulty/${difficulty}/session/${sessionId}`);
    return response.data;
  },
  
  startSession: async (sessionData) => {
    const response = await api.post('/sessions', sessionData);
    return response.data;
  },
  
  endSession: async (sessionId, results) => {
    const response = await api.put(`/sessions/${sessionId}`, results);
    return response.data;
  },
  
  submitAnswers: async (answers) => {
    const response = await api.post('/answers/batch', { answers });
    return response.data;
  },
};
```

---

### Admin Service
**File:** `/src/api/admin.api.js`

```javascript
import api from './axios';

export const adminService = {
  // Schools
  getSchools: async () => api.get('/school'),
  createSchool: async (data) => api.post('/school', data),
  updateSchool: async (id, data) => api.put(`/school/${id}`, data),
  deleteSchool: async (id) => api.delete(`/school/${id}`),
  
  // Teachers
  getTeachers: async (params) => api.get('/teacher', { params }),
  createTeacher: async (data) => api.post('/teacher', data),
  bulkCreateTeachers: async (data) => api.post('/teacher/bulk', data),
  
  // Students
  getStudents: async (params) => api.get('/student', { params }),
  createStudent: async (data) => api.post('/student', data),
  bulkCreateStudents: async (data) => api.post('/student/bulk', data),
  
  // Sections
  getSections: async (params) => api.get('/section', { params }),
  createSection: async (data) => api.post('/section', data),
  updateSection: async (id, data) => api.put(`/section/${id}`, data),
  deleteSection: async (id) => api.delete(`/section/${id}`),
  
  // Chapters
  uploadChapterPDF: async (formData) => {
    return api.post('/chapters/create-with-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getChaptersWithTopics: async () => api.get('/chapters/with-topics'),
};
```

---

### Quiz Service
**File:** `/src/api/quiz.api.js`

```javascript
import api from './axios';

export const quizApi = {
  // Teacher Operations
  createQuiz: (data) => api.post('/quiz', data),
  getQuiz: (quizId) => api.get(`/quiz/${quizId}`),
  updateQuiz: (quizId, data) => api.put(`/quiz/${quizId}`, data),
  deleteQuiz: (quizId, options = {}) => api.delete(`/quiz/${quizId}`, { params: options }),
  getTeacherQuizzes: (teacherId, filters = {}) => 
    api.get(`/quiz/teacher/${teacherId}`, { params: filters }),
  publishQuiz: (quizId) => api.post(`/quiz/${quizId}/publish`),
  closeQuiz: (quizId) => api.post(`/quiz/${quizId}/close`),
  cloneQuiz: (quizId, title) => api.post(`/quiz/${quizId}/clone`, { title }),
  getQuizAnalytics: (quizId) => api.get(`/quiz/${quizId}/analytics`),
  
  // Question Management
  addQuestions: (quizId, questions) => api.post(`/quiz/${quizId}/questions`, { questions }),
  removeQuestion: (quizId, questionId) => api.delete(`/quiz/${quizId}/questions/${questionId}`),
  searchQuestionBank: (params) => api.get('/quiz/questions/search', { params }),
  
  // Student Operations
  getAvailableQuizzes: (filters = {}) => api.get('/quiz/student/available', { params: filters }),
  startQuizAttempt: (quizId) => api.post(`/quiz/${quizId}/start`),
  submitAnswer: (attemptId, quizQuestionId, selectedAnswer) => 
    api.post(`/quiz/attempt/${attemptId}/answer`, { quizQuestionId, selectedAnswer }),
  submitQuiz: (attemptId) => api.post(`/quiz/attempt/${attemptId}/submit`),
  getAttemptResult: (attemptId) => api.get(`/quiz/attempt/${attemptId}/result`),
  getQuizHistory: (filters = {}) => api.get('/quiz/student/history', { params: filters }),
};
```

---

### Question Paper Service
**File:** `/src/api/questionPaper.api.js`

```javascript
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
    baseURL: `${BASE_URL}/question-paper`,
    withCredentials: true
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const questionPaperApi = {
    // Generate paper (Teacher)
    generatePaper: async (data) => {
        const response = await api.post('/', data);
        return response.data;
    },

    // Public Generation endpoint (Lead Magnet)
    generatePublicPaper: async (payload) => {
        const response = await api.post('/public/generate', payload);
        return response.data;
    },

    // Get Generation History
    getHistory: async (params) => {
        const response = await api.get('/history', { params });
        return response.data;
    },

    // Get paper preview
    getPreview: async (paperId) => {
        const response = await api.get(`/${paperId}/preview`);
        return response.data;
    },

    // Delete Paper
    deletePaper: async (paperId) => {
        const response = await api.delete(`/${paperId}`);
        return response.data;
    },

    // PDF Download URL configuration
    getPdfDownloadUrl: (paperId) => {
        return `${BASE_URL}/question-paper/${paperId}/pdf`;
    }
};
```

---

## Usage Examples

### In Components
```jsx
import { authService } from '@/api/auth.api';
import { studyService } from '@/api/study.api';

// Login
const handleLogin = async (credentials) => {
  try {
    const { user, token } = await authService.login(credentials);
    dispatch(setUser(user));
    dispatch(setToken(token));
    navigate('/dashboard');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Login failed');
  }
};

// Fetch questions
const fetchQuestions = async () => {
  try {
    setLoading(true);
    const response = await studyService.getQuestions(chapterId, 'mcq', 'medium', sessionId);
    // response.data contains { success, message, data: { questions: [...], status: 'generating'|'failed'|'mastered' } }
    // The useQuestionPolling hook normalizes this: extracts response.data.data for questions,
    // response.data.status for the generation status, and polls while status === 'generating'.
    dispatch(setQuestions(response.data.data?.questions ?? []));
  } catch (error) {
    toast.error('Failed to load questions');
  } finally {
    setLoading(false);
  }
};
```

---

## Response Normalization

### Question Batch Response

The question batch endpoint wraps data differently than other endpoints:

```json
{
  "success": true,
  "message": "Batch fetched",
  "data": {
    "questions": [ /* question objects */ ],
    "status": "generating"   // "generating" | "failed" | "mastered"
  }
}
```

- **`data.data.questions`** — the actual array of question objects.
- **`data.data.status`** — generation status flag. When `"generating"`, the `useQuestionPolling` hook polls the endpoint every few seconds until the status changes to `"mastered"` or `"failed"`.
- The **`useQuestionPolling`** hook in `src/hooks/useQuestionPolling.js` handles this normalization: it passes `data.data` as the resolved value, so consumers always see `{ questions, status }`.

## Error Handling

**Standard Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Validation error 1", "Validation error 2"]
}
```

**Error Handling Pattern:**
```jsx
try {
  const data = await authService.login(credentials);
  // Handle success
} catch (error) {
  if (error.response?.status === 400) {
    // Validation errors
    setErrors(error.response.data.errors);
  } else if (error.response?.status === 401) {
    // Unauthorized
    setError('Invalid credentials');
  } else if (error.response?.status === 404) {
    // Not found
    setError('Resource not found');
  } else {
    // Generic error
    setError('Something went wrong. Please try again.');
  }
}
```

---

## Environment Variables

```env
# .env or .env.local
VITE_API_URL=https://askaideaibackend.onrender.com/api/v1
```

> **Note:** In Vite, environment variables must be prefixed with `VITE_` to be exposed to the client.

---

*Document maintained by AskAideAI Development Team*
