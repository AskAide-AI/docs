# Forms and Validation

> How forms are handled and validated in the AskAideAI frontend.
> Last Updated: October 10, 2026

---

## Libraries

- **Form state and validation:** React Hook Form (v7.56.x), using its built-in rules (`required`, `minLength`, `maxLength`, `pattern`, `validate`)
- **Notifications:** react-hot-toast
- **Zod:** listed in `package.json`, but no file in `src/` imports it. See [Zod is not used](#zod-is-not-used).

---

## Where Each Approach Is Used

| Form | File (`src/components/`) | Approach |
|------|--------------------------|----------|
| Sign up (`/signup`) | `auth/Signup.jsx` | `useForm` + `register` rules |
| Log in (`/login`) | `auth/Login.jsx` | `useForm` + `register` rules |
| Forgot password (`/forgot-password`) | `auth/ForgotPassword.jsx` | `useState`, browser `required` |
| Reset password (`/update-password/:id`) | `auth/UpdatePassword.jsx` | `useState`, browser `required` |
| Profile name | `profile/NameEditor.jsx` | `useForm` |
| Profile email change | `profile/EmailChanger.jsx` | Two `useForm` instances |
| Admin: schools, sections, principals, links | `admin/*Management.jsx` | `useForm`; `Controller` for dropdowns in `LinkManagement` |
| Admin: bulk add teachers / students | `admin/TeacherManagement.jsx`, `admin/StudentManagement.jsx` | `useForm` + `useFieldArray` |
| Teacher quiz builder | `teacher/quiz/QuizForm.jsx` | `useState` + a `validateForm()` check |

---

## The React Hook Form Pattern

Each field gets its rules, with the error message inside the rule. There is no schema object. This is the sign-up password field:

```jsx
const { register, handleSubmit, formState: { errors }, watch } = useForm({
  defaultValues: { accountType: isTeacher ? 'Teacher' : 'Student' },
});
const password = watch('password', '');

<input
  type={showPassword ? 'text' : 'password'}
  autoComplete="new-password"
  {...register('password', {
    required: 'Password is required',
    minLength: { value: 8, message: 'Password must be at least 8 characters' },
    maxLength: { value: 128, message: 'Password must be at most 128 characters' },
    pattern: {
      value: /^(?=.*[A-Za-z])(?=.*\d)/,
      message: 'Use 8+ characters with at least one letter and one number',
    },
  })}
/>
```

Rules used across the codebase:

| Rule | Where |
|------|-------|
| `required: 'message'` | Almost every required field |
| `minLength` / `maxLength` `{ value, message }` | Sign-up password, admin bulk-add passwords |
| `pattern: { value, message }` | Sign-up password, new email, 6-digit code, admin bulk-add emails |
| `validate: (v) => true \|\| 'message'` | Confirm password, trimmed name length, "not your current email" |

A field that depends on another reads it with `watch`:

```jsx
{...register('confirmPassword', {
  required: 'Confirm your password',
  validate: (value) => value === password || 'Passwords do not match',
})}
```

No form passes a `mode` option, so React Hook Form's defaults apply: fields are checked when the form is submitted, then re-checked on every change after that. No form sets `noValidate` either, so `type="email"` inputs also get the browser's own format check on submit.

---

## Showing Errors

### Field errors

The message goes directly under the field, and the field's border turns red. Colors come from CSS variables (`var(--danger)`), not Tailwind color classes, so dark mode works. From `Signup.jsx` (styles trimmed):

```jsx
const inputStyle = (hasError) => ({
  border: `1.5px solid ${hasError ? 'var(--danger)' : 'var(--border-color)'}`,
  // ...
});

<input
  type="text"
  autoComplete="name"
  {...register('name', { required: 'Full name is required' })}
  style={inputStyle(errors.name)}
/>
{errors.name && (
  <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.name.message}</p>
)}
```

Admin forms do the same with `<span className="text-xs" style={{ color: 'var(--danger)' }}>`.

### Form-level errors

An error from the server is kept in a plain `useState` string, not in React Hook Form. Login and sign-up show it in a box above the submit button:

```jsx
{loginError && (
  <div role="alert" aria-live="polite" style={{ border: '1px solid var(--danger)' }}>
    {loginError}
  </div>
)}
```

The profile forms show one line under the input: the field error if there is one, otherwise the server error:

```jsx
{(errors.name || error) && (
  <p role="alert" style={{ fontSize: 12, color: 'var(--danger)' }}>{errors.name?.message || error}</p>
)}
```

### Sign-up password checklist

Under the password field, `Signup.jsx` shows a checklist that turns each rule green as it is met. The checklist uses the same three rules as the `register` rules above:

```js
const passwordRequirements = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'At least one letter', test: (p) => /[A-Za-z]/.test(p) },
  { label: 'At least one number', test: (p) => /\d/.test(p) },
];
```

There is also a strength meter (Weak / Fair / Good / Strong). It gives extra points for mixed case and symbols, but it is only a hint and never blocks sign-up. The enforced rule is 8–128 characters with at least one letter and one number. The backend checks the same rule (Joi: `min(8).max(128).pattern(/^(?=.*[A-Za-z])(?=.*\d)/)`).

---

## Server Errors

Every backend endpoint answers with `{ success, message, data }`. Forms show the `message`.

1. The API function in `src/api/*.api.js` throws if the request fails or `success` is `false`. It takes the backend's message: `e.response?.data?.message || e.message || 'fallback'`.
2. The form catches the error and puts the message into its local error state.

From `Login.jsx`:

```jsx
const onSubmit = async (data) => {
  setLoginError('');
  setIsSubmitting(true);
  try {
    await dispatch(login(data.identifier, data.password, navigate, buildRedirect(getStashedReturnTo())));
  } catch (error) {
    // Check for 429 rate-limit — show the server message verbatim
    if (error?.response?.status === 429) {
      setLoginError(error?.response?.data?.message || 'Too many login attempts. Please wait a few minutes.');
    } else {
      setLoginError(error?.response?.data?.message || error.message || 'Login failed, please try again');
    }
  } finally {
    setIsSubmitting(false);
  }
};
```

The thunks differ a little:

- `login` rethrows the original Axios error, so the form can check the status code. It shows no error toast, because the form shows the error inline.
- `signUp` throws `new Error(message)` and also shows an error toast. A failed sign-up therefore shows a toast and the inline box.
- `profileApi` (`src/api/profile.api.js`) turns every failure into `new Error(message)`:

```js
// Pull the backend's message out of a failed request so screens can show it.
const reason = (err, fallback) => err?.response?.data?.message || fallback;

updateName: async (name) => {
  try {
    const response = await api.put(PROFILE.UPDATE_NAME, { name });
    return response.data.data;
  } catch (err) {
    throw new Error(reason(err, 'Could not update your name. Please try again.'));
  }
},
```

`NameEditor` then does `catch (err) { setError(err.message); }`.

**Backend validation errors are not shown per field.** When the backend's request validation fails, the reply is HTTP 400 with `message: 'Validation failed'` and the details in `error.errors` (`[{ field, message }]`). No form reads `error.errors`, and no form calls React Hook Form's `setError`, so the user only sees "Validation failed". That is why client rules copy the server's rules, as the sign-up password rule does.

On the login page, a wrong password comes back as an inline error. On other pages, a 401 makes the shared Axios client clear the session and send the user to `/login` (see [API Integration](./api-integration.md)).

---

## Sign-up Form

Fields: name (required), email (required), password (rules above), confirm password (required, must match), a "study tips" checkbox, and an optional referral code. The referral code is filled in from `?ref=` or from a code saved on an earlier visit. There is no username field: `onSubmit` builds one from the part of the email before the `@`, plus a random number.

### Teacher sign-up

`/signup?role=teacher` uses the same form. The role comes from the URL and is stored in a hidden `accountType` field:

```jsx
const [searchParams] = useSearchParams();
// /signup?role=teacher creates a Teacher account (class links, dashboards).
const isTeacher = searchParams.get('role') === 'teacher';
const { register, handleSubmit, formState: { errors }, watch } = useForm({
  defaultValues: { accountType: isTeacher ? 'Teacher' : 'Student' },
});

<form onSubmit={handleSubmit(onSubmit)}>
  <input type="hidden" {...register('accountType')} />
```

- `accountType` is sent with the sign-up request. The backend accepts only `Student` or `Teacher` and uses `Student` if none is given. Principal and parent accounts can't be created through sign-up.
- The teacher version changes the heading and copy, hides the referral code field, and passes `accountType: 'Teacher'` to Google sign-up.
- A link under the form switches between `/signup` and `/signup?role=teacher`.

---

## Login Form

- One `identifier` field for email or username. It is `type="text"` because the backend accepts either one, and `type="email"` would block usernames.
- Password is only `required`. Login has no length rule.
- A 429 (too many attempts) shows the server's message as it is.
- If the user was sent here because their session expired, a toast explains why.

---

## Password Reset Forms

Both use plain `useState` and no React Hook Form.

- **`ForgotPassword.jsx`** has one controlled email input with the HTML `required` attribute. It dispatches `getPasswordResetToken(email)`. On success the page switches to a "check your email" view with a resend button. On failure a toast shows the server's message.
- **`UpdatePassword.jsx`** has two controlled inputs (`password`, `confirmPassword`), both `required`. It shows a live "Passwords match" or "Passwords do not match" hint and colors the border, but it doesn't block submit, and there is no length, letter or number check in the browser. The token is the last part of the URL. Server errors appear as a toast and the user stays on the page to try again. On success the user goes to `/login`.

---

## Profile Forms

**`NameEditor.jsx`** edits the name inline. The rule trims the value first:

```jsx
{...register('name', {
  required: 'Name is required',
  validate: (v) => {
    const t = v.trim();
    if (t.length < 2) return 'Name must be at least 2 characters';
    if (t.length > 100) return 'Name cannot exceed 100 characters';
    return true;
  },
})}
```

**`EmailChanger.jsx`** has two steps, each with its own form: `emailForm` for the new address, then `codeForm` for the 6-digit code sent to it.

```jsx
const emailForm = useForm({ defaultValues: { email: '' } });
const codeForm = useForm({ defaultValues: { code: '' } });

{...emailForm.register('email', {
  required: 'Enter your new email',
  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Please enter a valid email address' },
  validate: (v) => v.trim().toLowerCase() !== String(email).toLowerCase() || 'That is already your email',
})}

{...codeForm.register('code', {
  required: 'Enter the 6-digit code',
  pattern: { value: /^\s*\d{6}\s*$/, message: 'The code is 6 digits' },
})}
```

The code input uses `inputMode="numeric"` and `autoComplete="one-time-code"`. "Resend code" unlocks after 60 seconds. If the server says the code has expired, it unlocks right away.

---

## Admin Forms and Plain useState Forms

- **Admin create forms** use `register` with `required` messages. Teachers and students are added in bulk, one row each, with `useFieldArray`. Their rules use short messages, for example ``register(`students.${index}.email`, { required: 'Required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid' } })``. Server errors appear as a toast: `toast.error(error.response?.data?.message || 'Failed to create teachers')`.
- **Admin edit dialogs** (teachers, students, principals) keep an `editForm` object in `useState` and check it by hand: `if (!editForm.name || !editForm.email) { toast.error('Name and email are required'); return; }`.
- **`LinkManagement.jsx`** connects the custom `Dropdown` to React Hook Form with `Controller`:

```jsx
<Controller
  name="school_id"
  control={control}
  rules={{ required: 'School is required' }}
  render={({ field: { onChange, value }, fieldState: { error } }) => (
    <Dropdown
      label="Select School *"
      options={Array.isArray(schools) ? schools : []}
      value={value}
      onChange={onChange}
      error={error?.message}
      displayValue={(s) => s.schoolName}
      keyExtractor={(s) => s._id}
    />
  )}
/>
```

- **`QuizForm.jsx`** (teacher quiz builder) keeps its fields in `useState` and runs a check before submitting that shows a toast for the first problem it finds:

```js
const validateForm = () => {
  if (!formData.title.trim()) {
    toast.error('Please enter a quiz title');
    return false;
  }
  if (!formData.subjectId) {
    toast.error('Please select a subject');
    return false;
  }
  // ...
  return true;
};
```

---

## Custom Form Controls

Use the shared controls instead of the native elements. Their props are listed in the [Component Library](./component-library.md#dropdown-component).

| Instead of | Use |
|------------|-----|
| `<select>` | `src/components/ui/Dropdown.jsx` (with `Controller` inside a React Hook Form form) |
| `<input type="date">` | `src/components/admin/overview/DatePicker.jsx` |
| `<input type="range">` | `src/components/ui/RangeSlider.jsx` |
| `window.confirm()` | `src/components/common/ConfirmDialog.jsx` |

To pick a date and time, `QuizForm.jsx` puts `DatePicker` next to a list of times in 30-minute steps. It joins them when the form is submitted: ``new Date(`${deadlineDate}T${deadlineTime}`).toISOString()``. The time list is still a native `<select>`.

---

## Zod Is Not Used

`zod` (v3.22.x) is listed in `frontend/package.json`, but no file in `src/` imports it. `@hookform/resolvers` is not installed, so `zodResolver` is not available. All validation is done with React Hook Form rules or by hand as shown above. Zod is not the current standard. Moving to Zod schemas would mean adding `@hookform/resolvers` and changing the existing forms.

---

## Conventions

1. **Use React Hook Form with `register` rules** for any form that has validation. Never put form state in Redux.
2. **Put the message in the rule** (`required: 'Email is required'`) so `errors.<field>.message` can be shown directly.
3. **Copy the server's rules on the client.** Backend validation errors only reach the user as "Validation failed".
4. **Show field errors under the field** in `var(--danger)` and turn the border red. Use CSS variables, not Tailwind color classes.
5. **Show the server's `message`**: inline with `role="alert"` on the auth and profile forms, as a toast elsewhere.
6. **Disable submit while the request runs**, with `formState.isSubmitting` or a local flag.
7. **Use the shared controls** (`Dropdown`, `DatePicker`, `RangeSlider`, `ConfirmDialog`) instead of native ones.
8. **Plain `useState` is fine** for very small forms that only need the browser's `required` check.

---

*Document maintained by AskAideAI Development Team*
