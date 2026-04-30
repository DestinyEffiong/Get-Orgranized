# VISUAL ARCHITECTURE SUMMARY

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React + Vite)                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Components (LoginPage, TasksPage, GoalsPage, etc)      │   │
│  │  • Handle user input & UI rendering                      │   │
│  │  • Never touch database directly                         │   │
│  └────────────┬────────────────────────────────────────────┘   │
│               │ Uses Zustand hooks                              │
│               ↓                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Zustand Stores (useAuthStore, useTaskStore,...)        │   │
│  │  • Global state management                              │   │
│  │  • Calls services for operations                        │   │
│  └────────────┬────────────────────────────────────────────┘   │
│               │ Calls business logic                            │
│               ↓                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Service Layer (authService, taskService, ...)          │   │
│  │  • Business logic for each domain                       │   │
│  │  • Makes HTTP calls via apiClient                       │   │
│  └────────────┬────────────────────────────────────────────┘   │
│               │ Makes HTTP requests                             │
│               ↓                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  API Client (apiClient.ts)                              │   │
│  │  • Centralizes HTTP logic                               │   │
│  │  • Handles auth tokens (Bearer JWT)                     │   │
│  │  • Auto-logout on 401                                   │   │
│  │  • Error parsing & status code handling                 │   │
│  └────────────┬────────────────────────────────────────────┘   │
│               │ HTTP: fetch() with Authorization header        │
└───────────────┼──────────────────────────────────────────────────┘
                │
                │ Network
                │ HTTP Request (with JWT token)
                │
┌───────────────▼──────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                   │
│                      http://localhost:3000                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Routes Layer (36 endpoints)                            │   │
│  │  • /api/auth       - 3 endpoints (signup, login, me)    │   │
│  │  • /api/tasks      - 14 endpoints (CRUD + filtering)    │   │
│  │  • /api/goals      - 13 endpoints (CRUD + filtering)    │   │
│  │  • /api/users      - 1 endpoint (profile update)        │   │
│  │                                                         │   │
│  │  ** Route ordering matters!                            │   │
│  │  Specific routes first: /deleted/:id, /search/:id     │   │
│  │  Then generic routes: /:id                             │   │
│  └────────────┬────────────────────────────────────────────┘   │
│               │                                                  │
│               │ All routes pass through:                        │
│               │ • authMiddleware (validates JWT token)          │
│               │                                                  │
│               ↓                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Controllers Layer                                      │   │
│  │  • authController (3 controllers)                       │   │
│  │  • taskController (14 controllers)                      │   │
│  │  • goalController (13 controllers)                      │   │
│  │                                                         │   │
│  │  Each controller:                                      │   │
│  │  1. Validates request input                            │   │
│  │  2. Verifies user ownership (security!)                │   │
│  │  3. Performs database operation                        │   │
│  │  4. Returns response with proper status code           │   │
│  └────────────┬────────────────────────────────────────────┘   │
│               │                                                  │
│               ↓                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Models Layer (Mongoose Schemas)                        │   │
│  │  • User model (user authentication)                     │   │
│  │  • Task model (todos, habits)                           │   │
│  │  • Goal model (goal tracking)                           │   │
│  │  • Settings model (user preferences)                    │   │
│  │                                                         │   │
│  │  Each model has:                                       │   │
│  │  • Validation rules                                     │   │
│  │  • Indexes (for query performance)                      │   │
│  │  • Timestamps (createdAt, updatedAt)                    │   │
│  │  • Soft delete support (deletedAt)                      │   │
│  └────────────┬────────────────────────────────────────────┘   │
│               │                                                  │
│               ↓                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  MongoDB Database                                       │   │
│  │  • Collections: users, tasks, goals, settings           │   │
│  │  • Indexes on: userId, status, dueDate, category, etc   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Overview

### Users Collection
```
{
  id: String (unique, indexed),
  email: String (unique, indexed, lowercase),
  fullName: String,
  passwordHash: String (bcryptjs, 10 rounds),
  profilePhoto: String (base64),
  avatarColor: String,
  createdAt: Date (immutable),
  updatedAt: Date
}
```

### Tasks Collection
```
{
  id: String (unique, indexed),
  userId: String (indexed),
  title: String,
  description: String,
  status: String (enum: todo, in-progress, done) (indexed),
  priority: String (enum: low, medium, high),
  dueDate: Number (timestamp) (indexed),
  reminder: Number (timestamp),
  tags: [String],
  goalId: String (indexed),
  isHabit: Boolean,
  habitDays: [Number],
  habitCompletions: Map<String, Boolean>,
  createdAt: Date,
  updatedAt: Date,
  completedAt: Number,
  deletedAt: Number (indexed) <- soft delete
}

Compound Indexes:
- userId + status
- userId + dueDate
- userId + goalId
```

### Goals Collection
```
{
  id: String (unique, indexed),
  userId: String (indexed),
  title: String,
  description: String,
  category: String (enum: work, personal, health, ...) (indexed),
  parentGoalId: String (indexed),
  targetDate: Number (timestamp) (indexed),
  status: String (enum: active, completed, archived) (indexed),
  createdAt: Date,
  updatedAt: Date,
  completedAt: Number,
  deletedAt: Number (indexed) <- soft delete
}

Compound Indexes:
- userId + status
- userId + targetDate
- userId + category
```

---

## Request/Response Flow Example

### Create Task Flow

```
1. USER ACTION (Frontend)
   ┌─────────────────────────────────┐
   │ User clicks "Add Task"          │
   │ Fills form (title, priority)    │
   │ Clicks Submit                   │
   └──────────────┬──────────────────┘
                  │
                  ↓
2. COMPONENT (LoginPage.tsx)
   ┌─────────────────────────────────────────────────────────┐
   │ <AddTaskModal>                                          │
   │   onSubmit={(data) => {                                 │
   │     createTask = useTaskStore(s => s.createTask)        │
   │     await createTask(data)  ← Calls store action        │
   │   }}                                                    │
   └──────────────┬──────────────────────────────────────────┘
                  │
                  ↓
3. ZUSTAND STORE (taskStore.ts)
   ┌─────────────────────────────────────────────────────────┐
   │ createTask: async (data) => {                           │
   │   set({ error: null, isLoading: true })                 │
   │                                                         │
   │   const task = await taskService.create(data)           │
   │                 ← Calls service layer                   │
   │                                                         │
   │   set(state => ({                                       │
   │     tasks: [...state.tasks, task],                      │
   │     isLoading: false                                    │
   │   }))                                                   │
   │   return task                                           │
   │ }                                                       │
   └──────────────┬──────────────────────────────────────────┘
                  │
                  ↓
4. SERVICE LAYER (taskService.ts)
   ┌─────────────────────────────────────────────────────────┐
   │ export const taskService = {                            │
   │   create: async (data: CreateTaskData) => {             │
   │     return await apiPost('/api/tasks', {                │
   │       userId: getCurrentUserId(),                       │
   │       title: data.title,                                │
   │       priority: data.priority,                          │
   │       ...                                               │
   │     })   ← Makes HTTP call                              │
   │   }                                                     │
   │ }                                                       │
   └──────────────┬──────────────────────────────────────────┘
                  │
                  ↓
5. API CLIENT (apiClient.ts)
   ┌─────────────────────────────────────────────────────────┐
   │ export const apiPost = async (endpoint, body) => {      │
   │   const token = getAuthToken()  ← Get JWT token        │
   │                                                         │
   │   const response = await fetch(url, {                   │
   │     method: 'POST',                                     │
   │     headers: {                                          │
   │       'Content-Type': 'application/json',               │
   │       'Authorization': `Bearer ${token}`                │
   │     },                                                  │
   │     body: JSON.stringify(body),                         │
   │     credentials: 'include'                              │
   │   })                                                    │
   │                                                         │
   │   if (response.status === 401) {                        │
   │     clearAuthToken()  ← Auto-logout if token invalid   │
   │     redirectToLogin()                                   │
   │   }                                                     │
   │                                                         │
   │   return response.json()                                │
   │ }                                                       │
   └──────────────┬──────────────────────────────────────────┘
                  │ HTTP POST
                  │ POST http://localhost:3000/api/tasks
                  │ Authorization: Bearer <JWT_TOKEN>
                  │ Body: { userId, title, priority, ... }
                  │
                  ↓
6. BACKEND ROUTING
   ┌─────────────────────────────────────────────────────────┐
   │ Router matches: POST /api/tasks                         │
   │ Middleware: authMiddleware ← Verifies JWT token         │
   │ Handler: createTask controller                          │
   └──────────────┬──────────────────────────────────────────┘
                  │
                  ↓
7. CONTROLLER (taskController.js - createTask)
   ┌─────────────────────────────────────────────────────────┐
   │ export const createTask = async (req, res) => {         │
   │   // 1. Validate input                                  │
   │   const { title, priority, ... } = req.body             │
   │   if (!title) return res.status(400).json({...})        │
   │                                                         │
   │   // 2. Create model                                    │
   │   const task = new Task({                               │
   │     id: generateId(),                                   │
   │     userId: req.userId,  ← From auth middleware         │
   │     title,                                              │
   │     priority,                                           │
   │     status: 'todo',                                     │
   │     createdAt: new Date(),                              │
   │     ...                                                 │
   │   })                                                    │
   │                                                         │
   │   // 3. Save to database                                │
   │   await task.save()  ← MongoDB insert                   │
   │                                                         │
   │   // 4. Return response                                 │
   │   res.status(201).json({                                │
   │     task: taskToResponse(task)  ← Formatted response    │
   │   })                                                    │
   │ }                                                       │
   └──────────────┬──────────────────────────────────────────┘
                  │
                  ↓
8. DATABASE
   ┌─────────────────────────────────────────────────────────┐
   │ MongoDB: db.tasks.insertOne({                           │
   │   id: "1234-5678",                                      │
   │   userId: "user-123",                                   │
   │   title: "Buy groceries",                               │
   │   priority: "high",                                     │
   │   status: "todo",                                       │
   │   createdAt: 2026-04-24T...,                            │
   │   ...                                                   │
   │ })                                                      │
   └──────────────┬──────────────────────────────────────────┘
                  │ Returns inserted document
                  │
                  ↓
9. HTTP RESPONSE (201 Created)
   ┌──────────────────────────────────────────────────────────┐
   │ {                                                        │
   │   "task": {                                              │
   │     "id": "1234-5678",                                   │
   │     "userId": "user-123",                                │
   │     "title": "Buy groceries",                            │
   │     "priority": "high",                                  │
   │     "status": "todo",                                    │
   │     "createdAt": "2026-04-24T...",                       │
   │     ...                                                  │
   │   }                                                      │
   │ }                                                        │
   └──────────────┬───────────────────────────────────────────┘
                  │ HTTP Response via network
                  │
                  ↓
10. API CLIENT PARSES RESPONSE (apiClient.ts)
    ┌──────────────────────────────────────────────────────────┐
    │ if (!response.ok) throw new ApiError(...)                │
    │ if (response.status === 204) return undefined             │
    │ return await response.json()  ← Parse response           │
    └──────────────┬───────────────────────────────────────────┘
                   │
                   ↓
11. SERVICE RETURNS TASK (taskService.ts)
    ┌──────────────────────────────────────────────────────────┐
    │ create: async (data) => {                                │
    │   return await apiPost(...)  ← Returns parsed response   │
    │ }                                                        │
    └──────────────┬───────────────────────────────────────────┘
                   │
                   ↓
12. STORE UPDATES STATE (taskStore.ts)
    ┌──────────────────────────────────────────────────────────┐
    │ createTask: async (data) => {                            │
    │   const task = await taskService.create(data)            │
    │                                                          │
    │   set(state => ({                                        │
    │     tasks: [...state.tasks, task],  ← Add to state      │
    │     isLoading: false                                    │
    │   }))                                                    │
    │ }                                                        │
    └──────────────┬───────────────────────────────────────────┘
                   │
                   ↓
13. COMPONENT RE-RENDERS
    ┌──────────────────────────────────────────────────────────┐
    │ <TasksList>                                              │
    │   const tasks = useTaskStore(s => s.tasks)               │
    │   return (                                               │
    │     <ul>                                                 │
    │       {tasks.map(t => <li>{t.title}</li>)}              │
    │       ← Includes our new task!                          │
    │     </ul>                                                │
    │   )                                                      │
    │ }                                                        │
    └──────────────────────────────────────────────────────────┘

14. USER SEES NEW TASK ✅
    "Buy groceries" appears in the UI immediately!
```

---

## Security Pattern: Ownership Verification

**Critical for every operation:**

```javascript
// BAD ❌ - Missing ownership check
export const updateTask = async (req, res) => {
  const task = await Task.findOne({ id: taskId })
  Object.assign(task, updates)  // ← Anyone could modify any task!
  await task.save()
  res.json({ task })
}

// GOOD ✅ - Verifies user owns task
export const updateTask = async (req, res) => {
  const task = await Task.findOne({ id: taskId })
  
  if (!task) {
    return res.status(404).json({ error: 'Not found' })
  }
  
  // Verify ownership BEFORE modifying
  if (task.userId !== req.userId) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  
  Object.assign(task, updates)
  await task.save()
  res.json({ task })
}
```

**Every endpoint must verify:**
- Task belongs to current user: `task.userId === req.userId`
- Goal belongs to current user: `goal.userId === req.userId`
- User only updates own profile: `userId === req.userId`

---

## Testing Pattern

### Unit Test (Mock Service)
```javascript
// Mock the service layer
const mockTaskService = {
  create: jest.fn().mockResolvedValue({ id: '123', title: 'Test' })
}

// Test component without backend
test('AddTaskModal calls taskService.create', async () => {
  render(<AddTaskModal />)
  fireEvent.change(input, { target: { value: 'Test task' } })
  fireEvent.click(submitButton)
  
  expect(mockTaskService.create).toHaveBeenCalled()
})
```

### Integration Test (Real Backend)
```javascript
test('POST /api/tasks creates task', async () => {
  const response = await fetch('http://localhost:3000/api/tasks', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ title: 'Test' })
  })
  
  expect(response.status).toBe(201)
  const data = await response.json()
  expect(data.task.title).toBe('Test')
})
```

---

## Performance Considerations

### Database Indexes (We Have)
```javascript
// Reduces query time from O(n) to O(log n)
Task.find({ userId: '123', status: 'todo' })  ← Uses compound index
Task.find({ dueDate: { $gte: today } })       ← Uses index
```

### What to Add (Future Optimization)
```javascript
// 1. Pagination - Don't return all tasks
GET /api/tasks?userId=123&limit=50&offset=0  ← Only 50 at a time

// 2. Caching - Cache frequent queries in Redis
GET /api/tasks/due-today/:userId  ← Could cache (rarely changes)

// 3. Batch Operations - Create multiple tasks in one request
POST /api/tasks/batch
{ "tasks": [...] }  ← Create 10 tasks at once

// 4. Lazy Loading - Don't load all fields
GET /api/tasks?fields=id,title,status  ← Only needed fields
```

---

## Error Handling Pattern

```javascript
// Every endpoint should handle:

try {
  // 1. Missing required fields
  if (!req.body.title) {
    return res.status(400).json({
      error: { message: 'Title required', code: 'MISSING_TITLE' }
    })
  }
  
  // 2. Invalid enum values
  if (!['low', 'medium', 'high'].includes(priority)) {
    return res.status(400).json({
      error: { message: 'Invalid priority', code: 'INVALID_PRIORITY' }
    })
  }
  
  // 3. Resource not found
  const task = await Task.findOne({ id: taskId })
  if (!task) {
    return res.status(404).json({
      error: { message: 'Task not found', code: 'NOT_FOUND' }
    })
  }
  
  // 4. Ownership verification
  if (task.userId !== req.userId) {
    return res.status(403).json({
      error: { message: 'Forbidden', code: 'FORBIDDEN' }
    })
  }
  
  // 5. Unexpected errors
  // ... perform operation
  
} catch (error) {
  console.error('Error:', error.stack)  // Log for debugging
  res.status(500).json({
    error: { message: 'Server error', code: 'SERVER_ERROR' }
  })
}
```

---

## Summary

✅ **What We Built**
- 36 REST API endpoints (Auth, Tasks, Goals, Users)
- Clean 3-layer architecture (routes → controllers → models)
- Proper security patterns (ownership verification, input validation)
- Full TypeScript support
- Comprehensive error handling

⚠️ **What Needs Fixing**
- Password validation (high priority)
- Rate limiting (security)
- Request logging (debugging)
- Input sanitization (security)
- Refresh token strategy (scalability)

🚀 **Next Steps**
- Fix security issues
- Migrate frontend services to API
- Load testing
- Performance optimization
- Production deployment
