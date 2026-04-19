import { apiPost, apiGet, apiPatch, setAuthToken, clearAuthToken, ApiError } from '../utils/apiClient'
import type { User, SignupData, AuthCredentials, LoginResponse } from '../types'

/**
 * Auth Service
 * Now uses backend API for all operations
 * Service interface remains the same for zero-impact integration
 */
export const authService = {
  /**
   * Sign up a new user
   */
  signup: async (data: SignupData): Promise<LoginResponse> => {
    try {
      const response = await apiPost<LoginResponse>('/api/auth/signup', {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        profilePhoto: data.profilePhoto,
      })

      // Store token if provided
      if (response.token) {
        setAuthToken(response.token)
      }

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        // 409 Conflict - email already exists
        if (error.status === 409) {
          throw new Error('User with this email already exists')
        }
      }
      throw error
    }
  },

  /**
   * Log in a user
   */
  login: async (credentials: AuthCredentials): Promise<LoginResponse> => {
    try {
      const response = await apiPost<LoginResponse>('/api/auth/login', {
        email: credentials.email,
        password: credentials.password,
      })

      // Store token if provided
      if (response.token) {
        setAuthToken(response.token)
      }

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        // 401 Unauthorized - wrong credentials
        if (error.status === 401) {
          throw new Error('Invalid email or password')
        }
      }
      throw error
    }
  },

  /**
   * Log out (clear session)
   */
  logout: async (): Promise<void> => {
    try {
      // Call backend logout endpoint if it exists
      // This allows backend to invalidate tokens if using token blacklist
      await apiPost('/api/auth/logout')
    } catch {
      // Ignore errors, just clear locally
    } finally {
      // Always clear local auth
      clearAuthToken()
    }
  },

  /**
   * Get current user from session
   */
  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      return null
    }

    try {
      const response = await apiGet<{ user: User }>('/api/auth/me')
      return response.user
    } catch (error) {
      // If 401, token is invalid
      if (error instanceof ApiError && error.status === 401) {
        clearAuthToken()
        return null
      }

      // For other errors, log and return null
      console.error('Failed to get current user:', error)
      return null
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId: string, updates: Partial<Pick<User, 'fullName' | 'profilePhoto' | 'avatarColor'>>): Promise<User> => {
    try {
      const response = await apiPatch<{ user: User }>(`/api/users/${userId}/profile`, updates)
      return response.user
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw new Error('User not found')
        }
        if (error.status === 403) {
          throw new Error('You do not have permission to update this profile')
        }
      }
      throw error
    }
  },

  /**
   * Change password
   */
  changePassword: async (_userId: string, oldPassword: string, newPassword: string): Promise<void> => {
    try {
      await apiPost(`/api/auth/change-password`, {
        oldPassword,
        newPassword,
      })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          throw new Error('Current password is incorrect')
        }
      }
      throw error
    }
  },
}
