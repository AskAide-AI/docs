# AskAide AI — EdTech Frontend

:::info Full-stack setup lives in Getting Started
For the end-to-end local setup (infrastructure + Backend + AI Service + Frontend), follow the canonical [Getting Started](/docs/reference/getting-started) guide. This page covers **frontend-specific** details only.
:::

A modern, high-performance EdTech platform built with React, JavaScript, and Tailwind CSS. This frontend serves as the primary interface for students, teachers, and administrators to interact with the AskAide AI ecosystem.

## 🚀 Features

- **Adaptive Study Sessions**: Real-time AI-powered practice with MCQ and Fill-in-the-blanks.
- **Teacher Dashboard**: Comprehensive analytics, student activity feeds, and progress monitoring.
- **Student Quiz System**: Structured assessment management with auto-grading and results history.
- **Auto Question Paper Generator**: Professional board-style exam papers generated in seconds.
- **Lead Magnet**: Public-facing free paper generator with automatic WhatsApp delivery.
- **Mastery Analytics**: Topic-level progress tracking with AI-generated learning insights.
- **Multi-Role Support**: Tailored experiences for Students, Teachers, Principals, Parents, and Admins.
- **Challenges & Refer & Earn**: Challenge a friend on WhatsApp (played without login) and invite friends for a shared gift.
- **Teacher Class Links**: Teachers sign up on their own and bring students in with a link or QR code.
- **In-App Notifications**: Bell, panel and toast for signed-in users.

## 🛠 Tech Stack

- **Framework**: React 18 + Vite
- **Language**: JavaScript (TypeScript installed but not in active use)
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit (Auth, Profile, Session, AI Agent)
- **Routing**: React Router DOM (Lazy-loaded routes)
- **API Client**: Axios (with centralized interceptors)
- **Analytics**: Microsoft Clarity
- **Tests**: Vitest + React Testing Library (23 files in `src/__tests__/`)
- **Fonts**: Fraunces, Inter Tight, JetBrains Mono, self-hosted in `public/fonts/`

## 📁 Project Structure

```
src/
├── api/          # Centralized API logic (axios instance, endpoints, functions)
├── components/   # Modular UI components (organized by feature area)
├── store/        # Redux Toolkit state management
├── hooks/        # Custom React hooks
├── contexts/     # Global contexts (Theme, Sound)
├── utils/        # Utility functions (date formatting, analytics)
└── App.jsx       # Main router and layout configuration
```

## 🚦 Getting Started

1. **Clone & Install**:
   ```bash
   npm install
   ```
2. **Environment Setup**:
   Create a `.env` file with:
   ```env
   VITE_API_URL=http://localhost:4000/api/v1
   VITE_SITE_URL=http://localhost:5173
   VITE_CONTACT_EMAIL=hello@askaide.in
   ```
3. **Run Development Mode**:
   ```bash
   npm run dev
   ```
4. **Run the tests**:
   ```bash
   npm test
   ```

Google sign-in needs `VITE_GOOGLE_CLIENT_ID`, and the origin you run on (for example `http://localhost:5173`) must be an authorised JavaScript origin for that client, or the button fails.

## 📖 Related Documentation

- CLAUDE.md - Tech overview and development commands.
- [project_overview.md](../product/project-overview) - Detailed architecture and feature breakdown.
- [product.md](../product/product-overview) - Product identity, target audience, and business context.

---
*Maintained by the AskAide AI Team*