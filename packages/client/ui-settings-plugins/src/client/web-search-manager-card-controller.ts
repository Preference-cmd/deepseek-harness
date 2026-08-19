/**
 * The web-search-manager card's staged form over the `web-search-manager`
 * settings namespace. It provides unified configuration for all search providers
 * (DeepSeek, Exa, Perplexity) through individual provider cards.
 *
 * @module web-search-manager-card-controller
 */

import type { SettingsScope, SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import {
  CardForm, textField, numberField,
  type CardActions, type CardFieldState, type CardShell,
} from './card-form.ts'
import type { ProviderConfig } from './ProviderCard.tsx'

/** Namespace of the web search manager plugin. */
export const WEB_SEARCH_MANAGER_NS = 'web-search-manager'

/** The fields this card edits for the DeepSeek provider. */
export interface DeepSeekSubSettings {
  apiKeyEnv?: string
  baseURL?: string
  model?: string
  maxUses?: number
}

/** The fields this card edits for the Exa provider. */
export interface ExaSubSettings {
  apiKey?: string
  baseURL?: string
  searchType?: 'auto' | 'keyword' | 'neural'
}

/** The fields this card edits for the Perplexity provider. */
export interface PerplexitySubSettings {
  apiKey?: string
  baseURL?: string
  model?: string
}

/** The settings namespace shape. */
export interface WebSearchManagerSettings {
  deepseek?: DeepSeekSubSettings
  exa?: ExaSubSettings
  perplexity?: PerplexitySubSettings
}

/** What the web-search-manager card renders. */
export interface WebSearchManagerCardState extends CardShell {
  /** Whether the deepseek section is present. */
  hasDeepSeek: boolean
  /** Whether the exa section is present. */
  hasExa: boolean
  /** Whether the perplexity section is present. */
  hasPerplexity: boolean
  /** DeepSeek fields. */
  deepseekBaseURL: CardFieldState
  deepseekModel: CardFieldState
  deepseekMaxUses: CardFieldState
  /** Exa fields. */
  exaBaseURL: CardFieldState
  /** Perplexity fields. */
  perplexityBaseURL: CardFieldState
  perplexityModel: CardFieldState
}

/** The registration-side face the card's slot entry injects. */
export interface WebSearchManagerCardFace extends CardActions {
  hooks: {
    /** Card snapshot bound by the renderer as useWebSearchManagerCard. */
    webSearchManagerCard: SnapshotStore<WebSearchManagerCardState>
  }
  /** Whether a provider is enabled. */
  isProviderEnabled: (key: string) => boolean
  /** Toggle a provider on or off. */
  toggleProvider: (key: string, enabled: boolean) => void
  /** Get the settings scope for ProviderCard instances. */
  getScope: () => SettingsScope<WebSearchManagerSettings>
}

/** Default configurations for each provider. */
const PROVIDER_DEFAULTS: Record<string, unknown> = {
  deepseek: {
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    baseURL: 'https://api.deepseek.com/anthropic/v1',
    model: 'deepseek-v4-flash',
    apiVersion: '2023-06-01',
    maxTokens: 4096,
    maxUses: 5,
  },
  exa: {
    apiKey: '',
    baseURL: 'https://api.exa.ai',
    searchType: 'auto',
    highlightsPerResult: 1,
  },
  perplexity: {
    apiKey: '',
    baseURL: 'https://api.perplexity.ai',
    model: 'sonar',
    maxTokens: 1024,
  },
}

/** Provider card configurations. */
export const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    key: 'deepseek',
    nameKey: 'webSearchManagerDeepSeek',
    descriptionKey: 'webSearchManagerDeepSeekDescription',
    fields: [
      { field: 'deepseek.baseURL', labelKey: 'webSearchManagerBaseUrl', hintKey: 'webSearchManagerBaseUrlHint' },
      { field: 'deepseek.model', labelKey: 'webSearchManagerModel', hintKey: 'webSearchManagerModelHint' },
      { field: 'deepseek.maxUses', labelKey: 'webSearchManagerMaxUses', hintKey: 'webSearchManagerMaxUsesHint', numeric: true },
    ],
  },
  {
    key: 'exa',
    nameKey: 'webSearchManagerExa',
    descriptionKey: 'webSearchManagerExaDescription',
    fields: [
      { field: 'exa.baseURL', labelKey: 'webSearchManagerBaseUrl', hintKey: 'webSearchManagerBaseUrlHint' },
    ],
  },
  {
    key: 'perplexity',
    nameKey: 'webSearchManagerPerplexity',
    descriptionKey: 'webSearchManagerPerplexityDescription',
    fields: [
      { field: 'perplexity.baseURL', labelKey: 'webSearchManagerBaseUrl', hintKey: 'webSearchManagerBaseUrlHint' },
      { field: 'perplexity.model', labelKey: 'webSearchManagerModel', hintKey: 'webSearchManagerModelHint' },
    ],
  },
]

/** Bridges the `web-search-manager` scope onto the card. */
export class WebSearchManagerCardController {
  private readonly form: CardForm<WebSearchManagerSettings>
  private readonly store: SnapshotStore<WebSearchManagerCardState>

  constructor(
    private readonly scope: SettingsScope<WebSearchManagerSettings>,
  ) {
    this.form = new CardForm(
      scope,
      [
        textField('deepseek.baseURL'),
        textField('deepseek.model'),
        numberField('deepseek.maxUses'),
        textField('exa.baseURL'),
        textField('perplexity.baseURL'),
        textField('perplexity.model'),
      ],
      [],
    )
    this.store = this.form.bind(() => this.projection())
  }

  private projection(): WebSearchManagerCardState {
    const snapshot = this.scope.getSnapshot()
    return {
      ...this.form.shell(),
      hasDeepSeek: snapshot.value?.deepseek !== undefined,
      hasExa: snapshot.value?.exa !== undefined,
      hasPerplexity: snapshot.value?.perplexity !== undefined,
      deepseekBaseURL: this.form.field('deepseek.baseURL'),
      deepseekModel: this.form.field('deepseek.model'),
      deepseekMaxUses: this.form.field('deepseek.maxUses'),
      exaBaseURL: this.form.field('exa.baseURL'),
      perplexityBaseURL: this.form.field('perplexity.baseURL'),
      perplexityModel: this.form.field('perplexity.model'),
    }
  }

  /** Whether a provider is enabled (has a config section). */
  isProviderEnabled(key: string): boolean {
    const snapshot = this.scope.getSnapshot()
    return snapshot.value !== undefined && (snapshot.value as Record<string, unknown>)[key] !== undefined
  }

  /** Toggle a provider on or off. ON writes defaults; OFF removes the section. */
  toggleProvider(key: string, enabled: boolean): void {
    if (enabled) {
      void this.scope.set(key, PROVIDER_DEFAULTS[key])
    } else {
      void this.scope.unset(key)
    }
  }

  /** Get the settings scope for ProviderCard instances. */
  getScope(): SettingsScope<WebSearchManagerSettings> {
    return this.scope
  }

  /** Build the face the card's slot registration injects. */
  inject(): WebSearchManagerCardFace {
    return {
      hooks: { webSearchManagerCard: this.store },
      ...this.form.actions(),
      isProviderEnabled: key => this.isProviderEnabled(key),
      toggleProvider: (key, enabled) => this.toggleProvider(key, enabled),
      getScope: () => this.getScope(),
    }
  }
}
