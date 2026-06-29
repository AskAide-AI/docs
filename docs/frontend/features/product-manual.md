# AskAide AI - Product Manual

:::info Canonical end-user guide
The complete, role-by-role end-user walkthrough (Student / Teacher / Parent / Admin) lives in the canonical [User Guide](/docs/reference/user-guide). This page is a product/functional overview for stakeholders and AI agents — use the User Guide for step-by-step usage.
:::

> **Product Guide & Context for AI Agents and Stakeholders**
> This document provides a functional overview of the AskAide AI platform, explaining its capabilities, user roles, and core workflows.

---

## 1. Executive Summary

AskAide AI is an advanced EdTech platform that delivers **AI-powered adaptive learning**. Unlike traditional LMS platforms that just host static content, AskAide AI dynamically generates practice questions, tracks detailed topic mastery, and provides real-time AI tutoring. It is designed for B2B deployment (Schools) with role-based access for Students, Teachers, and Administrators.

**Core Value:** Personalized education at scale through AI automation.

---

## 2. Platform Capabilities

### 🧠 Adaptive Study Engine
- **Dynamic Question Generation**: Generates infinite practice questions based on the curriculum.
- **Multiple Formats**: Supports Multiple Choice Questions (MCQ) and Fill-in-the-Blanks.
- **Difficulty Adjustment**: Users can select Easy, Medium, or Hard modes.
- **Real-Time Feedback**: Instant validation of answers with detailed explanations for incorrect attempts.

### 📊 Intelligent Analytics
- **Topic Mastery**: Tracks proficiency not just by chapter, but by specific sub-topics.
- **AI Insights**: Generates personalized text recommendations (e.g., "You're strong in Algebra but need practice in Quadratic Equations").
- **Visual Progress**: Breadth (Subject Coverage) vs. Depth (Mastery Score) visualization.

### 📄 Automated Question Paper Generator
- **AI-Powered Assembly**: Automatically generates complete question papers (MCQs and Fill-in-the-Blanks) aligned with chosen classes and subjects.
- **Customizable Constraints**: Configurable difficulty breakdown, total marks, time duration, and question allocation.
- **Instant Output**: Generates beautifully formatted Web Views and PDF downloads for offline printing.
- **Answer Keys**: Option to include automatically generated answer keys for teachers.
- **Teacher Tools**: Authorized teachers and admins can view history, preview, download, and delete previously generated papers.
- **Lead Magnet (Public Page)**: A free, public-facing version of the generator used to capture contact information (email/phone) for B2B lead generation.

### 🏫 Institution Management
- **School Onboarding**: Multi-tenant support for managing multiple schools.
- **Class & Section Support**: Flexible hierarchy (School -> Class -> Section).
- **Roster Management**: Bulk upload and management of Teachers and Students.
- **Curriculum Management**: Upload Textbook PDFs to automatically extract Chapters and Topics via AI.

---

## 3. User Roles & Workflows

### 🎓 **Student**
*The primary end-user focusing on learning and practice.*

#### **Workflow 1: Start a Study Session**
1.  **Navigate**: Go to the **Study** tab (`/study`).
2.  **Configure**:
    *   **Class**: Select Grade (e.g., "10th").
    *   **Subject**: Select Subject (e.g., "Mathematics"). *(Enabled after Class)*
    *   **Chapter**: Select a specific Chapter. *(Enabled after Subject)*
3.  **Customize**: Choose **Question Type** (MCQ/Fill-in-Blanks) and **Difficulty** (Easy/Medium/Hard).
4.  **Practice**:
    *   Click "Start Learning".
    *   Answer questions in the interactive interface.
    *   View real-time feedback and explanations.
5.  **Finish**: "End Session" to save progress and view the **Session Result Summary**.

#### **Workflow 2: Review Progress**
1.  **Navigate**: Go to the **Progress** tab (`/progress`).
2.  **Overview**: View "Subject Cards" showing overall coverage and mastery.
3.  **Deep Dive**: Click a Subject to view **Chapter-wise breakdown**.
4.  **AI Coach**: Read the **"AI Insights"** panel for personalized study recommendations.

---

### 🛠️ **Administrator (SuperAdmin)**
*The power user managing the platform's data and access.*

#### **Workflow 1: Onboard a School & Users**
1.  **School Setup**: Go to **Admin Panel > School Management**. Create a new School.
2.  **Teacher Setup**: Go to **Teacher Management**.
    *   Create individual teachers or **Bulk Upload** via CSV.
3.  **Student Setup**: Go to **Student Management**.
    *   Create students or **Bulk Upload**.
4.  **Class Sections**: Go to **Section Management** to define sections (e.g., "9th - A", "10th - B").

#### **Workflow 2: Assign Teachers to Classes**
1.  **Navigate**: Go to **Admin Panel > Link Management** (Teacher-Student Linking).
2.  **Assign**: Select a Teacher and assign them to specific Students or entire Sections.
    *   *Note*: This controls what data the Teacher sees in their dashboard.

#### **Workflow 3: Curriculum Management**
1.  **Navigate**: Go to **Chapter Upload**.
2.  **Upload**: Upload a textbook PDF for a specific Subject/Class.
3.  **Process**: The system uses AI to parse the PDF, creating **Chapters** and extracting **Topics** automatically.
4.  **Verify**: Check **Chapter-Topic View** to ensure content was ingested correctly.

---

### 👩‍🏫 **Teacher**
*Monitors student performance and guides learning.*
> **Status**: *Dashboard currently uses mock data. Full analytics integration depends on "Teacher-Student Linking" data.*

#### **Core Workflow (Planned/In-Progress)**
1.  **Dashboard**: Login to see an overview of assigned Classes/Sections.
2.  **Class Analytics**: View aggregate performance (e.g., "Class 10-A is struggling with Geometry").
3.  **Student Drill-down**: Click a specific student to view their detailed **Topic Mastery**.

#### **Workflow: Generate Question Papers**
1.  **Navigate**: Go to the **Papers** tool (`/question-paper`).
2.  **Configure**: Specify school name, exam title, class, subject, total marks, duration, and question format preferences.
3.  **Generate**: Click "Generate" to receive an AI-crafted paper in seconds.
4.  **Preview & Action**: Download as PDF, view Answer Keys, or browse the generation history to retrieve past papers.



## 4. Technical Context for AI Agents
*If you are an AI attempting to modify or debug this project, read this section.*

### **Tech Stack**
- **Frontend**: React (Vite), TailwindCSS, Redux Toolkit, React Router, HeadlessUI.
- **Backend (API)**: Node.js, Express, MongoDB (Mongoose).
- **Authentication**: JWT (Access/Refresh tokens) stored in HTTP-only cookies (or local storage depending on implementation, verified as JWT).

### **Key Data Structures**
- **Topic Mastery**: A calculated score (0-100%) based on correct answers/total attempts for a specific topic tag.
- **Session**: A record of a practice attempt, containing a list of `QuestionAttempt` objects.
- **Relation**: The `TeacherStudent` model links a Teacher to a Student (optionally filtered by Section).

### **Important File Paths**
| Context | Files |
| :--- | :--- |
| **Routes** | `src/routes.jsx` (or `App.jsx` route definitions) |
| **Study Logic** | `src/components/study/StudyConfig.jsx`, `src/api/study.api.js` |
| **Auth Logic** | `src/store/slices/authSlice.js`, `src/components/auth/` |
| **Admin Panel** | `src/components/admin/` |
