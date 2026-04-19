import { verifyToken } from '../utils/tokenUtils.js'

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization']
  
  if (!authHeader) {
    return res.status(401).json({
      error: {
        message: 'Missing authorization header',
        code: 'MISSING_AUTH'
      }
    })
  }

  const token = authHeader.replace('Bearer ', '')

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({
      error: {
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      }
    })
  }

  req.userId = decoded.userId
  next()
}