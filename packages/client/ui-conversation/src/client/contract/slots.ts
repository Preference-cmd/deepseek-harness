/** Slot-backed renderer used by chat nodes without importing an attachment implementation. */
export type RenderMessageImages = (owner: Omit<MessageImagesOwnerProps, 'loadImage'>) => ReactNode

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /**
     * The session chrome wrapping the conversation scrollport and the
     * composer chrome.
     */
    'conversation.session': { kind: 'single'; scope: 'session' }
    /**
     * The strip above the session's scrollport: title, view tabs, and the
     * action row. Taking this seat means rendering all three yourself, and it
     * replaces the built-in header entirely.
     */
    'conversation.session.header': { kind: 'single'; scope: 'session' }
    // ... other slots
  }
}

export interface ConversationSlotProps {
  // placeholder
}
