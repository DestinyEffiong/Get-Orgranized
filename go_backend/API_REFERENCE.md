# API ENDPOINTS REFERENCE GUIDE

## Status
- ✅ Implemented: Auth (3), Tasks (14), Goals (13), Users (1)
- 🚧 Not Yet Tested at Scale
- 📋 Total: 36 endpoints

---

## Authentication Endpoints (3)

### 1. Signup
```
POST /api/auth/signup
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe",
  "profilePhoto": "data:image/..." (optional)
}

Response (201):
{
  "user": {
    "id": "1234-5678",
    "email": "user@example.com",
    "fullName": "John Doe",
    "profilePhoto": null,
    "avatarColor": null,
    "createdAt": "2026-04-24T...",
    "updatedAt": "2026-04-24T..."
  },
  "token": "eyJhbGc..."
}

Error (409): User with this email already exists
Error (400): Email, password, and fullName are required
```

### 2. Login
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "user": { ... },
  "token": "eyJhbGc..."
}

Error (401): Invalid email or password
Error (400): Email and password are required
```

### 3. Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>

Response (200):
{
  "user": { ... }
}

Error (401): Missing authorization header / Invalid or expired token
```

---

## Task Endpoints (14)

### 1. Create Task
```
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "userId": "1234-5678",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "priority": "high",
  "dueDate": 1713920400000,
  "tags": ["shopping", "urgent"],
  "goalId": "goal-123" (optional),
  "isHabit": false,
  "habitDays": [] (optional)
}

Response (201):
{
  "task": {
    "id": "task-456",
    "userId": "1234-5678",
    "title": "Buy groceries",
    "status": "todo",
    "priority": "high",
    "dueDate": 1713920400000,
    "tags": ["shopping", "urgent"],
    "isHabit": false,
    "habitCompletions": {},
    "createdAt": "2026-04-24T...",
    "updatedAt": "2026-04-24T..."
  }
}

Error (400): Title is required / Invalid priority
```

### 2. Get All Tasks (with Filters)
```
GET /api/tasks?userId=1234&status=todo&goalId=goal-123&limit=50&offset=0&sort=dueDate&order=asc
Authorization: Bearer <token>

Query Parameters:
- userId: User ID (required if filtering)
- status: todo | in-progress | done
- goalId: Filter by goal ID
- limit: 1-100 (default 50)
- offset: Pagination offset (default 0)
- sort: createdAt | updatedAt | dueDate | priority | title
- order: asc | desc

Response (200):
{
  "tasks": [
    { task object },
    { task object }
  ]
}

Error (403): Forbidden (userId doesn't match auth user)
```

### 3. Get Task by ID
```
GET /api/tasks/:taskId
Authorization: Bearer <token>

Response (200):
{
  "task": { task object }
}

Error (404): Task not found
Error (403): Forbidden
```

### 4. Update Task
```
PATCH /api/tasks/:taskId
Authorization: Bearer <token>
Content-Type: application/json

Request (all fields optional):
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in-progress",
  "priority": "medium",
  "dueDate": 1713920400000,
  "tags": ["updated"],
  "goalId": "goal-456",
  "isHabit": true,
  "habitDays": [1,3,5]
}

Response (200):
{
  "task": { updated task object }
}

Error (400): Invalid field values
Error (403): Forbidden
Error (404): Task not found
```

### 5. Delete Task (Soft Delete)
```
DELETE /api/tasks/:taskId
Authorization: Bearer <token>

Response (200):
{
  "message": "Task moved to trash"
}

Error (403): Forbidden
Error (404): Task not found
```

### 6. Restore Task from Trash
```
POST /api/tasks/:taskId/restore
Authorization: Bearer <token>

Response (200):
{
  "task": { restored task object }
}

Error (403): Forbidden
Error (404): Task not found
```

### 7. Permanently Delete Task
```
DELETE /api/tasks/:taskId/permanent
Authorization: Bearer <token>

Response (204): No Content

Error (403): Forbidden
Error (404): Task not found
```

### 8. Get Deleted Tasks
```
GET /api/tasks/deleted/:userId
Authorization: Bearer <token>

Response (200):
{
  "tasks": [ { deleted tasks } ]
}

Error (403): Forbidden
```

### 9. Get Due Today Tasks
```
GET /api/tasks/due-today/:userId
Authorization: Bearer <token>

Response (200):
{
  "tasks": [ { tasks due today } ]
}

Error (403): Forbidden
```

### 10. Get Overdue Tasks
```
GET /api/tasks/overdue/:userId
Authorization: Bearer <token>

Response (200):
{
  "tasks": [ { overdue tasks with status != 'done' } ]
}

Error (403): Forbidden
```

### 11. Toggle Habit Completion
```
POST /api/tasks/:taskId/habits/toggle
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "date": "2026-04-24"
}

Response (200):
{
  "task": { updated task with habitCompletions }
}

Error (400): Date is required / Task is not a habit
Error (403): Forbidden
Error (404): Task not found
```

### 12. Search Tasks
```
GET /api/tasks/search/:userId?q=typescript
Authorization: Bearer <token>

Query Parameters:
- q: Search query (required, searches title, description, tags)

Response (200):
{
  "tasks": [ { matching tasks } ]
}

Error (400): Search query is required
Error (403): Forbidden
```

---

## Goal Endpoints (13)

### 1. Create Goal
```
POST /api/goals
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "title": "Learn TypeScript",
  "description": "Master TypeScript for better development",
  "category": "learning",
  "parentGoalId": "goal-parent" (optional),
  "targetDate": 1713920400000 (optional)
}

Response (201):
{
  "goal": {
    "id": "goal-123",
    "userId": "1234-5678",
    "title": "Learn TypeScript",
    "description": "Master TypeScript for better development",
    "category": "learning",
    "status": "active",
    "createdAt": "2026-04-24T...",
    "updatedAt": "2026-04-24T..."
  }
}

Error (400): Title/description/category is required
```

### 2. Get All Goals (with Filters)
```
GET /api/goals/:userId?status=active&category=learning&limit=50&offset=0
Authorization: Bearer <token>

Query Parameters:
- status: active | completed | archived
- category: work | personal | health | finance | learning | relationships | other
- limit: Pagination limit (default 50)
- offset: Pagination offset (default 0)

Response (200):
{
  "goals": [ { goal objects } ]
}

Error (403): Forbidden
```

### 3. Get Goal by ID
```
GET /api/goals/:goalId
Authorization: Bearer <token>

Response (200):
{
  "goal": { goal object }
}

Error (404): Goal not found
Error (403): Forbidden
```

### 4. Update Goal
```
PATCH /api/goals/:goalId
Authorization: Bearer <token>
Content-Type: application/json

Request (all optional):
{
  "title": "Updated title",
  "description": "Updated description",
  "category": "work",
  "targetDate": 1713920400000,
  "status": "completed"
}

Response (200):
{
  "goal": { updated goal object }
}

Error (400): Invalid field values
Error (403): Forbidden
Error (404): Goal not found
```

### 5. Complete Goal
```
POST /api/goals/:goalId/complete
Authorization: Bearer <token>

Response (200):
{
  "goal": { goal with status='completed', completedAt set }
}

Error (403): Forbidden
Error (404): Goal not found
```

### 6. Archive Goal
```
POST /api/goals/:goalId/archive
Authorization: Bearer <token>

Response (200):
{
  "goal": { goal with status='archived' }
}

Error (403): Forbidden
Error (404): Goal not found
```

### 7. Delete Goal (Soft Delete)
```
DELETE /api/goals/:goalId
Authorization: Bearer <token>

Response (200):
{
  "message": "Goal moved to trash"
}

Error (403): Forbidden
Error (404): Goal not found
```

### 8. Restore Goal from Trash
```
POST /api/goals/:goalId/restore
Authorization: Bearer <token>

Response (200):
{
  "goal": { restored goal object }
}

Error (403): Forbidden
Error (404): Goal not found
```

### 9. Permanently Delete Goal
```
DELETE /api/goals/:goalId/permanent
Authorization: Bearer <token>

Response (204): No Content

Error (403): Forbidden
Error (404): Goal not found
```

### 10. Get Deleted Goals
```
GET /api/goals/deleted/:userId
Authorization: Bearer <token>

Response (200):
{
  "goals": [ { deleted goals } ]
}

Error (403): Forbidden
```

### 11. Get Goals Nearing Deadline
```
GET /api/goals/nearing-deadline/:userId
Authorization: Bearer <token>

Returns: Active goals with targetDate within next 7 days

Response (200):
{
  "goals": [ { goals due within 7 days } ]
}

Error (403): Forbidden
```

### 12. Search Goals
```
GET /api/goals/search/:userId?q=typescript
Authorization: Bearer <token>

Query Parameters:
- q: Search query (searches title and description)

Response (200):
{
  "goals": [ { matching goals } ]
}

Error (400): Search query is required
Error (403): Forbidden
```

---

## User Endpoints (1)

### 1. Update Profile
```
PATCH /api/users/:userId/profile
Authorization: Bearer <token>
Content-Type: application/json

Request (all optional):
{
  "fullName": "John Smith",
  "profilePhoto": "data:image/...",
  "avatarColor": "#FF5733"
}

Response (200):
{
  "user": { updated user object }
}

Error (403): Forbidden (userId doesn't match auth user)
Error (404): User not found
```

---

## Status Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success, process response |
| 201 | Created | Resource created, process response |
| 204 | No Content | Success, no data returned |
| 400 | Bad Request | Validation error, fix request |
| 401 | Unauthorized | Token missing/invalid, login |
| 403 | Forbidden | Permission denied, check ownership |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource exists (e.g., email duplicate) |
| 500 | Server Error | Backend error, retry or contact support |

---

## Error Response Format

All errors follow this format:
```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE"  // Machine-readable code
  }
}
```

**Common error codes**:
- `MISSING_FIELDS` - Required field not provided
- `INVALID_PRIORITY` - Priority not in enum
- `INVALID_STATUS` - Status not in enum
- `INVALID_CATEGORY` - Category not in enum
- `NOT_FOUND` - Resource doesn't exist
- `FORBIDDEN` - Permission denied
- `EMAIL_EXISTS` - Email already registered
- `INVALID_CREDENTIALS` - Wrong password
- `INVALID_TOKEN` - JWT token invalid/expired
- `MISSING_AUTH` - No auth header provided
- `SERVER_ERROR` - Internal server error

---

## Authentication Pattern

**All protected endpoints require**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Get token from**:
- `POST /api/auth/signup` - Returns token on account creation
- `POST /api/auth/login` - Returns token on successful login

**Token example**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJ1c2VySWQiOiIxMjM0LTU2NzgiLCJpYXQiOjE2NDAzNzg0ODAsImV4cCI6MTY0MDM4MjA4MH0.
abcdefg...
```

**Token lifetime**: 15 minutes (will expire after this time)

---

## Query Parameter Patterns

### Pagination
```
GET /api/tasks?userId=123&limit=50&offset=0
GET /api/goals/:userId?limit=25&offset=50
```

### Filtering
```
GET /api/tasks?userId=123&status=todo&goalId=goal-456&priority=high
GET /api/goals/:userId?status=active&category=learning
```

### Sorting
```
GET /api/tasks?userId=123&sort=dueDate&order=asc
GET /api/tasks?userId=123&sort=priority&order=desc
```

### Search
```
GET /api/tasks/search/:userId?q=typescript
GET /api/goals/search/:userId?q=fitness
```

---

## Testing with PowerShell

### Setup
```powershell
$baseUrl = "http://localhost:3000"
$headers = @{ "Content-Type" = "application/json" }
```

### Login and Get Token
```powershell
$loginResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
  -Method POST `
  -Headers $headers `
  -Body '{"email":"user@example.com","password":"Pass123"}'

$token = ($loginResp.Content | ConvertFrom-Json).token
$authHeaders = @{
  "Content-Type" = "application/json"
  "Authorization" = "Bearer $token"
}
```

### Test Create Task
```powershell
$taskBody = @{
  userId = "user-id"
  title = "Test task"
  priority = "high"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$baseUrl/api/tasks" `
  -Method POST `
  -Headers $authHeaders `
  -Body $taskBody
```

### Test Get Tasks
```powershell
Invoke-WebRequest -Uri "$baseUrl/api/tasks?userId=user-id&limit=10" `
  -Method GET `
  -Headers $authHeaders
```
