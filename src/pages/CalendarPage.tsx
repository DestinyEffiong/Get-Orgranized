/** @jsxImportSource theme-ui */
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Plus, Pencil, Target, Calendar } from 'lucide-react'
import { useAuthStore, useTaskStore, useGoalStore } from '../stores'
import { useSidebar } from '../contexts'
import Sidebar from '../components/Sidebar'
import AddTaskModal from '../components/AddTaskModal'
import AddGoalModal from '../components/AddGoalModal'
import GoalDetailModal from '../components/GoalDetailModal'
import EditTaskModal from '../components/EditTaskModal'
import type { Task } from '../types'
import { categoryColors } from '../types/goal'

const CalendarPage = () => {
  const { currentUser } = useAuthStore()
  const { sidebarWidth } = useSidebar()
  const { loadTasks, getTasks, completeTask, incompleteTask } = useTaskStore()
  const { loadGoals, getActiveGoals, getCompletedGoals } = useGoalStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false)
  const [addGoalModalOpen, setAddGoalModalOpen] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    if (currentUser) {
      loadTasks(currentUser.id)
      loadGoals(currentUser.id)
    }
  }, [currentUser, loadTasks, loadGoals])

  if (!currentUser) {
    return null
  }

  const allTasks = getTasks()

  // Get calendar data
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay() // 0 = Sunday

  // Generate calendar days
  const calendarDays: (Date | null)[] = []

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Add all days in month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day))
  }

  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  // Get all goals (top-level only)
  const allGoals = [...getActiveGoals(), ...getCompletedGoals()].filter(g => !g.parentGoalId)

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dateStr = toLocalDateStr(date)
    return allTasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = toLocalDateStr(new Date(task.dueDate))
      return taskDate === dateStr
    })
  }

  // Get goals for a specific date (by target date)
  const getGoalsForDate = (date: Date) => {
    const dateStr = toLocalDateStr(date)
    return allGoals.filter(goal => {
      if (!goal.targetDate) return false
      const goalDate = toLocalDateStr(new Date(goal.targetDate))
      return goalDate === dateStr
    })
  }

  // Get selected date tasks and goals
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []
  const selectedDateGoals = selectedDate ? getGoalsForDate(selectedDate) : []

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

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

  const isToday = (date: Date) => {
    return toLocalDateStr(date) === toLocalDateStr(today)
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return toLocalDateStr(date) === toLocalDateStr(selectedDate)
  }

  const isPast = (date: Date) => {
    return date < today && !isToday(date)
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
        transition: 'margin-left 0.2s',
        p: 4
      }}>
        <div sx={{
          maxWidth: '1400px',
          mx: 'auto'
        }}>
          {/* Header */}
          <div sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 4
          }}>
            <div sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <Calendar size={24} color="#1FA4FF" />
              <h1 sx={{
                fontSize: 4,
                fontWeight: 'bold',
                color: 'text',
                m: 0
              }}>
                Calendar
              </h1>
            </div>

            <div sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <button
                onClick={goToToday}
                sx={{
                  px: 3,
                  py: 2,
                  background: 'surface',
                  border: '1px solid',
                  borderColor: 'border',
                  borderRadius: '8px',
                  fontSize: 1,
                  fontWeight: '600',
                  color: 'text',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  ':hover': {
                    background: 'background',
                    borderColor: 'primary'
                  }
                }}
              >
                Today
              </button>

              <div sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                background: 'surface',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: 'border',
                p: 1
              }}>
                <button
                  onClick={goToPreviousMonth}
                  sx={{
                    p: 1,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px',
                    transition: 'background 0.2s',
                    ':hover': {
                      background: 'surfaceAlt'
                    }
                  }}
                >
                  <ChevronLeft size={20} color="#6B7280" />
                </button>

                <div sx={{
                  fontSize: 2,
                  fontWeight: '600',
                  color: 'text',
                  minWidth: '180px',
                  textAlign: 'center'
                }}>
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>

                <button
                  onClick={goToNextMonth}
                  sx={{
                    p: 1,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px',
                    transition: 'background 0.2s',
                    ':hover': {
                      background: 'surfaceAlt'
                    }
                  }}
                >
                  <ChevronRight size={20} color="#6B7280" />
                </button>
              </div>
            </div>
          </div>

          <div sx={{
            display: 'grid',
            gridTemplateColumns: selectedDate ? '1fr 400px' : '1fr',
            gap: 4
          }}>
            {/* Calendar Grid */}
            <div sx={{
              background: 'surface',
              borderRadius: '12px',
              p: 4,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
            }}>
              {/* Day Headers */}
              <div sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 2,
                mb: 2
              }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div
                    key={day}
                    sx={{
                      textAlign: 'center',
                      fontSize: 0,
                      fontWeight: '600',
                      color: 'muted',
                      py: 2
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 2
              }}>
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} />
                  }

                  const tasksForDay = getTasksForDate(date)
                  const completedTasks = tasksForDay.filter(t => t.status === 'done').length
                  const totalTasks = tasksForDay.length
                  const goalsForDay = getGoalsForDate(date)
                  const completedGoals = goalsForDay.filter(g => g.status === 'completed').length
                  const totalGoals = goalsForDay.length

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      sx={{
                        position: 'relative',
                        aspectRatio: '1',
                        border: '1px solid',
                        borderColor: isSelected(date) ? 'primary' : 'border',
                        borderRadius: '8px',
                        background: isToday(date) ? 'primaryBg' : isSelected(date) ? 'primaryBg' : 'surface',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        ':hover': {
                          borderColor: 'primary',
                          background: 'background'
                        }
                      }}
                    >
                      <div sx={{
                        fontSize: 1,
                        fontWeight: isToday(date) ? '700' : '500',
                        color: isPast(date) ? 'textLight' : isToday(date) ? 'primary' : 'text',
                        mb: 1
                      }}>
                        {date.getDate()}
                      </div>

                      {(totalTasks > 0 || totalGoals > 0) && (
                        <div sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          width: '100%'
                        }}>
                          {/* Tasks indicator - blue */}
                          {totalTasks > 0 && (
                            <div sx={{
                              fontSize: '10px',
                              fontWeight: '600',
                              color: 'primary'
                            }}>
                              {completedTasks}/{totalTasks}
                            </div>
                          )}
                          {totalTasks > 0 && (
                            <div sx={{
                              width: '80%',
                              height: '3px',
                              background: 'primaryBgStrong',
                              borderRadius: '2px',
                              overflow: 'hidden'
                            }}>
                              <div sx={{
                                width: `${(completedTasks / totalTasks) * 100}%`,
                                height: '100%',
                                background: 'primary',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          )}
                          {/* Goals indicator - green */}
                          {totalGoals > 0 && (
                            <div sx={{
                              fontSize: '10px',
                              fontWeight: '600',
                              color: 'success'
                            }}>
                              {completedGoals}/{totalGoals}
                            </div>
                          )}
                          {totalGoals > 0 && (
                            <div sx={{
                              width: '80%',
                              height: '3px',
                              background: 'successBg',
                              borderRadius: '2px',
                              overflow: 'hidden'
                            }}>
                              <div sx={{
                                width: `${(completedGoals / totalGoals) * 100}%`,
                                height: '100%',
                                background: 'success',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected Date Panel */}
            {selectedDate && (
              <div sx={{
                background: 'surface',
                borderRadius: '12px',
                p: 4,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                maxHeight: '800px',
                overflowY: 'auto'
              }}>
                <div sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                  pb: 3,
                  borderBottom: '1px solid',
                  borderBottomColor: 'border'
                }}>
                  <div>
                    <div sx={{
                      fontSize: 2,
                      fontWeight: '700',
                      color: 'text',
                      mb: 1
                    }}>
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      fontSize: 1,
                      color: 'muted'
                    }}>
                      {selectedDateTasks.length > 0 && (
                        <span sx={{ color: 'primary', fontWeight: '600' }}>
                          {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                      )}
                      {selectedDateGoals.length > 0 && (
                        <span sx={{ color: 'success', fontWeight: '600' }}>
                          {selectedDateGoals.length} {selectedDateGoals.length === 1 ? 'goal' : 'goals'}
                        </span>
                      )}
                      {selectedDateTasks.length === 0 && selectedDateGoals.length === 0 && 'Nothing scheduled'}
                    </div>
                  </div>

                  <div sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <button
                      onClick={() => setAddTaskModalOpen(true)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 3,
                        py: 1,
                        background: 'primary',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: 0,
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        ':hover': {
                          background: 'primaryHover'
                        }
                      }}
                    >
                      <Plus size={14} />
                      Add Task
                    </button>

                    <button
                      onClick={() => setAddGoalModalOpen(true)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 3,
                        py: 1,
                        background: 'success',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: 0,
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        ':hover': {
                          background: 'successDark'
                        }
                      }}
                    >
                      <Plus size={14} />
                      Add Goal
                    </button>

                    <button
                      onClick={() => setSelectedDate(null)}
                      sx={{
                        fontSize: 1,
                        color: 'muted',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        ':hover': {
                          color: 'text'
                        }
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Goals Section */}
                {selectedDateGoals.length > 0 && (
                  <div sx={{ mb: 3 }}>
                    <div sx={{
                      fontSize: 0,
                      fontWeight: '700',
                      color: 'success',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      mb: 2
                    }}>
                      Goals
                    </div>
                    <div sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {selectedDateGoals.map(goal => {
                        const colors = categoryColors[goal.category]
                        return (
                          <div
                            key={goal.id}
                            onClick={() => setSelectedGoalId(goal.id)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              p: 3,
                              background: colors.bg,
                              borderRadius: '8px',
                              border: `1px solid ${colors.border}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              ':hover': {
                                opacity: 0.85
                              }
                            }}
                          >
                            <Target size={18} color={colors.border} />
                            <div sx={{ flex: 1 }}>
                              <div sx={{
                                fontSize: 1,
                                fontWeight: '600',
                                color: colors.text,
                                textDecoration: goal.status === 'completed' ? 'line-through' : 'none'
                              }}>
                                {goal.title}
                              </div>
                              <div sx={{ fontSize: 0, color: colors.text, opacity: 0.7, mt: '2px' }}>
                                {goal.category}
                              </div>
                            </div>
                            {goal.status === 'completed' && (
                              <CheckCircle2 size={18} color="#10B981" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Tasks Section */}
                {selectedDateTasks.length > 0 && (
                  <div>
                    <div sx={{
                      fontSize: 0,
                      fontWeight: '700',
                      color: 'primary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      mb: 2
                    }}>
                      Tasks
                    </div>
                    <div sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2
                    }}>
                      {selectedDateTasks.map(task => (
                        <div
                          key={task.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 3,
                            background: 'background',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: 'border',
                            transition: 'all 0.2s',
                            ':hover': {
                              background: 'surfaceAlt',
                              borderColor: 'borderMedium'
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

                          <div sx={{ flex: 1 }}>
                            <div sx={{
                              fontSize: 1,
                              color: task.status === 'done' ? 'textLight' : 'text',
                              textDecoration: task.status === 'done' ? 'line-through' : 'none',
                              mb: 1
                            }}>
                              {task.title}
                            </div>

                            {task.dueDate && (
                              <div sx={{
                                fontSize: 0,
                                color: 'muted'
                              }}>
                                {new Date(task.dueDate).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}
                          </div>

                          {task.priority && (
                            <div sx={{
                              px: 2,
                              py: 1,
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
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {selectedDateTasks.length === 0 && selectedDateGoals.length === 0 && (
                  <div sx={{
                    textAlign: 'center',
                    py: 6,
                    color: 'textLight',
                    fontSize: 1
                  }}>
                    Nothing scheduled for this day
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={addTaskModalOpen}
        onClose={() => setAddTaskModalOpen(false)}
        defaultDate={selectedDate || undefined}
      />

      {/* Add Goal Modal */}
      <AddGoalModal
        isOpen={addGoalModalOpen}
        onClose={() => setAddGoalModalOpen(false)}
      />

      {/* Goal Detail Modal */}
      {selectedGoalId && (() => {
        const freshGoal = [...getActiveGoals(), ...getCompletedGoals()].find(g => g.id === selectedGoalId)
        if (!freshGoal) return null
        return (
          <GoalDetailModal
            goal={freshGoal}
            isOpen={true}
            onClose={() => setSelectedGoalId(null)}
          />
        )
      })()}

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

export default CalendarPage
