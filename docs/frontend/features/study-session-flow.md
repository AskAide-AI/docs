# Frontend Study Session Flow - Automation Testing Guide

This document provides **CSS selectors** and flow information for automating the study session on the AskAideAI frontend platform.

---

## Component Type: HeadlessUI Listbox (NOT native `<select>`)

The dropdowns use **[@headlessui/react](https://headlessui.com/) Listbox** components with custom React click handlers.

---

## CSS Selectors Configuration

```javascript
const STUDY_CONFIG_SELECTORS = {
  // ============================================
  // CLASS DROPDOWN
  // ============================================
  classDropdown: {
    // Container: Find by label text "Class"
    container: 'div:has(> label:text("Class"))',
    
    // Trigger button (HeadlessUI Listbox.Button)
    trigger: 'button.rounded-xl',  // First .rounded-xl button with "Select class" text
    triggerByText: 'button:has-text("Select class")',
    
    // Dropdown options container (appears after click)
    optionsList: '[role="listbox"]',
    
    // Individual option items
    option: '[role="option"]',
    
    // Selected option has this child visible
    selectedIndicator: 'svg.lucide-check',
  },

  // ============================================
  // SUBJECT DROPDOWN  
  // ============================================
  subjectDropdown: {
    container: 'div:has(> label:text("Subject"))',
    trigger: 'button:has-text("Select subject")',
    triggerDisabled: 'button:has-text("—")',  // When class not selected
    optionsList: '[role="listbox"]',
    option: '[role="option"]',
  },

  // ============================================
  // CHAPTER DROPDOWN
  // ============================================
  chapterDropdown: {
    container: 'div:has(> label:text("Chapter"))',
    trigger: 'button:has-text("Choose a chapter")',
    triggerDisabled: 'button:has-text("Select subject first")',
    optionsList: '[role="listbox"]',
    option: '[role="option"]',
  },

  // ============================================
  // QUESTION TYPE DROPDOWN
  // ============================================
  questionTypeDropdown: {
    container: 'div:has(> label:text("Question Type"))',
    trigger: 'button:has-text("Multiple Choice")',  // Default selected
    optionsList: '[role="listbox"]',
    option: '[role="option"]',
    options: {
      mcq: '[role="option"]:has-text("Multiple Choice")',
      fillblanks: '[role="option"]:has-text("Fill in Blanks")',
    }
  },

  // ============================================
  // DIFFICULTY DROPDOWN
  // ============================================
  difficultyDropdown: {
    container: 'div:has(> label:text("Difficulty"))',
    trigger: 'button:has-text("Medium")',  // Default selected
    optionsList: '[role="listbox"]',
    option: '[role="option"]',
    options: {
      easy: '[role="option"]:has-text("Easy")',
      medium: '[role="option"]:has-text("Medium")',
      hard: '[role="option"]:has-text("Hard")',
    }
  },

  // ============================================
  // START BUTTON
  // ============================================
  startButton: {
    enabled: 'button:has-text("Start Learning"):not([disabled])',
    disabled: 'button:has-text("Start Learning")[disabled]',
    selector: 'button:has-text("Start Learning")',
    // Alternative: by gradient class
    byClass: 'button.bg-gradient-to-r',
  },

  // ============================================
  // QUESTION POLLING STATES (useQuestionPolling hook)
  //   Returned states:
  //     loading      → full-screen skeleton (initial load only)
  //     isGenerating → inline spinner + typewriter messages
  //     inlineError  → inline error bubble (mid-session, non-blocking)
  //     error        → full-screen error (initial load failure)
  //     mastered     → positive terminal (chapter tapped out)
  //     retryCount   → number of failed-generation retries attempted
  //   Entry point: loadQuestions(isPolling)
  //     true  → suppress full-screen loader (next-batch fetch)
  //     false → show full-screen loader (initial load)
  // ============================================
  loading: {
    configLoading: 'text="Setting up your study session..."',
    spinner: 'svg.animate-spin',
  },

  // ============================================
  // ERROR STATE
  // ============================================
  error: {
    container: '[role="alert"]',
    message: '[role="alert"] p',
  }
};
```

---

## Question Polling State Machine

The `useQuestionPolling` hook (see `src/hooks/useQuestionPolling.js`) drives question loading with these states:

| State | UI Treatment | Meaning |
|---|---|---|
| `loading=true` | Full-screen skeleton | Initial load before first batch arrives |
| `isGenerating=true` | Inline spinner + typewriter morphing messages | Backend reports `"generating"`; polling every 5s |
| `inlineError` set | Inline error bubble (mid-session, non-blocking) | A batch fetch failed after questions were already shown |
| `error` set | Full-screen error with "Try Again" button | Initial load failed before questions ever appeared |
| `mastered=true` | Inline celebration banner (Trophy icon) | Chapter tapped out; see **Mastered State** below |
| `retryCount` | Hidden; drives retry limit UX | Number of `"failed"` re-kicks attempted (max 2) |

**Entry point:** `loadQuestions(isPolling)`
- `isPolling=false` (default): Shows full-screen skeleton — use for the very first load.
- `isPolling=true`: Suppresses full-screen loader — use for next-batch fetches so the chat history doesn't flash white.

---

## Batch Endpoint Response Format

`GET /questions/batch/chapter/:chapterId/type/:type/difficulty/:difficulty/session/:sessionId`
[`src/api/endpoints.js:33`]

The endpoint is a **fast status check** — it NEVER blocks on AI generation. The batch result lives inside the standard envelope:

```json
{
  "success": true,
  "message": "...",
  "data": {
    "success": true,
    "data": [],
    "status": "generating | failed | mastered",
    "message": "..."
  }
}
```

### Status-Field Values

| Value | Meaning | Hook Behaviour |
|---|---|---|
| Absent / `undefined` + non-empty `data` array | Questions are ready | Stop polling, render questions immediately |
| `"generating"` | AI is still generating; check back later | Keep polling every 5s (max 60 polls ≈ 5 min total budget) |
| `"failed"` | Generation failed; backend can retry | Re-kick once with `retry=true`, then resume polling (max 2 retries, then give up with inline error) |
| `"mastered"` | All questions exhausted for this selection | Terminal; set `mastered=true` — celebrate, don't error (see below) |

---

## Mastered State

`mastered` is a **positive terminal state** — not an error. It means the student has answered every question the AI can generate for the current selection (chapter + difficulty + question type).

**UI treatment:** An inline celebration message with a Trophy icon: "🏆 You've mastered this selection!" plus a "Finish & see results" button.

**Key behaviours:**
- **Auto-reset:** `mastered` resets to `false` when `session.chapterId`, `session.difficulty`, or `session.questionType` changes (effect lives in the `useQuestionPolling` hook's cleanup `useEffect` at `src/hooks/useQuestionPolling.js:283-289`).
- **Yield-based, not cap-based:** There is no `CONTENT_CAP` or fixed-number limit. Mastery is determined by the backend's yield-based exhaustion — the student gets every question the AI can generate for that selection.
- **Edge case — pre-load mastery:** If the backend returns `mastered` before the student ever saw a question, the hook surfaces: "No questions are available for this selection yet. Please try again later." instead of the celebration banner.

---

## Playwright-Specific Selectors

```javascript
const PLAYWRIGHT_SELECTORS = {
  // By label text (most reliable)
  classDropdown: {
    trigger: 'div:has(label:text-is("Class")) button',
    options: 'ul[role="listbox"] li[role="option"]',
  },
  
  subjectDropdown: {
    trigger: 'div:has(label:text-is("Subject")) button',
    options: 'ul[role="listbox"] li[role="option"]',
  },
  
  chapterDropdown: {
    trigger: 'div:has(label:text-is("Chapter")) button',
    options: 'ul[role="listbox"] li[role="option"]',
  },
  
  questionType: {
    trigger: 'div:has(label:text-is("Question Type")) button',
  },
  
  difficulty: {
    trigger: 'div:has(label:text-is("Difficulty")) button',
  },
  
  startButton: 'button:has-text("Start Learning")',
};
```

---

## How to Select an Option Programmatically

### Step-by-Step Flow:

```javascript
// Playwright example
async function selectDropdownOption(page, labelText, optionText) {
  // 1. Find and click the dropdown trigger
  const trigger = page.locator(`div:has(label:text-is("${labelText}")) button`);
  await trigger.click();
  
  // 2. Wait for dropdown to appear
  await page.waitForSelector('[role="listbox"]', { state: 'visible' });
  
  // 3. Click the desired option
  const option = page.locator(`[role="option"]:has-text("${optionText}")`);
  await option.click();
  
  // 4. Wait for dropdown to close
  await page.waitForSelector('[role="listbox"]', { state: 'hidden' });
}

// Usage:
await selectDropdownOption(page, 'Class', '10th');
await selectDropdownOption(page, 'Subject', 'Science');
await selectDropdownOption(page, 'Chapter', 'Light');
```

---

## Selection Flow Order (REQUIRED)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CLASS          2. SUBJECT         3. CHAPTER                │
│  (required)   ──►  (enabled after) ──► (enabled after)          │
│                    class selected      subject selected         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. QUESTION TYPE      5. DIFFICULTY       6. START BUTTON      │
│  (optional, default    (optional, default  (enabled when        │
│   = mcq)                = Medium)           1,2,3 selected)     │
└─────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Subject dropdown is DISABLED until Class is selected.**
> **Chapter dropdown is DISABLED until Subject is selected.**
> **Start button is DISABLED until Class + Subject + Chapter are selected.**

---

## Disabled State Detection

```javascript
// Detect if dropdown is disabled
const isDisabled = await page.locator('div:has(label:text-is("Subject")) button')
  .evaluate(el => el.classList.contains('opacity-60') || el.classList.contains('cursor-not-allowed'));

// Alternative: check for disabled attribute or aria-disabled
const buttonDisabled = await page.locator('button:has-text("Select subject")').isDisabled();
```

---

## Wait Conditions Between Selections

| Action | Wait For |
|--------|----------|
| After page load | `text="Setting up your study session..."` disappears |
| After selecting Class | Subject dropdown becomes enabled (no `opacity-60` class) |
| After selecting Subject | Chapter dropdown becomes enabled |
| After selecting Chapter | Start button loses `disabled` attribute |
| After clicking Start | Session created + `QuestionPractice` component appears |

```javascript
// Example wait after class selection
await page.click('div:has(label:text-is("Class")) button');
await page.click('[role="option"]:has-text("10th")');

// Wait for subject dropdown to be enabled
await page.waitForFunction(() => {
  const btn = document.querySelector('div:has(label:text-is("Subject")) button');
  return btn && !btn.classList.contains('opacity-60');
});
```

---

## Complete Automation Example

```javascript
async function startStudySession(page, config) {
  const { className, subject, chapter, questionType, difficulty } = config;
  
  // Navigate to study page
  await page.goto('/study');
  
  // Wait for configuration to load
  await page.waitForSelector('button:has-text("Select class")', { timeout: 10000 });
  
  // 1. Select Class
  await page.click('div:has(label:text-is("Class")) button');
  await page.waitForSelector('[role="listbox"]');
  await page.click(`[role="option"]:has-text("${className}")`);
  await page.waitForTimeout(300); // Animation settle
  
  // 2. Select Subject (wait for it to be enabled)
  await page.waitForSelector('div:has(label:text-is("Subject")) button:not(.opacity-60)');
  await page.click('div:has(label:text-is("Subject")) button');
  await page.waitForSelector('[role="listbox"]');
  await page.click(`[role="option"]:has-text("${subject}")`);
  await page.waitForTimeout(300);
  
  // 3. Select Chapter
  await page.waitForSelector('div:has(label:text-is("Chapter")) button:not(.opacity-60)');
  await page.click('div:has(label:text-is("Chapter")) button');
  await page.waitForSelector('[role="listbox"]');
  await page.click(`[role="option"]:has-text("${chapter}")`);
  await page.waitForTimeout(300);
  
  // 4. (Optional) Change Question Type
  if (questionType && questionType !== 'mcq') {
    await page.click('div:has(label:text-is("Question Type")) button');
    await page.waitForSelector('[role="listbox"]');
    await page.click(`[role="option"]:has-text("Fill in Blanks")`);
  }
  
  // 5. (Optional) Change Difficulty
  if (difficulty && difficulty !== 'Medium') {
    await page.click('div:has(label:text-is("Difficulty")) button');
    await page.waitForSelector('[role="listbox"]');
    await page.click(`[role="option"]:has-text("${difficulty}")`);
  }
  
  // 6. Click Start Learning
  await page.waitForSelector('button:has-text("Start Learning"):not([disabled])');
  await page.click('button:has-text("Start Learning")');
  
  // 7. Wait for session to start (question practice component)
  await page.waitForSelector('[data-testid="question-practice"]', { timeout: 30000 });
}
```

---

## Option Values Reference

### Question Types
| Display Text | Value |
|--------------|-------|
| Multiple Choice | `mcq` |
| Fill in Blanks | `fillblanks` |

### Difficulties
| Display Text | Value |
|--------------|-------|
| 🟢 Easy | `Easy` |
| 🟡 Medium | `Medium` |
| 🔴 Hard | `Hard` |

---

## HeadlessUI Listbox DOM Structure

```html
<!-- Dropdown Container -->
<div class="relative">
  <label class="...">Class</label>
  
  <!-- Listbox wrapper -->
  <div class="relative mt-1">
    
    <!-- Trigger Button (Listbox.Button) -->
    <button class="rounded-xl bg-white dark:bg-slate-800 py-2.5 pl-4 pr-10 ...">
      <span class="block truncate">Select class</span>
      <span class="...">
        <svg><!-- ChevronDown icon --></svg>
      </span>
    </button>
    
    <!-- Options List (Listbox.Options) - appears on click -->
    <ul role="listbox" class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl ...">
      
      <!-- Individual Option (Listbox.Option) -->
      <li role="option" class="cursor-pointer select-none py-2.5 pl-10 pr-4 ...">
        <span class="block truncate">10th</span>
        <!-- Check icon if selected -->
        <span class="..."><svg class="lucide-check">...</svg></span>
      </li>
      
      <!-- More options... -->
    </ul>
  </div>
</div>
```

---

## Files Reference

| Component | Path |
|-----------|------|
| Dropdown (HeadlessUI) | `src/components/ui/Dropdown.jsx` |
| StudyConfig | `src/components/study/StudyConfig.jsx` |
| Home | `src/components/study/Home.jsx` |
| QuestionPractice | `src/components/study/QuestionPractice.jsx` |
| useQuestionPolling | `src/hooks/useQuestionPolling.js` |
| Endpoints | `src/api/endpoints.js` |
| Study API | `src/api/study.api.js` |
