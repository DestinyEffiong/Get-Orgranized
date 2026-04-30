/** @jsxImportSource theme-ui */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, CheckCircle2, Edit2, Save, Plus, ChevronDown, ChevronRight, Trash2, Pencil } from 'lucide-react'
import { useAuthStore, useGoalStore, useTaskStore } from '../stores'
import type { Goal, GoalCategory, Task } from '../types'
import EditTaskModal from './EditTaskModal'
import { categoryColors } from '../types/goal'

interface GoalDetailModalProps {
  goal: Goal
  isOpen: boolean
  onClose: () => void
  initialEditing?: boolean
}

const GoalDetailModal = ({ goal, isOpen, onClose, initialEditing }: GoalDetailModalProps) => {
  const { currentUser } = useAuthStore()
  const { updateGoal, completeGoal, createGoal, getSubGoals } = useGoalStore()
  const { getTasks, createTask, updateTask, deleteTask } = useTaskStore()
  const [isEditing, setIsEditing] = useState(initialEditing)
  const [title, setTitle] = useState(goal.title)
  const [description, setDescription] = useState(goal.description)
  const [category, setCategory] = useState<GoalCategory>(goal.category)
  const [targetDate, setTargetDate] = useState(
    goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sub goal form
  const [showAddSubGoal, setShowAddSubGoal] = useState(false)
  const [newSubGoalTitle, setNewSubGoalTitle] = useState('')
  const [newSubGoalDescription, setNewSubGoalDescription] = useState('')

  // Task form per sub goal
  const [addingTaskForSubGoal, setAddingTaskForSubGoal] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')

  // Expanded sub goals
  const [expandedSubGoals, setExpandedSubGoals] = useState<Set<string>>(new Set())
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    setTitle(goal.title)
    setDescription(goal.description)
    setCategory(goal.category)
    setTargetDate(goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '')
  }, [goal])

  if (!isOpen || !currentUser) return null

  const subGoals = getSubGoals(goal.id)
  const allTasks = getTasks()
  const colors = categoryColors[goal.category]
  const isOverdue = goal.targetDate && goal.targetDate < Date.now() && goal.status === 'active'

  // Get tasks for a specific sub goal
  const getTasksForSubGoal = (subGoalId: string) => {
    return allTasks.filter(t => t.goalId === subGoalId)
  }

  // Calculate sub goal progress (from its tasks)
  const getSubGoalProgress = (subGoalId: string) => {
    const tasks = getTasksForSubGoal(subGoalId)
    if (tasks.length === 0) return 0
    const done = tasks.filter(t => t.status === 'done').length
    return Math.round((done / tasks.length) * 100)
  }

  // Calculate overall goal progress (from sub goals)
  const getOverallProgress = () => {
    if (subGoals.length === 0) return 0
    const totalProgress = subGoals.reduce((sum, sg) => sum + getSubGoalProgress(sg.id), 0)
    return Math.round(totalProgress / subGoals.length)
  }

  const overallProgress = getOverallProgress()
  const completedSubGoals = subGoals.filter(sg => sg.status === 'completed').length

  const toggleExpand = (id: string) => {
    setExpandedSubGoals(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) return
    setIsSubmitting(true)
    try {
      await updateGoal(goal.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        targetDate: targetDate ? new Date(targetDate).getTime() : undefined
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update goal:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplete = async () => {
    if (confirm('Mark this goal as completed?')) {
      try {
        await completeGoal(goal.id)
        onClose()
      } catch (error) {
        console.error('Failed to complete goal:', error)
      }
    }
  }

  const handleAddSubGoal = async () => {
    if (!newSubGoalTitle.trim()) return
    try {
      const newSG = await createGoal({
        title: newSubGoalTitle.trim(),
        description: newSubGoalDescription.trim() || newSubGoalTitle.trim(),
        category: goal.category,
        parentGoalId: goal.id,
        userId: currentUser.id
      })
      setNewSubGoalTitle('')
      setNewSubGoalDescription('')
      setShowAddSubGoal(false)
      // Auto-expand the new sub goal
      setExpandedSubGoals(prev => new Set(prev).add(newSG.id))
    } catch (error) {
      console.error('Failed to create sub goal:', error)
    }
  }

  const handleAddTask = async (subGoalId: string) => {
    if (!newTaskTitle.trim()) return
    try {
      await createTask({
        title: newTaskTitle.trim(),
        userId: currentUser.id,
        goalId: subGoalId,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate).getTime() : undefined,
        priority: 'medium',
        isHabit: false
      })
      setNewTaskTitle('')
      setNewTaskDueDate('')
      setAddingTaskForSubGoal(null)
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done'
    await updateTask(taskId, { status: newStatus as any })
  }

  const handleCompleteSubGoal = async (subGoalId: string) => {
    await completeGoal(subGoalId)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return createPortal(
    <div
      onClick={handleBackdropClick}
      sx={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 3
      }}
    >
      <div sx={{
        background: 'surface',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Header */}
        <div sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          p: 4, pb: 3,
          borderBottom: '1px solid',
          borderColor: 'border',
          position: 'sticky', top: 0,
          background: 'surface', zIndex: 1,
          borderRadius: '12px 12px 0 0'
        }}>
          <div sx={{ flex: 1, pr: 2 }}>
            <div sx={{
              display: 'inline-block',
              px: 2, py: 1,
              background: colors.bg,
              color: colors.text,
              borderRadius: '6px',
              fontSize: 0,
              fontWeight: '600',
              textTransform: 'capitalize',
              mb: 2
            }}>
              {goal.category}
            </div>

            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{
                  width: '100%', fontSize: 3, fontWeight: 'bold', color: 'text',
                  border: '2px solid', borderColor: 'border', borderRadius: '8px', px: 2, py: 1,
                  outline: 'none', ':focus': { borderColor: 'primary' }
                }}
              />
            ) : (
              <h2 sx={{ fontSize: 3, fontWeight: 'bold', color: 'text', m: 0, lineHeight: 1.3 }}>
                {goal.title}
              </h2>
            )}
          </div>

          <div sx={{ display: 'flex', gap: 1 }}>
            {isEditing ? (
              <button onClick={handleSave} disabled={isSubmitting} sx={{
                background: 'primary', border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center',
                ':hover': { background: isSubmitting ? 'primary' : 'primaryHover' }
              }}>
                <Save size={20} color="white" />
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} sx={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center',
                ':hover': { background: 'surfaceAlt' }
              }}>
                <Edit2 size={20} color="#6B7280" />
              </button>
            )}
            <button onClick={onClose} sx={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center',
              ':hover': { background: 'surfaceAlt' }
            }}>
              <X size={20} color="#6B7280" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div sx={{ p: 4 }}>
          {/* Description */}
          <div sx={{ mb: 4 }}>
            {isEditing ? (
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} sx={{
                width: '100%', px: 3, py: 2, border: '2px solid', borderColor: 'border', borderRadius: '8px',
                fontSize: 1, outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                ':focus': { borderColor: 'primary' }
              }} />
            ) : (
              <p sx={{ fontSize: 1, color: 'muted', lineHeight: 1.6, m: 0 }}>
                {goal.description}
              </p>
            )}
          </div>

          {/* Target Date & Edit Category */}
          {isEditing && (
            <>
              <div sx={{ mb: 3 }}>
                <label sx={{ fontSize: 0, fontWeight: '600', color: 'muted', mb: 1, display: 'block' }}>Category</label>
                <div sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {(['work', 'personal', 'health', 'finance', 'learning', 'relationships', 'other'] as GoalCategory[]).map(cat => (
                    <button key={cat} type="button" onClick={() => setCategory(cat)} sx={{
                      px: 2, py: 1, border: '2px solid',
                      borderColor: category === cat ? categoryColors[cat].border : 'border',
                      borderRadius: '6px',
                      background: category === cat ? categoryColors[cat].bg : 'surface',
                      color: category === cat ? categoryColors[cat].text : 'muted',
                      fontSize: 0, fontWeight: '600', textTransform: 'capitalize', cursor: 'pointer',
                    }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div sx={{ mb: 4 }}>
                <label sx={{ fontSize: 0, fontWeight: '600', color: 'muted', mb: 1, display: 'block' }}>Target Date</label>
                <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} sx={{
                  width: '100%', px: 3, py: 2, border: '2px solid', borderColor: 'border', borderRadius: '8px',
                  fontSize: 1, outline: 'none', ':focus': { borderColor: 'primary' }
                }} />
              </div>
            </>
          )}

          {/* Overall Progress */}
          <div sx={{
            mb: 4, p: 3,
            background: 'background',
            borderRadius: '10px'
          }}>
            <div sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <span sx={{ fontSize: 1, fontWeight: '600', color: 'text' }}>Overall Progress</span>
              <span sx={{ fontSize: 2, fontWeight: 'bold', color: colors.text }}>{overallProgress}%</span>
            </div>
            <div sx={{ width: '100%', height: '10px', background: 'border', borderRadius: '5px', overflow: 'hidden', mb: 2 }}>
              <div sx={{ width: `${overallProgress}%`, height: '100%', background: colors.border, transition: 'width 0.3s ease' }} />
            </div>
            <div sx={{ fontSize: 0, color: 'muted' }}>
              {completedSubGoals}/{subGoals.length} sub goals completed
            </div>
          </div>

          {/* Sub Goals */}
          <div sx={{ mb: 4 }}>
            <div sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <h3 sx={{ fontSize: 2, fontWeight: '600', color: 'text', m: 0 }}>Sub Goals</h3>
              <button onClick={() => setShowAddSubGoal(!showAddSubGoal)} sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 3, py: 1,
                background: colors.bg, color: colors.text,
                border: 'none', borderRadius: '6px',
                fontSize: 0, fontWeight: '600', cursor: 'pointer',
                ':hover': { opacity: 0.8 }
              }}>
                <Plus size={14} />
                Add Sub Goal
              </button>
            </div>

            {/* Add Sub Goal Form */}
            {showAddSubGoal && (
              <div sx={{ mb: 3, p: 3, background: 'background', borderRadius: '8px', border: '1px solid', borderColor: 'border' }}>
                <input
                  type="text"
                  placeholder="Sub goal title (e.g., Learn TypeScript Types)"
                  value={newSubGoalTitle}
                  onChange={(e) => setNewSubGoalTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubGoal()}
                  autoFocus
                  sx={{
                    width: '100%', px: 3, py: 2, border: '1px solid', borderColor: 'border', borderRadius: '6px',
                    fontSize: 1, outline: 'none', mb: 2,
                    ':focus': { borderColor: colors.border }
                  }}
                />
                <input
                  type="text"
                  placeholder="Brief description (optional)"
                  value={newSubGoalDescription}
                  onChange={(e) => setNewSubGoalDescription(e.target.value)}
                  sx={{
                    width: '100%', px: 3, py: 2, border: '1px solid', borderColor: 'border', borderRadius: '6px',
                    fontSize: 0, outline: 'none', mb: 2, color: 'muted',
                    ':focus': { borderColor: colors.border }
                  }}
                />
                <div sx={{ display: 'flex', gap: 2 }}>
                  <button onClick={handleAddSubGoal} disabled={!newSubGoalTitle.trim()} sx={{
                    px: 3, py: 1, background: colors.border, color: 'white',
                    border: 'none', borderRadius: '6px', fontSize: 0, fontWeight: '600',
                    cursor: newSubGoalTitle.trim() ? 'pointer' : 'not-allowed',
                    opacity: newSubGoalTitle.trim() ? 1 : 0.5
                  }}>
                    Add
                  </button>
                  <button onClick={() => { setShowAddSubGoal(false); setNewSubGoalTitle(''); setNewSubGoalDescription('') }} sx={{
                    px: 3, py: 1, background: 'border', color: 'textSecondary',
                    border: 'none', borderRadius: '6px', fontSize: 0, fontWeight: '600', cursor: 'pointer'
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Sub Goals List */}
            {subGoals.length === 0 ? (
              <div sx={{
                textAlign: 'center', py: 4, px: 3,
                background: 'background', borderRadius: '8px',
                fontSize: 1, color: 'muted'
              }}>
                No sub goals yet. Break your goal into smaller milestones!
              </div>
            ) : (
              <div sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {subGoals.map(sg => {
                  const sgTasks = getTasksForSubGoal(sg.id)
                  const sgProgress = getSubGoalProgress(sg.id)
                  const sgDone = sgTasks.filter(t => t.status === 'done').length
                  const isExpanded = expandedSubGoals.has(sg.id)
                  // Furthest deadline from tasks under this sub goal
                  const sgDeadline = sgTasks.reduce<number | null>((max, t) => {
                    if (!t.dueDate) return max
                    return max === null ? t.dueDate : Math.max(max, t.dueDate)
                  }, null)

                  return (
                    <div key={sg.id} sx={{
                      border: '1px solid',
                      borderColor: 'border',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      background: sg.status === 'completed' ? 'successBg' : 'surface'
                    }}>
                      {/* Sub Goal Header */}
                      <div
                        onClick={() => toggleExpand(sg.id)}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 2,
                          p: 3, cursor: 'pointer',
                          ':hover': { background: 'background' }
                        }}
                      >
                        {isExpanded ? <ChevronDown size={16} color="#6B7280" /> : <ChevronRight size={16} color="#6B7280" />}

                        {sg.status === 'completed' ? (
                          <CheckCircle2 size={18} color="#10B981" />
                        ) : (
                          <div sx={{
                            width: '18px', height: '18px', borderRadius: '50%',
                            border: `2px solid ${colors.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '8px', fontWeight: 'bold', color: colors.text
                          }}>
                            {sgProgress > 0 && `${sgProgress}`}
                          </div>
                        )}

                        <div sx={{ flex: 1, minWidth: 0 }}>
                          <div sx={{
                            fontSize: 1, fontWeight: '600',
                            color: sg.status === 'completed' ? 'successDark' : 'text',
                            textDecoration: sg.status === 'completed' ? 'line-through' : 'none'
                          }}>
                            {sg.title}
                          </div>
                          <div sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: '2px' }}>
                            <span sx={{ fontSize: 0, color: 'textLight' }}>
                              {sgDone}/{sgTasks.length} tasks
                            </span>
                            {sgDeadline && (
                              <span sx={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: 0, color: sgDeadline < Date.now() ? 'danger' : 'textLight' }}>
                                <Calendar size={10} />
                                {new Date(sgDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mini progress bar */}
                        <div sx={{ width: '60px', height: '6px', background: 'border', borderRadius: '3px', overflow: 'hidden' }}>
                          <div sx={{
                            width: `${sgProgress}%`, height: '100%',
                            background: sg.status === 'completed' ? 'success' : colors.border,
                            transition: 'width 0.3s'
                          }} />
                        </div>

                        <span sx={{ fontSize: 0, fontWeight: '700', color: colors.text, minWidth: '30px', textAlign: 'right' }}>
                          {sgProgress}%
                        </span>
                      </div>

                      {/* Expanded: Tasks */}
                      {isExpanded && (
                        <div sx={{ borderTop: '1px solid', borderColor: 'border', px: 3, py: 2, background: 'surface' }}>
                          {sgTasks.length === 0 && addingTaskForSubGoal !== sg.id && (
                            <div sx={{ py: 2, fontSize: 0, color: 'textLight', textAlign: 'center' }}>
                              No tasks yet
                            </div>
                          )}

                          {sgTasks.map(task => (
                            <div key={task.id} sx={{
                              display: 'flex', alignItems: 'center', gap: 2,
                              py: '6px',
                              borderBottom: '1px solid',
                              borderColor: 'surfaceAlt',
                              ':last-child': { borderBottom: 'none' }
                            }}>
                              <input
                                type="checkbox"
                                checked={task.status === 'done'}
                                onChange={() => handleToggleTask(task.id, task.status)}
                                sx={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: colors.border }}
                              />
                              <span sx={{
                                flex: 1, fontSize: 0,
                                color: task.status === 'done' ? 'textLight' : 'text',
                                textDecoration: task.status === 'done' ? 'line-through' : 'none'
                              }}>
                                {task.title}
                              </span>
                              {task.dueDate && (
                                <span sx={{
                                  display: 'flex', alignItems: 'center', gap: '3px',
                                  fontSize: '10px', color: task.dueDate < Date.now() && task.status !== 'done' ? 'danger' : 'textLight',
                                  whiteSpace: 'nowrap'
                                }}>
                                  <Calendar size={10} />
                                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              {task.status !== 'done' && (
                                <button onClick={() => setEditingTask(task)} sx={{
                                  background: 'transparent', border: 'none', cursor: 'pointer',
                                  padding: '2px', borderRadius: '4px', display: 'flex',
                                  ':hover': { background: 'surfaceAlt' }
                                }}>
                                  <Pencil size={11} color="#6B7280" />
                                </button>
                              )}
                              <button onClick={() => deleteTask(task.id)} sx={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                padding: '2px', borderRadius: '4px', display: 'flex',
                                ':hover': { background: 'dangerBg' }
                              }}>
                                <Trash2 size={12} color="#EF4444" />
                              </button>
                            </div>
                          ))}

                          {/* Add Task Form */}
                          {addingTaskForSubGoal === sg.id ? (
                            <div sx={{ mt: 2 }}>
                              <div sx={{ display: 'flex', gap: 2 }}>
                                <input
                                  type="text"
                                  placeholder="Task name..."
                                  value={newTaskTitle}
                                  onChange={(e) => setNewTaskTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddTask(sg.id)
                                    if (e.key === 'Escape') { setAddingTaskForSubGoal(null); setNewTaskTitle(''); setNewTaskDueDate('') }
                                  }}
                                  autoFocus
                                  sx={{
                                    flex: 1, px: 2, py: 1, border: '1px solid', borderColor: 'border', borderRadius: '6px',
                                    fontSize: 0, outline: 'none',
                                    ':focus': { borderColor: colors.border }
                                  }}
                                />
                                <input
                                  type="date"
                                  value={newTaskDueDate}
                                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                                  min={new Date().toISOString().split('T')[0]}
                                  max={goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : undefined}
                                  sx={{
                                    px: 2, py: 1, border: '1px solid', borderColor: 'border', borderRadius: '6px',
                                    fontSize: 0, outline: 'none', color: newTaskDueDate ? 'text' : 'textLight',
                                    ':focus': { borderColor: colors.border }
                                  }}
                                />
                              </div>
                              <div sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                <button onClick={() => handleAddTask(sg.id)} disabled={!newTaskTitle.trim()} sx={{
                                  px: 2, py: 1, background: colors.border, color: 'white',
                                  border: 'none', borderRadius: '6px', fontSize: 0, fontWeight: '600',
                                  cursor: newTaskTitle.trim() ? 'pointer' : 'not-allowed',
                                  opacity: newTaskTitle.trim() ? 1 : 0.5
                                }}>
                                  Add
                                </button>
                                <button onClick={() => { setAddingTaskForSubGoal(null); setNewTaskTitle(''); setNewTaskDueDate('') }} sx={{
                                  px: 2, py: 1, background: 'border', color: 'textSecondary',
                                  border: 'none', borderRadius: '6px', fontSize: 0, cursor: 'pointer'
                                }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2 }}>
                              <button
                                onClick={() => { setAddingTaskForSubGoal(sg.id); setNewTaskTitle(''); setNewTaskDueDate('') }}
                                sx={{
                                  display: 'flex', alignItems: 'center', gap: 1,
                                  px: 2, py: 1,
                                  background: 'transparent', color: colors.text,
                                  border: `1px dashed ${colors.border}`, borderRadius: '6px',
                                  fontSize: 0, fontWeight: '600', cursor: 'pointer',
                                  ':hover': { background: colors.bg }
                                }}
                              >
                                <Plus size={12} />
                                Add Task
                              </button>

                              {sg.status === 'active' && sgProgress === 100 && sgTasks.length > 0 && (
                                <button
                                  onClick={() => handleCompleteSubGoal(sg.id)}
                                  sx={{
                                    display: 'flex', alignItems: 'center', gap: 1,
                                    px: 2, py: 1,
                                    background: 'successBg', color: 'successDark',
                                    border: 'none', borderRadius: '6px',
                                    fontSize: 0, fontWeight: '600', cursor: 'pointer',
                                    ':hover': { background: 'successBg' }
                                  }}
                                >
                                  <CheckCircle2 size={12} />
                                  Complete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Date info (non-edit mode) */}
          {!isEditing && (
            <div sx={{
              display: 'flex', alignItems: 'center', gap: 2,
              mb: 4, fontSize: 0, color: isOverdue ? 'danger' : 'textLight'
            }}>
              <Calendar size={14} />
              {goal.targetDate
                ? new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'No deadline'}
              {isOverdue && (
                <span sx={{ px: 2, py: 0, background: 'dangerBg', color: 'dangerSolid', borderRadius: '4px', fontWeight: '600' }}>
                  Overdue
                </span>
              )}
            </div>
          )}

          {/* Complete Goal Button */}
          {goal.status === 'active' && !isEditing && (
            <button onClick={handleComplete} sx={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
              px: 4, py: 3, background: 'success', color: '#FFFFFF',
              border: 'none', borderRadius: '8px', fontSize: 1, fontWeight: '600',
              cursor: 'pointer', ':hover': { background: 'successDark' }
            }}>
              <CheckCircle2 size={20} />
              Mark Goal as Completed
            </button>
          )}

          {goal.status === 'completed' && (
            <div sx={{ p: 3, background: 'successBg', borderRadius: '8px', textAlign: 'center' }}>
              <CheckCircle2 size={24} color="#10B981" />
              <div sx={{ fontSize: 1, fontWeight: '600', color: 'successDark', mt: 1 }}>Goal Completed!</div>
              {goal.completedAt && (
                <div sx={{ fontSize: 0, color: 'success' }}>
                  Completed on {new Date(goal.completedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={true}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>,
    document.body
  )
}

export default GoalDetailModal
