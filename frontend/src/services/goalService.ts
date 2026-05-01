import { apiPost, apiGet, apiPatch, apiDelete } from '../utils/apiClient'
import type { Goal, GoalStatus, CreateGoalData as CreateGoalDataType, UpdateGoalData as UpdateGoalDataType } from '../types'

export interface CreateGoalData extends CreateGoalDataType {
  userId?: string
}

export interface UpdateGoalData extends UpdateGoalDataType {
  status?: GoalStatus
}

/**
 * Goal Service
 * Now uses backend API for all operations
 * Service interface remains the same for zero-impact integration
 */
export const goalService = {
  /**
   * Create a new goal via API
   */
  create: async (data: CreateGoalData): Promise<Goal> => {
    const response = await apiPost<{ goal: Goal }>('/api/goals', {
      title: data.title,
      description: data.description,
      category: data.category,
      parentGoalId: data.parentGoalId,
      targetDate: data.targetDate,
    })
    return response.goal
  },

  /**
   * Get all goals for a user
   */
  getAllByUser: async (userId: string): Promise<Goal[]> => {
    const response = await apiGet<{ goals: Goal[] }>(`/api/goals/${userId}`)
    return response.goals
  },

  /**
   * Get a single goal by ID
   */
  getById: async (goalId: string): Promise<Goal | undefined> => {
    try {
      const response = await apiGet<{ goal: Goal }>(`/api/goals/${goalId}`)
      return response.goal
    } catch (error) {
      return undefined
    }
  },

  /**
   * Get active goals
   */
  getActive: async (userId: string): Promise<Goal[]> => {
    const response = await apiGet<{ goals: Goal[] }>(`/api/goals/${userId}?status=active`)
    return response.goals
  },

  /**
   * Get completed goals
   */
  getCompleted: async (userId: string): Promise<Goal[]> => {
    const response = await apiGet<{ goals: Goal[] }>(`/api/goals/${userId}?status=completed`)
    return response.goals
  },

  /**
   * Update a goal
   */
  update: async (goalId: string, updates: UpdateGoalData): Promise<Goal> => {
    const response = await apiPatch<{ goal: Goal }>(`/api/goals/${goalId}`, updates)
    return response.goal
  },

  /**
   * Complete a goal
   */
  complete: async (goalId: string): Promise<Goal> => {
    const response = await apiPost<{ goal: Goal }>(`/api/goals/${goalId}/complete`, {})
    return response.goal
  },

  /**
   * Archive a goal
   */
  archive: async (goalId: string): Promise<Goal> => {
    const response = await apiPost<{ goal: Goal }>(`/api/goals/${goalId}/archive`, {})
    return response.goal
  },

  /**
   * Soft-delete a goal (moves to trash)
   */
  delete: async (goalId: string): Promise<void> => {
    await apiDelete(`/api/goals/${goalId}`)
  },

  /**
   * Restore a soft-deleted goal from trash
   */
  restore: async (goalId: string): Promise<Goal> => {
    const response = await apiPost<{ goal: Goal }>(`/api/goals/${goalId}/restore`, {})
    return response.goal
  },

  /**
   * Permanently delete a goal
   */
  permanentDelete: async (goalId: string): Promise<void> => {
    await apiDelete(`/api/goals/${goalId}/permanent`)
  },

  /**
   * Get all soft-deleted goals for a user
   */
  getDeleted: async (userId: string): Promise<Goal[]> => {
    const response = await apiGet<{ goals: Goal[] }>(`/api/goals/deleted/${userId}`)
    return response.goals
  },

  /**
   * Search goals by title
   */
  search: async (userId: string, query: string): Promise<Goal[]> => {
    const response = await apiGet<{ goals: Goal[] }>(`/api/goals/search/${userId}?q=${encodeURIComponent(query)}`)
    return response.goals
  },

  /**
   * Get goals nearing deadline (within 7 days)
   */
  getNearingDeadline: async (userId: string): Promise<Goal[]> => {
    const response = await apiGet<{ goals: Goal[] }>(`/api/goals/nearing-deadline/${userId}`)
    return response.goals
  },
}

/**
 * NOTE: goalService has been migrated to use the backend API
 * All IndexedDB calls have been replaced with API calls
 * The service interface remains the same for zero-impact integration
 */
