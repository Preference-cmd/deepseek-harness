English | [中文](README.zh.md)

# @deepseek-ai/dsh-web-search-manager

A unified [web search](../web/README.md) provider manager for the harness web capability seam (`ctx.web`). It provides **centralised configuration** for all known search providers (DeepSeek, Exa, Perplexity) in a single plugin entry, with a **settings-UI integration** that exposes every provider's tunables through the `web-search-manager` settings section.

This is a **management plugin**: it registers providers into `ctx.web` based on its config and does not own the `ctx.web` key. Provider selection (which registered provider wins at execution time) remains the `web` service's `searchProvider` config.

## How it works

Each provider sub-config is optional. An omitted section means that provider is not registered. The resolved config becomes the base layer of the `web-search-manager` settings section; a user layer over it reaches the next search.

Provider options are resolved via thunks at each search, so settings changes to operational fields (apiKey, baseURL, model) take effect at the next search without re-registration. When a provider sub-config is added or removed through the settings UI, the provider is dynamically registered or unregistered.

## Config

| Key | Type | Meaning |
|---|---|---|
| `deepseek` | object (optional) | DeepSeek search provider configuration. Omit to skip registration. |
| `deepseek.apiKey` | string (secret) | Literal DeepSeek API key. Prefer `apiKeyEnv`. |
| `deepseek.apiKeyEnv` | string | Credential reference; defaults to `DEEPSEEK_API_KEY`. |
| `deepseek.baseURL` | string | Anthropic-compatible endpoint base; `/messages` is appended. Defaults to `https://api.deepseek.com/anthropic/v1`. |
| `deepseek.model` | string | Anthropic-format model name. Defaults to `deepseek-v4-flash`. |
| `deepseek.apiVersion` | string | `anthropic-version` header value. Defaults to `2023-06-01`. |
| `deepseek.maxTokens` | number | Upper bound on generated tokens. Defaults to 4096. |
| `deepseek.maxUses` | number | Maximum `web_search` server-tool uses per request. Defaults to 5. |
| `exa` | object (optional) | Exa search provider configuration. Omit to skip registration. |
| `exa.apiKey` | string | Exa API key; falls back to `$EXA_API_KEY`. |
| `exa.baseURL` | string | Endpoint base; `/search` is appended. Defaults to `https://api.exa.ai`. |
| `exa.searchType` | string | Retrieval mode: `auto`, `keyword`, or `neural`. Defaults to `auto`. |
| `exa.numResults` | number | Default result count when the request carries no `maxResults`. |
| `exa.highlightsPerResult` | number | Highlight sentences requested per result. Defaults to 1. |
| `perplexity` | object (optional) | Perplexity search provider configuration. Omit to skip registration. |
| `perplexity.apiKey` | string | Perplexity API key; falls back to `$PERPLEXITY_API_KEY`. |
| `perplexity.baseURL` | string | Endpoint base; `/chat/completions` is appended. Defaults to `https://api.perplexity.ai`. |
| `perplexity.model` | string | Search model name. Defaults to `sonar`. |
| `perplexity.maxTokens` | number | Upper bound on generated answer tokens. Defaults to 1024. |
| `perplexity.searchRecency` | string | Recency window: `day`, `week`, `month`, or `year`. |

### Example: register DeepSeek and Exa only

```yaml
plugins:
  web-search-manager:
    config:
      deepseek:
        apiKeyEnv: DEEPSEEK_API_KEY
      exa:
        apiKey: my-exa-key
      # perplexity omitted — not registered
```

### Example: register all three with custom endpoints

```yaml
plugins:
  web:
    config:
      searchProvider: deepseek-official
  web-search-manager:
    config:
      deepseek:
        baseURL: https://gateway.internal/anthropic/v1
        model: deepseek-v4-flash
      exa:
        apiKeyEnv: EXA_API_KEY
        searchType: neural
      perplexity:
        apiKeyEnv: PERPLEXITY_API_KEY
        model: sonar-pro
```

## Settings UI

The `web-search-manager` settings namespace exposes all provider configurations through the settings UI. Users can adjust API keys, endpoints, models, and other parameters at runtime without restarting the agent.

The settings section carries the same schema as the plugin config. Each provider's `apiKey` field carries `role('secret')`, so it never appears in `describe()` responses — the UI learns only whether the credentials domain holds a value, never the literal key.

## Provider selection

This plugin registers providers but does not control which one wins. Configure the `web` service's `searchProvider` field to pin a specific provider:

```yaml
plugins:
  web:
    config:
      searchProvider: deepseek-official  # or "exa", "perplexity"
```

Without a `searchProvider` config, the web seam requires exactly one usable provider — registering multiple providers without a pinned selection results in `WEB_PROVIDER_AMBIGUOUS`.

## Model Experience

### Indirect, through dsh-tool-web

#### What the model sees

The model sees the `web_search` tool (registered by `dsh-tool-web`). The choice of backend provider is invisible — the same tool schema and result format apply regardless of which provider is active.

#### Token effect

Zero direct tokens from provider registration. Provider-specific token effects depend on the active provider (see each provider's README).

#### KV Cache effect

Independent of the conversation request cache. Provider registration does not affect the KV cache.

## Known Limitations and Deferred Work

- **Provider selection is not managed by this plugin** — the `web` service's `searchProvider` config (or the single-usual-provider fallback) determines the active provider. This plugin only registers providers.
- **Adding a provider via settings UI requires the provider section to be present** in the initial cordis.yml config. The settings section's base layer is the composition entry; a provider section that starts as `undefined` cannot be added at runtime because the settings schema omits the section rather than carrying `null`.
- **The plugin does not manage fetch providers** — only search providers are registered. Fetch provider management remains the responsibility of `web-fetch-http`.
