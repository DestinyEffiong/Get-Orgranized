import express from 'express'
const router = express.Router()
import { authMiddleware } from '../middleware/auth.js'
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  completeGoal,
  archiveGoal,
  deleteGoal,
  restoreGoal,
  permanentDeleteGoal,
  getDeletedGoals,
  getNearingDeadline,
  searchGoals
} from '../controllers/goalController.js'

// All goal routes require authentication
router.use(authMiddleware)

// *** IMPORTANT: More specific routes FIRST, generic routes LAST ***

// Specific routes
router.get('/deleted/:userId', getDeletedGoals)
router.get('/nearing-deadline/:userId', getNearingDeadline)
router.get('/search/:userId', searchGoals)

// Generic routes
router.post('/', createGoal)                              // POST /api/goals
router.get('/:userId', getGoals)                          // GET /api/goals?status=active&category=work
router.get('/:goalId', getGoalById)                       // GET /api/goals/123
router.patch('/:goalId', updateGoal)                      // PATCH /api/goals/123
router.post('/:goalId/complete', completeGoal)            // POST /api/goals/123/complete
router.post('/:goalId/archive', archiveGoal)              // POST /api/goals/123/archive
router.delete('/:goalId', deleteGoal)                     // DELETE /api/goals/123
router.post('/:goalId/restore', restoreGoal)              // POST /api/goals/123/restore
router.delete('/:goalId/permanent', permanentDeleteGoal)  // DELETE /api/goals/123/permanent

export default router