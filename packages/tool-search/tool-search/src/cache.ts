/**
 * Search cache implementation for tool search.
 * @module @deepseek-ai/dsh-tool-search/cache
 */

import type { ToolSearchResult, CacheEntry } from './types.ts'

/** Cache configuration. */
export interface CacheConfig {
  /** Maximum number of cache entries. */
  maxSize: number
  /** Cache TTL in milliseconds. */
  ttl: number
  /** Whether to enable cache statistics. */
  enableStats: boolean
}

/** Cache statistics. */
export interface CacheStats {
  /** Total cache hits. */
  hits: number
  /** Total cache misses. */
  misses: number
  /** Cache size. */
  size: number
  /** Hit rate (hits / (hits + misses)). */
  hitRate: number
}

/**
 * LRU Cache for search results.
 */
export class SearchCache {
  private cache = new Map<string, CacheEntry>()
  private config: CacheConfig
  private stats = { hits: 0, misses: 0 }

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      ttl: config.ttl || 5 * 60 * 1000, // 5 minutes default
      enableStats: config.enableStats ?? true,
    }
  }

  /**
   * Generate cache key from search options.
   */
  private generateKey(query: string, options: Record<string, unknown>): string {
    const optionsStr = JSON.stringify(options, Object.keys(options).sort())
    return `${query}:${optionsStr}`
  }

  /**
   * Get cached results.
   */
  get(
    query: string,
    options: Record<string, unknown>,
  ): ToolSearchResult[] | null {
    const key = this.generateKey(query, options)
    const entry = this.cache.get(key)

    if (!entry) {
      if (this.config.enableStats) {
        this.stats.misses++
      }
      return null
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key)
      if (this.config.enableStats) {
        this.stats.misses++
      }
      return null
    }

    if (this.config.enableStats) {
      this.stats.hits++
    }

    return [...entry.results]
  }

  /**
   * Set cached results.
   */
  set(
    query: string,
    options: Record<string, unknown>,
    results: ToolSearchResult[],
  ): void {
    const key = this.generateKey(query, options)

    // Implement LRU eviction
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      results: [...results],
      timestamp: Date.now(),
      key,
    })
  }

  /**
   * Clear cache.
   */
  clear(): void {
    this.cache.clear()
    if (this.config.enableStats) {
      this.stats.hits = 0
      this.stats.misses = 0
    }
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    }
  }

  /**
   * Get cache size.
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * Check if cache has key.
   */
  has(query: string, options: Record<string, unknown>): boolean {
    const key = this.generateKey(query, options)
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete specific cache entry.
   */
  delete(query: string, options: Record<string, unknown>): boolean {
    const key = this.generateKey(query, options)
    return this.cache.delete(key)
  }

  /**
   * Get all cache keys.
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Clean expired entries.
   */
  cleanExpired(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }
}

/**
 * Create a cache with default configuration.
 */
export function createSearchCache(config?: Partial<CacheConfig>): SearchCache {
  return new SearchCache(config)
}

/**
 * Cache decorator for search functions.
 */
export function withCache<
  T extends (...args: unknown[]) => Promise<ToolSearchResult[]>,
>(fn: T, cache: SearchCache): T {
  return (async (...args: unknown[]) => {
    const [query, options] = args as [string, Record<string, unknown>]

    // Try cache first
    const cached = cache.get(query, options)
    if (cached) {
      return cached
    }

    // Execute function
    const results = await fn(...args)

    // Cache results
    cache.set(query, options, results)

    return results
  }) as T
}
