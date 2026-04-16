/** @jsxImportSource theme-ui */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar } from 'lucide-react'
import { useAuthStore, useGoalStore } from '../stores'
import type { GoalCategory } from '../types'
import { goalTemplates, categoryColors } from '../types/goal'

interface AddGoalModalProps {
  isOpen: boolean
  onClose: () => void
}

const AddGoalModal = ({ isOpen, onClose }: AddGoalModalProps) => {
  const { currentUser } = useAuthStore()
  const { createGoal } = useGoalStore()
  const [step, setStep] = useState<'template' | 'details'>('template')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GoalCategory>('personal')
  const [targetDate, setTargetDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !currentUser) return null

  const handleTemplateSelect = (templateId: string) => {
    const template = goalTemplates.find(t => t.id === templateId)
    if (template) {
      setTitle(template.title)
      setDescription(template.description)
      setCategory(template.category)
      setStep('details')
    }
  }

  const handleCustom = () => {
    setTitle('')
    setDescription('')
    setCategory('personal')
    setStep('details')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('Please enter a goal title')
      return
    }

    if (!description.trim()) {
      setError('Please enter a description')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await createGoal({
        title: title.trim(),
        description: description.trim(),
        category,
        targetDate: targetDate ? new Date(targetDate).getTime() : undefined,
        userId: currentUser.id
      })

      // Reset form
      setTitle('')
      setDescription('')
      setCategory('personal')
      setTargetDate('')
      setError('')
      setStep('template')
      onClose()
    } catch (err: any) {
      console.error('Failed to create goal:', err)
      setError(err?.message || 'Failed to create goal. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
      setStep('template')
    }
  }

  const handleClose = () => {
    setStep('template')
    setError('')
    onClose()
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
          maxWidth: step === 'template' ? '700px' : '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
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
          borderColor: 'border',
          position: 'sticky',
          top: 0,
          background: 'surface',
          zIndex: 1,
          borderRadius: '12px 12px 0 0'
        }}>
          <div>
            <h2 sx={{
              fontSize: 2,
              fontWeight: '600',
              color: 'text',
              m: 0,
              mb: 1
            }}>
              {step === 'template' ? 'Create a Goal' : 'Goal Details'}
            </h2>
            {step === 'template' && (
              <p sx={{
                fontSize: 0,
                color: 'muted',
                m: 0
              }}>
                Choose a template or start from scratch
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
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

        {/* Template Selection */}
        {step === 'template' && (
          <div sx={{ p: 4 }}>
            <div sx={{
              display: 'grid',
              gridTemplateColumns: ['1fr', '1fr 1fr', '1fr 1fr 1fr'],
              gap: 3
            }}>
              {goalTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  sx={{
                    background: 'surface',
                    border: '2px solid',
                    borderColor: 'border',
                    borderRadius: '12px',
                    p: 3,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    ':hover': {
                      borderColor: categoryColors[template.category].border,
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <div sx={{
                    fontSize: 5,
                    mb: 2
                  }}>
                    {template.icon}
                  </div>
                  <div sx={{
                    fontSize: 1,
                    fontWeight: '600',
                    color: 'text',
                    mb: 1
                  }}>
                    {template.title}
                  </div>
                  <div sx={{
                    fontSize: 0,
                    color: 'muted',
                    mb: 2
                  }}>
                    {template.description}
                  </div>
                  <div sx={{
                    display: 'inline-block',
                    px: 2,
                    py: 0,
                    background: categoryColors[template.category].bg,
                    color: categoryColors[template.category].text,
                    borderRadius: '4px',
                    fontSize: 0,
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {template.category}
                  </div>
                </button>
              ))}

              {/* Custom Goal */}
              <button
                onClick={handleCustom}
                sx={{
                  background: 'surface',
                  border: '2px dashed',
                  borderColor: 'borderMedium',
                  borderRadius: '12px',
                  p: 3,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  ':hover': {
                    borderColor: 'primary',
                    background: 'primaryBg'
                  }
                }}
              >
                <div sx={{
                  fontSize: 5,
                  mb: 2
                }}>
                  ✨
                </div>
                <div sx={{
                  fontSize: 1,
                  fontWeight: '600',
                  color: 'text',
                  mb: 1
                }}>
                  Custom Goal
                </div>
                <div sx={{
                  fontSize: 0,
                  color: 'muted'
                }}>
                  Start from scratch
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Goal Details Form */}
        {step === 'details' && (
          <form onSubmit={handleSubmit} sx={{ p: 4 }}>
            {/* Title */}
            <div sx={{ mb: 3 }}>
              <label sx={{
                display: 'block',
                fontSize: 1,
                fontWeight: '600',
                color: 'text',
                mb: 2
              }}>
                Goal Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you want to achieve?"
                autoFocus
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

            {/* Description */}
            <div sx={{ mb: 3 }}>
              <label sx={{
                display: 'block',
                fontSize: 1,
                fontWeight: '600',
                color: 'text',
                mb: 2
              }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your goal in detail..."
                rows={4}
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
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  ':focus': {
                    borderColor: 'primary'
                  }
                }}
              />
            </div>

            {/* Category */}
            <div sx={{ mb: 3 }}>
              <label sx={{
                display: 'block',
                fontSize: 1,
                fontWeight: '600',
                color: 'text',
                mb: 2
              }}>
                Category
              </label>
              <div sx={{
                display: 'grid',
                gridTemplateColumns: ['1fr 1fr', '1fr 1fr 1fr 1fr'],
                gap: 2
              }}>
                {(['work', 'personal', 'health', 'finance', 'learning', 'relationships', 'other'] as GoalCategory[]).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    sx={{
                      px: 2,
                      py: 2,
                      border: '2px solid',
                      borderColor: category === cat ? categoryColors[cat].border : 'border',
                      borderRadius: '8px',
                      background: category === cat ? categoryColors[cat].bg : 'surface',
                      color: category === cat ? categoryColors[cat].text : 'muted',
                      fontSize: 0,
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      ':hover': {
                        borderColor: categoryColors[cat].border
                      }
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Date */}
            <div sx={{ mb: 4 }}>
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
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
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

            {/* Error Message */}
            {error && (
              <div sx={{
                mb: 3,
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

            {/* Actions */}
            <div sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={() => setStep('template')}
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
                Back
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !description.trim() || isSubmitting}
                sx={{
                  px: 4,
                  py: 2,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: 1,
                  fontWeight: '600',
                  background: 'primary',
                  color: '#FFFFFF',
                  cursor: title.trim() && description.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                  opacity: title.trim() && description.trim() && !isSubmitting ? 1 : 0.5,
                  transition: 'all 0.2s',
                  ':hover': {
                    background: title.trim() && description.trim() && !isSubmitting ? 'primaryHover' : 'primary'
                  }
                }}
              >
                {isSubmitting ? 'Creating...' : 'Create Goal'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}

export default AddGoalModal
