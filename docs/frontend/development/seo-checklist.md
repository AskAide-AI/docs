# SEO & GEO Checklist - AskAideAI

> Tracking SEO (Search Engine Optimization) and GEO (Generative Engine Optimization) implementation status.
> Last Updated: April 17, 2026

---

## SEO Infrastructure ✅

| Component | Status | Location |
|-----------|--------|----------|
| react-helmet-async | ✅ Installed | `package.json` |
| HelmetProvider | ✅ Configured | `src/main.jsx` |
| SEO Config | ✅ Created | `src/seo.config.js` |
| SEO Components | ✅ Created | `src/components/seo/` |
| Static Prerendering | ✅ Active | `src/prerender.jsx` + `vite.config.ts` |

### Prerendered Pages (build-time HTML)
`npm run build` now outputs fully prerendered HTML for 6 public routes. Googlebot receives real HTML on first byte — no JS rendering delay.

| Route | Prerendered | Title in HTML |
|-------|-------------|--------------|
| `/` | ✅ | AskAideAI - AI-Powered Learning Platform... |
| `/for-schools` | ✅ | AskAideAI for Schools — AI Learning Platform... |
| `/free-paper-generator` | ✅ | Free CBSE Question Paper Generator... |
| `/try` | ✅ | Try AskAide AI for Free... |
| `/blog` | ✅ | Blog - AI Learning Tips & Study Guides... |
| `/signup` | ✅ | Sign Up Free \| AskAideAI... |

### SEO Components Available

| Component | Purpose | Usage |
|-----------|---------|-------|
| `SEOHead` | Page meta tags | Import and add to any page |
| `OrganizationSchema` | Company JSON-LD | Homepage only |
| `FAQSchema` | FAQ rich snippets | Pages with FAQ sections |
| `BreadcrumbSchema` | Breadcrumb rich results | Multi-level pages |
| `ContactInfo` | NAP-consistent contact | Footer, contact page |

---

## Page-Level SEO Status

| Page | SEOHead | Canonical `path=` | Schema | Keywords | Prerendered | Status |
|------|---------|-------------------|--------|----------|-------------|--------|
| `/` (Landing) | ✅ | ✅ `/` | ✅ Org + FAQ | ✅ | ✅ | Done |
| `/for-schools` | ✅ | ✅ `/for-schools` | — | ✅ | ✅ | Done |
| `/free-paper-generator` | ✅ | ✅ `/free-paper-generator` | — | ✅ | ✅ | Done |
| `/try` | ✅ | ✅ `/try` | — | ✅ | ✅ | Done |
| `/blog` | ✅ | ✅ `/blog` | — | — | ✅ | Done |
| `/blog/:slug` | ✅ | ✅ dynamic | ✅ Article | — | ❌ dynamic | Done |
| `/class/:id/subject/:id` | ✅ | ✅ dynamic | — | ✅ | ❌ dynamic | Done |
| `/signup` | ✅ | ✅ `/signup` | — | ✅ | ✅ | Done |
| `/login` | ✅ noindex | — | — | — | — | Done |
| `/privacy-policy` | ✅ | ✅ `/privacy-policy` | — | — | — | Done |
| `/terms-of-service` | ✅ | ✅ `/terms-of-service` | — | — | — | Done |
| `/feedback` | ✅ | ✅ `/feedback` | — | — | — | Done |
| `/dashboard` | — | — | — | — | N/A | Protected |

> **Canonical URL bug fixed (April 2026):** `TryNow`, `PublicPaperGenerator`, and `SeoSubjectPage` were missing the `path=` prop on `SEOHead`, causing all three to emit `https://askaide.in/` as their canonical. This has been corrected.

---

## Technical SEO Status

| Item | Status | File |
|------|--------|------|
| robots.txt | ✅ | `public/robots.txt` |
| sitemap.xml | ✅ 13 URLs | `public/sitemap.xml` |
| index.html SEO | ✅ | `index.html` |
| Canonical URLs | ✅ All pages | Via `SEOHead path=` prop |
| Open Graph | ✅ | Via SEOHead |
| Twitter Cards | ✅ | Via SEOHead |
| Static Prerendering | ✅ 6 pages | `vite-prerender-plugin` |
| OG Image | ⚠️ Needed | `public/og-image.jpg` |

### Sitemap URLs (13 total)
`/`, `/free-paper-generator`, `/try`, `/for-schools`, `/signup`, `/blog`, `/blog/how-ai-transforms-personalized-learning-2026`, `/blog/10-ai-study-techniques-students`, `/blog/chapter-wise-study-more-effective`, `/feedback`, `/privacy-policy`, `/terms-of-service`

---

## Geographic SEO (India)

| Element | Implementation | Status |
|---------|---------------|--------|
| `lang="en-IN"` | index.html | ✅ |
| geo.region | IN | ✅ |
| geo.placename | India | ✅ |
| addressCountry | IN (in schemas) | ✅ |
| Keywords | CBSE, State Board, Class 9-12 | ✅ |
| Testimonials | Delhi, Mumbai, Bangalore | ✅ |

---

## GEO (Generative Engine Optimization) Best Practices

### Content Structure for AI Citation
- [x] FAQ section on landing page (AI cites Q&A format)
- [x] Clear headings (h1, h2, h3 hierarchy)
- [x] Direct answers at start of sections
- [ ] Add statistics with sources (future)
- [ ] Add author/expert credentials (future)

### Content Freshness Signals
- [ ] Add "Last Updated" dates to key pages
- [ ] Include year in titles ("2026 Guide")
- [ ] Update testimonials with recent dates

### Authority Signals
- [x] Organization schema with contact info
- [ ] Add team/about page with credentials
- [ ] Add customer logo/testimonial section with specifics

---

## Adding SEO to New Pages

```jsx
import SEOHead from '../seo/SEOHead';

export default function NewPage() {
  return (
    <>
      <SEOHead
        title="Page Title | AskAideAI"
        description="150-160 char description with keywords."
        path="/your-path"
        keywords="keyword1, keyword2"
      />
      {/* Page content */}
    </>
  );
}
```

---

## Verification Commands

```bash
# Build and check for errors
npm run build

# Test locally
npm run dev
# Then visit: http://localhost:5173
# Right-click → View Page Source to verify meta tags
```

## External Tools
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Google Search Console](https://search.google.com/search-console)
- [Lighthouse SEO Audit](Built into Chrome DevTools)
