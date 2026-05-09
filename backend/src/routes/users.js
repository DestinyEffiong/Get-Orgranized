import express from 'express'
import { updateProfile } from '../controllers/authController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.patch('/:userId/profile', authMiddleware, updateProfile)

export default router