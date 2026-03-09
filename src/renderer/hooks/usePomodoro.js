import { useState, useEffect, useRef, useCallback } from 'react'

const WORK_DURATION = 25 * 60
const SHORT_BREAK = 5 * 60
const LONG_BREAK = 15 * 60
const COMPLETED_KEY = 'zen-dash-completed-tasks'

function loadCompleted() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const all = JSON.parse(localStorage.getItem(COMPLETED_KEY) || '{}')
    return all[today] || []
  } catch { return [] }
}

function saveCompleted(completed) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const all = JSON.parse(localStorage.getItem(COMPLETED_KEY) || '{}')
    all[today] = completed
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(all))
  } catch {}
}

export default function usePomodoro() {
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION)
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState('work') // 'work' | 'break' | 'longBreak'
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [currentTask, setCurrentTask] = useState(null)
  const [completedTasks, setCompletedTasks] = useState(loadCompleted)
  const [taskTimeAccumulated, setTaskTimeAccumulated] = useState(0) // seconds spent on current task
  const intervalRef = useRef(null)
  const taskTimerRef = useRef(null)
  const isRunningRef = useRef(false)
  const timeLeftRef = useRef(WORK_DURATION)
  const taskRef = useRef('')

  // Keep refs in sync for tray interval
  useEffect(() => { isRunningRef.current = isRunning }, [isRunning])
  useEffect(() => { timeLeftRef.current = timeLeft }, [timeLeft])
  useEffect(() => { taskRef.current = currentTask?.title || '' }, [currentTask])

  const getDuration = useCallback((m) => {
    if (m === 'work') return WORK_DURATION
    if (m === 'break') return SHORT_BREAK
    return LONG_BREAK
  }, [])

  // Update menu bar tray on a simple interval
  useEffect(() => {
    if (!window.api?.updateTray) return
    const tick = setInterval(() => {
      if (isRunningRef.current) {
        const t = timeLeftRef.current
        const m = Math.floor(t / 60)
        const s = (t % 60).toString().padStart(2, '0')
        const name = taskRef.current
        window.api.updateTray(name ? `${m}:${s} ${name}` : `${m}:${s}`)
      } else {
        window.api.updateTray('')
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  // Send data to tray click menu
  useEffect(() => {
    try {
      if (!window.api?.updateTrayData) return
      const tasks = JSON.parse(localStorage.getItem('zen-dash-manual-tasks') || '[]')
      const open = tasks.filter(t => !t.done).map(t => t.title)
      const m = Math.floor(timeLeft / 60)
      const s = (timeLeft % 60).toString().padStart(2, '0')
      window.api.updateTrayData({
        timer: isRunning ? `${m}:${s}` : '',
        task: currentTask?.title || '',
        tasks: open,
      })
    } catch (e) { console.error('tray data error', e) }
  }, [currentTask?.title, timeLeft, isRunning])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)

      // Timer completed
      if (mode === 'work') {
        const newCount = completedPomodoros + 1
        setCompletedPomodoros(newCount)

        // Notify
        try {
          window.api?.showNotification(
            'Pomodoro Complete',
            currentTask ? `"${currentTask.title}" session done. Time for a break.` : 'Time for a break.'
          )
        } catch {}

        // Switch to break
        if (newCount % 4 === 0) {
          setMode('longBreak')
          setTimeLeft(LONG_BREAK)
        } else {
          setMode('break')
          setTimeLeft(SHORT_BREAK)
        }
      } else {
        // Break is over, back to work
        try {
          window.api?.showNotification('Break Over', 'Time to focus.')
        } catch {}
        setMode('work')
        setTimeLeft(WORK_DURATION)
      }
    }

    return () => clearInterval(intervalRef.current)
  }, [isRunning, timeLeft, mode, completedPomodoros, currentTask])

  // Track time spent on current task
  useEffect(() => {
    if (isRunning && mode === 'work' && currentTask) {
      taskTimerRef.current = setInterval(() => {
        setTaskTimeAccumulated(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(taskTimerRef.current)
  }, [isRunning, mode, currentTask])

  const completeCurrentTask = () => {
    if (!currentTask) return
    const entry = {
      id: currentTask.id || Date.now().toString(),
      title: currentTask.title,
      timeSpent: taskTimeAccumulated,
      completedAt: new Date().toISOString(),
    }
    const updated = [entry, ...completedTasks]
    setCompletedTasks(updated)
    saveCompleted(updated)
    setCurrentTask(null)
    setTaskTimeAccumulated(0)
  }

  const setCurrentTaskWrapped = (task) => {
    // Save accumulated time if switching tasks
    if (currentTask && taskTimeAccumulated > 0) {
      // Don't add to completed, just reset timer
    }
    setTaskTimeAccumulated(0)
    // Normalize task to simple {id, title} so it works everywhere
    if (task) {
      setCurrentTask({ id: task.id || 'manual', title: String(task.title || '') })
    } else {
      setCurrentTask(null)
    }
  }

  const start = () => setIsRunning(true)
  const pause = () => setIsRunning(false)
  const toggle = () => setIsRunning(prev => !prev)

  const reset = () => {
    setIsRunning(false)
    setTimeLeft(getDuration(mode))
  }

  const skip = () => {
    setIsRunning(false)
    if (mode === 'work') {
      setMode('break')
      setTimeLeft(SHORT_BREAK)
    } else {
      setMode('work')
      setTimeLeft(WORK_DURATION)
    }
  }

  const progress = 1 - (timeLeft / getDuration(mode))

  return {
    timeLeft,
    isRunning,
    mode,
    completedPomodoros,
    currentTask,
    setCurrentTask: setCurrentTaskWrapped,
    completeCurrentTask,
    completedTasks,
    taskTimeAccumulated,
    progress,
    start,
    pause,
    toggle,
    reset,
    skip,
  }
}
