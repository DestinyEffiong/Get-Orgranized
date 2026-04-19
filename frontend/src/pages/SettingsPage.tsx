/** @jsxImportSource theme-ui */
import { useEffect } from 'react'
import { Settings, Bell, Volume2, Sun, Moon, Monitor } from 'lucide-react'
import { useAuthStore, useSettingsStore } from '../stores'
import { useSidebar } from '../contexts'
import Sidebar from '../components/Sidebar'

const SettingsPage = () => {
  const { currentUser } = useAuthStore()
  const { sidebarWidth } = useSidebar()
  const { settings, loadSettings, updateSettings } = useSettingsStore()

  useEffect(() => {
    if (currentUser) {
      loadSettings(currentUser.id)
    }
  }, [currentUser, loadSettings])

  if (!currentUser || !settings) return null

  const handleToggle = (key: 'notifications' | 'soundEffects' | 'gamificationEnabled') => {
    updateSettings(currentUser.id, { [key]: !settings[key] })
  }

  const handleTheme = (theme: 'light' | 'dark' | 'auto') => {
    updateSettings(currentUser.id, { theme })
  }

  const handleWeekStart = (day: 0 | 1) => {
    updateSettings(currentUser.id, { weekStartsOn: day })
  }

  return (
    <div sx={{ display: 'flex', minHeight: '100vh', background: 'background' }}>
      <Sidebar />
      <div sx={{
        flex: 1,
        marginLeft: `${sidebarWidth}px`,
        transition: 'margin-left 0.2s',
        p: 4,
        maxWidth: '700px'
      }}>
        {/* Header */}
        <div sx={{ mb: 4 }}>
          <div sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Settings size={24} color="#1FA4FF" />
            <h1 sx={{ fontSize: 4, fontWeight: 'bold', color: 'text', m: 0 }}>Settings</h1>
          </div>
          <p sx={{ fontSize: 1, color: 'muted', m: 0 }}>
            Manage your preferences
          </p>
        </div>

        {/* Notifications Section */}
        <div sx={{
          background: 'surface',
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'border',
          mb: 3,
          overflow: 'hidden'
        }}>
          <div sx={{
            px: 4, py: 3,
            borderBottom: '1px solid', borderBottomColor: 'surfaceAlt',
            fontSize: 2, fontWeight: '600', color: 'text',
            display: 'flex', alignItems: 'center', gap: 2
          }}>
            <Bell size={18} color="#1FA4FF" />
            Notifications
          </div>

          <div sx={{
            px: 4, py: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div sx={{ fontSize: 1, fontWeight: '600', color: 'text', mb: '2px' }}>
                Enable Notifications
              </div>
              <div sx={{ fontSize: 0, color: 'muted' }}>
                Receive browser notifications for task reminders
              </div>
            </div>
            <button
              onClick={() => handleToggle('notifications')}
              sx={{
                width: '44px', height: '24px', borderRadius: '12px',
                border: 'none', cursor: 'pointer', position: 'relative',
                transition: 'background 0.2s', flexShrink: 0,
                background: settings.notifications ? 'primary' : 'borderMedium',
              }}
            >
              <div sx={{
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#FFFFFF', position: 'absolute', top: '2px',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                left: settings.notifications ? '22px' : '2px',
              }} />
            </button>
          </div>
        </div>

        {/* Appearance Section */}
        <div sx={{
          background: 'surface',
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'border',
          mb: 3,
          overflow: 'hidden'
        }}>
          <div sx={{
            px: 4,
            py: 3,
            borderBottom: '1px solid',
            borderBottomColor: 'surfaceAlt',
            fontSize: 2,
            fontWeight: '600',
            color: 'text',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Sun size={18} color="#F59E0B" />
            Appearance
          </div>

          {/* Theme selector */}
          <div sx={{ px: 4, py: 3, borderBottom: '1px solid', borderBottomColor: 'surfaceAlt' }}>
            <div sx={{ fontSize: 1, fontWeight: '600', color: 'text', mb: '2px' }}>
              Theme
            </div>
            <div sx={{ fontSize: 0, color: 'muted', mb: 2 }}>
              Choose your preferred color scheme
            </div>
            <div sx={{ display: 'flex', gap: 2 }}>
              {([
                { value: 'light' as const, label: 'Light', icon: Sun },
                { value: 'dark' as const, label: 'Dark', icon: Moon },
                { value: 'auto' as const, label: 'System', icon: Monitor },
              ]).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleTheme(value)}
                  sx={{
                    flex: 1,
                    px: 3,
                    py: 2,
                    border: '2px solid',
                    borderColor: settings.theme === value ? 'primary' : 'border',
                    borderRadius: '8px',
                    background: settings.theme === value ? 'primaryBg' : 'surface',
                    color: settings.theme === value ? 'primary' : 'muted',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    fontSize: 1,
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    ':hover': {
                      borderColor: settings.theme === value ? 'primary' : 'textLight'
                    }
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Week starts on */}
          <div sx={{ px: 4, py: 3 }}>
            <div sx={{ fontSize: 1, fontWeight: '600', color: 'text', mb: '2px' }}>
              Week Starts On
            </div>
            <div sx={{ fontSize: 0, color: 'muted', mb: 2 }}>
              Set the first day of the week for calendars
            </div>
            <div sx={{ display: 'flex', gap: 2 }}>
              {([
                { value: 0 as const, label: 'Sunday' },
                { value: 1 as const, label: 'Monday' },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleWeekStart(value)}
                  sx={{
                    flex: 1,
                    px: 3,
                    py: 2,
                    border: '2px solid',
                    borderColor: settings.weekStartsOn === value ? 'primary' : 'border',
                    borderRadius: '8px',
                    background: settings.weekStartsOn === value ? 'primaryBg' : 'surface',
                    color: settings.weekStartsOn === value ? 'primary' : 'muted',
                    cursor: 'pointer',
                    fontSize: 1,
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    ':hover': {
                      borderColor: settings.weekStartsOn === value ? 'primary' : 'textLight'
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gamification Section */}
        <div sx={{
          background: 'surface',
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'border',
          overflow: 'hidden'
        }}>
          <div sx={{
            px: 4,
            py: 3,
            borderBottom: '1px solid',
            borderBottomColor: 'surfaceAlt',
            fontSize: 2,
            fontWeight: '600',
            color: 'text',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Volume2 size={18} color="#8B5CF6" />
            Gamification
          </div>

          <div sx={{
            px: 4,
            py: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div sx={{ fontSize: 1, fontWeight: '600', color: 'text', mb: '2px' }}>
                Enable Gamification
              </div>
              <div sx={{ fontSize: 0, color: 'muted' }}>
                Show XP, levels, achievements, and streaks
              </div>
            </div>
            <button
              onClick={() => handleToggle('gamificationEnabled')}
              sx={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                border: 'none',
                background: settings.gamificationEnabled ? 'primary' : 'borderMedium',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0
              }}
            >
              <div sx={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'surface',
                position: 'absolute',
                top: '2px',
                left: settings.gamificationEnabled ? '22px' : '2px',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
