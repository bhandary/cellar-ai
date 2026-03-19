import { describe, expect, it } from 'vitest'

import { appendAssistantDelta, appendRenderBlock, ensureAssistantMessage, type Message } from './chat-state'

describe('chat-state helpers', () => {
  it('creates an assistant placeholder using the streamed message id', () => {
    const messages: Message[] = [{ id: 'user-1', role: 'user', content: 'Recommend a Rioja' }]

    const next = ensureAssistantMessage(messages, 'assistant-stream-1')

    expect(next).toEqual([
      { id: 'user-1', role: 'user', content: 'Recommend a Rioja' },
      { id: 'assistant-stream-1', role: 'assistant', content: '' },
    ])
  })

  it('appends streamed text to the matching assistant message', () => {
    const messages: Message[] = [
      { id: 'assistant-stream-1', role: 'assistant', content: 'Cellar ' },
      { id: 'user-1', role: 'user', content: 'Recommend a Rioja' },
    ]

    expect(appendAssistantDelta(messages, 'assistant-stream-1', 'AI')).toEqual([
      { id: 'assistant-stream-1', role: 'assistant', content: 'Cellar AI' },
      { id: 'user-1', role: 'user', content: 'Recommend a Rioja' },
    ])
  })

  it('keeps only supported inline render payloads', () => {
    const createId = () => 'block-1'

    expect(appendRenderBlock([], { type: 'comparison_table', columns: [], rows: [] }, createId)).toEqual([
      { id: 'block-1', type: 'comparison_table', payload: { type: 'comparison_table', columns: [], rows: [] } },
    ])

    expect(appendRenderBlock([], { type: 'pairing_breakdown' }, createId)).toEqual([])
  })
})
