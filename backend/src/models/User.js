import mongoose from 'mongoose'
import { generateId } from '../utils/idGenerator.js'

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: generateId
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  profilePhoto: {
    type: String,
    default: null
  },
  avatarColor: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Update updatedAt before saving
userSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = new Date()
  }
  next()
})

// Update updatedAt before updating
userSchema.pre('findByIdAndUpdate', function(next) {
  this.set({ updatedAt: new Date() })
  next()
})

export const User = mongoose.model('User', userSchema)
