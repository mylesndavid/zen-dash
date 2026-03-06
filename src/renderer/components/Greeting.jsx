import React, { useState, useEffect } from 'react'

function Greeting() {
  const [intention, setIntention] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('zen-dash-intention') || '{}')
      const today = new Date().toISOString().split('T')[0]
      return stored[today] || ''
    } catch { return '' }
  })
  const [editing, setEditing] = useState(false)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const saveIntention = (text) => {
    setIntention(text)
    try {
      const today = new Date().toISOString().split('T')[0]
      const stored = JSON.parse(localStorage.getItem('zen-dash-intention') || '{}')
      stored[today] = text
      localStorage.setItem('zen-dash-intention', JSON.stringify(stored))
    } catch {}
  }

  return (
    <div className="px-5">
      <h1 className="text-lg font-light text-zen-text tracking-wide">{greeting}</h1>
      {editing ? (
        <input
          autoFocus
          value={intention}
          onChange={e => saveIntention(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={e => e.key === 'Enter' && setEditing(false)}
          placeholder="What's your intention today?"
          className="w-full bg-transparent text-sm text-zen-muted placeholder-zen-muted/30 focus:outline-none mt-1 border-b border-zen-border/30 pb-1"
        />
      ) : (
        <p
          onClick={() => setEditing(true)}
          className={`text-sm mt-1 cursor-pointer transition-colors ${
            intention ? 'text-zen-muted hover:text-zen-text' : 'text-zen-muted/25 hover:text-zen-muted italic'
          }`}
        >
          {intention || 'Set your intention for today...'}
        </p>
      )}
    </div>
  )
}

export default Greeting
