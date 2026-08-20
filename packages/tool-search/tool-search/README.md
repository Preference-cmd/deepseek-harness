# @deepseek-ai/dsh-tool-search

Model-facing tool search functionality for the DeepSeek Harness.

## Overview

This plugin provides semantic and keyword-based search for tools, allowing agents to find relevant tools based on natural language queries. It implements:

- **Semantic search**: Using embedding vectors to find tools with similar meanings
- **Keyword search**: Using BM25 algorithm for exact keyword matching
- **Hybrid search**: Combining both approaches for better results
- **Search caching**: Improving performance with intelligent caching
- **Real-time indexing**: Automatic index updates when tools change

## Installation

This package is part of the DeepSeek Harness monorepo and is installed as a workspace dependency.

## Quick Start

### 1. Add to your cordis.yml

```yaml
# Add this to your cordis.yml configuration
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
// The model can call the tool_search tool
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

## API

### Tool: tool_search

Search for tools matching a query.

**Parameters:**
- `query` (string, required): Search query describing what you want to do
- `limit` (number, optional): Maximum number of results (default: 10)
- `method` (string, optional): Search method: 'semantic', 'keyword', 'hybrid', or 'auto' (default: 'auto')

**Returns:**
- `results` (array): List of matching tools with scores
- `query` (string): Original search query
- `totalResults` (number): Total number of results found

### Search Methods

1. **Semantic Search**: Uses embedding vectors to find tools with similar meanings
2. **Keyword Search**: Uses BM25 algorithm for exact keyword matching
3. **Hybrid Search**: Combines both approaches with weighted scoring
4. **Auto**: Automatically selects the best method (default)

## Architecture

### Components

1. **SearchCore**: Core search algorithms and indexing
2. **Cache**: LRU cache for search results
3. **ToolSearchService**: Service interface for tool search
4. **Invariant**: Runtime invariant checks

### Indexing

The plugin maintains a search index that includes:
- **Embedding vectors**: For semantic similarity search
- **Keyword index**: For BM25 keyword search
- **Tool metadata**: For filtering and ranking

### Performance

- **Indexing**: Tools are indexed on plugin initialization and refreshed periodically
- **Caching**: Search results are cached with configurable TTL
- **Concurrency**: Limits concurrent search operations

## Examples

### Example 1: Finding Web Search Tools

```typescript
const results = await tool_search({
  query: 'search the web for information',
  limit: 3
})
// Returns: [{ name: 'web_search', score: 0.85, ... }]
```

### Example 2: Finding File Operation Tools

```typescript
const results = await tool_search({
  query: 'read and write files',
  method: 'semantic'
})
// Returns: [{ name: 'read', score: 0.92, ... }, { name: 'write', score: 0.89, ... }]
```

### Example 3: Finding Session Tools

```typescript
const results = await tool_search({
  query: 'search session history',
  method: 'keyword'
})
// Returns: [{ name: 'session_search', score: 0.78, ... }]
```

## Integration with Existing Plugins

### With Web Search

```yaml
# Enable both tool-search and web-search
- id: tool-search
  name: '@deepseek-ai/dsh-tool-search'

- id: tool-web
  name: '@deepseek-ai/dsh-tool-web'
```

### With File System Tools

```yaml
# Enable tool-search with file system tools
- id: tool-search
  name: '@deepseek-ai/dsh-tool-search'

- id: tool-fs
  name: '@deepseek-ai/dsh-tool-fs'
```

### With Session Tools

```yaml
# Enable tool-search with session query tools
- id: tool-search
  name: '@deepseek-ai/dsh-tool-search'

- id: tool-session-query
  name: '@deepseek-ai/dsh-tool-session-query'
```

## Development

### Building

```bash
pnpm run build
```

### Testing

```bash
pnpm run test
```

### Type Checking

```bash
pnpm run typecheck
```

## Contributing

Please see the main DeepSeek Harness contributing guide.

## License

MIT
