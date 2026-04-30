/** @jsxImportSource theme-ui */
import { useState, useEffect } from 'react'
import { useAuthStore, useTaskStore } from '../stores'
import { useSidebar } from '../contexts'
import Sidebar from '../components/Sidebar'
import AddTaskModal from '../components/AddTaskModal'
import { Plus, X, Pencil, CheckSquare } from 'lucide-react'
import EditTaskModal from '../components/EditTaskModal'
import type { Task } from '../types'

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const TasksPage = () => {
  const { currentUser } = useAuthStore()
  const { sidebarWidth } = useSidebar()
  const { loadTasks, createTask, updateTask, deleteTask, toggleHabitCompletion, getHabits, getTasks } = useTaskStore()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newHabitTitle, setNewHabitTitle] = useState('')
  const [newHabitDays, setNewHabitDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })

  // Load tasks on mount
  useEffect(() => {
    if (currentUser) {
      loadTasks(currentUser.id)
    }
  }, [currentUser])

  if (!currentUser) return null

  // Get habits and regular tasks
  const habits = getHabits()
  const regularTasks = getTasks()

  // Get current week dates (Sunday to Saturday)
  const getWeekDates = () => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday
    const sunday = new Date(today)
    sunday.setDate(today.getDate() - dayOfWeek)
    sunday.setHours(0, 0, 0, 0)

    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday)
      date.setDate(sunday.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Calculate daily habit completion percentages
  const getDailyHabitCompletion = (date: Date) => {
    const dateStr = toLocalDateStr(date)
    if (habits.length === 0) return 0

    const completed = habits.filter(habit =>
      habit.habitCompletions && habit.habitCompletions[dateStr]
    ).length

    return Math.round((completed / habits.length) * 100)
  }

  // Calculate daily task completion percentages
  const getDailyTaskCompletion = (date: Date) => {
    const dateStr = toLocalDateStr(date)
    const tasksForDay = regularTasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = toLocalDateStr(new Date(task.dueDate))
      return taskDate === dateStr
    })

    if (tasksForDay.length === 0) return 0

    const completedTasks = tasksForDay.filter(task => task.status === 'done').length
    return Math.round((completedTasks / tasksForDay.length) * 100)
  }

  // Calculate overall weekly habit completion
  const getWeeklyHabitCompletion = () => {
    const totalHabitsPerWeek = habits.length * 7
    if (totalHabitsPerWeek === 0) return 0

    let totalCompleted = 0
    weekDates.forEach(date => {
      const dateStr = toLocalDateStr(date)
      habits.forEach(habit => {
        if (habit.habitCompletions && habit.habitCompletions[dateStr]) {
          totalCompleted++
        }
      })
    })

    return Math.round((totalCompleted / totalHabitsPerWeek) * 100)
  }

  // Calculate overall weekly task completion
  const getWeeklyTaskCompletion = () => {
    let totalTasks = 0
    let completedTasks = 0

    weekDates.forEach(date => {
      const dateStr = toLocalDateStr(date)
      const tasksForDay = regularTasks.filter(task => {
        if (!task.dueDate) return false
        const taskDate = toLocalDateStr(new Date(task.dueDate))
        return taskDate === dateStr
      })

      totalTasks += tasksForDay.length
      completedTasks += tasksForDay.filter(task => task.status === 'done').length
    })

    if (totalTasks === 0) return 0
    return Math.round((completedTasks / totalTasks) * 100)
  }

  // Handle habit checkbox toggle
  const handleHabitToggle = async (habitId: string, date: Date) => {
    const dateStr = toLocalDateStr(date)
    await toggleHabitCompletion(habitId, dateStr)
  }

  // Handle task completion toggle
  const handleTaskToggle = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done'
    await updateTask(taskId, { status: newStatus as any })
  }

  // Add new habit
  const handleAddHabit = async () => {
    if (!newHabitTitle.trim() || newHabitDays.length === 0) return

    await createTask({
      userId: currentUser.id,
      title: newHabitTitle,
      isHabit: true,
      habitDays: [...newHabitDays].sort(),
      priority: 'medium'
    })

    setNewHabitTitle('')
    setNewHabitDays([0, 1, 2, 3, 4, 5, 6])
    setShowAddHabit(false)
  }

  // Add new task
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return

    await createTask({
      userId: currentUser.id,
      title: newTaskTitle,
      isHabit: false,
      priority: 'medium',
      dueDate: selectedDay ? selectedDay.getTime() : undefined
    })

    setNewTaskTitle('')
    setShowAddTask(false)
  }

  // Handle day card click
  const handleDayClick = (date: Date) => {
    if (selectedDay && selectedDay.toDateString() === date.toDateString()) {
      setSelectedDay(null) // Deselect if clicking the same day
    } else {
      setSelectedDay(date)
    }
  }

  // Filter tasks by selected day
  const filteredTasks = selectedDay
    ? regularTasks.filter(task => {
        if (!task.dueDate) return false
        const taskDate = toLocalDateStr(new Date(task.dueDate))
        const selectedDate = toLocalDateStr(selectedDay)
        return taskDate === selectedDate
      })
    : regularTasks

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
          {/* Page Title */}
          <div sx={{ mb: 4 }}>
            <div sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1
            }}>
              <CheckSquare size={24} color="#1FA4FF" />
              <h1 sx={{
                fontSize: 4,
                fontWeight: 'bold',
                color: 'text',
                m: 0
              }}>
                Tasks & Habits
              </h1>
            </div>
            <p sx={{
              fontSize: 1,
              color: 'muted',
              m: 0
            }}>
              Track your daily habits and manage your tasks
            </p>
          </div>

          {/* Overall Progress Section - Split for Habits and Tasks */}
          <div sx={{
            background: 'surface',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
            p: 4,
            mb: 4
          }}>
            <h2 sx={{
              fontSize: 2,
              fontWeight: 'bold',
              color: 'text',
              mb: 3
            }}>
              Overall Progress
            </h2>

            <div sx={{
              display: 'grid',
              gridTemplateColumns: ['1fr', '1fr', '1fr 1fr'],
              gap: 4
            }}>
              {/* Habits Progress */}
              <div>
                <div sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3
                }}>
                  <h3 sx={{
                    fontSize: 1,
                    fontWeight: '600',
                    color: 'muted'
                  }}>
                    Habits
                  </h3>
                  <div sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <div sx={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: `conic-gradient(#1FA4FF ${getWeeklyHabitCompletion()}%, #E5E7EB ${getWeeklyHabitCompletion()}%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div sx={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'surface',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 1,
                        fontWeight: 'bold',
                        color: 'text'
                      }}>
                        {getWeeklyHabitCompletion()}%
                      </div>
                    </div>
                    <div sx={{
                      fontSize: 0,
                      color: 'muted'
                    }}>
                      {habits.filter(h => {
                        const today = toLocalDateStr(new Date())
                        return h.habitCompletions && h.habitCompletions[today]
                      }).length} / {habits.length} Done
                    </div>
                  </div>
                </div>

                {/* Habit Bar Chart */}
                <div sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 2
                }}>
                  {weekDates.map((date, index) => {
                    const completion = getDailyHabitCompletion(date)
                    const barHeight = Math.max(completion, 5) // Minimum 5px
                    return (
                      <div key={index} sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <div sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          height: '120px',
                          width: '100%'
                        }}>
                          <div sx={{
                            width: '100%',
                            height: `${barHeight}%`,
                            background: completion > 0 ? 'primary' : 'border',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s ease'
                          }} />
                        </div>
                        <div sx={{
                          fontSize: 0,
                          fontWeight: '600',
                          color: 'muted'
                        }}>
                          {dayNames[index]}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Tasks Progress */}
              <div>
                <div sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3
                }}>
                  <h3 sx={{
                    fontSize: 1,
                    fontWeight: '600',
                    color: 'muted'
                  }}>
                    Tasks
                  </h3>
                  <div sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <div sx={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: `conic-gradient(#10B981 ${getWeeklyTaskCompletion()}%, #E5E7EB ${getWeeklyTaskCompletion()}%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div sx={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'surface',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 1,
                        fontWeight: 'bold',
                        color: 'text'
                      }}>
                        {getWeeklyTaskCompletion()}%
                      </div>
                    </div>
                    <div sx={{
                      fontSize: 0,
                      color: 'muted'
                    }}>
                      {regularTasks.filter(t => t.status === 'done').length} / {regularTasks.length} Done
                    </div>
                  </div>
                </div>

                {/* Task Bar Chart */}
                <div sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 2
                }}>
                  {weekDates.map((date, index) => {
                    const completion = getDailyTaskCompletion(date)
                    const barHeight = Math.max(completion, 5) // Minimum 5px
                    return (
                      <div key={index} sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <div sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          height: '120px',
                          width: '100%'
                        }}>
                          <div sx={{
                            width: '100%',
                            height: `${barHeight}%`,
                            background: completion > 0 ? 'success' : 'border',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s ease'
                          }} />
                        </div>
                        <div sx={{
                          fontSize: 0,
                          fontWeight: '600',
                          color: 'muted'
                        }}>
                          {dayNames[index]}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Habit Cards */}
          <div sx={{
            display: 'grid',
            gridTemplateColumns: ['repeat(2, 1fr)', 'repeat(3, 1fr)', 'repeat(4, 1fr)', 'repeat(7, 1fr)'],
            gap: 3,
            mb: 4
          }}>
            {weekDates.map((date, index) => {
              const completion = getDailyHabitCompletion(date)
              const isToday = date.toDateString() === new Date().toDateString()

              return (
                <div
                  key={index}
                  sx={{
                    background: 'surface',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                    p: 3,
                    border: isToday ? '2px solid' : '2px solid transparent',
                    borderColor: isToday ? 'primary' : 'transparent'
                  }}>
                  <div sx={{
                    fontSize: 1,
                    fontWeight: 'bold',
                    color: 'text',
                    mb: 1,
                    textAlign: 'center'
                  }}>
                    {dayNames[index]}day
                  </div>
                  <div sx={{
                    fontSize: 0,
                    color: 'muted',
                    mb: 2,
                    textAlign: 'center'
                  }}>
                    {date.toLocaleDateString('en-GB')}
                  </div>
                  <div sx={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: `conic-gradient(#1FA4FF ${completion}%, #E5E7EB ${completion}%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto'
                  }}>
                    <div sx={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'surface',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 2,
                      fontWeight: 'bold',
                      color: 'text'
                    }}>
                      {completion}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Habit Tracker Grid */}
          <div sx={{
            background: 'surface',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
            p: 4,
            mb: 4
          }}>
            <div sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <h2 sx={{
                fontSize: 2,
                fontWeight: 'bold',
                color: 'text'
              }}>
                Habit Tracker
              </h2>
              <button
                onClick={() => setShowAddHabit(!showAddHabit)}
                sx={{
                  px: 3,
                  py: 1,
                  background: 'primary',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: 0,
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  transition: 'background 0.2s',
                  ':hover': {
                    background: 'primaryHover'
                  }
                }}
              >
                <Plus size={16} />
                Add Habit
              </button>
            </div>

            {/* Add Habit Form */}
            {showAddHabit && (
              <div sx={{
                mb: 3,
                p: 3,
                background: 'background',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: 'border'
              }}>
                {/* Habit name */}
                <input
                  type="text"
                  placeholder="Enter habit name..."
                  value={newHabitTitle}
                  onChange={(e) => setNewHabitTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()}
                  autoFocus
                  sx={{
                    width: '100%',
                    px: 3,
                    py: 2,
                    border: '1px solid',
                    borderColor: 'border',
                    borderRadius: '6px',
                    fontSize: 1,
                    outline: 'none',
                    background: 'surface',
                    color: 'text',
                    transition: 'border-color 0.2s',
                    ':focus': { borderColor: 'primary' }
                  }}
                />

                {/* Target days */}
                <div sx={{ mt: 3 }}>
                  <p sx={{ fontSize: 0, color: 'muted', mb: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Target days
                  </p>
                  <div sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map((label, idx) => {
                      const active = newHabitDays.includes(idx)
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setNewHabitDays(prev =>
                              prev.includes(idx)
                                ? prev.filter(d => d !== idx)
                                : [...prev, idx]
                            )
                          }}
                          sx={{
                            px: 2,
                            py: 1,
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: active ? 'primary' : 'border',
                            background: active ? 'primary' : 'transparent',
                            color: active ? '#FFFFFF' : 'muted',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            minWidth: '36px',
                            ':hover': {
                              borderColor: 'primary',
                              color: active ? '#FFFFFF' : 'primary'
                            }
                          }}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  {newHabitDays.length === 0 && (
                    <p sx={{ fontSize: 0, color: 'danger', mt: 1 }}>Select at least one day</p>
                  )}
                </div>

                {/* Actions */}
                <div sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <button
                    onClick={handleAddHabit}
                    disabled={!newHabitTitle.trim() || newHabitDays.length === 0}
                    sx={{
                      px: 3,
                      py: 1,
                      background: 'primary',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: 0,
                      fontWeight: '600',
                      cursor: 'pointer',
                      opacity: (!newHabitTitle.trim() || newHabitDays.length === 0) ? 0.5 : 1,
                      ':hover': { background: 'primaryHover' }
                    }}
                  >
                    Add Habit
                  </button>
                  <button
                    onClick={() => {
                      setShowAddHabit(false)
                      setNewHabitTitle('')
                      setNewHabitDays([0, 1, 2, 3, 4, 5, 6])
                    }}
                    sx={{
                      px: 3,
                      py: 1,
                      background: 'transparent',
                      color: 'muted',
                      border: '1px solid',
                      borderColor: 'border',
                      borderRadius: '6px',
                      fontSize: 0,
                      fontWeight: '600',
                      cursor: 'pointer',
                      ':hover': { background: 'border' }
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Habit Grid */}
            <div sx={{
              overflowX: 'auto'
            }}>
              <table sx={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr>
                    <th sx={{
                      textAlign: 'left',
                      p: 2,
                      fontSize: 0,
                      fontWeight: '600',
                      color: 'muted',
                      borderBottom: '2px solid',
                      borderBottomColor: 'border',
                      minWidth: '200px'
                    }}>
                      Habit
                    </th>
                    {weekDates.map((_, index) => (
                      <th key={index} sx={{
                        textAlign: 'center',
                        p: 2,
                        fontSize: 0,
                        fontWeight: '600',
                        color: 'muted',
                        borderBottom: '2px solid',
                        borderBottomColor: 'border',
                        minWidth: '40px'
                      }}>
                        {dayNames[index]}
                      </th>
                    ))}
                    <th sx={{
                      width: '40px',
                      borderBottom: '2px solid',
                      borderBottomColor: 'border'
                    }} />
                  </tr>
                </thead>
                <tbody>
                  {habits.map(habit => (
                    <tr key={habit.id}>
                      <td sx={{
                        p: 2,
                        fontSize: 1,
                        color: 'text',
                        borderBottom: '1px solid',
                        borderBottomColor: 'border'
                      }}>
                        {habit.title}
                      </td>
                      {weekDates.map((date, index) => {
                        const dateStr = toLocalDateStr(date)
                        const isCompleted = habit.habitCompletions && habit.habitCompletions[dateStr]
                        const isTargetDay = !habit.habitDays || habit.habitDays.includes(date.getDay())

                        return (
                          <td key={index} sx={{
                            textAlign: 'center',
                            p: 2,
                            borderBottom: '1px solid',
                            borderBottomColor: 'border',
                            background: isTargetDay ? 'transparent' : 'rgba(0,0,0,0.02)'
                          }}>
                            {isTargetDay ? (
                              <input
                                type="checkbox"
                                checked={isCompleted || false}
                                onChange={() => handleHabitToggle(habit.id, date)}
                                sx={{
                                  width: '20px',
                                  height: '20px',
                                  cursor: 'pointer',
                                  accentColor: 'primary'
                                }}
                              />
                            ) : (
                              <span sx={{ color: 'border', fontSize: 1, userSelect: 'none' }}>—</span>
                            )}
                          </td>
                        )
                      })}
                      <td sx={{
                        textAlign: 'center',
                        p: 2,
                        borderBottom: '1px solid',
                        borderBottomColor: 'border'
                      }}>
                        <button
                          onClick={() => deleteTask(habit.id)}
                          sx={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'danger',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            ':hover': {
                              background: 'dangerBg'
                            }
                          }}
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {habits.length === 0 && (
                    <tr>
                      <td colSpan={9} sx={{
                        textAlign: 'center',
                        p: 4,
                        color: 'muted',
                        fontSize: 1
                      }}>
                        No habits yet. Click "Add Habit" to get started!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Task Cards - Clickable */}
          <div sx={{
            display: 'grid',
            gridTemplateColumns: ['repeat(2, 1fr)', 'repeat(3, 1fr)', 'repeat(4, 1fr)', 'repeat(7, 1fr)'],
            gap: 3,
            mb: 4
          }}>
            {weekDates.map((date, index) => {
              const completion = getDailyTaskCompletion(date)
              const isToday = date.toDateString() === new Date().toDateString()
              const isSelected = selectedDay && selectedDay.toDateString() === date.toDateString()

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(date)}
                  sx={{
                    background: 'surface',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                    p: 3,
                    border: (isToday || isSelected) ? '2px solid' : '2px solid transparent',
                    borderColor: (isToday || isSelected) ? 'success' : 'transparent',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    ':hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }
                  }}>
                  <div sx={{
                    fontSize: 1,
                    fontWeight: 'bold',
                    color: 'text',
                    mb: 1,
                    textAlign: 'center'
                  }}>
                    {dayNames[index]}day
                  </div>
                  <div sx={{
                    fontSize: 0,
                    color: 'muted',
                    mb: 2,
                    textAlign: 'center'
                  }}>
                    {date.toLocaleDateString('en-GB')}
                  </div>
                  <div sx={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: `conic-gradient(#10B981 ${completion}%, #E5E7EB ${completion}%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto'
                  }}>
                    <div sx={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'surface',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 2,
                      fontWeight: 'bold',
                      color: 'text'
                    }}>
                      {completion}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tasks Section */}
          <div sx={{
            background: 'surface',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
            p: 4
          }}>
            <div sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <div>
                <h2 sx={{
                  fontSize: 2,
                  fontWeight: 'bold',
                  color: 'text'
                }}>
                  Tasks
                </h2>
                {selectedDay && (
                  <p sx={{
                    fontSize: 0,
                    color: 'muted',
                    mt: 1
                  }}>
                    Showing tasks for {selectedDay.toLocaleDateString('en-GB')}
                    <button
                      onClick={() => setSelectedDay(null)}
                      sx={{
                        ml: 2,
                        px: 2,
                        py: 1,
                        background: 'border',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: 0,
                        cursor: 'pointer',
                        ':hover': {
                          background: 'borderMedium'
                        }
                      }}
                    >
                      Show All
                    </button>
                  </p>
                )}
              </div>
              <button
                onClick={() => setAddTaskModalOpen(true)}
                sx={{
                  px: 3,
                  py: 1,
                  background: 'success',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: 0,
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  transition: 'background 0.2s',
                  ':hover': {
                    background: 'successDark'
                  }
                }}
              >
                <Plus size={16} />
                Add Task
              </button>
            </div>

            {/* Add Task Form */}
            {showAddTask && (
              <div sx={{
                mb: 3,
                p: 3,
                background: 'background',
                borderRadius: '8px'
              }}>
                <input
                  type="text"
                  placeholder="Enter task name..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                  sx={{
                    width: '100%',
                    px: 3,
                    py: 2,
                    border: '1px solid',
                    borderColor: 'border',
                    borderRadius: '6px',
                    fontSize: 1,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    ':focus': {
                      borderColor: 'success'
                    }
                  }}
                />
                {selectedDay && (
                  <div sx={{
                    mt: 2,
                    fontSize: 0,
                    color: 'muted'
                  }}>
                    Due date: {selectedDay.toLocaleDateString('en-GB')}
                  </div>
                )}
                <div sx={{
                  display: 'flex',
                  gap: 2,
                  mt: 2
                }}>
                  <button
                    onClick={handleAddTask}
                    sx={{
                      px: 3,
                      py: 1,
                      background: 'success',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: 0,
                      fontWeight: '600',
                      cursor: 'pointer',
                      ':hover': {
                        background: 'successDark'
                      }
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTask(false)
                      setNewTaskTitle('')
                    }}
                    sx={{
                      px: 3,
                      py: 1,
                      background: 'border',
                      color: 'text',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: 0,
                      fontWeight: '600',
                      cursor: 'pointer',
                      ':hover': {
                        background: 'borderMedium'
                      }
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Tasks List */}
            <div>
              {filteredTasks.map(task => (
                <div key={task.id} sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderBottom: '1px solid',
                  borderBottomColor: 'border',
                  ':last-child': {
                    borderBottom: 'none'
                  }
                }}>
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={() => handleTaskToggle(task.id, task.status)}
                    sx={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: 'success'
                    }}
                  />
                  <div sx={{
                    flex: 1,
                    fontSize: 1,
                    color: task.status === 'done' ? 'muted' : 'text',
                    textDecoration: task.status === 'done' ? 'line-through' : 'none'
                  }}>
                    {task.title}
                    {task.dueDate && (
                      <span sx={{
                        ml: 2,
                        fontSize: 0,
                        color: 'muted'
                      }}>
                        ({new Date(task.dueDate).toLocaleDateString('en-GB')})
                      </span>
                    )}
                  </div>
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
                        justifyContent: 'center',
                        ':hover': {
                          background: 'surfaceAlt'
                        }
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteTask(task.id)}
                    sx={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'danger',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ':hover': {
                        background: 'dangerBg'
                      }
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {filteredTasks.length === 0 && (
                <div sx={{
                  textAlign: 'center',
                  p: 4,
                  color: 'muted',
                  fontSize: 1
                }}>
                  {selectedDay
                    ? `No tasks for ${selectedDay.toLocaleDateString('en-GB')}. Click "Add Task" to create one!`
                    : 'No tasks yet. Click "Add Task" to get started!'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={addTaskModalOpen}
        onClose={() => setAddTaskModalOpen(false)}
        defaultDate={selectedDay || undefined}
      />

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

export default TasksPage
