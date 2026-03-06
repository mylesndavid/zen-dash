import React, { useEffect } from 'react'

function ZenMode({ timer, onExit }) {
  const { timeLeft, isRunning, mode, currentTask, progress, toggle } = timer

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`
  const modeLabel = mode === 'work' ? 'Focus' : mode === 'break' ? 'Break' : 'Long Break'

  const ringSize = 280
  const strokeWidth = 2
  const radius = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onExit()
      if (e.key === ' ') { e.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onExit, toggle])

  return (
    <div
      className="fixed inset-0 z-50 zen-gradient flex flex-col items-center justify-center cursor-pointer"
      onClick={onExit}
    >
      {/* Large breathing ring */}
      <div className="relative" onClick={e => { e.stopPropagation(); toggle() }}>
        <div className={`absolute rounded-full animate-breathe-slow ${
          isRunning ? 'opacity-100' : 'opacity-30'
        }`} style={{
          background: mode === 'work'
            ? 'radial-gradient(circle, rgba(125,211,168,0.06) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(122,172,240,0.06) 0%, transparent 70%)',
          width: ringSize + 120,
          height: ringSize + 120,
          left: -60,
          top: -60,
        }} />

        <svg width={ringSize} height={ringSize} className="transform -rotate-90">
          <circle cx={ringSize/2} cy={ringSize/2} r={radius} fill="none" stroke="#1A1917" strokeWidth={strokeWidth} />
          <circle
            cx={ringSize/2} cy={ringSize/2} r={radius} fill="none"
            stroke={mode === 'work' ? '#7DD3A8' : '#7AACF0'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-extralight text-zen-text tracking-widest">{timeStr}</span>
          <span className="text-sm text-zen-muted mt-3 tracking-[0.3em] uppercase">{modeLabel}</span>
        </div>
      </div>

      {/* Current task */}
      {currentTask && (
        <p className="text-zen-muted text-sm mt-12 tracking-wide">{currentTask.title}</p>
      )}

      {/* Exit hint */}
      <p className="absolute bottom-8 text-zen-muted/30 text-xs tracking-widest uppercase">esc to exit</p>
    </div>
  )
}

export default ZenMode
