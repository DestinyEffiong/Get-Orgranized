/** @jsxImportSource theme-ui */
import { useState, useEffect } from 'react'
import { Trash2, RotateCcw, AlertTriangle, CheckSquare, Target, Square, CheckSquare2 } from 'lucide-react'
import { useAuthStore, useTaskStore, useGoalStore } from '../stores'
import { useSidebar } from '../contexts'
import Sidebar from '../components/Sidebar'
import type { Task, Goal } from '../types'

type TrashTab = 'tasks' | 'goals'

const TrashPage = () => {
  const { currentUser } = useAuthStore()
  const { sidebarWidth } = useSidebar()
  const { deletedTasks, loadDeletedTasks, restoreTask, permanentDeleteTask } = useTaskStore()
  const { deletedGoals, loadDeletedGoals, restoreGoal, permanentDeleteGoal } = useGoalStore()
  const [activeTab, setActiveTab] = useState<TrashTab>('tasks')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  useEffect(() => {
    if (currentUser) {
      loadDeletedTasks(currentUser.id)
      loadDeletedGoals(currentUser.id)
    }
  }, [currentUser, loadDeletedTasks, loadDeletedGoals])

  // Clear selection when switching tabs
  useEffect(() => {
    setSelectedIds(new Set())
    setShowBulkConfirm(false)
  }, [activeTab])

  if (!currentUser) return null

  const currentItems = activeTab === 'tasks' ? deletedTasks : deletedGoals
  const allSelected = currentItems.length > 0 && selectedIds.size === currentItems.length

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setShowBulkConfirm(false)
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(currentItems.map(item => item.id)))
    }
    setShowBulkConfirm(false)
  }

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true)
    try {
      const ids = Array.from(selectedIds)
      for (const id of ids) {
        if (activeTab === 'tasks') {
          await permanentDeleteTask(id)
        } else {
          await permanentDeleteGoal(id)
        }
      }
      setSelectedIds(new Set())
      setShowBulkConfirm(false)
    } catch (error) {
      console.error('Failed to bulk delete:', error)
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkRestore = async () => {
    try {
      const ids = Array.from(selectedIds)
      for (const id of ids) {
        if (activeTab === 'tasks') {
          await restoreTask(id)
        } else {
          await restoreGoal(id)
        }
      }
      setSelectedIds(new Set())
    } catch (error) {
      console.error('Failed to bulk restore:', error)
    }
  }

  const formatDeletedDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const totalItems = deletedTasks.length + deletedGoals.length

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
          maxWidth: '900px',
          mx: 'auto'
        }}>
          {/* Header */}
          <div sx={{ mb: 4 }}>
            <div sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1
            }}>
              <Trash2 size={28} color="#EF4444" />
              <h1 sx={{
                fontSize: 4,
                fontWeight: 'bold',
                color: 'text',
                m: 0
              }}>
                Trash
              </h1>
            </div>
            <p sx={{
              fontSize: 1,
              color: 'muted',
              m: 0
            }}>
              {totalItems === 0
                ? 'Trash is empty'
                : `${totalItems} item${totalItems !== 1 ? 's' : ''} in trash`}
            </p>
          </div>

          {/* Tabs */}
          <div sx={{
            display: 'flex',
            gap: 0,
            mb: 4,
            borderBottom: '2px solid',
            borderColor: 'border'
          }}>
            <button
              onClick={() => setActiveTab('tasks')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 4,
                py: 2,
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid',
                borderColor: activeTab === 'tasks' ? 'primary' : 'transparent',
                color: activeTab === 'tasks' ? 'primary' : 'muted',
                fontSize: 1,
                fontWeight: '600',
                cursor: 'pointer',
                mb: '-2px',
                transition: 'all 0.2s'
              }}
            >
              <CheckSquare size={18} />
              Tasks
              {deletedTasks.length > 0 && (
                <span sx={{
                  px: 2,
                  py: 0,
                  background: activeTab === 'tasks' ? 'primaryBgStrong' : 'surfaceAlt',
                  color: activeTab === 'tasks' ? 'primary' : 'muted',
                  borderRadius: '12px',
                  fontSize: 0,
                  fontWeight: '700'
                }}>
                  {deletedTasks.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 4,
                py: 2,
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid',
                borderColor: activeTab === 'goals' ? 'primary' : 'transparent',
                color: activeTab === 'goals' ? 'primary' : 'muted',
                fontSize: 1,
                fontWeight: '600',
                cursor: 'pointer',
                mb: '-2px',
                transition: 'all 0.2s'
              }}
            >
              <Target size={18} />
              Goals
              {deletedGoals.length > 0 && (
                <span sx={{
                  px: 2,
                  py: 0,
                  background: activeTab === 'goals' ? 'primaryBgStrong' : 'surfaceAlt',
                  color: activeTab === 'goals' ? 'primary' : 'muted',
                  borderRadius: '12px',
                  fontSize: 0,
                  fontWeight: '700'
                }}>
                  {deletedGoals.length}
                </span>
              )}
            </button>
          </div>

          {/* Bulk action bar */}
          {currentItems.length > 0 && (
            <div sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3,
              p: 2,
              px: 3,
              background: selectedIds.size > 0 ? 'primaryBg' : 'surface',
              borderRadius: '10px',
              border: '1px solid',
              borderColor: selectedIds.size > 0 ? 'primaryBgStrong' : 'border',
              transition: 'all 0.2s'
            }}>
              <button
                onClick={toggleSelectAll}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 0,
                  fontWeight: '600',
                  color: 'textSecondary',
                  padding: '4px'
                }}
              >
                {allSelected ? (
                  <CheckSquare2 size={18} color="#1FA4FF" />
                ) : (
                  <Square size={18} color="#9CA3AF" />
                )}
                {selectedIds.size > 0
                  ? `${selectedIds.size} selected`
                  : 'Select all'}
              </button>

              {selectedIds.size > 0 && (
                <div sx={{ display: 'flex', gap: 2 }}>
                  <button
                    onClick={handleBulkRestore}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 3,
                      py: 1,
                      background: 'successBg',
                      color: 'successDark',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: 0,
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      ':hover': { background: '#A7F3D0' }
                    }}
                  >
                    <RotateCcw size={14} />
                    Restore {selectedIds.size}
                  </button>

                  {showBulkConfirm ? (
                    <div sx={{ display: 'flex', gap: 1 }}>
                      <button
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        sx={{
                          px: 3,
                          py: 1,
                          background: 'danger',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: 0,
                          fontWeight: '600',
                          cursor: isBulkDeleting ? 'not-allowed' : 'pointer',
                          opacity: isBulkDeleting ? 0.6 : 1,
                          ':hover': { background: isBulkDeleting ? 'danger' : 'dangerSolid' }
                        }}
                      >
                        {isBulkDeleting ? 'Deleting...' : `Yes, delete ${selectedIds.size}`}
                      </button>
                      <button
                        onClick={() => setShowBulkConfirm(false)}
                        sx={{
                          px: 2,
                          py: 1,
                          background: 'border',
                          color: 'textSecondary',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: 0,
                          fontWeight: '600',
                          cursor: 'pointer',
                          ':hover': { background: 'borderMedium' }
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowBulkConfirm(true)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 3,
                        py: 1,
                        background: 'dangerBg',
                        color: 'dangerSolid',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: 0,
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        ':hover': { background: '#FECACA' }
                      }}
                    >
                      <Trash2 size={14} />
                      Delete {selectedIds.size}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tasks Content */}
          {activeTab === 'tasks' && (
            <div>
              {deletedTasks.length === 0 ? (
                <div sx={{
                  background: 'surface',
                  borderRadius: '12px',
                  p: 6,
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
                }}>
                  <CheckSquare size={48} color="#D1D5DB" />
                  <div sx={{
                    fontSize: 2,
                    fontWeight: '600',
                    color: 'text',
                    mt: 3,
                    mb: 1
                  }}>
                    No deleted tasks
                  </div>
                  <div sx={{
                    fontSize: 1,
                    color: 'muted'
                  }}>
                    Tasks you delete will appear here
                  </div>
                </div>
              ) : (
                <div sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  {deletedTasks.map(task => {
                    const isSelected = selectedIds.has(task.id)
                    return (
                      <div
                        key={task.id}
                        sx={{
                          background: isSelected ? 'primaryBg' : 'surface',
                          borderRadius: '10px',
                          p: 3,
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          transition: 'all 0.2s',
                          border: '1px solid',
                          borderColor: isSelected ? 'primaryBgStrong' : 'transparent',
                          ':hover': {
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                          }
                        }}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelect(task.id)}
                          sx={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare2 size={20} color="#1FA4FF" />
                          ) : (
                            <Square size={20} color="#9CA3AF" />
                          )}
                        </button>

                        {/* Task Info */}
                        <div sx={{ flex: 1, minWidth: 0 }}>
                          <div sx={{
                            fontSize: 1,
                            fontWeight: '600',
                            color: 'muted',
                            textDecoration: 'line-through',
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {task.title}
                          </div>
                          <div sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            fontSize: 0,
                            color: 'textLight'
                          }}>
                            <span sx={{
                              px: 2,
                              py: 0,
                              background: task.priority === 'high' ? 'dangerBg'
                                : task.priority === 'medium' ? 'warningBg'
                                : 'indigoBg',
                              color: task.priority === 'high' ? 'dangerSolid'
                                : task.priority === 'medium' ? 'warningDark'
                                : 'indigo',
                              borderRadius: '4px',
                              fontWeight: '600',
                              textTransform: 'capitalize'
                            }}>
                              {task.priority}
                            </span>
                            {task.deletedAt && (
                              <span>Deleted {formatDeletedDate(task.deletedAt)}</span>
                            )}
                          </div>
                        </div>

                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Goals Content */}
          {activeTab === 'goals' && (
            <div>
              {deletedGoals.length === 0 ? (
                <div sx={{
                  background: 'surface',
                  borderRadius: '12px',
                  p: 6,
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
                }}>
                  <Target size={48} color="#D1D5DB" />
                  <div sx={{
                    fontSize: 2,
                    fontWeight: '600',
                    color: 'text',
                    mt: 3,
                    mb: 1
                  }}>
                    No deleted goals
                  </div>
                  <div sx={{
                    fontSize: 1,
                    color: 'muted'
                  }}>
                    Goals you delete will appear here
                  </div>
                </div>
              ) : (
                <div sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  {deletedGoals.map(goal => {
                    const isSelected = selectedIds.has(goal.id)
                    return (
                      <div
                        key={goal.id}
                        sx={{
                          background: isSelected ? 'primaryBg' : 'surface',
                          borderRadius: '10px',
                          p: 3,
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          transition: 'all 0.2s',
                          border: '1px solid',
                          borderColor: isSelected ? 'primaryBgStrong' : 'transparent',
                          ':hover': {
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                          }
                        }}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelect(goal.id)}
                          sx={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare2 size={20} color="#1FA4FF" />
                          ) : (
                            <Square size={20} color="#9CA3AF" />
                          )}
                        </button>

                        {/* Goal Info */}
                        <div sx={{ flex: 1, minWidth: 0 }}>
                          <div sx={{
                            fontSize: 1,
                            fontWeight: '600',
                            color: 'muted',
                            textDecoration: 'line-through',
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {goal.title}
                          </div>
                          <div sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            fontSize: 0,
                            color: 'textLight'
                          }}>
                            <span sx={{
                              px: 2,
                              py: 0,
                              background: 'surfaceAlt',
                              color: 'textSecondary',
                              borderRadius: '4px',
                              fontWeight: '600',
                              textTransform: 'capitalize'
                            }}>
                              {goal.category}
                            </span>
                            {goal.deletedAt && (
                              <span>Deleted {formatDeletedDate(goal.deletedAt)}</span>
                            )}
                          </div>
                        </div>

                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          {totalItems > 0 && (
            <div sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mt: 4,
              p: 3,
              background: 'warningBg',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: '#FDE68A'
            }}>
              <AlertTriangle size={18} color="#D97706" />
              <span sx={{
                fontSize: 0,
                color: '#92400E'
              }}>
                Permanently deleted items cannot be recovered.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrashPage
