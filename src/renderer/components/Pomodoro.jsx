import React, { useState } from 'react'

function Pomodoro({ timer, onZenMode }) {
  const { timeLeft, isRunning, mode, completedPomodoros, currentTask, setCurrentTask, completeCurrentTask, taskTimeAccumulated, progress, toggle, reset, skip } = timer

  const formatTimeSpent = (secs) => {
    if (secs < 60) return '<1m'
    const m = Math.floor(secs / 60)
    if (m < 60) return `${m}m`
    return `${Math.floor(m / 60)}h ${m % 60}m`
  }
  const [editingTask, setEditingTask] = useState(false)
  const [taskInput, setTaskInput] = useState('')

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`

  const modeLabel = mode === 'work' ? 'Focus' : mode === 'break' ? 'Break' : 'Long Break'
  const modeColor = mode === 'work' ? '#7DD3A8' : mode === 'break' ? '#7AACF0' : '#A78BF6'

  const ringSize = 160
  const strokeWidth = 3
  const radius = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  const handleTaskSubmit = (e) => {
    e.preventDefault()
    if (taskInput.trim()) {
      setCurrentTask({ id: 'manual', title: taskInput.trim() })
    }
    setEditingTask(false)
  }

  return (
    <div className="flex flex-col items-center py-8 px-6">
      {/* Breathing circle with timer */}
      <div
        className="relative cursor-pointer"
        onClick={onZenMode}
        title="Enter Zen Mode (Z)"
      >
        {/* Ambient glow */}
        <div className={`absolute rounded-full animate-breathe ${isRunning ? 'opacity-100' : 'opacity-30'}`} style={{
          background: `radial-gradient(circle, ${modeColor}10 0%, transparent 70%)`,
          width: ringSize + 60,
          height: ringSize + 60,
          left: -30,
          top: -30,
        }} />

        {/* Progress ring */}
        <svg width={ringSize} height={ringSize} className="transform -rotate-90">
          <circle cx={ringSize/2} cy={ringSize/2} r={radius} fill="none" stroke="#2E2D2A" strokeWidth={strokeWidth} />
          <circle
            cx={ringSize/2} cy={ringSize/2} r={radius} fill="none"
            stroke={modeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-light text-zen-text tracking-wider">{timeStr}</span>
          <span className="text-[10px] mt-1.5 tracking-[0.25em] uppercase" style={{ color: modeColor }}>{modeLabel}</span>
        </div>
      </div>

      {/* Current task - clickable to edit */}
      <div className="mt-6 text-center w-full max-w-[320px]">
        {editingTask ? (
          <form onSubmit={handleTaskSubmit} className="px-4">
            <input
              autoFocus
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              onBlur={() => setEditingTask(false)}
              placeholder="What are you working on?"
              className="w-full text-center bg-transparent border-b border-zen-border text-sm text-zen-text placeholder-zen-muted/40 focus:outline-none focus:border-zen-sage py-1"
            />
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 px-4">
            <p
              onClick={() => { setEditingTask(true); setTaskInput(currentTask?.title || '') }}
              className={`text-sm cursor-pointer py-1 px-2 rounded-lg transition-colors ${
                currentTask ? 'text-zen-text hover:bg-zen-card' : 'text-zen-muted/40 hover:text-zen-muted italic hover:bg-zen-card'
              }`}
            >
              {currentTask?.title || 'Click to set focus...'}
            </p>
            {currentTask && (
              <button
                onClick={completeCurrentTask}
                className="text-[10px] text-zen-sage hover:text-zen-text px-2 py-0.5 rounded border border-zen-sage/30 hover:border-zen-sage transition-colors"
                title="Mark as done"
              >
                Done
              </button>
            )}
          </div>
        )}
        {currentTask && taskTimeAccumulated > 0 && (
          <p className="text-[10px] text-zen-muted/40 mt-1">{formatTimeSpent(taskTimeAccumulated)} on this task</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-5 mt-5">
        <button onClick={reset} className="text-zen-muted/50 hover:text-zen-text transition-colors" title="Reset">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button
          onClick={toggle}
          className="w-12 h-12 rounded-full bg-zen-card border border-zen-border flex items-center justify-center text-zen-text hover:border-zen-sage transition-all"
        >
          {isRunning ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button onClick={skip} className="text-zen-muted/50 hover:text-zen-text transition-colors" title="Skip">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Completed dots */}
      <div className="flex items-center gap-2 mt-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
            i < (completedPomodoros % 4) ? 'bg-zen-sage scale-125' : 'bg-zen-border'
          }`} />
        ))}
        {completedPomodoros >= 4 && (
          <span className="text-[10px] text-zen-muted ml-1">{Math.floor(completedPomodoros / 4)} cycles</span>
        )}
      </div>
    </div>
  )
}

export default Pomodoro
