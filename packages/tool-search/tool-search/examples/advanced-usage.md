# Advanced Usage Examples

## Advanced Configuration

```yaml
# Advanced tool-search configuration
- id: tool-search
  name: "@deepseek-ai/dsh-tool-search"
  config:
    maxResults: 20
    similarityThreshold: 0.4
    cacheEnabled: true
    cacheTTL: 600000 # 10 minutes
    indexRefreshInterval: 30000 # 30 seconds
    maxConcurrentSearches: 10
```

## Complete Agent Configuration

```yaml
# Complete agent configuration with tool-search

# LLM Provider
- id: llm-deepseek
  name: "@deepseek-ai/dsh-llm-deepseek"
  config:
    thinking: enabled
    models:
      - id: deepseek-v4-flash

# Tool Search Plugin
- id: tool-search
  name: "@deepseek-ai/dsh-tool-search"
  config:
    maxResults: 10
    similarityThreshold: 0.3
    cacheEnabled: true

# Web Search Tools
- id: tool-web
  name: "@deepseek-ai/dsh-tool-web"

# File System Tools
- id: tool-fs
  name: "@deepseek-ai/dsh-tool-fs"

# Session Tools
- id: tool-session-query
  name: "@deepseek-ai/dsh-tool-session-query"

# Todo Tool
- id: tool-todo
  name: "@deepseek-ai/dsh-tool-todo"
  config:
    allowParallelInProgress: true
```
