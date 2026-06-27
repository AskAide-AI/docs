# Styling Guide

> Styling approach and guidelines for the AskAideAI frontend.
> Last Updated: June 25, 2026

---

## Approach

- **Primary:** TailwindCSS utility classes
- **Global Styles:** `/src/index.css`

> **Material UI removed (April 2026).** MUI is no longer used. All components now use Tailwind CSS exclusively.

---

## Theme Configuration

**File:** `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};
```

> **Note:** The current config uses Tailwind defaults. Custom theme extensions can be added as needed.

---

## Color Palette

### CSS Custom Properties (Design Tokens)

The app uses CSS custom properties defined in `/src/index.css` for all colors. This enables proper dark mode support.

**NEVER hardcode Tailwind color classes** (`bg-blue-500`, `text-gray-800`, `bg-violet-500`, etc.). Always use CSS variables.

#### Light Mode (`:root`)
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#F4F1EA` | Page background (warm parchment) |
| `--bg-card` | `#FFFFFF` | Card backgrounds |
| `--bg-secondary` | `#F0EDE5` | Secondary surfaces |
| `--accent` | `#2E5D4F` | Primary actions, links, brand color (deep green) |
| `--accent-light` | rgba accent at 10% | Accent backgrounds, hover states |
| `--text-primary` | `#1A1D1A` | Primary text |
| `--text-secondary` | `#4A4F4A` | Secondary text |
| `--text-muted` | `#8A8F8A` | Muted text, placeholders |
| `--border-color` | `#E0DDD5` | Borders, dividers |
| `--danger` | `#DC2626` | Error/danger states |
| `--color-success` | `#16A34A` | Success states |
| `--color-warning` | `#D97706` | Warning states |
| `--color-info` | `#2563EB` | Info states |

#### Dark Mode (`:root.dark`)
All tokens shift to dark equivalents. The accent becomes `#8FBFA8` (lighter green).

### Usage Examples

```jsx
// ✅ Correct — uses CSS variables
<div style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
  Content
</div>

<button style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-card)' }}>
  Primary Action
</button>

<span style={{ color: 'var(--danger)' }}>Error message</span>

// ❌ Wrong — hardcoded Tailwind colors (breaks dark mode)
<div className="bg-white text-gray-800">Content</div>
<button className="bg-blue-500 text-white">Action</button>
```

### Semantic Color Mapping
| Was (Hardcoded) | Now (CSS Variable) |
|----------------|-------------------|
| `bg-white` | `bg-[var(--bg-card)]` or inline `var(--bg-card)` |
| `bg-gray-50` | `bg-[var(--bg-secondary)]` |
| `text-gray-800` | `text-[var(--text-primary)]` |
| `text-gray-400` | `text-[var(--text-muted)]` |
| `border-gray-200` | `border-[var(--border-color)]` |
| `bg-blue-500`, `bg-violet-500` | `var(--accent)` |
| `text-red-500`, `text-rose-500` | `var(--danger)` |
| `bg-green-100`, `bg-emerald-100` | `var(--color-success-bg)` |
| `text-green-600`, `text-emerald-600` | `var(--color-success)` |

---

## Typography

### Font Family
- **Default:** System font stack (Tailwind default)
- **Headings:** Same as body

### Font Sizes
| Element | Class | Size |
|---------|-------|------|
| h1 | `text-4xl` | 36px |
| h2 | `text-3xl` | 30px |
| h3 | `text-2xl` | 24px |
| h4 | `text-xl` | 20px |
| Body | `text-base` | 16px |
| Small | `text-sm` | 14px |
| XSmall | `text-xs` | 12px |

---

## Responsive Breakpoints

| Breakpoint | Min Width | Class Prefix |
|------------|-----------|--------------|
| Default | 0px | None |
| sm | 640px | `sm:` |
| md | 768px | `md:` |
| lg | 1024px | `lg:` |
| xl | 1280px | `xl:` |
| 2xl | 1536px | `2xl:` |

### Mobile-First Approach
```jsx
// Mobile-first example
<div className="
  flex flex-col        /* Mobile: stack vertically */
  md:flex-row          /* Tablet+: side by side */
  gap-4
">
  <Card />
  <Card />
</div>
```

---

## Common Patterns

### Card Component
```jsx
<div className="
  bg-white 
  rounded-lg 
  shadow-md 
  p-6 
  hover:shadow-lg 
  transition-shadow
">
  {/* Card content */}
</div>
```

### Button Styles
```jsx
// Primary Button
<button className="
  px-4 py-2 
  bg-blue-500 hover:bg-blue-600 
  text-white font-medium 
  rounded-lg 
  transition-colors
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Click Me
</button>

// Secondary Button
<button className="
  px-4 py-2 
  bg-gray-200 hover:bg-gray-300 
  text-gray-800 
  rounded-lg 
  transition-colors
">
  Cancel
</button>

// Danger Button
<button className="
  px-4 py-2 
  bg-red-500 hover:bg-red-600 
  text-white 
  rounded-lg 
  transition-colors
">
  Delete
</button>
```

### Form Input
```jsx
<input
  type="text"
  className="
    w-full 
    px-4 py-2 
    border border-gray-300 
    rounded-lg 
    focus:outline-none 
    focus:ring-2 
    focus:ring-blue-500 
    focus:border-transparent
  "
  placeholder="Enter text..."
/>
```

### Error State Input
```jsx
<input
  type="text"
  className="
    w-full 
    px-4 py-2 
    border border-red-500 
    rounded-lg 
    focus:outline-none 
    focus:ring-2 
    focus:ring-red-500
  "
/>
<span className="text-red-500 text-sm mt-1">
  Error message here
</span>
```

---

## Dark Mode

Dark mode is **already implemented** via the `ThemeContext` provider.

### How It Works
- `ThemeContext` toggles `.dark` / `.light` class on `<html>`
- CSS custom properties in `:root.dark` override light mode tokens
- All components use CSS variables → automatic dark mode support
- Persisted in `localStorage`

### Rules
1. **Never use hardcoded Tailwind colors** — they don't adapt to dark mode
2. **Always use CSS variables** — `var(--accent)`, `var(--bg-card)`, etc.
3. **Use inline `style` for CSS variables** when Tailwind doesn't have the class:
   ```jsx
   <div style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
   ```
4. **Use Tailwind for layout, spacing, typography** — these don't need dark mode variants

### Checking Dark Mode
When building a component, always test in both light and dark mode. If you see white text on white background or colors that look wrong, you're using hardcoded Tailwind classes instead of CSS variables.

---

## ~~Material UI Integration~~ (Removed)

MUI has been fully removed. Use Tailwind equivalents instead:

| Was MUI | Now Tailwind |
|---------|-------------|
| `<Button variant="contained">` | `<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">` |
| `<TextField label="...">` | `<input className="w-full px-3 py-2 border border-slate-300 rounded-lg ...">` |
| `<CircularProgress>` | Inline SVG spinner with `animate-spin` |
| `<Alert severity="error">` | `<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">` |
| `<Chip label="...">` | `<span className="px-2 py-0.5 text-xs rounded-full bg-purple-50 text-purple-700">` |
| `<Checkbox>` | `<input type="checkbox" className="accent-blue-600">` + `useRef` for indeterminate |

---

## Global Styles

**File:** `/src/index.css`

Contains:
- Tailwind directives (`@tailwind base/components/utilities`)
- Global resets
- Custom utility classes
- Animation definitions

---

## Animation Classes

```css
/* Fade in */
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
.slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}
```

---

## Component Styling Checklist

- [ ] Responsive on all breakpoints (mobile, tablet, desktop)
- [ ] Hover/focus states defined
- [ ] Loading states styled
- [ ] Error states styled
- [ ] Disabled states styled
- [ ] Dark mode support (verify with CSS variables)
- [ ] Accessible color contrast (WCAG AA)

---

*Document maintained by AskAideAI Development Team*
