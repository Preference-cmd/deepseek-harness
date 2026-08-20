/**
 * A sliding toggle switch indicating on/off state.
 *
 * @module ToggleSwitch
 */

import css from './ToggleSwitch.module.css'

/** Props for the toggle switch. */
export interface ToggleSwitchProps {
  /** Whether the toggle is on. */
  checked: boolean
  /** Disables the toggle. */
  disabled?: boolean
  /** Called when the toggle is clicked. */
  onChange: (checked: boolean) => void
}

/**
 * Render a toggle switch.
 * @param props - the toggle state and change handler.
 * @returns the toggle switch.
 */
export function ToggleSwitch({ checked, disabled, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={css.track}
      data-checked={checked ? 'true' : undefined}
      disabled={disabled}
      onClick={() => { onChange(!checked) }}
    >
      <span className={css.dot} />
    </button>
  )
}
