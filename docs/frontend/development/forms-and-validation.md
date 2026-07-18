# Forms and Validation

> How forms are handled and validated in the AskAideAI frontend.
> Last Updated: June 25, 2026

---

## Libraries

- **Form Management:** React Hook Form (v7.56.x)
- **Validation:** Zod (v3.22.x)
- **Resolver:** @hookform/resolvers

---

## Form Pattern

### 1. Define Validation Schema
```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;
```

### 2. Create Form Component
```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data) => {
    try {
      await authService.login(data);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Login failed');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          {...register('email')}
          type="email"
          className={`w-full px-4 py-2 border rounded-lg ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && (
          <span className="text-red-500 text-sm mt-1">
            {errors.email.message}
          </span>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          {...register('password')}
          type="password"
          className={`w-full px-4 py-2 border rounded-lg ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.password && (
          <span className="text-red-500 text-sm mt-1">
            {errors.password.message}
          </span>
        )}
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-2 bg-blue-500 text-white rounded-lg"
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

## Common Validation Schemas

### Login Schema
```javascript
const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required'),
});
```

### Registration Schema
```javascript
const signupSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Must contain at least one symbol (!@#$%^&*)'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

> **Live requirements checklist:** `Signup.jsx` renders a below-field checklist (8+ chars,
> uppercase, lowercase, number, symbol) that ticks each rule green as it is met, alongside the
> existing strength meter. The enforced rule is min 8 / max 128 chars with all four character
> classes (`/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/`).

### Profile Update Schema
```javascript
const profileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z.string()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  bio: z.string()
    .max(500, 'Bio is too long')
    .optional(),
});
```

### Password Reset Schema
```javascript
const passwordResetSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

---

## Form Input Components

### Dropdown (use instead of native `<select>`)

**Always use the custom `Dropdown` component instead of native `<select>` elements.**

```jsx
import Dropdown from '@/components/ui/Dropdown';

<Dropdown
  label="Select Class"
  options={classes}
  value={selectedClass}
  onChange={setSelectedClass}
  placeholder="Choose a class"
  displayValue={(c) => c.name}
  keyExtractor={(c) => c._id}
  error={errors.classId?.message}
/>
```

### DatePicker (use instead of `<input type="date">`)

```jsx
import DatePicker from '@/components/admin/overview/DatePicker';

<DatePicker
  value={selectedDate}
  onChange={setSelectedDate}
/>
```

### RangeSlider (use instead of `<input type="range">`)

```jsx
import RangeSlider from '@/components/ui/RangeSlider';

<RangeSlider
  label="Passing Percentage"
  min={0}
  max={100}
  value={percentage}
  onChange={setPercentage}
/>
```

### DateTime Selection

For datetime inputs, combine `DatePicker` with a time dropdown:

```jsx
import DatePicker from '@/components/admin/overview/DatePicker';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`);

// Render side by side:
<div className="flex gap-3">
  <DatePicker value={date} onChange={setDate} />
  <select value={time} onChange={e => setTime(e.target.value)}>
    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
  </select>
</div>

// Combine on submit:
const deadline = `${date}T${time}:00`;
```

### Confirmation Dialogs (use instead of `window.confirm()`)

**Never use `window.confirm()` — always use `ConfirmDialog`.**

```jsx
import ConfirmDialog from '@/components/common/ConfirmDialog';

const [showDialog, setShowDialog] = useState(false);

// In your handler:
const handleDelete = () => setShowDialog(true);

// In your render:
<ConfirmDialog
  isOpen={showDialog}
  title="Delete Item"
  message="This action cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  onConfirm={() => { /* do delete */ setShowDialog(false); }}
  onCancel={() => setShowDialog(false)}
/>
```

---

## Error Display Patterns

### Inline Errors
```jsx
{errors.email && (
  <span className="text-red-500 text-sm mt-1 block">
    {errors.email.message}
  </span>
)}
```

### Input with Error State
```jsx
<input
  {...register('email')}
  className={`
    w-full px-4 py-2 border rounded-lg
    focus:outline-none focus:ring-2
    ${errors.email 
      ? 'border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:ring-blue-500'
    }
  `}
/>
```

### Toast Notifications
```jsx
import toast from 'react-hot-toast';

// Success
toast.success('Profile updated successfully');

// Error
toast.error('Failed to save changes');

// Custom
toast.custom((t) => (
  <div className={`${t.visible ? 'animate-enter' : 'animate-leave'}`}>
    Custom toast content
  </div>
));
```

---

## Form State Management

### Accessing Form State
```jsx
const {
  register,           // Register input fields
  handleSubmit,       // Handle form submission
  formState: {
    errors,           // Validation errors
    isSubmitting,     // Submission in progress
    isDirty,          // Form has been modified
    isValid,          // Form is valid
    dirtyFields,      // Which fields are dirty
    touchedFields,    // Which fields have been touched
  },
  watch,              // Watch field values
  setValue,           // Programmatically set values
  reset,              // Reset form
  setError,           // Manually set error
  clearErrors,        // Clear errors
} = useForm({
  resolver: zodResolver(schema),
  defaultValues: {},
  mode: 'onBlur',     // Validate on blur
});
```

### Watch Field Values
```jsx
const password = watch('password');

// Use watched value
<div>
  Password strength: {getPasswordStrength(password)}
</div>
```

### Programmatic Value Setting
```jsx
// Set single value
setValue('email', 'user@example.com');

// Set multiple values
reset({
  name: 'John Doe',
  email: 'john@example.com',
});
```

---

## Server-Side Errors

```jsx
const onSubmit = async (data) => {
  try {
    await authService.login(data);
  } catch (error) {
    // Set form-level error
    if (error.response?.status === 401) {
      setError('root', {
        message: 'Invalid email or password',
      });
    }
    
    // Set field-level errors from server
    if (error.response?.data?.errors) {
      error.response.data.errors.forEach((err) => {
        setError(err.field, { message: err.message });
      });
    }
  }
};

// Display root error
{errors.root && (
  <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
    {errors.root.message}
  </div>
)}
```

---

## Best Practices

1. **Use Zod for schema validation** - Type-safe and runtime validation
2. **Show errors on blur** - Use `mode: 'onBlur'` for better UX
3. **Disable submit while processing** - Prevent double submissions
4. **Clear errors on change** - Use `mode: 'onChange'` after first submit
5. **Provide helpful error messages** - Be specific about what's wrong
6. **Use toast for server errors** - Don't only rely on inline errors
7. **Reset form after success** - Clear form state when appropriate

---

*Document maintained by AskAideAI Development Team*
