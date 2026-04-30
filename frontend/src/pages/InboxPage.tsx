/** @jsxImportSource theme-ui */
import { useEffect } from 'react'
import { CheckCircle2, Circle, AlertCircle, Calendar as CalendarIcon, Inbox as InboxIcon } from 'lucide-react'
import { useAuthStore, useTaskStore } from '../stores'
import { useSidebar } from '../contexts'
import Sidebar from '../components/Sidebar'

const InboxPage = () => {

  const { currentUser } = useAuthStore()
  const { sidebarWidth } = useSidebar()
  const { loadTasks, getTasks, completeTask, incompleteTask } = useTaskStore()

  useEffect(() => {
    if (currentUser) {
      loadTasks(currentUser.id)
    }
  }, [currentUser, loadTasks])

  if (!currentUser) {
    return null
  }

  const allTasks = getTasks()
  const now = Date.now()
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const endOfToday = today.getTime()

  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const tomorrowStart = new Date()
  tomorrowStart.setHours(0, 0, 0, 0)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  const tomorrowStr = toLocalDateStr(tomorrowStart)

  const sevenDaysFromNow = new Date(tomorrowStart)
  sevenDaysFromNow.setDate(tomorrowStart.getDate() + 7)
  const sevenDaysStr = toLocalDateStr(sevenDaysFromNow)

  // Categorize tasks - overdue = due time has passed (even if today)
  const overdueTasks = allTasks.filter(task => {
    if (!task.dueDate || task.status === 'done') return false
    return task.dueDate < now
  })

  const dueTodayTasks = allTasks.filter(task => {
    if (!task.dueDate || task.status === 'done') return false
    return task.dueDate >= now && task.dueDate <= endOfToday
  })

  const upcomingTasks = allTasks.filter(task => {
    if (!task.dueDate || task.status === 'done') return false
    const taskDate = toLocalDateStr(new Date(task.dueDate))
    return taskDate >= tomorrowStr && taskDate <= sevenDaysStr
  })

  const unscheduledTasks = allTasks.filter(task => {
    return !task.dueDate && task.status !== 'done'
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

  const formatDueDate = (dueDate: Date) => {
    const date = new Date(dueDate)
    const dateStr = toLocalDateStr(date)

    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    const todayDateStr = toLocalDateStr(todayDate)

    if (dateStr < todayDateStr) {
      const yesterday = new Date(todayDate)
      yesterday.setDate(todayDate.getDate() - 1)
      const yesterdayStr = toLocalDateStr(yesterday)

      if (dateStr === yesterdayStr) {
        return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    if (dateStr === todayDateStr) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    }

    const tomorrow = new Date(todayDate)
    tomorrow.setDate(todayDate.getDate() + 1)

    if (dateStr === toLocalDateStr(tomorrow)) {
      return `Tomorrow ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  const TaskItem = ({ task }: { task: any }) => (
    <div
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 3,
        py: 3,
        px: 4,
        borderBottom: '1px solid',
        borderColor: 'surfaceAlt',
        transition: 'background 0.2s',
        ':hover': {
          background: 'surface'
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
          alignItems: 'center',
          mt: '2px'
        }}
      >
        {task.status === 'done' ? (
          <CheckCircle2 size={20} color="#10B981" />
        ) : (
          <Circle size={20} color="#9CA3AF" />
        )}
      </button>

      <div sx={{ flex: 1 }}>
        <div sx={{
          fontSize: 1,
          color: task.status === 'done' ? 'textLight' : 'text',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          mb: 1
        }}>
          {task.title}
        </div>

        <div sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          {task.dueDate && (
            <div sx={{
              fontSize: 0,
              color: 'muted',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <CalendarIcon size={12} />
              {formatDueDate(task.dueDate)}
            </div>
          )}

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
        </div>
      </div>
    </div>
  )

  const SectionHeader = ({ icon: Icon, title, count, color }: { icon: any, title: string, count: number, color: string }) => (
    <div sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      px: 4,
      py: 3,
      background: 'background',
      borderBottom: '1px solid',
      borderColor: 'border'
    }}>
      <Icon size={18} color={color} />
      <div sx={{
        fontSize: 1,
        fontWeight: '600',
        color: 'text'
      }}>
        {title}
      </div>
      <div sx={{
        fontSize: 0,
        color: 'muted',
        background: 'border',
        px: 2,
        py: 0,
        borderRadius: '12px'
      }}>
        {count}
      </div>
    </div>
  )

  return (
    <div sx={{
      display: 'flex',
      minHeight: '100vh',
      background: 'surface'
    }}>
      <Sidebar />

      <div sx={{
        flex: 1,
        ml: `${sidebarWidth}px`,
        transition: 'margin-left 0.2s',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div sx={{
          px: 4,
          py: 4,
          borderBottom: '1px solid',
          borderColor: 'border'
        }}>
          <div sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <InboxIcon size={24} color="#1FA4FF" />
            <h1 sx={{
              fontSize: 4,
              fontWeight: 'bold',
              color: 'text',
              m: 0
            }}>
              Inbox
            </h1>
          </div>
        </div>

        {/* Content */}
        <div sx={{
          maxWidth: '900px',
          mx: 'auto',
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Overdue Section */}
          {overdueTasks.length > 0 && (
            <div>
              <SectionHeader
                icon={AlertCircle}
                title="Overdue"
                count={overdueTasks.length}
                color="#DC2626"
              />
              {overdueTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}

          {/* Due Today Section */}
          {dueTodayTasks.length > 0 && (
            <div>
              <SectionHeader
                icon={CalendarIcon}
                title="Due Today"
                count={dueTodayTasks.length}
                color="#1FA4FF"
              />
              {dueTodayTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}

          {/* Upcoming Section */}
          {upcomingTasks.length > 0 && (
            <div>
              <SectionHeader
                icon={CalendarIcon}
                title="Upcoming (Next 7 Days)"
                count={upcomingTasks.length}
                color="#10B981"
              />
              {upcomingTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}

          {/* Unscheduled Section */}
          {unscheduledTasks.length > 0 && (
            <div>
              <SectionHeader
                icon={InboxIcon}
                title="Unscheduled"
                count={unscheduledTasks.length}
                color="#6B7280"
              />
              {unscheduledTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {overdueTasks.length === 0 && dueTodayTasks.length === 0 && upcomingTasks.length === 0 && unscheduledTasks.length === 0 && (
            <div sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              textAlign: 'center',
              px: 4,
              minHeight: '60vh'
            }}>
              <InboxIcon size={48} color="#D1D5DB" sx={{ mb: 3 }} />
              <div sx={{
                fontSize: 2,
                fontWeight: '600',
                color: 'text',
                mb: 2
              }}>
                Your inbox is empty
              </div>
              <div sx={{
                fontSize: 1,
                color: 'muted'
              }}>
                All caught up! Create new tasks to see them here.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InboxPage
