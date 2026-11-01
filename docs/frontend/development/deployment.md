---
title: "Deployment Guide"
description: "How the frontend ships: the production build, environment variables, hosting, the GitHub Actions pipeline, and release checklists."
sidebar_position: 230
---

# Deployment Guide

> How to build and deploy the AskAideAI frontend application.
> Last Updated: April 17, 2026

---

## Build for Production

```bash
# Create production build
npm run build

# Build output is in dist/ directory
```

### Build Output
```
dist/
├── assets/
│   ├── react-vendor-[hash].js   # React + React DOM + React Router
│   ├── redux-vendor-[hash].js   # Redux Toolkit + react-redux
│   ├── ui-vendor-[hash].js      # lucide-react + headlessui
│   ├── index-[hash].js          # Main app bundle
│   ├── index-[hash].css         # Compiled CSS
│   └── [Page]-[hash].js         # Lazy-loaded route chunks
├── index.html                   # Prerendered: /
├── for-schools/index.html       # Prerendered: /for-schools/
├── about/index.html             # Prerendered: /about/ (also /pricing/, /how-it-works/)
├── try/index.html               # Prerendered: /try/
├── blog/<slug>/index.html       # Prerendered: each blog post
├── class/.../index.html         # Prerendered: class hubs, subjects, chapters
├── fonts/*.woff2                # Self-hosted fonts (preloaded by index.html)
├── favicon.ico, favicon.svg, apple-touch-icon.png, icons/
├── sw.js                        # PWA service worker
└── sitemap.xml / robots.txt / _redirects
```

> **Prerendering:** `vite-prerender-plugin` runs after the JS build and outputs real HTML for each public route: 502 routes (24 static and blog pages plus 478 class, subject and chapter pages). Googlebot and other crawlers receive fully rendered HTML on first byte without needing to execute JavaScript.

---

## Environment Variables

### Development (.env or .env.local)
```env
VITE_API_URL=http://localhost:4000/api/v1
```

### Production
```env
VITE_API_URL=https://backend-6752.onrender.com/api/v1
```

> **Where this URL comes from:** `backend-6752.onrender.com` is the fallback in `vite.config.ts` (`VITE_API_URL || 'https://backend-6752.onrender.com/api/v1'`). Confirm the live production URL with the team before relying on it — a deployment can override it via env.

> **Note:** Set environment variables in your deployment platform's settings, not in committed files.

---

## Deployment Platforms

### Vercel (Recommended for Vite)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects Vite

2. **Configure Build Settings**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add `VITE_API_URL`

4. **Deploy**
   - Push to main branch → auto-deploys
   - Other branches → preview deployments

### Netlify

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Import from Git

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables**
   - Site Settings → Environment Variables
   - Add `VITE_API_URL`

### Render

1. **Create Static Site**
   - Connect GitHub repository
   - Build Command: `npm run build`
   - Publish Directory: `dist`

2. **Environment Variables**
   - Add via Render dashboard

---

## Manual Deployment

### Preview Production Build
```bash
# Build
npm run build

# Preview locally
npm run preview
```

### Deploy to Static Hosting
```bash
# Build
npm run build

# Upload dist/ folder to your hosting provider
# (AWS S3, Google Cloud Storage, any static host)
```

---

## CI/CD

The frontend repo has **no GitHub Actions workflow** — there is no `.github/workflows/` directory. Deployment is manual or platform-driven: if the repo is connected to Vercel or Netlify, pushing to `main` triggers their auto-deploy with the build settings configured in that platform's dashboard. There is no pre-merge CI; run `npm run lint` and `npm test` locally before pushing.

---

## Post-Deployment Checklist

- [ ] Verify homepage loads correctly
- [ ] Test login/signup flow
- [ ] Check API connectivity
- [ ] Test all main user flows
- [ ] Verify environment variables are loaded
- [ ] Check browser console for errors
- [ ] Run Lighthouse performance audit
- [ ] Test on mobile devices

---

## SPA Routing Configuration

For single-page apps, configure your server to redirect all routes to `index.html`:

### Vercel (`vercel.json`)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Netlify (`netlify.toml` or `_redirects`)
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This repo already ships a generated `public/_redirects` (written by `npm run sitemap`, which `npm run build` runs first). It 301s each slash-less prerendered path to its trailing-slash form, then ends with the SPA catch-all:
```
/*    /index.html   200
```
Don't edit it by hand. `index.html` also redirects slash-less public URLs in the browser, for hosts that ignore `_redirects`.

---

## Rollback Procedure

### Vercel
1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Netlify
1. Go to Deploys
2. Find previous deployment
3. Click "Publish deploy"

### Manual
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

---

## Monitoring

### Error Tracking (Optional)
Add Sentry for error monitoring:

```bash
npm install @sentry/react
```

```jsx
// main.jsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

### Analytics (Optional)
```jsx
// For Vercel Analytics
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <Routes>...</Routes>
      <Analytics />
    </>
  );
}
```

---

## Troubleshooting

### Build Fails
- Check Node.js version matches local (20.x)
- Verify all dependencies are in package.json
- Check environment variables are set
- Review build logs for specific errors

### 404 on Route Refresh
- Configure SPA redirects (see above)
- Ensure `index.html` serves as fallback

### API Errors in Production
- Verify `VITE_API_URL` is set correctly
- Check CORS configuration on backend
- Verify SSL certificates

### Environment Variables Not Working
- Variables must start with `VITE_`
- Restart deployment after adding variables
- Check spelling and casing

---

*Document maintained by AskAideAI Development Team*
