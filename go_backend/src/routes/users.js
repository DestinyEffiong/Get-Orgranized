import express from 'express'
import { updateProfile } from '../controllers/authController.js'
import { getSettings, updateSettings } from '../controllers/settingsController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// All user routes require authentication
router.use(authMiddleware)

// Settings routes
router.get('/:userId/settings', getSettings)
router.patch('/:userId/settings', updateSettings)

// Profile routes
router.patch('/:userId/profile', updateProfile)

export default router