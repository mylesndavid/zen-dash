import React, { useState, useRef, useEffect } from 'react'

const SOUNDS = [
  { id: 'rain', label: 'Rain', url: 'https://moodist.mvze.net/sounds/rain/light-rain.mp3' },
  { id: 'fire', label: 'Fire', url: 'https://moodist.mvze.net/sounds/nature/campfire.mp3' },
  { id: 'cafe', label: 'Cafe', url: 'https://moodist.mvze.net/sounds/places/cafe.mp3' },
  { id: 'waves', label: 'Waves', url: 'https://moodist.mvze.net/sounds/nature/waves.mp3' },
  { id: 'wind', label: 'Wind', url: 'https://moodist.mvze.net/sounds/nature/wind.mp3' },
  { id: 'thunder', label: 'Thunder', url: 'https://moodist.mvze.net/sounds/rain/thunder.mp3' },
]

function AmbientSounds() {
  const [active, setActive] = useState({}) // { soundId: volume (0-1) }
  const [show, setShow] = useState(false)
  const audiosRef = useRef({})

  useEffect(() => {
    // Clean up on unmount
    return () => {
      Object.values(audiosRef.current).forEach(a => { a.pause(); a.src = '' })
    }
  }, [])

  const toggleSound = (sound) => {
    if (active[sound.id]) {
      // Stop
      if (audiosRef.current[sound.id]) {
        audiosRef.current[sound.id].pause()
        delete audiosRef.current[sound.id]
      }
      setActive(prev => { const next = { ...prev }; delete next[sound.id]; return next })
    } else {
      // Start
      const audio = new Audio(sound.url)
      audio.loop = true
      audio.volume = 0.4
      audio.play().catch(() => {})
      audiosRef.current[sound.id] = audio
      setActive(prev => ({ ...prev, [sound.id]: 0.4 }))
    }
  }

  const setVolume = (soundId, vol) => {
    if (audiosRef.current[soundId]) {
      audiosRef.current[soundId].volume = vol
    }
    setActive(prev => ({ ...prev, [soundId]: vol }))
  }

  const activeCount = Object.keys(active).length

  return (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${
          activeCount > 0 ? 'bg-zen-sage/10 text-zen-sage' : 'text-zen-muted hover:text-zen-text'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
        {activeCount > 0 && <span>{activeCount}</span>}
      </button>

      {show && (
        <div className="absolute top-full right-0 mt-2 bg-zen-card border border-zen-border rounded-xl shadow-2xl p-3 w-56 z-50">
          <p className="text-[10px] text-zen-muted tracking-[0.2em] uppercase mb-3">Ambient Sounds</p>
          <div className="space-y-2">
            {SOUNDS.map(sound => (
              <div key={sound.id} className="flex items-center gap-2">
                <button
                  onClick={() => toggleSound(sound)}
                  className={`w-8 h-8 min-w-[32px] flex-shrink-0 rounded-lg flex items-center justify-center text-[10px] font-medium transition-all ${
                    active[sound.id] ? 'bg-zen-sage/15 text-zen-sage scale-110' : 'bg-zen-surface text-zen-muted hover:bg-zen-border/30'
                  }`}
                >
                  {sound.label.charAt(0)}
                </button>
                <span className="text-xs text-zen-text w-12">{sound.label}</span>
                {active[sound.id] !== undefined && (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(active[sound.id] || 0) * 100}
                    onChange={e => setVolume(sound.id, e.target.value / 100)}
                    className="flex-1 h-1 accent-zen-sage cursor-pointer"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AmbientSounds
