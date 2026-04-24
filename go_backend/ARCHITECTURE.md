# GO App Architecture

## Overview

The GO app is built with a **service layer architecture** that abstracts data operations. This design allows you to seamlessly transition from IndexedDB (offline-first) to a backend API without refactoring your components or stores.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│         Components & Pages              │  <- UI Layer (React)
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│           Zustand Stores                │  <- State Management
│  (authStore, taskStore, goalStore)      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          Service Layer                  │  <- Business Logic
│  (authService, taskService, etc.)       │  <- ** SWAP THIS FOR BACKEND **
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         IndexedDB (idb)                 │  <- Data Storage (Offline)
└─────────────────────────────────────────┘
```

## Key Principles

### 1. **Components Don't Touch the Database**
Components ONLY interact with Zustand stores. They never directly call database functions or services.

### 2. **Stores Use Services**
Zustand stores call service functions to perform operations. Stores manage state, services handle data operations.

### 3. **Services Abstract Data Operations**
Services provide a consistent interface whether data comes from IndexedDB or a backend API.

## File Structure

```
src/
├── types/              # TypeScript types
│   ├── user.ts
│   ├── task.ts
│   ├── goal.ts
│   ├── auth.ts
│   └── index.ts
│
├── lib/
│   └── db/
│       └── index.ts    # IndexedDB schema
│
├── services/           # ** THIS IS THE KEY LAYER **
│   ├── authService.ts
│   ├── taskService.ts
│   ├── goalService.ts
│   ├── settingsService.ts
│   └── index.ts
│
├── stores/             # Zustand state management
│   ├── authStore.ts
│   ├── taskStore.ts
│   ├── goalStore.ts
│   ├── settingsStore.ts
│   └── index.ts
│
└── pages/              # React components
    ├── LoginPage.tsx
    ├── SignupPage.tsx
    ├── SetupCredentialsPage.tsx
    └── DashboardPage.tsx
```

## How It Works Now (IndexedDB)

### Example: Creating a Task

**1. Component calls store:**
```typescript
const createTask = useTaskStore(state => state.createTask)

await createTask({
  userId: currentUser.id,
  title: 'My task',
  priority: 'high'
})
```

**2. Store calls service:**
```typescript
// In taskStore.ts
createTask: async (data: CreateTaskData) => {
  const task = await taskService.create(data)  // <- Service call
  set(state => ({ tasks: [...state.tasks, task] }))
  return task
}
```

**3. Service handles IndexedDB:**
```typescript
// In taskService.ts
create: async (data: CreateTaskData): Promise<Task> => {
  const db = await getDB()
  const task = { id: generateId(), ...data, createdAt: Date.now() }
  await db.add('tasks', task)
  return task
}
```

## How It Will Work Later (Backend API)

### When Backend Is Ready

**You only need to update the service files. Everything else stays the same!**

**Before (IndexedDB):**
```typescript
// taskService.ts
create: async (data: CreateTaskData): Promise<Task> => {
  const db = await getDB()
  const task = { id: generateId(), ...data, createdAt: Date.now() }
  await db.add('tasks', task)
  return task
}
```

**After (Backend API):**
```typescript
// taskService.ts
create: async (data: CreateTaskData): Promise<Task> => {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error('Failed to create task')
  }

  return response.json()
}
```

**That's it! No changes needed in:**
- ✅ Components
- ✅ Stores
- ✅ Type definitions
- ✅ Business logic

## Database Schema

### Users Table
```typescript
interface User {
  id: string              // Primary key
  email: string           // Unique, indexed
  fullName: string
  passwordHash: string    // SHA-256 hash
  profilePhoto?: string   // Base64 data URL
  createdAt: number       // Timestamp
  updatedAt: number       // Timestamp
}
```

### Tasks Table
```typescript
interface Task {
  id: string              // Primary key
  userId: string          // Foreign key, indexed
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'done'  // Indexed
  priority: 'low' | 'medium' | 'high'
  dueDate?: number        // Timestamp, indexed
  tags: string[]
  goalId?: string         // Foreign key, indexed
  createdAt: number
  updatedAt: number
  completedAt?: number
}
```

### Goals Table
```typescript
interface Goal {
  id: string              // Primary key
  userId: string          // Foreign key, indexed
  title: string
  description?: string
  targetDate?: number     // Timestamp
  status: 'active' | 'completed' | 'archived'  // Indexed
  progress: number        // 0-100
  color?: string
  createdAt: number
  updatedAt: number
  completedAt?: number
}
```

### Settings Table
```typescript
interface UserSettings {
  userId: string          // Primary key
  theme: 'light' | 'dark' | 'auto'
  notifications: boolean
  soundEffects: boolean
  gamificationEnabled: boolean
  weekStartsOn: 0 | 1     // 0 = Sunday, 1 = Monday
  updatedAt: number
}
```

## Authentication Flow

### Signup
1. User fills form on [SetupCredentialsPage.tsx](src/pages/SetupCredentialsPage.tsx)
2. Component calls `signup()` from `authStore`
3. Store calls `authService.signup()`
4. Service hashes password, creates user in IndexedDB
5. Service returns user data
6. Store updates state with current user
7. User ID saved to localStorage for session persistence
8. Navigate to dashboard

### Login
1. User fills form on [LoginPage.tsx](src/pages/LoginPage.tsx)
2. Component calls `login()` from `authStore`
3. Store calls `authService.login()`
4. Service finds user, verifies password hash
5. Service returns user data
6. Store updates state with current user
7. User ID saved to localStorage
8. Navigate to dashboard

### Session Persistence
- User ID stored in localStorage
- On app load, `authStore.initialize()` checks localStorage
- If user ID exists, loads user from IndexedDB
- Auto-login without re-entering credentials

## Security Notes

### Current (Client-Side)
- Passwords hashed with SHA-256 (Web Crypto API)
- Hashes stored in IndexedDB, never plain text
- **Note:** Client-side hashing is NOT secure for production
- This is a placeholder for the backend implementation

### Future (Backend)
- Backend will use bcrypt/argon2 for secure hashing
- Tokens (JWT) for authentication
- HTTPS for all requests
- Rate limiting on auth endpoints
- CSRF protection

## Benefits of This Architecture

### ✅ Separation of Concerns
- UI doesn't know about data storage
- Easy to test each layer independently
- Changes in one layer don't affect others

### ✅ Easy Backend Migration
- Swap services without touching components
- Consistent interface across implementations
- Can even support both (offline + backend sync)

### ✅ Offline-First Ready
- Works without internet immediately
- Can add sync logic later without refactoring
- Progressive enhancement approach

### ✅ Type Safety
- Full TypeScript coverage
- Consistent types across all layers
- Catch errors at compile time

## Next Steps

1. ✅ IndexedDB schema created
2. ✅ Service layer implemented
3. ✅ Zustand stores configured
4. ✅ Authentication working
5. ⏳ Build dashboard UI
6. ⏳ Implement task management
7. ⏳ Implement goal tracking
8. ⏳ Add gamification features
9. ⏳ Build backend API
10. ⏳ Swap service implementations

## Testing the Setup

To verify everything works:

1. **Run the app:**
   ```bash
   npm run dev
   ```

2. **Create an account:**
   - Go to `/signup`
   - Enter email
   - Fill credentials form
   - Check IndexedDB in DevTools (Application tab)

3. **Login:**
   - Logout and login again
   - Should work with stored credentials

4. **Check persistence:**
   - Refresh the page
   - Should remain logged in

## Questions?

If you need to:
- Add a new data model → Create type, update db schema, create service
- Add a new feature → Create store, connect to service, build UI
- Change data source → Update service layer only

The architecture is ready for scaling! 🚀
