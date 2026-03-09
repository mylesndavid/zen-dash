import React, { useState, useRef, useEffect } from 'react'

function archiveCurrentWorkspace() {
  const workspaces = JSON.parse(localStorage.getItem('zen-dash-workspaces') || '[]')
  const tasks = JSON.parse(localStorage.getItem('zen-dash-manual-tasks') || '[]')
  const canvas = JSON.parse(localStorage.getItem('zen-dash-canvas-notes') || '[]')
  const connections = JSON.parse(localStorage.getItem('zen-dash-canvas-notes-connections') || '[]')
  const currentId = localStorage.getItem('zen-dash-current-workspace-id')
  const today = new Date().toISOString().split('T')[0]
  const intentions = JSON.parse(localStorage.getItem('zen-dash-intention') || '{}')
  const intention = intentions[currentId] || intentions[today] || ''

  if (tasks.length === 0 && canvas.length === 0 && !intention) return

  const existing = workspaces.find(w => w.id === currentId)
  if (existing) {
    existing.tasks = tasks
    existing.canvas = canvas
    existing.connections = connections
    existing.intention = intention
  } else {
    const todayWorkspaces = workspaces.filter(w => w.date === today)
    workspaces.push({
      id: currentId || `${today}-1`,
      date: today,
      number: todayWorkspaces.length + 1,
      intention,
      tasks,
      canvas,
      connections,
      createdAt: new Date().toISOString(),
    })
  }

  localStorage.setItem('zen-dash-workspaces', JSON.stringify(workspaces))
}

function NewWorkspace({ onStart, onCancel }) {
  const [step, setStep] = useState('tasks') // 'tasks' | 'intention'
  const [intention, setIntention] = useState('')
  const [openTasks, setOpenTasks] = useState([])
  const [taskActions, setTaskActions] = useState({}) // taskId: 'carry' | 'done' | 'drop'
  const inputRef = useRef(null)

  useEffect(() => {
    const tasks = JSON.parse(localStorage.getItem('zen-dash-manual-tasks') || '[]')
    const open = tasks.filter(t => !t.done)
    setOpenTasks(open)
    if (open.length === 0) setStep('intention')
    // Default all to carry
    const defaults = {}
    open.forEach(t => { defaults[t.id] = 'carry' })
    setTaskActions(defaults)
  }, [])

  useEffect(() => {
    if (step === 'intention') {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [step])

  const handleTasksContinue = () => {
    setStep('intention')
  }

  const setAllTasks = (action) => {
    const next = {}
    openTasks.forEach(t => { next[t.id] = action })
    setTaskActions(next)
  }

  const handleStart = () => {
    if (!intention.trim()) return

    archiveCurrentWorkspace()

    const today = new Date().toISOString().split('T')[0]
    const workspaces = JSON.parse(localStorage.getItem('zen-dash-workspaces') || '[]')
    const todayCount = workspaces.filter(w => w.date === today).length
    const newId = `${today}-${todayCount + 1}`

    // Save intention
    const intentions = JSON.parse(localStorage.getItem('zen-dash-intention') || '{}')
    intentions[newId] = intention.trim()
    intentions[today] = intention.trim()
    localStorage.setItem('zen-dash-intention', JSON.stringify(intentions))

    // Process tasks based on actions
    const allTasks = JSON.parse(localStorage.getItem('zen-dash-manual-tasks') || '[]')
    const carried = []
    allTasks.forEach(t => {
      if (t.done) return // already done, archived
      const action = taskActions[t.id] || 'carry'
      if (action === 'carry') carried.push({ ...t })
      if (action === 'done') carried.push({ ...t, done: true })
      // 'drop' = don't include
    })
    localStorage.setItem('zen-dash-manual-tasks', JSON.stringify(carried))

    // Clear canvas
    localStorage.removeItem('zen-dash-canvas-notes')
    localStorage.removeItem('zen-dash-canvas-notes-connections')

    localStorage.setItem('zen-dash-current-workspace-id', newId)
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

      {step === 'tasks' ? (
        <div className="relative flex flex-col items-center gap-6 max-w-lg w-full px-8">
          <div className="text-center">
            <h1 className="text-2xl font-light text-zen-text tracking-wide">Open tasks</h1>
            <p className="text-sm text-zen-muted mt-2">What should we do with these?</p>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => setAllTasks('carry')} className="text-[10px] text-zen-muted hover:text-zen-blue transition-colors px-2 py-1 rounded border border-zen-border/30">
              Carry all
            </button>
            <button onClick={() => setAllTasks('done')} className="text-[10px] text-zen-muted hover:text-zen-sage transition-colors px-2 py-1 rounded border border-zen-border/30">
              Done all
            </button>
            <button onClick={() => setAllTasks('drop')} className="text-[10px] text-zen-muted hover:text-zen-coral transition-colors px-2 py-1 rounded border border-zen-border/30">
              Drop all
            </button>
          </div>

          {/* Task list */}
          <div className="w-full max-h-60 overflow-y-auto space-y-1">
            {openTasks.map(task => {
              const action = taskActions[task.id] || 'carry'
              return (
                <div key={task.id} className="flex items-center gap-3 bg-zen-surface rounded-lg px-3 py-2">
                  <span className={`text-xs flex-1 ${action === 'drop' ? 'text-zen-muted/30 line-through' : action === 'done' ? 'text-zen-sage' : 'text-zen-text'}`}>
                    {task.title}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTaskActions(prev => ({ ...prev, [task.id]: 'carry' }))}
                      className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                        action === 'carry' ? 'bg-zen-blue/15 text-zen-blue' : 'text-zen-muted/30 hover:text-zen-muted'
                      }`}
                    >
                      Carry
                    </button>
                    <button
                      onClick={() => setTaskActions(prev => ({ ...prev, [task.id]: 'done' }))}
                      className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                        action === 'done' ? 'bg-zen-sage/15 text-zen-sage' : 'text-zen-muted/30 hover:text-zen-muted'
                      }`}
                    >
                      Done
                    </button>
                    <button
                      onClick={() => setTaskActions(prev => ({ ...prev, [task.id]: 'drop' }))}
                      className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                        action === 'drop' ? 'bg-zen-coral/15 text-zen-coral' : 'text-zen-muted/30 hover:text-zen-muted'
                      }`}
                    >
                      Drop
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTasksContinue}
              className="px-8 py-2.5 rounded-xl text-sm bg-zen-sage/15 border border-zen-sage/30 text-zen-sage hover:bg-zen-sage/25 transition-all"
            >
              Continue
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl text-sm text-zen-muted hover:text-zen-text border border-zen-border/30 hover:border-zen-border transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-col items-center gap-8 max-w-md w-full px-8">
          <div className="text-center">
            <h1 className="text-3xl font-light text-zen-text tracking-wide">{greeting}</h1>
            <p className="text-sm text-zen-muted mt-2">New workspace</p>
          </div>

          <div className="w-full">
            <label className="text-[10px] text-zen-muted tracking-[0.2em] uppercase mb-3 block">
              What's your focus?
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
            continue current workspace
          </button>
        </div>
      )}
    </div>
  )
}

export { archiveCurrentWorkspace }
export default NewWorkspace
