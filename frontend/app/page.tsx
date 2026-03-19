'use client'

import { FormEvent, useMemo, useState } from 'react'

type Message = { id: string; role: 'user' | 'assistant'; content: string }
type RenderBlock =
  | { id: string; type: 'wine_card'; payload: any }
  | { id: string; type: 'comparison_table'; payload: any }
  | { id: string; type: 'tasting_note_breakdown'; payload: any }

const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL ?? 'http://localhost:8000/run_sse'
const createId = () => crypto.randomUUID()

function WineCard({ payload }: { payload: any }) {
  const wine = payload.wine
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 18, background: 'rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4bba8' }}>Wine card</div>
      <h3 style={{ marginBottom: 8 }}>{wine.name}</h3>
      <p>{wine.region} · {wine.grape} · {wine.vintage}</p>
      <p><strong>Price:</strong> {wine.price_band}</p>
      <p><strong>Pairing:</strong> {wine.pairing}</p>
      <p><strong>Cellar window:</strong> {wine.cellar_window}</p>
    </div>
  )
}

function ComparisonTable({ payload }: { payload: any }) {
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 18, background: 'rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4bba8' }}>Comparison</div>
      <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>{payload.columns.map((column: string) => <th key={column} style={{ textAlign: 'left', paddingBottom: 8 }}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {payload.rows.map((row: string[], index: number) => (
            <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} style={{ padding: '8px 0' }}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TastingBreakdown({ payload }: { payload: any }) {
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 18, background: 'rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4bba8' }}>Tasting breakdown</div>
      <h3 style={{ marginBottom: 8 }}>{payload.headline}</h3>
      {Object.entries(payload.structure).map(([key, value]) => (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
          <span style={{ textTransform: 'capitalize', color: '#d4bba8' }}>{key}</span>
          <span>{String(value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([{ id: createId(), role: 'assistant', content: 'Welcome to Cellar AI. Ask for a bottle recommendation, pairing, or cellar plan.' }])
  const [blocks, setBlocks] = useState<RenderBlock[]>([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('Idle')
  const [providerMode, setProviderMode] = useState('mock')
  const threadId = useMemo(() => createId(), [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!input.trim()) return
    const nextMessage = { id: createId(), role: 'user' as const, content: input.trim() }
    const history = [...messages, nextMessage]
    setMessages(history)
    setInput('')
    setStatus('Streaming response…')

    const response = await fetch(agentUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, runId: createId(), messages: history, tools: [], context: [] }),
    })

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    if (!reader) return

    let assistantId = createId()
    setMessages((current) => [...current, { id: assistantId, role: 'assistant', content: '' }])

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() ?? ''
      for (const part of parts) {
        const line = part.split('\n').find((entry) => entry.startsWith('data: '))
        if (!line) continue
        const event = JSON.parse(line.slice(6))
        if (event.type === 'TEXT_MESSAGE_START') assistantId = event.messageId
        if (event.type === 'TEXT_MESSAGE_CONTENT') {
          setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: `${message.content}${event.delta}` } : message))
        }
        if (event.type === 'TOOL_CALL_RESULT') {
          const payload = JSON.parse(event.content)
          if (payload.type === 'wine_card' || payload.type === 'comparison_table' || payload.type === 'tasting_note_breakdown') {
            setBlocks((current) => [...current, { id: createId(), type: payload.type, payload } as RenderBlock])
          }
        }
        if (event.type === 'CUSTOM' && event.name === 'PROVIDER_MODE') setProviderMode(event.value.mode)
        if (event.type === 'RUN_FINISHED') setStatus('Run complete')
      }
    }
  }

  return (
    <main style={{ minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gap: 16, gridTemplateColumns: '320px 1fr' }}>
        <aside style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 28, padding: 24, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#d4bba8' }}>Cellar AI</div>
          <h1>Wine Expert Assistant</h1>
          <p>Next.js frontend with CopilotKit-ready composition, AG-UI style streaming, and structured inline sommelier renders.</p>
          <div style={{ marginTop: 24 }}><strong>Status:</strong> {status}</div>
          <div style={{ marginTop: 8 }}><strong>Provider mode:</strong> {providerMode}</div>
        </aside>
        <section style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 28, padding: 24, background: 'rgba(11,11,11,0.3)' }}>
          <div style={{ display: 'grid', gap: 16 }}>
            {messages.map((message) => (
              <div key={message.id} style={{ alignSelf: message.role === 'user' ? 'end' : 'start', maxWidth: '85%', background: message.role === 'user' ? '#7f5539' : 'rgba(255,255,255,0.08)', borderRadius: 24, padding: '14px 18px' }}>
                {message.content}
              </div>
            ))}
          </div>
          <form onSubmit={onSubmit} style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask for a Burgundy pairing, Rioja cellar advice, or value pick" style={{ flex: 1, borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.08)', color: 'white', padding: 14 }} />
            <button type="submit" style={{ borderRadius: 18, border: 0, background: '#b08968', color: '#1a120f', padding: '14px 20px', fontWeight: 700 }}>Send</button>
          </form>
          <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
            {blocks.map((block) => {
              if (block.type === 'wine_card') return <WineCard key={block.id} payload={block.payload} />
              if (block.type === 'comparison_table') return <ComparisonTable key={block.id} payload={block.payload} />
              return <TastingBreakdown key={block.id} payload={block.payload} />
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
