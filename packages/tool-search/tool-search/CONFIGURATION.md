# Tool Search Plugin Configuration Summary

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

## Search Methods

1. **Semantic Search**: Uses embedding vectors to find tools with similar meanings
2. **Keyword Search**: Uses BM25 algorithm for exact keyword matching
3. **Hybrid Search**: Combines both approaches with weighted scoring (default)
4. **Auto**: Automatically selects the best method

## Examples

### Basic Configuration

```yaml
- id: tool-search
  name: '@deepseek-ai/dsh-tool-search'
  config:
    maxResults: 10
    similarityThreshold: 0.3
    cacheEnabled: true
```

### Advanced Configuration

```yaml
- id: tool-search
  name: '@deepseek-ai/dsh-tool-search'
  config:
    maxResults: 20
    similarityThreshold: 0.4
    cacheEnabled: true
    cacheTTL: 600000
    indexRefreshInterval: 30000
    maxConcurrentSearches: 10
```

### Minimal Configuration

```yaml
- id: tool-search
  name: '@deepseek-ai/dsh-tool-search'
```

## Integration Examples

### With Web Search Tools

```yaml
- id: tool-search
  name: '@deepseek-ai/dsh-tool-search'

- id: tool-web
  name: '@deepseek-ai/dsh-tool-web'
```

### With File System Tools

```yaml
- id: tool-search
  name: '@deepseek-ai/dsh-tool-search'

- id: tool-fs
  name: '@deepseek-ai/dsh-tool-fs'
```

### With Session Tools

```yaml
- id: tool-search
  name: '@deepseek-ai/dsh-tool-search'

- id: tool-session-query
  name: '@deepseek-ai/dsh-tool-session-query'
```

## Performance Tuning

### For Large Tool Sets

```yaml
- id: tool-search
  name: '@deepseek-ai/dsh-tool-search'
  config:
    maxResults: 20
    indexRefreshInterval: 30000
    maxConcurrentSearches: 10
    cacheTTL: 600000
```

### For Small Tool Sets

```yaml
- id: tool-search
  name: '@deepseek-ai/dsh-tool-search'
  config:
    maxResults: 5
    similarityThreshold: 0.2
    cacheEnabled: false
```

## Troubleshooting

### Issue: No search results

**Solution:** Lower the similarity threshold:
```yaml
config:
  similarityThreshold: 0.1
```

### Issue: Slow search performance

**Solution:** Enable caching and increase cache TTL:
```yaml
config:
  cacheEnabled: true
  cacheTTL: 600000
```

### Issue: Too many results

**Solution:** Reduce maxResults:
```yaml
config:
  maxResults: 5
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
├── examples/
│   ├── basic-usage.md        # Basic usage examples
│   ├── advanced-usage.md     # Advanced usage examples
│   └── programmatic-usage.md # Programmatic usage examples
├── lib/                      # Build output
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Documentation
```
