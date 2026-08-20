/**
 * Unified web search provider manager: centralised configuration for all known
 * search providers (DeepSeek, Exa, Perplexity) registered into the web capability
 * seam (`ctx.web`). Each provider sub-config is optional — an omitted or empty
 * sub-object means that provider is not registered. A single settings namespace
 * (`web-search-manager`) exposes every provider's tunables through the settings
 * UI without requiring separate plugin entries.
 *
 * Provider selection (which registered provider wins at execution time) remains
 * the `web` service's `searchProvider` config — this plugin registers providers,
 * it does not own selection.
 *
 * @module @deepseek-ai/dsh-web-search-manager
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-web'
import {
  DeepSeekSearchProvider,
  DEEPSEEK_DEFAULT_API_VERSION,
  DEEPSEEK_DEFAULT_BASE_URL,
  DEEPSEEK_DEFAULT_MAX_TOKENS,
  DEEPSEEK_DEFAULT_MAX_USES,
  DEEPSEEK_DEFAULT_MODEL,
} from '@deepseek-ai/dsh-web-search-deepseek'
import type { DeepSeekSearchProviderOptions } from '@deepseek-ai/dsh-web-search-deepseek'
import {
  ExaSearchProvider,
  EXA_DEFAULT_BASE_URL,
  EXA_DEFAULT_HIGHLIGHTS_PER_RESULT,
  EXA_DEFAULT_SEARCH_TYPE,
} from '@deepseek-ai/dsh-web-search-exa'
import type { ExaSearchProviderOptions } from '@deepseek-ai/dsh-web-search-exa'
import {
  PerplexitySearchProvider,
  PERPLEXITY_DEFAULT_BASE_URL,
  PERPLEXITY_DEFAULT_MAX_TOKENS,
  PERPLEXITY_DEFAULT_MODEL,
} from '@deepseek-ai/dsh-web-search-perplexity'
import type { PerplexitySearchProviderOptions } from '@deepseek-ai/dsh-web-search-perplexity'

export {
  DEEPSEEK_DEFAULT_API_VERSION,
  DEEPSEEK_DEFAULT_BASE_URL,
  DEEPSEEK_DEFAULT_MAX_TOKENS,
  DEEPSEEK_DEFAULT_MAX_USES,
  DEEPSEEK_DEFAULT_MODEL,
} from '@deepseek-ai/dsh-web-search-deepseek'
export {
  EXA_DEFAULT_BASE_URL,
  EXA_DEFAULT_HIGHLIGHTS_PER_RESULT,
  EXA_DEFAULT_SEARCH_TYPE,
  EXA_PROVIDER_ID,
} from '@deepseek-ai/dsh-web-search-exa'
export {
  PERPLEXITY_DEFAULT_BASE_URL,
  PERPLEXITY_DEFAULT_MAX_TOKENS,
  PERPLEXITY_DEFAULT_MODEL,
  PERPLEXITY_PROVIDER_ID,
} from '@deepseek-ai/dsh-web-search-perplexity'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'web-search-manager'

/** The web seam this plugin registers providers into. */
export const inject = ['web']

const DEEPSEEK_API_KEY_ENV = 'DEEPSEEK_API_KEY'
const EXA_API_KEY_ENV = 'EXA_API_KEY'
const PERPLEXITY_API_KEY_ENV = 'PERPLEXITY_API_KEY'

// ---------------------------------------------------------------------------
// Unified Config
// ---------------------------------------------------------------------------

/**
 * Plugin config. Each provider section is optional — an omitted section means
 * that provider is not registered. The resolved config is the base layer of the
 * `web-search-manager` settings section; a user layer over it reaches the next
 * search.
 */
export interface Config {
  /** DeepSeek search provider configuration; omit to skip registration. */
  deepseek?: {
    /** Literal DeepSeek API key; prefer `apiKeyEnv`. */
    apiKey?: string
    /** Credential reference; defaults to `DEEPSEEK_API_KEY`. */
    apiKeyEnv?: string
    /** Anthropic-compatible endpoint base; `/messages` is appended. */
    baseURL?: string
    /** Anthropic-format model name. */
    model?: string
    /** `anthropic-version` header value. */
    apiVersion?: string
    /** Upper bound on generated tokens. */
    maxTokens?: number
    /** Maximum `web_search` server-tool uses per request. */
    maxUses?: number
  }
  /** Exa search provider configuration; omit to skip registration. */
  exa?: {
    /** Exa API key; falls back to `$EXA_API_KEY`. */
    apiKey?: string
    /** Endpoint base; `/search` is appended. */
    baseURL?: string
    /** Retrieval mode. */
    searchType?: 'auto' | 'keyword' | 'neural'
    /** Default result count when the request carries no `maxResults`. */
    numResults?: number
    /** Highlight sentences requested per result. */
    highlightsPerResult?: number
  }
  /** Perplexity search provider configuration; omit to skip registration. */
  perplexity?: {
    /** Perplexity API key; falls back to `$PERPLEXITY_API_KEY`. */
    apiKey?: string
    /** Endpoint base; `/chat/completions` is appended. */
    baseURL?: string
    /** Search model name. */
    model?: string
    /** Upper bound on generated answer tokens. */
    maxTokens?: number
    /** Recency window sent as `search_recency_filter`. */
    searchRecency?: 'day' | 'week' | 'month' | 'year'
  }
}

export const Config: z<Config> = z.object({
  deepseek: z.object({
    apiKey: z.string().role('secret'),
    apiKeyEnv: z.string().role('credential-ref').default(DEEPSEEK_API_KEY_ENV),
    baseURL: z.string().default(DEEPSEEK_DEFAULT_BASE_URL),
    model: z.string().default(DEEPSEEK_DEFAULT_MODEL),
    apiVersion: z.string().default(DEEPSEEK_DEFAULT_API_VERSION),
    maxTokens: z.number().step(1).min(1).default(DEEPSEEK_DEFAULT_MAX_TOKENS),
    maxUses: z.number().step(1).min(1).default(DEEPSEEK_DEFAULT_MAX_USES),
  }),
  exa: z.object({
    apiKey: z.string().default(''),
    baseURL: z.string().default(EXA_DEFAULT_BASE_URL),
    searchType: z.union(['auto', 'keyword', 'neural'] as const).default(EXA_DEFAULT_SEARCH_TYPE),
    numResults: z.number().step(1).min(1),
    highlightsPerResult: z.number().step(1).min(1).default(EXA_DEFAULT_HIGHLIGHTS_PER_RESULT),
  }),
  perplexity: z.object({
    apiKey: z.string().default(''),
    baseURL: z.string().default(PERPLEXITY_DEFAULT_BASE_URL),
    model: z.string().default(PERPLEXITY_DEFAULT_MODEL),
    maxTokens: z.number().step(1).min(1).default(PERPLEXITY_DEFAULT_MAX_TOKENS),
    searchRecency: z.union(['day', 'week', 'month', 'year'] as const),
  }),
})

// ---------------------------------------------------------------------------
// Settings namespace
// ---------------------------------------------------------------------------

/** Settings namespace carrying all provider configurations. */
export const WEB_SEARCH_MANAGER_SETTINGS_NAMESPACE = settingsNamespace('web-search-manager')

// ---------------------------------------------------------------------------
// Provider resolution helpers
// ---------------------------------------------------------------------------

/** Resolve DeepSeek provider options from the config section and environment. */
function resolveDeepSeekOptions(ctx: Context, config: NonNullable<Config['deepseek']>): DeepSeekSearchProviderOptions {
  const apiKeyEnv = credentialRef(config.apiKeyEnv ?? DEEPSEEK_API_KEY_ENV)
  const literalApiKey = config.apiKey !== undefined && config.apiKey.length > 0
    ? config.apiKey
    : undefined
  return {
    ...literalApiKey === undefined ? {} : { apiKey: literalApiKey },
    resolveApiKey: async () => {
      const credentials = ctx.get('credentials')
      if (credentials !== undefined) {
        const resolved = await credentials.resolve(apiKeyEnv)
        return resolved?.value
      }
      const ambient = launchEnvironmentOf(ctx).get(apiKeyEnv)
      return ambient !== undefined && ambient.value.length > 0 ? ambient.value : undefined
    },
    apiKeyEnv,
    baseURL: config.baseURL ?? DEEPSEEK_DEFAULT_BASE_URL,
    model: config.model ?? DEEPSEEK_DEFAULT_MODEL,
    apiVersion: config.apiVersion ?? DEEPSEEK_DEFAULT_API_VERSION,
    maxTokens: config.maxTokens ?? DEEPSEEK_DEFAULT_MAX_TOKENS,
    maxUses: config.maxUses ?? DEEPSEEK_DEFAULT_MAX_USES,
    recordRequest: (request) => {
      ctx.get('agents')?.currentInitiator()?.session.append(
        'web/deepseek-search-llm-request',
        request,
      )
    },
  }
}

/** Resolve Exa provider options from the config section and environment. */
function resolveExaOptions(ctx: Context, config: NonNullable<Config['exa']>): ExaSearchProviderOptions {
  return {
    apiKey: config.apiKey ?? launchEnvironmentOf(ctx).get(EXA_API_KEY_ENV)?.value ?? '',
    baseURL: config.baseURL ?? EXA_DEFAULT_BASE_URL,
    searchType: config.searchType ?? EXA_DEFAULT_SEARCH_TYPE,
    highlightsPerResult: config.highlightsPerResult ?? EXA_DEFAULT_HIGHLIGHTS_PER_RESULT,
    ...config.numResults !== undefined ? { numResults: config.numResults } : {},
  }
}

/** Resolve Perplexity provider options from the config section and environment. */
function resolvePerplexityOptions(ctx: Context, config: NonNullable<Config['perplexity']>): PerplexitySearchProviderOptions {
  return {
    apiKey: config.apiKey ?? launchEnvironmentOf(ctx).get(PERPLEXITY_API_KEY_ENV)?.value ?? '',
    baseURL: config.baseURL ?? PERPLEXITY_DEFAULT_BASE_URL,
    model: config.model ?? PERPLEXITY_DEFAULT_MODEL,
    maxTokens: config.maxTokens ?? PERPLEXITY_DEFAULT_MAX_TOKENS,
    ...config.searchRecency !== undefined ? { searchRecency: config.searchRecency } : {},
  }
}

// ---------------------------------------------------------------------------
// Plugin apply
// ---------------------------------------------------------------------------

/**
 * Register the enabled search providers with `ctx.web`. Each provider is
 * registered when its sub-config is present in the resolved settings section and
 * unregistered when the section is removed. Provider options are resolved via
 * thunks at each search, so settings changes to operational fields (apiKey,
 * baseURL, model) take effect at the next search without re-registration.
 */
export function apply(ctx: Context, config: Config): void {
  let current: () => Config = () => config
  const disposers = new Map<string, () => void>()

  installSettingsSection(ctx, WEB_SEARCH_MANAGER_SETTINGS_NAMESPACE, Config, config, {
    setSource: (source) => {
      current = source
    },
    onChange: () => {
      syncProviders(ctx, current, disposers)
    },
  })

  // Initial registration.
  syncProviders(ctx, current, disposers)
}

/**
 * Synchronize registered providers with the current config. Providers whose
 * sub-config is present are registered (if not already); providers whose
 * sub-config is absent are unregistered (if present).
 *
 * DeepSeek provider uses option-thunks so settings changes take effect at the
 * next search without re-registration. Exa and Perplexity providers store
 * options at construction time, so they are re-created on settings change.
 */
function syncProviders(
  ctx: Context,
  getConfig: () => Config,
  disposers: Map<string, () => void>,
): void {
  const config = getConfig()

  // DeepSeek: uses option-thunks, register once and let thunk handle changes.
  if (config.deepseek !== undefined && !disposers.has('deepseek')) {
    const deepseekConfig = config.deepseek
    const dispose = ctx.web.registerSearchProvider(new DeepSeekSearchProvider(
      () => resolveDeepSeekOptions(ctx, deepseekConfig),
    ))
    disposers.set('deepseek', dispose)
  } else if (config.deepseek === undefined) {
    const dispose = disposers.get('deepseek')
    if (dispose !== undefined) {
      dispose()
      disposers.delete('deepseek')
    }
  }

  // Exa: constructor stores options at construction time; re-create on change.
  if (config.exa !== undefined) {
    const previous = disposers.get('exa')
    if (previous !== undefined) {
      // Unregister the old instance before re-registering with fresh options.
      previous()
      disposers.delete('exa')
    }
    const dispose = ctx.web.registerSearchProvider(new ExaSearchProvider(
      resolveExaOptions(ctx, config.exa),
    ))
    disposers.set('exa', dispose)
  } else {
    const dispose = disposers.get('exa')
    if (dispose !== undefined) {
      dispose()
      disposers.delete('exa')
    }
  }

  // Perplexity: constructor stores options at construction time; re-create on change.
  if (config.perplexity !== undefined) {
    const previous = disposers.get('perplexity')
    if (previous !== undefined) {
      previous()
      disposers.delete('perplexity')
    }
    const dispose = ctx.web.registerSearchProvider(new PerplexitySearchProvider(
      resolvePerplexityOptions(ctx, config.perplexity),
    ))
    disposers.set('perplexity', dispose)
  } else {
    const dispose = disposers.get('perplexity')
    if (dispose !== undefined) {
      dispose()
      disposers.delete('perplexity')
    }
  }
}
