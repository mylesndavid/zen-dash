import React, { useState, useEffect, useRef } from 'react'

const CATEGORIES = [
  { id: 'deep', label: 'Deep Work', color: '#7DD3A8' },
  { id: 'meeting', label: 'Meeting', color: '#F5C16C' },
  { id: 'review', label: 'Review', color: '#7AACF0' },
  { id: 'break', label: 'Break', color: '#71717A' },
  { id: 'admin', label: 'Admin', color: '#A78BF6' },
]

function TimeBlocks({ blocks, categories, onAddBlock, onDeleteBlock }) {
  const [now, setNow] = useState(new Date())
  const [addingAt, setAddingAt] = useState(null)
  const [addTitle, setAddTitle] = useState('')
  const [addCat, setAddCat] = useState('deep')
  const [addDuration, setAddDuration] = useState(1)
  const timelineRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  // Scroll to current time on mount
  useEffect(() => {
    if (timelineRef.current) {
      const currentHour = now.getHours()
      const scrollTo = Math.max(0, (currentHour - 7) * 52)
      timelineRef.current.scrollTop = scrollTo
    }
  }, [])

  const currentHour = now.getHours() + now.getMinutes() / 60
  const today = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const formatHour = (h) => {
    if (h === 0 || h === 12) return '12'
    return h < 12 ? `${h}` : `${h - 12}`
  }
  const ampm = (h) => h < 12 ? 'am' : 'pm'

  const getBlockAt = (hour) => blocks.find(b => b.startHour <= hour && b.endHour > hour)
  const getCatColor = (id) => (CATEGORIES.find(c => c.id === id) || CATEGORIES[0]).color

  const handleAdd = () => {
    if (addTitle.trim() && addingAt !== null) {
      onAddBlock({
        startHour: addingAt,
        endHour: addingAt + addDuration,
        title: addTitle.trim(),
        category: addCat,
      })
      setAddingAt(null)
      setAddTitle('')
      setAddDuration(1)
    }
  }

  const HOURS = Array.from({ length: 16 }, (_, i) => i + 6) // 6am-9pm

  return (
    <div className="px-5 py-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs text-zen-muted tracking-[0.2em] uppercase">Today</h2>
        <span className="text-xs text-zen-muted">{today}</span>
      </div>

      {/* Add block modal */}
      {addingAt !== null && (
        <div className="mb-4 bg-zen-card border border-zen-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zen-muted">{formatHour(addingAt)}{ampm(addingAt)} - {formatHour(addingAt + addDuration)}{ampm(addingAt + addDuration)}</span>
            <button onClick={() => setAddingAt(null)} className="text-zen-muted hover:text-zen-text text-xs">Cancel</button>
          </div>

          <input
            autoFocus
            value={addTitle}
            onChange={e => setAddTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="What's this block for?"
            className="w-full bg-zen-surface border border-zen-border rounded-lg px-3 py-2 text-sm text-zen-text placeholder-zen-muted/40 focus:border-zen-sage focus:outline-none mb-3"
          />

          {/* Duration */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-zen-muted">Duration:</span>
            {[0.5, 1, 1.5, 2, 3].map(d => (
              <button
                key={d}
                onClick={() => setAddDuration(d)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  addDuration === d ? 'bg-zen-sage/20 text-zen-sage' : 'text-zen-muted hover:text-zen-text'
                }`}
              >
                {d}h
              </button>
            ))}
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 mb-3">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setAddCat(c.id)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all ${
                  addCat === c.id ? 'bg-zen-surface ring-1 ring-zen-border' : 'opacity-50 hover:opacity-100'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-zen-text">{c.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleAdd}
            disabled={!addTitle.trim()}
            className="w-full py-2 bg-zen-sage/20 text-zen-sage text-xs font-medium rounded-lg hover:bg-zen-sage/30 transition-colors disabled:opacity-30"
          >
            Add Block
          </button>
        </div>
      )}

      {/* Timeline */}
      <div ref={timelineRef} className="relative flex-1 min-h-0 overflow-y-auto pr-1">
        {HOURS.map(hour => {
          const block = getBlockAt(hour)
          const isNow = Math.floor(currentHour) === hour
          const isPast = hour < Math.floor(currentHour)
          const isBlockStart = block && block.startHour === hour
          const isBlockContinuation = block && block.startHour !== hour

          if (isBlockContinuation) return null

          const blockHeight = block ? (block.endHour - block.startHour) * 52 : 52

          return (
            <div key={hour} className="flex" style={{ height: blockHeight }}>
              {/* Hour label */}
              <div className="w-10 flex-shrink-0 pt-1">
                <div className="flex items-baseline justify-end pr-2">
                  <span className={`text-xs font-light ${isNow ? 'text-zen-amber' : isPast ? 'text-zen-muted/25' : 'text-zen-muted/50'}`}>
                    {formatHour(hour)}
                  </span>
                  <span className={`text-[8px] ml-0.5 ${isNow ? 'text-zen-amber' : isPast ? 'text-zen-muted/25' : 'text-zen-muted/30'}`}>
                    {ampm(hour)}
                  </span>
                </div>
              </div>

              {/* Line + dot */}
              <div className="relative w-4 flex-shrink-0 flex justify-center">
                <div className="w-px h-full bg-zen-border" />
                {isNow && (
                  <div className="absolute w-2 h-2 bg-zen-amber rounded-full -left-[3px] left-1/2 -translate-x-1/2 animate-pulse-soft"
                    style={{ top: `${(now.getMinutes() / 60) * 100}%` }}
                  />
                )}
              </div>

              {/* Block or empty slot */}
              <div className="flex-1 pl-2 pr-1 py-0.5">
                {isBlockStart ? (
                  <div
                    className="h-full rounded-lg px-3 py-2 group cursor-pointer relative overflow-hidden"
                    style={{
                      backgroundColor: getCatColor(block.category) + '12',
                      borderLeft: `3px solid ${getCatColor(block.category)}`,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-zen-text font-medium">{block.title}</p>
                        <p className="text-[10px] text-zen-muted mt-1">
                          {formatHour(block.startHour)}{ampm(block.startHour)} - {formatHour(block.endHour)}{ampm(block.endHour)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id) }}
                        className="text-zen-muted/0 group-hover:text-zen-muted hover:text-zen-coral text-xs transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => { setAddingAt(hour); setAddTitle(''); setAddDuration(1) }}
                    className="h-full rounded-lg border border-dashed border-transparent hover:border-zen-border/50 cursor-pointer flex items-center justify-center transition-all group"
                  >
                    <span className="text-zen-muted/0 group-hover:text-zen-muted/30 text-lg transition-colors">+</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TimeBlocks
