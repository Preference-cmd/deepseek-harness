import type { ConversationSessionNavigatorOwnerProps } from '../contract/slots.ts'
import { TurnNavigator } from './TurnNavigator.tsx'

export type { ConversationSessionNavigatorOwnerProps }

export function apply(): void {
  // Plugin registration handled by the parent conversation package
}

export { TurnNavigator }
