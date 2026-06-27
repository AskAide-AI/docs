# State Management

> How global state is managed in the AskAideAI frontend application.
> Last Updated: April 17, 2026

---

## Solution

**Library:** Redux Toolkit
**Version:** 2.7.x
**Location:** `/src/store/`

---

## Store Structure

```
src/store/
├── index.js          # Store configuration and export (combineReducers)
└── slices/
    ├── authSlice.js      # Authentication state (token, signupData)
    ├── profileSlice.js   # User profile state (user object)
    ├── sessionSlice.js   # Study session state (history, answers)
    └── aiAgentSlice.js   # AI Assistant state (conversations, messages, streaming)
```

---

## Store Configuration

**File:** `/src/store/index.js`

```javascript
import { combineReducers } from '@reduxjs/toolkit';
import sessionReducer from './slices/sessionSlice';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import aiAgentReducer from './slices/aiAgentSlice';

const rootReducer = combineReducers({
  session: sessionReducer,
  auth: authReducer,
  profile: profileReducer,
  aiAgent: aiAgentReducer,
});

export default rootReducer;
```

---

## Slices

### Auth Slice
**File:** `/src/store/slices/authSlice.js`

**Purpose:** Manages user authentication state

**State Shape:**
```typescript
{
  signupData: object | null,   // Temporary signup form data
  loading: boolean,
  token: string | null         // JWT token from localStorage
}
```

**Actions:**
| Action | Description |
|--------|-------------|
| `setSignupData(data)` | Set signup form data |
| `setToken(token)` | Store JWT token |
| `setLoading(boolean)` | Set loading state |

**Selectors:**
```javascript
// Get auth token
const token = useSelector(state => state.auth.token);

// Check if authenticated
const isAuthenticated = !!useSelector(state => state.auth.token);
```

**Persistence:**
- Token stored in `localStorage.getItem('token')` (JSON parsed)
- User data is in `profileSlice`, not `authSlice`

> **SSR Safety:** All three slices guard `localStorage` access with `typeof window !== 'undefined'` in their `initialState`. This is required for the `vite-prerender-plugin` build step which runs in Node.js. Do not add direct `localStorage` calls to `initialState` without this guard.

---

### Profile Slice
**File:** `/src/store/slices/profileSlice.js`

**Purpose:** Manages user profile data and updates

**State Shape:**
```typescript
{
  user: {
    _id: string,
    name: string,
    email: string,
    role: 'Student' | 'Parent' | 'Teacher' | 'SuperAdmin',
    image: string,
    // ... other user fields
  } | null,
  loading: boolean
}
```

**Actions:**
| Action | Description |
|--------|-------------|
| `setUser(user)` | Set user data |
| `setLoading(boolean)` | Set loading state |

**Usage Example:**
```jsx
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '@/store/slices/profileSlice';

function ProfilePage() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector(state => state.profile);
  
  const handleUpdate = async (data) => {
    const response = await profileService.update(data);
    dispatch(setUser(response.data));
  };
  
  if (loading) return <Spinner />;
  
  return <div>{user?.name}</div>;
}
```

**Persistence:**
- User data stored in `localStorage.getItem('user')` (JSON parsed)
- Initialized on app load from localStorage

---

### Session Slice
**File:** `/src/store/slices/sessionSlice.js`

**Purpose:** Manages study session state

**State Shape:**
```typescript
{
  sessionHistory: Session[],    // Array of past sessions (from localStorage)
  userAnswers: Record<string, any>,  // User answers keyed by question
  sessionStarted: boolean       // Whether a study session is active
}
```

**Actions:**
| Action | Description |
|--------|-------------|
| `setSessionHistory(history)` | Set session history (persisted to localStorage) |
| `clearSessionHistory()` | Clear session history |
| `setUserAnswers(answers)` | Record user answers |
| `setSessionStarted(boolean)` | Set session active state |
| `resetSessionStarted()` | Reset session active state |

**Usage Example:**
```jsx
import { useSelector, useDispatch } from 'react-redux';
import { setSessionStarted, setUserAnswers } from '@/store/slices/sessionSlice';

function StudyPage() {
  const dispatch = useDispatch();
  const { 
    sessionStarted, 
    currentQuestion, 
    questions 
  } = useSelector(state => state.session);
  
  const handleStart = (config) => {
    dispatch(startSession(config));
  };
  
  const handleAnswer = (answer) => {
    dispatch(submitAnswer(answer));
  };
  
  return (
    <div>
      {sessionStarted ? (
        <QuestionArea 
          onAnswer={handleAnswer} 
        />
      ) : (
        <StudyConfig onStart={handleStart} />
      )}
    </div>
  );
}
```

---

### AI Agent Slice
**File:** `/src/store/slices/aiAgentSlice.js`

**Purpose:** Manages AI Assistant widget state, conversations, and streaming responses

**State Shape:**
```typescript
{
  conversations: Conversation[],         // List of conversations
  activeConversationId: string | null,  // Currently active conversation
  messages: Message[],                  // Messages in active conversation
  streamingContent: string,             // In-progress streaming response text
  isStreaming: boolean,                 // Whether a response is being streamed
  isThinking: boolean,                  // Whether AI is processing
  error: string | null,                 // Error message
  isOpen: boolean                       // Whether the AI widget is open
}
```

**Async Thunks:**
| Thunk | Description |
|-------|-------------|
| `createConversation(title)` | Create new conversation |
| `fetchConversations()` | Fetch all conversations |
| `fetchMessages(conversationId)` | Fetch messages for a conversation |
| `deleteConversation(conversationId)` | Delete a conversation |

**Actions:**
| Action | Description |
|--------|-------------|
| `setOpen(boolean)` | Open/close AI widget |
| `toggleOpen()` | Toggle AI widget visibility |
| `setActiveConversation(id)` | Switch active conversation |
| `addMessage(message)` | Append a message to the chat |
| `updateStreamingContent(text)` | Append streaming text |
| `setStreamingContent(text)` | Set streaming content |
| `setStreaming(boolean)` | Set streaming state |
| `setThinking(boolean)` | Set thinking state |
| `setError(string)` | Set error message |
| `clearError()` | Clear error |
| `clearMessages()` | Clear messages and streaming content |

---

## Provider Setup

**File:** `/src/main.jsx`

```jsx
import { createRoot, hydrateRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

const app = (
  <HelmetProvider>
    <Provider store={store}>
      <ThemeProvider>
        <SoundProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SoundProvider>
      </ThemeProvider>
    </Provider>
  </HelmetProvider>
);

const rootElement = document.getElementById('root');
// hydrateRoot if page was prerendered, createRoot for fresh render
if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
```

---

## State Management Guidelines

### Use Redux For:
- ✅ User authentication state (token, signup data)
- ✅ User profile data (user object)
- ✅ Active study session state
- ✅ AI Assistant conversations and streaming state
- ✅ Global UI state (if needed)

### Use Local State (useState) For:
- ✅ Form inputs
- ✅ Component-specific toggles
- ✅ Temporary UI state (modals, dropdowns)
- ✅ Derived/computed data

### Use React Context For:
- ✅ Theme preferences
- ✅ Localization settings
- ✅ Feature flags

---

## Contexts

**Location:** `/src/contexts/`

The app also uses React Context for specific purposes:

### StudyContext (if present)
- Alternative to session slice for study state
- May be used for more granular control

---

## Best Practices

1. **Use selectors** to access state, never access store directly
2. **Dispatch actions** through hooks, not direct store access
3. **Keep slices focused** on single domain
4. **Use createAsyncThunk** for async operations (if needed)
5. **Persist important state** to localStorage for hydration

---

*Document maintained by AskAideAI Development Team*
