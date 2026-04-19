/** @jsxImportSource theme-ui */
import { useState, useMemo, useEffect } from 'react'
import { BarChart2, TrendingUp, CheckCircle2, Target, Flame } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts'
import { useAuthStore, useTaskStore, useGoalStore } from '../stores'
import { useSidebar } from '../contexts'
import { categoryColors } from '../types/goal'
import Sidebar from '../components/Sidebar'

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div sx={{
      background: 'surface',
      border: '1px solid',
      borderColor: 'border',
      borderRadius: '8px',
      px: 3,
      py: 2,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <div sx={{ fontSize: 0, color: 'muted', mb: '2px' }}>{label}</div>
      <div sx={{ fontSize: 2, fontWeight: 'bold', color: 'text' }}>
        {payload[0].value} {payload[0].value === 1 ? 'task' : 'tasks'}
      </div>
    </div>
  )
}

const StatsPage = () => {
  const { currentUser } = useAuthStore()
  const { sidebarWidth } = useSidebar()
  const { tasks, loadTasks } = useTaskStore()
  const { loadGoals, getActiveGoals, getCompletedGoals } = useGoalStore()
  const [chartRange, setChartRange] = useState<7 | 30>(7)

  useEffect(() => {
    if (currentUser) {
      loadTasks(currentUser.id)
      loadGoals(currentUser.id)
    }
  }, [currentUser, loadTasks, loadGoals])

  // ---- Derived data ----
  const allTasks = useMemo(() =>
    tasks.filter(t => !t.deletedAt && !t.isHabit), [tasks])

  const habitsList = useMemo(() =>
    tasks.filter(t => !t.deletedAt && t.isHabit), [tasks])

  const completedTasks = useMemo(() =>
    allTasks.filter(t => t.status === 'done'), [allTasks])

  const completionRate = useMemo(() =>
    allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0,
    [allTasks, completedTasks])

  const activeGoals = useMemo(() =>
    getActiveGoals().filter(g => !g.deletedAt), [tasks, getActiveGoals])

  const completedGoals = useMemo(() =>
    getCompletedGoals().filter(g => !g.deletedAt), [tasks, getCompletedGoals])

  // Consecutive days going back from today where at least 1 task was completed
  const dayStreak = useMemo(() => {
    const completedDates = new Set(
      completedTasks
        .filter(t => t.completedAt)
        .map(t => {
          const d = new Date(t.completedAt!)
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        })
    )
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (completedDates.has(key)) {
        streak++
      } else if (i > 0) {
        break // today can be empty but still counts
      }
    }
    return streak
  }, [completedTasks])

  // Bar chart: tasks completed per day over last 7 or 30 days
  const chartData = useMemo(() => {
    const result = []
    for (let i = chartRange - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const start = d.getTime()
      const end = start + 86_400_000
      const label = chartRange === 7
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const count = completedTasks.filter(t =>
        t.completedAt && t.completedAt >= start && t.completedAt < end
      ).length
      result.push({ label, count, isToday: i === 0 })
    }
    return result
  }, [completedTasks, chartRange])

  // Priority breakdown
  const priorityData = useMemo(() => {
    return [
      { label: 'High', color: '#EF4444', bg: 'dangerBg', tasks: allTasks.filter(t => t.priority === 'high') },
      { label: 'Medium', color: '#F59E0B', bg: 'warningBg', tasks: allTasks.filter(t => t.priority === 'medium') },
      { label: 'Low', color: '#4F46E5', bg: 'indigoBg', tasks: allTasks.filter(t => t.priority === 'low') },
    ].map(p => ({
      ...p,
      total: p.tasks.length,
      done: p.tasks.filter(t => t.status === 'done').length,
      rate: p.tasks.length > 0 ? Math.round((p.tasks.filter(t => t.status === 'done').length / p.tasks.length) * 100) : 0,
    }))
  }, [allTasks])

  // Status donut chart data
  const statusData = useMemo(() => [
    { name: 'Done', value: allTasks.filter(t => t.status === 'done').length, color: '#10B981' },
    { name: 'In Progress', value: allTasks.filter(t => t.status === 'in-progress').length, color: '#1FA4FF' },
    { name: 'Todo', value: allTasks.filter(t => t.status === 'todo').length, color: '#D1D5DB' },
  ].filter(d => d.value > 0), [allTasks])

  // Goal progress: derived from linked tasks
  const goalProgress = useMemo(() => {
    return activeGoals.map(goal => {
      const linked = allTasks.filter(t => t.goalId === goal.id)
      const done = linked.filter(t => t.status === 'done')
      const progress = linked.length > 0 ? Math.round((done.length / linked.length) * 100) : 0
      return { ...goal, progress, linkedCount: linked.length, doneCount: done.length }
    })
  }, [activeGoals, allTasks])

  // Habit 7-day grid
  const habitStats = useMemo(() => {
    const today = new Date()
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      return {
        dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        label: d.toLocaleDateString('en-US', { weekday: 'short' })[0],
        isToday: i === 6,
      }
    })
    return habitsList.map(habit => {
      const completions = last7.map(day => ({
        ...day,
        done: !!(habit.habitCompletions?.[day.dateStr]),
      }))
      const doneCount = completions.filter(c => c.done).length
      return { ...habit, completions, rate: Math.round((doneCount / 7) * 100), doneCount }
    })
  }, [habitsList])

  if (!currentUser) return null

  const overviewCards = [
    {
      icon: CheckCircle2, color: '#10B981', bg: 'successBg',
      label: 'Tasks Completed', value: completedTasks.length,
      sub: 'all time'
    },
    {
      icon: TrendingUp, color: '#1FA4FF', bg: 'primaryBgStrong',
      label: 'Completion Rate', value: `${completionRate}%`,
      sub: `${allTasks.length} total task${allTasks.length !== 1 ? 's' : ''}`
    },
    {
      icon: Target, color: '#8B5CF6', bg: 'purpleBg',
      label: 'Active Goals', value: activeGoals.length,
      sub: `${completedGoals.length} completed`
    },
    {
      icon: Flame, color: '#F59E0B', bg: 'warningBg',
      label: 'Day Streak', value: dayStreak,
      sub: dayStreak === 1 ? 'day in a row' : 'days in a row'
    },
  ]

  return (
    <div sx={{ display: 'flex', minHeight: '100vh', background: 'background' }}>
      <Sidebar />
      <div sx={{
        flex: 1,
        marginLeft: `${sidebarWidth}px`,
        transition: 'margin-left 0.2s',
        p: 4,
      }}>
        <div sx={{ maxWidth: '1100px' }}>

          {/* Header */}
          <div sx={{ mb: 4 }}>
            <div sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <BarChart2 size={24} color="#1FA4FF" />
              <h1 sx={{ fontSize: 4, fontWeight: 'bold', color: 'text', m: 0 }}>Stats</h1>
            </div>
            <p sx={{ fontSize: 1, color: 'muted', m: 0 }}>
              Track your productivity, habits, and goal progress
            </p>
          </div>

          {/* Overview Cards */}
          <div sx={{
            display: 'grid',
            gridTemplateColumns: ['1fr 1fr', '1fr 1fr', '1fr 1fr 1fr 1fr'],
            gap: 3,
            mb: 4
          }}>
            {overviewCards.map(({ icon: Icon, color, bg, label, value, sub }) => (
              <div key={label} sx={{
                background: 'surface',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: 'border',
                p: 3,
              }}>
                <div sx={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', mb: 2
                }}>
                  <Icon size={20} color={color} />
                </div>
                <div sx={{ fontSize: 4, fontWeight: 'bold', color: 'text', lineHeight: 1, mb: '4px' }}>
                  {value}
                </div>
                <div sx={{ fontSize: 1, fontWeight: '600', color: 'textSecondary', mb: '2px' }}>{label}</div>
                <div sx={{ fontSize: 0, color: 'textLight' }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Productivity Chart */}
          <div sx={{ background: 'surface', borderRadius: '12px', border: '1px solid', borderColor: 'border', p: 4, mb: 4 }}>
            <div sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <div>
                <div sx={{ fontSize: 2, fontWeight: '700', color: 'text' }}>Productivity</div>
                <div sx={{ fontSize: 0, color: 'muted', mt: '2px' }}>Tasks completed per day</div>
              </div>
              <div sx={{ display: 'flex', gap: 1 }}>
                {([7, 30] as const).map(n => (
                  <button key={n} onClick={() => setChartRange(n)} sx={{
                    px: 3, py: '6px', borderRadius: '6px', border: '1.5px solid',
                    borderColor: chartRange === n ? 'primary' : 'border',
                    background: chartRange === n ? 'primaryBg' : 'surface',
                    color: chartRange === n ? 'primary' : 'muted',
                    fontSize: 0, fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                    ':hover': { borderColor: 'primary' }
                  }}>
                    {n === 7 ? '7 days' : '30 days'}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={chartRange === 7 ? 36 : 12} barCategoryGap="20%">
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  width={24}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB', radius: 6 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.isToday ? '#1FA4FF' : entry.count > 0 ? '#93C5FD' : '#E5E7EB'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div sx={{ display: 'flex', gap: 3, mt: 2, justifyContent: 'flex-end' }}>
              {[
                { color: 'primary', label: 'Today' },
                { color: 'primaryBgStrong', label: 'Completed' },
                { color: 'border', label: 'No activity' },
              ].map(l => (
                <div key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <div sx={{ width: '10px', height: '10px', borderRadius: '2px', background: l.color }} />
                  <span sx={{ fontSize: 0, color: 'muted' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task Breakdown row */}
          <div sx={{
            display: 'grid',
            gridTemplateColumns: ['1fr', '1fr', '3fr 2fr'],
            gap: 3,
            mb: 4
          }}>
            {/* By Priority */}
            <div sx={{ background: 'surface', borderRadius: '12px', border: '1px solid', borderColor: 'border', p: 4 }}>
              <div sx={{ fontSize: 2, fontWeight: '700', color: 'text', mb: '4px' }}>By Priority</div>
              <div sx={{ fontSize: 0, color: 'muted', mb: 3 }}>Completion rate per priority level</div>
              {allTasks.length === 0 ? (
                <div sx={{ textAlign: 'center', color: 'textLight', fontSize: 1, py: 4 }}>No tasks yet</div>
              ) : (
                <div sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {priorityData.map(p => (
                    <div key={p.label}>
                      <div sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '8px' }}>
                        <div sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <div sx={{
                            px: '10px', py: '3px', borderRadius: '20px',
                            background: p.bg, color: p.color, fontSize: 0, fontWeight: '700'
                          }}>{p.label}</div>
                          <span sx={{ fontSize: 0, color: 'textLight' }}>{p.done} of {p.total} done</span>
                        </div>
                        <span sx={{ fontSize: 1, fontWeight: '700', color: 'text' }}>{p.rate}%</span>
                      </div>
                      <div sx={{ height: '10px', background: 'surfaceAlt', borderRadius: '5px', overflow: 'hidden' }}>
                        <div sx={{
                          height: '100%',
                          width: `${p.rate}%`,
                          background: p.color,
                          borderRadius: '5px',
                          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* By Status donut */}
            <div sx={{ background: 'surface', borderRadius: '12px', border: '1px solid', borderColor: 'border', p: 4 }}>
              <div sx={{ fontSize: 2, fontWeight: '700', color: 'text', mb: '4px' }}>By Status</div>
              <div sx={{ fontSize: 0, color: 'muted', mb: 3 }}>Task status breakdown</div>
              {statusData.length === 0 ? (
                <div sx={{ textAlign: 'center', color: 'textLight', fontSize: 1, py: 4 }}>No tasks yet</div>
              ) : (
                <div sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <PieChart width={160} height={160}>
                    <Pie
                      data={statusData}
                      cx={75}
                      cy={75}
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                    {statusData.map(d => (
                      <div key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <div sx={{
                          width: '10px', height: '10px', borderRadius: '50%',
                          background: d.color, flexShrink: 0
                        }} />
                        <span sx={{ fontSize: 0, color: 'textSecondary', flex: 1 }}>{d.name}</span>
                        <span sx={{ fontSize: 0, fontWeight: '700', color: 'text' }}>{d.value}</span>
                        <span sx={{ fontSize: 0, color: 'textLight', minWidth: '32px', textAlign: 'right' }}>
                          {Math.round((d.value / allTasks.length) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Goals Progress */}
          {goalProgress.length > 0 && (
            <div sx={{ background: 'surface', borderRadius: '12px', border: '1px solid', borderColor: 'border', p: 4, mb: 4 }}>
              <div sx={{ fontSize: 2, fontWeight: '700', color: 'text', mb: '4px' }}>Goals Progress</div>
              <div sx={{ fontSize: 0, color: 'muted', mb: 3 }}>Based on linked task completion</div>
              <div sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {goalProgress.map(goal => {
                  const colors = categoryColors[goal.category]
                  return (
                    <div key={goal.id}>
                      <div sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '8px' }}>
                        <div sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                          <div sx={{
                            px: '10px', py: '3px', borderRadius: '20px',
                            background: colors.bg, color: colors.text,
                            fontSize: 0, fontWeight: '700', flexShrink: 0, textTransform: 'capitalize'
                          }}>{goal.category}</div>
                          <span sx={{
                            fontSize: 1, fontWeight: '600', color: 'text',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>{goal.title}</span>
                        </div>
                        <div sx={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, ml: 3 }}>
                          <span sx={{ fontSize: 0, color: 'textLight' }}>
                            {goal.linkedCount > 0 ? `${goal.doneCount}/${goal.linkedCount} tasks` : 'No tasks linked'}
                          </span>
                          <span sx={{ fontSize: 1, fontWeight: '700', color: 'text', minWidth: '38px', textAlign: 'right' }}>
                            {goal.progress}%
                          </span>
                        </div>
                      </div>
                      <div sx={{ height: '10px', background: 'surfaceAlt', borderRadius: '5px', overflow: 'hidden' }}>
                        <div sx={{
                          height: '100%',
                          width: `${goal.progress}%`,
                          background: goal.progress === 100 ? 'success' : colors.border,
                          borderRadius: '5px',
                          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)'
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Habits */}
          {habitStats.length > 0 && (
            <div sx={{ background: 'surface', borderRadius: '12px', border: '1px solid', borderColor: 'border', p: 4 }}>
              <div sx={{ fontSize: 2, fontWeight: '700', color: 'text', mb: '4px' }}>Habits</div>
              <div sx={{ fontSize: 0, color: 'muted', mb: 3 }}>Last 7 days completion</div>
              <div sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {habitStats.map(habit => (
                  <div key={habit.id} sx={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    p: 3, background: 'background', borderRadius: '10px'
                  }}>
                    <div sx={{ flex: 1, minWidth: 0 }}>
                      <div sx={{
                        fontSize: 1, fontWeight: '600', color: 'text', mb: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>{habit.title}</div>
                      <div sx={{ display: 'flex', gap: 1 }}>
                        {habit.completions.map((day, i) => (
                          <div key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div sx={{
                              width: '30px', height: '30px', borderRadius: '7px',
                              background: day.done ? 'success' : day.isToday ? 'primaryBg' : 'border',
                              border: day.isToday ? '2px solid' : '2px solid transparent',
                              borderColor: day.isToday ? 'primary' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {day.done && (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                  <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <div sx={{ fontSize: '10px', color: 'textLight', fontWeight: '500' }}>{day.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div sx={{ textAlign: 'center', flexShrink: 0, minWidth: '52px' }}>
                      <div sx={{
                        fontSize: 3, fontWeight: 'bold', lineHeight: 1,
                        color: habit.rate >= 70 ? 'success' : habit.rate >= 40 ? 'warning' : 'danger'
                      }}>
                        {habit.rate}%
                      </div>
                      <div sx={{ fontSize: 0, color: 'textLight', mt: '2px' }}>this week</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {allTasks.length === 0 && activeGoals.length === 0 && habitStats.length === 0 && (
            <div sx={{
              background: 'surface', borderRadius: '12px', border: '1px solid', borderColor: 'border',
              p: 6, textAlign: 'center'
            }}>
              <TrendingUp size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
              <div sx={{ fontSize: 2, fontWeight: '600', color: 'textSecondary', mb: 1 }}>No data yet</div>
              <div sx={{ fontSize: 1, color: 'textLight' }}>
                Create tasks and goals to start seeing your productivity stats here.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default StatsPage
