export type Message = { id: string; role: 'user' | 'assistant'; content: string }
export type RenderBlock =
  | { id: string; type: 'wine_card'; payload: any }
  | { id: string; type: 'comparison_table'; payload: any }
  | { id: string; type: 'tasting_note_breakdown'; payload: any }

export function ensureAssistantMessage(messages: Message[], messageId: string): Message[] {
  if (messages.some((message) => message.id === messageId)) return messages
  return [...messages, { id: messageId, role: 'assistant', content: '' }]
}

export function appendAssistantDelta(messages: Message[], messageId: string, delta: string): Message[] {
  return messages.map((message) =>
    message.id === messageId ? { ...message, content: `${message.content}${delta}` } : message,
  )
}

export function appendRenderBlock(blocks: RenderBlock[], payload: RenderBlock['payload'], createId: () => string): RenderBlock[] {
  if (payload.type !== 'wine_card' && payload.type !== 'comparison_table' && payload.type !== 'tasting_note_breakdown') {
    return blocks
  }

  return [...blocks, { id: createId(), type: payload.type, payload } as RenderBlock]
}
