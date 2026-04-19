/** @jsxImportSource theme-ui */
import { useState, useEffect, useMemo } from 'react'
import { Tag, CheckCircle2, Circle, Calendar, Pencil } from 'lucide-react'
import { useAuthStore, useTaskStore } from '../stores'
import { useSidebar } from '../contexts'
import Sidebar from '../components/Sidebar'
import EditTaskModal from '../components/EditTaskModal'
import { getTagColor } from '../data/tags'
import type { Task } from '../types'

const TagsPage = () => {
  const { currentUser } = useAuthStore()
  const { sidebarWidth } = useSidebar()
  const { loadTasks, getTasks, completeTask, incompleteTask } = useTaskStore()
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    if (currentUser) {
      loadTasks(currentUser.id)
    }
  }, [currentUser, loadTasks])

  if (!currentUser) return null

  const allTasks = getTasks()

  // Derive tags and counts from tasks
  const { allTags, tagCounts } = useMemo(() => {
    const counts: Record<string, number> = {}
    allTasks.forEach(task => {
      task.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1
      })
    })
    return {
      allTags: Object.keys(counts).sort(),
      tagCounts: counts
    }
  }, [allTasks])

  // Filter tasks by selected tag
  const filteredTasks = useMemo(() => {
    if (selectedTag) {
      return allTasks.filter(t => t.tags.includes(selectedTag))
    }
    return allTasks.filter(t => t.tags.length > 0)
  }, [allTasks, selectedTag])

  const totalTaggedTasks = allTasks.filter(t => t.tags.length > 0).length

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

  return (
    <div sx={{ display: 'flex', minHeight: '100vh', background: 'background' }}>
      <Sidebar />

      <div sx={{
        flex: 1,
        ml: `${sidebarWidth}px`,
        transition: 'margin-left 0.2s',
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
            <Tag size={24} color="#1FA4FF" />
            <h1 sx={{
              fontSize: 4,
              fontWeight: '700',
              color: 'text',
              m: 0
            }}>
              Tags
            </h1>
          </div>
          <p sx={{ fontSize: 1, color: 'muted', m: 0 }}>
            Organize and filter your tasks by tags
          </p>
        </div>

        {allTags.length === 0 ? (
          /* Empty state - no tags at all */
          <div sx={{
            background: 'surface',
            borderRadius: '12px',
            p: 6,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'border'
          }}>
            <Tag size={48} color="#D1D5DB" sx={{ mb: 3 }} />
            <div sx={{
              fontSize: 2,
              fontWeight: '600',
              color: 'text',
              mb: 2
            }}>
              No tags yet
            </div>
            <div sx={{
              fontSize: 1,
              color: 'muted'
            }}>
              Add tags to your tasks to organize them. Use the task editor to add tags.
            </div>
          </div>
        ) : (
          <>
            {/* Tag chips */}
            <div sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mb: 4
            }}>
              {/* All chip */}
              <button
                onClick={() => setSelectedTag(null)}
                sx={{
                  px: 3,
                  py: 2,
                  borderRadius: '20px',
                  border: '2px solid',
                  borderColor: selectedTag === null ? 'primary' : 'border',
                  background: selectedTag === null ? 'primaryBg' : 'surface',
                  color: selectedTag === null ? 'primary' : 'textSecondary',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  transition: 'all 0.2s',
                  ':hover': {
                    borderColor: 'primary',
                    background: 'primaryBg'
                  }
                }}
              >
                All
                <span sx={{
                  px: 2,
                  py: 0,
                  borderRadius: '10px',
                  background: selectedTag === null ? 'primary' : 'border',
                  color: selectedTag === null ? 'surface' : 'textSecondary',
                  fontSize: 0,
                  fontWeight: 'bold'
                }}>
                  {totalTaggedTasks}
                </span>
              </button>

              {allTags.map(tag => {
                const colors = getTagColor(tag)
                const isSelected = selectedTag === tag
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    sx={{
                      px: 3,
                      py: 2,
                      borderRadius: '20px',
                      border: '2px solid',
                      borderColor: isSelected ? colors.border : 'border',
                      background: isSelected ? colors.bg : 'surface',
                      color: isSelected ? colors.text : 'textSecondary',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      transition: 'all 0.2s',
                      ':hover': {
                        borderColor: colors.border,
                        background: colors.bg,
                        color: colors.text
                      }
                    }}
                  >
                    {tag}
                    <span sx={{
                      px: 2,
                      py: 0,
                      borderRadius: '10px',
                      background: isSelected ? colors.text : 'border',
                      color: isSelected ? 'surface' : 'textSecondary',
                      fontSize: 0,
                      fontWeight: 'bold'
                    }}>
                      {tagCounts[tag]}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Task list */}
            <div sx={{
              background: 'surface',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'border',
              overflow: 'hidden'
            }}>
              {/* Section header */}
              <div sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 4,
                py: 3,
                background: 'background',
                borderBottom: '1px solid',
                borderBottomColor: 'border'
              }}>
                <Tag size={18} color={selectedTag ? getTagColor(selectedTag).border : '#1FA4FF'} />
                <div sx={{
                  fontSize: 1,
                  fontWeight: '600',
                  color: 'text'
                }}>
                  {selectedTag || 'All Tagged Tasks'}
                </div>
                <div sx={{
                  fontSize: 0,
                  color: 'muted',
                  background: 'border',
                  px: 2,
                  py: 0,
                  borderRadius: '12px'
                }}>
                  {filteredTasks.length}
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div sx={{
                  textAlign: 'center',
                  py: 6,
                  color: 'textLight',
                  fontSize: 1
                }}>
                  {selectedTag
                    ? `No tasks tagged "${selectedTag}"`
                    : 'No tagged tasks yet'
                  }
                </div>
              ) : (
                <div>
                  {filteredTasks.map(task => (
                    <div
                      key={task.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        px: 4,
                        py: 3,
                        borderBottom: '1px solid',
                        borderBottomColor: 'surfaceAlt',
                        transition: 'background 0.15s',
                        ':hover': {
                          background: 'surface'
                        },
                        ':last-child': {
                          borderBottom: 'none'
                        }
                      }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleTask(task.id, task.status)}
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
                        {task.status === 'done' ? (
                          <CheckCircle2 size={20} color="#10B981" />
                        ) : (
                          <Circle size={20} color="#9CA3AF" />
                        )}
                      </button>

                      {/* Content */}
                      <div sx={{ flex: 1, minWidth: 0 }}>
                        <div sx={{
                          fontSize: 1,
                          color: task.status === 'done' ? 'textLight' : 'text',
                          textDecoration: task.status === 'done' ? 'line-through' : 'none',
                          mb: 1
                        }}>
                          {task.title}
                        </div>

                        {/* Tags + metadata */}
                        <div sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          flexWrap: 'wrap'
                        }}>
                          {/* Tag chips */}
                          {task.tags.map(tag => {
                            const colors = getTagColor(tag)
                            return (
                              <span
                                key={tag}
                                sx={{
                                  px: '6px',
                                  py: '1px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  background: colors.bg,
                                  color: colors.text
                                }}
                              >
                                {tag}
                              </span>
                            )
                          })}

                          {/* Due date */}
                          {task.dueDate && (
                            <span sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: 0,
                              color: task.dueDate < Date.now() && task.status !== 'done' ? 'danger' : 'muted'
                            }}>
                              <Calendar size={12} />
                              {new Date(task.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Priority badge */}
                      {task.priority && (
                        <div sx={{
                          px: 2,
                          py: '2px',
                          fontSize: 0,
                          fontWeight: '600',
                          borderRadius: '4px',
                          background: task.priority === 'high' ? 'dangerBg' : task.priority === 'medium' ? 'warningBg' : 'indigoBg',
                          color: task.priority === 'high' ? 'dangerSolid' : task.priority === 'medium' ? 'warningDark' : 'indigo',
                          textTransform: 'capitalize',
                          flexShrink: 0
                        }}>
                          {task.priority}
                        </div>
                      )}

                      {/* Edit button */}
                      {task.status !== 'done' && (
                        <button
                          onClick={() => setEditingTask(task)}
                          sx={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0,
                            ':hover': {
                              background: 'surfaceAlt'
                            }
                          }}
                        >
                          <Pencil size={14} color="#6B7280" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

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

export default TagsPage
