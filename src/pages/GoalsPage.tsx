/** @jsxImportSource theme-ui */
import { useState, useEffect } from 'react'
import { Plus, Target, Calendar, CheckCircle2, Trash2 } from 'lucide-react'
import { useAuthStore, useGoalStore, useTaskStore } from '../stores'
import { useSidebar } from '../contexts'
import Sidebar from '../components/Sidebar'
import AddGoalModal from '../components/AddGoalModal'
import GoalDetailModal from '../components/GoalDetailModal'
import type { Goal, GoalCategory } from '../types'
import { categoryColors } from '../types/goal'

const GoalsPage = () => {
  const { currentUser } = useAuthStore()
  const { sidebarWidth } = useSidebar()
  const { loadGoals, getActiveGoals, getCompletedGoals, getSubGoals, deleteGoal } = useGoalStore()
  const { getTasks } = useTaskStore()
  const [addGoalModalOpen, setAddGoalModalOpen] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<GoalCategory | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<'active' | 'completed' | 'all'>('active')

  useEffect(() => {
    if (currentUser) {
      loadGoals(currentUser.id)
    }
  }, [currentUser, loadGoals])

  if (!currentUser) return null
  
  const activeGoals = getActiveGoals().filter(g => !g.parentGoalId)
  const completedGoals = getCompletedGoals().filter(g => !g.parentGoalId)

  const displayGoals = filterStatus === 'active'
    ? activeGoals
    : filterStatus === 'completed'
    ? completedGoals
    : [...activeGoals, ...completedGoals]

  const filteredGoals = filterCategory === 'all'
    ? displayGoals
    : displayGoals.filter(goal => goal.category === filterCategory)

  const allTasks = getTasks()

  // Progress based on sub-goal hierarchy: tasks → sub goals → main goal
  const getProgressPercentage = (goal: Goal) => {
    const subGoals = getSubGoals(goal.id)
    if (subGoals.length === 0) {
      // No sub goals - fall back to direct task progress
      const linked = allTasks.filter(t => t.goalId === goal.id)
      if (linked.length === 0) return 0
      return Math.round((linked.filter(t => t.status === 'done').length / linked.length) * 100)
    }
    // Average progress across sub goals
    const totalProgress = subGoals.reduce((sum, sg) => {
      const sgTasks = allTasks.filter(t => t.goalId === sg.id)
      if (sgTasks.length === 0) return sum
      return sum + Math.round((sgTasks.filter(t => t.status === 'done').length / sgTasks.length) * 100)
    }, 0)
    return Math.round(totalProgress / subGoals.length)
  }

  const handleDeleteGoal = async (goalId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteGoal(goalId)
      } catch (error) {
        console.error('Failed to delete goal:', error)
      }
    }
  }

  const categories: Array<{ value: GoalCategory | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'work', label: 'Work' },
    { value: 'personal', label: 'Personal' },
    { value: 'health', label: 'Health' },
    { value: 'finance', label: 'Finance' },
    { value: 'learning', label: 'Learning' },
    { value: 'relationships', label: 'Relationships' },
    { value: 'other', label: 'Other' }
  ]

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
            <div>
              <div sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 1
              }}>
                <Target size={24} color="#1FA4FF" />
                <h1 sx={{
                  fontSize: 4,
                  fontWeight: 'bold',
                  color: 'text',
                  m: 0
                }}>
                  Goals
                </h1>
              </div>
              <p sx={{
                fontSize: 1,
                color: 'muted',
                m: 0
              }}>
                Track your progress and achieve your dreams
              </p>
            </div>

            <button
              onClick={() => setAddGoalModalOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 4,
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
              <Plus size={20} />
              Add Goal
            </button>
          </div>

          {/* Stats */}
          <div sx={{
            display: 'grid',
            gridTemplateColumns: ['1fr', '1fr 1fr', '1fr 1fr 1fr'],
            gap: 3,
            mb: 4
          }}>
            <div sx={{
              background: 'surface',
              borderRadius: '12px',
              p: 3,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
            }}>
              <div sx={{
                fontSize: 3,
                fontWeight: 'bold',
                color: 'text',
                mb: 1
              }}>
                {activeGoals.length}
              </div>
              <div sx={{
                fontSize: 1,
                color: 'muted'
              }}>
                Active Goals
              </div>
            </div>

            <div sx={{
              background: 'surface',
              borderRadius: '12px',
              p: 3,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
            }}>
              <div sx={{
                fontSize: 3,
                fontWeight: 'bold',
                color: 'text',
                mb: 1
              }}>
                {completedGoals.length}
              </div>
              <div sx={{
                fontSize: 1,
                color: 'muted'
              }}>
                Completed
              </div>
            </div>

            <div sx={{
              background: 'surface',
              borderRadius: '12px',
              p: 3,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
            }}>
              <div sx={{
                fontSize: 3,
                fontWeight: 'bold',
                color: 'text',
                mb: 1
              }}>
                {activeGoals.length + completedGoals.length}
              </div>
              <div sx={{
                fontSize: 1,
                color: 'muted'
              }}>
                Total Goals
              </div>
            </div>
          </div>

          {/* Filters */}
          <div sx={{
            background: 'surface',
            borderRadius: '12px',
            p: 3,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
            mb: 4
          }}>
            <div sx={{
              display: 'flex',
              flexDirection: ['column', 'row'],
              gap: 3,
              alignItems: ['stretch', 'center'],
              justifyContent: 'space-between'
            }}>
              {/* Status Filter */}
              <div sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setFilterStatus('active')}
                  sx={{
                    px: 3,
                    py: 1,
                    border: '2px solid',
                    borderColor: filterStatus === 'active' ? 'primary' : 'border',
                    borderRadius: '8px',
                    background: filterStatus === 'active' ? 'primaryBg' : 'surface',
                    color: filterStatus === 'active' ? 'primary' : 'muted',
                    fontSize: 0,
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterStatus('completed')}
                  sx={{
                    px: 3,
                    py: 1,
                    border: '2px solid',
                    borderColor: filterStatus === 'completed' ? 'success' : 'border',
                    borderRadius: '8px',
                    background: filterStatus === 'completed' ? 'successBg' : 'surface',
                    color: filterStatus === 'completed' ? 'success' : 'muted',
                    fontSize: 0,
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Completed
                </button>
                <button
                  onClick={() => setFilterStatus('all')}
                  sx={{
                    px: 3,
                    py: 1,
                    border: '2px solid',
                    borderColor: filterStatus === 'all' ? 'muted' : 'border',
                    borderRadius: '8px',
                    background: filterStatus === 'all' ? 'surfaceAlt' : 'surface',
                    color: filterStatus === 'all' ? 'text' : 'muted',
                    fontSize: 0,
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  All
                </button>
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as GoalCategory | 'all')}
                sx={{
                  px: 3,
                  py: 2,
                  border: '2px solid',
                  borderColor: 'border',
                  borderRadius: '8px',
                  fontSize: 0,
                  fontWeight: '600',
                  color: 'text',
                  cursor: 'pointer',
                  outline: 'none',
                  background: 'surface',
                  ':focus': {
                    borderColor: 'primary'
                  }
                }}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Goals Grid */}
          {filteredGoals.length === 0 ? (
            <div sx={{
              background: 'surface',
              borderRadius: '12px',
              p: 6,
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
            }}>
              <Target size={48} color="#D1D5DB" sx={{ mx: 'auto', mb: 3 }} />
              <div sx={{
                fontSize: 2,
                fontWeight: '600',
                color: 'text',
                mb: 2
              }}>
                No goals yet
              </div>
              <div sx={{
                fontSize: 1,
                color: 'muted',
                mb: 3
              }}>
                Start by creating your first goal to track your progress
              </div>
              <button
                onClick={() => setAddGoalModalOpen(true)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 4,
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
                <Plus size={20} />
                Create Your First Goal
              </button>
            </div>
          ) : (
            <div sx={{
              display: 'grid',
              gridTemplateColumns: ['1fr', '1fr 1fr', '1fr 1fr 1fr'],
              gap: 4
            }}>
              {filteredGoals.map(goal => {
                const progress = getProgressPercentage(goal)
                const colors = categoryColors[goal.category]
                const isOverdue = goal.targetDate && goal.targetDate < Date.now() && goal.status === 'active'

                return (
                  <div
                    key={goal.id}
                    onClick={() => setSelectedGoalId(goal.id)}
                    sx={{
                      background: 'surface',
                      borderRadius: '12px',
                      p: 4,
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: '2px solid',
                      borderColor: 'transparent',
                      ':hover': {
                        borderColor: colors.border,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                  >
                    {/* Category Badge */}
                    <div sx={{
                      display: 'inline-block',
                      px: 2,
                      py: 1,
                      background: colors.bg,
                      color: colors.text,
                      borderRadius: '6px',
                      fontSize: 0,
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      mb: 3
                    }}>
                      {goal.category}
                    </div>

                    {/* Title */}
                    <h3 sx={{
                      fontSize: 2,
                      fontWeight: 'bold',
                      color: 'text',
                      mb: 2,
                      lineHeight: 1.3
                    }}>
                      {goal.title}
                    </h3>

                    {/* Description */}
                    <p sx={{
                      fontSize: 1,
                      color: 'muted',
                      mb: 3,
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {goal.description}
                    </p>

                    {/* Progress Bar */}
                    <div sx={{ mb: 3 }}>
                      <div sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1
                      }}>
                        <span sx={{
                          fontSize: 0,
                          color: 'muted',
                          fontWeight: '600'
                        }}>
                          Progress
                        </span>
                        <span sx={{
                          fontSize: 0,
                          color: colors.text,
                          fontWeight: '700'
                        }}>
                          {progress}%
                        </span>
                      </div>
                      <div sx={{
                        width: '100%',
                        height: '8px',
                        background: 'border',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div sx={{
                          width: `${progress}%`,
                          height: '100%',
                          background: colors.border,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pt: 2,
                      borderTop: '1px solid',
                      borderTopColor: 'border'
                    }}>
                      {goal.targetDate ? (
                        <div sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          fontSize: 0,
                          color: isOverdue ? 'danger' : 'muted'
                        }}>
                          <Calendar size={14} />
                          {new Date(goal.targetDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      ) : (
                        <div sx={{ fontSize: 0, color: 'textLight' }}>No deadline</div>
                      )}

                      <div sx={{
                        display: 'flex',
                        gap: 1
                      }}>
                        {goal.status === 'completed' && (
                          <CheckCircle2 size={20} color="#10B981" />
                        )}
                        <button
                          onClick={(e) => handleDeleteGoal(goal.id, e)}
                          sx={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'background 0.2s',
                            ':hover': {
                              background: 'dangerBg'
                            }
                          }}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddGoalModal
        isOpen={addGoalModalOpen}
        onClose={() => setAddGoalModalOpen(false)}
      />

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
    </div>
  )
}

export default GoalsPage
