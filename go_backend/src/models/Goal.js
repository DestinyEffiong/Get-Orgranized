import mongoose from 'mongoose'
import { generateId } from '../utils/idGenerator.js'

const goalSchema = new mongoose.Schema({
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
  category: {
    type: String,
    enum: ['work', 'personal', 'health', 'finance', 'learning', 'relationships', 'other'],
    required: true,
    index: true
  },
  parentGoalId: {
    type: String,
    index: true
  },
  targetDate: {
    type: Number,  // timestamp
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active',
    index: true
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
    type: Number  // timestamp when completed
  },
  deletedAt: {
    type: Number,  // timestamp for soft delete
    index: true
  }
})

// Update updatedAt before saving
goalSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = new Date()
  }
  // Set completedAt when status changes to 'completed'
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = Date.now()
    /*and also if user sets status to completed this then 
    completedAt would automatically be equals to the present time !this.completedAt prevents 
    user from changing goals that has been completed already */
  }
  next()
})

// Compound indexes for common queries
goalSchema.index({ userId: 1, status: 1 })
goalSchema.index({ userId: 1, targetDate: 1 })
goalSchema.index({ userId: 1, category: 1 })

export const Goal = mongoose.model('Goal', goalSchema)