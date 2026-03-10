import React, { useState, useEffect, useCallback } from 'react'
import Pomodoro from './components/Pomodoro'
import TimeBlocks from './components/TimeBlocks'
import TaskList from './components/TaskList'
import Canvas from './components/Canvas'
import StatusBar from './components/StatusBar'
import Greeting from './components/Greeting'
import AmbientSounds from './components/AmbientSounds'
import Reminders from './components/Reminders'
import MiniTimer from './components/MiniTimer'
import CommandPalette from './components/CommandPalette'
import Dashboard from './components/Dashboard'
import NewWorkspace from './components/NewDay'
import AgentChat from './components/AgentChat'
import ZenMode from './components/ZenMode'
import usePomodoro from './hooks/usePomodoro'
import useTimeBlocks from './hooks/useTimeBlocks'
import { recordPomodoro } from './components/FocusStats'

const QUADRANT_OPTIONS = [
  { id: 'pomodoro', label: 'Timer' },
  { id: 'timeline', label: 'Today' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'canvas', label: 'Canvas' },
  { id: 'agent', label: 'Agent' },
]

function App() {
  const timer = usePomodoro()
  const { blocks, addBlock, updateBlock, deleteBlock, categories } = useTimeBlocks()
  const [page, setPage] = useState('main')
  const [zenMode, setZenMode] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showNewDay, setShowNewDay] = useState(false)
  const [prevPomodoros, setPrevPomodoros] = useState(timer.completedPomodoros)
  const [dayKey, setDayKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Quadrant layout - which component goes where
  const [quadrants, setQuadrants] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('zen-dash-quadrants') || '["pomodoro","timeline","tasks","canvas"]')
    } catch { return ['pomodoro', 'timeline', 'tasks', 'canvas'] }
  })

  useEffect(() => {
    localStorage.setItem('zen-dash-quadrants', JSON.stringify(quadrants))
  }, [quadrants])

  const today = new Date().toISOString().split('T')[0]
  const [checkedDay] = useState(() => {
    const last = localStorage.getItem('zen-dash-current-day')
    return last !== today
  })
  useEffect(() => {
    if (checkedDay) setShowNewDay(true)
  }, [])

  useEffect(() => {
    if (timer.completedPomodoros > prevPomodoros) {
      recordPomodoro()
      setPrevPomodoros(timer.completedPomodoros)
    }
  }, [timer.completedPomodoros])

  useEffect(() => {
    const handleKey = (e) => {
      if (showNewDay) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') e.target.blur()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowCommandPalette(true) }
      if (e.key === 'z' || e.key === 'Z') setZenMode(true)
      if (e.key === ' ') { e.preventDefault(); timer.toggle() }
      if (e.key === 'Escape') { setExpanded(null); setShowCommandPalette(false) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [timer.toggle, showNewDay])

  const handleCommand = (id) => {
    switch (id) {
      case 'start-timer': timer.start(); break
      case 'pause-timer': timer.pause(); break
      case 'reset-timer': timer.reset(); break
      case 'skip-timer': timer.skip(); break
      case 'zen-mode': setZenMode(true); break
      case 'new-day': setShowNewDay(true); break
      case 'expand-timeline': setExpanded('timeline'); break
      case 'expand-tasks': setExpanded('tasks'); break
      case 'expand-canvas': setExpanded('canvas'); break
      case 'collapse': setExpanded(null); break
    }
  }

  const handleNewDayComplete = useCallback(() => {
    setShowNewDay(false)
    setDayKey(k => k + 1)
    setPage('main')
  }, [])

  const swapQuadrant = (index, newId) => {
    setQuadrants(prev => {
      const next = [...prev]
      // If the new quadrant is already somewhere else, swap them
      const existingIndex = next.indexOf(newId)
      if (existingIndex !== -1) {
        next[existingIndex] = next[index]
      }
      next[index] = newId
      return next
    })
  }

  const isHidden = (id) => expanded !== null && expanded !== id

  const renderQuadrant = (id) => {
    switch (id) {
      case 'pomodoro':
        return (
          <div className="h-full flex items-center justify-center">
            <Pomodoro timer={timer} onZenMode={() => setZenMode(true)} />
          </div>
        )
      case 'timeline':
        return (
          <div className="h-full overflow-y-auto">
            <TimeBlocks blocks={blocks} categories={categories} onAddBlock={addBlock} onDeleteBlock={deleteBlock} onEditBlock={updateBlock} />
          </div>
        )
      case 'tasks':
        return (
          <div className="h-full overflow-y-auto">
            <TaskList onSelectTask={timer.setCurrentTask} currentTask={timer.currentTask} />
          </div>
        )
      case 'canvas':
        return <Canvas />
      case 'agent':
        return <AgentChat />
      default:
        return null
    }
  }

  return (
    <div className="h-screen flex flex-col bg-zen-bg zen-texture overflow-hidden">
      {showNewDay && (
        <NewWorkspace onStart={handleNewDayComplete} onCancel={() => setShowNewDay(false)} />
      )}
      {zenMode && <ZenMode timer={timer} onExit={() => setZenMode(false)} />}
      {showCommandPalette && <CommandPalette onAction={handleCommand} onClose={() => setShowCommandPalette(false)} />}

      {/* Top bar */}
      <div className="flex-shrink-0 flex items-start">
        <div className="flex-1 h-10" style={{ WebkitAppRegion: 'drag' }} />
        <div className="flex items-center gap-1 bg-zen-surface border border-zen-border/40 border-t-0 rounded-b-2xl px-2 py-1.5 mt-0">
          <button
            onClick={() => setPage('main')}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${
              page === 'main' ? 'bg-zen-card text-zen-text' : 'text-zen-muted hover:text-zen-text'
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => setPage('home')}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${
              page === 'home' ? 'bg-zen-card text-zen-text' : 'text-zen-muted hover:text-zen-text'
            }`}
          >
            Home
          </button>

          <div className="w-px h-4 bg-zen-border/30 mx-1" />
          <MiniTimer timer={timer} onZenMode={() => setZenMode(true)} />
          <div className="w-px h-4 bg-zen-border/30 mx-1" />

          <AmbientSounds />
          <Reminders />
          <button
            onClick={() => setShowNewDay(true)}
            className="text-zen-muted hover:text-zen-sage transition-colors p-1.5 rounded-full cursor-pointer"
            title="New Workspace"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          <button
            onClick={() => setShowCommandPalette(true)}
            className="text-zen-muted/40 hover:text-zen-muted transition-colors p-1.5 cursor-pointer"
            title="Command Palette"
          >
            <span className="text-sm leading-none">⌘</span>
          </button>
        </div>
        <div className="flex-1 h-10" style={{ WebkitAppRegion: 'drag' }} />
      </div>

      {/* Page content */}
      {page === 'main' ? (
        <MainPage
          key={`main-${dayKey}`}
          timer={timer}
          blocks={blocks}
          categories={categories}
          addBlock={addBlock}
          updateBlock={updateBlock}
          deleteBlock={deleteBlock}
          expanded={expanded}
          setExpanded={setExpanded}
          isHidden={isHidden}
          setZenMode={setZenMode}
          quadrants={quadrants}
          renderQuadrant={renderQuadrant}
          swapQuadrant={swapQuadrant}
        />
      ) : (
        <Dashboard key={`home-${dayKey}`} />
      )}
    </div>
  )
}

function MainPage({ timer, expanded, setExpanded, isHidden, quadrants, renderQuadrant, swapQuadrant }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Greeting + Status */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 pb-2">
        <Greeting />
        <StatusBar />
      </div>

      {/* Quadrant grid */}
      <div className={`flex-1 min-h-0 p-3 pt-1 grid gap-3 transition-all duration-300 ${
        expanded ? '' : 'grid-cols-2'
      }`} style={expanded ? { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' } : { gridTemplateRows: '1fr 1fr' }}>
        {quadrants.map((qId, idx) => (
          <Quadrant
            key={qId}
            id={qId}
            index={idx}
            expanded={expanded}
            onExpand={setExpanded}
            hidden={isHidden(qId)}
            onSwap={swapQuadrant}
          >
            {renderQuadrant(qId)}
          </Quadrant>
        ))}
      </div>
    </div>
  )
}

function Quadrant({ id, index, expanded, onExpand, hidden, children, onSwap }) {
  const [showPicker, setShowPicker] = useState(false)

  if (hidden) return null
  const isExpanded = expanded === id

  return (
    <div className="bg-zen-surface rounded-2xl border border-zen-border/40 relative group overflow-hidden transition-all duration-300">
      {/* Top-right controls */}
      <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5 bg-zen-surface/80 backdrop-blur-sm rounded-lg px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Swap quadrant button */}
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="text-zen-muted/50 hover:text-zen-text transition-all p-1"
            title="Change panel"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </button>
          {showPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
              <div className="absolute top-full right-0 mt-1 bg-zen-card border border-zen-border rounded-xl shadow-2xl py-1 w-32 z-50">
                {QUADRANT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { onSwap(index, opt.id); setShowPicker(false) }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      id === opt.id ? 'text-zen-sage bg-zen-sage/10' : 'text-zen-text hover:bg-zen-border/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Expand button */}
        <button
          onClick={() => onExpand(isExpanded ? null : id)}
          className="text-zen-muted/50 hover:text-zen-text transition-all p-1"
          title={isExpanded ? 'Collapse (Esc)' : 'Expand'}
        >
          {isExpanded ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0v4m0-4h4m6 10l5 5m0 0v-4m0 4h-4" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      </div>
      {children}
    </div>
  )
}

export default App
