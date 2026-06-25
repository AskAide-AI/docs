# Copilot Instructions — AskAideAI Frontend

This file guides GitHub Copilot to provide accurate, project-aware completions for the AskAideAI frontend codebase.

## Project Identity
- **Name**: AskAideAI Frontend
- **Type**: React 18 SPA (not Next.js)
- **Build Tool**: Vite 5
- **Target**: K-12 students in India (EdTech platform)
- **Backend**: Express REST API at `https://askaideaibackend.onrender.com/api/v1`

## Code Patterns to Suggest

### 1. Component Structure
When generating new components in `src/components/`:

```jsx
import React, { useState, useEffect } from 'react';
import { [useSelector, useDispatch or just hooks] from 'react-redux';
import { useForm } from 'react-hook-form';
import { [lucide icons] } from 'lucide-react';
import { [service] } from '../../api';
import { toast } from 'react-hot-toast';

export default function ComponentName() {
  const [state, setState] = useState([]);
  
  useEffect(() => {
    // Fetch data with cancelled flag
  }, []);
  
  return &lt;div className="space-y-4">...</div>;
}
```

### 2. API Calls
Always suggest calling through `src/api/` functions, not raw Axios:

**✅ Correct:**
```javascript
const response = await adminApi.getSchools();
setSchools(response.data || []);
```

**❌ Avoid:**
```javascript
const response = await axios.get('/school');
setSchools(response.data);
```

### 3. Form Patterns
Always use React Hook Form + Zod, never form state in Redux:

```jsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
});

export default function FormComponent() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data) => {
    // Call API
  };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

### 4. Styling
Use Tailwind CSS + CSS variables, never hardcoded colors:

**✅ Correct:**
```jsx
// CSS variables for colors (dark mode aware)
&lt;div style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
  Content
</div>

// Tailwind for layout
&lt;div className="p-4 rounded-lg shadow-sm space-y-4">
```

**❌ Avoid:**
```jsx
// Hardcoded colors — breaks dark mode
&lt;div className="bg-white text-gray-800 border border-gray-200">
&lt;div className="bg-blue-500 text-white">
&lt;div className="bg-violet-500">
```

### 5. Form Components
Always use custom components, never native browser inputs:

**✅ Correct:**
```jsx
import Dropdown from '../ui/Dropdown';
import DatePicker from '../admin/overview/DatePicker';
import RangeSlider from '../ui/RangeSlider';
import ConfirmDialog from '../common/ConfirmDialog';
```

**❌ Avoid:**
```jsx
&lt;select>...</select>              // Use Dropdown
<input type="date" />              // Use DatePicker
<input type="range" />             // Use RangeSlider
window.confirm('Delete?')          // Use ConfirmDialog
```

### 6. State Management Location
- **Redux**: Auth token, user profile, session state
- **Context**: Theme (dark/light mode), sound settings
- **Local useState**: Form fields, tab active state, dropdowns
- **React Hook Form**: All form validation

### 7. Error Handling
Suggest try-catch + toast patterns:

```jsx
try {
  const response = await adminApi.createSchool(data);
  toast.success('School created successfully');
  // Update state
} catch (error) {
  toast.error(error.response?.data?.message || 'Failed to create school');
}
```

## API Response Normalization

When generating code that calls admin API list methods, remind about data shape:

**Backend returns:**
```json
{ "data": { "schools": [...], "pagination": {...} } }
```

**Component should handle:**
```javascript
const response = await adminApi.getSchools();
// response.data is always an array thanks to normalizeListResponse()
setItems(response.data || []);
```

## Component Library Usage

### Dropdowns (use HeadlessUI via existing Dropdown.jsx)
```jsx
import Dropdown from '../ui/Dropdown';

<Dropdown
  label="Select School"
  options={schools}
  value={selectedSchool}
  onChange={setSelectedSchool}
  displayValue={(s) => s.schoolName}
  keyExtractor={(s) => s._id}
/>
```

### Modals/Dialogs
Use HeadlessUI Dialog, style with Tailwind

### Forms
Use React Hook Form + Zod, never built-in HTML validation

## File Organization
- `src/components/[feature]/` — Feature-specific components
- `src/api/` — Axios wrappers, one file per service
- `src/store/slices/` — Redux state
- `src/contexts/` — Global UI state (theme, sound)
- `src/hooks/` — Custom React hooks
- `src/utils/` — Utility functions
- `docs/frontend/` — Architecture and patterns documentation

## Avoid These Patterns
1. ❌ Redux for form state
2. ❌ Direct `.map()` on potentially undefined data
3. ❌ Array index as React key
4. ❌ Inline styles in component code
5. ❌ Direct localStorage access in component render
6. ❌ Multiple API calls in single useEffect without cleanup
7. ❌ Hardcoded Tailwind colors (use CSS variables)
8. ❌ Native &lt;select> (use Dropdown component)
9. ❌ window.confirm() (use ConfirmDialog)

## Prefer These Practices
1. ✅ Normalize API responses at the API layer
2. ✅ React Hook Form for all forms
3. ✅ Error boundaries around major sections
4. ✅ Try-catch + toast for API errors
5. ✅ Skeleton/shimmer loaders for data fetching
6. ✅ Stable component keys using unique IDs
7. ✅ CSS variables for all colors (dark mode aware)
8. ✅ ConfirmDialog for all confirmations

## Related Skills
When a user asks about:
- **Component quality**: Refer to `code-quality.md`
- **API design**: Refer to `backend-api-patterns.md`
- **UI/UX**: Refer to `frontend-design.md`
- **Performance**: Refer to `elite-engineering.md`

## Common Gotchas
- **Admin panel lists empty**: Check API response normalization in `src/api/admin.api.js`
- **TypeError: n.map is not a function**: Options passed to Dropdown/map must be an array
- **Form values not updating**: Likely Redux interference; use React Hook Form exclusively
- **Dark mode not applying**: Check if CSS variables are defined in `index.css`
