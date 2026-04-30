/** @jsxImportSource theme-ui */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Flag, Tag, ChevronDown } from 'lucide-react'
import { useAuthStore, useTaskStore } from '../stores'
import TagInput from './TagInput'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
}

const QuickAddModal = ({ isOpen, onClose }: QuickAddModalProps) => {
  const { currentUser } = useAuthStore()
  const { createTask } = useTaskStore()
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [tags, setTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  if (!isOpen || !currentUser) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)

    try {
      await createTask({
        title: title.trim(),
        description: '',
        priority,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        tags,
        userId: currentUser.id,
        isHabit: false
      })

      // Reset form
      setTitle('')
      setDueDate('')
      setPriority('medium')
      setTags([])
      setExpandedSection(null)
      onClose()
    } catch (err: any) {
      console.error('Failed to create task:', err)
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
          maxWidth: '400px',
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
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'border'
        }}>
          <h2 sx={{
            fontSize: 1,
            fontWeight: '600',
            color: 'text',
            m: 0
          }}>
            Quick Add Task
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
            <X size={18} color="#6B7280" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column' }}>
          <div sx={{ p: 3, pb: 2 }}>
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
                py: 1,
                border: 'none',
                fontSize: 2,
                fontWeight: '500',
                outline: 'none',
                mb: 2,
                '::placeholder': {
                  color: 'textLight',
                  fontWeight: '400'
                }
              }}
            />

            {/* Due Date */}
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` })()}
              sx={{
                width: '100%',
                px: 3,
                py: 2,
                mb: 2,
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

            {/* Option Chips Row */}
            <div sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              mb: 2
            }}>
              {/* Priority Chip */}
              <button
                type="button"
                onClick={() => toggleSection('priority')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: '8px',
                  py: '5px',
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
                <Flag size={12} />
                {priority}
                <ChevronDown size={11} sx={{ transform: expandedSection === 'priority' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* Tags Chip */}
              <button
                type="button"
                onClick={() => toggleSection('tags')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: '8px',
                  py: '5px',
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
                <Tag size={12} />
                {tags.length > 0 ? `${tags.length} tag${tags.length > 1 ? 's' : ''}` : 'Tags'}
                <ChevronDown size={11} sx={{ transform: expandedSection === 'tags' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            </div>

            {/* Expanded Sections */}
            {expandedSection === 'priority' && (
              <div sx={{
                mb: 2,
                p: 2,
                background: 'background',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: 'border'
              }}>
                <div sx={{ display: 'flex', gap: 1 }}>
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setPriority(p); setExpandedSection(null) }}
                      sx={{
                        flex: 1,
                        px: 2,
                        py: 1,
                        border: '2px solid',
                        borderColor: priority === p ? priorityColors[p].border : 'border',
                        borderRadius: '6px',
                        fontSize: 0,
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
                mb: 2,
                p: 2,
                background: 'background',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: 'border'
              }}>
                <TagInput selectedTags={tags} onChange={setTags} compact />
              </div>
            )}
          </div>

          {/* Actions */}
          <div sx={{
            display: 'flex',
            gap: 2,
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'border'
          }}>
            <button
              type="button"
              onClick={onClose}
              sx={{
                flex: 1,
                px: 3,
                py: 2,
                border: '1px solid',
                borderColor: 'border',
                borderRadius: '6px',
                fontSize: 0,
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
                flex: 1,
                px: 3,
                py: 2,
                border: 'none',
                borderRadius: '6px',
                fontSize: 0,
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
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default QuickAddModal
