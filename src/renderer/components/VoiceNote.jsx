import React, { useState, useRef, useEffect } from 'react'

function VoiceNote({ note, onUpdate }) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [recording, setRecording] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(note.duration || 0)
  const [elapsed, setElapsed] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          onUpdate(note.id, {
            audioData: reader.result,
            duration: elapsed,
          })
        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorder.start(100)
      setRecording(true)
      setElapsed(0)

      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1)
      }, 1000)

      // Start speech recognition
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = 'en-US'
          recognitionRef.current = recognition

          let transcript = ''
          recognition.onresult = (event) => {
            transcript = ''
            for (let i = 0; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript
            }
            onUpdate(note.id, { transcription: transcript })
          }

          recognition.start()
        }
      } catch {}

    } catch (err) {
      console.error('Failed to start recording:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    clearInterval(timerRef.current)
    setRecording(false)
    setDuration(elapsed)
  }

  const playAudio = () => {
    if (!note.audioData) return
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setPlaying(false)
      return
    }
    const audio = new Audio(note.audioData)
    audioRef.current = audio
    setPlaying(true)
    audio.onended = () => { setPlaying(false); audioRef.current = null }
    audio.play()
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="space-y-2">
      {/* Title */}
      {editingTitle ? (
        <input
          autoFocus
          value={note.title || ''}
          onChange={e => onUpdate(note.id, { title: e.target.value })}
          onBlur={() => setEditingTitle(false)}
          onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
          placeholder="Untitled recording"
          className="w-full bg-transparent text-xs font-medium text-zen-text placeholder-zen-muted/30 focus:outline-none border-b border-zen-border pb-1 mb-1"
        />
      ) : (
        <p
          onClick={() => setEditingTitle(true)}
          className="text-xs font-medium text-zen-text cursor-pointer hover:text-zen-blue transition-colors truncate"
        >
          {note.title || 'Untitled recording'}
        </p>
      )}

      {/* Recording / Playback controls */}
      <div className="flex items-center gap-2">
        {!note.audioData ? (
          // Record button
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              recording
                ? 'bg-zen-coral/20 border border-zen-coral animate-pulse'
                : 'bg-zen-card border border-zen-border hover:border-zen-coral'
            }`}
          >
            {recording ? (
              <div className="w-2.5 h-2.5 bg-zen-coral rounded-sm" />
            ) : (
              <div className="w-3 h-3 bg-zen-coral rounded-full" />
            )}
          </button>
        ) : (
          // Play button
          <button
            onClick={playAudio}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
              playing ? 'bg-zen-blue/20 border-zen-blue' : 'bg-zen-card border-zen-border hover:border-zen-blue'
            }`}
          >
            {playing ? (
              <svg className="w-3 h-3 text-zen-blue" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-zen-blue ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        )}

        {/* Waveform / duration */}
        <div className="flex-1">
          {recording ? (
            <div className="flex items-center gap-2">
              <div className="flex items-end gap-0.5 h-4">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-zen-coral rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-zen-coral">{formatTime(elapsed)}</span>
            </div>
          ) : note.audioData ? (
            <div className="flex items-center gap-2">
              <div className="flex items-end gap-0.5 h-3 flex-1">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-0.5 rounded-full transition-colors ${playing ? 'bg-zen-blue' : 'bg-zen-muted/30'}`}
                    style={{ height: `${20 + Math.sin(i * 0.8) * 50 + Math.random() * 30}%` }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-zen-muted">{formatTime(note.duration || 0)}</span>
            </div>
          ) : (
            <span className="text-[10px] text-zen-muted/40">Click to record</span>
          )}
        </div>
      </div>

      {/* Transcription */}
      {note.transcription && (
        <div className="bg-zen-bg/50 rounded-lg p-2">
          <p className="text-[10px] text-zen-muted/40 mb-1 uppercase tracking-wider">Transcription</p>
          <p className="text-xs text-zen-text leading-relaxed">{note.transcription}</p>
        </div>
      )}
    </div>
  )
}

export default VoiceNote
