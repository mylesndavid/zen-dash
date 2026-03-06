import React, { useState, useEffect } from 'react'

const STATS_KEY = 'zen-dash-focus-stats'

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || '{}') } catch { return {} }
}

export function recordPomodoro() {
  const today = new Date().toISOString().split('T')[0]
  const stats = loadStats()
  if (!stats[today]) stats[today] = { pomodoros: 0, focusMinutes: 0 }
  stats[today].pomodoros += 1
  stats[today].focusMinutes += 25
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

function FocusStats({ completedPomodoros }) {
  const [stats, setStats] = useState(loadStats)

  useEffect(() => {
    setStats(loadStats())
  }, [completedPomodoros])

  // Build last 7 days
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
    days.push({
      key,
      label: i === 0 ? 'Today' : dayName,
      pomodoros: stats[key]?.pomodoros || 0,
      minutes: stats[key]?.focusMinutes || 0,
    })
  }

  const maxPomodoros = Math.max(...days.map(d => d.pomodoros), 1)
  const todayStats = days[days.length - 1]

  // Streak calculation
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].pomodoros > 0) streak++
    else break
  }

  const totalWeek = days.reduce((sum, d) => sum + d.minutes, 0)

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs text-zen-muted tracking-[0.2em] uppercase">Focus</h2>
        <div className="flex items-center gap-3">
          {streak > 1 && (
            <span className="text-xs text-zen-amber">{streak}d streak</span>
          )}
          <span className="text-[10px] text-zen-muted">{Math.round(totalWeek / 60)}h this week</span>
        </div>
      </div>

      {/* Weekly heatmap bars */}
      <div className="flex items-end gap-1.5 h-16 mb-2">
        {days.map((day, i) => {
          const height = day.pomodoros > 0 ? Math.max(12, (day.pomodoros / maxPomodoros) * 100) : 4
          const isToday = i === days.length - 1
          return (
            <div key={day.key} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-md transition-all ${
                  day.pomodoros > 0
                    ? isToday ? 'bg-zen-sage' : 'bg-zen-sage/40'
                    : 'bg-zen-border/30'
                }`}
                style={{ height: `${height}%` }}
                title={`${day.pomodoros} pomodoros (${day.minutes}m)`}
              />
            </div>
          )
        })}
      </div>

      {/* Day labels */}
      <div className="flex gap-1.5">
        {days.map((day, i) => (
          <div key={day.key} className="flex-1 text-center">
            <span className={`text-[9px] ${i === days.length - 1 ? 'text-zen-sage' : 'text-zen-muted/30'}`}>
              {day.label}
            </span>
          </div>
        ))}
      </div>

      {/* Today's stats */}
      <div className="flex items-center justify-center gap-6 mt-4 py-2 bg-zen-card/50 rounded-lg">
        <div className="text-center">
          <p className="text-lg font-light text-zen-text">{todayStats.pomodoros}</p>
          <p className="text-[10px] text-zen-muted">sessions</p>
        </div>
        <div className="w-px h-8 bg-zen-border/30" />
        <div className="text-center">
          <p className="text-lg font-light text-zen-text">{todayStats.minutes}m</p>
          <p className="text-[10px] text-zen-muted">focused</p>
        </div>
        <div className="w-px h-8 bg-zen-border/30" />
        <div className="text-center">
          <p className="text-lg font-light text-zen-text">{completedPomodoros}</p>
          <p className="text-[10px] text-zen-muted">today's cycle</p>
        </div>
      </div>
    </div>
  )
}

export default FocusStats
