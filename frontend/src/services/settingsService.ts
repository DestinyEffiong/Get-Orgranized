import { apiGet, apiPatch } from '../utils/apiClient'
import type { UserSettings } from '../types'

export type UpdateSettingsData = Partial<Omit<UserSettings, 'userId' | 'updatedAt'>>

/**
 * Settings Service
 * Now uses backend API for all operations
 * Service interface remains the same for zero-impact integration
 */
export const settingsService = {
  /**
   * Get user settings via API
   */
  get: async (userId: string): Promise<UserSettings | undefined> => {
    try {
      const response = await apiGet<{ settings: UserSettings }>(`/api/users/${userId}/settings`)
      return response.settings
    } catch (error) {
      return undefined
    }
  },

  /**
   * Get user settings with defaults
   */
  getOrDefault: async (userId: string): Promise<UserSettings> => {
    const settings = await settingsService.get(userId)

    if (settings) {
      return settings
    }

    // Return default settings if none exist
    const defaultSettings: UserSettings = {
      userId,
      theme: 'auto',
      notifications: true,
      soundEffects: true,
      gamificationEnabled: true,
      weekStartsOn: 1,
      updatedAt: Date.now(),
    }

    return defaultSettings
  },

  /**
   * Update user settings via API
   */
  update: async (userId: string, updates: UpdateSettingsData): Promise<UserSettings> => {
    const response = await apiPatch<{ settings: UserSettings }>(`/api/users/${userId}/settings`, updates)
    return response.settings
  },

  /**
   * Reset settings to default
   */
  reset: async (userId: string): Promise<UserSettings> => {
    const defaultSettings: UserSettings = {
      userId,
      theme: 'auto',
      notifications: true,
      soundEffects: true,
      gamificationEnabled: true,
      weekStartsOn: 1,
      updatedAt: Date.now(),
    }

    const response = await apiPatch<{ settings: UserSettings }>(`/api/users/${userId}/settings`, defaultSettings)
    return response.settings
  },
}

/**
 * NOTE: settingsService has been migrated to use the backend API
 * All IndexedDB calls have been replaced with API calls
 * The service interface remains the same for zero-impact integration
 */
