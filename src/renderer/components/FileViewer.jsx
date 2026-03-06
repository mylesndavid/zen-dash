import React, { useState, useEffect } from 'react'

function FileViewer({ note, onUpdate }) {
  const [content, setContent] = useState(note.fileContent || null)
  const [expanded, setExpanded] = useState(false)

  const ext = (note.fileName || '').split('.').pop().toLowerCase()

  useEffect(() => {
    if (note.fileContent) setContent(note.fileContent)
  }, [note.fileContent])

  const renderContent = () => {
    if (!content) return <div className="text-zen-muted/40 text-xs p-3">No content</div>

    switch (ext) {
      case 'csv':
        return <CsvViewer content={content} />
      case 'md':
        return <MarkdownViewer content={content} />
      case 'txt':
      case 'log':
      case 'json':
      case 'yml':
      case 'yaml':
        return <TextViewer content={content} ext={ext} />
      case 'pdf':
        return <PdfViewer content={content} />
      default:
        return <TextViewer content={content} ext={ext} />
    }
  }

  return (
    <div className="space-y-2">
      {/* File header */}
      <div className="flex items-center gap-2">
        {getFileIcon(ext)}
        <span className="text-xs text-zen-text truncate flex-1">{note.fileName}</span>
        {note.fileSize && <span className="text-[10px] text-zen-muted">{note.fileSize}</span>}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          className="text-zen-muted hover:text-zen-text transition-colors"
        >
          <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Content viewer - collapsed by default */}
      {expanded && (
        <div className="bg-zen-bg/60 rounded-lg overflow-hidden overflow-y-auto" style={{ maxHeight: note.viewHeight || 200 }}>
          {renderContent()}
        </div>
      )}
    </div>
  )
}

function getFileIcon(ext) {
  const cls = "w-3.5 h-3.5 text-zen-muted"
  return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
}

function CsvViewer({ content }) {
  const rows = content.split('\n').filter(r => r.trim()).map(r => r.split(',').map(c => c.trim().replace(/^"|"$/g, '')))
  const headers = rows[0] || []
  const data = rows.slice(1)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="bg-zen-card">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-2 py-1.5 text-zen-muted font-medium border-b border-zen-border/30 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 50).map((row, i) => (
            <tr key={i} className="hover:bg-zen-card/50">
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-1 text-zen-text border-b border-zen-border/10 whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 50 && (
        <p className="text-[10px] text-zen-muted/40 p-2">Showing first 50 of {data.length} rows</p>
      )}
    </div>
  )
}

function MarkdownViewer({ content }) {
  const renderLine = (line, i) => {
    if (line.startsWith('### ')) return <h3 key={i} className="text-xs font-semibold text-zen-text mt-2 mb-1">{line.slice(4)}</h3>
    if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-semibold text-zen-text mt-3 mb-1">{line.slice(3)}</h2>
    if (line.startsWith('# ')) return <h1 key={i} className="text-sm font-bold text-zen-text mt-3 mb-1">{line.slice(2)}</h1>
    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="text-xs text-zen-text ml-3 list-disc">{formatInline(line.slice(2))}</li>
    if (line.match(/^\d+\.\s/)) return <li key={i} className="text-xs text-zen-text ml-3 list-decimal">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
    if (line.startsWith('```')) return null
    if (line.startsWith('>')) return <blockquote key={i} className="border-l-2 border-zen-sage/30 pl-2 text-xs text-zen-muted italic">{line.slice(1).trim()}</blockquote>
    if (!line.trim()) return <div key={i} className="h-2" />
    return <p key={i} className="text-xs text-zen-text leading-relaxed">{formatInline(line)}</p>
  }

  const formatInline = (text) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-zen-card px-1 rounded text-[10px]">$1</code>')
  }

  const lines = content.split('\n')
  const elements = []
  let inCodeBlock = false
  let codeLines = []

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="bg-zen-card rounded p-2 my-1 overflow-x-auto">
            <code className="text-[10px] text-zen-text">{codeLines.join('\n')}</code>
          </pre>
        )
        codeLines = []
      }
      inCodeBlock = !inCodeBlock
      return
    }
    if (inCodeBlock) {
      codeLines.push(line)
      return
    }

    const el = renderLine(line, i)
    if (el) elements.push(el)
  })

  return <div className="p-3 space-y-0.5">{elements}</div>
}

function TextViewer({ content, ext }) {
  return (
    <pre className="p-3 text-[10px] text-zen-text font-mono leading-relaxed whitespace-pre-wrap">{content.slice(0, 5000)}{content.length > 5000 ? '\n\n... truncated' : ''}</pre>
  )
}

function PdfViewer({ content }) {
  // For base64 PDF data, show in an embed
  if (content.startsWith('data:application/pdf')) {
    return <embed src={content} type="application/pdf" className="w-full h-48" />
  }
  return <div className="p-3 text-xs text-zen-muted">PDF preview (drag the file to view)</div>
}

export default FileViewer
