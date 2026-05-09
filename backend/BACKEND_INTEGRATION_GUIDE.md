# Backend Integration Guide - GetOrganized Frontend

## Overview

This document identifies all backend communication points and provides a roadmap for integrating a Node.js/Express backend with the existing frontend architecture.

**Current State**: Frontend uses IndexedDB (offline-first) with a service layer that abstracts data operations.

**Migration Strategy**: Replace service layer implementations with API calls. Components and stores remain unchanged.

---

## 1. Authentication API Endpoints Required

### 1.1 User Signup
**Frontend Call**: `authService.signup(SignupData)`

**API Endpoint**: `POST /api/auth/signup`
```typescript
Request Body:
{
  email: string
  password: string
  fullName: string
  profilePhoto?: string (base64)
}

Response (200):
{
  user: {
    id: string
    email: string
    fullName: string
    profilePhoto?: string
    avatarColor?: string
    createdAt: number
    updatedAt: number
  },
  token?: string // JWT or session token
}

Error (400/409):
{
  message: string
}
```

**Security Notes**:
- Hash password server-side (client sends plaintext over HTTPS)
- Generate JWT or session token
- Create default UserSettings record on signup
- Validate email uniqueness

### 1.2 User Login
**Frontend Call**: `authService.login(credentials)`

**API Endpoint**: `POST /api/auth/login`
```typescript
Request Body:
{
  email: string
  password: string
}

Response (200):
{
  user: User,
  token?: string
}

Error (401):
{
  message: "Invalid email or password"
}
```

**Security Notes**:
- Return same user object as signup (no password hash)
- JWT should include user ID for claims
- Consider refresh token strategy

### 1.3 Get Current User (Auth Check)
**Frontend Call**: `authService.getCurrentUser()`

**API Endpoint**: `GET /api/auth/me`
```typescript
Headers:
{
  Authorization: "Bearer {token}"
}

Response (200):
{
  user: User
}

Error (401):
{
  message: "Unauthorized"
}
```

**Security Notes**:
- Verify JWT token
- Return user without password hash

### 1.4 Logout
**Frontend Call**: `authService.logout()`

**API Endpoint**: `POST /api/auth/logout`
```typescript
Headers:
{
  Authorization: "Bearer {token}"
}

Response (200):
{
  message: "Logged out"
}
```

**Security Notes**:
- Invalidate token if using token blacklist
- Clear session if using sessions

### 1.5 Update Profile
**Frontend Call**: `authService.updateProfile(userId, updates)`

**API Endpoint**: `PATCH /api/users/{userId}/profile`
```typescript
Request Body:
{
  fullName?: string
  profilePhoto?: string (base64)
  avatarColor?: string
}

Response (200):
{
  user: User
}

Error (404/403):
{
  message: string
}
```

**Security Notes**:
- Verify user owns the profile
- Validate/optimize image uploads (consider separate endpoint)

### 1.6 Change Password
**Frontend Call**: `authService.changePassword(oldPassword, newPassword)`

**API Endpoint**: `POST /api/auth/change-password`
```typescript
Request Body:
{
  oldPassword: string
  newPassword: string
}

Response (200):
{
  message: "Password changed"
}

Error (401/400):
{
  message: string
}
```

**Security Notes**:
- Verify old password before changing
- Hash new password server-side
- Consider requiring re-authentication

---

## 2. Task Management API Endpoints

### 2.1 Create Task
**Frontend Call**: `taskService.create(CreateTaskData)`

**API Endpoint**: `POST /api/tasks`
```typescript
Request Body:
{
  userId: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: number (timestamp)
  reminder?: number (timestamp)
  tags?: string[]
  goalId?: string
  isHabit?: boolean
  habitDays?: number[] (0-6)
}

Response (201):
{
  task: Task
}

Error (400/403):
{
  message: string
}
```

### 2.2 Get All Tasks for User
**Frontend Call**: `taskService.getAllByUser(userId)`

**API Endpoint**: `GET /api/tasks?userId={userId}`
```typescript
Headers:
{
  Authorization: "Bearer {token}"
}

Response (200):
{
  tasks: Task[] (excludes deletedAt !== null)
}

Error (401/403):
{
  message: string
}
```

### 2.3 Get Task by ID
**Frontend Call**: `taskService.getById(taskId)`

**API Endpoint**: `GET /api/tasks/{taskId}`
```typescript
Headers:
{
  Authorization: "Bearer {token}"
}

Response (200):
{
  task: Task
}

Error (404/403):
{
  message: string
}
```

### 2.4 Update Task
**Frontend Call**: `taskService.update(taskId, updates)`

**API Endpoint**: `PATCH /api/tasks/{taskId}`
```typescript
Request Body:
{
  title?: string
  description?: string
  status?: 'todo' | 'in-progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: number
  reminder?: number
  tags?: string[]
  goalId?: string
  isHabit?: boolean
  habitDays?: number[]
}

Response (200):
{
  task: Task
}

Error (404/403/400):
{
  message: string
}
```

### 2.5 Soft Delete Task (Move to Trash)
**Frontend Call**: `taskService.delete(taskId)`

**API Endpoint**: `DELETE /api/tasks/{taskId}` (soft delete - sets deletedAt)
```typescript
Response (200):
{
  message: "Task moved to trash"
}

Error (404/403):
{
  message: string
}
```

### 2.6 Restore Task from Trash
**Frontend Call**: `taskService.restore(taskId)`

**API Endpoint**: `POST /api/tasks/{taskId}/restore`
```typescript
Response (200):
{
  task: Task (with deletedAt cleared)
}

Error (404/403):
{
  message: string
}
```

### 2.7 Permanently Delete Task
**Frontend Call**: `taskService.permanentDelete(taskId)`

**API Endpoint**: `DELETE /api/tasks/{taskId}/permanent`
```typescript
Response (204): No Content

Error (404/403):
{
  message: string
}
```

### 2.8 Get Deleted Tasks
**Frontend Call**: `taskService.getDeleted(userId)`

**API Endpoint**: `GET /api/tasks/deleted?userId={userId}`
```typescript
Response (200):
{
  tasks: Task[] (only deletedAt !== null)
}
```

### 2.9 Get Tasks by Status
**Frontend Call**: `taskService.getByStatus(userId, status)`

**API Endpoint**: `GET /api/tasks?userId={userId}&status={status}`
```typescript
Response (200):
{
  tasks: Task[]
}
```

### 2.10 Get Tasks by Goal
**Frontend Call**: `taskService.getByGoal(goalId)`

**API Endpoint**: `GET /api/tasks?goalId={goalId}`
```typescript
Response (200):
{
  tasks: Task[]
}
```

### 2.11 Get Due Today Tasks
**Frontend Call**: `taskService.getDueToday(userId)`

**API Endpoint**: `GET /api/tasks/due-today?userId={userId}`
```typescript
Response (200):
{
  tasks: Task[] (due between today 00:00 and tomorrow 00:00)
}
```

### 2.12 Get Overdue Tasks
**Frontend Call**: `taskService.getOverdue(userId)`

**API Endpoint**: `GET /api/tasks/overdue?userId={userId}`
```typescript
Response (200):
{
  tasks: Task[] (dueDate < today AND status !== 'done')
}
```

### 2.13 Toggle Habit Completion
**Frontend Call**: `taskService.toggleHabitCompletion(taskId, date)`

**API Endpoint**: `POST /api/tasks/{taskId}/habits/toggle`
```typescript
Request Body:
{
  date: string (YYYY-MM-DD)
}

Response (200):
{
  task: Task (habitCompletions updated)
}
```

### 2.14 Search Tasks
**Frontend Call**: `taskService.search(userId, query)`

**API Endpoint**: `GET /api/tasks/search?userId={userId}&q={query}`
```typescript
Response (200):
{
  tasks: Task[]
}
```

---

## 3. Goal Management API Endpoints

### 3.1 Create Goal
**Frontend Call**: `goalService.create(CreateGoalData)`

**API Endpoint**: `POST /api/goals`
```typescript
Request Body:
{
  userId: string
  title: string
  description: string
  category: GoalCategory
  parentGoalId?: string
  targetDate?: number
}

Response (201):
{
  goal: Goal
}
```

### 3.2 Get All Goals for User
**Frontend Call**: `goalService.getAllByUser(userId)`

**API Endpoint**: `GET /api/goals?userId={userId}`
```typescript
Response (200):
{
  goals: Goal[] (excludes deletedAt !== null)
}
```

### 3.3 Get Active Goals
**Frontend Call**: `goalService.getActive(userId)`

**API Endpoint**: `GET /api/goals?userId={userId}&status=active`
```typescript
Response (200):
{
  goals: Goal[]
}
```

### 3.4 Get Completed Goals
**Frontend Call**: `goalService.getCompleted(userId)`

**API Endpoint**: `GET /api/goals?userId={userId}&status=completed`
```typescript
Response (200):
{
  goals: Goal[]
}
```

### 3.5 Update Goal
**Frontend Call**: `goalService.update(goalId, updates)`

**API Endpoint**: `PATCH /api/goals/{goalId}`
```typescript
Request Body:
{
  title?: string
  description?: string
  category?: GoalCategory
  targetDate?: number
  status?: 'active' | 'completed' | 'archived'
}

Response (200):
{
  goal: Goal
}
```

### 3.6 Complete Goal
**Frontend Call**: `goalService.complete(goalId)`

**API Endpoint**: `POST /api/goals/{goalId}/complete`
```typescript
Response (200):
{
  goal: Goal (status='completed', completedAt set)
}
```

### 3.7 Archive Goal
**Frontend Call**: `goalService.archive(goalId)`

**API Endpoint**: `POST /api/goals/{goalId}/archive`
```typescript
Response (200):
{
  goal: Goal (status='archived')
}
```

### 3.8 Soft Delete Goal
**Frontend Call**: `goalService.delete(goalId)`

**API Endpoint**: `DELETE /api/goals/{goalId}`
```typescript
Response (200):
{
  message: "Goal moved to trash"
}
```

### 3.9 Restore Goal
**Frontend Call**: `goalService.restore(goalId)`

**API Endpoint**: `POST /api/goals/{goalId}/restore`
```typescript
Response (200):
{
  goal: Goal
}
```

### 3.10 Permanently Delete Goal
**Frontend Call**: `goalService.permanentDelete(goalId)`

**API Endpoint**: `DELETE /api/goals/{goalId}/permanent`
```typescript
Response (204): No Content
```

### 3.11 Get Deleted Goals
**Frontend Call**: `goalService.getDeleted(userId)`

**API Endpoint**: `GET /api/goals/deleted?userId={userId}`
```typescript
Response (200):
{
  goals: Goal[]
}
```

### 3.12 Get Goals Nearing Deadline
**Frontend Call**: `goalService.getNearingDeadline(userId)`

**API Endpoint**: `GET /api/goals/nearing-deadline?userId={userId}`
```typescript
Response (200):
{
  goals: Goal[] (due within 7 days)
}
```

### 3.13 Search Goals
**Frontend Call**: `goalService.search(userId, query)`

**API Endpoint**: `GET /api/goals/search?userId={userId}&q={query}`
```typescript
Response (200):
{
  goals: Goal[]
}
```

---

## 4. Settings API Endpoints

### 4.1 Get User Settings
**Frontend Call**: `settingsService.get(userId)`

**API Endpoint**: `GET /api/settings/{userId}`
```typescript
Headers:
{
  Authorization: "Bearer {token}"
}

Response (200):
{
  settings: UserSettings
}

Response (404):
{
  settings: null (return defaults from frontend)
}
```

### 4.2 Update Settings
**Frontend Call**: `settingsService.update(userId, updates)`

**API Endpoint**: `PATCH /api/settings/{userId}`
```typescript
Request Body:
{
  theme?: 'light' | 'dark' | 'auto'
  notifications?: boolean
  soundEffects?: boolean
  gamificationEnabled?: boolean
  weekStartsOn?: 0 | 1
}

Response (200):
{
  settings: UserSettings
}
```

### 4.3 Reset Settings to Default
**Frontend Call**: `settingsService.reset(userId)`

**API Endpoint**: `POST /api/settings/{userId}/reset`
```typescript
Response (200):
{
  settings: UserSettings (reset to defaults)
}
```

---

## 5. Authentication & Session Management

### 5.1 Token Management Strategy

**Current Frontend Implementation**:
```typescript
// localStorage.currentUserId stores user ID
localStorage.setItem('currentUserId', user.id)
```

**Recommended Backend Strategy**:

**Option A: JWT (Stateless)**
```typescript
// On login/signup response:
const { user, token } = await login(credentials)
localStorage.setItem('authToken', token)

// On subsequent requests:
headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
```

**Option B: HTTP-Only Cookies (More Secure)**
```typescript
// Backend sets Set-Cookie header
// Frontend automatically sends cookies with requests
// Implement refresh token endpoint for token rotation
```

**Recommended**: Option B (HTTP-only cookies) for production security

### 5.2 Auth Header Implementation

**Required Change in Service Layer**:
```typescript
// Current (frontend only):
const response = await fetch('/api/tasks', {
  method: 'POST',
  body: JSON.stringify(data)
})

// After backend integration:
const response = await fetch('/api/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  },
  body: JSON.stringify(data),
  credentials: 'include' // For cookies
})
```

### 5.3 Create Utility for API Client

**Create**: `src/utils/apiClient.ts`
```typescript
export const getAuthToken = () => localStorage.getItem('authToken')

export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = getAuthToken()
  
  return fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: 'include',
  })
}
```

---

## 6. Error Handling Strategy

### 6.1 HTTP Status Codes Expected

| Status | Meaning | Frontend Action |
|--------|---------|-----------------|
| 200 | OK | Process response |
| 201 | Created | Process response |
| 204 | No Content | Success, no data |
| 400 | Bad Request | Show validation error |
| 401 | Unauthorized | Redirect to login, clear auth |
| 403 | Forbidden | Show "access denied" |
| 404 | Not Found | Show "not found" |
| 409 | Conflict | Show conflict error (e.g., email exists) |
| 500 | Server Error | Show generic error |

### 6.2 Error Response Format

**Recommended**:
```typescript
{
  error: {
    message: string
    code: string
    details?: any
  }
}
```

### 6.3 401 Handling (Auto-logout)

**Add to Service Layer**:
```typescript
if (response.status === 401) {
  // Clear auth state
  localStorage.removeItem('authToken')
  useAuthStore.getState().logout()
  // Redirect to login
  window.location.href = '/login'
}
```

---

## 7. Synchronization Strategy

### 7.1 Online-First vs Offline-First

**Current**: IndexedDB allows offline-first (all data cached locally)

**Options**:

**Option A: Online-Only** (Simplest)
- Remove IndexedDB
- All data comes from API
- Show offline state when no connection
- No sync complexity

**Option B: Offline-First with Sync** (Complex)
- Keep IndexedDB for offline access
- Queue operations when offline
- Sync when back online
- Handle merge conflicts

**Recommendation**: Start with Option A (Online-Only), add offline support later if needed

### 7.2 Caching Strategy

If keeping IndexedDB for performance:
```typescript
// Load from API first
const tasks = await fetch('/api/tasks')

// Update cache and state
const tasksData = await tasks.json()
await db.put('tasks', tasksData)
store.setTasks(tasksData)
```

---

## 8. Specific Data Flow Examples

### 8.1 Create Task Flow

**Current (IndexedDB)**:
```
Component → TaskStore.createTask()
         → TaskService.create()
         → IndexedDB.add('tasks', task)
         → Return task to component
         → UI updates
```

**After Backend Integration**:
```
Component → TaskStore.createTask()
         → TaskService.create()
         → fetch('/api/tasks', { POST, data })
         → Response: { task }
         → Update IndexedDB (optional)
         → Return task to component
         → UI updates
```

### 8.2 Authentication Flow

**Current**:
```
LoginForm.submit()
→ authStore.login()
→ authService.login()
→ IndexedDB query for user
→ Verify password locally
→ localStorage.setItem('currentUserId')
→ Navigate to dashboard
```

**After Backend Integration**:
```
LoginForm.submit()
→ authStore.login()
→ authService.login()
→ fetch('/api/auth/login', { POST, credentials })
→ Response: { user, token }
→ localStorage.setItem('authToken', token)
→ localStorage.setItem('currentUserId', user.id) // Optional
→ Navigate to dashboard
```

---

## 9. Implementation Checklist

### Phase 1: Setup (No Data Loss)
- [ ] Create API client utility (`src/utils/apiClient.ts`)
- [ ] Create `.env` file with `VITE_API_BASE_URL`
- [ ] Update `ProtectedRoute` to call `/api/auth/me` on mount
- [ ] Implement 401 handling (auto-logout)

### Phase 2: Authentication (Critical)
- [ ] Update `authService.signup()` to use API
- [ ] Update `authService.login()` to use API
- [ ] Update `authService.getCurrentUser()` to use API
- [ ] Update `authService.logout()` to use API
- [ ] Remove IndexedDB user storage

### Phase 3: Tasks (High Priority)
- [ ] Update all `taskService` methods
- [ ] Remove IndexedDB task storage
- [ ] Test CRUD operations
- [ ] Test search/filter endpoints

### Phase 4: Goals (High Priority)
- [ ] Update all `goalService` methods
- [ ] Remove IndexedDB goal storage
- [ ] Test CRUD operations

### Phase 5: Settings (Medium Priority)
- [ ] Update `settingsService` methods
- [ ] Remove IndexedDB settings storage

### Phase 6: Cleanup (Optional)
- [ ] Remove IndexedDB initialization if fully migrated
- [ ] Remove `dexie` dependency
- [ ] Remove `idb` dependency

---

## 10. Environment Configuration

**Create**: `.env`
```
VITE_API_BASE_URL=http://localhost:3000
```

**Create**: `.env.production`
```
VITE_API_BASE_URL=https://api.yourdomain.com
```

**Update**: `src/utils/apiClient.ts`
```typescript
const baseURL = import.meta.env.VITE_API_BASE_URL
```

---

## 11. Data Validation

Frontend already uses **Zod** for validation. Endpoints should validate:

### Task Validation
- Title: non-empty, max 255 chars
- Priority: must be 'low', 'medium', or 'high'
- Status: must be 'todo', 'in-progress', or 'done'
- DueDate: valid timestamp or null
- Tags: array of strings, max 50 each
- GoalId: valid goal ID or null

### Goal Validation
- Title: non-empty, max 255 chars
- Description: max 1000 chars
- Category: must be valid GoalCategory
- TargetDate: valid timestamp or null

### User Validation
- Email: valid email format, unique
- Password: min 8 chars, complexity requirements
- FullName: non-empty, max 255 chars

---

## 12. API Endpoints Summary

### Auth Endpoints (6)
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
- PATCH /api/users/{userId}/profile
- POST /api/auth/change-password

### Task Endpoints (14)
- POST /api/tasks
- GET /api/tasks (with filters)
- GET /api/tasks/{taskId}
- PATCH /api/tasks/{taskId}
- DELETE /api/tasks/{taskId}
- POST /api/tasks/{taskId}/restore
- DELETE /api/tasks/{taskId}/permanent
- GET /api/tasks/deleted
- GET /api/tasks (by-status)
- GET /api/tasks (by-goal)
- GET /api/tasks/due-today
- GET /api/tasks/overdue
- POST /api/tasks/{taskId}/habits/toggle
- GET /api/tasks/search

### Goal Endpoints (13)
- POST /api/goals
- GET /api/goals
- GET /api/goals/{goalId}
- PATCH /api/goals/{goalId}
- POST /api/goals/{goalId}/complete
- POST /api/goals/{goalId}/archive
- DELETE /api/goals/{goalId}
- POST /api/goals/{goalId}/restore
- DELETE /api/goals/{goalId}/permanent
- GET /api/goals/deleted
- GET /api/goals/nearing-deadline
- GET /api/goals/search

### Settings Endpoints (3)
- GET /api/settings/{userId}
- PATCH /api/settings/{userId}
- POST /api/settings/{userId}/reset

**Total: 36 API Endpoints**

---

## 13. Security Best Practices

1. **HTTPS Only**: All API communication over HTTPS in production
2. **CORS**: Configure CORS on backend to allow frontend domain
3. **Rate Limiting**: Implement rate limiting on endpoints
4. **Input Validation**: Validate all inputs server-side
5. **Authorization**: Verify user owns data before returning
6. **SQL Injection**: Use parameterized queries
7. **CSRF Protection**: Use CSRF tokens if using cookies
8. **Password**: Hash with bcrypt (min 10 rounds)
9. **Token Expiry**: JWT tokens should expire (15-60 min)
10. **Refresh Tokens**: Implement refresh token rotation

---

## 14. Testing Checklist

- [ ] Test signup with new email
- [ ] Test signup with existing email (409 error)
- [ ] Test login with correct credentials
- [ ] Test login with wrong password
- [ ] Test protected routes without auth (401 redirect)
- [ ] Test task CRUD operations
- [ ] Test task filtering by status/date/goal
- [ ] Test goal CRUD operations
- [ ] Test soft delete and restore
- [ ] Test permanent delete
- [ ] Test settings update
- [ ] Test 401 auto-logout
- [ ] Test network error handling

---

## 15. Performance Considerations

1. **Pagination**: Implement for large datasets (tasks, goals)
2. **Batch Operations**: Allow creating multiple items in one request
3. **Lazy Loading**: Load data only when needed
4. **Caching**: Cache API responses strategically
5. **Compression**: Enable gzip on backend
6. **CDN**: Serve static files from CDN

**Recommended Query Params**:
```
GET /api/tasks?userId={id}&limit=50&offset=0&sort=dueDate&order=asc
```

---

## 16. Migration Timeline Example

**Week 1**: Setup + Auth APIs
**Week 2**: Task APIs
**Week 3**: Goal APIs
**Week 4**: Settings + Polish
**Week 5**: Testing + Bug Fixes
**Week 6**: Deploy to Production

---

## References

- Frontend Architecture: See `ARCHITECTURE.md`
- Current IndexedDB Schema: `src/lib/db/index.ts`
- Service Layer: `src/services/*.ts`
- Zustand Stores: `src/stores/*.ts`
- Type Definitions: `src/types/*.ts`

---

## Questions & Notes

For API design questions, refer to the REST conventions:
- GET for read operations
- POST for create operations
- PATCH for partial updates
- DELETE for deletions
- PUT for replace operations (not used here)

Status codes follow HTTP standards documented above.

Error responses should be consistent across all endpoints.

All timestamps should be in UTC milliseconds (JavaScript standard).
