/** @jsxImportSource theme-ui */
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const SignupPage = () => {
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Store email temporarily (for now, just navigate)
    // Later: Send verification code here
    navigate('/setup-credentials', { state: { email } })
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
          Get Started for FREE!
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit}>
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

          {/* Submit Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            sx={{
              width: '100%',
              py: 3,
              fontSize: 2,
              fontWeight: '600',
              color: '#FFFFFF',
              background: 'primary',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              ':hover': {
                background: 'primaryHover'
              }
            }}
          >
            Sign up
          </motion.button>

          <p sx={{
          textAlign: 'center',
          color: 'muted',
          fontSize: 1,
          mb: 4
         }}>
          Have an account?{' '}
          <a href="/login" sx={{ color: 'primary', textDecoration: 'none', fontWeight: '600' }}>
            Sign in
          </a>
        </p>


          {/* Terms */}
          <p sx={{
            textAlign: 'center',
            color: 'textLight',
            fontSize: 0,
            mt: 3,
            lineHeight: 1.5
          }}>
            By continuing, you agree to our{' '}
            <a href="/terms" sx={{ color: 'muted', textDecoration: 'underline' }}>
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="/privacy" sx={{ color: 'muted', textDecoration: 'underline' }}>
              Privacy Policy
            </a>
            .
          </p>
        </form>
      </motion.div>
    </div>
  )
}

export default SignupPage
