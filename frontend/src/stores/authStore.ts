import { create } from 'zustand'
import type { User, SignupData, AuthCredentials } from '../types'
import { authService } from '../services'
import { initDB } from '../lib/db'

interface AuthState {
  currentUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  initialize: () => Promise<void>
  signup: (data: SignupData) => Promise<void>
  login: (credentials: AuthCredentials) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<Pick<User, 'fullName' | 'profilePhoto' | 'avatarColor'>>) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null })

      // Initialize database
      await initDB()

      // Check if user is logged in
      const user = await authService.getCurrentUser()

      if (user) {
        set({
          currentUser: user,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize',
      })
    }
  },

  signup: async (data: SignupData) => {
    try {
      set({ isLoading: true, error: null })

      const response = await authService.signup(data)

      // Save user ID to localStorage for backward compatibility
      localStorage.setItem('currentUserId', response.user.id)
      // Token is already saved by authService via setAuthToken

      set({
        currentUser: response.user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Signup failed',
      })
      throw error
    }
  },

  login: async (credentials: AuthCredentials) => {
    try {
      set({ isLoading: true, error: null })

      const response = await authService.login(credentials)

      // Save user ID to localStorage for backward compatibility
      localStorage.setItem('currentUserId', response.user.id)
      // Token is already saved by authService via setAuthToken

      set({
        currentUser: response.user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      })
      throw error
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null })

      await authService.logout()

      set({
        currentUser: null,
        isAuthenticated: false,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      })
      throw error
    }
  },

  updateProfile: async (updates: Partial<Pick<User, 'fullName' | 'profilePhoto' | 'avatarColor'>>) => {
    try {
      const { currentUser } = get()
      if (!currentUser) {
        throw new Error('No user logged in')
      }

      // Don't set isLoading for quick profile updates to avoid UI flashing
      set({ error: null })

      const updatedUser = await authService.updateProfile(currentUser.id, updates)

      set({
        currentUser: updatedUser,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Profile update failed',
      })
      throw error
    }
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    try {
      const { currentUser } = get()
      if (!currentUser) {
        throw new Error('No user logged in')
      }

      set({ isLoading: true, error: null })

      await authService.changePassword(currentUser.id, oldPassword, newPassword)

      set({ isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Password change failed',
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
