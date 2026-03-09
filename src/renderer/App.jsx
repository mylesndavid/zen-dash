import React, { useState, useEffect, useCallback } from 'react'
import Pomodoro from './components/Pomodoro'
import TimeBlocks from './components/TimeBlocks'
import TaskList from './components/TaskList'
import Canvas from './components/Canvas'
import StatusBar from './components/StatusBar'
import Greeting from './components/Greeting'
import AmbientSounds from './components/AmbientSounds'
import MiniTimer from './components/MiniTimer'
import CommandPalette from './components/CommandPalette'
import Dashboard from './components/Dashboard'
import NewDay from './components/NewDay'
import ZenMode from './components/ZenMode'
import usePomodoro from './hooks/usePomodoro'
import useTimeBlocks from './hooks/useTimeBlocks'
import { recordPomodoro } from './components/FocusStats'

function App() {
  const timer = usePomodoro()
  const { blocks, addBlock, updateBlock, deleteBlock, categories } = useTimeBlocks()
  const [page, setPage] = useState('main') // 'main' | 'home'
  const [zenMode, setZenMode] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showNewDay, setShowNewDay] = useState(false)
  const [prevPomodoros, setPrevPomodoros] = useState(timer.completedPomodoros)
  const [dayKey, setDayKey] = useState(0) // increment to force re-render after new day

  // Auto-show new day on launch
  const today = new Date().toISOString().split('T')[0]
  const [checkedDay] = useState(() => {
    const last = localStorage.getItem('zen-dash-current-day')
    if (last !== today) return true
    return false
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
    setDayKey(k => k + 1) // force children to re-mount with fresh localStorage
    setPage('main')
  }, [])

  const isHidden = (id) => expanded !== null && expanded !== id

  return (
    <div className="h-screen flex flex-col bg-zen-bg zen-texture overflow-hidden">
      {showNewDay && (
        <NewDay
          onStart={handleNewDayComplete}
          onCancel={() => setShowNewDay(false)}
        />
      )}
      {zenMode && <ZenMode timer={timer} onExit={() => setZenMode(false)} />}
      {showCommandPalette && <CommandPalette onAction={handleCommand} onClose={() => setShowCommandPalette(false)} />}

      {/* Draggable area for traffic lights */}
      <div className="h-12 flex-shrink-0" style={{ WebkitAppRegion: 'drag' }} />

      {/* Top bar pill */}
      <div className="flex-shrink-0 flex items-center justify-center pb-3">
        <div className="flex items-center gap-1 bg-zen-surface border border-zen-border/40 rounded-full px-1.5 py-1">
          {/* Page tabs */}
          <button
            onClick={() => setPage('main')}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              page === 'main' ? 'bg-zen-card text-zen-text' : 'text-zen-muted hover:text-zen-text'
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => setPage('home')}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              page === 'home' ? 'bg-zen-card text-zen-text' : 'text-zen-muted hover:text-zen-text'
            }`}
          >
            Home
          </button>

          <div className="w-px h-4 bg-zen-border/30 mx-1" />

          {/* Timer */}
          <MiniTimer timer={timer} onZenMode={() => setZenMode(true)} />

          <div className="w-px h-4 bg-zen-border/30 mx-1" />

          {/* Controls */}
          <AmbientSounds />
          <button
            onClick={() => setShowNewDay(true)}
            className="text-zen-muted hover:text-zen-sage transition-colors px-2 py-1 rounded-full text-xs"
            title="New Day"
          >
            New Day
          </button>
          <button
            onClick={() => setShowCommandPalette(true)}
            className="text-zen-muted/40 hover:text-zen-muted text-xs transition-colors px-2 py-1"
          >
            K
          </button>
        </div>
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
        />
      ) : (
        <Dashboard key={`home-${dayKey}`} />
      )}
    </div>
  )
}

function MainPage({ timer, blocks, categories, addBlock, updateBlock, deleteBlock, expanded, setExpanded, isHidden, setZenMode }) {
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

        <Quadrant id="pomodoro" expanded={expanded} onExpand={setExpanded} hidden={isHidden('pomodoro')}>
          <div className="h-full flex items-center justify-center">
            <Pomodoro timer={timer} onZenMode={() => setZenMode(true)} />
          </div>
        </Quadrant>

        <Quadrant id="timeline" expanded={expanded} onExpand={setExpanded} hidden={isHidden('timeline')}>
          <div className="h-full overflow-y-auto">
            <TimeBlocks blocks={blocks} categories={categories} onAddBlock={addBlock} onDeleteBlock={deleteBlock} onEditBlock={updateBlock} />
          </div>
        </Quadrant>

        <Quadrant id="tasks" expanded={expanded} onExpand={setExpanded} hidden={isHidden('tasks')}>
          <div className="h-full overflow-y-auto">
            <TaskList onSelectTask={timer.setCurrentTask} currentTask={timer.currentTask} />
          </div>
        </Quadrant>

        <Quadrant id="canvas" expanded={expanded} onExpand={setExpanded} hidden={isHidden('canvas')}>
          <Canvas />
        </Quadrant>
      </div>
    </div>
  )
}

function Quadrant({ id, expanded, onExpand, hidden, children }) {
  if (hidden) return null
  const isExpanded = expanded === id

  return (
    <div className="bg-zen-surface rounded-2xl border border-zen-border/40 relative group overflow-hidden transition-all duration-300">
      <button
        onClick={() => onExpand(isExpanded ? null : id)}
        className="absolute top-3 right-3 z-10 text-zen-muted/0 group-hover:text-zen-muted/50 hover:text-zen-text transition-all p-1"
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
      {children}
    </div>
  )
}

export default App
