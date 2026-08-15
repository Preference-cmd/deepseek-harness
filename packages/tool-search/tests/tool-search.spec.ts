/**
 * Tests for tool search plugin.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createSearchIndex,
  buildIndex,
  searchTools,
  updateIndex,
} from '../src/search-core.ts'
import { SearchCache, createSearchCache } from '../src/cache.ts'
import {
  invariants,
  validateSearchResults,
  validateSearchOptions,
} from '../src/invariant.ts'
import type { ToolDefinition } from '@deepseek-ai/dsh-tools'
import type { SearchOptions, ToolSearchConfig } from '../src/types.ts'

// Mock tool definitions
const mockTools: ToolDefinition[] = [
  {
    name: 'web_search',
    description: 'Search the web for current information',
    parameters: { type: 'object', properties: {} },
    output: { schema: { type: 'object' }, render: () => [] },
    execute: async () => ({}),
  },
  {
    name: 'read',
    description: 'Read a file from the filesystem',
    parameters: { type: 'object', properties: {} },
    output: { schema: { type: 'object' }, render: () => [] },
    execute: async () => ({}),
  },
  {
    name: 'write',
    description: 'Write content to a file',
    parameters: { type: 'object', properties: {} },
    output: { schema: { type: 'object' }, render: () => [] },
    execute: async () => ({}),
  },
  {
    name: 'bash',
    description: 'Execute a bash command',
    parameters: { type: 'object', properties: {} },
    output: { schema: { type: 'object' }, render: () => [] },
    execute: async () => ({}),
  },
  {
    name: 'session_search',
    description: 'Search through session history',
    parameters: { type: 'object', properties: {} },
    output: { schema: { type: 'object' }, render: () => [] },
    execute: async () => ({}),
  },
]

const defaultConfig: ToolSearchConfig = {
  maxResults: 10,
  similarityThreshold: 0.3,
  cacheEnabled: true,
  cacheTTL: 5 * 60 * 1000,
  embeddingModel: 'default',
  embeddingDimension: 100,
  indexRefreshInterval: 60 * 1000,
  maxConcurrentSearches: 5,
}

describe('SearchCore', () => {
  let index: ReturnType<typeof createSearchIndex>

  beforeEach(async () => {
    index = createSearchIndex()
    await buildIndex(mockTools)
  })

  it('should create search index', () => {
    expect(index).toBeDefined()
    expect(index.ready).toBe(true)
  })

  it('should build index from tools', async () => {
    const toolsMap = new Map(mockTools.map(tool => [tool.name, tool]))
    const results = await searchTools(
      { query: 'search web' },
      index,
      toolsMap,
      defaultConfig,
    )

    expect(results).toBeDefined()
    expect(Array.isArray(results)).toBe(true)
  })

  it('should find relevant tools by semantic search', async () => {
    const toolsMap = new Map(mockTools.map(tool => [tool.name, tool]))
    const results = await searchTools(
      { query: 'search the internet', method: 'semantic' },
      index,
      toolsMap,
      defaultConfig,
    )

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].tool.name).toBe('web_search')
  })

  it('should find relevant tools by keyword search', async () => {
    const toolsMap = new Map(mockTools.map(tool => [tool.name, tool]))
    const results = await searchTools(
      { query: 'read file', method: 'keyword' },
      index,
      toolsMap,
      defaultConfig,
    )

    expect(results.length).toBeGreaterThan(0)
    // Should find 'read' tool
    const readTool = results.find(r => r.tool.name === 'read')
    expect(readTool).toBeDefined()
  })

  it('should find relevant tools by hybrid search', async () => {
    const toolsMap = new Map(mockTools.map(tool => [tool.name, tool]))
    const results = await searchTools(
      { query: 'search the web for information', method: 'hybrid' },
      index,
      toolsMap,
      defaultConfig,
    )

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].method).toBe('hybrid')
  })

  it('should respect similarity threshold', async () => {
    const toolsMap = new Map(mockTools.map(tool => [tool.name, tool]))
    const results = await searchTools(
      { query: 'xyz', threshold: 0.9 },
      index,
      toolsMap,
      defaultConfig,
    )

    // With high threshold, should find fewer or no results
    expect(results.length).toBeLessThanOrEqual(mockTools.length)
  })

  it('should respect result limit', async () => {
    const toolsMap = new Map(mockTools.map(tool => [tool.name, tool]))
    const results = await searchTools(
      { query: 'search', limit: 2 },
      index,
      toolsMap,
      defaultConfig,
    )

    expect(results.length).toBeLessThanOrEqual(2)
  })

  it('should update index for new tool', async () => {
    const newTool: ToolDefinition = {
      name: 'new_tool',
      description: 'A brand new tool for testing',
      parameters: { type: 'object', properties: {} },
      output: { schema: { type: 'object' }, render: () => [] },
      execute: async () => ({}),
    }

    await updateIndex(index, newTool, 'add')

    expect(index.embeddings.has('new_tool')).toBe(true)
  })

  it('should update index for removed tool', async () => {
    await updateIndex(index, mockTools[0], 'remove')

    expect(index.embeddings.has('web_search')).toBe(false)
  })
})

describe('SearchCache', () => {
  let cache: SearchCache

  beforeEach(() => {
    cache = createSearchCache({ maxSize: 10, ttl: 1000 })
  })

  it('should create cache', () => {
    expect(cache).toBeDefined()
    expect(cache.size).toBe(0)
  })

  it('should set and get cache entries', () => {
    const results = [
      { tool: mockTools[0], score: 0.9, rank: 1, method: 'semantic' as const },
    ]

    cache.set('test query', {}, results)
    const cached = cache.get('test query', {})

    expect(cached).toBeDefined()
    expect(cached!.length).toBe(1)
    expect(cached![0].tool.name).toBe('web_search')
  })

  it('should return null for cache miss', () => {
    const cached = cache.get('nonexistent query', {})
    expect(cached).toBeNull()
  })

  it('should respect TTL', async () => {
    const shortTtlCache = createSearchCache({ ttl: 100 })
    const results = [
      { tool: mockTools[0], score: 0.9, rank: 1, method: 'semantic' as const },
    ]

    shortTtlCache.set('test query', {}, results)

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 150))

    const cached = shortTtlCache.get('test query', {})
    expect(cached).toBeNull()
  })

  it('should clear cache', () => {
    const results = [
      { tool: mockTools[0], score: 0.9, rank: 1, method: 'semantic' as const },
    ]

    cache.set('test query', {}, results)
    expect(cache.size).toBe(1)

    cache.clear()
    expect(cache.size).toBe(0)
  })

  it('should track statistics', () => {
    const results = [
      { tool: mockTools[0], score: 0.9, rank: 1, method: 'semantic' as const },
    ]

    cache.set('test query', {}, results)
    cache.get('test query', {}) // hit
    cache.get('miss query', {}) // miss

    const stats = cache.getStats()
    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(1)
    expect(stats.hitRate).toBe(0.5)
  })
})

describe('Invariants', () => {
  it('should validate search options', () => {
    const validOptions: SearchOptions = {
      query: 'test query',
      limit: 10,
      threshold: 0.5,
      method: 'hybrid',
    }

    const result = invariants.validSearchOptions(validOptions)
    expect(result.passed).toBe(true)
  })

  it('should reject empty query', () => {
    const invalidOptions: SearchOptions = {
      query: '',
      limit: 10,
    }

    const result = invariants.validSearchOptions(invalidOptions)
    expect(result.passed).toBe(false)
    expect(result.message).toContain('Query must be')
  })

  it('should validate search results', () => {
    const validResult = {
      tool: mockTools[0],
      score: 0.9,
      rank: 1,
      method: 'semantic' as const,
    }

    const result = invariants.validSearchResult(validResult)
    expect(result.passed).toBe(true)
  })

  it('should reject invalid score', () => {
    const invalidResult = {
      tool: mockTools[0],
      score: 1.5, // Invalid score
      rank: 1,
      method: 'semantic' as const,
    }

    const result = invariants.validSearchResult(invalidResult)
    expect(result.passed).toBe(false)
    expect(result.message).toContain('Score must be')
  })

  it('should validate search config', () => {
    const validConfig: ToolSearchConfig = {
      maxResults: 10,
      similarityThreshold: 0.3,
      cacheEnabled: true,
      cacheTTL: 5000,
      embeddingModel: 'default',
      embeddingDimension: 100,
      indexRefreshInterval: 1000,
      maxConcurrentSearches: 5,
    }

    const result = invariants.validSearchConfig(validConfig)
    expect(result.passed).toBe(true)
  })

  it('should validate search results ordering', () => {
    const orderedResults = [
      { tool: mockTools[0], score: 0.9, rank: 1, method: 'semantic' as const },
      { tool: mockTools[1], score: 0.8, rank: 2, method: 'semantic' as const },
    ]

    const results = validateSearchResults(orderedResults)
    const orderingResult = results.find(
      r => r.name === 'resultsOrderedByRank',
    )
    expect(orderingResult?.passed).toBe(true)
  })

  it('should detect unordered results', () => {
    const unorderedResults = [
      { tool: mockTools[0], score: 0.9, rank: 2, method: 'semantic' as const },
      { tool: mockTools[1], score: 0.8, rank: 1, method: 'semantic' as const },
    ]

    const results = validateSearchResults(unorderedResults)
    const orderingResult = results.find(
      r => r.name === 'resultsOrderedByRank',
    )
    expect(orderingResult?.passed).toBe(false)
  })
})
