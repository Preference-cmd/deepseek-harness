import type { Context } from '@deepseek-ai/cordis'
import type { MermaidRenderConfig, MermaidRenderResult } from './types.ts'

export const name = 'tool-mermaid'

function detectDiagramType(source: string): string {
  const trimmed = source.trim().toLowerCase()
  if (trimmed.startsWith('graph ') || trimmed.startsWith('flowchart ')) return 'flowchart'
  if (trimmed.startsWith('sequenceDiagram')) return 'sequence'
  if (trimmed.startsWith('classDiagram')) return 'class'
  if (trimmed.startsWith('stateDiagram')) return 'state'
  if (trimmed.startsWith('erDiagram')) return 'er'
  if (trimmed.startsWith('gantt')) return 'gantt'
  if (trimmed.startsWith('pie')) return 'pie'
  if (trimmed.startsWith('gitgraph')) return 'git'
  if (trimmed.startsWith('mindmap')) return 'mindmap'
  if (trimmed.startsWith('timeline')) return 'timeline'
  if (trimmed.startsWith('block')) return 'block'
  return 'flowchart'
}

export function apply(ctx: Context): void {
  ctx.effect(() => {
    ctx.service('tool-mermaid', {
      render: async (cfg: MermaidRenderConfig): Promise<MermaidRenderResult> => {
        const detectedType = cfg.type ?? detectDiagramType(cfg.diagram)
        const svg = generatePlaceholderSvg(cfg.diagram, detectedType)
        return { output: svg, format: 'svg', warnings: [] }
      },
    })
    return () => {}
  })
}

function generatePlaceholderSvg(diagram: string, type: string): string {
  const lines = diagram.split('\n').slice(0, 5)
  const escaped = lines
    .map(l => l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    .join('\n  ')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#f9fafb" rx="8"/>
    <text x="20" y="30" font-family="monospace" font-size="12" fill="#6b7280">[${type} diagram]</text>
    <foreignObject x="20" y="45" width="560" height="340">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:monospace;font-size:11px;color:#374151;white-space:pre-wrap">
        ${escaped}
      </div>
    </foreignObject>
  </svg>`
}
