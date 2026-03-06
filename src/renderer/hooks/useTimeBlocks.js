import { useState, useEffect } from 'react'

const STORAGE_KEY = 'zen-dash-timeblocks'

const CATEGORIES = [
  { id: 'deep', label: 'Deep Work', color: '#7DD3A8' },
  { id: 'meeting', label: 'Meeting', color: '#F5C16C' },
  { id: 'review', label: 'Review', color: '#7AACF0' },
  { id: 'break', label: 'Break', color: '#71717A' },
  { id: 'admin', label: 'Admin', color: '#A78BF6' },
]

function todayKey() {
  return new Date().toISOString().split('T')[0]
}

export default function useTimeBlocks() {
  const [blocks, setBlocks] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const all = JSON.parse(stored)
        return all[todayKey()] || []
      }
    } catch {}
    return []
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const all = stored ? JSON.parse(stored) : {}
      all[todayKey()] = blocks
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    } catch {}
  }, [blocks])

  const addBlock = (block) => {
    setBlocks(prev => [...prev, { ...block, id: Date.now().toString() }].sort((a, b) => a.startHour - b.startHour))
  }

  const updateBlock = (id, updates) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }

  const deleteBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  return { blocks, addBlock, updateBlock, deleteBlock, categories: CATEGORIES }
}
