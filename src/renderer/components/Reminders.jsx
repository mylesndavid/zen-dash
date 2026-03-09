import React, { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'zen-dash-reminders'

function Reminders() {
  const [show, setShow] = useState(false)
  const [reminders, setReminders] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
  })
  const [newText, setNewText] = useState('')
  const [hour, setHour] = useState(() => {
    const h = new Date().getHours()
    return h
  })
  const [minute, setMinute] = useState(() => {
    const m = new Date().getMinutes()
    return Math.ceil(m / 5) * 5 % 60
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const panelRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders))
  }, [reminders])

  // Click outside to close
  useEffect(() => {
    if (!show) return
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShow(false)
    }
    setTimeout(() => document.addEventListener('mousedown', handleClick), 0)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [show])

  // Check reminders every 10 seconds
  useEffect(() => {
    const check = () => {
      const now = Date.now()
      setReminders(prev => {
        let changed = false
        const next = prev.map(r => {
          if (!r.fired && r.time <= now) {
            changed = true
            // Fire native notification via main process
            try {
              window.api?.showNotification('Reminder', r.text)
            } catch {}
            return { ...r, fired: true }
          }
          return r
        })
        return changed ? next : prev
      })
    }
    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])

  const addReminder = () => {
    if (!newText.trim()) return
    const d = showDatePicker && customDate ? new Date(customDate) : new Date()
    d.setHours(hour, minute, 0, 0)
    // If the time is in the past today, bump to tomorrow (unless custom date)
    if (!showDatePicker && d.getTime() <= Date.now()) {
      d.setDate(d.getDate() + 1)
    }

    setReminders(prev => [...prev, {
      id: Date.now().toString(),
      text: newText.trim(),
      time: d.getTime(),
      fired: false,
    }])
    setNewText('')
  }

  const deleteReminder = (id) => {
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  const upcoming = reminders.filter(r => !r.fired).sort((a, b) => a.time - b.time)
  const past = reminders.filter(r => r.fired).sort((a, b) => b.time - a.time).slice(0, 5)

  const formatTime = (ts) => {
    const d = new Date(ts)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    if (isToday) return time
    const tmrw = new Date(now)
    tmrw.setDate(tmrw.getDate() + 1)
    if (d.toDateString() === tmrw.toDateString()) return `Tomorrow ${time}`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + time
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
  const isPM = hour >= 12
  const display12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour

  const setHour12 = (h12, pm) => {
    if (h12 === 12) setHour(pm ? 12 : 0)
    else setHour(pm ? h12 + 12 : h12)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setShow(!show)}
        className={`p-1.5 rounded-full transition-colors relative ${
          upcoming.length > 0 ? 'text-zen-amber' : 'text-zen-muted hover:text-zen-text'
        }`}
        title="Reminders"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {upcoming.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-zen-amber rounded-full text-[7px] text-zen-bg flex items-center justify-center font-medium">
            {upcoming.length}
          </span>
        )}
      </button>

      {show && (
        <div className="absolute top-full right-0 mt-2 bg-zen-card border border-zen-border rounded-xl shadow-2xl w-80 z-50">
          {/* New reminder */}
          <div className="p-3 border-b border-zen-border/30">
            <input
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addReminder()}
              placeholder="Remind me to..."
              className="w-full bg-zen-surface border border-zen-border/30 rounded-lg px-2.5 py-1.5 text-xs text-zen-text placeholder-zen-muted/25 focus:outline-none focus:border-zen-sage/30 mb-2"
            />

            {/* Time picker */}
            <div className="flex items-center gap-2">
              {/* Hour */}
              <select
                value={display12}
                onChange={e => setHour12(parseInt(e.target.value), isPM)}
                className="bg-zen-surface border border-zen-border/30 rounded-lg px-2 py-1 text-xs text-zen-text focus:outline-none appearance-none cursor-pointer"
              >
                {hours.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="text-zen-muted text-xs">:</span>
              {/* Minute */}
              <select
                value={minute}
                onChange={e => setMinute(parseInt(e.target.value))}
                className="bg-zen-surface border border-zen-border/30 rounded-lg px-2 py-1 text-xs text-zen-text focus:outline-none appearance-none cursor-pointer"
              >
                {minutes.map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>)}
              </select>
              {/* AM/PM */}
              <button
                onClick={() => setHour12(display12, !isPM)}
                className="bg-zen-surface border border-zen-border/30 rounded-lg px-2 py-1 text-xs text-zen-text"
              >
                {isPM ? 'PM' : 'AM'}
              </button>

              {/* Different day toggle */}
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                  showDatePicker ? 'border-zen-sage/30 text-zen-sage' : 'border-zen-border/30 text-zen-muted/40 hover:text-zen-muted'
                }`}
              >
                Date
              </button>

              <button
                onClick={addReminder}
                disabled={!newText.trim()}
                className={`ml-auto px-3 py-1 rounded-lg text-[10px] transition-colors ${
                  newText.trim() ? 'bg-zen-sage/15 text-zen-sage' : 'bg-zen-surface text-zen-muted/30'
                }`}
              >
                Set
              </button>
            </div>

            {showDatePicker && (
              <input
                type="date"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                className="mt-2 w-full bg-zen-surface border border-zen-border/30 rounded-lg px-2 py-1 text-xs text-zen-text focus:outline-none"
              />
            )}
          </div>

          {/* Reminder list */}
          <div className="max-h-48 overflow-y-auto p-2">
            {upcoming.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] text-zen-muted/40 tracking-wider uppercase px-2 py-1">Upcoming</p>
                {upcoming.map(r => (
                  <ReminderRow key={r.id} reminder={r} onDelete={deleteReminder} onUpdate={(id, updates) => {
                    setReminders(prev => prev.map(rem => rem.id === id ? { ...rem, ...updates } : rem))
                  }} formatTime={formatTime} />
                ))}
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="text-[9px] text-zen-muted/40 tracking-wider uppercase px-2 py-1">Past</p>
                {past.map(r => (
                  <div key={r.id} className="flex items-center gap-2 px-2 py-1.5 group opacity-40">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zen-muted truncate">{r.text}</p>
                      <p className="text-[10px] text-zen-muted">{formatTime(r.time)}</p>
                    </div>
                    <button
                      onClick={() => deleteReminder(r.id)}
                      className="text-zen-muted/0 group-hover:text-zen-muted hover:text-zen-coral text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {upcoming.length === 0 && past.length === 0 && (
              <p className="text-zen-muted/20 text-xs text-center py-4">No reminders</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ReminderRow({ reminder, onDelete, onUpdate, formatTime }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(reminder.text)
  const [editDate, setEditDate] = useState(() => {
    const d = new Date(reminder.time)
    return d.toISOString().slice(0, 16)
  })

  const save = () => {
    const time = new Date(editDate).getTime()
    if (editText.trim() && !isNaN(time)) {
      onUpdate(reminder.id, { text: editText.trim(), time })
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="px-2 py-2 rounded-lg bg-zen-surface/50 space-y-1.5">
        <input
          autoFocus
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="w-full bg-zen-bg border border-zen-border/30 rounded-lg px-2 py-1 text-xs text-zen-text focus:outline-none"
        />
        <input
          type="datetime-local"
          value={editDate}
          onChange={e => setEditDate(e.target.value)}
          className="w-full bg-zen-bg border border-zen-border/30 rounded-lg px-2 py-1 text-[10px] text-zen-text focus:outline-none"
        />
        <div className="flex gap-1">
          <button onClick={save} className="text-[10px] text-zen-sage px-2 py-0.5 rounded bg-zen-sage/10">Save</button>
          <button onClick={() => setEditing(false)} className="text-[10px] text-zen-muted px-2 py-0.5">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zen-surface/50 group">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zen-text truncate">{reminder.text}</p>
        <p className="text-[10px] text-zen-amber">{formatTime(reminder.time)}</p>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="text-zen-muted/0 group-hover:text-zen-muted/40 hover:text-zen-text text-[10px] transition-colors"
        title="Edit"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
        </svg>
      </button>
      <button
        onClick={() => onDelete(reminder.id)}
        className="text-zen-muted/0 group-hover:text-zen-muted hover:text-zen-coral text-xs transition-colors"
      >
        ×
      </button>
    </div>
  )
}

export default Reminders
