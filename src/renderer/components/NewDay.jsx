import React, { useState, useRef, useEffect } from 'react'

function NewDay({ onStart, onCancel }) {
  const [intention, setIntention] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  const handleStart = () => {
    if (!intention.trim()) return

    const today = new Date().toISOString().split('T')[0]

    // Save intention
    try {
      const stored = JSON.parse(localStorage.getItem('zen-dash-intention') || '{}')
      stored[today] = intention.trim()
      localStorage.setItem('zen-dash-intention', JSON.stringify(stored))
    } catch {}

    // Clear done tasks, keep undone
    try {
      const tasks = JSON.parse(localStorage.getItem('zen-dash-manual-tasks') || '[]')
      const carried = tasks.filter(t => !t.done)
      localStorage.setItem('zen-dash-manual-tasks', JSON.stringify(carried))
    } catch {}

    // Clear canvas
    localStorage.removeItem('zen-dash-canvas-notes')
    localStorage.removeItem('zen-dash-canvas-notes-connections')

    // Clear completed tasks
    try {
      const completed = JSON.parse(localStorage.getItem('zen-dash-completed-tasks') || '{}')
      delete completed[today]
      localStorage.setItem('zen-dash-completed-tasks', JSON.stringify(completed))
    } catch {}

    // Mark day started
    localStorage.setItem('zen-dash-current-day', today)

    onStart()
  }

  const handleSkip = () => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem('zen-dash-current-day', today)
    onStart()
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="fixed inset-0 z-[90] bg-zen-bg flex items-center justify-center">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(125,211,168,0.03) 0%, transparent 60%)',
      }} />

      <div className="relative flex flex-col items-center gap-8 max-w-md w-full px-8">
        <div className="text-center">
          <h1 className="text-3xl font-light text-zen-text tracking-wide">{greeting}</h1>
          <p className="text-sm text-zen-muted mt-2">Start a fresh day</p>
        </div>

        <div className="w-full">
          <label className="text-[10px] text-zen-muted tracking-[0.2em] uppercase mb-3 block">
            What is your intention today?
          </label>
          <input
            ref={inputRef}
            value={intention}
            onChange={e => setIntention(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleStart()
              if (e.key === 'Escape') onCancel()
            }}
            placeholder="Focus deeply, ship the feature, take it slow..."
            className="w-full bg-zen-surface border border-zen-border/40 rounded-xl px-4 py-3 text-zen-text text-sm placeholder-zen-muted/25 focus:outline-none focus:border-zen-sage/40 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStart}
            disabled={!intention.trim()}
            className={`px-8 py-2.5 rounded-xl text-sm transition-all ${
              intention.trim()
                ? 'bg-zen-sage/15 border border-zen-sage/30 text-zen-sage hover:bg-zen-sage/25'
                : 'bg-zen-card border border-zen-border/30 text-zen-muted/30 cursor-not-allowed'
            }`}
          >
            Begin
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl text-sm text-zen-muted hover:text-zen-text border border-zen-border/30 hover:border-zen-border transition-colors"
          >
            Cancel
          </button>
        </div>

        <button
          onClick={handleSkip}
          className="text-xs text-zen-muted/20 hover:text-zen-muted transition-colors"
        >
          continue without resetting
        </button>
      </div>
    </div>
  )
}

export default NewDay
