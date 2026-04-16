/** @jsxImportSource theme-ui */
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Eye, EyeOff, User, Camera } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores'

const SetupCredentialsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || ''
  const signup = useAuthStore(state => state.signup)

  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match!')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters!')
      return
    }

    try {
      setIsSubmitting(true)

      await signup({
        email,
        fullName,
        password,
        profilePhoto: profilePhoto || undefined,
      })

      // Navigate to dashboard after successful signup
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(
        135deg,
        rgba(79, 195, 255, 0.15) 0%,
        rgba(135, 206, 250, 0.1) 25%,
        rgba(173, 216, 230, 0.05) 50%,
        rgba(240, 248, 255, 0.02) 75%,
        rgba(255, 255, 255, 1) 100%
      )`,
      fontFamily: 'body'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{
          background: 'surface',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          p: [4, 5],
          width: ['90%', '450px'],
          maxWidth: '450px'
        }}
      >
        {/* Logo */}
        <div sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <div sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <h2 sx={{
              fontSize: 5,
              fontWeight: 'bold',
              color: 'primary',
              m: 0
            }}>
              G
            </h2>
            <img
              src="/bullseye.svg"
              alt="O"
              sx={{ width: '40px', height: '40px' }}
            />
          </div>
        </div>

        {/* Heading */}
        <h1 sx={{
          fontSize: 4,
          fontWeight: '600',
          textAlign: 'center',
          color: 'text',
          mb: 2
        }}>
          Almost there!
        </h1>

        <p sx={{
          textAlign: 'center',
          color: 'muted',
          fontSize: 1,
          mb: 4
        }}>
          Set up your account
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Profile Photo Upload */}
          <div sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <label sx={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '2px dashed',
              borderColor: 'border',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
              transition: 'border-color 0.2s',
              ':hover': {
                borderColor: 'primary'
              }
            }}>
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div sx={{ textAlign: 'center', color: 'textLight' }}>
                  <Camera size={32} />
                  <p sx={{ fontSize: 0, mt: 1 }}>Add Photo</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                sx={{ display: 'none' }}
              />
            </label>
          </div>

          <p sx={{
            textAlign: 'center',
            color: 'textLight',
            fontSize: 0,
            mb: 4
          }}>
            Profile photo (Optional)
          </p>

          {/* Error Message */}
          {error && (
            <div sx={{
              mb: 3,
              p: 3,
              background: 'dangerBg',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              color: '#991B1B',
              fontSize: 1,
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Email Display (Read-only) */}
          <div sx={{ mb: 3 }}>
            <label sx={{ fontSize: 1, fontWeight: '500', color: 'muted', mb: 1, display: 'block' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              readOnly
              sx={{
                width: '100%',
                px: 3,
                py: 3,
                fontSize: 2,
                border: '1px solid',
                borderColor: 'border',
                borderRadius: '8px',
                background: 'background',
                color: 'textLight',
                cursor: 'not-allowed'
              }}
            />
          </div>

          {/* Full Name Input */}
          <div sx={{ mb: 3, position: 'relative' }}>
            <User
              size={20}
              sx={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'textLight',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              sx={{
                width: '100%',
                pl: '42px',
                pr: 3,
                py: 3,
                fontSize: 2,
                border: '1px solid',
                borderColor: 'border',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
                ':focus': {
                  borderColor: 'primary'
                }
              }}
            />
          </div>

          {/* Password Input */}
          <div sx={{ mb: 3, position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              sx={{
                width: '100%',
                px: 3,
                py: 3,
                fontSize: 2,
                border: '1px solid',
                borderColor: 'border',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
                ':focus': {
                  borderColor: 'primary'
                }
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              sx={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'muted',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                ':hover': {
                  color: 'primary'
                }
              }}
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {/* Confirm Password Input */}
          <div sx={{ mb: 4, position: 'relative' }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              sx={{
                width: '100%',
                px: 3,
                py: 3,
                fontSize: 2,
                border: '1px solid',
                borderColor: 'border',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
                ':focus': {
                  borderColor: 'primary'
                }
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              sx={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'muted',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                ':hover': {
                  color: 'primary'
                }
              }}
            >
              {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            sx={{
              width: '100%',
              py: 3,
              fontSize: 2,
              fontWeight: '600',
              color: '#FFFFFF',
              background: isSubmitting ? 'textLight' : 'primary',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              ':hover': {
                background: isSubmitting ? 'textLight' : 'primaryHover'
              }
            }}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account →'}
          </motion.button>

          {/* Back Link */}
          <button
            type="button"
            onClick={() => navigate('/signup')}
            sx={{
              width: '100%',
              mt: 3,
              py: 2,
              fontSize: 1,
              fontWeight: '500',
              color: 'muted',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              ':hover': {
                color: 'primary'
              }
            }}
          >
            ← Back
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default SetupCredentialsPage
