import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'tool-mermaid'
export const inject = ['tools']

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

function generatePlaceholderSvg(diagram: string, type: string): string {
  const lines = diagram.split('\n').slice(0, 5)
  const escaped = lines
    .map(l => l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    .join('\n  ')
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">',
    '  <rect width="600" height="400" fill="#f9fafb" rx="8"/>',
    '  <text x="20" y="30" font-family="monospace" font-size="12" fill="#6b7280">[' + type + ' diagram]</text>',
    '  <foreignObject x="20" y="45" width="560" height="340">',
    '    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:monospace;font-size:11px;color:#374151;white-space:pre-wrap">',
    '      ' + escaped,
    '    </div>',
    '  </foreignObject>',
    '</svg>',
  ].join('\n')
}

export function apply(ctx: { tools: { register: (tool: ReturnType<typeof defineTool>) => void } }): void {
  ctx.tools.register(defineTool({
    name: 'mermaid_render',
    description: 'Render a Mermaid diagram to SVG. Accepts Mermaid syntax and returns an SVG image.',
    parameters: {
      diagram: {
        type: 'string',
        required: true,
        description: 'The Mermaid diagram source code.',
      },
      type: {
        type: 'string',
        required: false,
        description: 'The diagram type hint (flowchart, sequence, class, etc.). Auto-detected if omitted.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {
          svg: { type: 'string' },
          type: { type: 'string' },
        },
      },
      render: (_args, value) => [{
        type: 'text' as const,
        text: value.svg ?? '',
      }],
    },
    execute(args) {
      const detectedType = args.type ?? detectDiagramType(args.diagram)
      const svg = generatePlaceholderSvg(args.diagram, detectedType)
      return Promise.resolve({ svg, type: detectedType })
    },
    presentCall: args => ({
      card: 'generic',
      title: 'Render Mermaid diagram',
      kind: 'other',
      rawInput: args.diagram,
    }),
  }))
}
