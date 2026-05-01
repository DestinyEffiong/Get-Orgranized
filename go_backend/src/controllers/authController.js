import bcryptjs from 'bcryptjs'
import sanitizeHtml from 'sanitize-html'
import { User } from '../models/User.js'
import { Settings } from '../models/Settings.js'
import { generateToken, verifyToken } from '../utils/tokenUtils.js'
import { generateId } from '../utils/idGenerator.js'

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10

//validate password
const validatePassword = (password) => {
  //errors is an aray that contains all error messages
  const errors = []

  //checks if password is less than 8 characters 
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

    //checks if passwords contains at least one capital letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // checks if passwords one small letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  //checks if password contains at least one number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // //checks if password contains at least one special character
  // if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
  //   errors.push('Password must contain at least one special character')
  // }

  //after checking all the conditions its return all the availble errors found if any
  return errors
}

//valdate email
const validateEmail = (email) => {
  /*emasilRegex means "From the very start to the very end, 
  look for a string that has some text (no spaces or @), 
  followed by an @, followed by more text, then a dot, and finally the last bit of text.
  */
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  //return true is email matches the pattern and false if it doesn't
  return emailRegex.test(email.toLowerCase())
}

const userToResponse = (user) => {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    profilePhoto: user.profilePhoto,
    avatarColor: user.avatarColor,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }
}


//signup
export const signup = async (req, res) => {
  try {
    const { email, password, fullName, profilePhoto } = req.body

    // Sanitize inputs
    // remove all html tags and all takes the plain text this prevent people from injectiong malicious script into our DB
    const sanitizedEmail = sanitizeHtml(email, { allowedTags: [], allowedAttributes: {} })
    const sanitizedFullName = sanitizeHtml(fullName, { allowedTags: [], allowedAttributes: {} })
    const sanitizedProfilePhoto = profilePhoto ? sanitizeHtml(profilePhoto, { allowedTags: [], allowedAttributes: {} }) : null

    // Validate required fields
    if (!sanitizedEmail || !password || !sanitizedFullName) {
      return res.status(400).json({
        error: {
          message: 'Email, password, and fullName are required',
          code: 'MISSING_FIELDS'
        }
      })
    }

    // Validate password strength
    const passwordErrors = validatePassword(password)
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        error: {
          message: 'Password does not meet requirements',
          details: passwordErrors,
          code: 'INVALID_PASSWORD'
        }
      })
    }

    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({
        error: {
          message: 'Invalid email format',
          code: 'INVALID_EMAIL'
        }
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })

    if (existingUser) {
      return res.status(409).json({
        error: {
          message: 'User with this email already exists',
          code: 'EMAIL_EXISTS'
        }
      })
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, BCRYPT_ROUNDS)

    // Create user
    const userId = generateId()
    
    const newUser = new User({
      id: userId,
      email: sanitizedEmail.toLowerCase(),
      fullName: sanitizedFullName,
      passwordHash,
      profilePhoto: sanitizedProfilePhoto
    })

    await newUser.save()

    // Create default settings
    const settings = new Settings({
      userId: userId
    })
    await settings.save()

    // Generate token
    const token = generateToken(userId)

    res.status(201).json({
      user: userToResponse(newUser),
      token
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}

//login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: 'Email and password are required',
          code: 'MISSING_FIELDS'
        }
      })
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }
      })
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }
      })
    }

    // Generate token
    const token = generateToken(user.id)

    res.status(200).json({
      user: userToResponse(user),
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}

//get current user uisng userId
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.userId })

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'NOT_FOUND'
        }
      })
    }

    res.status(200).json({
      user: userToResponse(user)
    })
  } catch (error) {
    console.error('Get current user error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}


//logout
export const logout = async (req, res) => {
  // In a stateless JWT setup, logout is just clearing the token on client-side
  // If using token blacklist, add token to blacklist here
  res.status(200).json({
    message: 'Logged out successfully'
  })
}

//update user profile
export const updateProfile = async (req, res) => {
  try {
    const { userId: paramUserId } = req.params
    const { fullName, profilePhoto, avatarColor } = req.body

    // Verify user can only update their own profile
    if (paramUserId !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN'
        }
      })
    }

    // Check user exists
    const user = await User.findOne({ id: paramUserId })

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'NOT_FOUND'
        }
      })
    }

    // Update fields
    if (fullName) user.fullName = fullName
    if (profilePhoto) user.profilePhoto = profilePhoto
    if (avatarColor) user.avatarColor = avatarColor

    await user.save()

    res.status(200).json({
      user: userToResponse(user)
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}

//changes password
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body

    // Validate required fields
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        error: {
          message: 'Old and new passwords are required',
          code: 'MISSING_FIELDS'
        }
      })
    }

    // Get user
    const user = await User.findOne({ id: req.userId })

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'NOT_FOUND'
        }
      })
    }

    // Verify old password
    const isOldPasswordValid = await bcryptjs.compare(oldPassword, user.passwordHash)

    //if isOldPassWordValid = false 
    if (!isOldPasswordValid) {
      return res.status(401).json({
        error: {
          message: 'Current password is incorrect',
          code: 'INVALID_PASSWORD'
        }
      })
    }

    // Hash new password
    const newPasswordHash = await bcryptjs.hash(newPassword, BCRYPT_ROUNDS)

    // Update password
    user.passwordHash = newPasswordHash
    await user.save()

    res.status(200).json({
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    })
  }
}