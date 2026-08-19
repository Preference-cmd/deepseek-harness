/**
 * A provider card for the web search manager settings. Each card represents
 * one search provider (DeepSeek, Exa, Perplexity) with a toggle switch to
 * enable/disable and expandable settings fields that extend the card.
 *
 * @module ProviderCard
 */

import clsx from 'clsx'
import { IconChevronDownOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import { CardForm, textField, numberField, type CardFieldSpec } from './card-form.ts'
import { ToggleSwitch } from './ToggleSwitch.tsx'
import { ValueField } from './fields.tsx'
import type { PluginsSettingsLocaleKey } from './locales.ts'
import css from './ProviderCard.module.css'

/** Field definition for a provider setting. */
export interface ProviderFieldDef {
  /** Dot-notation field path (e.g., 'deepseek.baseURL'). */
  field: string
  /** Locale key for the field label. */
  labelKey: PluginsSettingsLocaleKey
  /** Locale key for the field hint. */
  hintKey: PluginsSettingsLocaleKey
  /** Whether the field is numeric. */
  numeric?: boolean
}

/** Configuration for one provider card. */
export interface ProviderConfig {
  /** Provider key in the settings section (e.g., 'deepseek'). */
  key: string
  /** Locale key for the provider name. */
  nameKey: PluginsSettingsLocaleKey
  /** Locale key for the provider description. */
  descriptionKey: PluginsSettingsLocaleKey
  /** Fields this provider exposes for configuration. */
  fields: ProviderFieldDef[]
}

/** Props for the ProviderCard component. */
export interface ProviderCardProps<T> {
  /** The settings scope for the web-search-manager namespace. */
  scope: SettingsScope<T>
  /** Provider configuration. */
  provider: ProviderConfig
  /** Whether this provider is currently enabled. */
  enabled: boolean
  /** Whether this card is currently expanded. */
  expanded: boolean
  /** Called when the toggle is switched. */
  onToggle: (enabled: boolean) => void
  /** Called when the card header is clicked to expand/collapse. */
  onExpand: () => void
  /** Locale reader. */
  t: (key: PluginsSettingsLocaleKey) => string
}

/**
 * Render a provider card with toggle, expandable settings, and save/discard.
 * The card extends vertically when expanded to show its settings fields.
 * @param props - the provider config, scope, and callbacks.
 * @returns the provider card.
 */
export function ProviderCard<T>({
  scope,
  provider,
  enabled,
  expanded,
  onToggle,
  onExpand,
  t,
}: ProviderCardProps<T>) {
  const specs: CardFieldSpec[] = provider.fields.map(f =>
    f.numeric ? numberField(f.field) : textField(f.field),
  )
  const form = new CardForm(scope, specs)

  const store = form.bind(() => {
    const shell = form.shell()
    const fieldStates = Object.fromEntries(
      provider.fields.map(f => [f.field, form.field(f.field)]),
    )
    return { shell, fieldStates }
  })

  const { shell: state, fieldStates } = store.getSnapshot()
  const disabled = !enabled || !state.writable

  const handleToggle = (): void => {
    onToggle(!enabled)
  }

  const handleHeaderClick = (): void => {
    if (enabled) onExpand()
  }

  return (
    <li
      className={clsx(
        css.card,
        expanded && css.cardOpen,
        !enabled && css.cardDisabled,
      )}
    >
      <button
        type="button"
        className={css.header}
        aria-expanded={expanded}
        onClick={handleHeaderClick}
      >
        <span className={css.headText}>
          <span className={css.name}>{t(provider.nameKey)}</span>
          <span className={css.description}>{t(provider.descriptionKey)}</span>
        </span>
        {state.dirty ? <span className={css.pending}>{t('unsaved')}</span> : null}
        <span className={css.toggle} onClick={(e) => { e.stopPropagation() }}>
          <ToggleSwitch checked={enabled} onChange={handleToggle} />
        </span>
        <IconChevronDownOutline14 className={clsx(css.chevron, expanded && css.chevronOpen)} size={12} aria-hidden="true" />
      </button>
      {expanded && enabled
        ? (
          <div className={css.body}>
            {!state.writable ? <p className={css.readOnly} role="status">{t('readOnly')}</p> : null}
            {provider.fields.map((f) => {
              const fieldState = fieldStates[f.field]
              if (!fieldState) return null
              return (
                <ValueField
                  key={f.field}
                  id={`provider-${provider.key}-${f.field}`}
                  label={t(f.labelKey)}
                  hint={t(f.hintKey)}
                  overriddenLabel={t('overridden')}
                  resetLabel={t('reset')}
                  invalidLabel={t('invalidNumber')}
                  disabled={disabled}
                  {...fieldState}
                  {...f.numeric !== undefined ? { numeric: f.numeric } : {}}
                  onEdit={(text) => { form.actions().edit(f.field, text) }}
                  onReset={() => { form.actions().resetField(f.field) }}
                />
              )
            })}
            <div className={css.footer}>
              {state.failed ? <p className={css.failed} role="status">{t('saveFailed')}</p> : null}
              <button
                type="button"
                className={css.discard}
                disabled={!state.dirty || state.saving}
                onClick={() => { form.actions().discard() }}
              >
                {t('discard')}
              </button>
              <button
                type="button"
                className={css.save}
                disabled={!state.dirty || state.invalid || state.saving}
                onClick={() => { void form.actions().save() }}
              >
                {t(state.saving ? 'saving' : 'save')}
              </button>
            </div>
          </div>
        )
        : null}
    </li>
  )
}
