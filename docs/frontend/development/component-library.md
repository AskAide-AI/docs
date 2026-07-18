# Component Library

> Complete reference of all reusable components in the AskAideAI frontend.
> Last Updated: June 25, 2026

---

## UI Components

### Dropdown Component

**Location:** `/src/components/ui/Dropdown.jsx`

**Purpose:** Reusable dropdown/select component for form inputs

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| options | Array | Yes | - | Array of options `{value, label}` |
| value | string | Yes | - | Currently selected value |
| onChange | function | Yes | - | Handler when selection changes |
| placeholder | string | No | 'Select...' | Placeholder text |
| disabled | boolean | No | false | Disable the dropdown |
| label | string | No | undefined | Label text above dropdown |
| error | string | No | undefined | Error message to display |

**Usage Example:**
```jsx
import { Dropdown } from '@/components/ui/Dropdown';

<Dropdown
  label="Select Class"
  options={[
    { value: '9', label: '9th Grade' },
    { value: '10', label: '10th Grade' },
  ]}
  value={selectedClass}
  onChange={setSelectedClass}
  placeholder="Choose a class"
/>
```

**Used In:**
- `TeacherManagement.jsx`
- `StudentManagement.jsx`
- `SectionManagement.jsx`
- `LinkManagement.jsx`
- `StudyConfig.jsx`
- `AdminOverview.jsx` (class & subject filters)
- `StudentQuizList.jsx` (status filter)
- `QuizForm.jsx` (class, subject, show answers after)
- `TeacherQuizList.jsx` (status filter)
- `QuestionBankSelector.jsx` (difficulty & type filters)
- `CustomQuestionForm.jsx` (question type & difficulty)

---

### DatePicker Component

**Location:** `/src/components/admin/overview/DatePicker.jsx`

**Purpose:** Custom date picker that replaces the native browser `<input type="date">`. Styled with CSS variables for dark mode support.

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| value | string | Yes | - | Selected date as 'YYYY-MM-DD' |
| onChange | function | Yes | - | Handler receiving new 'YYYY-MM-DD' string |
| min | string | No | undefined | Minimum selectable date ('YYYY-MM-DD') |
| max | string | No | undefined | Maximum selectable date ('YYYY-MM-DD') |

**Usage Example:**
```jsx
import DatePicker from '@/components/admin/overview/DatePicker';

<DatePicker
  value={selectedDate}
  onChange={setSelectedDate}
  min="2024-01-01"
  max="2026-12-31"
/>
```

**Used In:**
- `AdminOverview.jsx` (date range filters)
- `QuizForm.jsx` (quiz deadline date selection)

---

### RangeSlider Component

**Location:** `/src/components/ui/RangeSlider.jsx`

**Purpose:** Custom-styled range input that replaces the native `<input type="range">`. Uses CSS variables for theming, shows current value.

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| min | number | No | 0 | Minimum value |
| max | number | No | 100 | Maximum value |
| value | number | Yes | - | Current value |
| onChange | function | Yes | - | Handler receiving new number |
| step | number | No | 1 | Step increment |
| label | string | No | undefined | Label text above slider |
| className | string | No | '' | Additional CSS classes |

**Usage Example:**
```jsx
import RangeSlider from '@/components/ui/RangeSlider';

<RangeSlider
  label="Passing Percentage"
  min={0}
  max={100}
  value={passingPercentage}
  onChange={setPassingPercentage}
/>
```

**Used In:**
- `QuizForm.jsx` (passing percentage)
- `LandingPage.jsx` (study calculator demo)

---

### ConfirmDialog Component

**Location:** `/src/components/common/ConfirmDialog.jsx`

**Purpose:** Reusable, accessible confirmation modal. Replaces `window.confirm()`. Features: focus trap, Escape key, backdrop click, screen reader support.

**Button hierarchy:** The SAFE action (cancel) is the solid accent-colored PRIMARY button. The destructive action (confirm) is a quiet outline button.

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| isOpen | boolean | Yes | - | Whether dialog is visible |
| title | string | No | 'Are you sure?' | Dialog title |
| message | string | Yes | - | Confirmation message |
| confirmLabel | string | No | 'Confirm' | Destructive action label |
| cancelLabel | string | No | 'Cancel' | Safe action label |
| onConfirm | function | Yes | - | Called when destructive action clicked |
| onCancel | function | Yes | - | Called when dismissed |

**Usage Example:**
```jsx
import ConfirmDialog from '@/components/common/ConfirmDialog';

const [showDialog, setShowDialog] = useState(false);

// Trigger
<onClick={() => setShowDialog(true)} />

// Render
<ConfirmDialog
  isOpen={showDialog}
  title="Delete Quiz"
  message="Are you sure? This cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  onConfirm={() => { handleDelete(); setShowDialog(false); }}
  onCancel={() => setShowDialog(false)}
/>
```

**Used In:**
- `TeacherQuizList.jsx` (delete quiz)
- `QuizQuestionManager.jsx` (remove question, publish quiz)
- `QuestionPaperHistory.jsx` (delete paper)
- `SectionManagement.jsx` (delete section)
- `ChapterManagement.jsx` (delete chapters)
- `QuizAttempt.jsx` (submit quiz, leave quiz)
- `ConversationSidebar.jsx` (delete conversation)

---

### Loader Component

**Location:** `/src/components/common/Loader.jsx`

**Purpose:** Branded loading spinner with glow effect. Replaces plain-text "Loading..." messages.

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| message | string | No | 'Just a moment...' | Text below spinner |

**Usage Example:**
```jsx
import Loader from '@/components/common/Loader';

if (loading) return <Loader message="Loading profile..." />;
```

**Used In:**
- `Profile.jsx`, `StudentPublicProfile.jsx`, `ReferralPage.jsx`
- `ParentDashboard.jsx`
- `QuestionPaperHistory.jsx`, `QuestionPaperGenerator.jsx`, `QuestionPaperPreview.jsx`

---

### EmptyState Component

**Location:** `/src/components/teacher/shared/EmptyState.jsx`

**Purpose:** Friendly empty states with icons, titles, descriptions, and optional action buttons.

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| type | string | No | 'subjects' | Preset type: subjects, students, chapters, activity, weakTopics |
| title | string | No | (from type) | Override title |
| description | string | No | (from type) | Override description |
| actionLabel | string | No | (from type) | Button text |
| onAction | function | No | undefined | Button click handler |
| className | string | No | '' | Additional CSS classes |

**Usage Example:**
```jsx
import EmptyState from '@/components/teacher/shared/EmptyState';

{items.length === 0 && (
  <EmptyState
    type="students"
    title="No Teachers Found"
    description="No teachers match your current filters."
  />
)}
```

**Used In:**
- `TeacherQuizList.jsx`, `TeacherStudentsList.jsx`, `TeacherWeakTopicsReport.jsx`
- `TeacherSubjectDashboard.jsx`, `TeacherSubjectSelector.jsx`, `TeacherActivityFeed.jsx`
- `TeacherManagement.jsx`, `QuestionJobsMetrics.jsx`, `RelationView.jsx`, `StudentQuizList.jsx`

---

## Common Components

### ScrollToTop

**Location:** `/src/components/common/ScrollToTop.jsx`

**Purpose:** Scrolls to top of page on route change

**Props:** None

**Usage:**
```jsx
import ScrollToTop from '@/components/common/ScrollToTop';

// In App.jsx
<ScrollToTop />
<Routes>...</Routes>
```

---

## Layout Components

### Navbar

**Location:** `/src/components/layout/Navbar.jsx`

**Purpose:** Top navigation bar for desktop with logo, links, and user menu

**Props:** None (uses Redux for auth state)

**Features:**
- Logo with link to home
- Navigation links (Dashboard, Study, Progress)
- User avatar with dropdown (Profile, Settings, Logout)
- Compact top-right "Log in" pill for logged-out visitors on mobile (`md:hidden`) — desktop shows the full Sign in / Try a session block
- Hidden on login/signup pages

---

### GuestMobileCTA

**Location:** `/src/components/layout/GuestMobileCTA.jsx`

**Purpose:** Persistent bottom call-to-action bar for logged-out visitors on mobile, keeping a one-tap path to the no-signup trial (`/try`) on screen after the top nav collapses to a hamburger.

**Props:** None (reads route via `useLocation`)

**Features:**
- Fixed to viewport bottom, mobile only (`md:hidden`); respects `env(safe-area-inset-bottom)`
- Single full-width "Start free — no signup →" CTA to `/try`
- Auto-hides on `/try`, `/login`, `/signup`
- Mounted from `App.jsx` only when `isPublicRoute && !user`

---

### BottomNav

**Location:** `/src/components/layout/BottomNav.jsx`

**Purpose:** Bottom navigation bar for mobile devices

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessionStarted | boolean | No | false | Whether a study session is active |
| onOpenMenu | function | No | - | Handler to open mobile menu |

**Features:**
- Home, Study, Progress, Profile icons
- Active state indication
- Menu button for additional options

---

### MobileMenu

**Location:** `/src/components/layout/MobileMenu.jsx`

**Purpose:** Slide-out menu for mobile navigation

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| isOpen | boolean | Yes | - | Whether menu is visible |
| onClose | function | Yes | - | Handler to close menu |

**Features:**
- Full-screen overlay
- Slide animation
- All navigation links
- Logout button

---

## Auth Components

### ProtectedRoute

**Location:** `/src/components/auth/ProtectedRoute.jsx`

**Purpose:** Wrapper that redirects unauthenticated users to login

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | ReactNode | Yes | - | Protected page content |

**Usage:**
```jsx
<Route 
  path='/dashboard' 
  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
/>
```

---

### RoleProtectedRoute

**Location:** `/src/components/auth/RoleProtectedRoute.jsx`

**Purpose:** Wrapper that restricts access based on user role

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | ReactNode | Yes | - | Protected page content |
| allowedRoles | string[] | Yes | - | Array of roles allowed to access |

**Usage:**
```jsx
<Route 
  path='/admin' 
  element={
    <RoleProtectedRoute allowedRoles={['SuperAdmin']}>
      <AdminDashboard />
    </RoleProtectedRoute>
  } 
/>
```

---

## Progress Components

### SubjectSummary

**Location:** `/src/components/progress/SubjectSummary.jsx`

**Purpose:** Card displaying subject-level progress with coverage and mastery

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| subject | object | Yes | - | Subject data with progress metrics |
| onSelect | function | No | - | Handler when subject is clicked |

**Features:**
- Subject name and icon
- Coverage percentage bar
- Mastery percentage bar
- Status badge (Strong/Moderate/Weak/Not Started)

---

### ChapterList

**Location:** `/src/components/progress/ChapterList.jsx`

**Purpose:** List of chapters within a subject with progress indicators

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| chapters | array | Yes | - | Array of chapter progress data |
| onChapterSelect | function | No | - | Handler when chapter is clicked |

---

### ChapterDetailView

**Location:** `/src/components/progress/ChapterDetailView.jsx`

**Purpose:** Detailed view of chapter progress with topic breakdown and AI insights

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| chapter | object | Yes | - | Chapter data with topics |
| onBack | function | No | - | Handler to go back to list |
| onPractice | function | No | - | Handler to start practice |

**Features:**
- Coverage and mastery metrics
- Topic list with individual progress
- AI insights (rendered as Markdown)
- "Practice Now" CTA button

---

## Study Components

### StudyConfig

**Location:** `/src/components/study/StudyConfig.jsx`

**Purpose:** Configuration panel for starting a study session

**Props:** Uses Redux store for state

**Features:**
- Class selector
- Subject selector
- Chapter selector
- Question type selector (MCQ, True/False, etc.)
- Difficulty selector
- Start session button

---

### QuestionArea

**Location:** `/src/components/study/QuestionArea.jsx`

**Purpose:** Main question display and answer input area

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| question | object | Yes | - | Current question data |
| onAnswer | function | Yes | - | Handler when user answers |
| showFeedback | boolean | No | false | Show correct/incorrect feedback |

---

### SessionResultModal

**Location:** `/src/components/study/SessionResultModal.jsx`

**Purpose:** Modal displayed at end of study session with summary

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| isOpen | boolean | Yes | - | Whether modal is visible |
| onClose | function | Yes | - | Handler to close modal |
| results | object | Yes | - | Session results data |

**Features:**
- Total questions answered
- Correct/incorrect count
- Accuracy percentage
- Time taken
- Option to view answers or start new session

---

## Admin Components

### SchoolManagement

**Location:** `/src/components/admin/SchoolManagement.jsx`

**Purpose:** CRUD interface for managing schools

**Features:**
- School list with search
- Create school form
- Edit school modal
- Delete confirmation

---

### TeacherManagement

**Location:** `/src/components/admin/TeacherManagement.jsx`

**Purpose:** Manage teachers with individual and bulk creation

**Features:**
- Teacher list with filters
- Individual teacher creation
- Bulk CSV upload
- School assignment

---

### StudentManagement

**Location:** `/src/components/admin/StudentManagement.jsx`

**Purpose:** Manage students with individual and bulk creation

**Features:**
- Student list with filters
- Individual student creation
- Bulk CSV upload
- School and class assignment

---

### SectionManagement

**Location:** `/src/components/admin/SectionManagement.jsx`

**Purpose:** Manage class sections (e.g., "9th - A")

**Features:**
- Section list by school/class
- Create section form
- Edit/delete sections

---

### LinkManagement

**Location:** `/src/components/admin/LinkManagement.jsx`

**Purpose:** Assign teachers to students with section filtering

**Features:**
- Teacher-student relationship view
- Section filter
- Bulk assignment
- Remove assignment

---

### ChapterUpload

**Location:** `/src/components/admin/ChapterUpload.jsx`

**Purpose:** Upload PDFs for AI processing

**Features:**
- File drag and drop
- Chapter metadata form
- Upload progress indicator
- AI processing status

---

### ChapterTopicView

**Location:** `/src/components/admin/ChapterTopicView.jsx`

**Purpose:** View AI-extracted chapters and topics

**Features:**
- Chapter list with topic count
- Expandable topic details
- Topic status indicators

---

*Document maintained by AskAideAI Development Team*
