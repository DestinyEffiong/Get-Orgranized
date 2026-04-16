export interface User {
  id: string
  email: string
  fullName: string
  passwordHash: string
  profilePhoto?: string
  avatarColor?: string // Optional custom color for default avatar
  createdAt: number
  updatedAt: number
}

export interface UserSettings {
  userId: string
  theme: 'light' | 'dark' | 'auto'
  notifications: boolean
  soundEffects: boolean
  gamificationEnabled: boolean
  weekStartsOn: 0 | 1 // 0 = Sunday, 1 = Monday
  updatedAt: number
}
