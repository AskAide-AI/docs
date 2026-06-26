# Frontend Troubleshooting Guide

Common issues and solutions when working with the AskAideAI frontend.

## Build & Dev Server Issues

### Vite dev server fails to start
**Symptoms:** `Error: Cannot find module`, port conflicts, HMR not working
**Solutions:**
1. Delete `node_modules` and `package-lock.json`, run `npm install`
2. Kill processes on port 5173: `npx kill-port 5173`
3. Clear Vite cache: delete `node_modules/.vite`

### Build fails with cryptic errors
**Solutions:**
1. Run `npm run lint` first to catch syntax issues
2. Check for unused imports or missing dependencies
3. Verify Tailwind classes exist in your config

### ESLint errors on commit
**Solutions:**
1. Run `npm run lint` and fix all errors
2. Check for unused variables, missing dependencies in useEffect
3. Ensure all imports are actually used

## API & Data Issues

### Network Error / CORS errors in console
**Symptoms:** API calls fail with CORS or network errors
**Solutions:**
1. Verify `VITE_API_URL` is set correctly in `.env`
2. Confirm Backend is running on the expected port
3. Check browser console for CORS error details
4. Ensure Backend CORS config allows your origin

### API returns 401 Unauthorized
**Symptoms:** Random logouts, API calls failing with 401
**Solutions:**
1. Check if JWT token is expired (tokens are in localStorage)
2. Clear localStorage and re-login
3. Verify the token is being sent in Authorization header

### Data not showing in dropdowns/lists
**Symptoms:** Empty dropdowns, "No data" states
**Solutions:**
1. Check the API response shape — backend may have changed format
2. Verify `normalizeListResponse()` handles the response correctly
3. Check browser console for API errors
4. Look for `.items` vs flat array response shape mismatches

## Routing & Navigation

### Page shows blank / component not rendering
**Symptoms:** White page, no errors in console
**Solutions:**
1. Check if the route is behind `<ProtectedRoute>` — you may need to log in
2. Verify the role guard allows your user role
3. Check `App.jsx` for the route definition

### Redirect loop on login
**Symptoms:** Login page redirects to dashboard, which redirects back
**Solutions:**
1. Clear localStorage and re-login
2. Check if token is malformed or invalid

## State Management Issues

### Redux state not updating
**Symptoms:** UI doesn't reflect changes after dispatching actions
**Solutions:**
1. Verify the action is being dispatched (Redux DevTools)
2. Check that the reducer handles the action type
3. Ensure you're reading from the correct slice

### Dark mode not persisting
**Symptoms:** Theme resets on page reload
**Solutions:**
1. Check `ThemeContext` — theme is stored in localStorage
2. Verify `.dark` class is being toggled on document root

## Styling Issues

### Tailwind classes not working
**Solutions:**
1. Verify the class name is spelled correctly
2. Check `tailwind.config.js` content paths include your file
3. Restart the dev server after adding new classes
4. Ensure you're not using runtime-generated classes (use full class names)

### Mobile layout broken
**Solutions:**
1. Use responsive prefixes: `sm:`, `md:`, `lg:`
2. Test at 360px width minimum
3. Ensure touch targets are at least 44px
