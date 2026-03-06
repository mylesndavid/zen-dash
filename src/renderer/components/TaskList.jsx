import React, { useState, useEffect } from 'react'

function TaskList({ onSelectTask, currentTask }) {
  const [tasks, setTasks] = useState([])
  const [manualTasks, setManualTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('zen-dash-manual-tasks') || '[]')
    } catch { return [] }
  })
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('zen-dash-linear-key') || '')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    localStorage.setItem('zen-dash-manual-tasks', JSON.stringify(manualTasks))
  }, [manualTasks])

  useEffect(() => {
    if (apiKey) fetchTasks()
  }, [apiKey])

  const fetchTasks = async () => {
    if (!apiKey) return
    try {
      setLoading(true)
      const data = await window.api.getLinearTasks(apiKey)
      setTasks(data)
    } catch (err) {
      console.error('Error fetching Linear tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveApiKey = (key) => {
    localStorage.setItem('zen-dash-linear-key', key)
    setApiKey(key)
    setShowKeyInput(false)
  }

  const addManualTask = () => {
    if (!newTask.trim()) return
    setManualTasks(prev => [...prev, { id: Date.now().toString(), title: newTask.trim(), done: false }])
    setNewTask('')
  }

  const toggleManualTask = (id) => {
    setManualTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const deleteManualTask = (id) => {
    setManualTasks(prev => prev.filter(t => t.id !== id))
  }

  const getPriorityIcon = (p) => {
    if (p === 1) return '!!!'
    if (p === 2) return '!!'
    if (p === 3) return '!'
    return ''
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs text-zen-muted tracking-[0.2em] uppercase">Tasks</h2>
        <div className="flex items-center gap-2">
          {apiKey && (
            <button onClick={fetchTasks} className="text-zen-muted hover:text-zen-text transition-colors" title="Refresh">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="text-zen-muted hover:text-zen-text transition-colors"
            title="Linear API Key"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* API Key Input */}
      {showKeyInput && (
        <div className="mb-4">
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveApiKey(apiKey)}
            placeholder="Linear API key (lin_api_...)"
            className="w-full bg-zen-card border border-zen-border rounded-lg px-3 py-2 text-xs text-zen-text placeholder-zen-muted/50 focus:border-zen-sage focus:outline-none"
          />
          <button
            onClick={() => saveApiKey(apiKey)}
            className="mt-2 text-xs text-zen-sage hover:underline"
          >
            Save key
          </button>
        </div>
      )}

      {/* Linear Tasks */}
      {loading ? (
        <div className="text-center py-4 text-zen-muted text-xs">Loading tasks...</div>
      ) : (
        <div className="space-y-1 mb-4">
          {tasks.map(task => (
            <div
              key={task.id}
              onClick={() => onSelectTask(task)}
              className={`flex items-start gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                currentTask?.id === task.id ? 'bg-zen-sage/10 border border-zen-sage/30' : 'hover:bg-zen-card border border-transparent'
              }`}
            >
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: task.state?.color || '#7A756D' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zen-text truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-zen-muted">{task.identifier}</span>
                  {task.priority <= 2 && (
                    <span className="text-[10px] text-zen-coral">{getPriorityIcon(task.priority)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Tasks */}
      <div className="space-y-1 mb-3">
        {manualTasks.map(task => (
          <div key={task.id} className={`flex items-center gap-2 px-3 py-1.5 group rounded-lg cursor-pointer transition-colors ${
            currentTask?.id === task.id ? 'bg-zen-sage/10' : 'hover:bg-zen-card'
          }`}>
            <button
              onClick={(e) => { e.stopPropagation(); toggleManualTask(task.id) }}
              className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                task.done ? 'bg-zen-sage border-zen-sage' : 'border-zen-border hover:border-zen-sage'
              }`}
            >
              {task.done && (
                <svg className="w-2.5 h-2.5 text-zen-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span
              onClick={() => !task.done && onSelectTask({ id: task.id, title: task.title })}
              className={`text-xs flex-1 ${task.done ? 'text-zen-muted line-through' : 'text-zen-text'}`}
            >
              {task.title}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); deleteManualTask(task.id) }}
              className="text-zen-muted/0 group-hover:text-zen-muted hover:text-zen-coral text-xs transition-colors"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add task */}
      <form onSubmit={e => { e.preventDefault(); addManualTask() }} className="px-3">
        <input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="+ Add task..."
          className="w-full bg-transparent text-xs text-zen-text placeholder-zen-muted/40 focus:outline-none"
        />
      </form>
    </div>
  )
}

export default TaskList
