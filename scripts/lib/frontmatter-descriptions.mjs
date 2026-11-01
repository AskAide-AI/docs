// Hand-written page descriptions for the frontmatter pass (one per
// hand-maintained content page). The applier script (scripts/apply-frontmatter.mjs)
// pairs each with the page's H1 (title) and its sidebars.js order (sidebar_position).
// The generated contract mirror is NOT in this map — scripts/sync-contracts.mjs
// owns its frontmatter.
export const DESCRIPTIONS = {
  intro:
    'Start here: what AskAide AI is, how its three services fit together, and where to find setup guides, feature docs, and API reference.',
  'frontend/overview':
    'Landing page for the AskAide AI frontend — tech stack, architecture at a glance, key feature areas, and how it calls the AI service.',
  'frontend/architecture':
    'How the React SPA is put together: routing in App.jsx, the API layer, Redux state management, and the conventions that hold it together.',
  'frontend/lld':
    'Low-level design of the frontend: scope, code structure, routing, component and state design, and how each screen talks to the backend.',
  'frontend/features/features':
    'Catalog of shipped frontend features: authentication, the AI study experience, progress analytics, sharing and referrals, and dashboards.',
  'frontend/features/product-manual':
    'User-level manual for AskAide AI: platform capabilities, each role and its workflows, and the technical context AI assistants need.',
  'frontend/features/study-session-flow':
    'How a study session runs in the UI: selectors, the question polling state machine, batch responses, and the mastered state — for test automation.',
  'frontend/product/product-overview':
    'Product context for AskAide AI: who it serves, the core user journeys, design principles, and the anti-patterns to avoid when contributing.',
  'frontend/product/project-overview':
    'Project overview of the frontend: technology stack, architecture, key features, API integration patterns, and the current state.',
  'frontend/development/setup':
    'Set up the AskAide AI frontend locally: prerequisites, install, environment variables, and the commands to run and build the React app.',
  'frontend/development/conventions':
    'The coding conventions every frontend change follows: API calls, styling, forms and controls, state, routing, and tests.',
  'frontend/development/pages-and-routes':
    'Every route in the SPA: public, protected, and role-protected paths, route guards, and how lazy loading maps pages to URLs.',
  'frontend/development/component-library':
    'Tour of the reusable component library: UI primitives, notification, profile, and layout components, and how to share and compose them.',
  'frontend/development/state-management':
    'Redux Toolkit in the frontend: store structure, slices, provider setup, and the guidelines for when state goes in the store or stays local.',
  'frontend/development/forms-and-validation':
    'How forms are built and validated: the React Hook Form pattern, field errors, surviving server rejection, and the sign-up walkthrough.',
  'frontend/development/styling-guide':
    'How styling works in the SPA: theme configuration, color palette, typography, responsive breakpoints, and the common patterns to reuse.',
  'frontend/development/api-integration':
    'How the frontend talks to the backend: the axios client, endpoint tables, service files, response normalization, and usage examples.',
  'frontend/development/performance':
    'Frontend performance work: current targets, Vite optimizations, code splitting, memoization, image handling, and layout stability.',
  'frontend/development/accessibility':
    'Accessibility standards for the UI: keyboard navigation, semantic HTML, ARIA usage, color contrast, and accessible confirmation dialogs.',
  'frontend/development/seo-checklist':
    'The SEO and GEO checklist for the public site: infrastructure in place, page-level status, technical SEO, and India-focused geographic SEO.',
  'frontend/development/testing':
    'How the frontend is tested: the testing stack, test structure and commands, the priority matrix, and what is covered today.',
  'frontend/development/dependencies':
    'What the frontend depends on: core and dev dependencies, bundle-size impact, and the rules for adding a new dependency safely.',
  'frontend/development/deployment':
    'How the frontend ships: the production build, environment variables, hosting, the GitHub Actions pipeline, and release checklists.',
  'frontend/development/changelog':
    'Chronological changelog for the frontend: what changed in each release, from the first version to the latest unreleased work.',
  'frontend/development/troubleshooting':
    'Fixes for common frontend problems: build and dev server failures, API and data issues, routing, state management, and styling glitches.',
  'frontend/development/proposed-changes':
    'Status of proposed frontend changes: what shipped from the earlier list, what is still proposed, the technical backlog, and architecture decisions.',
  'frontend/reference/quiz-module-api':
    'Per-feature API reference for the quiz module: data models, endpoints, workflow diagrams, and error codes as the frontend consumes them.',
  'frontend/reference/teacher-dashboard-api':
    'Per-feature API reference for the teacher dashboard: assignments, subject dashboards, student lists, chapter analytics, and progress endpoints.',
  'backend/overview':
    'Landing page for the AskAide AI backend — tech stack, architecture at a glance, the response format, its modules, and AI integration.',
  'backend/architecture':
    'How the Express backend is organized: request lifecycle, middleware chain, the module pattern, the shared layer, and background jobs.',
  'backend/lld':
    'Low-level design of the backend: scope, code structure, request pipeline, module and data design, and cross-cutting auth and error handling.',
  'backend/features/features':
    'Catalog of shipped backend capabilities: authentication, content management, question paper generation, referrals, and the demo school.',
  'backend/features/question-generation-flow':
    'The cross-service contract for serving and generating practice questions: polling, the backend state machine, and yield-based mastery.',
  'backend/features/quiz-implementation':
    'How quiz mode is implemented: design decisions, database models, backend routes, response structures, and the implementation order.',
  'backend/product/PRODUCT-INTRODUCTION':
    'A plain-language introduction to AskAide AI: what the product is, who uses it, how it works, and the content structure behind it.',
  'backend/reference/system-design':
    'System design of the backend: database design, code architecture, API design, the progress tracking system, and external integrations.',
  'backend/reference/database-schema':
    'The Mongoose schema reference: core models, question and answer models, progress tracking, relationships, and supporting models.',
  'backend/development/setup':
    'Set up the AskAide AI backend locally: prerequisites, MongoDB and environment setup, database initialization, and the commands to run it.',
  'backend/development/module-reference':
    'Reference for every backend module: what each module owns, its routes and services, and the business rules it enforces for every role.',
  'backend/development/authentication':
    'How backend authentication works: JWT token structure, login and refresh flows, protected routes, RBAC role guards, and password security.',
  'backend/development/error-handling':
    'The backend error-handling contract: response format, HTTP status codes, common error scenarios, Mongoose errors, and logging.',
  'backend/development/testing':
    'How the backend is tested: the Jest stack, test structure, running tests with ESM support, the mocking pattern, and coverage by module.',
  'backend/development/dependencies':
    'What the backend depends on: core packages, validation and schema libraries, file handling, logging, email, and API documentation.',
  'backend/development/deployment':
    'How the backend ships: the build process, environment configuration, hosting on Render, pre- and post-deployment checklists, and monitoring.',
  'backend/development/troubleshooting':
    'Fixes for common backend problems: server startup, API errors, database connectivity, AI integration, testing, and environment issues.',
  'backend/development/changelog':
    'Chronological changelog for the backend: what changed in each release, from the first version to the latest unreleased work.',
  'ai-service/overview':
    'Landing page for the AI service — tech stack, architecture, core services, the processing pipeline, design rules, and its endpoints.',
  'ai-service/architecture':
    'How the FastAPI RAG service is layered: entry point, service layer, Qdrant database layer, LLM and embedding layers, and pipelines.',
  'ai-service/lld':
    'Low-level design of the AI service: scope, tech stack, package structure, component and data design, API surface, and operations.',
  'ai-service/features/ai-features-quickref':
    'Quick reference for the AI service Python API: enhanced search, learning paths, adaptive practice, Socratic discussion, concept extraction.',
  'ai-service/features/cross-repo-map':
    'Map of how the three repos connect: repository locations, integration points, shared data flows, and the environment variables on each side.',
  'ai-service/development/setup':
    'Set up the AI service locally: prerequisites, environment variables, Qdrant setup, running the FastAPI server, and configuration options.',
  'ai-service/development/eval-readme':
    'How the RAG evaluation and benchmarking suite works: quality eval with RAGAS, performance benchmarks, and the embedding A/B experiment.',
  'ai-service/development/testing-strategy':
    'The AI service testing strategy: current coverage, how to run the pytest suite, coverage gaps, and the patterns new tests should follow.',
  'ai-service/development/troubleshooting':
    'Fixes for common AI service problems: server startup, LLM provider issues, embedding failures, document upload, search, and memory limits.',
  'shared-contracts/overview':
    'Why shared contracts exist: the files that define cross-service request and response shapes, the response envelope, and the workflow.',
  'reference/hld':
    'The cross-service high-level design: system context, container and deployment views, data architecture, and the interfaces between services.',
  'reference/getting-started':
    'Get the whole platform running on one machine: prerequisites, infrastructure services, and setup for backend, AI service, and frontend.',
  'reference/user-guide':
    'How to use AskAide AI day to day, role by role: getting started plus guides for students, teachers, parents, and administrators.',
  'reference/developer-guide':
    'How to contribute across the three repos: repository layout, coding standards, and end-to-end recipes for features, endpoints, and components.',
  'reference/api-reference':
    'The full API reference for both services: authentication, every backend and AI service endpoint with request and response examples, and errors.',
  'reference/integration':
    'How the services integrate: architecture, every cross-service integration point, data flows, request formats, timeouts, and error handling.',
  'learning-resources/index':
    'Newcomer guides for AskAide AI: what each learning guide covers, how to use them, and how the pieces fit together across the stack.',
  'learning-resources/frontend-learning-guide':
    'Learn the frontend stack as used by AskAide AI: React, Redux Toolkit, Vite, styling, and the project structure that puts them together.',
  'learning-resources/backend-learning-guide':
    'Learn the backend stack as used by AskAide AI: Node.js, Express, MongoDB and Mongoose, JWT auth, and the project API conventions.',
  'learning-resources/ai-service-learning-guide':
    'Learn the AI stack as used by AskAide AI: FastAPI, Qdrant vector search, embeddings, RAG concepts, and the service project structure.',
  'learning-resources/shared-contracts-learning-guide':
    'Learn what shared contracts are and how the services stay in sync: the files, the schema mirror, and how changes flow between repos.',
};
