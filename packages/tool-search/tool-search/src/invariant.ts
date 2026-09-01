// oxlint-disable
/**
 * Runtime invariants for tool search plugin.
 * @module @deepseek-ai/dsh-tool-search/invariant
 */

import type {
  ToolSearchResult,
  SearchOptions,
  ToolSearchConfig,
} from './types.ts'

/** Invariant check result. */
export interface InvariantResult {
  /** Whether invariant passed. */
  readonly passed: boolean
  /** Error message if failed. */
  readonly message?: string
  /** Invariant name. */
  readonly name: string
}

/** Tool search invariants. */
export const invariants = {
  /**
   * Check if search options are valid.
   */
  validSearchOptions(options: SearchOptions): InvariantResult {
    if (!options.query || typeof options.query !== 'string') {
      return {
        passed: false,
        message: 'Query must be a non-empty string',
        name: 'validSearchOptions',
      }
    }

    if (options.query.trim().length === 0) {
      return {
        passed: false,
        message: 'Query must not be empty or whitespace only',
        name: 'validSearchOptions',
      }
    }

    if (
      options.limit !== undefined &&
      (options.limit < 1 || options.limit > 100)
    ) {
      return {
        passed: false,
        message: 'Limit must be between 1 and 100',
        name: 'validSearchOptions',
      }
    }

    if (
      options.threshold !== undefined &&
      (options.threshold < 0 || options.threshold > 1)
    ) {
      return {
        passed: false,
        message: 'Threshold must be between 0 and 1',
        name: 'validSearchOptions',
      }
    }

    if (
      options.method &&
      !['semantic', 'keyword', 'hybrid', 'auto'].includes(options.method)
    ) {
      return {
        passed: false,
        message: 'Method must be semantic, keyword, hybrid, or auto',
        name: 'validSearchOptions',
      }
    }

    return { passed: true, name: 'validSearchOptions' }
  },

  /**
   * Check if search result is valid.
   */
  validSearchResult(result: ToolSearchResult): InvariantResult {
    if (!result.tool || !result.tool.name) {
      return {
        passed: false,
        message: 'Result must have a valid tool',
        name: 'validSearchResult',
      }
    }

    if (
      typeof result.score !== 'number' ||
      result.score < 0 ||
      result.score > 1
    ) {
      return {
        passed: false,
        message: 'Score must be a number between 0 and 1',
        name: 'validSearchResult',
      }
    }

    if (typeof result.rank !== 'number' || result.rank < 1) {
      return {
        passed: false,
        message: 'Rank must be a positive integer',
        name: 'validSearchResult',
      }
    }

    if (!['semantic', 'keyword', 'hybrid'].includes(result.method)) {
      return {
        passed: false,
        message: 'Method must be semantic, keyword, or hybrid',
        name: 'validSearchResult',
      }
    }

    return { passed: true, name: 'validSearchResult' }
  },

  /**
   * Check if search config is valid.
   */
  validSearchConfig(config: ToolSearchConfig): InvariantResult {
    if (config.maxResults < 1 || config.maxResults > 100) {
      return {
        passed: false,
        message: 'maxResults must be between 1 and 100',
        name: 'validSearchConfig',
      }
    }

    if (config.similarityThreshold < 0 || config.similarityThreshold > 1) {
      return {
        passed: false,
        message: 'similarityThreshold must be between 0 and 1',
        name: 'validSearchConfig',
      }
    }

    if (config.cacheTTL < 1000) {
      return {
        passed: false,
        message: 'cacheTTL must be at least 1000ms',
        name: 'validSearchConfig',
      }
    }

    if (config.indexRefreshInterval < 1000) {
      return {
        passed: false,
        message: 'indexRefreshInterval must be at least 1000ms',
        name: 'validSearchConfig',
      }
    }

    if (config.maxConcurrentSearches < 1) {
      return {
        passed: false,
        message: 'maxConcurrentSearches must be at least 1',
        name: 'validSearchConfig',
      }
    }

    return { passed: true, name: 'validSearchConfig' }
  },

  /**
   * Check if search results are ordered by rank.
   */
  resultsOrderedByRank(results: ToolSearchResult[]): InvariantResult {
    for (let i = 1; i < results.length; i++) {
      const current = results[i]
      const previous = results[i - 1]
      if (current && previous && current.rank <= previous.rank) {
        return {
          passed: false,
          message: `Results not ordered by rank at position ${i}`,
          name: 'resultsOrderedByRank',
        }
      }
    }

    return { passed: true, name: 'resultsOrderedByRank' }
  },

  /**
   * Check if search results have unique ranks.
   */
  resultsHaveUniqueRanks(results: ToolSearchResult[]): InvariantResult {
    const ranks = new Set(results.map(r => r.rank))
    if (ranks.size !== results.length) {
      return {
        passed: false,
        message: 'Results have duplicate ranks',
        name: 'resultsHaveUniqueRanks',
      }
    }

    return { passed: true, name: 'resultsHaveUniqueRanks' }
  },

  /**
   * Check if search results have valid scores.
   */
  resultsHaveValidScores(results: ToolSearchResult[]): InvariantResult {
    for (const result of results) {
      if (result.score < 0 || result.score > 1) {
        return {
          passed: false,
          message: `Invalid score ${result.score} for tool ${result.tool.name}`,
          name: 'resultsHaveValidScores',
        }
      }
    }

    return { passed: true, name: 'resultsHaveValidScores' }
  },
}

/**
 * Run all invariants on search results.
 */
export function validateSearchResults(
  results: ToolSearchResult[],
): InvariantResult[] {
  const resultsList = [...results]
  return [
    invariants.resultsOrderedByRank(resultsList),
    invariants.resultsHaveUniqueRanks(resultsList),
    invariants.resultsHaveValidScores(resultsList),
  ]
}

/**
 * Run all invariants on search options.
 */
export function validateSearchOptions(options: SearchOptions): InvariantResult {
  return invariants.validSearchOptions(options)
}

/**
 * Run all invariants on search config.
 */
export function validateSearchConfig(
  config: ToolSearchConfig,
): InvariantResult {
  return invariants.validSearchConfig(config)
}
