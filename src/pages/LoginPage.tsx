/** @jsxImportSource theme-ui */
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Mail, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores'

const LoginPage = () => {
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      setIsSubmitting(true)

      await login({ email, password })

      // Navigate to dashboard after successful login
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login')
    } finally {
      setIsSubmitting(false)
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
          width: ['90%', '400px'],
          maxWidth: '400px'
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
          Welcome back!
        </h1>

        <p sx={{
          textAlign: 'center',
          color: 'muted',
          fontSize: 1,
          mb: 4
        }}>
          Don't have an account?{' '}
          <a href="/signup" sx={{ color: 'primary', textDecoration: 'none', fontWeight: '600' }}>
            Sign up
          </a>
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
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

          {/* Email Input */}
          <div sx={{ mb: 3, position: 'relative' }}>
            <Mail
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
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          <div sx={{ mb: 2, position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          {/* Forgot Password Link */}
          <div sx={{ textAlign: 'right', mb: 4 }}>
            <a href="/forgot-password" sx={{
              color: 'primary',
              textDecoration: 'none',
              fontSize: 1,
              fontWeight: '500',
              ':hover': { textDecoration: 'underline' }
            }}>
              Forgot Password?
            </a>
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
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}

export default LoginPage
