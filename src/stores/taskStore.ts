import { create } from 'zustand'
import type { Task, TaskStatus } from '../types'
import { taskService, type CreateTaskData, type UpdateTaskData } from '../services'

interface TaskState {
  tasks: Task[]
  deletedTasks: Task[]
  isLoading: boolean
  error: string | null

  // Actions
  loadTasks: (userId: string) => Promise<void>
  loadDeletedTasks: (userId: string) => Promise<void>
  createTask: (data: CreateTaskData) => Promise<Task>
  updateTask: (taskId: string, updates: UpdateTaskData) => Promise<Task>
  deleteTask: (taskId: string) => Promise<void>
  restoreTask: (taskId: string) => Promise<Task>
  permanentDeleteTask: (taskId: string) => Promise<void>
  completeTask: (taskId: string) => Promise<Task>
  incompleteTask: (taskId: string) => Promise<Task>
  searchTasks: (userId: string, query: string) => Promise<Task[]>
  toggleHabitCompletion: (taskId: string, date: string) => Promise<Task>
  clearError: () => void

  // Computed getters
  getTasksByStatus: (status: TaskStatus) => Task[]
  getTasksByGoal: (goalId: string) => Task[]
  getDueTodayTasks: () => Task[]
  getOverdueTasks: () => Task[]
  getHabits: () => Task[]
  getTasks: () => Task[]
  getTasksByTag: (tag: string) => Task[]
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  deletedTasks: [],
  isLoading: false,
  error: null,

  loadTasks: async (userId: string) => {
    try {
      set({ isLoading: true, error: null })

      const tasks = await taskService.getAllByUser(userId)

      set({
        tasks,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load tasks',
      })
      throw error
    }
  },

  createTask: async (data: CreateTaskData) => {
    try {
      set({ error: null })

      const task = await taskService.create(data)

      set(state => ({
        tasks: [...state.tasks, task],
      }))

      return task
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create task',
      })
      throw error
    }
  },

  updateTask: async (taskId: string, updates: UpdateTaskData) => {
    try {
      set({ error: null })

      const updatedTask = await taskService.update(taskId, updates)

      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId ? updatedTask : task
        ),
      }))

      return updatedTask
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update task',
      })
      throw error
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      set({ error: null })

      await taskService.delete(taskId)

      set(state => ({
        tasks: state.tasks.filter(task => task.id !== taskId),
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete task',
      })
      throw error
    }
  },

  loadDeletedTasks: async (userId: string) => {
    try {
      set({ error: null })
      const deleted = await taskService.getDeleted(userId)
      set({ deletedTasks: deleted })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load deleted tasks',
      })
      throw error
    }
  },

  restoreTask: async (taskId: string) => {
    try {
      set({ error: null })
      const restored = await taskService.restore(taskId)
      set(state => ({
        deletedTasks: state.deletedTasks.filter(t => t.id !== taskId),
        tasks: [...state.tasks, restored],
      }))
      return restored
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to restore task',
      })
      throw error
    }
  },

  permanentDeleteTask: async (taskId: string) => {
    try {
      set({ error: null })
      await taskService.permanentDelete(taskId)
      set(state => ({
        deletedTasks: state.deletedTasks.filter(t => t.id !== taskId),
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to permanently delete task',
      })
      throw error
    }
  },

  completeTask: async (taskId: string) => {
    return get().updateTask(taskId, { status: 'done' })
  },

  incompleteTask: async (taskId: string) => {
    return get().updateTask(taskId, { status: 'todo' })
  },

  searchTasks: async (userId: string, query: string) => {
    try {
      set({ error: null })

      const results = await taskService.search(userId, query)
      return results
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to search tasks',
      })
      throw error
    }
  },

  toggleHabitCompletion: async (taskId: string, date: string) => {
    try {
      set({ error: null })

      const updatedTask = await taskService.toggleHabitCompletion(taskId, date)

      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId ? updatedTask : task
        ),
      }))

      return updatedTask
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to toggle habit',
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),

  // Computed getters
  getTasksByStatus: (status: TaskStatus) => {
    return get().tasks.filter(task => task.status === status)
  },

  getTasksByGoal: (goalId: string) => {
    return get().tasks.filter(task => task.goalId === goalId)
  },

  getDueTodayTasks: () => {
    const now = Date.now()
    const tomorrow = new Date()
    tomorrow.setHours(23, 59, 59, 999)
    const endOfDay = tomorrow.getTime()

    return get().tasks.filter(task => {
      if (!task.dueDate) return false
      return task.dueDate >= now && task.dueDate <= endOfDay
    })
  },

  getOverdueTasks: () => {
    const now = Date.now()

    return get().tasks.filter(task => {
      if (!task.dueDate) return false
      return task.dueDate < now && task.status !== 'done'
    })
  },

  getHabits: () => {
    return get().tasks.filter(task => task.isHabit)
  },

  getTasks: () => {
    return get().tasks.filter(task => !task.isHabit)
  },

  getTasksByTag: (tag: string) => {
    return get().tasks.filter(task => task.tags.includes(tag))
  },
}))
