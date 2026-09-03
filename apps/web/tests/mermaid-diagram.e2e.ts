// Web e2e scenario: a settled ```mermaid fence renders as a real diagram.
// Zero model calls: the scenario seeds a recorded session and exercises the
// client's markdown renderer, the lazy mermaid engine load, and the SVG output.
import { fileURLToPath } from 'node:url'
import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it, onTestFailed } from 'vitest'
import { createMessage, createUserMessage } from '@deepseek-ai/dsh-llm'
import { SESSION_FORMAT_VERSION, Session, SessionId } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-session-title'
import {
  assertFixtureInventory,
  captureStableAria,
  compareOrRefreshGolden,
  launchWebScaffold,
  seedSession,
  watchConsole,
  webSnapshotMode,
  type WebScaffold,
} from './scaffold.ts'
import { newEnglishPage, saveFailureShot } from './support.ts'

const SNAPSHOT_DIR = fileURLToPath(new URL('./expected/mermaid-diagram', import.meta.url))
const UI_EXPECTED = fileURLToPath(new URL('./expected/mermaid-diagram/ui.expected.md', import.meta.url))
const MODE = webSnapshotMode()
const SEED_ID = 'mermaid-diagram-web-e2e'
const DONE = 'MERMAID_DIAGRAM_DONE'

/** Build a settled assistant reply carrying one flowchart and one sequence diagram. */
function mermaidFixture(): string {
  const session = Session.create(SessionId('mermaid-diagram-source'))
  const eventTimeOrigin = new Date().setHours(12, 0, 0, 0)
  session.append('turn/start', {
    turn: 1,
  })
  const user = session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: 'Draw the login flow.' }],
    source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  session.append('session/title', {
    title: 'Mermaid diagram',
    messageSeqs: [user.seq],
    source: { kind: 'fallback' },
  })
  session.append('step/start', { turn: 1, step: 1 })
  session.append('assistant/message', {
    turn: 1,
    step: 1,
    message: createMessage({
      role: 'assistant',
      content: [{
        type: 'text',
        text: [
          '## Login flow',
          '',
          '```mermaid',
          'flowchart TD',
          '    A[User] --> B{Logged in?}',
          '    B -->|Yes| C[Dashboard]',
          '    B -->|No| D[Login form]',
          '```',
          '',
          '```mermaid',
          'sequenceDiagram',
          '    A->>B: login',
          '    B-->>A: token',
          '```',
          '',
          DONE,
        ].join('\n'),
      }],
      source: { kind: 'model', provider: 'fixture', model: 'fixture' },
    }),
  }, { surfaceOp: 'append' })
  session.append('step/end', { turn: 1, step: 1 })
  session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })

  return [
    JSON.stringify({
      type: 'session',
      version: SESSION_FORMAT_VERSION,
      id: '{{sessionId}}',
      createdAt: 0,
      cwd: '{{cwd}}',
    }),
    ...session.snapshotEvents().map(event => JSON.stringify({
      ...event,
      time: eventTimeOrigin + event.seq * 1_000,
    })),
    '',
  ].join('\n')
}

describe('web e2e: settled mermaid diagram rendering', () => {
  let scaffold: WebScaffold
  let browser: Browser
  let page: Page
  let tripwire: ReturnType<typeof watchConsole>

  beforeAll(async () => {
    scaffold = await launchWebScaffold({})
    await seedSession(scaffold, mermaidFixture(), SEED_ID)
    browser = await chromium.launch()
    page = await newEnglishPage(browser)
    tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
  }, 120_000)

  afterAll(async () => {
    await browser?.close()
    await scaffold?.close()
  })

  it.skipIf(MODE === 'record')('renders both fences as SVG diagrams', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-mermaid-diagram'))
    const groupRow = page.locator('[role="treeitem"]').first()
    await groupRow.waitFor({ timeout: 15_000 })
    await groupRow.click()
    const sessionRow = page.locator('[role="treeitem"]').nth(1)
    await sessionRow.waitFor({ timeout: 10_000 })
    await sessionRow.click()
    await expect.poll(() => page.getByText(DONE, { exact: true }).count(), { timeout: 15_000 }).toBe(1)

    // Both fences render through the lazy mermaid engine into inline SVG:
    // one diagram per fence, each carrying rendered node labels.
    await expect.poll(() => page.locator('svg[id^="dsh-mermaid-"]').count(), { timeout: 30_000 }).toBe(2)
    expect(await page.getByText('Dashboard', { exact: true }).count()).toBeGreaterThan(0)
    expect(await page.getByText('token', { exact: true }).count()).toBeGreaterThan(0)

    const snapshot = (await captureStableAria(page, '[class*="centerCol"]', scaffold.workspaceCwd))
      .split(SEED_ID).join('{{seededId}}')
    await compareOrRefreshGolden(UI_EXPECTED, snapshot, MODE)
    expect(tripwire.pageErrors).toEqual([])
    expect(tripwire.warnings).toEqual([])
    await assertFixtureInventory(SNAPSHOT_DIR, ['ui.expected.md'])
  }, 90_000)
})
