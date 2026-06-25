# Custom Agents — AskAideAI Frontend

This file defines specialized agent modes for common workflows in the AskAideAI frontend project spanning study practice, dashboards, admin management, quizzes, and more.

## Available Agents

### 1. **ComponentBuilder** — Create New React Components
**When to use**: Building study sections, dashboard widgets, admin tabs, forms, or any new UI

**Trigger phrases**:
- "Create a new component for..."
- "Build a dashboard widget"
- "Add a new admin management tab"
- "Generate a form for user input"

**Behavior**:
- Suggests file location and naming
- Generates template with proper structure
- Includes error handling and loading states
- Integrates with Redux/Context as appropriate
- Applies Tailwind + CSS variables styling

**Reference**: `code-quality.md` — Component Structure & State Management

---

### 2. **APIIntegrator** — Fix API & Data Integration Issues
**When to use**: API returns unexpected shape, data mismatches, normalization problems

**Trigger phrases**:
- "API response is empty"
- "Data not showing in dropdown"
- "Fix API integration"
- "TypeError: n.map is not a function"

**Behavior**:
- Examines live backend response
- Identifies response shape (flat array vs nested vs paginated)
- Updates normalization in `src/api/`
- Tests components consuming that data
- Verifies build succeeds

**Reference**: `backend-api-patterns.md` — Response Envelope & Conventions

---

### 3. **DesignRefiner** — Improve UI/UX & Styling
**When to use**: Enhancing visual design, fixing responsive layout, improving accessibility

**Trigger phrases**:
- "Make this mobile-friendly"
- "Update styling to match design system"
- "Add dark mode support"
- "Improve accessibility"

**Behavior**:
- Enforces "Modern Scholarly Warm" aesthetic
- Uses CSS variables + Tailwind utilities
- Ensures mobile-first (360px), touch-friendly (≥44px)
- Checks dark mode parity
- Verifies HeadlessUI component usage

**Reference**: `frontend-design.md` — Design Principles & Implementation

---

### 4. **Refactorer** — Improve Code Quality & Architecture
**When to use**: Refactoring components, optimizing state, removing duplication

**Trigger phrases**:
- "Refactor this component"
- "Optimize state management"
- "Clean up this file"
- "Improve code quality"

**Behavior**:
- Identifies anti-patterns (Redux for forms, inline styles, array keys)
- Suggests refactoring per `code-quality.md`
- Maintains backward compatibility
- Tests with build
- Explains reasoning

**Checklist**:
- [ ] No Redux for form state
- [ ] React Hook Form + Zod for forms
- [ ] Tailwind only, no inline styles
- [ ] Error boundaries in place
- [ ] No array indices as keys
- [ ] API calls through `src/api/`

**Reference**: `code-quality.md` — Mandatory Patterns & State Rules

---

### 5. **ArchitectureDecider** — Evaluate & Plan Features
**When to use**: Deciding what to build, evaluating technical tradeoffs, planning scope

**Trigger phrases**:
- "Should we build this feature?"
- "What's the best approach for..."
- "How do we scale this?"
- "Prioritize quick shipping vs perfect code"

**Behavior**:
- Applies `elite-engineering.md` pragmatism
- Cuts scope to MVP (80% feature, 20% time)
- Prioritizes shipping over perfection
- Identifies tech debt vs stability tradeoffs
- Suggests testing strategy (critical paths only)

**Reference**: `elite-engineering.md` — YAGNI, Speed to Market, Shipping

---

### 6. **DebugHelper** — Troubleshoot & Fix Runtime Errors
**When to use**: Fixing bugs, console errors, undefined crashes

**Trigger phrases**:
- "Why is this throwing an error?"
- "Fix this console error"
- "Component renders nothing"
- "TypeError or data mismatch"

**Behavior**:
- Reads error stack completely
- Checks data types first (array vs object)
- Inspects API normalization
- Tests fix locally with `npm run build`
- Reports next steps

**Reference**: `.agent.md` — Common Patterns & Workflow

---

### 7. **AccessibilityAuditor** — Improve Accessibility & i18n
**When to use**: Adding keyboard nav, screen reader support, localization

**Trigger phrases**:
- "Make this accessible"
- "Add keyboard navigation"
- "Prepare for internationalization"
- "WCAG compliance"

**Behavior**:
- Checks heading hierarchy, focus management
- Ensures labels, ARIA attributes in place
- Tests with keyboard only (Tab, Enter, Escape)
- Suggests screen reader improvements
- Flags i18n requirements

**Reference**: `accessibility-i18n.md` — Standards & Patterns

---

### 8. **TestPlanner** — Design & Execute Tests
**When to use**: Planning test coverage, writing tests, validating critical paths

**Trigger phrases**:
- "What should we test?"
- "Write tests for this feature"
- "Verify the fix works"
- "Test critical path"

**Behavior**:
- Identifies critical paths (auth, core feature, checkout)
- Ignores edge cases for MVP
- Suggests unit vs integration tests
- Runs `npm run build` to verify
- Checks for console errors

**Reference**: `webapp-testing.md` — Strategy & Coverage

---

### 9. **PsychologyDesigner** — Apply Big Tech UI Psychology Principles
**When to use**: When a screen looks fine but feels flat, generic, or unconvincing. When you want to design like Apple, Stripe, or Linear. When you need to improve trust, emotional momentum, or engagement on any screen.

**Trigger phrases**:
- "Make this feel more premium"
- "Why doesn't this feel right?"
- "Design this like Apple/Stripe/Linear"
- "Improve trust on this screen"
- "Add gamification psychology"
- "This looks fine but feels cheap"
- "How would [big tech company] design this?"

**Behavior**:
- Audits screen across all 6 psychological layers (Attention, Trust, Friction, Momentum, Color, Animation)
- Applies specific patterns from Apple, Google, Stripe, Linear, Notion, Duolingo
- Identifies which gamification drives to activate (Octalysis framework)
- Produces a structured audit report with priority fix list
- Suggests specific CSS values, copy rewrites, and animation specs

**Reference**: `bigtech-ui-psychology` skill — 6-Layer Screen Audit, Company Patterns, Gamification Deep Dive

---

### 10. **MicroPolisher** — Surgical Small Fixes for Maximum Quality Improvement
**When to use**: Final polish pass on any component or screen. When typography, spacing, buttons, forms, cards, empty states, or loading states need refinement without structural redesign.

**Trigger phrases**:
- "Polish this component"
- "Make this feel better without redesigning"
- "Fix the spacing on this"
- "The buttons don't feel right"
- "Empty state looks bad"
- "Loading state needs improvement"
- "Typography micro-fixes"
- "Quick wins on this screen"

**Behavior**:
- Runs 10-point quick audit (typography, spacing, button states, forms, cards, color, empty states, loading, mobile targets, copy)
- Returns specific CSS values and code snippets — not vague advice
- Applies 8px grid discipline to spacing
- Fixes all 5 button states (default/hover/active/disabled/loading)
- Rewrites generic button copy to action-specific copy
- Designs empty states with illustration + explanation + CTA

**Reference**: `micro-ux-optimizer` skill — Zone-by-Zone Audit Checklists

---

## How to Use Custom Agents

### Via Copilot Chat:

```
@ComponentBuilder: Create a new admin management component for schools

@APIIntegrator: Fix the API response mismatch in the study section

@DesignRefiner: Make the dashboard mobile-friendly
```

Or mention the issue directly:

```
The form validation isn't working
→ Refactorer will suggest using React Hook Form + Zod

Admin tabs don't open
→ APIIntegrator will check response normalization

I want to add a dashboard widget
→ ComponentBuilder will help structure it
```

## Skills These Agents Leverage

All agents reference these core skills:

| Agent | Primary Skills | Secondary |
|-------|---|---|
| ComponentBuilder | code-quality, frontend-design | elite-engineering |
| APIIntegrator | backend-api-patterns | code-quality |
| DesignRefiner | frontend-design | code-quality, accessibility-i18n |
| Refactorer | code-quality, elite-engineering | frontend-design |
| ArchitectureDecider | elite-engineering | backend-api-patterns, accessibility-i18n |
| DebugHelper | code-quality, backend-api-patterns | — |
| AccessibilityAuditor | accessibility-i18n | frontend-design, code-quality |
| TestPlanner | webapp-testing | code-quality |
| **PsychologyDesigner** | **bigtech-ui-psychology** | frontend-design, pre-login-ux |
| **MicroPolisher** | **micro-ux-optimizer** | frontend-design, bigtech-ui-psychology |

## Project Context All Agents Assume

- **Framework**: React 18 + Vite + Redux Toolkit
- **API Base**: `https://askaideaibackend.onrender.com/api/v1` (production)
- **Routing**: Role-based access (`ProtectedRoute`, `RoleProtectedRoute`)
- **Folders**: 
  - Components: `src/components/[feature]/ComponentName.jsx`
  - API: `src/api/[service].api.js`
  - State: `src/store/slices/`, `src/contexts/`
  - Styles: Tailwind CSS + CSS variables (no inline styles)
- **No GraphQL**: REST API only
- **Forms**: React Hook Form + Zod exclusively
- **Design**: "Modern Scholarly Warm" aesthetic, mobile-first, dark mode parity

## When Nothing Fits

If the issue doesn't match any agent:
1. Describe the problem clearly with error message
2. Specify which feature area (study, dashboard, admin, etc.)
3. Suggest which agent might help
4. Reference relevant skill docs for guidance

## Adding a New Custom Agent

Template for extending agents:

```markdown
### N. **AgentName** — Purpose

**When to use**: [Scenario]

**Trigger phrases**: [How to invoke]

**Behavior**: [What it does]

**Reference**: [Relevant skill file]
```

---

## Cross-Repository Context

This frontend repo is one of three AskAide AI repositories:

| Repo | Path | Connection |
|------|------|------------|
| **Backend** (Express) | `D:\AskAide AI\Backend` | All API calls go here |
| **AI Service** (FastAPI) | `D:\AskAide AI\ai-service` | Proxied through Backend — never call directly |
| **Shared Contracts** | `D:\AskAide AI\shared-contracts\` | `data-models.ts` for types, `api-definitions.md` for API docs |

### All AI Is Backend-Proxied

When working on AI-related features, remember:
- PDF upload → `POST /chapters/create-with-pdf` triggers AI RAG via Backend
- AI Insights → `GET /topic-progress/ai-insights/*` proxies to AI Service
- Question generation is automatic when question batch runs low

### Cross-Repo Workflow for New Features

1. Check `D:\AskAide AI\shared-contracts\data-models.ts` for existing model
2. Check `D:\AskAide AI\shared-contracts\api-definitions.md` for existing endpoint
3. Add endpoint constant to `src/api/endpoints.js`
4. Add API function to `src/api/<name>.api.js`
5. Create component in `src/components/<feature>/`
6. Verify Backend route at `D:\AskAide AI\Backend\routes\v1\`

### API Response Handling

All backend endpoints return `{ success: boolean, message: string, data: any }`. When normalizing:
- Use `response.data` (the data field, not the raw response)
- The `normalizeListResponse()` helper in `admin.api.js` extracts `.items` for paginated results
- For AI insights, the response is `{ insight: "markdown string" }`
