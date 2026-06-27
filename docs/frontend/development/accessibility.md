# Accessibility Guidelines

> Accessibility standards and guidelines for the AskAideAI frontend.
> Last Updated: June 25, 2026

---

## Accessibility Standards

**Target:** WCAG 2.1 Level AA compliance

---

## Keyboard Navigation

### Required Support
| Key | Action |
|-----|--------|
| Tab | Navigate to next interactive element |
| Shift + Tab | Navigate to previous element |
| Enter | Activate buttons and links |
| Space | Activate buttons, toggle checkboxes |
| Escape | Close modals and dropdowns |
| Arrow Keys | Navigate within menus and lists |

### Implementation Example
```jsx
function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      role="dialog" 
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">Modal Title</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

---

## Confirmation Dialogs

### Use ConfirmDialog (not window.confirm())

The `ConfirmDialog` component at `/src/components/common/ConfirmDialog.jsx` provides a fully accessible confirmation modal:

- `role="dialog"` and `aria-modal="true"`
- `aria-labelledby` pointing to title
- `aria-describedby` pointing to message
- Focus trap within the dialog
- Escape key to dismiss
- Backdrop click to dismiss
- Body scroll lock when open
- Primary (safe) button focused on open

```jsx
import ConfirmDialog from '@/components/common/ConfirmDialog';

<ConfirmDialog
  isOpen={showDialog}
  title="Delete Quiz"
  message="Are you sure? Students cannot recover this quiz."
  confirmLabel="Delete"
  cancelLabel="Stay"
  onConfirm={handleDelete}
  onCancel={() => setShowDialog(false)}
/>
```

### Button Hierarchy for Destructive Actions

The safe action (cancel/stay) is visually emphasized as the PRIMARY button (solid accent color). The destructive action (delete/leave) is de-emphasized as an outline button. This follows the pattern used by Gmail, Slack, and Notion.

---

## Semantic HTML

### Use Proper Elements
```jsx
// Good - Semantic elements
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/home">Home</a></li>
      <li><a href="/study">Study</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Page Title</h1>
    <section aria-labelledby="section-title">
      <h2 id="section-title">Section</h2>
      <p>Content</p>
    </section>
  </article>
</main>

<footer>
  <p>Copyright 2026</p>
</footer>

// Bad - Divs everywhere
<div class="header">
  <div class="nav">...</div>
</div>
```

---

## ARIA Labels

### Buttons with Icons Only
```jsx
// Icon-only button needs aria-label
<button aria-label="Close modal" onClick={onClose}>
  <XIcon />
</button>

<button aria-label="Delete item" onClick={onDelete}>
  <TrashIcon />
</button>
```

### Form Inputs
```jsx
<label htmlFor="email">Email</label>
<input
  id="email"
  name="email"
  type="email"
  aria-required="true"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <span id="email-error" role="alert">
    {errors.email.message}
  </span>
)}
```

### Loading States
```jsx
<button 
  disabled={isLoading}
  aria-busy={isLoading}
>
  {isLoading ? 'Loading...' : 'Submit'}
</button>

// Or with live region
<div aria-live="polite" aria-atomic="true">
  {isLoading && 'Loading, please wait...'}
</div>
```

---

## Color Contrast

### Minimum Requirements
| Content Type | Contrast Ratio |
|--------------|---------------|
| Normal text (< 18px) | 4.5:1 |
| Large text (≥ 18px) | 3:1 |
| UI components | 3:1 |

### Good Contrast Examples
```jsx
// Good contrast
<span className="bg-blue-600 text-white">Button</span>  // ~7.5:1
<span className="bg-gray-100 text-gray-900">Text</span> // ~15.8:1

// Bad contrast - avoid
<span className="bg-gray-300 text-gray-400">Low contrast</span>
```

### Don't Rely on Color Alone
```jsx
// Good - uses color AND icon
<span className="text-red-600">
  <ExclamationIcon /> Error: Invalid input
</span>

// Good - uses color AND text
<span className="text-green-600">✓ Success</span>

// Bad - color only
<span className="text-red-600">Invalid</span>
```

---

## Focus Indicators

### Always Show Focus
```css
/* Good - visible focus */
:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Never remove focus outline */
button:focus {
  outline: none; /* ❌ Don't do this */
}
```

### Tailwind Focus Classes
```jsx
<button className="
  focus:outline-none 
  focus:ring-2 
  focus:ring-blue-500 
  focus:ring-offset-2
">
  Accessible Button
</button>
```

---

## Form Accessibility

```jsx
<form onSubmit={handleSubmit} aria-label="Login form">
  <div>
    <label htmlFor="email">
      Email <span aria-hidden="true">*</span>
    </label>
    <input
      id="email"
      name="email"
      type="email"
      required
      aria-required="true"
      aria-invalid={!!errors.email}
      aria-describedby="email-error email-hint"
    />
    <span id="email-hint" className="text-sm text-gray-500">
      We'll never share your email
    </span>
    {errors.email && (
      <span id="email-error" role="alert" className="text-red-600">
        {errors.email.message}
      </span>
    )}
  </div>
  
  <button type="submit">
    Login
  </button>
</form>
```

---

## Image Accessibility

### Decorative Images
```jsx
// Decorative - empty alt
<img src="/decoration.svg" alt="" />

// Or hide from screen readers
<img src="/decoration.svg" aria-hidden="true" />
```

### Meaningful Images
```jsx
// Descriptive alt text
<img 
  src="/product.jpg" 
  alt="Blue cotton t-shirt with round neck" 
/>

// Complex images with description
<figure>
  <img src="/chart.png" alt="Sales chart" />
  <figcaption>
    Sales increased 25% from Q1 to Q2 2024
  </figcaption>
</figure>
```

---

## Skip Links

```jsx
// At the top of the page
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
>
  Skip to main content
</a>

// Main content area
<main id="main-content" tabIndex={-1}>
  {/* Page content */}
</main>
```

---

## Screen Reader Only Text

```jsx
// Tailwind's sr-only class
<button>
  <TrashIcon />
  <span className="sr-only">Delete item</span>
</button>

// CSS equivalent
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## Testing Tools

| Tool | Purpose |
|------|---------|
| axe DevTools | Browser extension for accessibility testing |
| Lighthouse | Built-in Chrome accessibility audit |
| NVDA/JAWS | Screen reader testing (Windows) |
| VoiceOver | Screen reader testing (macOS) |
| Keyboard-only | Navigate without a mouse |

---

## Accessibility Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Images have appropriate alt text
- [ ] Form inputs have labels
- [ ] Error messages are announced
- [ ] Headings are in logical order (h1, h2, h3)
- [ ] Skip link is available
- [ ] No auto-playing media
- [ ] Animations can be paused

---

*Document maintained by AskAideAI Development Team*
