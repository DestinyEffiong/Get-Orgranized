import { getDB } from '../lib/db'
import type { Goal, GoalStatus, CreateGoalData as CreateGoalDataType, UpdateGoalData as UpdateGoalDataType } from '../types'

// Utility function to generate a unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export interface CreateGoalData extends CreateGoalDataType {
  userId: string
}

export interface UpdateGoalData extends UpdateGoalDataType {
  status?: GoalStatus
}

/**
 * Goal Service
 * This service abstracts goal management logic.
 * When backend is ready, replace IndexedDB calls with API calls.
 */
export const goalService = {
  /**
   * Create a new goal
   */
  create: async (data: CreateGoalData): Promise<Goal> => {
    const db = await getDB()

    const goal: Goal = {
      id: generateId(),
      userId: data.userId,
      title: data.title,
      description: data.description,
      category: data.category,
      parentGoalId: data.parentGoalId,
      targetDate: data.targetDate,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    await db.add('goals', goal)
    return goal
  },

  /**
   * Get all goals for a user
   */
  getAllByUser: async (userId: string): Promise<Goal[]> => {
    const db = await getDB()
    const goals = await db.getAllFromIndex('goals', 'by-user', userId)
    return goals.filter(g => !g.deletedAt)
  },

  /**
   * Get a single goal by ID
   */
  getById: async (goalId: string): Promise<Goal | undefined> => {
    const db = await getDB()
    return await db.get('goals', goalId)
  },

  /**
   * Get active goals
   */
  getActive: async (userId: string): Promise<Goal[]> => {
    const db = await getDB()
    const allGoals = await db.getAllFromIndex('goals', 'by-user', userId)
    return allGoals.filter(goal => goal.status === 'active')
  },

  /**
   * Get completed goals
   */
  getCompleted: async (userId: string): Promise<Goal[]> => {
    const db = await getDB()
    const allGoals = await db.getAllFromIndex('goals', 'by-user', userId)
    return allGoals.filter(goal => goal.status === 'completed')
  },

  /**
   * Update a goal
   */
  update: async (goalId: string, updates: UpdateGoalData): Promise<Goal> => {
    const db = await getDB()

    const goal = await db.get('goals', goalId)
    if (!goal) {
      throw new Error('Goal not found')
    }

    const updatedGoal: Goal = {
      ...goal,
      ...updates,
      updatedAt: Date.now(),
      // Set completedAt if status changed to completed
      completedAt: updates.status === 'completed' && goal.status !== 'completed'
        ? Date.now()
        : updates.status !== 'completed'
        ? undefined
        : goal.completedAt,
    }

    await db.put('goals', updatedGoal)
    return updatedGoal
  },

  /**
   * Complete a goal
   */
  complete: async (goalId: string): Promise<Goal> => {
    return await goalService.update(goalId, {
      status: 'completed',
      completedAt: Date.now()
    })
  },

  /**
   * Archive a goal
   */
  archive: async (goalId: string): Promise<Goal> => {
    return await goalService.update(goalId, { status: 'archived' })
  },

  /**
   * Soft-delete a goal (moves to trash)
   */
  delete: async (goalId: string): Promise<void> => {
    const db = await getDB()
    const goal = await db.get('goals', goalId)
    if (!goal) throw new Error('Goal not found')
    await db.put('goals', { ...goal, deletedAt: Date.now(), updatedAt: Date.now() })
  },

  /**
   * Restore a soft-deleted goal from trash
   */
  restore: async (goalId: string): Promise<Goal> => {
    const db = await getDB()
    const goal = await db.get('goals', goalId)
    if (!goal) throw new Error('Goal not found')
    const restored = { ...goal, deletedAt: undefined, updatedAt: Date.now() }
    await db.put('goals', restored)
    return restored
  },

  /**
   * Permanently delete a goal
   */
  permanentDelete: async (goalId: string): Promise<void> => {
    const db = await getDB()
    await db.delete('goals', goalId)
  },

  /**
   * Get all soft-deleted goals for a user
   */
  getDeleted: async (userId: string): Promise<Goal[]> => {
    const db = await getDB()
    const goals = await db.getAllFromIndex('goals', 'by-user', userId)
    return goals.filter(g => !!g.deletedAt)
  },

  /**
   * Search goals by title
   */
  search: async (userId: string, query: string): Promise<Goal[]> => {
    const db = await getDB()
    const allGoals = await db.getAllFromIndex('goals', 'by-user', userId)

    const lowerQuery = query.toLowerCase()
    return allGoals.filter(goal =>
      goal.title.toLowerCase().includes(lowerQuery) ||
      goal.description?.toLowerCase().includes(lowerQuery)
    )
  },

  /**
   * Get goals nearing deadline (within 7 days)
   */
  getNearingDeadline: async (userId: string): Promise<Goal[]> => {
    const db = await getDB()
    const allGoals = await db.getAllFromIndex('goals', 'by-user', userId)

    const now = Date.now()
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000)

    return allGoals.filter(goal => {
      if (!goal.targetDate || goal.status !== 'active') return false
      return goal.targetDate >= now && goal.targetDate <= sevenDaysFromNow
    })
  },
}

/**
 * BACKEND MIGRATION GUIDE:
 *
 * When ready to add backend, replace the implementations with API calls:
 *
 * Example:
 *
 * getAllByUser: async (userId: string): Promise<Goal[]> => {
 *   const response = await fetch(`/api/goals?userId=${userId}`, {
 *     headers: { 'Authorization': `Bearer ${getToken()}` },
 *   })
 *
 *   if (!response.ok) {
 *     throw new Error('Failed to fetch goals')
 *   }
 *
 *   return response.json()
 * }
 */
