import { getDB } from '../lib/db'
import type { Task, TaskStatus, TaskPriority } from '../types'

// Utility function to generate a unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export interface CreateTaskData {
  userId: string
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: number
  reminder?: number
  tags?: string[]
  goalId?: string
  isHabit?: boolean
  habitDays?: number[]
}

export interface UpdateTaskData {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: number
  reminder?: number
  tags?: string[]
  goalId?: string
  isHabit?: boolean
  habitDays?: number[]
}

/**
 * Task Service
 * This service abstracts task management logic.
 * When backend is ready, replace IndexedDB calls with API calls.
 */
export const taskService = {
  /**
   * Create a new task
   */
  create: async (data: CreateTaskData): Promise<Task> => {
    const db = await getDB()

    const task: Task = {
      id: generateId(),
      userId: data.userId,
      title: data.title,
      description: data.description,
      status: 'todo',
      priority: data.priority || 'medium',
      dueDate: data.dueDate,
      reminder: data.reminder,
      tags: data.tags || [],
      goalId: data.goalId,
      isHabit: data.isHabit || false,
      habitDays: data.habitDays,
      habitCompletions: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    await db.add('tasks', task)
    return task
  },

  /**
   * Get all tasks for a user (excludes soft-deleted)
   */
  getAllByUser: async (userId: string): Promise<Task[]> => {
    const db = await getDB()
    const tasks = await db.getAllFromIndex('tasks', 'by-user', userId)
    return tasks.filter(t => !t.deletedAt)
  },

  /**
   * Get a single task by ID
   */
  getById: async (taskId: string): Promise<Task | undefined> => {
    const db = await getDB()
    return await db.get('tasks', taskId)
  },

  /**
   * Get tasks by status
   */
  getByStatus: async (userId: string, status: TaskStatus): Promise<Task[]> => {
    const db = await getDB()
    const allTasks = await db.getAllFromIndex('tasks', 'by-user', userId)
    return allTasks.filter(task => task.status === status)
  },

  /**
   * Get tasks by goal
   */
  getByGoal: async (goalId: string): Promise<Task[]> => {
    const db = await getDB()
    return await db.getAllFromIndex('tasks', 'by-goal', goalId)
  },

  /**
   * Get tasks due today
   */
  getDueToday: async (userId: string): Promise<Task[]> => {
    const db = await getDB()
    const allTasks = await db.getAllFromIndex('tasks', 'by-user', userId)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowTimestamp = tomorrow.getTime()

    return allTasks.filter(task => {
      if (!task.dueDate) return false
      return task.dueDate >= todayTimestamp && task.dueDate < tomorrowTimestamp
    })
  },

  /**
   * Get overdue tasks
   */
  getOverdue: async (userId: string): Promise<Task[]> => {
    const db = await getDB()
    const allTasks = await db.getAllFromIndex('tasks', 'by-user', userId)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    return allTasks.filter(task => {
      if (!task.dueDate) return false
      return task.dueDate < todayTimestamp && task.status !== 'done'
    })
  },

  /**
   * Update a task
   */
  update: async (taskId: string, updates: UpdateTaskData): Promise<Task> => {
    const db = await getDB()

    const task = await db.get('tasks', taskId)
    if (!task) {
      throw new Error('Task not found')
    }

    const updatedTask: Task = {
      ...task,
      ...updates,
      updatedAt: Date.now(),
      // Set completedAt if status changed to done
      completedAt: updates.status === 'done' && task.status !== 'done'
        ? Date.now()
        : updates.status !== 'done'
        ? undefined
        : task.completedAt,
    }

    await db.put('tasks', updatedTask)
    return updatedTask
  },

  /**
   * Soft-delete a task (moves to trash)
   */
  delete: async (taskId: string): Promise<void> => {
    const db = await getDB()
    const task = await db.get('tasks', taskId)
    if (!task) throw new Error('Task not found')
    await db.put('tasks', { ...task, deletedAt: Date.now(), updatedAt: Date.now() })
  },

  /**
   * Restore a soft-deleted task from trash
   */
  restore: async (taskId: string): Promise<Task> => {
    const db = await getDB()
    const task = await db.get('tasks', taskId)
    if (!task) throw new Error('Task not found')
    const restored = { ...task, deletedAt: undefined, updatedAt: Date.now() }
    await db.put('tasks', restored)
    return restored
  },

  /**
   * Permanently delete a task
   */
  permanentDelete: async (taskId: string): Promise<void> => {
    const db = await getDB()
    await db.delete('tasks', taskId)
  },

  /**
   * Get all soft-deleted tasks for a user
   */
  getDeleted: async (userId: string): Promise<Task[]> => {
    const db = await getDB()
    const tasks = await db.getAllFromIndex('tasks', 'by-user', userId)
    return tasks.filter(t => !!t.deletedAt)
  },

  /**
   * Mark task as complete
   */
  complete: async (taskId: string): Promise<Task> => {
    return await taskService.update(taskId, { status: 'done' })
  },

  /**
   * Mark task as incomplete
   */
  incomplete: async (taskId: string): Promise<Task> => {
    return await taskService.update(taskId, { status: 'todo' })
  },

  /**
   * Search tasks by title
   */
  search: async (userId: string, query: string): Promise<Task[]> => {
    const db = await getDB()
    const allTasks = await db.getAllFromIndex('tasks', 'by-user', userId)

    const lowerQuery = query.toLowerCase()
    return allTasks.filter(task =>
      task.title.toLowerCase().includes(lowerQuery) ||
      task.description?.toLowerCase().includes(lowerQuery)
    )
  },

  /**
   * Get tasks by tag
   */
  getByTag: async (userId: string, tag: string): Promise<Task[]> => {
    const db = await getDB()
    const allTasks = await db.getAllFromIndex('tasks', 'by-user', userId)
    return allTasks.filter(task => task.tags.includes(tag))
  },

  /**
   * Get all unique tags for a user
   */
  getAllTags: async (userId: string): Promise<string[]> => {
    const db = await getDB()
    const allTasks = await db.getAllFromIndex('tasks', 'by-user', userId)

    const tagsSet = new Set<string>()
    allTasks.forEach(task => {
      task.tags.forEach((tag: string) => tagsSet.add(tag))
    })

    return Array.from(tagsSet).sort()
  },

  /**
   * Toggle habit completion for a specific date
   */
  toggleHabitCompletion: async (taskId: string, date: string): Promise<Task> => {
    const db = await getDB()
    const task = await db.get('tasks', taskId)

    if (!task) {
      throw new Error('Task not found')
    }

    if (!task.isHabit) {
      throw new Error('Task is not a habit')
    }

    const habitCompletions = task.habitCompletions || {}
    const isCompleted = habitCompletions[date] || false

    const updatedTask: Task = {
      ...task,
      habitCompletions: {
        ...habitCompletions,
        [date]: !isCompleted
      },
      updatedAt: Date.now()
    }

    await db.put('tasks', updatedTask)
    return updatedTask
  },

  /**
   * Get habits for a user
   */
  getHabits: async (userId: string): Promise<Task[]> => {
    const db = await getDB()
    const allTasks = await db.getAllFromIndex('tasks', 'by-user', userId)
    return allTasks.filter(task => task.isHabit)
  },

  /**
   * Get regular tasks (non-habits) for a user
   */
  getTasks: async (userId: string): Promise<Task[]> => {
    const db = await getDB()
    const allTasks = await db.getAllFromIndex('tasks', 'by-user', userId)
    return allTasks.filter(task => !task.isHabit)
  },
}

/**
 * BACKEND MIGRATION GUIDE:
 *
 * When ready to add backend, replace the implementations with API calls:
 *
 * Example:
 *
 * getAllByUser: async (userId: string): Promise<Task[]> => {
 *   const response = await fetch(`/api/tasks?userId=${userId}`, {
 *     headers: { 'Authorization': `Bearer ${getToken()}` },
 *   })
 *
 *   if (!response.ok) {
 *     throw new Error('Failed to fetch tasks')
 *   }
 *
 *   return response.json()
 * }
 */
