# Frontend Architecture Summary & Developer Guide

## Quick Start for New Developers

### Project Structure Overview
```
src/
├── components/          # React components organized by domain
│   ├── auth/           # Login, signup, auth layouts
│   ├── common/         # Reusable UI components (Button, Input, etc.)
│   ├── dashboard/      # Dashboard-specific components
│   ├── goals/          # Goal management components
│   ├── layout/         # Layout wrappers (Modal, Toast, Header)
│   ├── tasks/          # Task management components
│   ├── AddTaskModal.tsx
│   ├── Navbar.tsx
│   ├── ProtectedRoute.tsx
│   └── Sidebar.tsx
│
├── contexts/           # React Context for global state
│   └── SidebarContext.tsx
│
├── hooks/              # Custom React hooks
│   └── useReminderPoller.ts
│
├── lib/
│   └── db/            # Database layer (currently IndexedDB)
│
├── pages/             # Page components (one per route)
│   ├── DashboardPage.tsx
│   ├── TasksPage.tsx
│   ├── GoalsPage.tsx
│   └── ... (11 total)
│
├── services/          # Business logic & data operations
│   ├── authService.ts
│   ├── taskService.ts
│   ├── goalService.ts
│   └── settingsService.ts
│
├── stores/            # Zustand state management
│   ├── authStore.ts
│   ├── taskStore.ts
│   ├── goalStore.ts
│   └── settingsStore.ts
│
├── styles/            # Global styles and theme
│   ├── global.css
│   └── theme.ts
│
├── types/             # TypeScript type definitions
│   ├── auth.ts
│   ├── task.ts
│   ├── goal.ts
│   ├── user.ts
│   └── index.ts
│
├── utils/             # Utility functions
│   ├── avatarUtils.ts
│   └── index.ts
│
├── data/              # Static data
│   ├── quotes.ts
│   └── tags.ts
│
├── App.tsx            # Main app component with routing
├── main.tsx           # Entry point
├── index.css
└── App.css
```

### Command Reference

```bash
# Development
npm run dev              # Start Vite dev server (http://localhost:5173)

# Build
npm run build            # TypeScript check + Vite build

# Code Quality
npm run lint             # Run ESLint

# Preview
npm run preview          # Preview production build
```

---

## State Management Pattern

### How to Use Stores

**1. Authentication State**:
```typescript
import { useAuthStore } from '../stores'

const MyComponent = () => {
  const { currentUser, isAuthenticated, isLoading, logout } = useAuthStore()
  
  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {currentUser && <p>Welcome, {currentUser.fullName}!</p>}
      {isAuthenticated && <button onClick={logout}>Logout</button>}
    </div>
  )
}
```

**2. Task Operations**:
```typescript
import { useTaskStore } from '../stores'

const TaskComponent = () => {
  const { 
    tasks, 
    createTask, 
    updateTask,
    getDueTodayTasks,
    getTasksByTag
  } = useTaskStore()
  
  // Create task
  const handleCreate = async () => {
    const newTask = await createTask({
      userId: currentUser.id,
      title: 'My Task',
      priority: 'high',
      dueDate: Date.now()
    })
  }
  
  // Get filtered data
  const todayTasks = getDueTodayTasks()
  const taggedTasks = getTasksByTag('important')
}
```

**3. Goal Operations**:
```typescript
import { useGoalStore } from '../stores'

const GoalComponent = () => {
  const {
    goals,
    createGoal,
    updateGoal,
    completeGoal,
    getActiveGoals,
    getSubGoals
  } = useGoalStore()
  
  const activeGoals = getActiveGoals()
  const subGoals = getSubGoals(parentGoalId)
}
```

### Key Principles

1. **Never Access IndexedDB Directly**
   - Always use services or stores
   - Components should never import from `lib/db`

2. **Stores Orchestrate Data**
   - Stores call services
   - Stores manage global state
   - Stores provide computed getters

3. **Services Abstract Operations**
   - Services handle CRUD logic
   - Services will be swapped for API calls
   - Services shouldn't know about React

4. **Fetch Data on Mount**
   ```typescript
   useEffect(() => {
     if (currentUser) {
       loadTasks(currentUser.id)
     }
   }, [currentUser])
   ```

---

## Component Development Guide

### Creating a New Page

**1. Create Page Component**:
```typescript
// src/pages/MyNewPage.tsx
import { useAuthStore, useTaskStore } from '../stores'

const MyNewPage = () => {
  const { currentUser } = useAuthStore()
  const { tasks, loadTasks } = useTaskStore()
  
  useEffect(() => {
    if (currentUser) {
      loadTasks(currentUser.id)
    }
  }, [currentUser])
  
  return (
    <div>
      {/* Page content */}
    </div>
  )
}

export default MyNewPage
```

**2. Add Route in App.tsx**:
```typescript
import MyNewPage from './pages/MyNewPage'

<Route path="/my-new-page" element={
  <ProtectedRoute>
    <MyNewPage />
  </ProtectedRoute>
} />
```

**3. Add Navigation in Sidebar.tsx**:
```typescript
// Add new nav item
{ icon: <Icon />, label: 'My New Page', href: '/my-new-page' }
```

### Creating Reusable Components

**1. Create in `components/common/`**:
```typescript
// src/components/common/MyButton.tsx
import { ReactNode } from 'react'

interface MyButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

const MyButton = ({ children, onClick, variant = 'primary' }: MyButtonProps) => {
  return (
    <button sx={{
      // Theme-UI styles
      bg: variant === 'primary' ? 'primary' : 'secondary',
      px: 3,
      py: 2,
      borderRadius: 'md',
      cursor: 'pointer'
    }} onClick={onClick}>
      {children}
    </button>
  )
}

export default MyButton
```

**2. Use in Other Components**:
```typescript
import MyButton from './common/MyButton'

<MyButton variant="primary" onClick={handleClick}>
  Click Me
</MyButton>
```

### Form Handling with react-hook-form

```typescript
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  priority: z.enum(['low', 'medium', 'high'])
})

type FormData = z.infer<typeof schema>

const MyForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()
  
  const onSubmit = async (data: FormData) => {
    // Handle submission
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}
      
      <select {...register('priority')}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      
      <button type="submit">Submit</button>
    </form>
  )
}
```

---

## Styling Guide

### Using Theme-UI

The project uses **Theme-UI** with the `@jsxImportSource theme-ui` pragma.

**Basic Usage**:
```typescript
/** @jsxImportSource theme-ui */

const MyComponent = () => {
  return (
    <div sx={{
      bg: 'background',
      color: 'text',
      p: 4,
      borderRadius: 'md',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      
      // Responsive: [mobile, tablet, desktop]
      fontSize: [1, 2, 3],
      
      // Hover state
      ':hover': {
        bg: 'surface',
        cursor: 'pointer'
      },
      
      // Pseudo-selectors
      '::before': {
        content: '""'
      }
    }}>
      Content
    </div>
  )
}
```

**Theme Values** (from `src/styles/theme.ts`):
- Colors: `primary`, `secondary`, `danger`, `success`, `warning`, `text`, `background`, `surface`, `border`, `muted`
- Spacing: `0`, `1`, `2`, `3`, `4`, `5` (8px units)
- FontSizes: `0`-`5` (scales from small to large)
- BorderRadius: `sm`, `md`, `lg`

### Tailwind-Merge Integration

For combining Tailwind classes:
```typescript
import { cn } from '../utils'

// Merges and deduplicates classes, last value wins
const classes = cn('bg-red-500 p-4', 'bg-blue-500') // bg-blue-500 wins
```

---

## Data Types & Validation

### Using Zod for Runtime Validation

```typescript
import { z } from 'zod'

// Define schema
const TaskSchema = z.object({
  title: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.number().optional(),
  tags: z.array(z.string()).default([])
})

// Use in form
const data = TaskSchema.parse(formData)

// Type inference
type Task = z.infer<typeof TaskSchema>
```

### Type Definitions Location

- `src/types/auth.ts` - Authentication types
- `src/types/user.ts` - User model
- `src/types/task.ts` - Task model
- `src/types/goal.ts` - Goal model
- `src/types/ui.ts` - UI component types
- `src/types/index.ts` - Re-exports all types

**Important**: Always import types from `src/types`, not specific files.

---

## Common Patterns

### Loading States

```typescript
const { isLoading, error } = useTaskStore()

if (isLoading) return <LoadingSpinner />
if (error) return <ErrorMessage message={error} />
return <TaskList tasks={tasks} />
```

### Error Handling

```typescript
try {
  const result = await createTask(data)
  // Success - store already updated
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error'
  setError(message)
}
```

### Conditional Rendering

```typescript
{currentUser && <UserProfile user={currentUser} />}
{isAuthenticated ? <Dashboard /> : <LoginPrompt />}
{tasks.length > 0 ? <TaskList /> : <EmptyState />}
```

### Responsive Design

```typescript
sx={{
  display: ['none', 'block'],        // Hidden mobile, shown tablet+
  fontSize: [1, 2, 3],               // Scales from mobile to desktop
  p: [2, 3, 4],                      // Different padding per breakpoint
  gridTemplateColumns: ['1fr', '1fr 2fr', '1fr 2fr 1fr']
}}
```

---

## Performance Tips

### 1. Memoization

```typescript
import { useMemo } from 'react'

const MyComponent = ({ items }) => {
  const sorted = useMemo(
    () => items.sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  )
  return <List items={sorted} />
}
```

### 2. Lazy Loading Routes

```typescript
import { lazy, Suspense } from 'react'

const LazyPage = lazy(() => import('./pages/HeavyPage'))

<Route path="/heavy" element={
  <Suspense fallback={<Loading />}>
    <LazyPage />
  </Suspense>
} />
```

### 3. Store Selectors

```typescript
// Bad - re-renders on any store change
const { tasks, goals, users, settings } = useTaskStore()

// Good - only re-renders when tasks change
const tasks = useTaskStore(state => state.tasks)
```

---

## Testing Guide

### Testing Stores

```typescript
import { renderHook, act } from '@testing-library/react'
import { useTaskStore } from '../stores'

it('creates a task', async () => {
  const { result } = renderHook(() => useTaskStore())
  
  await act(async () => {
    await result.current.createTask({
      userId: 'user1',
      title: 'Test'
    })
  })
  
  expect(result.current.tasks).toHaveLength(1)
})
```

### Testing Components

```typescript
import { render, screen } from '@testing-library/react'
import TaskList from '../components/tasks/TaskList'

it('displays tasks', () => {
  render(<TaskList tasks={mockTasks} />)
  expect(screen.getByText('Task 1')).toBeInTheDocument()
})
```

---

## Debugging Tips

### 1. Redux DevTools with Zustand

Add middleware to stores for debugging:
```typescript
import { devtools } from 'zustand/middleware'

export const useTaskStore = create<TaskState>(
  devtools((set, get) => ({
    // ... store implementation
  }), { name: 'TaskStore' })
)
```

### 2. Console Logging

```typescript
// Log store state changes
useEffect(() => {
  console.log('Current user:', currentUser)
}, [currentUser])

// Log component renders
console.log('TaskList rendered')
```

### 3. React DevTools Profiler

1. Open React DevTools
2. Go to Profiler tab
3. Click record
4. Interact with app
5. Analyze performance

---

## Common Issues & Solutions

### Issue: Component Not Re-rendering

**Cause**: Store selector not working correctly
```typescript
// Wrong - whole store subscribes
const store = useTaskStore()

// Right - only tasks cause re-render
const tasks = useTaskStore(state => state.tasks)
```

### Issue: Infinite Loops

**Cause**: Missing dependencies in useEffect
```typescript
// Wrong - will loop
useEffect(() => {
  loadTasks()
})

// Right - only runs when mounted
useEffect(() => {
  loadTasks()
}, [])
```

### Issue: Stale Closures

**Cause**: Functions using old state
```typescript
// Use refs for latest values
const tasksRef = useRef(tasks)
tasksRef.current = tasks

const handleClick = useCallback(() => {
  console.log(tasksRef.current) // Always latest
}, [])
```

---

## Adding New Features Checklist

- [ ] Define types in `src/types/`
- [ ] Create service methods (if data-related)
- [ ] Add store actions
- [ ] Create/update components
- [ ] Add routes if needed
- [ ] Update navigation
- [ ] Test with data
- [ ] Add error handling
- [ ] Optimize performance
- [ ] Write tests

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add my feature"

# Push and create PR
git push origin feature/my-feature

# After review, merge to main
git checkout main
git pull
git merge feature/my-feature
```

---

## Useful Resources

- **Zustand Docs**: https://zustand-demo.vercel.app/
- **React Hook Form**: https://react-hook-form.com/
- **Theme-UI**: https://theme-ui.com/
- **Lucide Icons**: https://lucide.dev/
- **Vite Docs**: https://vitejs.dev/

---

## Architecture Decision Records (ADRs)

### ADR 1: Why Zustand?
- Lightweight (~1KB)
- Minimal boilerplate
- No provider wrapper needed
- Direct hook usage

### ADR 2: Why Service Layer?
- Abstracts data operations
- Easy backend migration
- Testable business logic
- Reusable across components

### ADR 3: Why IndexedDB?
- Offline-first capability
- Large storage quota
- Asynchronous API
- No backend required initially

---

## Notes for Backend Integration

When integrating with backend:

1. **API Client**: Create `src/utils/apiClient.ts` with auth header management
2. **Error Handling**: Implement 401 handling for token expiry
3. **Token Storage**: Store JWT in localStorage (or HTTP-only cookie)
4. **CORS**: Configure backend for frontend domain
5. **Testing**: Use mock API for component testing

See `BACKEND_INTEGRATION_GUIDE.md` for detailed API specification.

---

## Contributing Guidelines

1. Follow the existing code style
2. Use TypeScript for all new code
3. Add types for props interfaces
4. Use meaningful variable names
5. Add comments for complex logic
6. Test before submitting PR
7. Keep commits atomic and descriptive

---

## Quick Navigation

- **New to project?** Start with `ARCHITECTURE.md`
- **Adding backend?** See `BACKEND_INTEGRATION_GUIDE.md`
- **API endpoints needed?** Check `BACKEND_INTEGRATION_GUIDE.md` section 12
- **Styling questions?** Look at `src/styles/theme.ts`
- **Component examples?** Browse `src/components/`

---

Generated: April 2026
Last Updated: Comprehensive frontend review completed
