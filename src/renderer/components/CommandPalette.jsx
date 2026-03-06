import React, { useState, useEffect, useRef } from 'react'

function CommandPalette({ onAction, onClose }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)

  const COMMANDS = [
    { id: 'start-timer', label: 'Start Timer', shortcut: 'Space', icon: '▶', category: 'Pomodoro' },
    { id: 'pause-timer', label: 'Pause Timer', shortcut: 'Space', icon: '⏸', category: 'Pomodoro' },
    { id: 'reset-timer', label: 'Reset Timer', icon: '↺', category: 'Pomodoro' },
    { id: 'skip-timer', label: 'Skip to Break', icon: '⏭', category: 'Pomodoro' },
    { id: 'zen-mode', label: 'Enter Zen Mode', shortcut: 'Z', icon: '◯', category: 'Focus' },
    { id: 'new-block', label: 'New Time Block', icon: '▓', category: 'Timeline' },
    { id: 'new-task', label: 'New Task', icon: '☐', category: 'Tasks' },
    { id: 'new-note', label: 'New Canvas Note', icon: '📝', category: 'Canvas' },
    { id: 'new-voice', label: 'New Voice Note', icon: '🎙', category: 'Canvas' },
    { id: 'new-checklist', label: 'New Checklist', icon: '☑', category: 'Canvas' },
    { id: 'toggle-sounds', label: 'Toggle Ambient Sounds', icon: '🎧', category: 'Focus' },
    { id: 'expand-pomodoro', label: 'Expand Pomodoro', icon: '⤢', category: 'Layout' },
    { id: 'expand-timeline', label: 'Expand Timeline', icon: '⤢', category: 'Layout' },
    { id: 'expand-tasks', label: 'Expand Tasks', icon: '⤢', category: 'Layout' },
    { id: 'expand-canvas', label: 'Expand Canvas', icon: '⤢', category: 'Layout' },
    { id: 'collapse', label: 'Collapse All', shortcut: 'Esc', icon: '⤡', category: 'Layout' },
  ]

  const filtered = query
    ? COMMANDS.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setSelected(0)
  }, [query])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(prev => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && filtered[selected]) {
      onAction(filtered[selected].id)
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  // Group by category
  const grouped = {}
  filtered.forEach(cmd => {
    if (!grouped[cmd.category]) grouped[cmd.category] = []
    grouped[cmd.category].push(cmd)
  })

  let globalIdx = -1

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-[100]" onClick={onClose}>
      <div
        className="bg-zen-card border border-zen-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zen-border/50">
          <span className="text-zen-muted/40 text-sm">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-sm text-zen-text placeholder-zen-muted/30 focus:outline-none"
          />
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-2">
          {Object.entries(grouped).map(([category, cmds]) => (
            <div key={category}>
              <p className="text-[10px] text-zen-muted/40 tracking-[0.15em] uppercase px-4 pt-2 pb-1">{category}</p>
              {cmds.map(cmd => {
                globalIdx++
                const idx = globalIdx
                return (
                  <button
                    key={cmd.id}
                    onClick={() => { onAction(cmd.id); onClose() }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-xs transition-colors ${
                      selected === idx ? 'bg-zen-sage/10 text-zen-text' : 'text-zen-text hover:bg-zen-border/20'
                    }`}
                  >
                    <span className="w-5 text-center text-sm opacity-60">{cmd.icon}</span>
                    <span className="flex-1 text-left">{cmd.label}</span>
                    {cmd.shortcut && (
                      <span className="text-[10px] text-zen-muted/30 bg-zen-surface px-1.5 py-0.5 rounded">{cmd.shortcut}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-zen-muted/30 text-center py-6">No commands found</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
