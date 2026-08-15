/**
 * Integration test for tool search plugin.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  createSearchIndex,
  buildIndex,
  searchTools,
} from '../src/search-core.ts'
import type { ToolDefinition } from '@deepseek-ai/dsh-tools'
import type { ToolSearchConfig } from '../src/types.ts'

// Mock tool definitions for testing
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
  {
    name: 'glob',
    description: 'Find files by pattern',
    parameters: { type: 'object', properties: {} },
    output: { schema: { type: 'object' }, render: () => [] },
    execute: async () => ({}),
  },
  {
    name: 'grep',
    description: 'Search file contents',
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

describe('Tool Search Integration', () => {
  let index: ReturnType<typeof createSearchIndex>
  const toolsMap = new Map<string, ToolDefinition>()

  beforeAll(async () => {
    // Build index from mock tools
    index = createSearchIndex()
    for (const tool of mockTools) {
      toolsMap.set(tool.name, tool)
    }
    await buildIndex(Array.from(toolsMap.values()))
  })

  it('should find web search tools', async () => {
    const results = await searchTools(
      { query: 'search the web', method: 'hybrid' },
      index,
      toolsMap,
      defaultConfig,
    )

    expect(results.length).toBeGreaterThan(0)
    const webSearchTool = results.find(r => r.tool.name === 'web_search')
    expect(webSearchTool).toBeDefined()
    expect(webSearchTool!.score).toBeGreaterThan(0)
  })

  it('should find file operation tools', async () => {
    const results = await searchTools(
      { query: 'read and write files', method: 'hybrid' },
      index,
      toolsMap,
      defaultConfig,
    )

    expect(results.length).toBeGreaterThan(0)
    const readTool = results.find(r => r.tool.name === 'read')
    const writeTool = results.find(r => r.tool.name === 'write')
    expect(readTool).toBeDefined()
    expect(writeTool).toBeDefined()
  })

  it('should find session tools', async () => {
    const results = await searchTools(
      { query: 'search session history', method: 'hybrid' },
      index,
      toolsMap,
      defaultConfig,
    )

    expect(results.length).toBeGreaterThan(0)
    const sessionTool = results.find(r => r.tool.name === 'session_search')
    expect(sessionTool).toBeDefined()
  })

  it('should find bash tool', async () => {
    const results = await searchTools(
      { query: 'execute command', method: 'hybrid' },
      index,
      toolsMap,
      defaultConfig,
    )

    expect(results.length).toBeGreaterThan(0)
    const bashTool = results.find(r => r.tool.name === 'bash')
    expect(bashTool).toBeDefined()
  })

  it('should respect result limit', async () => {
    const results = await searchTools(
      { query: 'tool', limit: 3, method: 'hybrid' },
      index,
      toolsMap,
      defaultConfig,
    )

    expect(results.length).toBeLessThanOrEqual(3)
  })

  it('should rank results by relevance', async () => {
    const results = await searchTools(
      { query: 'search', method: 'hybrid' },
      index,
      toolsMap,
      defaultConfig,
    )

    // Results should be ordered by score (descending)
    for (let i = 1; i < results.length; i++) {
      expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score)
    }
  })

  it('should work with semantic search', async () => {
    const results = await searchTools(
      { query: 'find information online', method: 'semantic' },
      index,
      toolsMap,
      defaultConfig,
    )

    expect(results.length).toBeGreaterThan(0)
  })

  it('should work with keyword search', async () => {
    const results = await searchTools(
      { query: 'web search', method: 'keyword' },
      index,
      toolsMap,
      defaultConfig,
    )

    expect(results.length).toBeGreaterThan(0)
  })
})
