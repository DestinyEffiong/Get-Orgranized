import { create } from 'zustand'
import type { Goal } from '../types'
import { goalService, type CreateGoalData, type UpdateGoalData } from '../services'

interface GoalState {
  goals: Goal[]
  deletedGoals: Goal[]
  isLoading: boolean
  error: string | null

  // Actions
  loadGoals: (userId: string) => Promise<void>
  loadDeletedGoals: (userId: string) => Promise<void>
  createGoal: (data: CreateGoalData) => Promise<Goal>
  updateGoal: (goalId: string, updates: UpdateGoalData) => Promise<Goal>
  deleteGoal: (goalId: string) => Promise<void>
  restoreGoal: (goalId: string) => Promise<Goal>
  permanentDeleteGoal: (goalId: string) => Promise<void>
  completeGoal: (goalId: string) => Promise<Goal>
  archiveGoal: (goalId: string) => Promise<Goal>
  searchGoals: (userId: string, query: string) => Promise<Goal[]>
  clearError: () => void

  // Computed getters
  getActiveGoals: () => Goal[]
  getCompletedGoals: () => Goal[]
  getTopLevelGoals: () => Goal[]
  getSubGoals: (parentGoalId: string) => Goal[]
  getNearingDeadline: () => Goal[]
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  deletedGoals: [],
  isLoading: false,
  error: null,

  loadGoals: async (userId: string) => {
    try {
      set({ isLoading: true, error: null })

      const goals = await goalService.getAllByUser(userId)

      set({
        goals,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load goals',
      })
      throw error
    }
  },

  createGoal: async (data: CreateGoalData) => {
    try {
      set({ error: null })

      const goal = await goalService.create(data)

      set(state => ({
        goals: [...state.goals, goal],
      }))

      return goal
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create goal',
      })
      throw error
    }
  },

  updateGoal: async (goalId: string, updates: UpdateGoalData) => {
    try {
      set({ error: null })

      const updatedGoal = await goalService.update(goalId, updates)

      set(state => ({
        goals: state.goals.map(goal =>
          goal.id === goalId ? updatedGoal : goal
        ),
      }))

      return updatedGoal
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update goal',
      })
      throw error
    }
  },

  deleteGoal: async (goalId: string) => {
    try {
      set({ error: null })

      await goalService.delete(goalId)

      set(state => ({
        goals: state.goals.filter(goal => goal.id !== goalId),
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete goal',
      })
      throw error
    }
  },

  loadDeletedGoals: async (userId: string) => {
    try {
      set({ error: null })
      const deleted = await goalService.getDeleted(userId)
      set({ deletedGoals: deleted })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load deleted goals',
      })
      throw error
    }
  },

  restoreGoal: async (goalId: string) => {
    try {
      set({ error: null })
      const restored = await goalService.restore(goalId)
      set(state => ({
        deletedGoals: state.deletedGoals.filter(g => g.id !== goalId),
        goals: [...state.goals, restored],
      }))
      return restored
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to restore goal',
      })
      throw error
    }
  },

  permanentDeleteGoal: async (goalId: string) => {
    try {
      set({ error: null })
      await goalService.permanentDelete(goalId)
      set(state => ({
        deletedGoals: state.deletedGoals.filter(g => g.id !== goalId),
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to permanently delete goal',
      })
      throw error
    }
  },

  completeGoal: async (goalId: string) => {
    try {
      set({ error: null })

      const completedGoal = await goalService.complete(goalId)

      set(state => ({
        goals: state.goals.map(goal =>
          goal.id === goalId ? completedGoal : goal
        ),
      }))

      return completedGoal
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to complete goal',
      })
      throw error
    }
  },

  archiveGoal: async (goalId: string) => {
    try {
      set({ error: null })

      const archivedGoal = await goalService.archive(goalId)

      set(state => ({
        goals: state.goals.map(goal =>
          goal.id === goalId ? archivedGoal : goal
        ),
      }))

      return archivedGoal
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to archive goal',
      })
      throw error
    }
  },

  searchGoals: async (userId: string, query: string) => {
    try {
      set({ error: null })

      const results = await goalService.search(userId, query)
      return results
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to search goals',
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),

  // Computed getters
  getActiveGoals: () => {
    return get().goals.filter(goal => goal.status === 'active')
  },

  getCompletedGoals: () => {
    return get().goals.filter(goal => goal.status === 'completed')
  },

  getTopLevelGoals: () => {
    return get().goals.filter(goal => !goal.parentGoalId)
  },

  getSubGoals: (parentGoalId: string) => {
    return get().goals.filter(goal => goal.parentGoalId === parentGoalId)
  },

  getNearingDeadline: () => {
    const now = Date.now()
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000)

    return get().goals.filter(goal => {
      if (!goal.targetDate || goal.status !== 'active') return false
      return goal.targetDate >= now && goal.targetDate <= sevenDaysFromNow
    })
  },
}))
