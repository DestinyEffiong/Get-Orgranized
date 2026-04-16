import { getDB } from '../lib/db'
import type { User, SignupData, AuthCredentials, LoginResponse } from '../types'

// Utility function to generate a unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

// Hash password using Web Crypto API
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// Verify password
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

/**
 * Auth Service
 * This service abstracts authentication logic.
 * When backend is ready, replace IndexedDB calls with API calls.
 */
export const authService = {
  /**
   * Sign up a new user
   */
  signup: async (data: SignupData): Promise<LoginResponse> => {
    const db = await getDB()

    // Check if user already exists
    const existingUser = await db.getFromIndex('users', 'by-email', data.email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash password
    const passwordHash = await hashPassword(data.password)

    // Create user
    const user: User = {
      id: generateId(),
      email: data.email,
      fullName: data.fullName,
      passwordHash,
      profilePhoto: data.profilePhoto,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // Save to database
    await db.add('users', user)

    // Create default settings
    await db.add('settings', {
      userId: user.id,
      theme: 'auto',
      notifications: true,
      soundEffects: true,
      gamificationEnabled: true,
      weekStartsOn: 1,
      updatedAt: Date.now(),
    })

    // Return user (without password hash)
    const { passwordHash: _, ...userWithoutPassword } = user
    return {
      user: userWithoutPassword as User,
    }
  },

  /**
   * Log in a user
   */
  login: async (credentials: AuthCredentials): Promise<LoginResponse> => {
    const db = await getDB()

    // Find user by email
    const user = await db.getFromIndex('users', 'by-email', credentials.email)
    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const isPasswordValid = await verifyPassword(credentials.password, user.passwordHash)
    if (!isPasswordValid) {
      throw new Error('Invalid email or password')
    }

    // Return user (without password hash)
    const { passwordHash: _, ...userWithoutPassword } = user
    return {
      user: userWithoutPassword as User,
    }
  },

  /**
   * Log out (clear session)
   */
  logout: async (): Promise<void> => {
    // Clear any session data if needed
    // When backend is ready, this will call the logout endpoint
    localStorage.removeItem('currentUserId')
  },

  /**
   * Get current user from session
   */
  getCurrentUser: async (): Promise<User | null> => {
    const userId = localStorage.getItem('currentUserId')
    if (!userId) {
      return null
    }

    const db = await getDB()
    const user = await db.get('users', userId)

    if (!user) {
      localStorage.removeItem('currentUserId')
      return null
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user
    return userWithoutPassword as User
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId: string, updates: Partial<Pick<User, 'fullName' | 'profilePhoto' | 'avatarColor'>>): Promise<User> => {
    const db = await getDB()

    const user = await db.get('users', userId)
    if (!user) {
      throw new Error('User not found')
    }

    const updatedUser: User = {
      ...user,
      updatedAt: Date.now(),
    }

    // Apply updates, handling undefined values (to delete properties)
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) {
        // Remove the property if value is undefined
        delete (updatedUser as any)[key]
      } else {
        // Update the property
        (updatedUser as any)[key] = value
      }
    }

    await db.put('users', updatedUser)

    // Return without password hash
    const { passwordHash: _, ...userWithoutPassword } = updatedUser
    return userWithoutPassword as User
  },

  /**
   * Change password
   */
  changePassword: async (userId: string, oldPassword: string, newPassword: string): Promise<void> => {
    const db = await getDB()

    const user = await db.get('users', userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Verify old password
    const isOldPasswordValid = await verifyPassword(oldPassword, user.passwordHash)
    if (!isOldPasswordValid) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update user
    const updatedUser: User = {
      ...user,
      passwordHash: newPasswordHash,
      updatedAt: Date.now(),
    }

    await db.put('users', updatedUser)
  },
}

/**
 * BACKEND MIGRATION GUIDE:
 *
 * When ready to add backend, replace the implementations above with API calls:
 *
 * Example:
 *
 * signup: async (data: SignupData): Promise<LoginResponse> => {
 *   const response = await fetch('/api/auth/signup', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(data),
 *   })
 *
 *   if (!response.ok) {
 *     const error = await response.json()
 *     throw new Error(error.message)
 *   }
 *
 *   return response.json()
 * }
 *
 * The service interface remains the same, so no changes needed in components or stores.
 */
