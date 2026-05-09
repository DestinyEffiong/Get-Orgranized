import { Task } from '../models/Task.js'
import { generateId } from '../utils/idGenerator.js'

// Helper to convert task to response format (exclude sensitive data)
const taskToResponse = (task) => {
  return {
    id: task.id,
    userId: task.userId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    reminder: task.reminder,
    tags: task.tags,
    goalId: task.goalId,
    isHabit: task.isHabit,
    habitDays: task.habitDays,
    habitCompletions: task.habitCompletions,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt,
    deletedAt: task.deletedAt
  }
}

// Helper to get current date range for "today"
const getTodayRange = () => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return {
    start: startOfDay.getTime(),
    end: endOfDay.getTime()
  }
}


// creates task
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'medium',
      dueDate,
      reminder,
      tags = [],
      goalId,
      isHabit = false,
      habitDays = []
    } = req.body

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        error: {
          message: 'Title is required',
          code: 'MISSING_TITLE'
        }
      })
    }

    // Validate priority
    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        error: {
          message: 'Priority must be low, medium, or high',
          code: 'INVALID_PRIORITY'
        }
      })
    }

    // Validate habit days
    if (isHabit && (!Array.isArray(habitDays) || habitDays.some(d => d < 0 || d > 6))) {
      return res.status(400).json({
        error: {
          message: 'Habit days must be an array of numbers 0-6',
          code: 'INVALID_HABIT_DAYS'
        }
      })
    }

    const task = new Task({
      id: generateId(),
      userId: req.userId,
      title: title.trim(),
      description: description?.trim(),
      priority,
      dueDate,
      reminder,
      tags,
      goalId,
      isHabit,
      habitDays,
      habitCompletions: {}
    })

    await task.save()

    res.status(201).json({
      task: taskToResponse(task)
    })
  } catch (error) {
    console.error('Create task error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}

// get all user's task
export const getTasks = async (req, res) => {
  try {
    const { userId } = req.params
    const { status, goalId, limit = 50, offset = 0, sort = 'createdAt', order = 'desc' } = req.query

    // Verify user can only access their own tasks
    if (userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    // Build query... think of query as the conditions for the search
    // this "deletedAt: { $exists: false }" takes if the task haven't been soft deleted
    const query = { userId, deletedAt: { $exists: false } }

    if (status) {
      if (!['todo', 'in-progress', 'done'].includes(status)) {
        return res.status(400).json({
          error: {
            message: 'Invalid status',
            code: 'INVALID_STATUS'
          }
        })
      }
      query.status = status
    }

    if (goalId) {
      query.goalId = goalId
    }

    // Build sort options
    const sortOptions = {}
    const validSortFields = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title']
    if (validSortFields.includes(sort)) {
      sortOptions[sort] = order === 'asc' ? 1 : -1
    } else {
      sortOptions.createdAt = -1 // default which mean it keeps the current order
    }

    const tasks = await Task.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(parseInt(offset))

    res.status(200).json({
      tasks: tasks.map(taskToResponse)
    })
  } catch (error) {
    console.error('Get tasks error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


// get task by taskId
export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params

    const task = await Task.findOne({ id: taskId })

    if (!task) {
      return res.status(404).json({
        error: {
          message: 'Task not found',
          code: 'NOT_FOUND'
        }
      })
    }

    // Verify user owns the task
    if (task.userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    res.status(200).json({
      task: taskToResponse(task)
    })
  } catch (error) {
    console.error('Get task by ID error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


// update tasks
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const updates = req.body

    // Find task
    const task = await Task.findOne({ id: taskId })

    if (!task) {
      return res.status(404).json({
        error: {
          message: 'Task not found',
          code: 'NOT_FOUND'
        }
      })
    }

    // Verify user owns the task
    if (task.userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    // Validate title
    if (updates.title && !updates.title.trim()) {
      return res.status(400).json({
        error: {
          message: 'Title cannot be empty',
          code: 'INVALID_TITLE'
        }
      })
    }


    // checks if priority exists then checks if its equals to either "low", "medium" or "high"
    // if one of this condition isnt it would return an error message
    if (updates.priority && !['low', 'medium', 'high'].includes(updates.priority)) {
      return res.status(400).json({
        error: {
          message: 'Priority must be low, medium, or high',
          code: 'INVALID_PRIORITY'
        }
      })
    }


        // checks if status exists then checks if its equals to either "todo", "in-progress" or "done"
        // if one of this condition isnt it would return an error message
    if (updates.status && !['todo', 'in-progress', 'done'].includes(updates.status)) {
      return res.status(400).json({
        error: {
          message: 'Status must be todo, in-progress, or done',
          code: 'INVALID_STATUS'
        }
      })
    }

    // Update task
    Object.assign(task, updates)
    await task.save()

    res.status(200).json({
      task: taskToResponse(task)
    })
  } catch (error) {
    console.error('Update task error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


// performs soft delete
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params

        // finds task using taskId
    const task = await Task.findOne({ id: taskId })

    if (!task) {
      return res.status(404).json({
        error: {
          message: 'Task not found',
          code: 'NOT_FOUND'
        }
      })
    }

    // Verify user owns the task
    if (task.userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    // Soft delete: meaning tasks is not deleted from the database but it just moved somewhere else
    task.deletedAt = Date.now()
    await task.save()

    res.status(200).json({
      message: 'Task moved to trash'
    })
  } catch (error) {
    console.error('Delete task error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


// add soft deleted tasks back to the main tasks collection by changing deletedAt to undefined
export const restoreTask = async (req, res) => {
  try {
    const { taskId } = req.params

    const task = await Task.findOne({ id: taskId })

    if (!task) {
      return res.status(404).json({
        error: {
          message: 'Task not found',
          code: 'NOT_FOUND'
        }
      })
    }

    // Verify user owns the task
    if (task.userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    // Restore from trash
    task.deletedAt = undefined
    await task.save()

    res.status(200).json({
      task: taskToResponse(task)
    })
  } catch (error) {
    console.error('Restore task error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


//permanently delete tasks from database
export const permanentDeleteTask = async (req, res) => {
  try {
    const { taskId } = req.params

    const task = await Task.findOne({ id: taskId })

    if (!task) {
      return res.status(404).json({
        error: {
          message: 'Task not found',
          code: 'NOT_FOUND'
        }
      })
    }

    // Verify user owns the task
    if (task.userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    // this permanently deletes the tasks from the database
    await Task.deleteOne({ id: taskId })

    res.status(204).send()
  } catch (error) {
    console.error('Permanent delete task error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}

// gets soft deleted tasks
export const getDeletedTasks = async (req, res) => {
  try {
    const { userId } = req.params

    // Verify user can only access their own tasks
    if (userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    const tasks = await Task.find({
      userId,
      deletedAt: { $exists: true }
    }).sort({ deletedAt: -1 }) //sort determines the positions 

    // Returning 1 (or any positive number) tells JavaScript to swap the items (sort b before a).
    // Returning -1 (or any negative number) tells JavaScript to keep the current order (sort a before b). 
    res.status(200).json({
      tasks: tasks.map(taskToResponse)
    })
  } catch (error) {
    console.error('Get deleted tasks error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}

// get tasks that are due on the present day
export const getDueTodayTasks = async (req, res) => {
  try {
    const { userId } = req.params

    // Verify user can only access their own tasks
    if (userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    const { start, end } = getTodayRange()

    const tasks = await Task.find({
      userId,
      dueDate: { $gte: start, $lt: end },
      deletedAt: { $exists: false }
    }).sort({ dueDate: 1 })

    /*$gte: start means it matches values that are greater 
    than or equal to the specified value or in this instants start.

    $lt: end means it matches values that are strictly less than the specified value 
    or in this case end

    $exists Checks if a specific field exists (or doesn't) in the document.
    */


    res.status(200).json({
      tasks: tasks.map(taskToResponse)
    })
  } catch (error) {
    console.error('Get due today tasks error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}

// get tasks whose due date is very close to present day
export const getOverdueTasks = async (req, res) => {
  try {
    const { userId } = req.params

    // Verify user can only access their own tasks
    if (userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    const now = Date.now()

    const tasks = await Task.find({
      userId,
      dueDate: { $lt: now },
      status: { $ne: 'done' },
      deletedAt: { $exists: false }
    }).sort({ dueDate: 1 })

    // $ne is not equals to
    res.status(200).json({
      tasks: tasks.map(taskToResponse)
    })
  } catch (error) {
    console.error('Get overdue tasks error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}

export const toggleHabitCompletion = async (req, res) => {
  try {
    const { taskId } = req.params
    const { date } = req.body

    if (!date) {
      return res.status(400).json({
        error: {
          message: 'Date is required',
          code: 'MISSING_DATE'
        }
      })
    }

    const task = await Task.findOne({ id: taskId })

    if (!task) {
      return res.status(404).json({
        error: {
          message: 'Task not found',
          code: 'NOT_FOUND'
        }
      })
    }

    // Verify user owns the task
    if (task.userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    // Verify it's a habit
    if (!task.isHabit) {
      return res.status(400).json({
        error: {
          message: 'Task is not a habit',
          code: 'NOT_A_HABIT'
        }
      })
    }

    // Toggle completion for the date
    const currentCompletion = task.habitCompletions.get(date) || false
    task.habitCompletions.set(date, !currentCompletion)
    task.updatedAt = new Date()

    await task.save()

    res.status(200).json({
      task: taskToResponse(task)
    })
  } catch (error) {
    console.error('Toggle habit completion error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}

//return tasks searched for
export const searchTasks = async (req, res) => {
  try {
    const { userId } = req.params
    const { q } = req.query

    // Verify user can only access their own tasks
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

    const tasks = await Task.find({
      userId,
      deletedAt: { $exists: false },
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ]
    }).sort({ updatedAt: -1 }).limit(50)
    // $or return a task is the title, description or tags matches the keyword which is searchRegex in this instant

    res.status(200).json({
      tasks: tasks.map(taskToResponse)
    })
  } catch (error) {
    console.error('Search tasks error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}