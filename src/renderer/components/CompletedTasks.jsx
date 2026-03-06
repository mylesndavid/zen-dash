import React, { useState } from 'react'

function CompletedTasks({ completedTasks }) {
  const [expanded, setExpanded] = useState(true)

  if (completedTasks.length === 0) return null

  const formatTime = (secs) => {
    if (secs < 60) return '<1m'
    const m = Math.floor(secs / 60)
    if (m < 60) return `${m}m`
    return `${Math.floor(m / 60)}h ${m % 60}m`
  }

  const totalTime = completedTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0)

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs text-zen-muted tracking-[0.2em] uppercase">Done Today</h2>
          <span className="text-[10px] text-zen-sage bg-zen-sage/10 px-1.5 py-0.5 rounded">{completedTasks.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zen-muted">{formatTime(totalTime)} total</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-zen-muted hover:text-zen-text transition-colors"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? '' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-1.5">
          {completedTasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-zen-sage/5 rounded-lg">
              <svg className="w-3.5 h-3.5 text-zen-sage flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zen-text truncate">{task.title}</p>
              </div>
              <span className="text-[10px] text-zen-sage flex-shrink-0">{formatTime(task.timeSpent)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CompletedTasks
