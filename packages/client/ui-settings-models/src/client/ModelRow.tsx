/** Shared model fields and actions for both adapter catalog editors. */

import type { ReactNode } from 'react'
import {
  IconChevronDownOutlineRegular, IconChevronRightOutlineRegular, IconTrashOutlineRegular, Pill,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { DeepSeekModelDraft } from './DeepSeekModelsEditor.tsx'
import type { ModelsKey } from './locales.ts'
import { ModelInputTypes } from './ModelInputTypes.tsx'
import styles from './ModelsSection.module.css'

/**
 * The pi-ai reasoning levels a model row may declare, in escalation order.
 * `off` is never offered: a reasoning model always has it (the editor writes it
 * as `off: null`, "supported, send nothing"), and a non-reasoning one has
 * nothing to turn off. Each declared level is written at its own name — the
 * wire spelling most OpenAI-compatible gateways accept as `reasoning_effort` —
 * which keeps per-level spellings out of the card for now.
 */
export const REASONING_LEVELS = ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const

/** One declarable reasoning level. */
export type ReasoningLevel = typeof REASONING_LEVELS[number]

/** A row's reasoning declaration, present only where the adapter offers the vocabulary. */
interface ReasoningLevelsControl {
  /** Levels this row currently declares. */
  readonly declared: readonly ReasoningLevel[]
  /** Toggle one level; a row left with none is a non-reasoning model. */
  readonly onToggle: (level: ReasoningLevel, enabled: boolean) => void
}

/** A capacity's editable text and adapter-specific inherited hint. */
interface CapacityInput {
  value: string
  placeholder: string
  onChange: (value: string) => void
  onBlur?: () => void
}

/** Adapter-owned data and actions for one model row. */
interface ModelRowProps {
  model: DeepSeekModelDraft
  position: number
  inputField: 'inputModalities' | 'input'
  inputFallback?: readonly string[] | undefined
  inputLoading?: boolean
  /** Declared reasoning levels; absent where the adapter's models have no such field. */
  reasoningLevels?: ReasoningLevelsControl | undefined
  expanded: boolean
  disabled: boolean
  t: (key: ModelsKey) => string
  contextWindow: CapacityInput
  maxTokens: CapacityInput
  onFieldChange: (field: 'id' | 'name', value: string | undefined) => void
  onIdBlur?: (value: string) => void
  onChange: (model: DeepSeekModelDraft) => void
  onToggle: () => void
  onRemove: () => void
}

/**
 * Render consistent model identity, capacity, and input-type controls.
 * @param props - drafted fields and their owning editor's actions.
 * @returns one expandable model entry.
 */
export function ModelRow(props: ModelRowProps): ReactNode {
  const { model, position, t, disabled } = props
  const reasoning = props.reasoningLevels
  return (
    <div className={styles['modelEntry']}>
      <div className={styles['modelRow']}>
        {(['id', 'name'] as const).map(field => (
          <input
            key={field}
            className={styles['input']}
            type="text"
            value={typeof model[field] === 'string' ? model[field] : ''}
            placeholder={t(field === 'id' ? 'modelId' : 'modelName')}
            aria-label={`${t(field === 'id' ? 'modelId' : 'modelName')} ${String(position)}`}
            disabled={disabled}
            onChange={(event) => {
              const value = event.target.value
              props.onFieldChange(field, field === 'name' && value === '' ? undefined : value)
            }}
            onBlur={field === 'id' ? event => props.onIdBlur?.(event.target.value) : undefined}
          />
        ))}
        <button
          type="button"
          className={styles['iconButton']}
          aria-label={`${t('modelAdvanced')} ${String(position)}`}
          aria-expanded={props.expanded}
          title={t('modelAdvanced')}
          onClick={props.onToggle}
        >
          {props.expanded ? <IconChevronDownOutlineRegular /> : <IconChevronRightOutlineRegular />}
        </button>
        <button
          type="button"
          className={`${styles['iconButton']} ${styles['iconButtonDanger']}`}
          aria-label={`${t('removeModel')} ${String(position)}`}
          title={t('removeModel')}
          disabled={disabled}
          onClick={props.onRemove}
        >
          <IconTrashOutlineRegular size={14} />
        </button>
      </div>
      {props.expanded
        ? (
          <div className={styles['modelAdvanced']}>
            {(['contextWindow', 'maxTokens'] as const).map(field => (
              <label className={styles['modelField']} key={field}>
                <span className={styles['modelFieldLabel']}>{t(field)}</span>
                <input
                  className={styles['input']}
                  type="text"
                  inputMode="numeric"
                  value={props[field].value}
                  placeholder={props[field].placeholder}
                  aria-label={`${t(field)} ${String(position)}`}
                  disabled={disabled}
                  onChange={(event) => { props[field].onChange(event.target.value) }}
                  onBlur={props[field].onBlur}
                />
              </label>
            ))}
            <ModelInputTypes
              model={model} field={props.inputField} position={position}
              fallback={props.inputFallback} disabled={disabled || props.inputLoading === true} t={t} onChange={props.onChange}
            />
            {reasoning === undefined
              ? null
              : (
                <div className={styles['modelField']}>
                  <span className={styles['modelFieldLabel']}>{t('modelReasoningLevels')}</span>
                  <span className={styles['chipRow']}>
                    {REASONING_LEVELS.map(level => (
                      <Pill
                        key={level}
                        className={styles['chip']}
                        active={reasoning.declared.includes(level)}
                        aria-pressed={reasoning.declared.includes(level)}
                        disabled={disabled}
                        onClick={() => { reasoning.onToggle(level, !reasoning.declared.includes(level)) }}
                      >
                        {level}
                      </Pill>
                    ))}
                  </span>
                  <span className={styles['checkHint']}>{t('modelReasoningLevelsHint')}</span>
                </div>
              )}
          </div>
        )
        : null}
    </div>
  )
}
