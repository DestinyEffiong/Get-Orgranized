import type { User } from './user'

export interface AuthCredentials {
  email: string
  password: string
}

export interface SignupData extends AuthCredentials {
  fullName: string
  profilePhoto?: string
}

export interface LoginResponse {
  user: User
  token?: string // For future backend integration
}

export interface AuthState {
  currentUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
}
