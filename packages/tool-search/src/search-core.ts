/**
 * Core search logic for tool search functionality.
 * @module @deepseek-ai/dsh-tool-search/search-core
 */

import type {
  ToolSearchResult,
  SearchOptions,
  SearchIndex,
  EmbeddingFunction,
  SimilarityFunction,
  ToolSearchConfig,
} from './types.ts'
import type { ToolDefinition } from '@deepseek-ai/dsh-tools'

/** Default embedding function using simple TF-IDF. */
const defaultEmbedding: EmbeddingFunction = async (text: string) => {
  // Simple TF-IDF-like embedding for demonstration
  // In production, use a real embedding model
  const words = text.toLowerCase().split(/\\s+/)
  const vector = new Array(100).fill(0)

  words.forEach((word, index) => {
    const hash = word.split('').reduce((acc, char) => {
      return (acc << 5) - acc + char.charCodeAt(0)
    }, 0)
    const position = Math.abs(hash) % vector.length
    vector[position] += 1 / (index + 1)
  })

  // Normalize vector
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
  return norm > 0 ? vector.map(val => val / norm) : vector
}

/** Cosine similarity function. */
const cosineSimilarity: SimilarityFunction = (a, b) => {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] ?? 0
    const bVal = b[i] ?? 0
    dotProduct += aVal * bVal
    normA += aVal * aVal
    normB += bVal * bVal
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  return denominator === 0 ? 0 : dotProduct / denominator
}

/** BM25 parameters. */
const BM25_K1 = 1.5
const BM25_B = 0.75

/**
 * BM25 scoring function for keyword search.
 */
function bm25Score(
  query: string[],
  document: string[],
  avgDocLength: number,
  docFrequency: Map<string, number>,
  totalDocs: number,
): number {
  let score = 0

  for (const queryTerm of query) {
    const termFreq = document.filter(word => word === queryTerm).length
    const df = docFrequency.get(queryTerm) || 0
    const idf = Math.log((totalDocs - df + 0.5) / (df + 0.5) + 1)

    const tf =
      (termFreq * (BM25_K1 + 1)) /
      (termFreq +
        BM25_K1 * (1 - BM25_B + BM25_B * (document.length / avgDocLength)))

    score += idf * tf
  }

  return score
}

/**
 * Tokenize text into words for search.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1)
}

/**
 * Create a search index for tools.
 */
export function createSearchIndex(): SearchIndex {
  return {
    embeddings: new Map(),
    keywords: new Map(),
    lastRefresh: 0,
    ready: false,
  }
}

/**
 * Build index from tools.
 */
export async function buildIndex(
  tools: ToolDefinition[],
  embeddingFn: EmbeddingFunction = defaultEmbedding,
): Promise<SearchIndex> {
  const index = createSearchIndex()

  // Build embeddings
  for (const tool of tools) {
    const text = `${tool.name} ${tool.description}`
    const vector = await embeddingFn(text)

    index.embeddings.set(tool.name, {
      name: tool.name,
      vector,
      description: tool.description,
      timestamp: Date.now(),
    })

    // Build keyword index
    const keywords = tokenize(text)
    for (const keyword of keywords) {
      if (!index.keywords.has(keyword)) {
        index.keywords.set(keyword, new Set())
      }
      const toolNames = index.keywords.get(keyword)
      if (toolNames) {
        toolNames.add(tool.name)
      }
    }
  }

  index.lastRefresh = Date.now()
  index.ready = true

  return index
}

/**
 * Semantic search using embeddings.
 */
async function semanticSearch(
  query: string,
  index: SearchIndex,
  tools: Map<string, ToolDefinition>,
  embeddingFn: EmbeddingFunction,
  threshold: number,
  limit: number,
): Promise<ToolSearchResult[]> {
  const queryEmbedding = await embeddingFn(query)
  const results: ToolSearchResult[] = []

  for (const [toolName, embedding] of index.embeddings) {
    const similarity = cosineSimilarity(queryEmbedding, embedding.vector)

    if (similarity >= threshold) {
      const tool = tools.get(toolName)
      if (tool) {
        results.push({
          tool,
          score: similarity,
          rank: 0,
          method: 'semantic',
        })
      }
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result, idx) => ({ ...result, rank: idx + 1 }))
}

/**
 * Keyword search using BM25.
 */
function keywordSearch(
  query: string,
  _index: SearchIndex,
  tools: Map<string, ToolDefinition>,
  limit: number,
): Promise<ToolSearchResult[]> {
  const queryTerms = tokenize(query)
  const toolScores = new Map<string, number>()

  // Calculate BM25 scores
  const docFrequency = new Map<string, number>()
  const documents = new Map<string, string[]>()

  // Build document frequency and document maps
  for (const tool of tools.values()) {
    const text = `${tool.name} ${tool.description}`
    const doc = tokenize(text)
    documents.set(tool.name, doc)

    for (const term of doc) {
      docFrequency.set(term, (docFrequency.get(term) || 0) + 1)
    }
  }

  // Calculate average document length
  const totalDocLength = Array.from(documents.values()).reduce(
    (sum, doc) => sum + doc.length,
    0,
  )
  const avgDocLength = totalDocLength / documents.size

  // Score each tool
  for (const [toolName, doc] of documents) {
    const score = bm25Score(
      queryTerms,
      doc,
      avgDocLength,
      docFrequency,
      tools.size,
    )
    if (score > 0) {
      toolScores.set(toolName, score)
    }
  }

  // Sort and limit results
  const results: ToolSearchResult[] = []
  const sortedScores = Array.from(toolScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)

  for (const [toolName, score] of sortedScores) {
    const tool = tools.get(toolName)
    if (tool) {
      // Normalize score to 0-1 range
      const maxScore = sortedScores[0]?.[1] || 1
      const normalizedScore = score / maxScore

      results.push({
        tool,
        score: normalizedScore,
        rank: results.length + 1,
        method: 'keyword',
      })
    }
  }

  return Promise.resolve(results)
}

/**
 * Hybrid search combining semantic and keyword search.
 */
async function hybridSearch(
  query: string,
  index: SearchIndex,
  tools: Map<string, ToolDefinition>,
  embeddingFn: EmbeddingFunction,
  threshold: number,
  limit: number,
): Promise<ToolSearchResult[]> {
  // Run both searches in parallel
  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(query, index, tools, embeddingFn, threshold, limit * 2),
    keywordSearch(query, index, tools, limit * 2),
  ])

  // Merge results with weighted scoring
  const mergedResults = new Map<string, ToolSearchResult>()

  // Add semantic results with 0.6 weight
  for (const result of semanticResults) {
    mergedResults.set(result.tool.name, {
      ...result,
      score: result.score * 0.6,
      method: 'hybrid',
    })
  }

  // Add keyword results with 0.4 weight
  for (const result of keywordResults) {
    const existing = mergedResults.get(result.tool.name)
    if (existing) {
      // Tool found in both searches - combine scores
      mergedResults.set(result.tool.name, {
        ...existing,
        score: existing.score + result.score * 0.4,
        method: 'hybrid',
      })
    } else {
      // Tool only found in keyword search
      mergedResults.set(result.tool.name, {
        ...result,
        score: result.score * 0.4,
        method: 'hybrid',
      })
    }
  }

  // Sort by combined score and limit
  return Array.from(mergedResults.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result, idx) => ({ ...result, rank: idx + 1 }))
}

/**
 * Main search function.
 */
export async function searchTools(
  options: SearchOptions,
  index: SearchIndex,
  tools: Map<string, ToolDefinition>,
  config: ToolSearchConfig,
  embeddingFn: EmbeddingFunction = defaultEmbedding,
): Promise<ToolSearchResult[]> {
  const {
    query,
    limit = config.maxResults,
    threshold = config.similarityThreshold,
    method = 'auto',
  } = options

  if (!index.ready) {
    throw new Error('Search index not ready')
  }

  // Filter tools by categories if specified
  let filteredTools = tools
  if (options.categories && options.categories.length > 0) {
    filteredTools = new Map(
      Array.from(tools.entries()).filter(([name]) => {
        // Simple category matching based on tool name patterns
        return options.categories!.some(category =>
          name.toLowerCase().includes(category.toLowerCase()),
        )
      }),
    )
  }

  // Choose search method
  let effectiveMethod = method
  if (method === 'auto') {
    // Use hybrid search by default
    effectiveMethod = 'hybrid'
  }

  switch (effectiveMethod) {
    case 'semantic':
      return semanticSearch(
        query,
        index,
        filteredTools,
        embeddingFn,
        threshold,
        limit,
      )
    case 'keyword':
      return keywordSearch(query, index, filteredTools, limit)
    case 'hybrid':
    default:
      return hybridSearch(
        query,
        index,
        filteredTools,
        embeddingFn,
        threshold,
        limit,
      )
  }
}

/**
 * Update index for a single tool.
 */
export async function updateIndex(
  index: SearchIndex,
  tool: ToolDefinition,
  action: 'add' | 'update' | 'remove',
  embeddingFn: EmbeddingFunction = defaultEmbedding,
): Promise<void> {
  if (action === 'remove') {
    index.embeddings.delete(tool.name)

    // Remove from keyword index
    for (const [keyword, toolNames] of index.keywords) {
      toolNames.delete(tool.name)
      if (toolNames.size === 0) {
        index.keywords.delete(keyword)
      }
    }
  } else {
    // Add or update
    const text = `${tool.name} ${tool.description}`
    const vector = await embeddingFn(text)

    index.embeddings.set(tool.name, {
      name: tool.name,
      vector,
      description: tool.description,
      timestamp: Date.now(),
    })

    // Update keyword index
    const keywords = tokenize(text)
    for (const keyword of keywords) {
      if (!index.keywords.has(keyword)) {
        index.keywords.set(keyword, new Set())
      }
      const toolNames = index.keywords.get(keyword)
      if (toolNames) {
        toolNames.add(tool.name)
      }
    }
  }

  index.lastRefresh = Date.now()
}
