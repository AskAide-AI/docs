# Dependencies

> Track all external dependencies in the AskAideAI frontend.
> Last Updated: April 17, 2026

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
| react-icons | ^5.5.0 | Additional icons |

> **Note:** `@mui/material`, `@emotion/react`, and `@emotion/styled` have been removed from active use. The last three admin components that used MUI (`ChapterTopicView`, `ChapterUpload`, `ChapterManagement`) were migrated to pure Tailwind CSS. MUI packages remain in `package.json` but are no longer imported anywhere in `src/`.

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
| nodemon | ^3.1.0 | Auto-restart for server |

---

## Backend-Related (In Frontend package.json)

> **Note:** These are backend dependencies that exist in the frontend package.json due to project structure.

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.3 | Backend API server |
| mongoose | ^8.2.0 | MongoDB ODM |
| bcryptjs | ^2.4.3 | Password hashing |
| jsonwebtoken | ^9.0.2 | JWT authentication |
| nodemailer | ^6.10.1 | Email sending |
| cors | ^2.8.5 | CORS middleware |
| dotenv | ^16.4.5 | Environment variables |
| express-list-endpoints | ^7.1.1 | List API endpoints |

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

> **MUI removed:** Eliminating `@mui/material` saved ~100 KB gzipped from the `mui-vendor` chunk. The `vite.config.ts` `manualChunks` entry for `mui-vendor` has also been removed.

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
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

---

*Document maintained by AskAideAI Development Team*
