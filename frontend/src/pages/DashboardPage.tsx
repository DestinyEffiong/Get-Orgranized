/** @jsxImportSource theme-ui */
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Maximize2, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, Target, Calendar, Zap, TrendingUp, Search, CheckCircle2, Circle, Pencil, X, Flag, Tag, ChevronDown, ChevronUp, ListTodo } from 'lucide-react'
import { useAuthStore, useTaskStore, useGoalStore } from '../stores'
import EditTaskModal from '../components/EditTaskModal'
import type { Task, Goal } from '../types'
import { categoryColors } from '../types/goal'
import { getRandomQuote } from '../data/quotes'
import { useSidebar } from '../contexts'
import Sidebar from '../components/Sidebar'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuthStore()
  const { sidebarWidth } = useSidebar()
  const { tasks: storeTasks, loadTasks, getTasks, completeTask, incompleteTask } = useTaskStore()
  const { goals, loadGoals } = useGoalStore()
  const [currentQuote, setCurrentQuote] = useState(getRandomQuote())
  const [todaysFocus, setTodaysFocus] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [filterDateMode, setFilterDateMode] = useState<'before' | 'after'>('before')
  const [filterDate, setFilterDate] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [weather, setWeather] = useState<{ temp: number; description: string; code: number } | null>(null)

  // Fetch real-time weather
  useEffect(() => {
    const getWeatherDescription = (code: number) => {
      if (code === 0) return 'Clear Sky'
      if (code <= 3) return 'Partly Cloudy'
      if (code <= 48) return 'Foggy'
      if (code <= 57) return 'Drizzle'
      if (code <= 67) return 'Rainy'
      if (code <= 77) return 'Snowy'
      if (code <= 82) return 'Rain Showers'
      if (code <= 86) return 'Snow Showers'
      if (code >= 95) return 'Thunderstorm'
      return 'Cloudy'
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          )
          const data = await res.json()
          const cw = data.current_weather
          setWeather({
            temp: Math.round(cw.temperature),
            description: getWeatherDescription(cw.weathercode),
            code: cw.weathercode
          })
        } catch {
          // Silently fail - widget stays hidden
        }
      },
      () => {
        // Geolocation denied - try IP-based fallback
        fetch('https://api.open-meteo.com/v1/forecast?latitude=6.5&longitude=3.4&current_weather=true')
          .then(res => res.json())
          .then(data => {
            const cw = data.current_weather
            setWeather({
              temp: Math.round(cw.temperature),
              description: cw.weathercode <= 3 ? 'Partly Cloudy' : 'Cloudy',
              code: cw.weathercode
            })
          })
          .catch(() => {})
      }
    )
  }, [])

  // Load tasks and goals on mount
  useEffect(() => {
    if (currentUser) {
      loadTasks(currentUser.id)
      loadGoals(currentUser.id)
    }
  }, [currentUser, loadTasks, loadGoals])

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false)
        setActiveFilter(null)
        setSearchQuery('')
        setFilterDate('')
        setSelectedCategory(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Rotate quote every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote(getRandomQuote())
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  // ProtectedRoute ensures user is authenticated, but TypeScript doesn't know that
  if (!currentUser) {
    return null
  }

  // Get current date info
  const now = new Date()
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })
  const month = now.toLocaleDateString('en-US', { month: 'long' })
  const date = now.getDate()
  const year = now.getFullYear()

  // Get time-based greeting
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'

  // Filter helpers
  const availableSearchTags = useMemo(() => {
    const tagSet = new Set<string>()
    storeTasks.filter(t => !t.deletedAt).forEach(t => t.tags.forEach(tag => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [storeTasks])

  const searchLinkedGoals = useMemo(() => {
    const goalIds = new Set<string>()
    storeTasks.filter(t => !t.deletedAt && t.goalId).forEach(t => goalIds.add(t.goalId!))
    return goals.filter(g => goalIds.has(g.id) && !g.deletedAt)
  }, [storeTasks, goals])

  const priorityColors: Record<string, { bg: string; color: string; border: string }> = {
    low: { bg: 'indigoBg', color: 'indigo', border: 'indigo' },
    medium: { bg: 'warningBg', color: 'warningDark', border: 'warningDark' },
    high: { bg: 'dangerBg', color: 'dangerSolid', border: 'dangerSolid' }
  }

  const handleChipClick = (filter: string) => {
    if (activeFilter === filter) {
      setActiveFilter(null)
      setSearchQuery('')
      setFilterDate('')
      setSelectedCategory(null)
    } else {
      setActiveFilter(filter)
      setSearchQuery('')
      setFilterDate('')
      setSelectedCategory(null)
    }
  }

  const clearSearch = () => {
    setActiveFilter(null)
    setSearchQuery('')
    setFilterDate('')
    setSelectedCategory(null)
    setSearchFocused(false)
  }

  const getSearchPlaceholder = () => {
    switch (activeFilter) {
      case 'tasks': return 'Search tasks by name...'
      case 'goals': return 'Search goals by name...'
      case 'priority': return 'Type a priority: low, medium, high'
      case 'tags': return 'Type a tag name...'
      case 'category': return selectedCategory
        ? `Search ${selectedCategory} goals...`
        : 'Select a category below...'
      case 'goal': return 'Type a goal name...'
      default: return 'Search tasks, goals...'
    }
  }

  // Search filtering based on active filter mode
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    // Date filter mode
    if (activeFilter === 'date') {
      if (!filterDate) return { tasks: [] as Task[], goals: [] as Goal[] }
      let matchedTasks = storeTasks.filter(t => !t.deletedAt)
      const [y, m, d] = filterDate.split('-').map(Number)
      if (filterDateMode === 'before') {
        const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
        matchedTasks = matchedTasks.filter(t => t.dueDate && t.dueDate <= endOfDay)
      } else {
        const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0).getTime()
        matchedTasks = matchedTasks.filter(t => t.dueDate && t.dueDate >= startOfDay)
      }
      return { tasks: matchedTasks.slice(0, 3), goals: [] as Goal[] }
    }

    // Tasks filter mode - show only tasks
    if (activeFilter === 'tasks') {
      if (!q) {
        const allTasks = storeTasks.filter(t => !t.deletedAt)
        return { tasks: allTasks.slice(0, 3), goals: [] as Goal[] }
      }
      const matchedTasks = storeTasks.filter(t => !t.deletedAt && (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      ))
      return { tasks: matchedTasks.slice(0, 3), goals: [] as Goal[] }
    }

    // Goals filter mode - show only goals
    if (activeFilter === 'goals') {
      if (!q) {
        const allGoals = goals.filter(g => !g.deletedAt)
        return { tasks: [] as Task[], goals: allGoals.slice(0, 3) }
      }
      const matchedGoals = goals.filter(g => !g.deletedAt && (
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
      ))
      return { tasks: [] as Task[], goals: matchedGoals.slice(0, 3) }
    }

    // Category filter mode (before the !q early return so selectedCategory works without typing)
    if (activeFilter === 'category') {
      if (selectedCategory) {
        const matchedGoals = goals.filter(g => !g.deletedAt && g.category === selectedCategory && (
          !q || g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
        ))
        return { tasks: [] as Task[], goals: matchedGoals.slice(0, 3) }
      }
      if (!q) return { tasks: [] as Task[], goals: [] as Goal[] }
      const matchedGoals = goals.filter(g => !g.deletedAt && g.category.toLowerCase().includes(q))
      return { tasks: [] as Task[], goals: matchedGoals.slice(0, 3) }
    }

    if (!q) return { tasks: [] as Task[], goals: [] as Goal[] }

    // Priority filter mode
    if (activeFilter === 'priority') {
      const matchedTasks = storeTasks.filter(t => !t.deletedAt && t.priority.toLowerCase().includes(q))
      return { tasks: matchedTasks.slice(0, 3), goals: [] as Goal[] }
    }

    // Tags filter mode
    if (activeFilter === 'tags') {
      const matchedTasks = storeTasks.filter(t => !t.deletedAt && t.tags.some(tag => tag.toLowerCase().includes(q)))
      return { tasks: matchedTasks.slice(0, 3), goals: [] as Goal[] }
    }

    // Linked goal filter mode
    if (activeFilter === 'goal') {
      const matchingGoals = goals.filter(g => !g.deletedAt && g.title.toLowerCase().includes(q))
      const matchingGoalIds = new Set(matchingGoals.map(g => g.id))
      const matchedTasks = storeTasks.filter(t => !t.deletedAt && t.goalId && matchingGoalIds.has(t.goalId))
      return { tasks: matchedTasks.slice(0, 3), goals: [] as Goal[] }
    }

    // Default: normal text search
    const matchedTasks = storeTasks.filter(t =>
      !t.deletedAt && (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      )
    )
    const matchedGoals = goals.filter(g =>
      !g.deletedAt && (
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q)
      )
    )
    return { tasks: matchedTasks.slice(0, 3), goals: matchedGoals.slice(0, 3) }
  }, [searchQuery, storeTasks, goals, activeFilter, filterDate, filterDateMode, selectedCategory])

  const showSearchDropdown = searchFocused

  // Get today's tasks (non-habits only)
  const allRegularTasks = getTasks()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const todayStr = toLocalDateStr(today)

  const todaysTasks = allRegularTasks.filter(task => {
    if (!task.dueDate) return false
    const taskDate = toLocalDateStr(new Date(task.dueDate))
    return taskDate === todayStr
  })

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    try {
      if (currentStatus === 'done') {
        await incompleteTask(taskId)
      } else {
        await completeTask(taskId)
      }
    } catch (error) {
      console.error('Failed to toggle task:', error)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleExpandCard = (section: 'tasks' | 'goals' | 'stats') => {
    navigate(`/${section}`)
  }

  return (
    <div sx={{
      display: 'flex',
      minHeight: '100vh',
      background: 'background'
    }}>
      <Sidebar />

      <div sx={{
        flex: 1,
        ml: `${sidebarWidth}px`,
        p: 4,
        transition: 'margin-left 0.2s'
      }}>
        <div sx={{
          maxWidth: '1400px',
          mx: 'auto'
        }}>
        {/* Top Bar with Search and Logout */}
        <div sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 3
        }}>
          {/* Search Bar */}
          <div
            ref={searchRef}
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              maxWidth: '500px'
            }}
          >
            <Search
              size={16}
              sx={{
                position: 'absolute',
                left: '12px',
                color: 'muted',
                zIndex: 1
              }}
            />
            {activeFilter === 'date' ? (
              <div
                onClick={() => setSearchFocused(true)}
                sx={{
                  width: '100%',
                  pl: '36px',
                  pr: '36px',
                  py: '7px',
                  border: '1px solid',
                  borderColor: 'primary',
                  borderRadius: '8px',
                  fontSize: 0,
                  background: 'surface',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <span sx={{ fontWeight: '600', color: 'textSecondary', whiteSpace: 'nowrap' }}>Show tasks</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFilterDateMode(filterDateMode === 'before' ? 'after' : 'before') }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    px: '8px',
                    py: '2px',
                    border: '1px solid',
                    borderColor: 'primary',
                    borderRadius: '6px',
                    fontSize: 0,
                    fontWeight: '600',
                    background: 'primaryBg',
                    color: 'primary',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    ':hover': { background: 'primaryBgStrong' }
                  }}
                >
                  {filterDateMode}
                  <div sx={{ display: 'flex', flexDirection: 'column', ml: '2px' }}>
                    <ChevronUp size={9} />
                    <ChevronDown size={9} />
                  </div>
                </button>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'border',
                    borderRadius: '6px',
                    px: 1,
                    py: '2px',
                    fontSize: 0,
                    outline: 'none',
                    ':focus': { borderColor: 'primary' }
                  }}
                />
              </div>
            ) : (
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchFocused(false)
                    setActiveFilter(null)
                    ;(e.target as HTMLInputElement).blur()
                  }
                }}
                sx={{
                  width: '100%',
                  pl: '36px',
                  pr: (searchQuery || activeFilter) ? '36px' : 3,
                  py: 2,
                  border: '1px solid',
                  borderColor: activeFilter ? 'primary' : 'border',
                  borderRadius: '8px',
                  fontSize: 0,
                  background: 'surface',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  ':focus': {
                    borderColor: 'primary'
                  }
                }}
              />
            )}
            {(searchQuery || activeFilter) && (
              <button
                onClick={clearSearch}
                sx={{
                  position: 'absolute',
                  right: '10px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'textLight',
                  zIndex: 1,
                  ':hover': { color: 'muted' }
                }}
              >
                <X size={14} />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showSearchDropdown && (
              <div sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                mt: 1,
                background: 'surface',
                borderRadius: '10px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                border: '1px solid',
                borderColor: 'border',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '450px'
              }}>
                {/* Filter Chips - no arrows, click to activate */}
                <div sx={{
                  display: 'flex',
                  gap: 1,
                  px: 2,
                  py: 2,
                  flexWrap: 'wrap',
                  borderBottom: '1px solid',
                  borderColor: 'border',
                  alignItems: 'center',
                  flexShrink: 0
                }}>
                  {([
                    { key: 'tasks', label: 'Tasks', icon: <ListTodo size={11} />, activeColor: 'primary', activeBg: 'primaryBg', activeBorder: 'primary' },
                    { key: 'goals', label: 'Goals', icon: <Target size={11} />, activeColor: 'dangerSolid', activeBg: 'dangerBg', activeBorder: 'dangerSolid' },
                    { key: 'priority', label: 'Priority', icon: <Flag size={11} />, activeColor: 'indigo', activeBg: 'indigoBg', activeBorder: 'indigo' },
                    { key: 'date', label: 'Date', icon: <Calendar size={11} />, activeColor: 'warningDark', activeBg: 'warningBg', activeBorder: 'warning' },
                    { key: 'tags', label: 'Tags', icon: <Tag size={11} />, activeColor: 'purpleDark', activeBg: '#F3E8FF', activeBorder: 'purple' },
                    { key: 'category', label: 'Category', icon: <Target size={11} />, activeColor: 'successDark', activeBg: 'successBg', activeBorder: 'success' },
                    { key: 'goal', label: 'Linked Goal', icon: <Zap size={11} />, activeColor: '#92400E', activeBg: 'warningBg', activeBorder: 'warning' }
                  ] as const).map(chip => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => handleChipClick(chip.key)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        px: '8px',
                        py: '4px',
                        border: '1px solid',
                        borderColor: activeFilter === chip.key ? chip.activeBorder : 'border',
                        borderRadius: '20px',
                        fontSize: 0,
                        fontWeight: '600',
                        background: activeFilter === chip.key ? chip.activeBg : 'background',
                        color: activeFilter === chip.key ? chip.activeColor : 'muted',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        ':hover': { borderColor: chip.activeBorder }
                      }}
                    >
                      {chip.icon}
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Hint Pills - clickable, shown when a filter is active */}
                {activeFilter === 'priority' && (
                  <div sx={{ px: 2, py: '6px', borderBottom: '1px solid', borderColor: 'surfaceAlt', flexShrink: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(['low', 'medium', 'high'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSearchQuery(p)}
                        sx={{
                          px: '8px',
                          py: '3px',
                          borderRadius: '20px',
                          border: 'none',
                          background: priorityColors[p].bg,
                          color: priorityColors[p].color,
                          fontSize: 0,
                          fontWeight: '600',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          opacity: 0.7,
                          transition: 'opacity 0.2s',
                          ':hover': { opacity: 1 }
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                {activeFilter === 'tags' && availableSearchTags.length > 0 && (
                  <div sx={{ px: 2, py: '6px', borderBottom: '1px solid', borderColor: 'surfaceAlt', flexShrink: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {availableSearchTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSearchQuery(tag)}
                        sx={{
                          px: '8px',
                          py: '3px',
                          borderRadius: '20px',
                          border: 'none',
                          background: 'surfaceAlt',
                          color: 'muted',
                          fontSize: 0,
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          ':hover': { background: '#F3E8FF', color: 'purpleDark' }
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                {activeFilter === 'category' && (
                  <div sx={{ px: 2, py: '6px', borderBottom: '1px solid', borderColor: 'surfaceAlt', flexShrink: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(['work', 'personal', 'health', 'finance', 'learning', 'relationships', 'other'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setSelectedCategory(selectedCategory === cat ? null : cat); setSearchQuery('') }}
                        sx={{
                          px: '8px',
                          py: '3px',
                          borderRadius: '20px',
                          border: '1px solid',
                          borderColor: selectedCategory === cat ? 'success' : 'transparent',
                          background: selectedCategory === cat ? 'successBg' : 'surfaceAlt',
                          color: selectedCategory === cat ? 'successDark' : 'muted',
                          fontSize: 0,
                          fontWeight: '600',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          transition: 'all 0.2s',
                          ':hover': { background: 'successBg', color: 'successDark' }
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {activeFilter === 'goal' && searchLinkedGoals.length > 0 && (
                  <div sx={{ px: 2, py: '6px', borderBottom: '1px solid', borderColor: 'surfaceAlt', flexShrink: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {searchLinkedGoals.map(goal => (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setSearchQuery(goal.title)}
                        sx={{
                          px: '8px',
                          py: '3px',
                          borderRadius: '20px',
                          border: 'none',
                          background: 'surfaceAlt',
                          color: 'muted',
                          fontSize: 0,
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          ':hover': { background: 'warningBg', color: '#92400E' }
                        }}
                      >
                        {goal.title}
                      </button>
                    ))}
                  </div>
                )}

                {/* Results */}
                <div sx={{ flex: 1, overflowY: 'auto' }}>
                  {searchResults.tasks.length === 0 && searchResults.goals.length === 0 ? (
                    <div sx={{
                      px: 3,
                      py: 4,
                      textAlign: 'center',
                      color: 'textLight',
                      fontSize: 1
                    }}>
                      {activeFilter === 'date' && !filterDate
                        ? 'Pick a date to filter tasks'
                        : activeFilter === 'category' && !selectedCategory && !searchQuery.trim()
                          ? 'Select a category above to filter goals'
                          : activeFilter === 'category' && selectedCategory
                            ? `No ${selectedCategory} goals found`
                            : searchQuery.trim()
                              ? `No results for "${searchQuery}"`
                              : activeFilter
                                ? 'Start typing to filter...'
                                : 'Select a filter or start typing to search'}
                    </div>
                  ) : (
                    <>
                      {/* Task Results */}
                      {searchResults.tasks.length > 0 && (
                        <div>
                          <div sx={{
                            px: 3,
                            py: 2,
                            fontSize: 0,
                            fontWeight: '600',
                            color: 'muted',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid',
                            borderColor: 'surfaceAlt'
                          }}>
                            Tasks
                          </div>
                          {searchResults.tasks.map(task => (
                            <button
                              key={task.id}
                              onClick={() => {
                                setEditingTask(task)
                                setSearchFocused(false)
                              }}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                width: '100%',
                                px: 3,
                                py: 2,
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                                borderBottom: '1px solid',
                                borderColor: 'background',
                                transition: 'background 0.15s',
                                ':hover': { background: 'background' }
                              }}
                            >
                              {task.status === 'done' ? (
                                <CheckCircle2 size={16} color="#10B981" />
                              ) : (
                                <Circle size={16} color="#9CA3AF" />
                              )}
                              <div sx={{ flex: 1, minWidth: 0 }}>
                                <div sx={{
                                  fontSize: 1,
                                  color: task.status === 'done' ? 'textLight' : 'text',
                                  textDecoration: task.status === 'done' ? 'line-through' : 'none',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {task.title}
                                </div>
                              </div>
                              {task.priority && (
                                <div sx={{
                                  px: 2,
                                  py: 0,
                                  fontSize: 0,
                                  fontWeight: '600',
                                  borderRadius: '4px',
                                  flexShrink: 0,
                                  background: task.priority === 'high' ? 'dangerBg' : task.priority === 'medium' ? 'warningBg' : 'indigoBg',
                                  color: task.priority === 'high' ? 'dangerSolid' : task.priority === 'medium' ? 'warningDark' : 'indigo'
                                }}>
                                  {task.priority}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Goal Results */}
                      {searchResults.goals.length > 0 && (
                        <div>
                          <div sx={{
                            px: 3,
                            py: 2,
                            fontSize: 0,
                            fontWeight: '600',
                            color: 'muted',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid',
                            borderBottomColor: 'surfaceAlt',
                            borderTop: searchResults.tasks.length > 0 ? '1px solid' : 'none',
                            borderTopColor: 'border'
                          }}>
                            Goals
                          </div>
                          {searchResults.goals.map(goal => (
                            <button
                              key={goal.id}
                              onClick={() => {
                                navigate('/goals')
                                setSearchFocused(false)
                                setSearchQuery('')
                              }}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                width: '100%',
                                px: 3,
                                py: 2,
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                                borderBottom: '1px solid',
                                borderColor: 'background',
                                transition: 'background 0.15s',
                                ':hover': { background: 'background' }
                              }}
                            >
                              <Target size={16} color={categoryColors[goal.category]?.border || '#6B7280'} />
                              <div sx={{ flex: 1, minWidth: 0 }}>
                                <div sx={{
                                  fontSize: 1,
                                  color: 'text',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {goal.title}
                                </div>
                                {goal.description && (
                                  <div sx={{
                                    fontSize: 0,
                                    color: 'textLight',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    mt: '2px'
                                  }}>
                                    {goal.description}
                                  </div>
                                )}
                              </div>
                              <div sx={{
                                px: 2,
                                py: 0,
                                fontSize: 0,
                                fontWeight: '600',
                                borderRadius: '4px',
                                flexShrink: 0,
                                background: categoryColors[goal.category]?.bg || 'border',
                                color: categoryColors[goal.category]?.text || 'textSecondary'
                              }}>
                                {goal.category}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            sx={{
              px: 3,
              py: 1,
              background: 'danger',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: 0,
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s',
              ':hover': {
                background: 'dangerSolid'
              }
            }}
          >
            Logout
          </button>
        </div>

        {/* Hero Section */}
        <div sx={{
          background: 'surface',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
          p: 3,
          mb: 3
        }}>
          {/* Date and Greeting Row */}
          <div sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            flexWrap: 'wrap',
            gap: 2
          }}>
            {/* Date Section */}
            <div>
              <div sx={{
                fontSize: 0,
                color: 'muted',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                mb: 1
              }}>
                {dayOfWeek}
              </div>
              <div sx={{
                fontSize: 1,
                fontWeight: 'bold',
                color: 'muted',
                lineHeight: 1
              }}>
                {month} {date}, {year}
              </div>
            </div>

            {/* Weather Widget */}
            {weather && (
              <div sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 3,
                py: 2,
                background: 'primaryBg',
                borderRadius: '8px'
              }}>
                {weather.code === 0 ? <Sun size={20} color="#F59E0B" /> :
                 weather.code <= 3 ? <Cloud size={20} color="#1FA4FF" /> :
                 weather.code <= 48 ? <CloudFog size={20} color="#9CA3AF" /> :
                 weather.code <= 57 ? <CloudDrizzle size={20} color="#60A5FA" /> :
                 weather.code <= 67 ? <CloudRain size={20} color="#3B82F6" /> :
                 weather.code <= 77 ? <CloudSnow size={20} color="#93C5FD" /> :
                 weather.code <= 82 ? <CloudRain size={20} color="#2563EB" /> :
                 weather.code >= 95 ? <CloudLightning size={20} color="#7C3AED" /> :
                 <Cloud size={20} color="#1FA4FF" />}
                <div>
                  <div sx={{ fontSize: 1, fontWeight: 'bold', color: 'text' }}>{weather.temp}°C</div>
                  <div sx={{ fontSize: 0, color: 'muted' }}>{weather.description}</div>
                </div>
              </div>
            )}
          </div>

          {/* Greeting */}
          <div sx={{
            fontSize: 3,
            fontWeight: 'bold',
            color: 'text',
            mb: 2
          }}>
            {greeting}, {currentUser.fullName}!
          </div>

          {/* Quote of the Day */}
          <div sx={{
            background: 'linear-gradient(135deg, #1FA4FF 0%, #1E90FF 100%)',
            borderRadius: '8px',
            p: 3,
            mb: 2,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div sx={{
              position: 'relative',
              zIndex: 1
            }}>
              <div sx={{
                fontSize: 1,
                fontStyle: 'italic',
                color: '#FFFFFF',
                mb: 1,
                lineHeight: 1.5
              }}>
                "{currentQuote.text}"
              </div>
              <div sx={{
                fontSize: 0,
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '600'
              }}>
                — {currentQuote.author}
              </div>
            </div>
          </div>

          {/* Focus and Deadline Row */}
          <div sx={{
            display: 'grid',
            gridTemplateColumns: ['1fr', '1fr', '1fr 1fr'],
            gap: 2,
            mb: 2
          }}>
            {/* Today's Focus */}
            <div sx={{
              background: 'background',
              borderRadius: '8px',
              p: 2
            }}>
              <div sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2
              }}>
                <Target size={14} color="#1FA4FF" />
                <div sx={{ fontSize: 0, fontWeight: '600', color: 'text' }}>
                  Today's Focus
                </div>
              </div>
              <input
                type="text"
                placeholder="What's your main focus today?"
                value={todaysFocus}
                onChange={(e) => setTodaysFocus(e.target.value)}
                sx={{
                  width: '100%',
                  px: 2,
                  py: 1,
                  border: '1px solid',
                  borderColor: 'border',
                  borderRadius: '6px',
                  fontSize: 0,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  ':focus': {
                    borderColor: 'primary'
                  }
                }}
              />
            </div>

            {/* Upcoming Deadline */}
            <div sx={{
              background: 'background',
              borderRadius: '8px',
              p: 2
            }}>
              <div sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2
              }}>
                <Calendar size={14} color="#FBBF24" />
                <div sx={{ fontSize: 0, fontWeight: '600', color: 'text' }}>
                  Upcoming Deadline
                </div>
              </div>
              <div sx={{ fontSize: 0, color: 'muted' }}>
                No upcoming deadlines
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div sx={{
            display: 'grid',
            gridTemplateColumns: ['1fr 1fr', '1fr 1fr', '1fr 1fr 1fr 1fr'],
            gap: 2
          }}>
            <div sx={{
              textAlign: 'center',
              p: 2,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
              borderRadius: '8px'
            }}>
              <div sx={{ fontSize: 3, fontWeight: 'bold', color: 'text', mb: 0 }}>{todaysTasks.length}</div>
              <div sx={{ fontSize: 0, color: 'muted' }}>Tasks Today</div>
            </div>
            <div sx={{
              textAlign: 'center',
              p: 2,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
              borderRadius: '8px'
            }}>
              <div sx={{ fontSize: 3, fontWeight: 'bold', color: 'text', mb: 0 }}>0</div>
              <div sx={{ fontSize: 0, color: 'muted' }}>Active Goals</div>
            </div>
            <div sx={{
              textAlign: 'center',
              p: 2,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
              borderRadius: '8px'
            }}>
              <div sx={{ fontSize: 3, fontWeight: 'bold', color: 'text', mb: 0 }}>0</div>
              <div sx={{ fontSize: 0, color: 'muted' }}>Day Streak</div>
            </div>
            <div sx={{
              textAlign: 'center',
              p: 2,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
              borderRadius: '8px'
            }}>
              <div sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mb: 0
              }}>
                <Zap size={16} fill="#FBBF24" color="#FBBF24" />
                <div sx={{ fontSize: 3, fontWeight: 'bold', color: 'text' }}>0</div>
              </div>
              <div sx={{ fontSize: 0, color: 'muted' }}>Total XP</div>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div sx={{
          display: 'grid',
          gridTemplateColumns: ['1fr', '1fr', '1fr 1fr 1fr'],
          gap: 4
        }}>
          {/* Tasks Overview Card */}
          <div sx={{
            background: 'surface',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            p: 4,
            position: 'relative',
            transition: 'transform 0.2s, box-shadow 0.2s',
            ':hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
            }
          }}>
            {/* Expand Icon */}
            <button
              onClick={() => handleExpandCard('tasks')}
              sx={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background 0.2s',
                ':hover': {
                  background: 'surfaceAlt'
                }
              }}
            >
              <Maximize2 size={20} color="#6B7280" />
            </button>

            <div sx={{
              fontSize: 5,
              mb: 2
            }}>📋</div>
            <h3 sx={{
              fontSize: 3,
              fontWeight: 'bold',
              color: 'text',
              mb: 3
            }}>
              Tasks
            </h3>

            {todaysTasks.length === 0 ? (
              <div sx={{
                fontSize: 1,
                color: 'muted',
                lineHeight: 1.6
              }}>
                No tasks for today. Start by creating your first task to stay organized and productive.
              </div>
            ) : (
              <div sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}>
                {todaysTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      background: 'background',
                      borderRadius: '8px',
                      transition: 'background 0.2s',
                      ':hover': {
                        background: 'surfaceAlt'
                      }
                    }}
                  >
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      sx={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 size={20} color="#10B981" />
                      ) : (
                        <Circle size={20} color="#9CA3AF" />
                      )}
                    </button>
                    <div sx={{
                      flex: 1,
                      fontSize: 1,
                      color: task.status === 'done' ? 'textLight' : 'text',
                      textDecoration: task.status === 'done' ? 'line-through' : 'none'
                    }}>
                      {task.title}
                    </div>
                    {task.priority && (
                      <div sx={{
                        px: 2,
                        py: 0,
                        fontSize: 0,
                        fontWeight: '600',
                        borderRadius: '4px',
                        background: task.priority === 'high' ? 'dangerBg' : task.priority === 'medium' ? 'warningBg' : 'indigoBg',
                        color: task.priority === 'high' ? 'dangerSolid' : task.priority === 'medium' ? 'warningDark' : 'indigo'
                      }}>
                        {task.priority}
                      </div>
                    )}
                    {task.status !== 'done' && (
                      <button
                        onClick={() => setEditingTask(task)}
                        sx={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'muted',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          ':hover': {
                            background: 'surfaceAlt'
                          }
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {todaysTasks.length > 5 && (
                  <div sx={{
                    fontSize: 0,
                    color: 'muted',
                    textAlign: 'center',
                    mt: 1
                  }}>
                    +{todaysTasks.length - 5} more tasks
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Goals Overview Card */}
          <div sx={{
            background: 'surface',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            p: 4,
            position: 'relative',
            transition: 'transform 0.2s, box-shadow 0.2s',
            ':hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
            }
          }}>
            {/* Expand Icon */}
            <button
              onClick={() => handleExpandCard('goals')}
              sx={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background 0.2s',
                ':hover': {
                  background: 'surfaceAlt'
                }
              }}
            >
              <Maximize2 size={20} color="#6B7280" />
            </button>

            <div sx={{
              fontSize: 5,
              mb: 2
            }}>🎯</div>
            <h3 sx={{
              fontSize: 3,
              fontWeight: 'bold',
              color: 'text',
              mb: 3
            }}>
              Goals
            </h3>
            <div sx={{
              fontSize: 1,
              color: 'muted',
              lineHeight: 1.6
            }}>
              Set your goals and track your progress. Turn your dreams into achievable milestones.
            </div>
          </div>

          {/* Stats Overview Card */}
          <div sx={{
            background: 'surface',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            p: 4,
            position: 'relative',
            transition: 'transform 0.2s, box-shadow 0.2s',
            ':hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
            }
          }}>
            {/* Expand Icon */}
            <button
              onClick={() => handleExpandCard('stats')}
              sx={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background 0.2s',
                ':hover': {
                  background: 'surfaceAlt'
                }
              }}
            >
              <Maximize2 size={20} color="#6B7280" />
            </button>

            <div sx={{ mb: 3 }}>
              <TrendingUp size={40} color="#1FA4FF" strokeWidth={2} />
            </div>
            <h3 sx={{
              fontSize: 3,
              fontWeight: 'bold',
              color: 'text',
              mb: 3
            }}>
              Stats
            </h3>
            <div sx={{
              fontSize: 1,
              color: 'muted',
              lineHeight: 1.6
            }}>
              View your productivity analytics, achievements, and performance insights.
            </div>
          </div>
        </div>
        </div>
      </div>
      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={true}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  )
}

export default DashboardPage
