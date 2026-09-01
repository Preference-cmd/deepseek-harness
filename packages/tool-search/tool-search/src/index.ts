/**
 * Tool search plugin for DeepSeek Harness.
 *
 * This plugin provides model-facing tool search functionality, allowing
 * agents to find relevant tools based on semantic similarity and keywords.
 *
 * @module @deepseek-ai/dsh-tool-search
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ToolDefinition } from '@deepseek-ai/dsh-tools'

import type {
  ToolSearchResult,
  SearchOptions,
  ToolSearchService,
  ToolSearchConfig,
  SearchIndex,
} from './types.ts'
import {
  createSearchIndex,
  buildIndex,
  searchTools,
  updateIndex,
} from './search-core.ts'
import { SearchCache, createSearchCache } from './cache.ts'

/** Plugin name. */
export const name = 'tool-search'

/** Required services. */
export const inject = ['tools']

/** Default configuration. */
const DEFAULT_CONFIG: ToolSearchConfig = {
  maxResults: 10,
  similarityThreshold: 0.3,
  cacheEnabled: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  embeddingModel: 'default',
  embeddingDimension: 100,
  indexRefreshInterval: 60 * 1000, // 1 minute
  maxConcurrentSearches: 5,
}

/** Configuration schema. */
export interface Config {
  /** Maximum number of results to return. */
  maxResults?: number
  /** Minimum similarity threshold (0-1). */
  similarityThreshold?: number
  /** Whether to enable search caching. */
  cacheEnabled?: boolean
  /** Cache TTL in milliseconds. */
  cacheTTL?: number
  /** Embedding model to use. */
  embeddingModel?: string
  /** Embedding dimension. */
  embeddingDimension?: number
  /** Index refresh interval in milliseconds. */
  indexRefreshInterval?: number
  /** Maximum concurrent searches. */
  maxConcurrentSearches?: number
}

/** Schemastery configuration. */
export const Config: z<Config> = z.object({
  maxResults: z.number().min(1).max(100).default(DEFAULT_CONFIG.maxResults),
  similarityThreshold: z
    .number()
    .min(0)
    .max(1)
    .default(DEFAULT_CONFIG.similarityThreshold),
  cacheEnabled: z.boolean().default(DEFAULT_CONFIG.cacheEnabled),
  cacheTTL: z.number().min(1000).default(DEFAULT_CONFIG.cacheTTL),
  embeddingModel: z.string().default(DEFAULT_CONFIG.embeddingModel),
  embeddingDimension: z
    .number()
    .min(1)
    .default(DEFAULT_CONFIG.embeddingDimension),
  indexRefreshInterval: z
    .number()
    .min(1000)
    .default(DEFAULT_CONFIG.indexRefreshInterval),
  maxConcurrentSearches: z
    .number()
    .min(1)
    .default(DEFAULT_CONFIG.maxConcurrentSearches),
})

/**
 * Tool search service implementation.
 */
class ToolSearchServiceImpl implements ToolSearchService {
  private index: SearchIndex
  private cache: SearchCache | null = null
  private config: ToolSearchConfig
  private refreshTimer: ReturnType<typeof setInterval> | null = null
  private toolsMap = new Map<string, ToolDefinition>()

  constructor(ctx: Context, config: ToolSearchConfig) {
    this.config = config
    this.index = createSearchIndex()

    if (config.cacheEnabled) {
      this.cache = createSearchCache({
        maxSize: 1000,
        ttl: config.cacheTTL,
      })
    }

    // Initial index build
    this.initializeIndex(ctx)

    // Set up periodic refresh
    if (config.indexRefreshInterval > 0) {
      this.refreshTimer = setInterval(() => {
        this.refreshIndex(ctx)
      }, config.indexRefreshInterval)
    }
  }

  private async initializeIndex(ctx: Context): Promise<void> {
    const schemas = ctx.tools.schemas()
    this.toolsMap.clear()

    // We need to get tool definitions, but schemas only gives us ToolSchema
    // We'll store what we can and rebuild when needed
    for (const schema of schemas) {
      // We'll create a minimal ToolDefinition for indexing
      // In a real implementation, we'd need access to the full definitions
      const tool = {
        name: schema.name,
        description: schema.description,
        parameters: schema.parameters,
        output: {
          schema: { type: 'object' },
          render: () => [],
        },
        execute: async () => ({}),
      } as ToolDefinition

      this.toolsMap.set(schema.name, tool)
    }

    await buildIndex(Array.from(this.toolsMap.values()))
  }

  private async refreshIndex(ctx: Context): Promise<void> {
    const schemas = ctx.tools.schemas()
    const newToolsMap = new Map<string, ToolDefinition>()

    for (const schema of schemas) {
      if (!this.toolsMap.has(schema.name)) {
        // New tool added
        const tool = {
          name: schema.name,
          description: schema.description,
          parameters: schema.parameters,
          output: {
            schema: { type: 'object' },
            render: () => [],
          },
          execute: async () => ({}),
        } as ToolDefinition

        newToolsMap.set(schema.name, tool)
        await updateIndex(this.index, tool, 'add')
      } else {
        // Existing tool
        const existing = this.toolsMap.get(schema.name)
        if (existing) newToolsMap.set(schema.name, existing)
      }
    }

    // Check for removed tools
    for (const [name] of this.toolsMap) {
      if (!newToolsMap.has(name)) {
        const removed = this.toolsMap.get(name)
        if (removed) await updateIndex(this.index, removed, 'remove')
      }
    }

    this.toolsMap = newToolsMap
  }

  async search(options: SearchOptions): Promise<readonly ToolSearchResult[]> {
    const { query } = options

    // Check cache first
    if (this.cache) {
      const cached = this.cache.get(
        query,
        options as unknown as Record<string, unknown>,
      )
      if (cached) {
        return cached
      }
    }

    // Perform search
    const results = await searchTools(
      options,
      this.index,
      this.toolsMap,
      this.config,
    )

    // Cache results
    if (this.cache) {
      this.cache.set(query, options as unknown as Record<string, unknown>, [
        ...results,
      ])
    }

    return results
  }

  async indexTools(): Promise<void> {
    // Rebuild entire index
    await buildIndex(Array.from(this.toolsMap.values()))
  }

  async updateTool(
    tool: ToolDefinition,
    action: 'add' | 'update' | 'remove',
  ): Promise<void> {
    if (action === 'remove') {
      this.toolsMap.delete(tool.name)
    } else {
      this.toolsMap.set(tool.name, tool)
    }

    await updateIndex(this.index, tool, action)

    // Invalidate cache
    if (this.cache) {
      this.cache.clear()
    }
  }

  dispose(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }
}

/**
 * Apply the tool search plugin.
 */
export function apply(ctx: Context, config: Config = {}): void {
  const resolvedConfig: ToolSearchConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  }

  const searchService = new ToolSearchServiceImpl(ctx, resolvedConfig)

  // Register tool_search tool
  const toolSearch = defineTool({
    name: 'tool_search',
    description:
      'Search for relevant tools based on a query. Use this when you need to find tools for a specific task but are not sure which tools are available.',
    parameters: {
      query: {
        type: 'string',
        required: true,
        description: 'Search query describing what you want to do',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)',
      },
      method: {
        type: 'string',
        enum: ['semantic', 'keyword', 'hybrid', 'auto'],
        description: 'Search method to use (default: auto)',
      },
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                score: { type: 'number' },
                rank: { type: 'number' },
                method: { type: 'string' },
              },
              additionalProperties: false,
            },
          },
          query: { type: 'string' },
          totalResults: { type: 'number' },
        },
        additionalProperties: false,
      },
      render: (_args, value) => {
        const result = value as {
          results: ToolSearchResult[]
          query: string
          totalResults: number
        }

        if (result.results.length === 0) {
          return [
            {
              type: 'text',
              text: `No tools found matching query: "${result.query}"`,
            },
          ]
        }

        const lines = result.results.map(
          r =>
            `- \`\${r.tool.name}\`: ${r.tool.description} (score: ${r.score.toFixed(3)})`,
        )

        return [
          {
            type: 'text',
            text: `Found ${result.totalResults} tools for query: "${result.query}"\n\n${lines.join('\n')}`,
          },
        ]
      },
    },
    execute: async (args, exec) => {
      const options: SearchOptions = {
        query: args.query,
        scope: exec.agent,
        limit: args.limit,
        method: args.method,
      }

      const results = await searchService.search(options)

      return {
        results: results.map(r => ({
          tool: r.tool,
          score: r.score,
          rank: r.rank,
          method: r.method,
        })),
        query: args.query,
        totalResults: results.length,
      }
    },
  })

  ctx.tools.register(toolSearch)

  // Listen for tool changes to update index
  ctx.on('tools/change', async () => {
    await searchService.indexTools()
  })

  // Cleanup on dispose via effect lifecycle
  ctx.effect(() => {
    return () => {
      searchService.dispose()
    }
  })
}

/** Re-export types and functions */
export type {
  ToolSearchResult,
  SearchOptions,
  ToolSearchService,
  ToolSearchConfig,
} from './types.ts'
export {
  createSearchIndex,
  buildIndex,
  searchTools,
  updateIndex,
} from './search-core.ts'
export { SearchCache, createSearchCache } from './cache.ts'
