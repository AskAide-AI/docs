---
title: "Dependencies"
description: "What the frontend depends on: core and dev dependencies, bundle-size impact, and the rules for adding a new dependency safely."
sidebar_position: 220
---

# Dependencies

> Track all external dependencies in the AskAideAI frontend.
> Last Updated: October 10, 2026

---

## Core Dependencies

### Framework & Runtime
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI library |
| react-dom | ^18.3.1 | React DOM renderer |
| react-router-dom | ^7.5.2 | Client-side routing |

### State Management
| Package | Version | Purpose |
|---------|---------|---------|
| @reduxjs/toolkit | ^2.7.0 | State management with Redux |
| react-redux | ^9.2.0 | React bindings for Redux |

### UI & Styling
| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | ^3.4.1 | Utility-first CSS framework |
| @headlessui/react | ^1.7.18 | Unstyled accessible components |
| lucide-react | ^0.344.0 | Icon library |
| qrcode.react | ^4.2.0 | QR code for teacher class links (`TeacherClassLinks.jsx`) |

> **Fonts** are not npm packages: Fraunces, Inter Tight and JetBrains Mono are self-hosted `woff2` files in `public/fonts/` (Fontsource builds, OFL; licences in `public/fonts/LICENSES.txt`).

> **Note:** `@mui/material`, `@emotion/react`, and `@emotion/styled` were fully removed from `package.json`. The last three admin components that used MUI (`ChapterTopicView`, `ChapterUpload`, `ChapterManagement`) were migrated to pure Tailwind CSS.

### Forms & Validation
| Package | Version | Purpose |
|---------|---------|---------|
| react-hook-form | ^7.56.3 | Form state management |
| zod | ^3.22.4 | Schema validation |

### HTTP & API
| Package | Version | Purpose |
|---------|---------|---------|
| axios | ^1.6.7 | HTTP client |

### Notifications & UI
| Package | Version | Purpose |
|---------|---------|---------|
| react-hot-toast | ^2.5.2 | Toast notifications |
| react-markdown | ^10.1.0 | Markdown rendering |
| remark-gfm | ^4.0.1 | GitHub Flavored Markdown |

---

## Development Dependencies

### Build Tools
| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^5.4.18 | Build tool and dev server |
| @vitejs/plugin-react | ^4.4.0 | React plugin for Vite |
| vite-prerender-plugin | ^0.5.13 | Static prerendering of public routes at build time |
| vite-plugin-pwa | ^1.2.0 | PWA / service worker generation |
| postcss | ^8.4.35 | CSS processing |
| autoprefixer | ^10.4.18 | CSS vendor prefixes |

### Type Checking
| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.8.3 | TypeScript compiler |
| @types/react | ^18.3.20 | React type definitions |
| @types/react-dom | ^18.3.6 | ReactDOM type definitions |
| typescript-eslint | ^8.3.0 | TypeScript ESLint parser |

### Code Quality
| Package | Version | Purpose |
|---------|---------|---------|
| eslint | ^9.9.1 | Code linting |
| @eslint/js | ^9.9.1 | ESLint core rules |
| eslint-plugin-react-hooks | ^5.1.0-rc.0 | React hooks rules |
| eslint-plugin-react-refresh | ^0.4.11 | React Refresh rules |
| globals | ^15.9.0 | Global variables definitions |

### Dev Server
| Package | Version | Purpose |
|---------|---------|---------|
| nodemon | ^3.1.0 | Auto-restart for the local Express server in `server/` |

### Testing
| Package | Version | Purpose |
|---------|---------|---------|
| vitest | ^4.1.9 | Test runner (52 test files in `src/__tests__/`) |
| jsdom | ^29.1.1 | DOM environment for tests |
| @testing-library/react | ^16.3.2 | React testing utilities |
| @testing-library/jest-dom | ^6.9.1 | DOM matchers |
| @testing-library/user-event | ^14.6.1 | Interaction simulation |
| playwright | 1.63.0 | Manual, CLI-driven browser checks (not a test suite) |

---

## Other Runtime Dependencies

> There are **no backend packages in the frontend `package.json`** — the backend is a separate repo. These are the remaining runtime dependencies not listed above:

| Package | Version | Purpose |
|---------|---------|---------|
| @microsoft/clarity | ^1.0.2 | Product analytics |
| @react-oauth/google | ^0.13.5 | Google Sign-In |
| clsx | 2.1.1 | Conditional class names |
| docx | 9.8.1 | DOCX generation (question paper export) |
| jspdf | ^4.2.1 | PDF generation |
| dotenv | ^16.4.5 | Environment variables |
| read-excel-file | ^9.3.14 | Read Excel imports |
| recharts | ^3.8.1 | Charts (progress and dashboards) |
| react-helmet-async | ^2.0.5 | Per-page `<head>` tags (SEO) |
| react-joyride | ^3.1.0 | Product tours (onboarding, dashboard tour) |

---

## Bundle Size Impact

| Package | Gzipped Size | Purpose |
|---------|--------------|---------|
| react + react-dom | ~45 KB | Core React |
| @reduxjs/toolkit | ~12 KB | State management |
| axios | ~13 KB | HTTP client |
| tailwindcss | ~10 KB | CSS utilities |
| react-router-dom | ~14 KB | Routing |
| react-hook-form | ~9 KB | Forms |
| zod | ~13 KB | Validation |

> **MUI removed:** Eliminating `@mui/material` removed its vendor chunk entirely; the `vite.config.ts` `manualChunks` entry for `mui-vendor` is gone too.

---

## Dependency Management

### Update Strategy

**Regular Updates (Monthly)**
- Patch versions: Always update
- Minor versions: Update after testing
- Major versions: Plan migration carefully

### Security Updates
- Update immediately when vulnerabilities found
- Run `npm audit` regularly
- Use `npm audit fix` for automatic fixes

### Checking for Updates
```bash
# Check outdated packages
npm outdated

# Update packages
npm update

# Check for security issues
npm audit
```

---

## Adding New Dependencies

Before adding a dependency, consider:

1. **Is it actively maintained?**
   - Check last commit date
   - Check open issues count

2. **Bundle size impact?**
   - Use [bundlephobia.com](https://bundlephobia.com)
   - Prefer smaller alternatives

3. **TypeScript support?**
   - Check for @types package
   - Prefer built-in types

4. **Can we implement it ourselves?**
   - Simple utilities don't need packages
   - Consider maintenance burden

5. **Peer dependencies?**
   - Check for conflicts
   - Verify compatible versions

---

## Package Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "npm run sitemap && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "server": "node server/index.js",
    "dev:server": "nodemon server/index.js",
    "sitemap": "node scripts/generate-sitemap.mjs",
    "content": "node scripts/generate-chapter-content.mjs",
    "test": "vitest run",
    "test:watch": "vitest",
    "smoke:theme": "node scripts/theme-smoke.mjs"
  }
}
```

---

*Document maintained by AskAideAI Development Team*
