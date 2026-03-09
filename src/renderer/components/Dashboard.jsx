import React, { useState, useEffect } from 'react'

function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [timeBlocks, setTimeBlocks] = useState([])
  const [completedTasks, setCompletedTasks] = useState([])
  const [intention, setIntention] = useState('')
  const [focusStats, setFocusStats] = useState(null)
  const [allDates, setAllDates] = useState([])

  useEffect(() => {
    // Gather all dates that have any data
    const dates = new Set()

    try {
      const blocks = JSON.parse(localStorage.getItem('zen-dash-timeblocks') || '{}')
      Object.keys(blocks).forEach(d => { if (blocks[d].length > 0) dates.add(d) })
    } catch {}

    try {
      const completed = JSON.parse(localStorage.getItem('zen-dash-completed-tasks') || '{}')
      Object.keys(completed).forEach(d => { if (completed[d].length > 0) dates.add(d) })
    } catch {}

    try {
      const intentions = JSON.parse(localStorage.getItem('zen-dash-intention') || '{}')
      Object.keys(intentions).forEach(d => { if (intentions[d]) dates.add(d) })
    } catch {}

    try {
      const stats = JSON.parse(localStorage.getItem('zen-dash-focus-stats') || '{}')
      Object.keys(stats).forEach(d => dates.add(d))
    } catch {}

    setAllDates([...dates].sort().reverse())
  }, [])

  useEffect(() => {
    // Load data for selected date
    try {
      const blocks = JSON.parse(localStorage.getItem('zen-dash-timeblocks') || '{}')
      setTimeBlocks(blocks[selectedDate] || [])
    } catch { setTimeBlocks([]) }

    try {
      const completed = JSON.parse(localStorage.getItem('zen-dash-completed-tasks') || '{}')
      setCompletedTasks(completed[selectedDate] || [])
    } catch { setCompletedTasks([]) }

    try {
      const intentions = JSON.parse(localStorage.getItem('zen-dash-intention') || '{}')
      setIntention(intentions[selectedDate] || '')
    } catch { setIntention('') }

    try {
      const stats = JSON.parse(localStorage.getItem('zen-dash-focus-stats') || '{}')
      setFocusStats(stats[selectedDate] || null)
    } catch { setFocusStats(null) }
  }, [selectedDate])

  const formatTime = (secs) => {
    if (!secs || secs < 60) return '<1m'
    const m = Math.floor(secs / 60)
    if (m < 60) return `${m}m`
    return `${Math.floor(m / 60)}h ${m % 60}m`
  }

  const formatHour = (h) => {
    if (h === 0 || h === 12) return '12'
    return h < 12 ? `${h}` : `${h - 12}`
  }
  const ampm = (h) => h < 12 ? 'am' : 'pm'

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00')
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (dateStr === today) return 'Today'
    if (dateStr === yesterday) return 'Yesterday'
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const CATEGORIES = {
    deep: { label: 'Deep Work', color: '#7DD3A8' },
    meeting: { label: 'Meeting', color: '#F5C16C' },
    review: { label: 'Review', color: '#7AACF0' },
    break: { label: 'Break', color: '#71717A' },
    admin: { label: 'Admin', color: '#A78BF6' },
  }

  const totalFocusTime = completedTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0)
  const hasData = timeBlocks.length > 0 || completedTasks.length > 0 || intention || focusStats

  // Build weekly overview for the chart
  const weekDays = []
  const selDate = new Date(selectedDate + 'T12:00:00')
  const startOfWeek = new Date(selDate)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().split('T')[0]
    let stats = null
    try {
      const all = JSON.parse(localStorage.getItem('zen-dash-focus-stats') || '{}')
      stats = all[key]
    } catch {}
    weekDays.push({
      key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      pomodoros: stats?.pomodoros || 0,
      minutes: stats?.focusMinutes || 0,
      isSelected: key === selectedDate,
    })
  }
  const maxPom = Math.max(...weekDays.map(d => d.pomodoros), 1)

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4">
        <h1 className="text-lg font-light text-zen-text tracking-wide">Home</h1>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar - date list */}
        <div className="w-48 border-r border-zen-border/20 overflow-y-auto py-3">
          {allDates.map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`w-full text-left px-5 py-2 text-xs transition-colors ${
                selectedDate === date
                  ? 'bg-zen-sage/10 text-zen-sage'
                  : 'text-zen-muted hover:text-zen-text hover:bg-zen-card/50'
              }`}
            >
              {formatDateLabel(date)}
            </button>
          ))}
          {allDates.length === 0 && (
            <p className="text-zen-muted/30 text-xs px-5 py-4">No history yet</p>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-8">
          {!hasData ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-zen-muted/30 text-sm">No data for this day</p>
            </div>
          ) : (
            <div className="max-w-3xl space-y-8">
              {/* Date header */}
              <div>
                <h2 className="text-2xl font-light text-zen-text">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h2>
                {intention && (
                  <p className="text-sm text-zen-muted mt-2 italic">"{intention}"</p>
                )}
              </div>

              {/* Stats row */}
              <div className="flex gap-6">
                {focusStats && (
                  <>
                    <div className="bg-zen-surface rounded-xl border border-zen-border/30 px-5 py-4 flex-1">
                      <p className="text-2xl font-light text-zen-text">{focusStats.pomodoros}</p>
                      <p className="text-[10px] text-zen-muted mt-1 tracking-wider uppercase">Sessions</p>
                    </div>
                    <div className="bg-zen-surface rounded-xl border border-zen-border/30 px-5 py-4 flex-1">
                      <p className="text-2xl font-light text-zen-text">{focusStats.focusMinutes}m</p>
                      <p className="text-[10px] text-zen-muted mt-1 tracking-wider uppercase">Focus time</p>
                    </div>
                  </>
                )}
                {completedTasks.length > 0 && (
                  <>
                    <div className="bg-zen-surface rounded-xl border border-zen-border/30 px-5 py-4 flex-1">
                      <p className="text-2xl font-light text-zen-text">{completedTasks.length}</p>
                      <p className="text-[10px] text-zen-muted mt-1 tracking-wider uppercase">Tasks done</p>
                    </div>
                    <div className="bg-zen-surface rounded-xl border border-zen-border/30 px-5 py-4 flex-1">
                      <p className="text-2xl font-light text-zen-text">{formatTime(totalFocusTime)}</p>
                      <p className="text-[10px] text-zen-muted mt-1 tracking-wider uppercase">Tracked time</p>
                    </div>
                  </>
                )}
              </div>

              {/* Weekly chart */}
              <div className="bg-zen-surface rounded-xl border border-zen-border/30 p-5">
                <h3 className="text-[10px] text-zen-muted tracking-[0.2em] uppercase mb-4">Week overview</h3>
                <div className="flex items-end gap-2 h-20 mb-2">
                  {weekDays.map(day => (
                    <div key={day.key} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-md transition-all cursor-pointer ${
                          day.pomodoros > 0
                            ? day.isSelected ? 'bg-zen-sage' : 'bg-zen-sage/30'
                            : 'bg-zen-border/20'
                        }`}
                        style={{ height: `${day.pomodoros > 0 ? Math.max(12, (day.pomodoros / maxPom) * 100) : 4}%` }}
                        onClick={() => setSelectedDate(day.key)}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {weekDays.map(day => (
                    <div key={day.key} className="flex-1 text-center">
                      <span className={`text-[9px] ${day.isSelected ? 'text-zen-sage' : 'text-zen-muted/30'}`}>{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time blocks */}
              {timeBlocks.length > 0 && (
                <div className="bg-zen-surface rounded-xl border border-zen-border/30 p-5">
                  <h3 className="text-[10px] text-zen-muted tracking-[0.2em] uppercase mb-4">Time blocks</h3>
                  <div className="space-y-2">
                    {timeBlocks.sort((a, b) => a.startHour - b.startHour).map((block, i) => {
                      const cat = CATEGORIES[block.category] || { label: block.category, color: '#71717A' }
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-zen-muted w-20 text-right">
                            {formatHour(block.startHour)}{ampm(block.startHour)} - {formatHour(block.endHour)}{ampm(block.endHour)}
                          </span>
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-xs text-zen-text">{block.title}</span>
                          <span className="text-[10px] text-zen-muted">{cat.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Completed tasks */}
              {completedTasks.length > 0 && (
                <div className="bg-zen-surface rounded-xl border border-zen-border/30 p-5">
                  <h3 className="text-[10px] text-zen-muted tracking-[0.2em] uppercase mb-4">Completed tasks</h3>
                  <div className="space-y-2">
                    {completedTasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <svg className="w-3.5 h-3.5 text-zen-sage flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-zen-text flex-1">{task.title}</span>
                        <span className="text-[10px] text-zen-sage">{formatTime(task.timeSpent)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
