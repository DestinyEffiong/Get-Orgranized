/** @jsxImportSource theme-ui */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, Flag, Bell, Target, Tag, ChevronDown } from 'lucide-react'
import { useTaskStore, useGoalStore } from '../stores'
import TagInput from './TagInput'
import type { Task } from '../types'

interface EditTaskModalProps {
  task: Task
  isOpen: boolean
  onClose: () => void
}

const toLocalDateTimeStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

const EditTaskModal = ({ task, isOpen, onClose }: EditTaskModalProps) => {
  const { updateTask } = useTaskStore()
  const { getActiveGoals, getSubGoals } = useGoalStore()
  const [title, setTitle] = useState(task.title)
  const [dueDate, setDueDate] = useState(
    task.dueDate ? toLocalDateTimeStr(new Date(task.dueDate)) : ''
  )
  const [reminder, setReminder] = useState(
    task.reminder ? toLocalDateTimeStr(new Date(task.reminder)) : ''
  )
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task.priority)
  const [tags, setTags] = useState<string[]>(task.tags || [])
  const [goalId, setGoalId] = useState(task.goalId || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  useEffect(() => {
    setTitle(task.title)
    setDueDate(task.dueDate ? toLocalDateTimeStr(new Date(task.dueDate)) : '')
    setReminder(task.reminder ? toLocalDateTimeStr(new Date(task.reminder)) : '')
    setPriority(task.priority)
    setTags(task.tags || [])
    setGoalId(task.goalId || '')
    setExpandedSection(null)
  }, [task])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('Please enter a task title')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await updateTask(task.id, {
        title: title.trim(),
        priority,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        reminder: reminder ? new Date(reminder).getTime() : undefined,
        tags,
        goalId: goalId || undefined,
      })

      onClose()
    } catch (err: any) {
      console.error('Failed to update task:', err)
      setError(err?.message || 'Failed to update task. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const priorityColors = {
    low: { bg: 'indigoBg', color: 'indigo', border: 'indigo' },
    medium: { bg: 'warningBg', color: 'warningDark', border: 'warningDark' },
    high: { bg: 'dangerBg', color: 'dangerSolid', border: 'dangerSolid' }
  }

  const topLevelGoals = getActiveGoals().filter(g => !g.parentGoalId)
  const selectedGoalTitle = goalId
    ? getActiveGoals().find(g => g.id === goalId)?.title
    : null

  return createPortal(
    <div
      onClick={handleBackdropClick}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 3
      }}
    >
      <div
        sx={{
          background: 'surface',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Header */}
        <div sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 4,
          py: 3,
          borderBottom: '1px solid',
          borderColor: 'border'
        }}>
          <h2 sx={{
            fontSize: 2,
            fontWeight: '600',
            color: 'text',
            m: 0
          }}>
            Edit Task
          </h2>
          <button
            onClick={onClose}
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
                background: 'surfaceAlt'
              }
            }}
          >
            <X size={20} color="#6B7280" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} sx={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div sx={{ p: 4, pb: 2 }}>
            {/* Task Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              sx={{
                width: '100%',
                px: 0,
                py: 2,
                border: 'none',
                fontSize: 3,
                fontWeight: '500',
                outline: 'none',
                mb: 3,
                '::placeholder': {
                  color: 'textLight',
                  fontWeight: '400'
                }
              }}
            />

            {/* Due Date */}
            <div sx={{ mb: 3 }}>
              <label sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: 1,
                fontWeight: '600',
                color: 'text',
                mb: 2
              }}>
                <Calendar size={16} />
                Due Date
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={toLocalDateTimeStr(new Date())}
                sx={{
                  width: '100%',
                  px: 3,
                  py: 2,
                  border: '1px solid',
                  borderColor: 'border',
                  borderRadius: '8px',
                  fontSize: 1,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  ':focus': {
                    borderColor: 'primary'
                  }
                }}
              />
            </div>

            {/* Option Chips Row */}
            <div sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              mb: 3
            }}>
              {/* Priority Chip */}
              <button
                type="button"
                onClick={() => toggleSection('priority')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: '10px',
                  py: '6px',
                  border: '1px solid',
                  borderColor: expandedSection === 'priority' ? priorityColors[priority].border : 'border',
                  borderRadius: '20px',
                  fontSize: 0,
                  fontWeight: '600',
                  background: expandedSection === 'priority' ? priorityColors[priority].bg : 'background',
                  color: expandedSection === 'priority' ? priorityColors[priority].color : 'muted',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize',
                  ':hover': { borderColor: 'textLight' }
                }}
              >
                <Flag size={13} />
                {priority}
                <ChevronDown size={12} sx={{ transform: expandedSection === 'priority' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* Tags Chip */}
              <button
                type="button"
                onClick={() => toggleSection('tags')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: '10px',
                  py: '6px',
                  border: '1px solid',
                  borderColor: expandedSection === 'tags' || tags.length > 0 ? 'primary' : 'border',
                  borderRadius: '20px',
                  fontSize: 0,
                  fontWeight: '600',
                  background: expandedSection === 'tags' || tags.length > 0 ? 'primaryBg' : 'background',
                  color: expandedSection === 'tags' || tags.length > 0 ? 'primary' : 'muted',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  ':hover': { borderColor: 'textLight' }
                }}
              >
                <Tag size={13} />
                {tags.length > 0 ? `${tags.length} tag${tags.length > 1 ? 's' : ''}` : 'Tags'}
                <ChevronDown size={12} sx={{ transform: expandedSection === 'tags' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* Goal Chip */}
              {topLevelGoals.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggleSection('goal')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: '10px',
                    py: '6px',
                    border: '1px solid',
                    borderColor: expandedSection === 'goal' || goalId ? 'success' : 'border',
                    borderRadius: '20px',
                    fontSize: 0,
                    fontWeight: '600',
                    background: expandedSection === 'goal' || goalId ? 'successBg' : 'background',
                    color: expandedSection === 'goal' || goalId ? 'successDark' : 'muted',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    maxWidth: '150px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    ':hover': { borderColor: 'textLight' }
                  }}
                >
                  <Target size={13} sx={{ flexShrink: 0 }} />
                  {selectedGoalTitle || 'Goal'}
                  <ChevronDown size={12} sx={{ flexShrink: 0, transform: expandedSection === 'goal' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              )}

              {/* Reminder Chip */}
              <button
                type="button"
                onClick={() => toggleSection('reminder')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: '10px',
                  py: '6px',
                  border: '1px solid',
                  borderColor: expandedSection === 'reminder' || reminder ? 'warning' : 'border',
                  borderRadius: '20px',
                  fontSize: 0,
                  fontWeight: '600',
                  background: expandedSection === 'reminder' || reminder ? 'warningBg' : 'background',
                  color: expandedSection === 'reminder' || reminder ? 'warningDark' : 'muted',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  ':hover': { borderColor: 'textLight' }
                }}
              >
                <Bell size={13} />
                {reminder ? 'Reminder set' : 'Reminder'}
                <ChevronDown size={12} sx={{ transform: expandedSection === 'reminder' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            </div>

            {/* Expanded Sections */}
            {expandedSection === 'priority' && (
              <div sx={{
                mb: 3,
                p: 3,
                background: 'background',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'border'
              }}>
                <div sx={{ display: 'flex', gap: 2 }}>
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setPriority(p); setExpandedSection(null) }}
                      sx={{
                        flex: 1,
                        px: 3,
                        py: 2,
                        border: '2px solid',
                        borderColor: priority === p ? priorityColors[p].border : 'border',
                        borderRadius: '8px',
                        fontSize: 1,
                        fontWeight: '600',
                        background: priority === p ? priorityColors[p].bg : 'surface',
                        color: priority === p ? priorityColors[p].color : 'muted',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textTransform: 'capitalize',
                        ':hover': {
                          borderColor: priorityColors[p].border
                        }
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {expandedSection === 'tags' && (
              <div sx={{
                mb: 3,
                p: 3,
                background: 'background',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'border'
              }}>
                <TagInput selectedTags={tags} onChange={setTags} />
              </div>
            )}

            {expandedSection === 'goal' && topLevelGoals.length > 0 && (
              <div sx={{
                mb: 3,
                p: 3,
                background: 'background',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'border'
              }}>
                <select
                  value={goalId}
                  onChange={(e) => { setGoalId(e.target.value); setExpandedSection(null) }}
                  sx={{
                    width: '100%',
                    px: 3,
                    py: 2,
                    border: '1px solid',
                    borderColor: 'border',
                    borderRadius: '8px',
                    fontSize: 1,
                    outline: 'none',
                    background: 'surface',
                    cursor: 'pointer',
                    ':focus': { borderColor: 'primary' }
                  }}
                >
                  <option value="">No goal</option>
                  {topLevelGoals.map(goal => {
                    const subGoals = getSubGoals(goal.id).filter(sg => sg.status === 'active')
                    return (
                      <optgroup key={goal.id} label={goal.title}>
                        <option value={goal.id}>{goal.title} (main goal)</option>
                        {subGoals.map(sg => (
                          <option key={sg.id} value={sg.id}>↳ {sg.title}</option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>
              </div>
            )}

            {expandedSection === 'reminder' && (
              <div sx={{
                mb: 3,
                p: 3,
                background: 'background',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'border'
              }}>
                <input
                  type="datetime-local"
                  value={reminder}
                  onChange={(e) => setReminder(e.target.value)}
                  min={toLocalDateTimeStr(new Date())}
                  sx={{
                    width: '100%',
                    px: 3,
                    py: 2,
                    border: '1px solid',
                    borderColor: 'border',
                    borderRadius: '8px',
                    fontSize: 1,
                    outline: 'none',
                    background: 'surface',
                    ':focus': { borderColor: 'primary' }
                  }}
                />
                <div sx={{ fontSize: 0, color: 'muted', mt: 1 }}>
                  Set a reminder to get notified before the due date
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div sx={{
              mx: 4,
              mb: 2,
              p: 2,
              background: 'dangerBg',
              color: 'dangerSolid',
              borderRadius: '8px',
              fontSize: 0,
              border: '1px solid #FCA5A5'
            }}>
              {error}
            </div>
          )}

          {/* Actions - pinned at bottom */}
          <div sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
            px: 4,
            py: 3,
            borderTop: '1px solid',
            borderColor: 'border'
          }}>
            <button
              type="button"
              onClick={onClose}
              sx={{
                px: 4,
                py: 2,
                border: '1px solid',
                borderColor: 'border',
                borderRadius: '8px',
                fontSize: 1,
                fontWeight: '600',
                background: 'surface',
                color: 'muted',
                cursor: 'pointer',
                transition: 'all 0.2s',
                ':hover': {
                  background: 'background'
                }
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              sx={{
                px: 4,
                py: 2,
                border: 'none',
                borderRadius: '8px',
                fontSize: 1,
                fontWeight: '600',
                background: 'primary',
                color: '#FFFFFF',
                cursor: title.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                opacity: title.trim() && !isSubmitting ? 1 : 0.5,
                transition: 'all 0.2s',
                ':hover': {
                  background: title.trim() && !isSubmitting ? 'primaryHover' : 'primary'
                }
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default EditTaskModal
