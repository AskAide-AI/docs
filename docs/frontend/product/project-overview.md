# AskAideAI - Project Overview

> **EdTech Platform for AI-Powered Adaptive Learning**
> Last Updated: April 19, 2026

---

## 1. Introduction

AskAideAI is a **MERN stack** (MongoDB, Express, React, Node.js) based EdTech platform designed to revolutionize how students practice and learn. The platform leverages AI-powered question generation, adaptive learning paths, and comprehensive analytics to deliver personalized education at scale.

### 🎯 Core Value Proposition
- **AI-Powered Practice**: Dynamically generated questions based on curriculum and student level
- **Adaptive Learning**: Difficulty adjusts based on student mastery
- **Comprehensive Analytics**: Detailed progress tracking for students, parents, and teachers
- **School Integration**: B2B model supporting multiple schools with centralized management

---

## 2. Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React (Vite)** | UI Framework with fast HMR |
| **TailwindCSS** | Utility-first styling |
| **Material UI** | Component library for consistent UX |
| **Redux Toolkit** | Centralized state management |
| **React Router DOM** | Client-side routing |
| **Axios** | HTTP client with interceptors |
| **React Hook Form + Zod** | Form handling and validation |
| **Lucide React** | Icon library |
| **react-hot-toast** | Toast notifications |

### Backend (Inferred)
| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | API server |
| **MongoDB (Mongoose)** | Database with ODM |
| **JWT + Bcrypt** | Authentication & password hashing |
| **Nodemailer** | Email services (OTP, password reset) |
| **External AI Service** | Question generation & insights |

---

## 3. Project Architecture

### Directory Structure
```
src/
├── api/                    # Centralized API layer
│   ├── axios.js           # Shared axios instance with interceptors
│   ├── endpoints.js       # API endpoint constants
│   ├── auth.api.js        # Authentication operations
│   ├── study.api.js       # Study/session operations
│   ├── admin.api.js       # Admin panel operations
│   └── index.js           # Barrel export
│
├── components/
│   ├── auth/              # Authentication components
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── VerifyEmail.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── UpdatePassword.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── RoleProtectedRoute.jsx
│   │
│   ├── study/             # Core practice experience
│   │   ├── Home.jsx       # Main study interface
│   │   ├── StudyConfig.jsx
│   │   ├── QuestionPractice.jsx
│   │   ├── QuestionArea.jsx
│   │   ├── Sidebar.jsx
│   │   ├── SessionResultModal.jsx
│   │   └── UserAnswers.jsx
│   │
│   ├── dashboard/         # Role-based dashboards
│   │   ├── Dashboard.jsx           # Student dashboard
│   │   ├── ParentDashboard.jsx
│   │   ├── TeacherDashboard.jsx
│   │   └── AdminDashboard.jsx      # Super admin panel
│   │
│   ├── admin/             # Admin panel modules
│   │   ├── SchoolManagement.jsx
│   │   ├── TeacherManagement.jsx
│   │   ├── StudentManagement.jsx
│   │   ├── LinkManagement.jsx
│   │   ├── ChapterUpload.jsx
│   │   ├── RelationView.jsx
│   │   └── ChapterTopicView.jsx
│   │
│   ├── progress/          # Progress tracking views
│   │   ├── SubjectSummary.jsx
│   │   ├── ChapterList.jsx
│   │   └── ChapterDetailView.jsx
│   │
│   ├── pages/             # Static/utility pages
│   │   ├── LandingPage.jsx
│   │   ├── Profile.jsx
│   │   ├── Settings.jsx
│   │   ├── Progress.jsx
│   │   └── FeedbackForm.jsx
│   │
│   ├── layout/            # Layout components
│   │   ├── Navbar.jsx
│   │   └── BottomNav.jsx
│   │
│   └── common/            # Shared components
│       └── (reusable UI components)
│
├── store/                 # Redux store
│   └── slices/
│       ├── authSlice.js
│       ├── profileSlice.js
│       └── sessionSlice.js
│
├── hooks/                 # Custom React hooks
├── contexts/              # React contexts
├── constants/             # App constants
├── lib/                   # Utility libraries
└── services/              # Service layer (legacy)
```

---

## 4. Key Features

### A. Authentication & User Management ✅ **Implemented**

| Feature | Status | Description |
|---------|--------|-------------|
| Email/Password Login | ✅ Done | Standard authentication with JWT |
| User Registration | ✅ Done | Sign up with email verification |
| Email OTP Verification | ✅ Done | Secure email verification flow |
| Forgot Password | ✅ Done | Email-based password reset |
| Profile Management | ✅ Done | Update profile, display picture |
| Role-Based Access | ✅ Done | Student, Parent, Teacher, SuperAdmin |

### B. AI-Powered Study Experience ✅ **Implemented**

| Feature | Status | Description |
|---------|--------|-------------|
| Study Configuration | ✅ Done | Select Class, Subject, Chapter, Type, Difficulty |
| Dynamic Question Fetching | ✅ Done | Batch-based question loading |
| AI Question Generation | ✅ Done | Fallback to AI service when needed |
| Retry Logic | ✅ Done | Automatic retries on AI failures |
| Real-time Answer Feedback | ✅ Done | Correct/Incorrect with explanations |
| Session Management | ✅ Done | Full session lifecycle tracking |
| Answer Persistence | ✅ Done | Batch submission of user answers |
| Session History | ✅ Done | View past sessions with answers |

### C. Progress Tracking & Analytics ✅ **Implemented**

| Feature | Status | Description |
|---------|--------|-------------|
| Subject Progress | ✅ Done | Coverage & mastery metrics per subject |
| Chapter Progress | ✅ Done | Detailed chapter-level breakdown |
| Topic Progress | ✅ Done | Granular topic-wise tracking |
| AI Insights | ✅ Done | AI-generated recommendations per subject/chapter |
| Visual Progress Cards | ✅ Done | Beautiful UI with status badges |
| CTA Integration | ✅ Done | "Practice Now" / "Start Practicing" buttons |

### D. Admin Panel ✅ **Implemented**

| Feature | Status | Description |
|---------|--------|-------------|
| School Management | ✅ Done | CRUD operations for schools |
| Teacher Management | ✅ Done | Individual + bulk teacher creation |
| Student Management | ✅ Done | Individual + bulk student creation |
| Teacher-Student Linking | ✅ Done | Assign teachers to students |
| Chapter PDF Upload | ✅ Done | Upload PDFs for AI processing |
| Relation View | ✅ Done | Visualize school relationships |
| Chapter-Topic View | ✅ Done | See AI-processed chapters & topics |

### E. Role-Based Dashboards ⚠️ **Partially Implemented**

| Feature | Status | Description |
|---------|--------|-------------|
| Student Dashboard | ✅ Done | Gamification elements (streaks, badges) |
| Parent Dashboard | ✅ Done | Student oversight (grades, activities) |
| Teacher Dashboard | ✅ Done | Class analytics & student performance |
| Admin Dashboard | ✅ Done | Full admin panel with all modules |

### F. Landing Page & Marketing ✅ **Implemented**

| Feature | Status | Description |
|---------|--------|-------------|
| Modern Landing Page | ✅ Done | Responsive, animated, conversion-focused |
| Feature Showcase | ✅ Done | AI, Analytics, School features highlighted |
| CTAs | ✅ Done | Trial, Demo, Sign Up flows |
| Social Proof | ✅ Done | Statistics, testimonials, trust elements |

### G. User Experience ✅ **Implemented**

| Feature | Status | Description |
|---------|--------|-------------|
| Mobile Responsive | ✅ Done | Mobile-first design with bottom nav |
| Offline Detection | ✅ Done | Network status awareness |
| Loading States | ✅ Done | Shimmer loaders, spinners |
| Toast Notifications | ✅ Done | User feedback on actions |
| Settings Page | ✅ Done | App preferences |
| Feedback Form | ✅ Done | User feedback collection |

### H. Quizzes & Assessments ✅ **Implemented**

| Feature | Status | Description |
|---------|--------|-------------|
| Quiz Management | ✅ Done | Teacher creation, reordering, and publishing |
| Quiz Attempts | ✅ Done | Time-limited student assessments |
| Results & Analytics | ✅ Done | Auto-grading and detailed results history |

### I. Lead Generation ✅ **Implemented**

| Feature | Status | Description |
|---------|--------|-------------|
| Public Paper Gen | ✅ Done | Free paper generation for leads |
| WhatsApp Delivery| ✅ Done | Automated PDF delivery via WhatsApp |

---

## 5. API Integration

### Unified API Layer (src/api/)
All API calls now flow through a centralized axios instance with:
- ✅ **Auth Interceptors**: Automatic token injection
- ✅ **Error Handling**: Global error logging
- ✅ **Base URL Config**: Uses `import.meta.env.VITE_API_URL`
- ✅ **Timeout Handling**: 30-second request timeout

### Key API Endpoints
| Module | Endpoint Pattern | Description |
|--------|------------------|-------------|
| Auth | `/auth/*` | Login, signup, OTP, password reset |
| Study | `/study/configuration` | Get classes, subjects |
| Questions | `/questions/batch/chapter/:id/...` | Fetch question batches |
| Sessions | `/sessions` | Start, end, manage sessions |
| Progress | `/progress/user/:userId` | User progress data |
| Topic Progress | `/topic-progress/...` | Subject/chapter progress |
| AI Insights | `/topic-progress/ai-insights/...` | AI recommendations |
| Chapters | `/chapters/...` | Chapter CRUD with topics |
| Admin | `/school`, `/teacher`, `/student` | Admin operations |

---

## 6. Current State Summary

### ✅ Completed (Production Ready)
1. Full authentication flow with email verification
2. AI-powered question practice with retry logic
3. Comprehensive progress tracking with AI insights
4. Complete admin panel for school management
5. Modern, animated landing page
6. Feature-based component organization
7. Unified API layer with proper error handling

### ⚠️ Needs Improvement
1. Student/Parent/Teacher dashboards (currently mock data)
2. TypeScript migration (files are .jsx, not .tsx)
3. More comprehensive test coverage

### 📊 Technical Debt Addressed
- ✅ Env vars now use `import.meta.env` (Vite compatible)
- ✅ API layer consolidated into `src/api/`
- ✅ Components organized by feature
- ✅ Redux used for auth, profile, session state

---

## 7. User Roles & Permissions

| Role | Access Level | Key Features |
|------|--------------|--------------|
| **Student** | Default | Study, Progress, Dashboard, Profile |
| **Parent** | Elevated | + Parent Dashboard (student oversight) |
| **Teacher** | Elevated | + Teacher Dashboard (class analytics) |
| **SuperAdmin** | Full | + Admin Panel (full system management) |

---

## 8. Deployment & Environment

### Environment Variables
```env
VITE_API_URL=https://askaideaibackend.onrender.com/api/v1
```

### Build Commands
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

---

*Document maintained by AskAideAI Product Team*
