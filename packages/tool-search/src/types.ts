/**
 * Type definitions for tool search functionality.
 * @module @deepseek-ai/dsh-tool-search
 */

import type { ToolDefinition } from '@deepseek-ai/dsh-tools'

/** Tool search result with relevance score. */
export interface ToolSearchResult {
  /** The tool definition. */
  readonly tool: ToolDefinition
  /** Relevance score (0-1, higher is better). */
  readonly score: number
  /** Rank in results (1-based). */
  readonly rank: number
  /** Search method used to find this tool. */
  readonly method: 'semantic' | 'keyword' | 'hybrid'
}

/** Tool search options. */
export interface SearchOptions {
  /** Search query string. */
  readonly query: string
  /** Viewing scope (agent). */
  readonly scope?: object | undefined
  /** Maximum number of results. */
  readonly limit?: number | undefined
  /** Minimum similarity threshold (0-1). */
  readonly threshold?: number | undefined
  /** Filter by tool categories. */
  readonly categories?: readonly string[] | undefined
  /** Search method preference. */
  readonly method?: 'semantic' | 'keyword' | 'hybrid' | 'auto' | undefined
}

/** Tool search service interface. */
export interface ToolSearchService {
  /**
   * Search for tools matching the query.
   * @param options - search options
   * @returns sorted search results
   */
  search(options: SearchOptions): Promise<readonly ToolSearchResult[]>

  /**
   * Rebuild the search index from current tools.
   */
  indexTools(): Promise<void>

  /**
   * Update index for a single tool.
   * @param tool - tool definition to update
   * @param action - 'add' | 'update' | 'remove'
   */
  updateTool(
    tool: ToolDefinition,
    action: 'add' | 'update' | 'remove',
  ): Promise<void>
}

/** Embedding vector for a tool. */
export interface ToolEmbedding {
  /** Tool name. */
  readonly name: string
  /** Embedding vector. */
  readonly vector: readonly number[]
  /** Tool description used for embedding. */
  readonly description: string
  /** Timestamp of embedding creation. */
  readonly timestamp: number
}

/** Search cache entry. */
export interface CacheEntry {
  /** Cached search results. */
  readonly results: readonly ToolSearchResult[]
  /** Cache creation timestamp. */
  readonly timestamp: number
  /** Cache key (query + options hash). */
  readonly key: string
}

/** Tool search configuration. */
export interface ToolSearchConfig {
  /** Maximum number of results to return. */
  readonly maxResults: number
  /** Minimum similarity threshold (0-1). */
  readonly similarityThreshold: number
  /** Whether to enable search caching. */
  readonly cacheEnabled: boolean
  /** Cache TTL in milliseconds. */
  readonly cacheTTL: number
  /** Embedding model to use. */
  readonly embeddingModel: string
  /** Embedding dimension. */
  readonly embeddingDimension: number
  /** Index refresh interval in milliseconds. */
  readonly indexRefreshInterval: number
  /** Maximum concurrent searches. */
  readonly maxConcurrentSearches: number
}

/** Tool category mapping. */
export interface ToolCategory {
  /** Category name. */
  readonly name: string
  /** Pattern to match tool names. */
  readonly pattern: RegExp
  /** Category description. */
  readonly description: string
}

/** Search index for tools. */
export interface SearchIndex {
  /** Tool embeddings by name. */
  readonly embeddings: Map<string, ToolEmbedding>
  /** Tool keywords index. */
  readonly keywords: Map<string, Set<string>>
  /** Last index refresh timestamp. */
  lastRefresh: number
  /** Whether index is ready. */
  ready: boolean
}

/** Embedding function type. */
export type EmbeddingFunction = (text: string) => Promise<readonly number[]>

/** Similarity function type. */
export type SimilarityFunction = (
  a: readonly number[],
  b: readonly number[],
) => number
