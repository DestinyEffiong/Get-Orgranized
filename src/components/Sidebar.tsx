/** @jsxImportSource theme-ui */
import { useState, useRef, useEffect } from 'react'
import { useColorMode } from 'theme-ui'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  Inbox,
  Calendar,
  CheckSquare,
  Target,
  Tag,
  BarChart2,
  Award,
  Flame,
  Zap,
  Plus,
  Trash2,
  Activity,
  Settings,
  Bell,
  BellOff,
  Moon,
  Sun,
  ChevronDown,
  MoreHorizontal,
  User,
  Palette,
  Upload,
  X
} from 'lucide-react'
import { useAuthStore, useSettingsStore } from '../stores'
import { useSidebar } from '../contexts'
import { getAvatarColor, getInitials, AVATAR_COLORS } from '../utils'
import QuickAddModal from './QuickAddModal'

interface NavItem {
  icon: any
  label: string
  path: string
  badge?: number
}

const MIN_WIDTH = 60
const MAX_WIDTH = 400
const COLLAPSED_WIDTH = 90 // Width when showing icons only
const ICON_ONLY_WIDTH = 240 // Threshold to trigger collapse (before text wraps)

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, updateProfile } = useAuthStore()
  const { sidebarWidth, setSidebarWidth } = useSidebar()
  const { settings, updateSettings } = useSettingsStore()
  const notificationsEnabled = settings?.notifications ?? true
  const [colorMode, setColorMode] = useColorMode()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [avatarDropdownPosition, setAvatarDropdownPosition] = useState({ top: 0, left: 0 })
  const [profileDropdownPosition, setProfileDropdownPosition] = useState({ top: 0, left: 0 })
  const sidebarRef = useRef<HTMLDivElement>(null)
  const moreButtonRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const profileButtonRef = useRef<HTMLDivElement>(null)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const avatarButtonRef = useRef<HTMLDivElement>(null)
  const avatarDropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!currentUser) return null

  const isCollapsed = sidebarWidth <= ICON_ONLY_WIDTH

  // Auto-collapse sidebar to fixed width when in icon-only mode
  useEffect(() => {
    if (!isResizing && isCollapsed && sidebarWidth > COLLAPSED_WIDTH && sidebarWidth <= ICON_ONLY_WIDTH) {
      setSidebarWidth(COLLAPSED_WIDTH)
    }
  }, [isCollapsed, isResizing, sidebarWidth, setSidebarWidth])

  // Handle mouse down on resize handle
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  // Handle mouse move while resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const newWidth = e.clientX
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuOpen) {
        const target = e.target as Node
        const isOutsideButton = moreButtonRef.current && !moreButtonRef.current.contains(target)
        const isOutsideMenu = moreMenuRef.current && !moreMenuRef.current.contains(target)

        if (isOutsideButton && isOutsideMenu) {
          setMoreMenuOpen(false)
        }
      }
    }

    if (moreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [moreMenuOpen])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownOpen) {
        const target = e.target as Node
        const isOutsideButton = profileButtonRef.current && !profileButtonRef.current.contains(target)
        const isOutsideMenu = profileDropdownRef.current && !profileDropdownRef.current.contains(target)

        if (isOutsideButton && isOutsideMenu) {
          setProfileDropdownOpen(false)
        }
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileDropdownOpen])

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarDropdownOpen) {
        const target = e.target as Node
        const isOutsideButton = avatarButtonRef.current && !avatarButtonRef.current.contains(target)
        const isOutsideMenu = avatarDropdownRef.current && !avatarDropdownRef.current.contains(target)

        if (isOutsideButton && isOutsideMenu) {
          setAvatarDropdownOpen(false)
        }
      }
    }

    if (avatarDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [avatarDropdownOpen])

  // Get avatar color (user's custom color or generated from name)
  const avatarColor = currentUser.avatarColor
    ? AVATAR_COLORS.find(c => c.bg === currentUser.avatarColor) || getAvatarColor(currentUser.fullName)
    : getAvatarColor(currentUser.fullName)

  // Handle avatar dropdown toggle
  const handleAvatarClick = () => {
    if (avatarButtonRef.current) {
      const rect = avatarButtonRef.current.getBoundingClientRect()
      setAvatarDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      })
    }
    setAvatarDropdownOpen(!avatarDropdownOpen)
  }

  // Handle profile dropdown toggle
  const handleProfileClick = () => {
    if (profileButtonRef.current) {
      const rect = profileButtonRef.current.getBoundingClientRect()
      setProfileDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left
      })
    }
    setProfileDropdownOpen(!profileDropdownOpen)
  }

  // Handle avatar color change
  const handleColorChange = (color: { bg: string; text: string }) => {
    // Close the menus immediately for smooth UX
    setColorPickerOpen(false)
    setAvatarDropdownOpen(false)

    // Update in background without blocking UI
    updateProfile({ avatarColor: color.bg }).catch(error => {
      console.error('Failed to update avatar color:', error)
    })
  }

  // Handle avatar upload
  const handleAvatarUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Convert file to base64 data URL
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string

        // Close dropdown immediately
        setAvatarDropdownOpen(false)

        // Update in background
        updateProfile({ profilePhoto: base64String }).catch(error => {
          console.error('Failed to upload avatar:', error)
        })
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle avatar removal
  const handleRemoveAvatar = () => {
    // Close dropdown immediately
    setAvatarDropdownOpen(false)

    // Update in background
    updateProfile({ profilePhoto: undefined }).catch(error => {
      console.error('Failed to remove avatar:', error)
    })
  }

  // Main navigation items
  const mainNavItems: NavItem[] = [
    { icon: Home, label: 'Today', path: '/dashboard' },
    { icon: Inbox, label: 'Inbox', path: '/inbox' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: Target, label: 'Goals', path: '/goals' },
    { icon: BarChart2, label: 'Stats', path: '/stats' },
    { icon: Tag, label: 'Tags', path: '/tags' },
  ]

  // Gamification items
  const gamificationItems: NavItem[] = [
    { icon: Award, label: 'Achievements', path: '/achievements' },
    { icon: Flame, label: 'Streaks', path: '/streaks' },
    { icon: Zap, label: 'Challenges', path: '/challenges' },
  ]

  // Bottom navigation items
  const bottomNavItems: NavItem[] = [
    { icon: Trash2, label: 'Trash', path: '/trash' },
    { icon: Activity, label: 'Activity', path: '/activity' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div
      ref={sidebarRef}
      sx={{
        width: `${sidebarWidth}px`,
        height: '100vh',
        background: 'surface',
        borderRight: '1px solid',
        borderRightColor: 'border',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: isResizing ? 'none' : 'width 0.2s',
        userSelect: isResizing ? 'none' : 'auto'
      }}
    >
      {/* Logo Section */}
      <div sx={{
        px: isCollapsed ? 2 : 3,
        py: 2,
        borderBottom: '1px solid',
        borderBottomColor: 'border',
        display: 'flex',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        alignItems: 'center',
        flexDirection: isCollapsed ? 'column' : 'row',
        gap: isCollapsed ? 2 : 0
      }}>
        {!isCollapsed && (
          <div sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <span sx={{
              fontSize: 4,
              fontWeight: 'bold',
              color: 'primary',
              letterSpacing: '-0.02em'
            }}>
              G
            </span>
            <img
              src="/bullseye.svg"
              alt="O"
              sx={{
                width: '24px',
                height: '24px'
              }}
            />
          </div>
        )}
        {isCollapsed && (
          <img
            src="/bullseye.svg"
            alt="GO"
            sx={{
              width: '24px',
              height: '24px'
            }}
          />
        )}
        <div sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <button
            onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
            sx={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.2s',
              ':hover': {
                background: 'surfaceAlt'
              }
            }}
          >
            {colorMode === 'dark' ? (
              <Sun size={18} color="#6B7280" />
            ) : (
              <Moon size={18} color="#6B7280" />
            )}
          </button>
          <button
            onClick={() => currentUser && updateSettings(currentUser.id, { notifications: !notificationsEnabled })}
            sx={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.2s',
              ':hover': { background: 'surfaceAlt' }
            }}
          >
            {notificationsEnabled
              ? <Bell size={20} color="#1FA4FF" />
              : <BellOff size={20} color="#6B7280" />
            }
          </button>
        </div>
      </div>

      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        sx={{ display: 'none' }}
      />

      {/* Profile Card */}
      {!isCollapsed ? (
        <div sx={{
          p: 4,
          borderBottom: '1px solid',
          borderBottomColor: 'border'
        }}>
          {/* Profile Info */}
          <div sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            mb: 3
          }}>
            {/* Avatar - either uploaded photo or colored circle with initials */}
            <div ref={avatarButtonRef}>
              {currentUser.profilePhoto ? (
                <img
                  src={currentUser.profilePhoto}
                  alt={currentUser.fullName}
                  onClick={handleAvatarClick}
                  sx={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid',
                    borderColor: 'primary',
                    cursor: 'pointer',
                    ':hover': {
                      opacity: 0.8
                    }
                  }}
                />
              ) : (
                <div
                  onClick={handleAvatarClick}
                  sx={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: avatarColor.bg,
                    color: avatarColor.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 3,
                    fontWeight: 'bold',
                    border: '2px solid',
                    borderColor: 'border',
                    cursor: 'pointer',
                    ':hover': {
                      opacity: 0.8
                    }
                  }}>
                  {getInitials(currentUser.fullName)}
                </div>
              )}
            </div>

            <div sx={{ flex: 1, minWidth: 0 }}>
              {/* Name with Dropdown */}
              <div ref={profileButtonRef} sx={{ position: 'relative' }}>
                <button
                  onClick={handleProfileClick}
                  sx={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 1,
                    ':hover': {
                      opacity: 0.8
                    }
                  }}
                >
                  <div sx={{
                    fontSize: 2,
                    fontWeight: 'bold',
                    color: 'text',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {currentUser.fullName}
                  </div>
                  <ChevronDown
                    size={18}
                    color="#6B7280"
                    sx={{
                      transition: 'transform 0.2s',
                      transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0
                    }}
                  />
                </button>

                {/* Profile Dropdown - Simple menu for profile settings */}
                {profileDropdownOpen && createPortal(
                  <div
                    ref={profileDropdownRef}
                    sx={{
                      position: 'fixed',
                      left: `${profileDropdownPosition.left}px`,
                      top: `${profileDropdownPosition.top}px`,
                      minWidth: '200px',
                      background: 'surface',
                      border: '1px solid',
                      borderColor: 'border',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      zIndex: 9999,
                      py: 1
                    }}>
                    <button
                      onClick={() => {
                        navigate('/settings')
                        setProfileDropdownOpen(false)
                      }}
                      sx={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        px: 3,
                        py: 2,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 1,
                        color: 'text',
                        textAlign: 'left',
                        transition: 'background 0.2s',
                        ':hover': {
                          background: 'background'
                        }
                      }}
                    >
                      <User size={16} />
                      <span>Profile Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/activity')
                        setProfileDropdownOpen(false)
                      }}
                      sx={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        px: 3,
                        py: 2,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 1,
                        color: 'text',
                        textAlign: 'left',
                        transition: 'background 0.2s',
                        ':hover': {
                          background: 'background'
                        }
                      }}
                    >
                      <Activity size={16} />
                      <span>View Activity</span>
                    </button>
                  </div>,
                  document.body
                )}
              </div>

              {/* Level */}
              <div sx={{
                fontSize: 0,
                color: 'muted',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Zap size={12} fill="#FBBF24" color="#FBBF24" />
                <span>Level 1</span>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div>
            <div sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1
            }}>
              <div sx={{ fontSize: 0, color: 'muted' }}>XP</div>
              <div sx={{ fontSize: 0, color: 'muted', fontWeight: '600' }}>0 / 100</div>
            </div>
            <div sx={{
              width: '100%',
              height: '6px',
              background: 'border',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <div sx={{
                width: '0%',
                height: '100%',
                background: 'linear-gradient(90deg, #1FA4FF 0%, #1E90FF 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      ) : (
        <div sx={{
          p: 2,
          borderBottom: '1px solid',
          borderBottomColor: 'border',
          display: 'flex',
          justifyContent: 'center'
        }}>
          {currentUser.profilePhoto ? (
            <img
              src={currentUser.profilePhoto}
              alt={currentUser.fullName}
              sx={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid',
                borderColor: 'primary',
                cursor: 'pointer'
              }}
              onClick={handleAvatarClick}
            />
          ) : (
            <div
              onClick={handleAvatarClick}
              sx={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: avatarColor.bg,
                color: avatarColor.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 2,
                fontWeight: 'bold',
                border: '2px solid',
                borderColor: 'border',
                cursor: 'pointer'
              }}
            >
              {getInitials(currentUser.fullName)}
            </div>
          )}
        </div>
      )}

      {/* Quick Add Button */}
      <div sx={{ p: isCollapsed ? 2 : 3 }}>
        <button
          onClick={() => setQuickAddOpen(true)}
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: isCollapsed ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isCollapsed ? 0 : 2,
            px: isCollapsed ? 1 : 4,
            py: 2,
            background: 'primary',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: 1,
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s',
            ':hover': {
              background: 'primaryHover'
            }
          }}
        >
          <Plus size={18} />
          {isCollapsed ? (
            <div sx={{
              fontSize: '9px',
              mt: '4px',
              textAlign: 'center',
              lineHeight: 1,
              color: '#FFFFFF'
            }}>
              Add
            </div>
          ) : (
            'Quick Add'
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <div sx={{ flex: 1, overflowY: isCollapsed ? 'visible' : 'auto' }}>
        <nav sx={{ px: 2 }}>
          {isCollapsed ? (
            <>
              {/* Show first 4 items in icon-only mode */}
              {mainNavItems.slice(0, 4).map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 1,
                    py: 2,
                    mb: 1,
                    background: isActive(item.path) ? 'primaryBg' : 'transparent',
                    color: isActive(item.path) ? 'primary' : 'muted',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    ':hover': {
                      background: isActive(item.path) ? 'primaryBg' : 'background',
                      color: isActive(item.path) ? 'primary' : 'text'
                    }
                  }}
                >
                  <item.icon size={18} />
                  <div sx={{
                    fontSize: '9px',
                    mt: '4px',
                    textAlign: 'center',
                    lineHeight: 1
                  }}>
                    {item.label}
                  </div>
                  {item.badge && (
                    <span sx={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '8px',
                      height: '8px',
                      background: 'primary',
                      borderRadius: '50%'
                    }} />
                  )}
                </button>
              ))}
              {/* More menu for remaining items */}
              <div ref={moreButtonRef} sx={{ position: 'relative' }}>
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  title="More"
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 1,
                    py: 2,
                    mb: 1,
                    background: moreMenuOpen ? 'background' : 'transparent',
                    color: 'muted',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    ':hover': {
                      background: 'background',
                      color: 'text'
                    }
                  }}
                >
                  <MoreHorizontal size={18} />
                  <div sx={{
                    fontSize: '9px',
                    mt: '4px',
                    textAlign: 'center',
                    lineHeight: 1
                  }}>
                    More
                  </div>
                </button>
                {/* More menu popup - appears to the right with ALL remaining items */}
                {moreMenuOpen && createPortal(
                  <div
                    ref={moreMenuRef}
                    sx={{
                      position: 'fixed',
                      left: `${COLLAPSED_WIDTH + 16}px`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      maxHeight: '80vh',
                      overflowY: 'auto',
                      background: 'surface',
                      border: '1px solid',
                      borderColor: 'border',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      zIndex: 9999,
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1
                    }}>
                    {/* Remaining main nav items */}
                    {mainNavItems.slice(4).map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path)
                          setMoreMenuOpen(false)
                        }}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          px: 2,
                          py: 2,
                          minWidth: '60px',
                          background: isActive(item.path) ? 'primaryBg' : 'transparent',
                          color: isActive(item.path) ? 'primary' : 'muted',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          position: 'relative',
                          ':hover': {
                            background: isActive(item.path) ? 'primaryBg' : 'background',
                            color: isActive(item.path) ? 'primary' : 'text'
                          }
                        }}
                      >
                        <item.icon size={18} />
                        <div sx={{
                          fontSize: '9px',
                          mt: '4px',
                          textAlign: 'center',
                          lineHeight: 1,
                          whiteSpace: 'nowrap'
                        }}>
                          {item.label}
                        </div>
                        {item.badge && (
                          <span sx={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '8px',
                            height: '8px',
                            background: 'primary',
                            borderRadius: '50%'
                          }} />
                        )}
                      </button>
                    ))}

                    {/* Gamification items */}
                    {gamificationItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path)
                          setMoreMenuOpen(false)
                        }}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          px: 2,
                          py: 2,
                          minWidth: '60px',
                          background: isActive(item.path) ? 'warningBg' : 'transparent',
                          color: isActive(item.path) ? 'warning' : 'muted',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          ':hover': {
                            background: isActive(item.path) ? 'warningBg' : 'background',
                            color: isActive(item.path) ? 'warning' : 'text'
                          }
                        }}
                      >
                        <item.icon size={18} />
                        <div sx={{
                          fontSize: '9px',
                          mt: '4px',
                          textAlign: 'center',
                          lineHeight: 1,
                          whiteSpace: 'nowrap'
                        }}>
                          {item.label}
                        </div>
                      </button>
                    ))}

                    {/* Bottom nav items */}
                    {bottomNavItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path)
                          setMoreMenuOpen(false)
                        }}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          px: 2,
                          py: 2,
                          minWidth: '60px',
                          background: isActive(item.path) ? 'primaryBg' : 'transparent',
                          color: isActive(item.path) ? 'primary' : 'muted',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          ':hover': {
                            background: isActive(item.path) ? 'primaryBg' : 'background',
                            color: isActive(item.path) ? 'primary' : 'text'
                          }
                        }}
                      >
                        <item.icon size={18} />
                        <div sx={{
                          fontSize: '9px',
                          mt: '4px',
                          textAlign: 'center',
                          lineHeight: 1,
                          whiteSpace: 'nowrap'
                        }}>
                          {item.label}
                        </div>
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </div>
            </>
          ) : (
            mainNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  px: 3,
                  py: 2,
                  mb: 1,
                  background: isActive(item.path) ? 'primaryBg' : 'transparent',
                  color: isActive(item.path) ? 'primary' : 'muted',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: 1,
                  fontWeight: isActive(item.path) ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  ':hover': {
                    background: isActive(item.path) ? 'primaryBg' : 'background',
                    color: isActive(item.path) ? 'primary' : 'text'
                  }
                }}
              >
                <item.icon size={18} />
                <span sx={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span sx={{
                    px: 2,
                    py: 0,
                    background: 'primary',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontSize: 0,
                    fontWeight: '600'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))
          )}
        </nav>

        {/* Gamification Section - Only show when not collapsed */}
        {!isCollapsed && (
          <div sx={{
            mt: 4,
            px: 2
          }}>
            <div sx={{
              px: 3,
              py: 2,
              fontSize: 0,
              fontWeight: '600',
              color: 'muted',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Gamification
            </div>
            <nav>
              {gamificationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 3,
                    px: 3,
                    py: 2,
                    mb: 1,
                    background: isActive(item.path) ? 'warningBg' : 'transparent',
                    color: isActive(item.path) ? 'warning' : 'muted',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: 1,
                    fontWeight: isActive(item.path) ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    ':hover': {
                      background: isActive(item.path) ? 'warningBg' : 'background',
                      color: isActive(item.path) ? 'warning' : 'text'
                    }
                  }}
                >
                  <item.icon size={18} />
                  <span sx={{ flex: 1 }}>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Bottom Navigation - Only show when not collapsed */}
      {!isCollapsed && (
        <div sx={{
          borderTop: '1px solid',
          borderTopColor: 'border',
          p: 2
        }}>
          <nav>
            {bottomNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={item.label}
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 3,
                  px: 3,
                  py: 2,
                  mb: 1,
                  background: isActive(item.path) ? 'primaryBg' : 'transparent',
                  color: isActive(item.path) ? 'primary' : 'muted',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: 1,
                  fontWeight: isActive(item.path) ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  ':hover': {
                    background: isActive(item.path) ? 'primaryBg' : 'background',
                    color: isActive(item.path) ? 'primary' : 'text'
                  }
                }}
              >
                <item.icon size={18} />
                <span sx={{ flex: 1 }}>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Avatar Dropdown Portal - Separate dropdown for avatar management */}
      {avatarDropdownOpen && createPortal(
        <div
          ref={avatarDropdownRef}
          sx={{
            position: 'fixed',
            left: `${avatarDropdownPosition.left}px`,
            top: `${avatarDropdownPosition.top}px`,
            minWidth: '220px',
            background: 'surface',
            border: '1px solid',
            borderColor: 'border',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            py: 1
          }}>
          {/* Avatar Management Section */}
          <div sx={{
            px: 3,
            py: 2
          }}>
            <div sx={{
              fontSize: 0,
              fontWeight: '600',
              color: 'muted',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 2
            }}>
              Avatar
            </div>

            {!currentUser.profilePhoto && (
              <button
                onClick={() => setColorPickerOpen(!colorPickerOpen)}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 2,
                  py: 2,
                  mb: 1,
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: 1,
                  color: 'text',
                  textAlign: 'left',
                  transition: 'background 0.2s',
                  ':hover': {
                    background: 'background'
                  }
                }}
              >
                <Palette size={16} />
                <span>Change Color</span>
              </button>
            )}

            {colorPickerOpen && !currentUser.profilePhoto && (
              <div sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 2,
                px: 2,
                py: 2,
                mb: 1
              }}>
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color.bg}
                    onClick={() => handleColorChange(color)}
                    sx={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: color.bg,
                      border: color.bg === avatarColor.bg ? '2px solid' : '2px solid transparent',
                      borderColor: color.bg === avatarColor.bg ? 'text' : 'transparent',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      ':hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                  />
                ))}
              </div>
            )}

            <button
              onClick={handleAvatarUpload}
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 2,
                py: 2,
                mb: currentUser.profilePhoto ? 1 : 0,
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 1,
                color: 'text',
                textAlign: 'left',
                transition: 'background 0.2s',
                ':hover': {
                  background: 'background'
                }
              }}
            >
              <Upload size={16} />
              <span>Upload Photo</span>
            </button>

            {currentUser.profilePhoto && (
              <button
                onClick={handleRemoveAvatar}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 2,
                  py: 2,
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: 1,
                  color: 'danger',
                  textAlign: 'left',
                  transition: 'background 0.2s',
                  ':hover': {
                    background: 'dangerBg'
                  }
                }}
              >
                <X size={16} />
                <span>Remove Photo</span>
              </button>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          cursor: 'ew-resize',
          background: 'transparent',
          transition: 'background 0.2s',
          ':hover': {
            background: 'border'
          },
          '::after': {
            content: '""',
            position: 'absolute',
            right: '-4px',
            top: 0,
            bottom: 0,
            width: '8px'
          }
        }}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />
    </div>
  )
}

export default Sidebar
