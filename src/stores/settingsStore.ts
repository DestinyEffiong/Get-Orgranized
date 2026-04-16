import { create } from 'zustand'
import type { UserSettings } from '../types'
import { settingsService, type UpdateSettingsData } from '../services'

interface SettingsState {
  settings: UserSettings | null
  isLoading: boolean
  error: string | null

  // Actions
  loadSettings: (userId: string) => Promise<void>
  updateSettings: (userId: string, updates: UpdateSettingsData) => Promise<void>
  resetSettings: (userId: string) => Promise<void>
  clearError: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,
  error: null,

  loadSettings: async (userId: string) => {
    try {
      set({ isLoading: true, error: null })

      const settings = await settingsService.getOrDefault(userId)

      set({
        settings,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load settings',
      })
      throw error
    }
  },

  updateSettings: async (userId: string, updates: UpdateSettingsData) => {
    try {
      set({ error: null })

      const updatedSettings = await settingsService.update(userId, updates)

      set({ settings: updatedSettings })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update settings',
      })
      throw error
    }
  },

  resetSettings: async (userId: string) => {
    try {
      set({ error: null })

      const defaultSettings = await settingsService.reset(userId)

      set({ settings: defaultSettings })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reset settings',
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
