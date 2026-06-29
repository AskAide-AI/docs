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
├── for-schools/index.html       # Prerendered: /for-schools
├── free-paper-generator/index.html  # Prerendered: /free-paper-generator
├── try/index.html               # Prerendered: /try
├── blog/index.html              # Prerendered: /blog
├── signup/index.html            # Prerendered: /signup
├── sw.js                        # PWA service worker
└── sitemap.xml / robots.txt
```

> **Prerendering:** `vite-prerender-plugin` runs after the JS build and outputs real HTML for each public route. Googlebot and other crawlers receive fully rendered HTML on first byte without needing to execute JavaScript.

---

## Environment Variables

### Development (.env or .env.local)
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### Production
```env
VITE_API_URL=https://askaideaibackend.onrender.com/api/v1
```

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

## CI/CD Pipeline (GitHub Actions)

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
      
      # Deploy step depends on your hosting provider
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

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

Or create `public/_redirects`:
```
/*    /index.html   200
```

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
