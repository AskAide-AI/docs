# AskAide AI — EdTech Frontend

:::info Full-stack setup lives in Getting Started
For the end-to-end local setup (infrastructure + Backend + AI Service + Frontend), follow the canonical [Getting Started](/docs/reference/getting-started) guide. This page covers **frontend-specific** details only.
:::

A modern, high-performance EdTech platform built with React, TypeScript, and Tailwind CSS. This frontend serves as the primary interface for students, teachers, and administrators to interact with the AskAide AI ecosystem.

## 🚀 Features

- **Adaptive Study Sessions**: Real-time AI-powered practice with MCQ and Fill-in-the-blanks.
- **Teacher Dashboard**: Comprehensive analytics, student activity feeds, and progress monitoring.
- **Student Quiz System**: Structured assessment management with auto-grading and results history.
- **Auto Question Paper Generator**: Professional board-style exam papers generated in seconds.
- **Lead Magnet**: Public-facing free paper generator with automatic WhatsApp delivery.
- **Mastery Analytics**: Topic-level progress tracking with AI-generated learning insights.
- **Multi-Role Support**: Tailored experiences for Students, Teachers, Parents, and Admins.

## 🛠 Tech Stack

- **Framework**: React 18 + Vite
- **Language**: JavaScript (TypeScript installed but not in active use)
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit (Auth, Profile, Session)
- **Routing**: React Router DOM (Lazy-loaded routes)
- **API Client**: Axios (with centralized interceptors)
- **Analytics**: Microsoft Clarity

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
   ```
3. **Run Development Mode**:
   ```bash
   npm run dev
   ```

## 📖 Related Documentation

- CLAUDE.md - Tech overview and development commands.
- [project_overview.md](../product/project-overview) - Detailed architecture and feature breakdown.
- [product.md](../product/product-overview) - Product identity, target audience, and business context.

---
*Maintained by the AskAide AI Team*