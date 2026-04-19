/** @jsxImportSource theme-ui */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useSettingsStore } from '../stores'
import { useReminderPoller } from '../hooks/useReminderPoller'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, currentUser } = useAuthStore()
  const { loadSettings } = useSettingsStore()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  // Load settings when user is authenticated
  useEffect(() => {
    if (currentUser) {
      loadSettings(currentUser.id)
    }
  }, [currentUser, loadSettings])

  useReminderPoller()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'background'
      }}>
        <div sx={{ textAlign: 'center' }}>
          <div sx={{
            width: '48px',
            height: '48px',
            border: '4px solid',
            borderColor: 'border',
            borderTopColor: 'primary',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            mx: 'auto',
            mb: 3,
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }} />
          <h2 sx={{ fontSize: 3, color: 'primary', mb: 2, fontWeight: '600' }}>
            Loading...
          </h2>
          <p sx={{ color: 'muted', fontSize: 1 }}>
            Setting up your workspace
          </p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  // User is authenticated, render the protected content
  return <>{children}</>
}

export default ProtectedRoute
