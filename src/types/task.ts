export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate?: number
  reminder?: number // Timestamp for reminder notification
  tags: string[]
  goalId?: string
  isHabit: boolean // Whether this is a recurring habit
  habitDays?: number[] // Days of week for habits (0-6, 0=Sunday)
  habitCompletions?: { [date: string]: boolean } // Track daily completions
  createdAt: number
  updatedAt: number
  completedAt?: number
  deletedAt?: number
}

export type TaskStatus = Task['status']
export type TaskPriority = Task['priority']

export interface CreateTaskData {
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: number
  reminder?: number
  tags?: string[]
  goalId?: string
  isHabit?: boolean
  habitDays?: number[]
}

export interface UpdateTaskData {
  title?: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  dueDate?: number
  tags?: string[]
  goalId?: string
  isHabit?: boolean
  habitDays?: number[]
}
