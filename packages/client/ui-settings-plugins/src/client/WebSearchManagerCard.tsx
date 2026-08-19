/**
 * The web-search-manager card: a collapsible section containing provider
 * cards for DeepSeek, Exa, and Perplexity. Each provider card extends
 * vertically when expanded to show its settings.
 *
 * @module WebSearchManagerCard
 */

import { useState } from 'react'
import clsx from 'clsx'
import { IconChevronDownOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { ProviderCard } from './ProviderCard.tsx'
import { PROVIDER_CONFIGS } from './web-search-manager-card-controller.ts'
import type { WebSearchManagerCardFace } from './web-search-manager-card-controller.ts'
import type {} from './slot-contract.ts'
import css from './WebSearchManagerCard.module.css'

/** Props the renderer binds for the web-search-manager card. */
export type WebSearchManagerCardProps =
  PropsRuntime<'settings.plugin.item'>
  & PropsLocale<'settings.plugins'>
  & InjectFace<WebSearchManagerCardFace>

/**
 * Render the web-search-manager card: an outer collapsible section with
 * provider cards inside. Each card extends when expanded.
 * @param props - locale copy, the card snapshot, and its form actions.
 * @returns the section card.
 */
export function WebSearchManagerCard({ t, isProviderEnabled, toggleProvider, getScope }: WebSearchManagerCardProps) {
  const [sectionOpen, setSectionOpen] = useState(false)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const scope = getScope()

  const handleToggle = (key: string, enabled: boolean): void => {
    toggleProvider(key, enabled)
    if (!enabled && expandedKey === key) setExpandedKey(null)
  }

  const handleExpand = (key: string): void => {
    setExpandedKey(prev => prev === key ? null : key)
  }

  return (
    <li className={clsx(css.section, sectionOpen && css.sectionOpen)}>
      <button
        type="button"
        className={css.sectionHeader}
        aria-expanded={sectionOpen}
        onClick={() => { setSectionOpen(!sectionOpen) }}
      >
        <span className={css.sectionHeadText}>
          <span className={css.sectionName}>{t('webSearchManagerTitle')}</span>
          <span className={css.sectionDescription}>{t('webSearchManagerDescription')}</span>
        </span>
        <IconChevronDownOutline14 className={clsx(css.chevron, sectionOpen && css.chevronOpen)} size={12} aria-hidden="true" />
      </button>
      {sectionOpen
        ? (
          <div className={css.sectionBody}>
            <div className={css.cardRow}>
              {PROVIDER_CONFIGS.map(config => (
                <ProviderCard
                  key={config.key}
                  scope={scope}
                  provider={config}
                  enabled={isProviderEnabled(config.key)}
                  expanded={expandedKey === config.key}
                  onToggle={(enabled) => { handleToggle(config.key, enabled) }}
                  onExpand={() => { handleExpand(config.key) }}
                  t={t}
                />
              ))}
            </div>
          </div>
        )
        : null}
    </li>
  )
}
