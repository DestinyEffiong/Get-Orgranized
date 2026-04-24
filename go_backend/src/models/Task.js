import mongoose from 'mongoose'
import { generateId } from '../utils/idGenerator.js'

const taskSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: generateId
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 255
  },
  description: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Number, // timestamp
    index: true
  },
  reminder: {
    type: Number // timestamp
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  goalId: {
    type: String,
    index: true
  },
  isHabit: {
    type: Boolean,
    default: false
  },
  habitDays: [{
    type: Number, // 0-6 for days of week
    min: 0,
    max: 6
  }],
  habitCompletions: {
    type: Map,
    of: Boolean,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Number // timestamp when status changed to 'done'
  },
  deletedAt: {
    type: Number, // timestamp for soft delete
    index: true
  }
})

// Update updatedAt before saving
taskSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = new Date()
  }
  // Set completedAt when status changes to 'done'
  if (this.isModified('status') && this.status === 'done' && !this.completedAt) {
    this.completedAt = Date.now()
  }
  next()
})

// Update updatedAt before updating
taskSchema.pre('findByIdAndUpdate', function(next) {
  this.set({ updatedAt: new Date() })
  next()
})

// Compound indexes for common queries
taskSchema.index({ userId: 1, status: 1 })
taskSchema.index({ userId: 1, dueDate: 1 })
taskSchema.index({ userId: 1, goalId: 1 })

export const Task = mongoose.model('Task', taskSchema)