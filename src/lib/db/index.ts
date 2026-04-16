import { openDB, type IDBPDatabase } from 'idb'
import type { User, UserSettings, Task, Goal } from '../../types'

const DB_NAME = 'go-app-db'
const DB_VERSION = 1

export interface GoDatabase {
  users: {
    key: string
    value: User
    indexes: { 'by-email': string }
  }
  tasks: {
    key: string
    value: Task
    indexes: {
      'by-user': string
      'by-status': string
      'by-goal': string
      'by-due-date': number
    }
  }
  goals: {
    key: string
    value: Goal
    indexes: {
      'by-user': string
      'by-status': string
    }
  }
  settings: {
    key: string
    value: UserSettings
  }
}

let dbInstance: IDBPDatabase<GoDatabase> | null = null

export const initDB = async (): Promise<IDBPDatabase<GoDatabase>> => {
  if (dbInstance) {
    return dbInstance
  }

  dbInstance = await openDB<GoDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Users store
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' })
        userStore.createIndex('by-email', 'email', { unique: true })
      }

      // Tasks store
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' })
        taskStore.createIndex('by-user', 'userId')
        taskStore.createIndex('by-status', 'status')
        taskStore.createIndex('by-goal', 'goalId')
        taskStore.createIndex('by-due-date', 'dueDate')
      }

      // Goals store
      if (!db.objectStoreNames.contains('goals')) {
        const goalStore = db.createObjectStore('goals', { keyPath: 'id' })
        goalStore.createIndex('by-user', 'userId')
        goalStore.createIndex('by-status', 'status')
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'userId' })
      }
    },
  })

  return dbInstance
}

export const getDB = async (): Promise<IDBPDatabase<GoDatabase>> => {
  if (!dbInstance) {
    return await initDB()
  }
  return dbInstance
}

export const closeDB = (): void => {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
