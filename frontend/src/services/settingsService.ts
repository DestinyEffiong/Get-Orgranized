import { getDB } from '../lib/db'
import type { UserSettings } from '../types'

export type UpdateSettingsData = Partial<Omit<UserSettings, 'userId' | 'updatedAt'>>

/**
 * Settings Service
 * This service abstracts settings management logic.
 * When backend is ready, replace IndexedDB calls with API calls.
 */
export const settingsService = {
  /**
   * Get user settings
   */
  get: async (userId: string): Promise<UserSettings | undefined> => {
    const db = await getDB()
    return await db.get('settings', userId)
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

    // Save default settings
    const db = await getDB()
    await db.put('settings', defaultSettings)

    return defaultSettings
  },

  /**
   * Update user settings
   */
  update: async (userId: string, updates: UpdateSettingsData): Promise<UserSettings> => {
    const db = await getDB()

    const currentSettings = await settingsService.getOrDefault(userId)

    const updatedSettings: UserSettings = {
      ...currentSettings,
      ...updates,
      updatedAt: Date.now(),
    }

    await db.put('settings', updatedSettings)
    return updatedSettings
  },

  /**
   * Reset settings to default
   */
  reset: async (userId: string): Promise<UserSettings> => {
    const db = await getDB()

    const defaultSettings: UserSettings = {
      userId,
      theme: 'auto',
      notifications: true,
      soundEffects: true,
      gamificationEnabled: true,
      weekStartsOn: 1,
      updatedAt: Date.now(),
    }

    await db.put('settings', defaultSettings)
    return defaultSettings
  },
}

/**
 * BACKEND MIGRATION GUIDE:
 *
 * When ready to add backend, replace the implementations with API calls:
 *
 * Example:
 *
 * get: async (userId: string): Promise<UserSettings | undefined> => {
 *   const response = await fetch(`/api/settings/${userId}`, {
 *     headers: { 'Authorization': `Bearer ${getToken()}` },
 *   })
 *
 *   if (!response.ok) {
 *     if (response.status === 404) return undefined
 *     throw new Error('Failed to fetch settings')
 *   }
 *
 *   return response.json()
 * }
 */
