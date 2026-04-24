import { Goal } from '../models/Goal.js'
import { generateId } from '../utils/idGenerator.js'

// Helper to convert goal to response format
const goalToResponse = (goal) => {
  return {
    id: goal.id,
    userId: goal.userId,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    parentGoalId: goal.parentGoalId,
    targetDate: goal.targetDate,
    status: goal.status,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
    completedAt: goal.completedAt,
    deletedAt: goal.deletedAt
  }
}

// Helps to get date 7 days from now
const getDateSevenDaysFromNow = () => {
  const now = Date.now()
  return now + (7 * 24 * 60 * 60 * 1000) //(7 * 24 * 60 * 60 * 1000) is the numeric value of 7 days in milliseconds
}


// Create new goal
export const createGoal = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      parentGoalId,
      targetDate
    } = req.body

    // Validate required fields

    // checks if title exists
    if (!title || !title.trim()) {
      return res.status(400).json({
        error: {
          message: 'Title is required',
          code: 'MISSING_TITLE'
        }
      })
    }

    // checks if description exists
    if (!description || !description.trim()) {
      return res.status(400).json({
        error: {
          message: 'Description is required',
          code: 'MISSING_DESCRIPTION'
        }
      })
    }

    // Validate category
    const validCategories = ['work', 'personal', 'health', 'finance', 'learning', 'relationships', 'other']
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({
        error: {
          message: 'Category is required and must be valid',
          code: 'INVALID_CATEGORY'
        }
      })
    }


    // Create goal
    const goal = new Goal({
      id: generateId(),
      userId: req.userId,
      title: title.trim(),
      description: description.trim(),
      category,
      parentGoalId,
      targetDate,
      status: 'active'
    })

    await goal.save()

    res.status(201).json({
      goal: goalToResponse(goal)
    })
  } catch (error) {
    console.error('Create goal error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


// gets all the goals created by the user
export const getGoals = async (req, res) => {
  try {
    const { userId } = req.params
    const { status, category, limit = 50, offset = 0 } = req.query

    // Verify user can only access their own goals
    if (userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    // Build query
    const query = { userId, deletedAt: { $exists: false } }

    if (status) {
        // checks for valid status
      if (!['active', 'completed', 'archived'].includes(status)) {
        return res.status(400).json({
          error: {
            message: 'Invalid status',
            code: 'INVALID_STATUS'
          }
        })
      }
      query.status = status
    }

    if (category) {
      const validCategories = ['work', 'personal', 'health', 'finance', 'learning', 'relationships', 'other']
      if (!validCategories.includes(category)) {
        // checks if user provide a valid category
        return res.status(400).json({
          error: {
            message: 'Invalid category',
            code: 'INVALID_CATEGORY'
          }
        })
      }
      query.category = category
    }

    const goals = await Goal.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))

    res.status(200).json({
      goals: goals.map(goalToResponse)
    })
  } catch (error) {
    console.error('Get goals error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


// gets goal by id
export const getGoalById = async (req, res) => {
  try {
    const { goalId } = req.params

    const goal = await Goal.findOne({ id: goalId })

    if (!goal) {
      return res.status(404).json({
        error: {
          message: 'Goal not found',
          code: 'NOT_FOUND'
        }
      })
    }

    // Verify user owns the goal
    if (goal.userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    res.status(200).json({
      goal: goalToResponse(goal)
    })
  } catch (error) {
    console.error('Get goal by ID error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


// updates goal
export const updateGoal = async (req, res) => {
  try {
    const { goalId } = req.params
    const updates = req.body

    const goal = await Goal.findOne({ id: goalId })

    if (!goal) {
      return res.status(404).json({
        error: {
          message: 'Goal not found',
          code: 'NOT_FOUND'
        }
      })
    }

    // Verify user owns the goal
    if (goal.userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    // Validate updates:

    // checks if title is valid
    if (updates.title && !updates.title.trim()) {
      return res.status(400).json({
        error: {
          message: 'Title cannot be empty',
          code: 'INVALID_TITLE'
        }
      })
    }


    // checks if description is valid
    if (updates.description && !updates.description.trim()) {
      return res.status(400).json({
        error: {
          message: 'Description cannot be empty',
          code: 'INVALID_DESCRIPTION'
        }
      })
    }


    // validates category
    if (updates.category) {
      const validCategories = ['work', 'personal', 'health', 'finance', 'learning', 'relationships', 'other']
      if (!validCategories.includes(updates.category)) {
        return res.status(400).json({
          error: {
            message: 'Invalid category',
            code: 'INVALID_CATEGORY'
          }
        })
      }
    }


    // validate category
    if (updates.status) {
      if (!['active', 'completed', 'archived'].includes(updates.status)) {
        return res.status(400).json({
          error: {
            message: 'Invalid status',
            code: 'INVALID_STATUS'
          }
        })
      }
    }

    // Update goal
    Object.assign(goal, updates)
    await goal.save()

    res.status(200).json({
      goal: goalToResponse(goal)
    })
  } catch (error) {
    console.error('Update goal error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


// sets a goal status as complete in the database
export const completeGoal = async (req, res) => {
  try {
    const { goalId } = req.params

    const goal = await Goal.findOne({ id: goalId })

    if (!goal) {
      return res.status(404).json({
        error: {
          message: 'Goal not found',
          code: 'NOT_FOUND'
        }
      })
    }

    // Verify user owns the goal
    if (goal.userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    goal.status = 'completed'
    goal.completedAt = Date.now()
    await goal.save()

    res.status(200).json({
      goal: goalToResponse(goal)
    })
  } catch (error) {
    console.error('Complete goal error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


// archive goal
export const archiveGoal = async (req, res) => {
  try {
    const { goalId } = req.params

    const goal = await Goal.findOne({ id: goalId })

    if (!goal) {
      return res.status(404).json({
        error: {
          message: 'Goal not found',
          code: 'NOT_FOUND'
        }
      })
    }

    // Verify user owns the goal
    if (goal.userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    goal.status = 'archived'
    await goal.save()

    res.status(200).json({
      goal: goalToResponse(goal)
    })
  } catch (error) {
    console.error('Archive goal error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


// soft delete goal
export const deleteGoal = async (req, res) => {
  try {
    const { goalId } = req.params

    const goal = await Goal.findOne({ id: goalId })

    if (!goal) {
      return res.status(404).json({
        error: {
          message: 'Goal not found',
          code: 'NOT_FOUND'
        }
      })
    }

    // Verify user owns the goal
    if (goal.userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    // Soft delete
    goal.deletedAt = Date.now()
    await goal.save()

    res.status(200).json({
      message: 'Goal moved to trash'
    })
  } catch (error) {
    console.error('Delete goal error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


//restore soft deleted goals
export const restoreGoal = async (req, res) => {
  try {
    const { goalId } = req.params

    const goal = await Goal.findOne({ id: goalId })

    if (!goal) {
      return res.status(404).json({
        error: {
          message: 'Goal not found',
          code: 'NOT_FOUND'
        }
      })
    }

    // Verify user owns the goal
    if (goal.userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    // Restore from trash
    goal.deletedAt = undefined
    await goal.save()

    res.status(200).json({
      goal: goalToResponse(goal)
    })
  } catch (error) {
    console.error('Restore goal error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


//remove goal from database
export const permanentDeleteGoal = async (req, res) => {
  try {
    const { goalId } = req.params

    const goal = await Goal.findOne({ id: goalId })

    if (!goal) {
      return res.status(404).json({
        error: {
          message: 'Goal not found',
          code: 'NOT_FOUND'
        }
      })
    }

    // Verify user owns the goal
    if (goal.userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    await Goal.deleteOne({ id: goalId })

    res.status(204).send()
  } catch (error) {
    console.error('Permanent delete goal error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


// get all soft deleted goals from the trash
export const getDeletedGoals = async (req, res) => {
  try {
    const { userId } = req.params

    // Verify user can only access their own goals
    if (userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    const goals = await Goal.find({
      userId,
      deletedAt: { $exists: true }
    }).sort({ deletedAt: -1 })

    res.status(200).json({
      goals: goals.map(goalToResponse)
    })
  } catch (error) {
    console.error('Get deleted goals error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


// get all the goal that are near the expiration date
export const getNearingDeadline = async (req, res) => {
  try {
    const { userId } = req.params

    // Verify user can only access their own goals
    if (userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    const now = Date.now()
    const sevenDaysFromNow = getDateSevenDaysFromNow()

    const goals = await Goal.find({
      userId,
      targetDate: { $gte: now, $lte: sevenDaysFromNow },
      status: 'active',
      deletedAt: { $exists: false }
    }).sort({ targetDate: 1 })

    res.status(200).json({
      goals: goals.map(goalToResponse)
    })
  } catch (error) {
    console.error('Get nearing deadline goals error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


// search for goals using key words
export const searchGoals = async (req, res) => {
  try {
    const { userId } = req.params
    const { q } = req.query

    // Verify user can only access their own goals
    if (userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    if (!q || !q.trim()) {
      return res.status(400).json({
        error: {
          message: 'Search query is required',
          code: 'MISSING_QUERY'
        }
      })
    }

    const searchRegex = new RegExp(q.trim(), 'i')

    const goals = await Goal.find({
      userId,
      deletedAt: { $exists: false },
      $or: [
        { title: searchRegex },
        { description: searchRegex }
      ]
    }).sort({ updatedAt: -1 }).limit(50)

    res.status(200).json({
      goals: goals.map(goalToResponse)
    })
  } catch (error) {
    console.error('Search goals error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}