import React, { useState, useEffect, useRef } from 'react'
import VoiceNote from './VoiceNote'
import FileViewer from './FileViewer'

const STORAGE_KEY = 'zen-dash-canvas-notes'
const NOTE_COLORS = ['#7DD3A8', '#7AACF0', '#A78BF6', '#F5C16C', '#F07A7A']

function Canvas() {
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
  })
  const [contextMenu, setContextMenu] = useState(null) // { x, y, canvasX, canvasY }
  const [connections, setConnections] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY + '-connections') || '[]') } catch { return [] }
  })
  const [connecting, setConnecting] = useState(null) // noteId being connected from
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '-connections', JSON.stringify(connections))
  }, [connections])

  // Close context menu on click anywhere
  useEffect(() => {
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  const addNote = (x, y, type = 'note', content = '', extra = {}) => {
    const id = Date.now().toString()
    setNotes(prev => [...prev, {
      id,
      x: x || 40 + Math.random() * 200,
      y: y || 60 + Math.random() * 150,
      text: content,
      type, // 'note' | 'heading' | 'todo' | 'file' | 'divider' | 'image' | 'voice' | 'fileview'
      color: NOTE_COLORS[notes.length % NOTE_COLORS.length],
      editing: type === 'note' || type === 'heading' || type === 'todo',
      done: false,
      items: type === 'todo' ? [{ text: '', done: false }] : undefined,
      ...extra,
    }])
    setContextMenu(null)
    return id
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      canvasX: e.clientX - rect.left,
      canvasY: e.clientY - rect.top,
    })
  }

  const handleCanvasClick = (e) => {
    if (connecting) {
      setConnecting(null)
      return
    }
  }

  const updateNote = (id, updates) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
  }

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id))
  }

  const VIEWABLE_EXTS = ['csv', 'md', 'txt', 'log', 'json', 'yml', 'yaml', 'pdf']

  const processFile = (file, x, y) => {
    const ext = file.name.split('.').pop().toLowerCase()
    const isImage = file.type.startsWith('image/')
    const isViewable = VIEWABLE_EXTS.includes(ext)

    if (isImage) {
      const reader = new FileReader()
      reader.onload = (ev) => addNote(x, y, 'image', ev.target.result)
      reader.readAsDataURL(file)
    } else if (isViewable) {
      if (ext === 'pdf') {
        const reader = new FileReader()
        reader.onload = (ev) => {
          addNote(x, y, 'fileview', '', {
            fileName: file.name,
            fileSize: `${(file.size / 1024).toFixed(1)} KB`,
            fileContent: ev.target.result,
          })
        }
        reader.readAsDataURL(file)
      } else {
        const reader = new FileReader()
        reader.onload = (ev) => {
          addNote(x, y, 'fileview', '', {
            fileName: file.name,
            fileSize: `${(file.size / 1024).toFixed(1)} KB`,
            fileContent: ev.target.result,
          })
        }
        reader.readAsText(file)
      }
    } else {
      addNote(x, y, 'file', `${file.name}\n${(file.size / 1024).toFixed(1)} KB`)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    files.forEach((file, i) => {
      processFile(file, (contextMenu?.canvasX || 60) + i * 30, (contextMenu?.canvasY || 60) + i * 30)
    })
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    Array.from(e.dataTransfer.files).forEach((file, i) => {
      processFile(file, x + i * 30, y + i * 30)
    })
  }

  const handleConnect = (noteId) => {
    if (!connecting) {
      setConnecting(noteId)
    } else if (connecting !== noteId) {
      setConnections(prev => [...prev, { from: connecting, to: noteId }])
      setConnecting(null)
    }
  }

  const clearAll = () => {
    setNotes([])
    setConnections([])
    setContextMenu(null)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h2 className="text-xs text-zen-muted tracking-[0.2em] uppercase">Thinking Space</h2>
        <span className="text-[10px] text-zen-muted/30">right-click for options</span>
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden"
        onContextMenu={handleContextMenu}
        onClick={handleCanvasClick}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #ECECEF 0.5px, transparent 0.5px)',
          backgroundSize: '20px 20px',
        }} />

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {connections.map((conn, i) => {
            const from = notes.find(n => n.id === conn.from)
            const to = notes.find(n => n.id === conn.to)
            if (!from || !to) return null
            return (
              <line
                key={i}
                x1={from.x + 100} y1={from.y + 30}
                x2={to.x + 100} y2={to.y + 30}
                stroke="#71717A"
                strokeWidth={1}
                strokeDasharray="4 4"
                opacity={0.3}
              />
            )
          })}
        </svg>

        {/* Notes */}
        {notes.map(note => (
          <FloatingNote
            key={note.id}
            note={note}
            onUpdate={updateNote}
            onDelete={deleteNote}
            onConnect={handleConnect}
            connecting={connecting}
          />
        ))}

        {notes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <p className="text-zen-muted/15 text-sm">Right-click to get started</p>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onAddNote={() => addNote(contextMenu.canvasX, contextMenu.canvasY, 'note')}
            onAddHeading={() => addNote(contextMenu.canvasX, contextMenu.canvasY, 'heading')}
            onAddTodo={() => addNote(contextMenu.canvasX, contextMenu.canvasY, 'todo')}
            onAddVoice={() => addNote(contextMenu.canvasX, contextMenu.canvasY, 'voice')}
            onAddFile={() => { fileInputRef.current?.click(); setContextMenu(null) }}
            onAddDivider={() => addNote(contextMenu.canvasX, contextMenu.canvasY, 'divider', '—')}
            onClear={notes.length > 0 ? clearAll : null}
          />
        )}

        {/* Connecting indicator */}
        {connecting && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-zen-card border border-zen-blue/30 text-zen-blue text-[10px] px-3 py-1 rounded-full">
            Click another note to connect, or click empty space to cancel
          </div>
        )}
      </div>
    </div>
  )
}

function ContextMenu({ x, y, onAddNote, onAddHeading, onAddTodo, onAddVoice, onAddFile, onAddDivider, onClear }) {
  return (
    <div
      className="fixed z-50 bg-zen-card border border-zen-border rounded-xl shadow-2xl py-1.5 min-w-[180px]"
      style={{ left: x, top: y }}
      onClick={e => e.stopPropagation()}
    >
      <MenuItem icon={<NoteIcon />} label="Note" onClick={onAddNote} shortcut="Click" />
      <MenuItem icon={<HeadingIcon />} label="Heading" onClick={onAddHeading} />
      <MenuItem icon={<CheckIcon />} label="Checklist" onClick={onAddTodo} />
      <MenuItem icon={<MicIcon />} label="Voice Note" onClick={onAddVoice} />
      <div className="mx-2 my-1 border-t border-zen-border/30" />
      <MenuItem icon={<FileIcon />} label="Add File" onClick={onAddFile} />
      <MenuItem icon={<DividerIcon />} label="Divider" onClick={onAddDivider} />
      {onClear && (
        <>
          <div className="mx-2 my-1 border-t border-zen-border/30" />
          <MenuItem icon={<TrashIcon />} label="Clear All" onClick={onClear} danger />
        </>
      )}
    </div>
  )
}

function MenuItem({ icon, label, onClick, shortcut, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors ${
        danger ? 'text-zen-coral hover:bg-zen-coral/10' : 'text-zen-text hover:bg-zen-border/30'
      }`}
    >
      <span className="w-4 flex items-center justify-center text-zen-muted">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <span className="text-zen-muted/30 text-[10px]">{shortcut}</span>}
    </button>
  )
}

const NoteIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
const HeadingIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8" /></svg>
const CheckIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const MicIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
const FileIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
const DividerIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
const TrashIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>

function FloatingNote({ note, onUpdate, onDelete, onConnect, connecting }) {
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const textareaRef = useRef(null)

  useEffect(() => {
    if (note.editing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [note.editing])

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
    setDragOffset({ x: e.clientX - note.x, y: e.clientY - note.y })
  }

  useEffect(() => {
    if (!dragging) return
    const move = (e) => onUpdate(note.id, { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y })
    const up = () => setDragging(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [dragging, dragOffset, note.id, onUpdate])

  // Resize
  const resizeStartRef = useRef({ w: 0, h: 0 })

  const handleResizeStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setResizing(true)
    setDragOffset({ x: e.clientX, y: e.clientY })
    resizeStartRef.current = { w: note.width || width, h: note.height || 0 }
  }

  useEffect(() => {
    if (!resizing) return
    const { w: startW, h: startH } = resizeStartRef.current
    const startX = dragOffset.x
    const startY = dragOffset.y
    const move = (e) => {
      const newW = Math.max(140, startW + (e.clientX - startX))
      const newH = startH ? Math.max(60, startH + (e.clientY - startY)) : undefined
      const updates = { width: newW }
      if (newH) updates.height = newH
      else if (e.clientY - startY > 10) updates.height = 120 + (e.clientY - startY)
      onUpdate(note.id, updates)
    }
    const up = () => setResizing(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [resizing, dragOffset])

  const handleNoteClick = (e) => {
    e.stopPropagation()
    if (connecting) onConnect(note.id)
  }

  // Render based on type
  const renderContent = () => {
    switch (note.type) {
      case 'heading':
        return (
          <input
            ref={textareaRef}
            value={note.text}
            onChange={e => onUpdate(note.id, { text: e.target.value })}
            onFocus={() => onUpdate(note.id, { editing: true })}
            onBlur={() => onUpdate(note.id, { editing: false })}
            placeholder="Heading..."
            className="w-full bg-transparent text-sm font-semibold text-zen-text placeholder-zen-muted/25 focus:outline-none"
          />
        )

      case 'todo':
        return <TodoList note={note} onUpdate={onUpdate} />

      case 'voice':
        return <VoiceNote note={note} onUpdate={onUpdate} />

      case 'fileview':
        return <FileViewer note={note} onUpdate={onUpdate} />

      case 'file':
        return (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-zen-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
            <div className="min-w-0">
              <p className="text-xs text-zen-text truncate">{(note.text || '').split('\n')[0]}</p>
              <p className="text-[10px] text-zen-muted">{(note.text || '').split('\n')[1]}</p>
            </div>
          </div>
        )

      case 'image':
        return (
          <img src={note.text} alt="" className="max-w-full rounded" style={{ maxHeight: 200 }} />
        )

      case 'divider':
        return <div className="border-t border-zen-border/50 my-1" style={{ width: 160 }} />

      default: // 'note'
        return (
          <textarea
            ref={textareaRef}
            value={note.text}
            onChange={e => onUpdate(note.id, { text: e.target.value })}
            onFocus={() => onUpdate(note.id, { editing: true })}
            onBlur={() => onUpdate(note.id, { editing: false })}
            placeholder="Type something..."
            className="w-full bg-transparent text-xs text-zen-text placeholder-zen-muted/25 focus:outline-none resize-none leading-relaxed"
            rows={Math.max(2, (note.text || '').split('\n').length)}
          />
        )
    }
  }

  const defaultWidth = note.type === 'divider' ? 180 : note.type === 'image' ? 240 : note.type === 'voice' ? 240 : note.type === 'fileview' ? 280 : 200
  const width = note.width || defaultWidth

  return (
    <div
      className={`absolute group transition-transform ${dragging ? 'cursor-grabbing z-20 scale-[1.03]' : resizing ? 'z-20' : 'cursor-grab z-10 hover:z-20'} ${
        connecting ? 'ring-1 ring-zen-blue/30 rounded-xl' : ''
      }`}
      style={{ left: note.x, top: note.y, width, zIndex: dragging || resizing ? 50 : 10 }}
      onMouseDown={handleMouseDown}
      onClick={handleNoteClick}
    >
      <div
        className={`rounded-xl shadow-lg border backdrop-blur-sm transition-shadow hover:shadow-xl relative overflow-hidden ${
          note.type === 'divider' ? 'p-1 bg-transparent border-transparent shadow-none' : 'p-3'
        }`}
        style={{
          ...(note.type !== 'divider' ? { backgroundColor: note.color + '08', borderColor: note.color + '20' } : {}),
          ...(note.height ? { height: note.height } : {}),
        }}
      >
        {/* Header - only for non-divider types */}
        {note.type !== 'divider' && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: note.color }} />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onConnect(note.id) }}
                className="text-zen-muted/0 group-hover:text-zen-muted/40 hover:text-zen-blue text-[10px] transition-colors px-1"
                title="Connect to another note"
              >
                ⟶
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
                className="text-zen-muted/0 group-hover:text-zen-muted/40 hover:text-zen-coral text-sm transition-colors leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {renderContent()}

        {/* Resize handle */}
        {note.type !== 'divider' && (
          <div
            onMouseDown={handleResizeStart}
            className="absolute bottom-1 right-1 w-3 h-3 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg viewBox="0 0 6 6" className="w-full h-full text-zen-muted/30">
              <circle cx="5" cy="5" r="0.8" fill="currentColor" />
              <circle cx="2.5" cy="5" r="0.8" fill="currentColor" />
              <circle cx="5" cy="2.5" r="0.8" fill="currentColor" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}

function TodoList({ note, onUpdate }) {
  const items = note.items || [{ text: '', done: false }]

  const updateItem = (idx, updates) => {
    const next = items.map((it, i) => i === idx ? { ...it, ...updates } : it)
    onUpdate(note.id, { items: next })
  }

  const addItem = () => {
    onUpdate(note.id, { items: [...items, { text: '', done: false }] })
  }

  const removeItem = (idx) => {
    if (items.length <= 1) return
    onUpdate(note.id, { items: items.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); updateItem(i, { done: !item.done }) }}
            className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
              item.done ? 'bg-zen-sage border-zen-sage' : 'border-zen-border hover:border-zen-sage'
            }`}
          >
            {item.done && (
              <svg className="w-2 h-2 text-zen-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <input
            id={`todo-${note.id}-${i}`}
            value={item.text}
            onChange={e => updateItem(i, { text: e.target.value })}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addItem()
                setTimeout(() => {
                  const next = document.getElementById(`todo-${note.id}-${i + 1}`)
                  if (next) next.focus()
                }, 10)
              }
              if (e.key === 'Backspace' && !item.text) {
                e.preventDefault()
                removeItem(i)
                setTimeout(() => {
                  const prev = document.getElementById(`todo-${note.id}-${Math.max(0, i - 1)}`)
                  if (prev) prev.focus()
                }, 10)
              }
            }}
            placeholder="To do..."
            className={`flex-1 bg-transparent text-xs focus:outline-none placeholder-zen-muted/25 ${
              item.done ? 'text-zen-muted line-through' : 'text-zen-text'
            }`}
          />
        </div>
      ))}
      <button
        onClick={(e) => { e.stopPropagation(); addItem() }}
        className="text-[10px] text-zen-muted/30 hover:text-zen-muted transition-colors pl-5"
      >
        + add item
      </button>
    </div>
  )
}

export default Canvas
