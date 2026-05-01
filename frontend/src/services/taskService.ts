import { apiPost, apiGet, apiPatch, apiDelete } from '../utils/apiClient'
import type { Task, TaskStatus, TaskPriority } from '../types'

export interface CreateTaskData {
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: number
  reminder?: number
  tags?: string[]
  goalId?: string
  isHabit?: boolean
  habitDays?: number[]
  userId?: string // Optional - handled by API via JWT
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
 * Now uses backend API for all operations
 * Service interface remains the same for zero-impact integration
 */
export const taskService = {
  /**
   * Create a new task via API
   */
  create: async (data: CreateTaskData): Promise<Task> => {
    const response = await apiPost<{ task: Task }>('/api/tasks', {
      title: data.title,
      description: data.description,
      priority: data.priority || 'medium',
      dueDate: data.dueDate,
      reminder: data.reminder,
      tags: data.tags || [],
      goalId: data.goalId,
      isHabit: data.isHabit || false,
      habitDays: data.habitDays,
    })
    return response.task
  },

  /**
   * Get all tasks for a user (excludes soft-deleted)
   */
  getAllByUser: async (userId: string): Promise<Task[]> => {
    const response = await apiGet<{ tasks: Task[] }>(`/api/tasks/${userId}`)
    return response.tasks
  },

  /**
   * Get a single task by ID
   */
  getById: async (taskId: string): Promise<Task | undefined> => {
    try {
      const response = await apiGet<{ task: Task }>(`/api/tasks/${taskId}`)
      return response.task
    } catch (error) {
      return undefined
    }
  },

  /**
   * Get tasks by status
   */
  getByStatus: async (_userId: string, status: TaskStatus): Promise<Task[]> => {
    const response = await apiGet<{ tasks: Task[] }>(`/api/tasks?status=${status}`)
    return response.tasks
  },

  /**
   * Get tasks by goal
   */
  getByGoal: async (goalId: string): Promise<Task[]> => {
    const response = await apiGet<{ tasks: Task[] }>(`/api/tasks?goalId=${goalId}`)
    return response.tasks
  },

  /**
   * Get tasks due today
   */
  getDueToday: async (userId: string): Promise<Task[]> => {
    const response = await apiGet<{ tasks: Task[] }>(`/api/tasks/due-today/${userId}`)
    return response.tasks
  },

  /**
   * Get overdue tasks
   */
  getOverdue: async (userId: string): Promise<Task[]> => {
    const response = await apiGet<{ tasks: Task[] }>(`/api/tasks/overdue/${userId}`)
    return response.tasks
  },

  /**
   * Update a task
   */
  update: async (taskId: string, updates: UpdateTaskData): Promise<Task> => {
    const response = await apiPatch<{ task: Task }>(`/api/tasks/${taskId}`, updates)
    return response.task
  },

  /**
   * Soft-delete a task (moves to trash)
   */
  delete: async (taskId: string): Promise<void> => {
    await apiDelete(`/api/tasks/${taskId}`)
  },

  /**
   * Restore a soft-deleted task from trash
   */
  restore: async (taskId: string): Promise<Task> => {
    const response = await apiPost<{ task: Task }>(`/api/tasks/${taskId}/restore`, {})
    return response.task
  },

  /**
   * Permanently delete a task
   */
  permanentDelete: async (taskId: string): Promise<void> => {
    await apiDelete(`/api/tasks/${taskId}/permanent`)
  },

  /**
   * Get all soft-deleted tasks for a user
   */
  getDeleted: async (userId: string): Promise<Task[]> => {
    const response = await apiGet<{ tasks: Task[] }>(`/api/tasks/deleted/${userId}`)
    return response.tasks
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
    const response = await apiGet<{ tasks: Task[] }>(`/api/tasks/search/${userId}?q=${encodeURIComponent(query)}`)
    return response.tasks
  },

  /**
   * Get tasks by tag
   */
  getByTag: async (_userId: string, tag: string): Promise<Task[]> => {
    const response = await apiGet<{ tasks: Task[] }>(`/api/tasks?tags=${encodeURIComponent(tag)}`)
    return response.tasks
  },

  /**
   * Get all unique tags for a user
   */
  getAllTags: async (userId: string): Promise<string[]> => {
    const response = await apiGet<{ tags: string[] }>(`/api/tasks?userId=${userId}&getTags=true`)
    return response.tags || []
  },

  /**
   * Toggle habit completion for a specific date
   */
  toggleHabitCompletion: async (taskId: string, date: string): Promise<Task> => {
    const response = await apiPost<{ task: Task }>(`/api/tasks/${taskId}/habits/toggle`, {
      date,
    })
    return response.task
  },

  /**
   * Get habits for a user
   */
  getHabits: async (_userId: string): Promise<Task[]> => {
    const response = await apiGet<{ tasks: Task[] }>(`/api/tasks?isHabit=true`)
    return response.tasks
  },

  /**
   * Get regular tasks (non-habits) for a user
   */
  getTasks: async (_userId: string): Promise<Task[]> => {
    const response = await apiGet<{ tasks: Task[] }>(`/api/tasks?isHabit=false`)
    return response.tasks
  },
}
/**
 * NOTE: taskService has been migrated to use the backend API
 * All IndexedDB calls have been replaced with API calls
 * The service interface remains the same for zero-impact integration
 */
