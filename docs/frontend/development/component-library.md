# Component Library

> Complete reference of all reusable components in the AskAideAI frontend.
> Last Updated: October 10, 2026

---

## UI Components

### Dropdown Component

**Location:** `/src/components/ui/Dropdown.jsx`

**Purpose:** Reusable dropdown/select component for form inputs. Built on the HeadlessUI Listbox. The open list is capped at 280px, tall enough to show all 7 classes (6th–12th) without an inner scroll.

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
- `TeacherClassLinks.jsx` (class and subject for a new class link)

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

## Sharing Components

### ChallengeShareCard

**Location:** `/src/components/common/ChallengeShareCard.jsx`

**Purpose:** "Challenge a friend" for a finished practice session. Creates the challenge on tap and opens WhatsApp with its message, or copies the link.

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessionId | string | Yes | - | The finished session |
| questionCount | number | No | 0 | Answers in the session. Renders nothing below 3 (`canChallenge()`). |
| variant | `'card'` \| `'footer'` | No | `'card'` | `footer` is the compact form pinned to the bottom of the session result card |

**Features:**
- `POST /challenges`, then `wa.me` with the returned share text
- Copy-link button with a "copied" state
- Footer variant: 48px-tall buttons, shorter "Challenge a friend" label and no caption below 360px

**Used In:**
- `SessionResultModal.jsx` (`variant="footer"`)

---

### ChallengeGiftNote

**Location:** `/src/components/common/ChallengeGiftNote.jsx`

**Purpose:** Tells a friend who came in through a challenge where they stand on the way to the referral gift.

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| gift | object | No | - | `{ from, unlocked, justUnlocked, answered, goal }` from the challenge response. Renders nothing when absent. |

**Used In:**
- `ChallengePlay.jsx`, `ChallengeResults.jsx`

---

### BadgeUnlockToast

**Location:** `/src/components/common/BadgeUnlockToast.jsx`

**Purpose:** Full-screen badge popup shown before the session result card, one badge at a time.

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| badgeId | string | Yes | - | ID from `src/constants/badges.js` |
| onDismiss | function | Yes | - | Shows the next badge, or the result card after the last |
| userId | string | No | - | Current user |

A badge ID it doesn't know is skipped, so the result card behind it still opens. `src/constants/badges.js` defines 21 badges, including Challenger, Challenge Champion, Squad Starter, Squad Leader and Class Captain.

---

## Notification Components

All three read one shared store, `src/hooks/useNotifications.js` (see [State Management](./state-management.md)).

### NotificationBell

**Location:** `/src/components/notifications/NotificationBell.jsx`

**Purpose:** Bell icon button with the unread count. Opens the one `NotificationCenter`.

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| className | string | No | '' | Extra classes (e.g. `md:hidden` on the dashboard) |
| style | object | No | - | Extra inline styles |

The file also exports `UnreadBadge` (the red count, or a dot with `dot`) and `bellLabel(count)` for the accessible name ("Notifications, 3 unread").

**Used In:**
- `Navbar.jsx` (signed-in users on public pages)
- `Dashboard.jsx` (beside the greeting, phones only)
- `AppSidebar.jsx`, `BottomNav.jsx`, `MobileMenu.jsx` use `UnreadBadge` / `bellLabel` with their own buttons

---

### NotificationCenter

**Location:** `/src/components/notifications/NotificationCenter.jsx`

**Purpose:** The notification panel. Mounted once in `App.jsx` for signed-in users.

**Props:** None (open state comes from the shared store)

**Features:**
- Top sheet on phones; popover beside the bell on desktop
- Opening it loads the latest notifications and marks them all read
- Tap a row to go to its link; "Show older" for the next page
- Empty state ("Nothing yet"), error state with "Try again"
- `role="dialog"`, `aria-modal`, Escape closes, focus moves to the panel

---

### NotificationToaster

**Location:** `/src/components/notifications/NotificationToaster.jsx`

**Purpose:** Pops the newest unread notification as a toast, once. Mounted once in `App.jsx`.

**Props:** None

**Features:**
- Toasts when the app opens with news waiting and when news arrives on the next poll
- "+N more in your notifications" when several are new
- Quiet on `/study` and `/quiz/` (practice and quizzes); the toast waits until the student leaves
- Remembers the last toasted time in `localStorage` (`askaide:notifToastAt`)

---

## Profile Components

### NameEditor

**Location:** `/src/components/profile/NameEditor.jsx`

**Purpose:** Inline **Edit** for the display name (`PUT /profile/name`). 2–100 characters.

**Props:** `name` (string, current name)

---

### EmailChanger

**Location:** `/src/components/profile/EmailChanger.jsx`

**Purpose:** Two-step email change: request a 6-digit code to the new address, then confirm it.

**Props:** `email` (string, current email)

**Features:**
- Refuses the current email and invalid addresses before sending
- Shows the server's message (tries left, expired, taken)
- 60-second resend countdown and "Use a different email"

**Used In:** `Profile.jsx`

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
- Navigation links (Dashboard, Study, Progress), plus Pricing for visitors
- Notification bell for signed-in users
- User avatar with dropdown (Profile, Settings, Logout)
- Compact top-right "Log in" pill for logged-out visitors on mobile (`md:hidden`) — desktop shows the full Sign in / Try a session block
- Hidden on login/signup pages

---

### AppSidebar

**Location:** `/src/components/layout/AppSidebar.jsx`

**Purpose:** Desktop sidebar on signed-in app pages (replaces the Navbar there)

**Features:**
- Role-based nav items from `src/config/navItems.js`
- **Notifications** button with the unread count (a dot when collapsed)
- Collapse toggle (remembered in `localStorage`), theme toggle, sign out

---

### GuestMobileCTA

**Location:** `/src/components/layout/GuestMobileCTA.jsx`

**Purpose:** Persistent bottom call-to-action bar for logged-out visitors on mobile, keeping a one-tap path to the no-signup trial (`/try`) on screen after the top nav collapses to a hamburger.

**Props:** None (reads route via `useLocation`)

**Features:**
- Fixed to viewport bottom, mobile only (`md:hidden`); respects `env(safe-area-inset-bottom)`
- Single full-width "Start free — no signup →" CTA to `/try`
- Auto-hides on `/try`, `/login`, `/signup`
- Mounted from `App.jsx` only when `isPublicRoute && !user`, and not on challenge (`/c/:code`) or class join (`/join/:code`) pages

---

### BottomNav

**Location:** `/src/components/layout/BottomNav.jsx`

**Purpose:** Bottom navigation bar for mobile devices

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onOpenMenu | function | No | - | Handler to open mobile menu |

**Features:**
- Signed in: Study, the role's primary page, Dashboard, Progress, Menu. Guests: Home, Try, Blog, Login, Menu.
- Active state indication
- Menu button for additional options; for signed-in users it shows the unread notification count

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
- **Notifications** row with the unread count (signed-in users); opens the notification panel as a sheet
- Logout button

---

## Auth Components

### FitGoogleLogin

**Location:** `/src/components/auth/FitGoogleLogin.jsx`

**Purpose:** Wraps `GoogleLogin` from `@react-oauth/google`. Google's button takes a fixed pixel width, so a hard-coded 320 or 380 spills off small phones. This measures its container (with a `ResizeObserver`) and passes that width, clamped to Google's 200–400 range.

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| maxWidth | number | No | 380 | Widest the button may get |
| ...props | - | - | - | Passed to `GoogleLogin` (`onSuccess`, `onError`, `text`, …) |

**Used In:** `Login.jsx`, `Signup.jsx`, `JoinClass.jsx`, `ChallengePlay.jsx`

---

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
- New badges pop up first (`BadgeUnlockToast`), one at a time; the card opens after the last
- Total questions answered
- Correct/incorrect count
- Accuracy percentage
- Time taken
- Option to view answers or start new session
- Pinned footer that stays on screen on every phone size: **Challenge on WhatsApp** (`ChallengeShareCard variant="footer"`, sessions with 3+ answers) above the primary action

---

## Teacher Components

### TeacherClassLinks

**Location:** `/src/components/teacher/TeacherClassLinks.jsx` (route `/teacher/classes`)

**Purpose:** Create and manage class join links

**Features:**
- New link form: class, subject, optional section and class size
- Per link: WhatsApp share, copy, QR download for the projector (`qrcode.react`), joined / practised / active-this-week counts, on/off toggle
- Class report button (unlocks at a practising-students milestone) and Champion Teacher certificate progress

---

### TeacherClassReport and TeacherCertificate

**Location:** `/src/components/teacher/TeacherClassReport.jsx`, `/src/components/teacher/TeacherCertificate.jsx`, shared `/src/components/teacher/PrintSheet.jsx`

**Purpose:** Printable class progress report (`/teacher/classes/:id/report`) and certificate (`/teacher/certificate`)

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
