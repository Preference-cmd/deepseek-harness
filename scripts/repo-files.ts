/** Shared repository file discovery and line-oriented reference scanning. */

import { globSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'

/** One authored path plus its canonical target for symlink deduplication. */
export interface RepoFile {
  /** Absolute path matched by the caller's glob. */
  abs: string
  /** Absolute canonical path used only for deduplication. */
  real: string
}

/** A rejected line-oriented repository reference. */
export interface ReferenceViolation {
  /** Repo-relative file containing the reference. */
  file: string
  /** 1-based line containing the reference. */
  line: number
  /** Normalized reference text. */
  ref: string
}

/** Whether a repository path is frozen Agent Note history, not evolving source prose. */
export function isArchivedAgentNotePath(path: string): boolean {
  return path.replaceAll('\\', '/').startsWith('.agents/notes/archived/')
}

/**
 * Expand repository-relative globs and deduplicate symlinked files.
 * @param root - absolute repository root.
 * @param patterns - repository-relative glob patterns, processed in order.
 * @param isExcluded - optional predicate over each matched relative path.
 * @returns matched files in stable first-seen order.
 */
/**
 * Glob one pattern, working around the Node 24 native glob crash with ENOTDIR
 * when a symlink occupies a path segment the pattern wants to descend into
 * (a symlinked system-prompt.expected.md file beside a star-star pattern). The
 * fallback expands `**` one level at a time over real directories only, so a
 * symlink to a file is never descended into; deeper symlink-to-directory
 * cycles are cut by the visited set.
 * @param root - absolute repository root used as the glob cwd.
 * @param pattern - repository-relative glob pattern containing a star-star segment.
 * @param visited - canonical real-directory paths already expanded.
 * @returns matched repository-relative paths.
 */
function safeGlobStarStar(root: string, pattern: string, visited: Set<string>): string[] {
  const star = pattern.indexOf('**')
  if (star === -1) return globSync(pattern, { cwd: root })
  const head = pattern.slice(0, star)
  const tail = pattern.slice(star + 2).replaceAll('/', '')
  const out: string[] = []
  for (const sub of safeGlob(root, head + tail, visited)) out.push(sub)
  const level = head === '' ? '*' : head + '*'
  let entries: string[]
  try {
    entries = globSync(level, { cwd: root })
  } catch {
    return out
  }
  for (const entry of entries) {
    const abs = resolve(root, entry)
    let real: string
    try {
      if (!statSync(abs).isDirectory()) continue
      real = realpathSync(abs)
    } catch {
      continue
    }
    if (visited.has(real)) continue
    visited.add(real)
    for (const sub of safeGlob(root, entry + '/**/' + tail, visited)) out.push(sub)
  }
  return out
}

/**
 * Glob one pattern, falling back to symlink-safe `**` expansion on ENOTDIR.
 * @param root - absolute repository root used as the glob cwd.
 * @param pattern - repository-relative glob pattern.
 * @param visited - canonical real-directory paths already expanded.
 * @returns matched repository-relative paths.
 */
function safeGlob(root: string, pattern: string, visited: Set<string>): string[] {
  try {
    return globSync(pattern, { cwd: root })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOTDIR') throw error
    return safeGlobStarStar(root, pattern, visited)
  }
}
export function uniqueRepoFiles(
  root: string,
  patterns: readonly string[],
  isExcluded: (relativePath: string) => boolean = () => false,
): RepoFile[] {
  const seen = new Set<string>()
  const files: RepoFile[] = []
  const visited = new Set<string>([realpathSync(root)])
  for (const pattern of patterns) {
    for (const match of safeGlob(root, pattern, visited)) {
      const repoPath = match.split(sep).join('/')
      if (isExcluded(repoPath)) continue
      const abs = resolve(root, repoPath)
      const real = realpathSync(abs)
      if (seen.has(real)) continue
      seen.add(real)
      files.push({ abs, real })
    }
  }
  return files
}

/**
 * Scan regex matches line by line and return the normalized matches rejected by
 * a caller predicate.
 * @param root - absolute repository root used for violation paths.
 * @param absPath - absolute text-file path to scan.
 * @param pattern - global regex matched independently against each line.
 * @param normalize - maps raw regex text to the reference the gate evaluates.
 * @param isViolation - returns true when the normalized reference is invalid.
 * @returns every rejected reference in source order.
 */
export function findReferenceViolations(
  root: string,
  absPath: string,
  pattern: RegExp,
  normalize: (raw: string) => string,
  isViolation: (ref: string) => boolean,
): ReferenceViolation[] {
  const file = relative(root, absPath).split(sep).join('/')
  const out: ReferenceViolation[] = []
  const lines = readFileSync(absPath, 'utf8').split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === undefined) continue
    for (const match of line.matchAll(pattern)) {
      const ref = normalize(match[0])
      if (isViolation(ref)) out.push({ file, line: i + 1, ref })
    }
  }
  return out
}
