export interface Goal {
  id: string
  userId: string
  title: string
  description: string
  category: GoalCategory
  parentGoalId?: string // If set, this is a sub-goal under a parent goal
  targetDate?: number
  status: 'active' | 'completed' | 'archived'
  createdAt: number
  updatedAt: number
  completedAt?: number
  deletedAt?: number
}

export type GoalStatus = Goal['status']

export type GoalCategory =
  | 'work'
  | 'personal'
  | 'health'
  | 'finance'
  | 'learning'
  | 'relationships'
  | 'other'

export interface CreateGoalData {
  title: string
  description: string
  category: GoalCategory
  parentGoalId?: string
  targetDate?: number
}

export interface UpdateGoalData {
  title?: string
  description?: string
  category?: GoalCategory
  targetDate?: number
  completedAt?: number
}

export interface GoalTemplate {
  id: string
  title: string
  description: string
  category: GoalCategory
  icon: string
}

export const goalTemplates: GoalTemplate[] = [
  {
    id: 'fitness',
    title: 'Fitness Goal',
    description: 'Get fit and healthy',
    category: 'health',
    icon: '💪'
  },
  {
    id: 'career',
    title: 'Career Advancement',
    description: 'Grow your career',
    category: 'work',
    icon: '🚀'
  },
  {
    id: 'learning',
    title: 'Learn a New Skill',
    description: 'Master something new',
    category: 'learning',
    icon: '📚'
  },
  {
    id: 'finance',
    title: 'Financial Goal',
    description: 'Improve your finances',
    category: 'finance',
    icon: '💰'
  },
  {
    id: 'project',
    title: 'Personal Project',
    description: 'Build something amazing',
    category: 'personal',
    icon: '🎨'
  },
  {
    id: 'relationships',
    title: 'Relationship Goal',
    description: 'Strengthen connections',
    category: 'relationships',
    icon: '❤️'
  }
]

export const categoryColors: Record<GoalCategory, { bg: string; text: string; border: string }> = {
  work: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
  personal: { bg: '#FCE7F3', text: '#BE185D', border: '#EC4899' },
  health: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
  finance: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  learning: { bg: '#E0E7FF', text: '#3730A3', border: '#6366F1' },
  relationships: { bg: '#FECDD3', text: '#9F1239', border: '#F43F5E' },
  other: { bg: '#E5E7EB', text: '#374151', border: '#6B7280' }
}
