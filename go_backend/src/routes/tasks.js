import express from 'express'
const router = express.Router()
import { authMiddleware } from '../middleware/auth.js'
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  restoreTask,
  permanentDeleteTask,
  getDeletedTasks,
  getDueTodayTasks,
  getOverdueTasks,
  toggleHabitCompletion,
  searchTasks
} from '../controllers/taskController.js'

// All task routes require authentication
router.use(authMiddleware)

// *** IMPORTANT: More specific routes FIRST, generic routes LAST ***
// Otherwise /search/:userId will be matched by /:taskId catch-all

// Specific routes (more specific paths first)
router.get('/deleted/:userId', getDeletedTasks)
router.get('/due-today/:userId', getDueTodayTasks)
router.get('/overdue/:userId', getOverdueTasks)
router.get('/search/:userId', searchTasks)

// Generic routes (can be matched by parameter)
router.post('/', createTask)                              // POST /api/tasks
router.get('/:userId', getTasks)                          // GET /api/tasks/:userId
router.get('/:taskId', getTaskById)                       // GET /api/tasks/123
router.patch('/:taskId', updateTask)                      // PATCH /api/tasks/123
router.delete('/:taskId', deleteTask)                     // DELETE /api/tasks/123
router.post('/:taskId/restore', restoreTask)              // POST /api/tasks/123/restore
router.delete('/:taskId/permanent', permanentDeleteTask)  // DELETE /api/tasks/123/permanent
router.post('/:taskId/habits/toggle', toggleHabitCompletion) // POST /api/tasks/123/habits/toggle

export default router