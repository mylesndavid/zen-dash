import React, { useState, useEffect } from 'react'
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
  const [zenMode, setZenMode] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [prevPomodoros, setPrevPomodoros] = useState(timer.completedPomodoros)

  // Check if we need the New Day screen
  const today = new Date().toISOString().split('T')[0]
  const lastDay = localStorage.getItem('zen-dash-current-day')
  const [showNewDay, setShowNewDay] = useState(lastDay !== today)

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

  const isHidden = (id) => expanded !== null && expanded !== id

  return (
    <div className="h-screen flex flex-col bg-zen-bg zen-texture overflow-hidden">
      {showNewDay && <NewDay onStart={() => setShowNewDay(false)} />}
      {zenMode && <ZenMode timer={timer} onExit={() => setZenMode(false)} />}
      {showCommandPalette && <CommandPalette onAction={handleCommand} onClose={() => setShowCommandPalette(false)} />}
      {showDashboard && <Dashboard onClose={() => setShowDashboard(false)} />}

      {/* Top bar with controls centered */}
      <div className="h-10 flex-shrink-0 flex items-center justify-center" style={{ WebkitAppRegion: 'drag' }}>
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
          <MiniTimer timer={timer} onZenMode={() => setZenMode(true)} />
          <div className="w-px h-4 bg-zen-border/20" />
          <AmbientSounds />
          <div className="w-px h-4 bg-zen-border/20" />
          <button
            onClick={() => setShowDashboard(true)}
            className="text-zen-muted/40 hover:text-zen-muted transition-colors p-1"
            title="Home"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </button>
          <button
            onClick={() => setShowNewDay(true)}
            className="text-zen-muted/40 hover:text-zen-muted transition-colors p-1"
            title="New Day"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          </button>
          <button
            onClick={() => setShowCommandPalette(true)}
            className="text-zen-muted/30 hover:text-zen-muted text-xs transition-colors px-2 py-1 rounded border border-zen-border/30 hover:border-zen-border"
          >
            K
          </button>
        </div>
      </div>

      {/* Greeting + Status */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 pb-2">
        <Greeting />
        <StatusBar />
      </div>

      {/* Quadrant grid */}
      <div className={`flex-1 min-h-0 p-3 pt-1 grid gap-3 transition-all duration-300 ${
        expanded ? '' : 'grid-cols-2'
      }`} style={expanded ? { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' } : { gridTemplateRows: '1fr 1fr' }}>

        {/* Q1: Pomodoro */}
        <Quadrant id="pomodoro" expanded={expanded} onExpand={setExpanded} hidden={isHidden('pomodoro')}>
          <div className="h-full flex items-center justify-center">
            <Pomodoro timer={timer} onZenMode={() => setZenMode(true)} />
          </div>
        </Quadrant>

        {/* Q2: Timeline */}
        <Quadrant id="timeline" expanded={expanded} onExpand={setExpanded} hidden={isHidden('timeline')}>
          <div className="h-full overflow-y-auto">
            <TimeBlocks blocks={blocks} categories={categories} onAddBlock={addBlock} onDeleteBlock={deleteBlock} onEditBlock={updateBlock} />
          </div>
        </Quadrant>

        {/* Q3: Tasks */}
        <Quadrant id="tasks" expanded={expanded} onExpand={setExpanded} hidden={isHidden('tasks')}>
          <div className="h-full overflow-y-auto">
            <TaskList onSelectTask={timer.setCurrentTask} currentTask={timer.currentTask} />
          </div>
        </Quadrant>

        {/* Q4: Canvas */}
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
