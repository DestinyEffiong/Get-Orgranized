import { Settings } from '../models/Settings.js'

/**
 * Get user settings
 */
export const getSettings = async (req, res) => {
  try {
    const { userId } = req.params

    // Verify user can only access their own settings
    if (userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    let settings = await Settings.findOne({ userId })

    // If no settings exist, create default settings
    if (!settings) {
      settings = new Settings({
        userId,
        theme: 'auto',
        notifications: true,
        soundEffects: true,
        gamificationEnabled: true,
        weekStartsOn: 1
      })
      await settings.save()
    }

    res.status(200).json({
      settings: {
        userId: settings.userId,
        theme: settings.theme,
        notifications: settings.notifications,
        soundEffects: settings.soundEffects,
        gamificationEnabled: settings.gamificationEnabled,
        weekStartsOn: settings.weekStartsOn,
        updatedAt: settings.updatedAt
      }
    })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}

/**
 * Update user settings
 */
export const updateSettings = async (req, res) => {
  try {
    const { userId } = req.params
    const updates = req.body

    // Verify user can only update their own settings
    if (userId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    // Find existing settings or create default
    let settings = await Settings.findOne({ userId })

    if (!settings) {
      settings = new Settings({
        userId,
        theme: 'auto',
        notifications: true,
        soundEffects: true,
        gamificationEnabled: true,
        weekStartsOn: 1
      })
    }

    // Update allowed fields
    const allowedFields = ['theme', 'notifications', 'soundEffects', 'gamificationEnabled', 'weekStartsOn']
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        settings[field] = updates[field]
      }
    })

    settings.updatedAt = new Date()
    await settings.save()

    res.status(200).json({
      settings: {
        userId: settings.userId,
        theme: settings.theme,
        notifications: settings.notifications,
        soundEffects: settings.soundEffects,
        gamificationEnabled: settings.gamificationEnabled,
        weekStartsOn: settings.weekStartsOn,
        updatedAt: settings.updatedAt
      }
    })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}