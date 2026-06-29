# Performance Optimization

> Performance optimization strategies for the AskAideAI frontend.
> Last Updated: June 26, 2026

---

## Current Performance Targets

| Metric | Target | Description |
|--------|--------|-------------|
| First Contentful Paint (FCP) | < 1.8s | Time to first content visible |
| Largest Contentful Paint (LCP) | < 2.5s | Time to largest element visible |
| Time to Interactive (TTI) | < 3.8s | Time to fully interactive |
| Cumulative Layout Shift (CLS) | < 0.1 | Visual stability |
| Bundle Size | < 200KB | Gzipped JavaScript |

---

## Vite Optimizations (Built-in)

Vite provides automatic optimizations:
- ✅ **Code splitting** by route
- ✅ **Tree shaking** for unused code elimination
- ✅ **Minification** in production builds
- ✅ **Asset optimization** for images and fonts
- ✅ **Fast HMR** in development

---

## Code Splitting

### Route-Based Splitting
React Router with lazy loading:

```jsx
import { lazy, Suspense } from 'react';

// Lazy load heavy pages
const AdminDashboard = lazy(() => import('./components/dashboard/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./components/dashboard/TeacherDashboard'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
      </Routes>
    </Suspense>
  );
}
```

### Component-Based Splitting
```jsx
import { lazy, Suspense, useState } from 'react';

// Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Analytics</button>
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

---

## Memoization

### React.memo for Components
```jsx
import { memo } from 'react';

// Only re-renders when props change
export const ExpensiveCard = memo(function ExpensiveCard({ data }) {
  return (
    <div className="card">
      {/* Expensive rendering logic */}
    </div>
  );
});
```

### useMemo for Calculations
```jsx
import { useMemo } from 'react';

function StudentList({ students, filter }) {
  // Only recalculate when students or filter changes
  const filteredStudents = useMemo(() => {
    return students.filter(s => s.status === filter);
  }, [students, filter]);
  
  return (
    <ul>
      {filteredStudents.map(student => (
        <li key={student.id}>{student.name}</li>
      ))}
    </ul>
  );
}
```

### useCallback for Functions
```jsx
import { useCallback } from 'react';

function ParentComponent() {
  // Stable function reference
  const handleClick = useCallback((id) => {
    console.log('Clicked:', id);
  }, []);
  
  return <ChildComponent onClick={handleClick} />;
}
```

---

## Image Optimization

### Best Practices
1. **Use modern formats** (WebP, AVIF when possible)
2. **Provide multiple sizes** for responsive images
3. **Lazy load** below-the-fold images
4. **Compress images** before uploading

### Lazy Loading Images
```jsx
<img
  src="/image.jpg"
  alt="Description"
  loading="lazy"  // Native lazy loading
  decoding="async"
/>
```

### Responsive Images
```jsx
<img
  srcSet="
    /image-400w.jpg 400w,
    /image-800w.jpg 800w,
    /image-1200w.jpg 1200w
  "
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  src="/image-800w.jpg"
  alt="Description"
/>
```

---

## List Virtualization

For large lists (100+ items), use virtualization:

```jsx
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

> **Note:** react-window is not currently installed. Add if needed for large lists.

---

## Bundle Analysis

Analyze bundle size:

```bash
# Install analyzer
npm install -D rollup-plugin-visualizer

# Run build with analysis
npm run build -- --analyze
```

### Keep Bundle Small
- ✅ Import only what you need
- ✅ Use tree-shakeable libraries
- ✅ Lazy load heavy components
- ✅ Check bundle size before adding dependencies

```jsx
// Good - named imports
import { useState, useEffect } from 'react';
import { Button } from './ui/Button';

// Bad - imports entire library
import * as React from 'react';
import * as Icons from 'lucide-react';
```

---

## API Performance

### Debounce Search Inputs
```jsx
import { useState, useMemo } from 'react';
import debounce from 'lodash/debounce';

function SearchInput({ onSearch }) {
  const [value, setValue] = useState('');
  
  const debouncedSearch = useMemo(
    () => debounce(onSearch, 300),
    [onSearch]
  );
  
  const handleChange = (e) => {
    setValue(e.target.value);
    debouncedSearch(e.target.value);
  };
  
  return <input value={value} onChange={handleChange} />;
}
```

### Batch API Requests
```jsx
// Instead of multiple calls
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments(),
]);
```

---

## Loading States

### Skeleton Loaders
```jsx
function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

function DataCard({ isLoading, data }) {
  if (isLoading) return <CardSkeleton />;
  return <ActualCard data={data} />;
}
```

---

## Performance Checklist

- [ ] Routes are lazy loaded
- [ ] Heavy components are lazy loaded
- [ ] Images are optimized and lazy loaded
- [ ] Expensive calculations are memoized
- [ ] Large lists use virtualization
- [ ] API calls are debounced where appropriate
- [ ] Bundle size is monitored
- [ ] Loading states prevent layout shifts

---

*Document maintained by AskAideAI Development Team*
