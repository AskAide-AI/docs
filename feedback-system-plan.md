# Feedback System Enhancement Plan

## Current State (What Already Exists)

| Mechanism | Location | Friction | Trigger |
|-----------|----------|----------|---------|
| Emoji reactions (😊 😐 😞) | `SessionFeedbackWidget.jsx` after each session | 1 tap | Every session end |
| NPS survey (0-10) | `SessionFeedbackWidget` NPS flow | 1 tap | Session 5, then every 20 |
| General feedback form | `/feedback` page | 3+ fields | User navigates to it |
| Admin metrics (sentiment + NPS) | `adminMetrics.service.js` | — | Dashboard load |

---

## Module Structure

All new feedback-related backend code lives under a single dedicated module — not under `progress/` or `supporting/`:

```
Backend/src/modules/feedback/
  models/
    inlineFeedback.model.js
    suggestion.model.js
    suggestionUpvote.model.js
  services/
    inlineFeedback.service.js
    behavioralSignals.service.js
    suggestion.service.js
  controllers/
    inlineFeedback.controller.js
    suggestion.controller.js
  routes/
    inlineFeedback.routes.js
    suggestion.routes.js
```

---

## Phase 1 — Inline Contextual Feedback (Micro-Feedback)

**Goal:** Let users give feedback on specific features/pages without leaving context.

### Backend

1. **New model** `Backend/src/modules/feedback/models/inlineFeedback.model.js`
   - Fields: `userId`, `feature` (string key like `question_explanation`, `performance_graph`, `daily_challenge`), `reaction` (positive/negative), `context` (optional JSON for extra data like `{ questionId, subject }`), `feedbackType` (feature_reaction)
   - Compound index: `{ userId, feature }` sparse unique — one vote per feature per user

2. **New service** `Backend/src/modules/feedback/services/inlineFeedback.service.js`
   - `submitReaction(feature, userId, reaction, context)` — upsert
   - `getFeatureSentiment(feature)` — aggregate positive/negative per feature
   - `getAllFeatureSentiment()` — aggregate across all features

3. **New controller + routes** under `/api/v1/inline-feedback/`

   | Method | Route | Auth | Description |
   |--------|-------|------|-------------|
   | `POST` | `/` | student, teacher | Submit inline reaction |
   | `GET` | `/sentiment/:feature` | admin | Sentiment for one feature |
   | `GET` | `/sentiment` | admin | All features sentiment |

   **Rate limit:** 10 inline reactions per user per minute (Express rate-limit middleware on the POST route) to prevent spam.

### Frontend

4. **New component** `Frontend/src/components/feedback/InlineFeedback.jsx`
   - Small thumbs up/down at the bottom of feature cards
   - Props: `feature` (string key), `context` (optional JSON), `position` (bottom-right / inline)
   - **Optimistic UI:** highlight the selected reaction immediately on tap, revert if the API call fails
   - On success: shows brief "Thanks!" then fades out after 2s

5. **Place in key surfaces:**
   - Question explanation panel → `question_explanation`
   - Performance charts (student dashboard) → `performance_graph`
   - Daily challenge card → `daily_challenge`
   - AI assistant answer → `ai_assistant`
   - Badge/achievement notification → `achievement`

6. **API integration** `Frontend/src/api/feedback.api.js` (new file)
   - `submitInlineReaction(feature, reaction, context)`
   - `getFeatureSentiment(feature)`

**Design principle:** 0.5s decision time. No text, no modal. Just thumbs up/down. Collecting feedback == clicking like on a tweet.

---

## Phase 2 — Smart Passive Signals + Behavioral Triggers

**Goal:** Infer satisfaction from behavior so we don't need to ask. Trigger feedback prompts at high-signal moments only.

### Backend

7. **New service** `Backend/src/modules/feedback/services/behavioralSignals.service.js`
   - `getSignalScore(userId)` — analyzes recent activity and returns a "should ask" score (0–100):
     - Session abandonment rate (< 50% questions answered) = +20
     - Rapid re-answering wrong questions (same question attempted > 2× within 60s) = +10
     - Long session (> 30 min, > 30 questions answered) = −10 (engaged)
     - Streak milestone reached (7-day streak) = −15 (happy)
     - Question accuracy dropped > 20% vs previous session = +25
   - `shouldPromptFeedback(userId, promptType)` — returns true if `signalScore > 30` AND NPS cooldown is not active
   - **Threshold note:** The score weights above are starting estimates. Log raw scores for 2 weeks before hardcoding thresholds — tune based on observed prompt-to-response rates.

8. **Extend existing** `sessionFeedback.service.js`:
   - `shouldShowNps()` → also checks behavioral signal score
   - Add `getUserTrend(userId, days=14)` — returns satisfaction trend direction

### Frontend

9. **New component** `Frontend/src/components/feedback/FeedbackPrompt.jsx`
   - Smart feedback trigger component
   - Not shown as a modal — shown as a subtle inline banner at the top of the study page
   - Copy changes based on signal: "Noticed things got harder — how are you feeling?" vs "You're on fire! Enjoying the app?"
   - Dismissible with X, auto-dismiss after 8s

10. **Clarity integration** `Frontend/src/utils/clarity.js`
    - Add events: `INLINE_FEEDBACK_GIVEN`, `BEHAVIORAL_PROMPT_SEEN`, `BEHAVIORAL_PROMPT_DISMISSED`

**Design principle:** Ask when the user's behavior says something changed — not on a calendar schedule. A user who just crushed 30 questions doesn't need a popup.

---

## Phase 3 — Suggestion Board / Feature Request System

**Goal:** Let users submit, upvote, and discuss feature ideas. Makes feedback feel productive.

### Backend

11. **New model** `Backend/src/modules/feedback/models/suggestion.model.js`
    - Fields: `userId`, `title` (max 120 chars, required), `description` (max 2000 chars), `category` (enum: `bug` / `feature` / `improvement`, required), `status` (enum: `under_review` / `planned` / `in_progress` / `shipped` / `declined`, default: `under_review`), `upvoteCount` (Number, default 0), `adminResponse`, `adminRespondedAt`, `isHidden` (Boolean, default false — for spam removal by admin)

12. **New model** `Backend/src/modules/feedback/models/suggestionUpvote.model.js`
    - Fields: `suggestionId`, `userId`
    - Unique compound index: `{ suggestionId, userId }` — one upvote per user per suggestion
    - **Why a separate collection:** embedding `upvoters: [userId]` in the suggestion document bloats large documents on every read and risks hitting BSON limits on popular suggestions. A separate collection keeps suggestion docs small and upvote queries fast.

13. **New service** `Backend/src/modules/feedback/services/suggestion.service.js`
    - `createSuggestion(userId, title, description, category)` — validates input lengths + enum
    - `toggleUpvote(suggestionId, userId)` — insert/delete in `SuggestionUpvote`, sync `upvoteCount` on `Suggestion`
    - `getSuggestions(filters)` — paginated, filterable by status/category, excludes `isHidden: true`
    - `getMySuggestions(userId)`
    - `adminRespond(suggestionId, status, response)` — teacher/admin action
    - `hideSuggestion(suggestionId)` — admin spam removal

14. **New controller + routes** under `/api/v1/suggestions/`

    | Method | Route | Auth | Description |
    |--------|-------|------|-------------|
    | `POST` | `/` | student, teacher | Submit suggestion |
    | `POST` | `/:id/upvote` | student, teacher | Toggle upvote |
    | `GET` | `/` | student, teacher, admin | List (paginated) |
    | `GET` | `/mine` | student, teacher | User's own suggestions |
    | `PUT` | `/:id/respond` | admin, teacher | Admin response + status update |
    | `PUT` | `/:id/hide` | admin | Hide spam/abuse |

### Frontend

15. **New component** `Frontend/src/components/pages/SuggestionBoard.jsx`
    - Route: `/suggestions`
    - Top: submit form (title + description + category picker) with client-side character count validation
    - Below: sorted list of suggestions by upvotes
    - Each item shows: title, description, upvote count (toggle button with optimistic UI), status badge, admin response
    - Status badges with colors: Under Review (yellow), Planned (blue), In Progress (purple), Shipped (green), Declined (gray)

16. **New component** `Frontend/src/components/feedback/SuggestionPrompt.jsx`
    - Small link/button in sidebar or feedback form: "Request a feature →"
    - Opens SuggestionBoard

17. **Add to navigation:**
    - Links in footer / help menu: "Give Feedback" (feedback form) + "Suggest a Feature" (suggestion board)

**Design principle:** Users are 10× more likely to suggest if they see others' suggestions getting shipped. Public status builds trust.

---

## Phase 4 — Close the Loop

**Goal:** Show users their feedback had impact, so they keep giving it.

### Backend

18. **New service methods** in `suggestion.service.js`:
    - `getRecentlyShipped(days=30)` — returns suggestions shipped in last N days
    - `getUserImpact(userId)` — returns `{ suggestionsShipped, upvotesShipped }` — only counts suggestions the user directly submitted or upvoted

19. **New endpoint** `GET /api/v1/suggestions/recently-shipped` — auth: student, teacher, admin

### Frontend

20. **New component** `Frontend/src/components/feedback/WhatsNew.jsx`
    - Route: `/whats-new`
    - Shows recently shipped suggestions with "You upvoted this" badge (only if user actually upvoted it — don't show badge otherwise)
    - "Based on your feedback" tag on items the user submitted

21. **Update SessionFeedbackWidget:**
    - After "Thanks for your feedback!" → occasional follow-up only if the user upvoted or submitted a now-shipped suggestion: "Your feedback helped us ship [feature]"
    - Links back to `/whats-new`

22. **Push notification** (future):
    - When a suggestion the user upvoted changes to "shipped", show toast: "✨ [Feature] is now live! You asked for it."

**Design principle:** Feedback is a conversation, not a transaction. If users see their input → result, they become evangelists.

---

## Phase 5 — Enhanced Admin Analytics Dashboard

### Backend

23. **Extend** `adminMetrics.service.js`:
    - Add `inlineFeedback` aggregation: feature-by-feature positive/negative ratio
    - Add `suggestions` aggregation: total, by status, by category
    - Add `behavioralSignals` aggregation: % of users with declining vs improving trends

24. **New endpoint** `GET /api/v1/admin/feedback-insights` — auth: admin only
    - Most-loved features (by inline feedback ratio)
    - Most-requested features (by suggestion upvotes)
    - Satisfaction trend (weekly NPS + sentiment moving average)

### Frontend

25. **Extend admin dashboard** `Frontend/src/components/pages/admin/...`:
    - New tab: "Feedback Insights"
    - Feature sentiment chart (bar chart: features × positive %)
    - Suggestion pipeline (funnel: submitted → under review → planned → shipped)
    - NPS trend line over time
    - Recent comments (from session feedback + suggestions)
    - **CSV export button** on each chart — for sharing with stakeholders outside the app

---

## Implementation Priority

| Phase | Effort | Impact | When |
|-------|--------|--------|------|
| Phase 1 (Inline Feedback) | Low (2–3 files each side) | High | **Now** |
| Phase 2 (Behavioral Signals) | Medium | High | Next |
| Phase 3 (Suggestion Board) | Medium | Medium | Next |
| Phase 4 (Close the Loop) | Low | High | After Phase 3 |
| Phase 5 (Admin Dashboard) | Medium | Medium | After Phase 1–3 have 2+ weeks of data |

---

## Architecture Decisions

- **No new DB needed** — all data goes into existing MongoDB (new collections, same cluster)
- **All feedback storage stays in Backend** — no external services except existing Google Sheets for general form
- **Inline feedback is one-tap** — no modals, no redirects, no friction
- **Optimistic UI on all tap targets** — react immediately, revert on API failure
- **Suggestion upvotes in a separate collection** — keeps suggestion documents small, avoids BSON bloat
- **Suggestion board is public** — builds community trust, reduces duplicate requests
- **Passive signals never ask twice in a row** — cooldown enforced server-side
- **Rate limiting on POST routes** — 10 reactions/min per user to prevent abuse

## Design Principles (From Research)

1. **Ask in the moment, not on a timer** — tied to user actions, not calendar
2. **Make it 1 tap** — emoji/thumbs up takes < 1 second
3. **Progressive cooldown** — ask less as users stay longer (your NPS already does this)
4. **Close the loop** — show impact to keep users engaged
5. **Embed, don't interrupt** — feedback lives inside the product flow
6. **Observe before asking** — use passive signals to decide WHEN to prompt
7. **Optimistic UI** — never make the user wait for a network call to see their action registered
