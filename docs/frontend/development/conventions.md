# Frontend Conventions

The rules the frontend code follows today. When in doubt, copy an existing file that already does it.

---

## API calls

- Components never call Axios directly. Every request goes through the API layer in `src/api/`:
  - `axios.js`: the one shared Axios instance. It adds the JWT, refreshes an expired token once (shared across tabs) and replays the request, and sends the user to `/login` when the session can't be refreshed.
  - `endpoints.js`: every URL as a constant (`ENDPOINTS.AUTH.LOGIN`, ...). Add new routes here.
  - `*.api.js`: one module per area (`study.api.js`, `quiz.api.js`, `teacherClass.api.js`, ...), all re-exported from `src/api/index.js` (`import { studyApi, quizApi } from '../api'`).
- Raw `fetch` (for example streaming) must use `authorizedFetch()` from `src/api/axios.js`, so an expired token is refreshed the same way Axios does it.
- The Backend answers `{ success, message, data }`. Read `response.data`. List shapes vary between endpoints; `normalizeListResponse()` in `admin.api.js` flattens paginated payloads into an array.
- Errors: `try`/`catch`, then `toast.error(error.response?.data?.message || 'fallback message')`.
- Before adding a call, check the route exists in the Backend. There is no `src/services/` folder.

## Styling

- Tailwind for layout and spacing. **Every color is a CSS variable** from `src/index.css` (`var(--bg-card)`, `var(--text-primary)`, `var(--accent)`, ...). Hard-coded colors such as `bg-white` or `bg-blue-500` break dark mode, which works by toggling the `.dark` class.
- Grids: write `minmax(min(Npx, 100%), 1fr)`, never `minmax(Npx, 1fr)`. The app root clips overflow, so on a 320px phone a too-wide column is cut off instead of scrolling sideways.

```jsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 16 }} />
```

## Forms and controls

- Forms use React Hook Form (`useForm`). Never keep form state in Redux. Zod is installed for schemas, but today's forms validate with React Hook Form's own rules.
- Use the shared controls instead of native ones: `ui/Dropdown` (not `<select>`), `ui/RangeSlider` (not `<input type="range">`), `common/ConfirmDialog` (not `window.confirm()`), `admin/overview/DatePicker` (not `<input type="date">`).

## State

- Redux (`src/store/`) holds session and server state: auth tokens, the signed-in user, the study session, AI assistant conversations.
- React Context holds UI preferences saved in localStorage: theme (`useTheme`) and sound (`useSound`).
- Tabs, dropdowns and other local UI state stay in `useState`.

## Routes and components

- Every page in `src/App.jsx` is loaded with `React.lazy()`. Add new pages the same way.
- Pages that need sign-in are wrapped in `ProtectedRoute`; role pages in `RoleProtectedRoute allowedRoles={[...]}`. The Backend still checks every request, so the frontend guards are only for navigation.
- Components are `.jsx`. TypeScript is installed but not used for components.

## Tests

- Vitest + Testing Library, all in `src/__tests__/` (no tests next to components). Run `npm test`, or `npx vitest run src/__tests__/<file>` for one file.
- Good examples to copy: `navigation-role-model.test.jsx`, `auth-login-field.test.jsx`, `onboarding-first-session.test.jsx`.

## Analytics

- Microsoft Clarity through `src/utils/clarity.js` (off in development). Track meaningful features with `ClarityEvents` / `ClarityTags`.
