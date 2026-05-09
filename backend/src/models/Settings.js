import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'auto'
  },
  notifications: {
    type: Boolean,
    default: true
  },
  soundEffects: {
    type: Boolean,
    default: true
  },
  gamificationEnabled: {
    type: Boolean,
    default: true
  },
  weekStartsOn: {
    type: Number,
    enum: [0, 1], // 0 = Sunday, 1 = Monday
    default: 1
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Update updatedAt before saving
settingsSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Update updatedAt before updating
settingsSchema.pre('findByIdAndUpdate', function(next) {
  this.set({ updatedAt: new Date() })
  next()
})

export const Settings = mongoose.model('Settings', settingsSchema)
