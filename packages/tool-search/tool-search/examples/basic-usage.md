# Basic Usage Examples

## Configuration

```yaml
# Basic tool-search configuration
- id: tool-search
  name: "@deepseek-ai/dsh-tool-search"
  config:
    maxResults: 10
    similarityThreshold: 0.3
    cacheEnabled: true
    cacheTTL: 300000
```

## Tool Usage

```typescript
// Model call to tool_search
const results = await ctx.tools.execute({
  name: "tool_search",
  arguments: {
    query: "search the web for current information",
    limit: 5,
    method: "hybrid",
  },
});

// Results will contain:
// {
//   results: [
//     {
//       tool: { name: 'web_search', description: '...' },
//       score: 0.85,
//       rank: 1,
//       method: 'hybrid'
//     },
//     ...
//   ],
//   query: 'search the web for current information',
//   totalResults: 5
// }
```
