# Tool Search Plugin Configuration

## Quick Start

### 1. Add to your cordis.yml

```yaml
- id: tool-search
  name: '@deepseek-ai/dsh-tool-search'
  config:
    maxResults: 10
    similarityThreshold: 0.3
    cacheEnabled: true
    cacheTTL: 300000
    indexRefreshInterval: 60000
    maxConcurrentSearches: 5
```

### 2. Use the tool_search tool

Once configured, the model can use the `tool_search` tool to find relevant tools:

```typescript
const results = await ctx.tools.execute({
  name: 'tool_search',
  arguments: {
    query: 'search the web for information',
    limit: 5
  }
})
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxResults` | number | 10 | Maximum number of search results |
| `similarityThreshold` | number | 0.3 | Minimum similarity score (0-1) |
| `cacheEnabled` | boolean | true | Enable search result caching |
| `cacheTTL` | number | 300000 | Cache time-to-live in milliseconds |
| `embeddingModel` | string | 'default' | Embedding model to use |
| `embeddingDimension` | number | 100 | Embedding vector dimension |
| `indexRefreshInterval` | number | 60000 | Index refresh interval in milliseconds |
| `maxConcurrentSearches` | number | 5 | Maximum concurrent search operations |

## Validation

Run the validation script to check if the plugin is properly configured:

```bash
node packages/tool-search/validate-config.mjs
```

## File Structure

```
packages/tool-search/
├── src/
│   ├── index.ts              # Main entry point
│   ├── search-core.ts        # Core search logic
│   ├── cache.ts              # Search caching
│   ├── types.ts              # Type definitions
│   └── invariant.ts          # Runtime invariants
├── tests/
│   ├── tool-search.spec.ts   # Unit tests
│   └── integration.spec.ts   # Integration tests
├── lib/                      # Build output
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript configuration
├── README.md                 # Documentation
├── CONFIGURATION.md          # Configuration summary
├── test-plugin-config.yml    # Test configuration
└── validate-config.mjs       # Validation script
```
