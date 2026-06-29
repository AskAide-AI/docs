# Frontend Learning Guide

A comprehensive guide to understanding the **AskAide AI Frontend** -- its tech stack, concepts, architecture, and the key technologies used. Whether you are a beginner getting started or a developer ramping up on this project, this guide points you to what you need to know.

---

## What's Inside

1. [Tech Stack Overview](#tech-stack-overview)
2. [Core Concepts](#core-concepts)
3. [Architecture & Project Structure](#architecture--project-structure)
4. [Deep Dive into Key Technologies](#deep-dive-into-key-technologies)
5. [Design System](#design-system)
6. [Reference Material](#reference-material)

---

## Tech Stack Overview

| Layer | Technology | What it does |
|-------|-----------|-------------|
| **Framework** | React 18 | Build user interfaces with components |
| **Build Tool** | Vite | Fast development server and production builds |
| **Language** | JavaScript (JSX) + TypeScript (installed) | Component code and type definitions |
| **Styling** | Tailwind CSS 3 | Utility-first CSS framework |
| **PostCSS** | PostCSS + Autoprefixer | Process and prefix CSS |
| **State Mgmt** | Redux Toolkit | Global state management (auth, profile, session) |
| **Routing** | React Router DOM v7 | Client-side navigation |
| **HTTP Client** | Axios | API requests with interceptors |
| **Forms** | React Hook Form + Zod | Form handling and schema validation |
| **Icons** | Lucide React | Modern icon library |
| **Charts** | Recharts | Data visualization |
| **Analytics** | Microsoft Clarity | Heatmaps and session recording |
| **PWA** | Vite PWA Plugin | Progressive Web App support |
| **Testing** | Vitest + Testing Library | Unit tests for React components |

---

## Core Concepts

### Single-Page Application (SPA)
The frontend is an SPA: once loaded in the browser, it handles navigation internally without full page refreshes. This provides a snappy, app-like experience. **React Router DOM** manages this.

### Component-Based Architecture
The UI is broken into reusable pieces (components) -- e.g., `Button`, `Navbar`, `Dashboard`. Components are composed together to build pages. This makes the code modular, reusable, and easier to maintain.

### State Management
- **Global state (Redux Toolkit)**: Shared app data like `auth` (logged-in user), `profile` (user info), and `session` (study session state).
- **Local state (useState/useReducer)**: UI-only state inside a single component (e.g., form input, modal open/close).
- **Context (React Context)**: The app uses contexts for `Theme` and `Sound` to avoid prop-drilling these values everywhere.

### Role-Based Access Control (RBAC)
The app serves Students, Teachers, Parents, Principals, and Admins. Routes are protected based on the user's role. E.g., only teachers see the teacher dashboard; only admins see the admin panel.

### Lazy Loading & Code Splitting
Routes use `React.lazy()` so each page is split into its own JavaScript file. The browser only fetches a page when the user navigates there, reducing initial load time.

---

## Architecture & Project Structure

```
frontend/
├── src/
│   ├── api/              # Centralized API logic (Axios instance + endpoint functions)
│   ├── components/       # UI components organized by feature (admin, auth, dashboard, study, ...)
│   ├── contexts/         # React Context providers (Theme, Sound)
│   ├── hooks/            # Custom React hooks (useIsMobile, useAppTour, etc.)
│   ├── store/            # Redux Toolkit slices (authSlice, sessionSlice, profileSlice)
│   ├── utils/            # Utility functions (analytics, date formatting)
│   └── App.jsx           # Main router and layout configuration
├── public/               # Static assets (icons, manifest, favicon)
├── scripts/              # Sitemap generation script
├── tailwind.config.js    # Tailwind CSS configuration
├── vite.config.ts        # Vite configuration
└── index.html            # Entry HTML template
```

### Key Files to Know
- `src/main.jsx` -- Entry point: sets up React, Redux, routing, and providers.
- `src/App.jsx` -- Defines all routes and the overall layout (navbar, sidebar, bottom nav).
- `src/api/` -- All backend communication happens here. `axios.js` sets up the base URL and interceptors.
- `src/store/slices/` -- Each slice manages a domain of state (auth, profile, session).

---

## Deep Dive into Key Technologies

### React 18
React is a JavaScript library for building user interfaces using components. React 18 introduces concurrent features, automatic batching, and improved rendering performance.

**What to learn:**
- JSX syntax
- Functional components + Hooks (`useState`, `useEffect`, `useContext`, `useMemo`, `useCallback`)
- Conditional rendering, lists/keys, forms
- React 18 features: automatic batching, `startTransition`, concurrent rendering

### Vite
Vite is a fast build tool. It serves your code during development via ES modules (instant start) and bundles for production with Rollup (optimized output).

**What to learn:**
- Dev server (`npm run dev`)
- Build (`npm run build`)
- Hot Module Replacement (HMR): Instant code updates without losing state

### Tailwind CSS
Utility-first CSS framework. You style elements by composing class names like `bg-blue-500`, `p-4`, `rounded-lg`. This eliminates the need to write custom CSS files for every component.

**What to learn:**
- Utility classes and the JIT (Just-In-Time) engine
- Custom configuration in `tailwind.config.js` (custom colors, fonts, animations)
- Dark mode with `class` strategy
- Responsive design with breakpoints (`md:`, `lg:`)

### React Router DOM
Handles navigation within the SPA. URL changes update the view without a page reload.

**What to learn:**
- `BrowserRouter`, `Routes`, `Route`, `Link`, `useNavigate`, `useLocation`
- Nested routes
- Route guards/redirects (implemented via `ProtectedRoute` and `RoleProtectedRoute`)

### Axios + API Layer
Axios is a promise-based HTTP client. The project centralizes all API calls in `src/api/` to keep components clean.

**What to learn:**
- Axios instance setup with base URL and interceptors
- Interceptors for attaching JWT tokens to every request automatically
- Centralizing API calls by feature (e.g., `auth.api.js`, `study.api.js`)

### Redux Toolkit
Manages global state that many components need to access (e.g., logged-in user info, current study session).

**What to learn:**
- Slices: `createSlice` to define state, reducers, and actions
- Store configuration with `configureStore`
- Using `useSelector` to read state and `useDispatch` to dispatch actions
- Handling asynchronous logic via thunks or in the API layer

### React Hook Form + Zod
Makes form handling efficient and robust.

**What to learn:**
- Registering form inputs with `useForm`
- Form validation with Zod schemas (e.g., defining min/max length, email format, required fields)
- Error display

---

## Design System

### Aesthetic
The app uses a "Modern Scholarly Warm" aesthetic. This means:
- Warm, approachable color palette
- Typography with serif headings (Fraunces) and sans-serif body (Inter)
- Generous whitespace and clean card-based layouts

### Tailwind Extensions
The project customizes Tailwind in `tailwind.config.js`:
- **Custom fonts**: Serif headings, sans-serif body, monospace for code
- **Custom colors**: Uses CSS variables that change between light/dark modes
- **Shadows & animations**: Custom card shadows (e.g., `shadow-card`) and animation keyframes (e.g., `shimmer-slide`)

### Dark Mode
Implemented by toggling a `dark` class on a parent element. Tailwind then applies `dark:` prefixed utility classes. Colors are managed through CSS variables that swap values based on the mode.

### Mobile-First & Accessibility
- **Responsive**: Layouts are designed mobile-first (minimum 360px viewport) and then enhanced for larger screens with `md:` / `lg:` breakpoints.
- **Touch targets**: Interactive elements are at least `44x44px` (`2.75rem` in Tailwind).
- **Keyboard navigation**: All interactive elements are focusable and usable with the keyboard.
- **ARIA**: Proper roles and labels for screen readers (via HeadlessUI and manual additions).

---

## Reference Material

### Official Docs & Learning
| Topic | Resource |
|-------|----------|
| **React 18** | [React Docs](https://react.dev) -- The official, interactive documentation |
| **Vite** | [Vite Guide](https://vitejs.dev/guide/) -- Fast dev server & build tool |
| **Tailwind CSS** | [Tailwind Docs](https://tailwindcss.com/docs) -- Utility-first CSS |
| **React Router DOM** | [RRD Docs](https://reactrouter.com) -- SPA routing |
| **Axios** | [Axios Docs](https://axios-http.com/docs/intro) -- HTTP client |
| **Redux Toolkit** | [Redux Toolkit Docs](https://redux-toolkit.js.org/) -- State management |
| **React Hook Form** | [RHF Docs](https://www.react-hook-form.com/get-started/) -- Forms |
| **Zod** | [Zod Docs](https://zod.dev/) -- Schema validation |
| **Recharts** | [Recharts Docs](https://recharts.org/en-US/) -- Charting library |
| **Lucide Icons** | [Lucide Icons](https://lucide.dev/) -- Icon library |
| **Microsoft Clarity** | [Clarity Docs](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup) -- Analytics & heatmaps |

### AskAide AI Specific
| Resource | Location |
|----------|----------|
| Project README | `/README.md` |
| Frontend Architecture | AskAide Docs: `docs/frontend/architecture.md` |
| Getting Started | AskAide Docs: `docs/reference/getting-started.md` |
| API Integration | AskAide Docs: `docs/frontend/development/api-integration.md` |
| Styling Guide | AskAide Docs: `docs/frontend/development/styling-guide.md` |
| Component Library | AskAide Docs: `docs/frontend/development/component-library.md` |
| Backend API Docs | AskAide Docs: `docs/shared-contracts/api-definitions.md` |

### Recommended Learning Path
1. **Learn React fundamentals** (JSX, hooks, props, state)
2. **Learn Tailwind CSS** (utility classes, responsiveness)
3. **Learn React Router** (navigation in SPAs)
4. **Learn Axios basics** (GET/POST requests)
5. **Learn Redux Toolkit** (slices, store, dispatch/select)
6. **Learn React Hook Form + Zod** (forms and validation)
7. **Study the project structure** (`src/`, `api/`, `store/`)
8. **Explore an existing feature** (e.g., login, study session) to see how pieces fit together
