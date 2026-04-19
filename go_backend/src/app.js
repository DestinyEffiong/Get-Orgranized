import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'

const app = express()

// Connect to MongoDB
await connectDB()

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

app.use('/api/users', usersRoutes)

// Routes
app.use('/api/auth', authRoutes)

// User routes (for /api/users/{userId}/profile)
app.patch('/api/users/:userId/profile', (req, res, next) => {
  // This can be in a separate users router
  // For now, redirect to auth controller
  // In production, create a dedicated users router
  console.log('PATCH /api/users/:userId/profile is not yet implemented')
  res.status(501).json({ error: 'Not implemented' })
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Not found',
      code: 'NOT_FOUND'
    }
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    }
  })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`CORS enabled for: ${process.env.CORS_ORIGIN}`)
})