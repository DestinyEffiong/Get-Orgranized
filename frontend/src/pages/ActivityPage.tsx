/** @jsxImportSource theme-ui */
import { useState, useEffect, useMemo } from 'react'
import { CheckCircle2, PlusCircle, Trash2, Target, Activity, ChevronUp, ChevronDown } from 'lucide-react'
import { useAuthStore, useTaskStore, useGoalStore } from '../stores'
import { useSidebar } from '../contexts'
import Sidebar from '../components/Sidebar'
import { categoryColors } from '../types/goal'

type ActivityType = 'all' | 'tasks' | 'goals'

interface ActivityEvent {
  id: string
  type: 'task_created' | 'task_completed' | 'task_deleted' | 'goal_created' | 'goal_completed' | 'goal_deleted' | 'subgoal_created' | 'subgoal_completed' | 'subgoal_deleted'
  title: string
  timestamp: number
  meta?: {
    priority?: string
    category?: string
    parentGoalTitle?: string
    linkedGoalTitle?: string
  }
}

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const getDateLabel = (dateStr: string): string => {
  const today = toLocalDateStr(new Date())
  const yesterday = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return toLocalDateStr(d)
  })()

  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'

  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const eventConfig = {
  task_created: { icon: PlusCircle, color: '#1FA4FF', bg: 'primaryBgStrong', label: 'Created task' },
  task_completed: { icon: CheckCircle2, color: '#10B981', bg: 'successBg', label: 'Completed task' },
  task_deleted: { icon: Trash2, color: '#EF4444', bg: 'dangerBg', label: 'Deleted task' },
  goal_created: { icon: Target, color: '#8B5CF6', bg: 'purpleBg', label: 'Created goal' },
  goal_completed: { icon: Target, color: '#10B981', bg: 'successBg', label: 'Completed goal' },
  goal_deleted: { icon: Trash2, color: '#EF4444', bg: 'dangerBg', label: 'Deleted goal' },
  subgoal_created: { icon: PlusCircle, color: '#8B5CF6', bg: 'purpleBg', label: 'Added sub-goal' },
  subgoal_completed: { icon: CheckCircle2, color: '#10B981', bg: 'successBg', label: 'Completed sub-goal' },
  subgoal_deleted: { icon: Trash2, color: '#EF4444', bg: 'dangerBg', label: 'Deleted sub-goal' },
}

const ActivityPage = () => {
  const { currentUser } = useAuthStore()
  const { sidebarWidth } = useSidebar()
  const { loadTasks, getTasks, loadDeletedTasks } = useTaskStore()
  const { loadGoals, getActiveGoals, getCompletedGoals, loadDeletedGoals } = useGoalStore()
  const [filter, setFilter] = useState<ActivityType>('all')
  const [statsPeriodIndex, setStatsPeriodIndex] = useState(0)
  const deletedTasks = useTaskStore(s => s.deletedTasks)
  const deletedGoals = useGoalStore(s => s.deletedGoals)

  useEffect(() => {
    if (currentUser) {
      loadTasks(currentUser.id)
      loadGoals(currentUser.id)
      loadDeletedTasks(currentUser.id)
      loadDeletedGoals(currentUser.id)
    }
  }, [currentUser, loadTasks, loadGoals, loadDeletedTasks, loadDeletedGoals])

  if (!currentUser) return null

  const allTasks = getTasks()
  const allGoals = [...getActiveGoals(), ...getCompletedGoals()]

  // Build activity events from existing timestamps
  const events = useMemo(() => {
    const items: ActivityEvent[] = []

    // Build a lookup map for goal titles (to resolve parent/linked names)
    const goalTitleMap = new Map<string, string>()
    for (const g of allGoals) goalTitleMap.set(g.id, g.title)
    for (const g of deletedGoals) goalTitleMap.set(g.id, g.title)

    // Active tasks
    for (const task of allTasks) {
      if (task.isHabit) continue
      const linkedGoalTitle = task.goalId ? goalTitleMap.get(task.goalId) : undefined

      items.push({
        id: `task-created-${task.id}`,
        type: 'task_created',
        title: task.title,
        timestamp: task.createdAt,
        meta: { priority: task.priority, linkedGoalTitle }
      })

      if (task.completedAt) {
        items.push({
          id: `task-completed-${task.id}`,
          type: 'task_completed',
          title: task.title,
          timestamp: task.completedAt,
          meta: { priority: task.priority, linkedGoalTitle }
        })
      }
    }

    // Deleted tasks
    for (const task of deletedTasks) {
      if (task.isHabit) continue
      const linkedGoalTitle = task.goalId ? goalTitleMap.get(task.goalId) : undefined

      items.push({
        id: `task-created-${task.id}`,
        type: 'task_created',
        title: task.title,
        timestamp: task.createdAt,
        meta: { priority: task.priority, linkedGoalTitle }
      })

      if (task.completedAt) {
        items.push({
          id: `task-completed-${task.id}`,
          type: 'task_completed',
          title: task.title,
          timestamp: task.completedAt,
          meta: { priority: task.priority, linkedGoalTitle }
        })
      }

      if (task.deletedAt) {
        items.push({
          id: `task-deleted-${task.id}`,
          type: 'task_deleted',
          title: task.title,
          timestamp: task.deletedAt,
          meta: { priority: task.priority, linkedGoalTitle }
        })
      }
    }

    // Active + completed goals (including sub-goals)
    for (const goal of allGoals) {
      const isSubGoal = !!goal.parentGoalId
      const parentTitle = goal.parentGoalId ? goalTitleMap.get(goal.parentGoalId) : undefined

      items.push({
        id: `goal-created-${goal.id}`,
        type: isSubGoal ? 'subgoal_created' : 'goal_created',
        title: goal.title,
        timestamp: goal.createdAt,
        meta: { category: goal.category, parentGoalTitle: parentTitle }
      })

      if (goal.completedAt) {
        items.push({
          id: `goal-completed-${goal.id}`,
          type: isSubGoal ? 'subgoal_completed' : 'goal_completed',
          title: goal.title,
          timestamp: goal.completedAt,
          meta: { category: goal.category, parentGoalTitle: parentTitle }
        })
      }
    }

    // Deleted goals
    for (const goal of deletedGoals) {
      const isSubGoal = !!goal.parentGoalId
      const parentTitle = goal.parentGoalId ? goalTitleMap.get(goal.parentGoalId) : undefined

      items.push({
        id: `goal-created-${goal.id}`,
        type: isSubGoal ? 'subgoal_created' : 'goal_created',
        title: goal.title,
        timestamp: goal.createdAt,
        meta: { category: goal.category, parentGoalTitle: parentTitle }
      })

      if (goal.completedAt) {
        items.push({
          id: `goal-completed-${goal.id}`,
          type: isSubGoal ? 'subgoal_completed' : 'goal_completed',
          title: goal.title,
          timestamp: goal.completedAt,
          meta: { category: goal.category, parentGoalTitle: parentTitle }
        })
      }

      if (goal.deletedAt) {
        items.push({
          id: `goal-deleted-${goal.id}`,
          type: isSubGoal ? 'subgoal_deleted' : 'goal_deleted',
          title: goal.title,
          timestamp: goal.deletedAt,
          meta: { category: goal.category, parentGoalTitle: parentTitle }
        })
      }
    }

    // Sort newest first
    items.sort((a, b) => b.timestamp - a.timestamp)
    return items
  }, [allTasks, allGoals, deletedTasks, deletedGoals])

  // Apply filter
  const filteredEvents = filter === 'all'
    ? events
    : filter === 'tasks'
    ? events.filter(e => e.type.startsWith('task_'))
    : events.filter(e => e.type.startsWith('goal_') || e.type.startsWith('subgoal_'))

  // Group by date
  const groupedEvents = useMemo(() => {
    const groups: { dateStr: string; label: string; events: ActivityEvent[] }[] = []
    let currentGroup: typeof groups[0] | null = null

    for (const event of filteredEvents) {
      const dateStr = toLocalDateStr(new Date(event.timestamp))
      if (!currentGroup || currentGroup.dateStr !== dateStr) {
        currentGroup = { dateStr, label: getDateLabel(dateStr), events: [] }
        groups.push(currentGroup)
      }
      currentGroup.events.push(event)
    }

    return groups
  }, [filteredEvents])

  // Time period options
  const statsPeriods = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const periods: { label: string; from: number }[] = [
      { label: 'Today', from: startOfToday.getTime() },
      { label: 'This Week', from: startOfWeek.getTime() },
      { label: 'This Month', from: startOfMonth.getTime() },
    ]

    for (let m = 2; m <= 12; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m + 1, 1)
      periods.push({ label: `Last ${m} Months`, from: d.getTime() })
    }

    return periods
  }, [])

  const currentPeriod = statsPeriods[statsPeriodIndex]
  const periodEvents = events.filter(e => e.timestamp >= currentPeriod.from)
  const statsTasksCreated = periodEvents.filter(e => e.type === 'task_created').length
  const statsTasksCompleted = periodEvents.filter(e => e.type === 'task_completed').length
  const statsGoalsCreated = periodEvents.filter(e => e.type === 'goal_created' || e.type === 'subgoal_created').length
  const statsGoalsCompleted = periodEvents.filter(e => e.type === 'goal_completed' || e.type === 'subgoal_completed').length

  return (
    <div sx={{ display: 'flex', minHeight: '100vh', background: 'background' }}>
      <Sidebar />

      <div sx={{
        flex: 1,
        marginLeft: sidebarWidth,
        transition: 'margin-left 0.3s ease',
        p: 4
      }}>
        {/* Header */}
        <div sx={{ mb: 4 }}>
          <div sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 1
          }}>
            <Activity size={24} color="#1FA4FF" />
            <h1 sx={{
              fontSize: 4,
              fontWeight: '700',
              color: 'text',
              m: 0
            }}>
              Activity
            </h1>
          </div>
          <p sx={{ fontSize: 1, color: 'muted', m: 0 }}>
            Your recent actions across tasks and goals
          </p>
        </div>

        {/* Summary with period selector */}
        <div sx={{ mb: 4 }}>
          {/* Period selector */}
          <div sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 3
          }}>
            <div sx={{
              fontSize: 1,
              fontWeight: '700',
              color: 'textSecondary'
            }}>
              {currentPeriod.label}
            </div>
            <div sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <button
                onClick={() => setStatsPeriodIndex(Math.max(0, statsPeriodIndex - 1))}
                disabled={statsPeriodIndex === 0}
                sx={{
                  background: 'transparent',
                  border: 'none',
                  cursor: statsPeriodIndex === 0 ? 'default' : 'pointer',
                  padding: 0,
                  display: 'flex',
                  opacity: statsPeriodIndex === 0 ? 0.3 : 1,
                  transition: 'opacity 0.2s',
                  ':hover': {
                    opacity: statsPeriodIndex === 0 ? 0.3 : 0.7
                  }
                }}
              >
                <ChevronUp size={16} color="#374151" />
              </button>
              <button
                onClick={() => setStatsPeriodIndex(Math.min(statsPeriods.length - 1, statsPeriodIndex + 1))}
                disabled={statsPeriodIndex === statsPeriods.length - 1}
                sx={{
                  background: 'transparent',
                  border: 'none',
                  cursor: statsPeriodIndex === statsPeriods.length - 1 ? 'default' : 'pointer',
                  padding: 0,
                  display: 'flex',
                  opacity: statsPeriodIndex === statsPeriods.length - 1 ? 0.3 : 1,
                  transition: 'opacity 0.2s',
                  ':hover': {
                    opacity: statsPeriodIndex === statsPeriods.length - 1 ? 0.3 : 0.7
                  }
                }}
              >
                <ChevronDown size={16} color="#374151" />
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 3
          }}>
            <div sx={{
              background: 'surface',
              borderRadius: '12px',
              p: 3,
              border: '1px solid',
              borderColor: 'border'
            }}>
              <div sx={{ fontSize: 0, color: 'muted', fontWeight: '600', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tasks Created
              </div>
              <div sx={{ fontSize: 4, fontWeight: '700', color: 'text' }}>
                {statsTasksCreated}
              </div>
            </div>
            <div sx={{
              background: 'surface',
              borderRadius: '12px',
              p: 3,
              border: '1px solid',
              borderColor: 'border'
            }}>
              <div sx={{ fontSize: 0, color: 'muted', fontWeight: '600', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tasks Completed
              </div>
              <div sx={{ fontSize: 4, fontWeight: '700', color: 'text' }}>
                {statsTasksCompleted}
              </div>
            </div>
            <div sx={{
              background: 'surface',
              borderRadius: '12px',
              p: 3,
              border: '1px solid',
              borderColor: 'border'
            }}>
              <div sx={{ fontSize: 0, color: 'muted', fontWeight: '600', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Goals Created
              </div>
              <div sx={{ fontSize: 4, fontWeight: '700', color: 'text' }}>
                {statsGoalsCreated}
              </div>
            </div>
            <div sx={{
              background: 'surface',
              borderRadius: '12px',
              p: 3,
              border: '1px solid',
              borderColor: 'border'
            }}>
              <div sx={{ fontSize: 0, color: 'muted', fontWeight: '600', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Goals Completed
              </div>
              <div sx={{ fontSize: 4, fontWeight: '700', color: 'text' }}>
                {statsGoalsCompleted}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div sx={{
          display: 'flex',
          gap: 1,
          mb: 4,
          background: 'surface',
          borderRadius: '10px',
          p: 1,
          border: '1px solid',
          borderColor: 'border',
          width: 'fit-content'
        }}>
          {([
            { key: 'all', label: 'All' },
            { key: 'tasks', label: 'Tasks' },
            { key: 'goals', label: 'Goals' }
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              sx={{
                px: 3,
                py: '6px',
                border: 'none',
                borderRadius: '8px',
                fontSize: 1,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: filter === tab.key ? 'primary' : 'transparent',
                color: filter === tab.key ? 'surface' : 'muted',
                ':hover': {
                  background: filter === tab.key ? 'primary' : 'surfaceAlt'
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {groupedEvents.length === 0 ? (
          <div sx={{
            textAlign: 'center',
            py: 6,
            color: 'textLight',
            fontSize: 1,
            background: 'surface',
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'border'
          }}>
            No activity yet. Start creating tasks and goals!
          </div>
        ) : (
          <div sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {groupedEvents.map(group => (
              <div key={group.dateStr}>
                {/* Date Header */}
                <div sx={{
                  fontSize: 1,
                  fontWeight: '700',
                  color: 'textSecondary',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  {group.label}
                  <span sx={{
                    fontSize: 0,
                    fontWeight: '500',
                    color: 'textLight',
                    background: 'surfaceAlt',
                    px: 2,
                    py: '2px',
                    borderRadius: '10px'
                  }}>
                    {group.events.length}
                  </span>
                </div>

                {/* Events for this date */}
                <div sx={{
                  background: 'surface',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: 'border',
                  overflow: 'hidden'
                }}>
                  {group.events.map((event, i) => {
                    const config = eventConfig[event.type]
                    const Icon = config.icon
                    const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })

                    return (
                      <div
                        key={event.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          px: 3,
                          py: '14px',
                          borderBottom: i < group.events.length - 1 ? '1px solid' : 'none',
                          borderColor: 'surfaceAlt',
                          transition: 'background 0.15s',
                          ':hover': {
                            background: 'surface'
                          }
                        }}
                      >
                        {/* Icon */}
                        <div sx={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: config.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Icon size={18} color={config.color} />
                        </div>

                        {/* Content */}
                        <div sx={{ flex: 1, minWidth: 0 }}>
                          <div sx={{
                            fontSize: 1,
                            color: 'text',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap'
                          }}>
                            <span sx={{ color: 'muted', fontWeight: '500' }}>
                              {config.label}
                            </span>
                            <span sx={{
                              fontWeight: '600',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {event.title}
                            </span>
                            {(event.meta?.parentGoalTitle || event.meta?.linkedGoalTitle) && (
                              <span sx={{ color: 'textLight', fontWeight: '500', fontSize: 0 }}>
                                in {event.meta.parentGoalTitle || event.meta.linkedGoalTitle}
                              </span>
                            )}
                          </div>

                          {/* Meta badges */}
                          <div sx={{ display: 'flex', gap: 1, mt: '4px', alignItems: 'center' }}>
                            {event.meta?.priority && (
                              <span sx={{
                                fontSize: '10px',
                                fontWeight: '600',
                                px: '6px',
                                py: '1px',
                                borderRadius: '4px',
                                background: event.meta.priority === 'high' ? 'dangerBg' : event.meta.priority === 'medium' ? 'warningBg' : 'indigoBg',
                                color: event.meta.priority === 'high' ? 'dangerSolid' : event.meta.priority === 'medium' ? 'warningDark' : 'indigo',
                                textTransform: 'capitalize'
                              }}>
                                {event.meta.priority}
                              </span>
                            )}
                            {event.meta?.category && (
                              <span sx={{
                                fontSize: '10px',
                                fontWeight: '600',
                                px: '6px',
                                py: '1px',
                                borderRadius: '4px',
                                background: categoryColors[event.meta.category as keyof typeof categoryColors]?.bg || 'surfaceAlt',
                                color: categoryColors[event.meta.category as keyof typeof categoryColors]?.text || 'textSecondary',
                                textTransform: 'capitalize'
                              }}>
                                {event.meta.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Timestamp */}
                        <div sx={{
                          fontSize: 0,
                          color: 'textLight',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          {time}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityPage
