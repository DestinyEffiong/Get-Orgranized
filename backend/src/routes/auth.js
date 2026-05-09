import express from 'express';
const router = express.Router();
import rateLimit from 'express-rate-limit';
import {
  signup,
  login,
  getCurrentUser,
  logout,
  updateProfile,
  changePassword
} from '../controllers/authController.js'
import { authMiddleware } from '../middleware/auth.js'

// Rate limiting for auth endpoints
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 signup attempts per hour per IP
  message: {
    error: {
      message: 'Too many signup attempts, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes per IP
  message: {
    error: {
      message: 'Too many login attempts, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Public routes
router.post('/signup', signupLimiter, signup)
router.post('/login', loginLimiter, login)
router.post('/logout', logout)

// Protected routes
router.get('/me', authMiddleware, getCurrentUser)
router.post('/change-password', authMiddleware, changePassword)

export default router