import express from 'express';
const router = express.Router();
import {
  signup,
  login,
  getCurrentUser,
  logout,
  updateProfile,
  changePassword
} from '../controllers/authController.js'
import { authMiddleware } from '../middleware/auth.js'



// Public routes
router.post('/signup', signup)
router.post('/login', login)
router.post('/logout', logout)

// Protected routes
router.get('/me', authMiddleware, getCurrentUser)
router.post('/change-password', authMiddleware, changePassword)

export default router