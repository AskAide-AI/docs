# API Integration

> How the frontend connects to backend APIs.
> Last Updated: October 10, 2026

---

## Configuration

**Library:** Axios
**Version:** 1.6.x
**Base URL:** `import.meta.env.VITE_API_URL` (no fallback in the client; set it in `.env`)
**Location:** `/src/api/`

---

## API Client Setup

**File:** `/src/api/axios.js`

> There is no `src/services/` layer. All API code lives in `src/api/`: one axios instance, endpoint constants, and one operation module per domain, barrel-exported from `src/api/index.js`.

**Available API modules (19):**
- `src/api/auth.api.js` — Login, signup (email and Google), logout, password reset, profile picture (Redux thunks)
- `src/api/study.api.js` — Study config, questions, sessions, answers, progress, streaks, badges
- `src/api/quiz.api.js` — Quizzes (teacher and student)
- `src/api/questionPaper.api.js` — Question paper generator
- `src/api/ai-assistant.api.js` — AI Assistant
- `src/api/admin.api.js` — Admin CRUD, metrics, AI System
- `src/api/teacher-dashboard.api.js` — Teacher Dashboard
- `src/api/teacherClass.api.js` — Teacher class links and join page
- `src/api/principal.api.js` — Principal Dashboard
- `src/api/parent.api.js` — Parent Dashboard
- `src/api/goal.api.js` — Daily Goals
- `src/api/referral.api.js` — Refer & Earn (invite link, redeem, practice-paper reward)
- `src/api/challenge.api.js` — Challenge a friend
- `src/api/notification.api.js` — Notification bell
- `src/api/stats.api.js` — Public Stats
- `src/api/profile.api.js` — Public profile, name edit, email change
- `src/api/feedback.api.js`, `src/api/suggestion.api.js`, `src/api/behavioral.api.js` — Feedback

```javascript
// src/api/axios.js (trimmed)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 second timeout
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const tokenString = localStorage.getItem('token');
  if (tokenString) {
    try {
      config.headers.Authorization = `Bearer ${JSON.parse(tokenString)}`;
    } catch {
      config.headers.Authorization = `Bearer ${tokenString}`;
    }
  }
  return config;
});

// Refresh tokens are single-use, so only one refresh may run at a time:
// one shared promise per tab, and a Web Lock across tabs.
export function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshTokenAtStart = readStored('refreshToken');
    const run = () => runRefresh(refreshTokenAtStart); // reuses tokens another tab just saved
    refreshPromise = Promise.resolve(
      navigator.locks?.request ? navigator.locks.request('askaide-token-refresh', run) : run()
    ).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

// Response interceptor - refresh on an expired token, then retry once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && isTokenExpiredBody(error.response.data) && !original._retry) {
      original._retry = true;
      // Sent with a token another tab already replaced? Just retry with the stored one.
      // Otherwise: const token = await refreshAccessToken(); retry with it.
      // A failed refresh runs clearAuthAndRedirect().
    }
    if (error.response?.status === 401) clearAuthAndRedirect(); // other 401s
    return Promise.reject(error);
  }
);
```

`clearAuthAndRedirect()` removes the tokens and `user`, stores `auth:sessionExpired` and `auth:returnTo` in sessionStorage, and sends the user to `/login`, which explains why and returns them afterwards.

### Raw `fetch` calls: `authorizedFetch()`

Calls axios can't make (the teacher AI stream, PDF downloads) use `authorizedFetch(url, init)` from `src/api/axios.js`. It attaches the access token and, on a `tokenExpired` 401, refreshes once through `refreshAccessToken()` and retries. Don't attach the bearer token to a bare `fetch` by hand: it fails with a 401 once the 2-hour access token expires. The one exception is ending a session from a closing tab (`studyApi.endSessionOnPageExit`), a `keepalive` fetch that can't wait for a refresh.

---

## API Endpoints

**File:** `/src/api/endpoints.js`

| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | `/authenticate/login` | User login |
| Auth | `/authenticate/signup` | User registration |
| Auth | `/authenticate/sendotp` | Send OTP for login |
| Auth | `/authenticate/verify-email` | Verify OTP and login |
| Auth | `/authenticate/google` | Google sign-in / sign-up (`accountType: 'Teacher'` on the teacher sign-up) |
| Auth | `/authenticate/refresh` | Refresh the access token |
| Auth | `/authenticate/logout` | Log out (revokes the refresh token) |
| Auth | `/authenticate/changepassword` | Change password |
| Profile | `/profile/details` | Get user profile |
| Profile | `/profile/update` | Update profile |
| Profile | `/profile/name` | Change display name (PUT) |
| Profile | `/profile/email/request-change` | Send a 6-digit code to the new email |
| Profile | `/profile/email/confirm-change` | Confirm the code and switch the email |
| Profile | `/profile/display-picture` | Upload (PUT) or remove (DELETE) profile photo |
| Profile | `/profile/public/:userId` | Public student profile |
| Content | `/study/configuration` | Get classes with subjects |
| Content | `/topics/class/:classId/subject/:subjectId` | Get topics for class/subject |
| Content | `/chapters/class/:classId/subject/:subjectId` | Get chapters for class/subject |
| Content | `/chapters/check-rag-status` | Check AI RAG status |
| Questions | `/questions/batch/chapter/:chapterId/type/:type/difficulty/:difficulty/session/:sessionId` | Get question batch |
| | | **Response `status` field:** `generating` — batch is being built by AI; `failed` — generation errored; `mastered` — all questions answered correctly |
| Sessions | `/sessions` | Create session |
| Sessions | `/sessions/:sessionId/end` | End session (PATCH) |
| Sessions | `/sessions/last-incomplete/:userId` | Get last incomplete session |
| Answers | `/user-answers/batch` | Submit answers. The study screen sends one answer per call, as soon as it is given. |
| Progress | `/topic-progress/progress/subject/:subjectId` | Subject progress (signed-in user) |
| Progress | `/topic-progress/ai-insights/chapter/:chapterId` | AI chapter insights |
| Progress | `/topic-progress/ai-insights/subject/:subjectId` | AI subject insights |
| Progress | `/topic-progress/mastery-summary` | Mastery overview |
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
| Referral | `/referral/my-code` | Get invite code, gift progress and friends |
| Referral | `/referral/redeem/:code` | Redeem referral code |
| Referral | `/referral/rewards/practice-paper` | Spend a gift on a practice paper (60 s timeout) |
| Challenges | `/challenges` | Create a challenge from a finished session (POST) |
| Challenges | `/challenges/mine` | Challenges the student sent |
| Challenges | `/challenges/:code` | Public challenge (no login) |
| Challenges | `/challenges/:code/attempts` | Submit a play (guest or signed in) |
| Challenges | `/challenges/attempts/:attemptId/claim` | Claim a guest's play after sign-in |
| Challenges | `/challenges/:code/review` | Answers and full scoreboard |
| Teacher Classes | `/teacher-classes` | Create a class link (POST) |
| Teacher Classes | `/teacher-classes/mine` | Teacher's links, totals and milestones |
| Teacher Classes | `/teacher-classes/:id` | Turn a link on or off (PATCH) |
| Teacher Classes | `/teacher-classes/:id/report` | Class progress report |
| Teacher Classes | `/teacher-classes/certificate` | Champion Teacher certificate |
| Teacher Classes | `/teacher-classes/join/:code` | Class info (GET, public) or join (POST, student) |
| Notifications | `/notifications` | List (`?before=&limit=`) → `{ items, hasMore, nextCursor, unread }` |
| Notifications | `/notifications/unread-count` | Unread count (polled every 60 s while the tab is visible) |
| Notifications | `/notifications/read` | Mark read: `{ ids }` or `{ all: true }` |
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
**File:** `/src/api/study.api.js` (abridged)

```javascript
import api from './axios';

export const studyApi = {
  getConfiguration: async (classIds = null) => { /* GET /study/configuration?classIds= */ },

  getQuestions: async (chapterId, questionType, difficulty, sessionId) => {
    const response = await api.get(`/questions/batch/chapter/${chapterId}/type/${questionType}/difficulty/${difficulty}/session/${sessionId}`);
    return response.data;
  },

  startSession: async (config) => { /* POST /sessions */ },

  endSession: async (sessionId, score, totalquestions) => {
    const response = await api.patch(`/sessions/${sessionId}/end`, { score, totalquestions });
    return response.data;
  },

  // From a closing tab: a keepalive fetch can finish after the page is gone.
  endSessionOnPageExit: (sessionId, score, totalquestions) => { /* fetch(..., { method: 'PATCH', keepalive: true }) */ },

  // The study screen calls this with one answer, right after it is given.
  submitUserAnswers: async (userAnswers) => {
    return api.post('/user-answers/batch', { answers: userAnswers });
  },

  // The backend sends { badgeId, title } objects; this returns the badge IDs.
  checkNewBadges: async (userId, sessionData) => { /* POST /badges/check */ },
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
VITE_API_URL=http://localhost:4000/api/v1
```

> **Note:** In Vite, environment variables must be prefixed with `VITE_` to be exposed to the client.

---

*Document maintained by AskAideAI Development Team*
