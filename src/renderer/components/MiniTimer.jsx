import React, { useState } from 'react'
import FocusStats from './FocusStats'
import CompletedTasks from './CompletedTasks'

function MiniTimer({ timer, onZenMode }) {
  const [showPopover, setShowPopover] = useState(false)

  const { timeLeft, isRunning, mode, currentTask, progress, toggle, completedPomodoros } = timer

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`
  const modeColor = mode === 'work' ? '#7DD3A8' : mode === 'break' ? '#7AACF0' : '#A78BF6'

  const ringSize = 22
  const strokeWidth = 2
  const radius = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <div className="relative">
      {/* Mini timer button */}
      <button
        onClick={() => setShowPopover(!showPopover)}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors ${
          showPopover ? 'bg-zen-card' : 'hover:bg-zen-card/50'
        }`}
      >
        {/* Tiny progress ring */}
        <svg width={ringSize} height={ringSize} className="transform -rotate-90">
          <circle cx={ringSize/2} cy={ringSize/2} r={radius} fill="none" stroke="#2A2A2F" strokeWidth={strokeWidth} />
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

        {/* Time */}
        <span className="text-xs font-medium text-zen-text tabular-nums">{timeStr}</span>

        {/* Current task (truncated) */}
        {currentTask && (
          <>
            <span className="text-zen-muted/30">|</span>
            <span className="text-xs text-zen-muted truncate max-w-[140px]">{currentTask.title}</span>
          </>
        )}

        {/* Play/pause indicator */}
        {isRunning ? (
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: modeColor }} />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-zen-muted/30" />
        )}
      </button>

      {/* Popover */}
      {showPopover && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowPopover(false)} />

          {/* Panel */}
          <div className="absolute top-full left-0 mt-2 z-50 bg-zen-surface border border-zen-border/50 rounded-2xl shadow-2xl w-80 max-h-[70vh] overflow-y-auto">
            <FocusStats completedPomodoros={completedPomodoros} />
            {timer.completedTasks.length > 0 && (
              <>
                <div className="mx-6 border-t border-zen-border/20" />
                <CompletedTasks completedTasks={timer.completedTasks} />
              </>
            )}
            <div className="h-3" />
          </div>
        </>
      )}
    </div>
  )
}

export default MiniTimer
