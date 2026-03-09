import React, { useState, useEffect } from 'react'

function Dashboard() {
  const [workspaces, setWorkspaces] = useState([])
  const [focusStats, setFocusStats] = useState({})
  const [allDates, setAllDates] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedWs, setSelectedWs] = useState(null)

  useEffect(() => {
    const ws = JSON.parse(localStorage.getItem('zen-dash-workspaces') || '[]')
    setWorkspaces(ws)

    try { setFocusStats(JSON.parse(localStorage.getItem('zen-dash-focus-stats') || '{}')) } catch {}

    // Gather all dates from workspaces + focus stats + time blocks
    const dates = new Set()
    ws.forEach(w => dates.add(w.date))
    try {
      const stats = JSON.parse(localStorage.getItem('zen-dash-focus-stats') || '{}')
      Object.keys(stats).forEach(d => dates.add(d))
    } catch {}
    try {
      const blocks = JSON.parse(localStorage.getItem('zen-dash-timeblocks') || '{}')
      Object.keys(blocks).forEach(d => { if (blocks[d]?.length > 0) dates.add(d) })
    } catch {}

    const sorted = [...dates].sort().reverse()
    setAllDates(sorted)
    if (sorted.length > 0) setSelectedDate(sorted[0])
  }, [])

  const wsForDate = workspaces.filter(w => w.date === selectedDate).sort((a, b) => a.number - b.number)
  const dayStats = focusStats[selectedDate] || null

  let timeBlocks = []
  try {
    const all = JSON.parse(localStorage.getItem('zen-dash-timeblocks') || '{}')
    timeBlocks = all[selectedDate] || []
  } catch {}

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00')
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (dateStr === today) return 'Today'
    if (dateStr === yesterday) return 'Yesterday'
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const formatHour = (h) => {
    if (h === 0 || h === 12) return '12'
    return h < 12 ? `${h}` : `${h - 12}`
  }
  const ampm = (h) => h < 12 ? 'am' : 'pm'

  const CATEGORIES = {
    deep: { label: 'Deep Work', color: '#7DD3A8' },
    meeting: { label: 'Meeting', color: '#F5C16C' },
    review: { label: 'Review', color: '#7AACF0' },
    break: { label: 'Break', color: '#71717A' },
    admin: { label: 'Admin', color: '#A78BF6' },
  }

  // Weekly chart
  const weekDays = []
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().split('T')[0]
    weekDays.push({
      key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      pomodoros: focusStats[key]?.pomodoros || 0,
      isSelected: key === selectedDate,
    })
  }
  const maxPom = Math.max(...weekDays.map(d => d.pomodoros), 1)

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 flex min-h-0">
        {/* Sidebar - dates then workspaces */}
        <div className="w-52 border-r border-zen-border/20 overflow-y-auto py-4">
          <h2 className="text-[10px] text-zen-muted tracking-[0.2em] uppercase px-5 mb-3">History</h2>
          {allDates.map(date => {
            const dateWs = workspaces.filter(w => w.date === date).sort((a, b) => a.number - b.number)
            const isOpen = selectedDate === date
            return (
              <div key={date}>
                <button
                  onClick={() => { setSelectedDate(date); setSelectedWs(null) }}
                  className={`w-full text-left px-5 py-2 text-xs transition-colors ${
                    isOpen && !selectedWs ? 'bg-zen-sage/10 text-zen-sage' : 'text-zen-muted hover:text-zen-text hover:bg-zen-card/50'
                  }`}
                >
                  {formatDateLabel(date)}
                </button>
                {isOpen && dateWs.length > 0 && (
                  <div className="ml-4 border-l border-zen-border/20">
                    {dateWs.map(ws => (
                      <button
                        key={ws.id}
                        onClick={() => { setSelectedDate(date); setSelectedWs(ws.id) }}
                        className={`w-full text-left pl-4 pr-5 py-1.5 transition-colors ${
                          selectedWs === ws.id ? 'text-zen-sage' : 'text-zen-muted/50 hover:text-zen-muted'
                        }`}
                      >
                        <p className="text-[11px] truncate">{ws.intention || `Workspace ${ws.number}`}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {allDates.length === 0 && (
            <p className="text-zen-muted/20 text-xs px-5 py-4">No history yet</p>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-8">
          {selectedWs ? (
            <WorkspaceView ws={workspaces.find(w => w.id === selectedWs)} />
          ) : selectedDate ? (
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Date header */}
              <h2 className="text-2xl font-light text-zen-text">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>

              {/* Day stats */}
              {dayStats && (
                <div className="flex gap-6">
                  <div className="bg-zen-surface rounded-xl border border-zen-border/30 px-5 py-4 flex-1">
                    <p className="text-2xl font-light text-zen-text">{dayStats.pomodoros}</p>
                    <p className="text-[10px] text-zen-muted mt-1 tracking-wider uppercase">Sessions</p>
                  </div>
                  <div className="bg-zen-surface rounded-xl border border-zen-border/30 px-5 py-4 flex-1">
                    <p className="text-2xl font-light text-zen-text">{dayStats.focusMinutes}m</p>
                    <p className="text-[10px] text-zen-muted mt-1 tracking-wider uppercase">Focus time</p>
                  </div>
                </div>
              )}

              {/* Weekly chart */}
              <div className="bg-zen-surface rounded-xl border border-zen-border/30 p-5">
                <h3 className="text-[10px] text-zen-muted tracking-[0.2em] uppercase mb-4">This week</h3>
                <div className="flex items-end gap-2 h-16 mb-2">
                  {weekDays.map(day => (
                    <div key={day.key} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-md cursor-pointer ${
                          day.pomodoros > 0
                            ? day.isSelected ? 'bg-zen-sage' : 'bg-zen-sage/30'
                            : 'bg-zen-border/20'
                        }`}
                        style={{ height: `${day.pomodoros > 0 ? Math.max(12, (day.pomodoros / maxPom) * 100) : 4}%` }}
                        onClick={() => { setSelectedDate(day.key); setSelectedWs(null) }}
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

              {/* Workspaces for this day */}
              {wsForDate.length > 0 && (
                <div>
                  <h3 className="text-[10px] text-zen-muted tracking-[0.2em] uppercase mb-3">Workspaces</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {wsForDate.map(ws => (
                      <button
                        key={ws.id}
                        onClick={() => setSelectedWs(ws.id)}
                        className="bg-zen-surface rounded-xl border border-zen-border/30 p-4 text-left hover:border-zen-sage/30 transition-colors"
                      >
                        <p className="text-xs text-zen-text font-medium truncate">{ws.intention || `Workspace ${ws.number}`}</p>
                        <p className="text-[10px] text-zen-muted mt-1">
                          {ws.tasks?.length || 0} tasks, {ws.canvas?.length || 0} notes
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-zen-muted/20 text-sm">Select a day</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function WorkspaceView({ ws }) {
  if (!ws) return null

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <button
          onClick={() => {/* parent handles via selectedWs=null */}}
          className="text-[10px] text-zen-muted/40 tracking-wider uppercase mb-1"
        >
          {new Date(ws.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          {' '} / Workspace {ws.number}
        </button>
        <h2 className="text-2xl font-light text-zen-text">
          {ws.intention || `Workspace ${ws.number}`}
        </h2>
      </div>

      {ws.tasks && ws.tasks.length > 0 && (
        <div className="bg-zen-surface rounded-xl border border-zen-border/30 p-5">
          <h3 className="text-[10px] text-zen-muted tracking-[0.2em] uppercase mb-4">Tasks</h3>
          <div className="space-y-2">
            {ws.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${
                  task.done ? 'bg-zen-sage border-zen-sage' : 'border-zen-border'
                }`}>
                  {task.done && (
                    <svg className="w-2 h-2 text-zen-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs ${task.done ? 'text-zen-muted line-through' : 'text-zen-text'}`}>{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ws.canvas && ws.canvas.filter(n => n.text || n.title || n.items?.length).length > 0 && (
        <div className="bg-zen-surface rounded-xl border border-zen-border/30 p-5">
          <h3 className="text-[10px] text-zen-muted tracking-[0.2em] uppercase mb-4">Notes</h3>
          <div className="space-y-3">
            {ws.canvas.filter(n => n.text || n.title || n.items?.length).map((note, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: note.color || '#71717A' }} />
                <div>
                  {note.title && <p className="text-xs font-medium text-zen-text">{note.title}</p>}
                  {note.text && note.type !== 'image' && note.type !== 'fileview' && (
                    <p className="text-xs text-zen-muted">{note.text.slice(0, 200)}{note.text.length > 200 ? '...' : ''}</p>
                  )}
                  {note.items && note.items.map((item, j) => (
                    <p key={j} className={`text-xs ${item.done ? 'text-zen-muted line-through' : 'text-zen-text'}`}>
                      - {item.text}
                    </p>
                  ))}
                  {note.transcription && (
                    <p className="text-xs text-zen-muted italic mt-1">{note.transcription.slice(0, 150)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
