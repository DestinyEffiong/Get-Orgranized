/** @jsxImportSource theme-ui */
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'


const Navbar = () => {
      const [isScrolled, setIsScrolled] = useState(false)
      const navigate = useNavigate()

      useEffect(() => {
            const handleScroll = () => {
            setIsScrolled(window.scrollY > 0)
            }
            window.addEventListener('scroll', handleScroll)
            return () => window.removeEventListener('scroll', handleScroll)
        }, [])

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: isScrolled ? 'rgba(255, 255, 255, 0.95)' : `
        linear-gradient(
        180deg,
        rgba(79, 195, 255, 0.82) 0%,
        #1FA4FF 8%,
        )`,  // Translucent blue
        boxShadow: isScrolled ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
        backdropFilter: 'blur(10px)',            // Frosted glass effect
        py: 3,
        px: [3, 4, 5]
      }}
    >
      <div sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        mx: 'auto'
      }}>
        {/* Logo/Brand */}
        <div sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <h2 sx={{ 
            fontSize: [4, 5], 
            fontWeight: 'bold', 
            color: isScrolled ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            m: 0
        }}>
            G
        </h2>
        <img 
            src="/bullseye.svg" 
            alt="O" 
            sx={{ width: '32px', height: '32px' }}
        />
        </div>
        {/* Navigation Links */}
        <div sx={{ 
          display: ['none', 'flex'],  // Hidden on mobile, visible on tablet+
          alignItems: 'center',
          gap: 5
        }}>
          <a href="#about" sx={{
            color: isScrolled ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            textDecoration: 'none',
            fontSize: 2,
            fontWeight: '500',
            ':hover': { opacity: 0.8 }
          }}>
            About
          </a>
          <a href="#features" sx={{
            color: isScrolled ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            textDecoration: 'none',
            fontSize: 2,
            fontWeight: '500',
            ':hover': { opacity: 0.8 }
          }}>
            Features
          </a>
        </div>

        {/* CTA Buttons */}
        <div sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <button
            onClick={() => navigate('/demo')}
            sx={{
              background: 'transparent',
              color: isScrolled ? 'black' : 'white',
              px: 4,
              py: 2,
              borderRadius: '12px',
              border: 'none',
              fontSize: [1, 2],
              fontWeight: '600',
              cursor: 'pointer',
              display: ['none', 'block'],  // Hidden on mobile
              ':hover': {
                background: 'rgba(255, 255, 255, 0.1)'
              }
            }}>
            Request a Demo
          </button>
          <button
            onClick={() => navigate('/login')}
            sx={{
              background: 'transparent',
              color: isScrolled ? 'black' : 'white',
              px: 2,
              py: 2,
              borderRadius: '12px',
              border: 'none',
              fontSize: [1, 2],
              fontWeight: '600',
              cursor: 'pointer',
              display: ['none', 'block'],  // Hidden on mobile
              ':hover': {
                background: 'rgba(255, 255, 255, 0.1)'
              }
            }}>
            Login
          </button>

          <button
            onClick={() => navigate('/signup')}
            sx={{
              background: 'warning',
              border: 'none',
              color: '#78350F',
              px: [3, 4],
              py: 2,
              borderRadius: '12px',
              fontSize: [1, 2],
              fontWeight: '600',
              cursor: 'pointer',
              ':hover': {
                background: 'warning'
              }
            }}>
            Start Organizing →
          </button>
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar