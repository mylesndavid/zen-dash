import React, { useState, useRef, useEffect } from 'react'

const PROVIDERS = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    models: [{ id: 'claude-code', label: 'CLI' }],
    noKey: true,
  },
  {
    id: 'anthropic',
    label: 'Claude API',
    models: [
      { id: 'claude-sonnet-4-20250514', label: 'Sonnet 4' },
      { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5' },
      { id: 'claude-opus-4-20250514', label: 'Opus 4' },
    ],
    keyPlaceholder: 'sk-ant-...',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { id: 'o3-mini', label: 'o3-mini' },
    ],
    keyPlaceholder: 'sk-...',
  },
  {
    id: 'perplexity',
    label: 'Perplexity',
    models: [
      { id: 'sonar-pro', label: 'Sonar Pro' },
      { id: 'sonar', label: 'Sonar' },
    ],
    keyPlaceholder: 'pplx-...',
  },
]

const SETTINGS_KEY = 'zen-dash-agent-settings'

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
  } catch { return {} }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

function AgentChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState(loadSettings)
  const [keyInput, setKeyInput] = useState('')
  const messagesEndRef = useRef(null)

  const providerId = settings.provider || 'anthropic'
  const provider = PROVIDERS.find(p => p.id === providerId) || PROVIDERS[0]
  const modelId = settings.models?.[providerId] || provider.models[0].id
  const apiKey = settings.keys?.[providerId] || ''

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const updateSetting = (key, value) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    saveSettings(next)
  }

  const setProviderKey = (pid, key) => {
    const keys = { ...(settings.keys || {}), [pid]: key }
    const next = { ...settings, keys }
    setSettings(next)
    saveSettings(next)
  }

  const setProviderModel = (pid, mid) => {
    const models = { ...(settings.models || {}), [pid]: mid }
    const next = { ...settings, models }
    setSettings(next)
    saveSettings(next)
  }

  const getSystemPrompt = () => {
    const tasks = JSON.parse(localStorage.getItem('zen-dash-manual-tasks') || '[]')
    const intentions = JSON.parse(localStorage.getItem('zen-dash-intention') || '{}')
    const today = new Date().toISOString().split('T')[0]
    const intention = intentions[today] || ''
    return `You are a helpful productivity assistant inside Zen Dash. Keep responses concise and actionable. The user's current intention is: "${intention}". Their open tasks are: ${tasks.filter(t => !t.done).map(t => t.title).join(', ') || 'none'}. Today is ${today}.`
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    if (!provider.noKey && !apiKey) return

    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const systemPrompt = getSystemPrompt()
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))
      let assistantText = ''

      if (providerId === 'claude-code') {
        const result = await window.api.runClaudeCode(input.trim())
        assistantText = result

      } else if (providerId === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: modelId,
            max_tokens: 1024,
            system: systemPrompt,
            messages: apiMessages,
          }),
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        assistantText = data.content.filter(b => b.type === 'text').map(b => b.text).join('\n')

      } else if (providerId === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelId,
            max_tokens: 1024,
            messages: [{ role: 'system', content: systemPrompt }, ...apiMessages],
          }),
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        assistantText = data.choices[0]?.message?.content || ''

      } else if (providerId === 'perplexity') {
        const res = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelId,
            max_tokens: 1024,
            messages: [{ role: 'system', content: systemPrompt }, ...apiMessages],
          }),
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        assistantText = data.choices[0]?.message?.content || ''
      }

      setMessages(prev => [...prev, { role: 'assistant', content: assistantText }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message.slice(0, 200)}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xs text-zen-muted tracking-[0.2em] uppercase">Agent</h2>
          {/* Provider/model switcher */}
          <div className="flex items-center gap-1 bg-zen-bg rounded-lg px-1 py-0.5">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => updateSetting('provider', p.id)}
                className={`px-1.5 py-0.5 rounded text-[9px] transition-colors ${
                  providerId === p.id ? 'bg-zen-card text-zen-text' : 'text-zen-muted/30 hover:text-zen-muted'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Model picker */}
          <select
            value={modelId}
            onChange={e => setProviderModel(providerId, e.target.value)}
            className="bg-zen-bg border border-zen-border/20 rounded-lg px-1.5 py-0.5 text-[9px] text-zen-muted focus:outline-none cursor-pointer appearance-none"
          >
            {provider.models.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="text-zen-muted/30 hover:text-zen-muted text-[10px] transition-colors">
              Clear
            </button>
          )}
          {!provider.noKey && <button
            onClick={() => { setShowSettings(!showSettings); setKeyInput(apiKey) }}
            className={`transition-colors ${apiKey ? 'text-zen-muted/30 hover:text-zen-muted' : 'text-zen-amber'}`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </button>}
        </div>
      </div>

      {/* API Key input */}
      {showSettings && (
        <div className="px-4 pb-3 flex-shrink-0">
          <p className="text-[9px] text-zen-muted/40 mb-1">{provider.label} API Key</p>
          <div className="flex gap-1.5">
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder={provider.keyPlaceholder}
              className="flex-1 bg-zen-bg border border-zen-border/30 rounded-lg px-2.5 py-1.5 text-xs text-zen-text placeholder-zen-muted/25 focus:outline-none"
            />
            <button
              onClick={() => { setProviderKey(providerId, keyInput); setShowSettings(false) }}
              className="text-[10px] text-zen-sage px-2 py-1 bg-zen-sage/10 rounded-lg"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* No key state */}
      {!provider.noKey && !apiKey && !showSettings && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-3">
          <p className="text-xs text-zen-muted/30 text-center">Add your {provider.label} API key to get started</p>
          <button
            onClick={() => { setShowSettings(true); setKeyInput('') }}
            className="text-xs text-zen-sage border border-zen-sage/30 rounded-lg px-4 py-2 hover:bg-zen-sage/10 transition-colors"
          >
            Set API Key
          </button>
        </div>
      )}

      {/* Messages */}
      {(provider.noKey || apiKey) && (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 space-y-3" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-zen-muted/15 text-xs text-center">Ask anything about your tasks, schedule, or just think out loud</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'flex justify-end' : ''}>
              <div className={`max-w-[90%] ${
                msg.role === 'user'
                  ? 'bg-zen-sage/10 border border-zen-sage/20 rounded-2xl rounded-br-md px-3 py-2'
                  : 'py-1'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-xs text-zen-text">{msg.content}</p>
                ) : (
                  <MessageContent content={msg.content} />
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-zen-sage/40 rounded-full animate-pulse" />
                <div className="w-1.5 h-1.5 bg-zen-sage/40 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 bg-zen-sage/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      {(provider.noKey || apiKey) && (
        <div className="flex-shrink-0 p-3 border-t border-zen-border/20">
          <form onSubmit={e => { e.preventDefault(); sendMessage() }} className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={loading ? 'Thinking...' : `Ask ${provider.label}...`}
              className="flex-1 bg-zen-bg border border-zen-border/30 rounded-lg px-3 py-2 text-xs text-zen-text placeholder-zen-muted/25 focus:outline-none focus:border-zen-sage/30"
              autoFocus
            />
            {loading ? (
              <button
                type="button"
                onClick={() => setLoading(false)}
                className="px-3 py-2 rounded-lg text-xs bg-zen-coral/15 text-zen-coral"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                  input.trim() ? 'bg-zen-sage/15 text-zen-sage' : 'bg-zen-card text-zen-muted/30'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  )
}

function MessageContent({ content }) {
  const lines = content.split('\n')
  const elements = []
  let inCode = false
  let codeLines = []

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (inCode) {
        elements.push(
          <pre key={`code-${i}`} className="bg-zen-bg rounded-lg p-2.5 my-1.5 overflow-x-auto border border-zen-border/20">
            <code className="text-[11px] text-zen-text">{codeLines.join('\n')}</code>
          </pre>
        )
        codeLines = []
      }
      inCode = !inCode
      return
    }
    if (inCode) { codeLines.push(line); return }

    if (line.startsWith('### ')) elements.push(<h3 key={i} className="text-xs font-semibold text-zen-text mt-2 mb-1" dangerouslySetInnerHTML={{ __html: formatInline(line.slice(4)) }} />)
    else if (line.startsWith('## ')) elements.push(<h2 key={i} className="text-sm font-semibold text-zen-text mt-2 mb-1" dangerouslySetInnerHTML={{ __html: formatInline(line.slice(3)) }} />)
    else if (line.startsWith('# ')) elements.push(<h1 key={i} className="text-sm font-bold text-zen-text mt-2 mb-1" dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />)
    else if (line.startsWith('- ') || line.startsWith('* ')) elements.push(<li key={i} className="text-xs text-zen-text ml-3 list-disc" dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />)
    else if (line.match(/^\d+\.\s/)) elements.push(<li key={i} className="text-xs text-zen-text ml-3 list-decimal" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^\d+\.\s/, '')) }} />)
    else if (line.startsWith('>')) elements.push(<blockquote key={i} className="border-l-2 border-zen-sage/20 pl-2 text-xs text-zen-muted italic my-1" dangerouslySetInnerHTML={{ __html: formatInline(line.slice(1).trim()) }} />)
    else if (!line.trim()) elements.push(<div key={i} className="h-1.5" />)
    else elements.push(<p key={i} className="text-xs text-zen-text leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />)
  })

  return <div className="space-y-0.5">{elements}</div>
}

function formatInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-zen-bg px-1 py-0.5 rounded text-[10px] text-zen-sage border border-zen-border/20">$1</code>')
    // Handle raw HTML tags that some models return
    .replace(/<strong>(.+?)<\/strong>/g, '<strong>$1</strong>')
    .replace(/<em>(.+?)<\/em>/g, '<em>$1</em>')
    .replace(/<code>(.+?)<\/code>/g, '<code class="bg-zen-bg px-1 py-0.5 rounded text-[10px] text-zen-sage border border-zen-border/20">$1</code>')
    .replace(/<br\s*\/?>/g, '<br/>')
}

export default AgentChat
