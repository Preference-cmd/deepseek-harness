import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'tool-mermaid'
export const inject = ['tools']

/** Diagram families the tool recognizes, by first keyword. */
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

export function apply(ctx: { tools: { register: (tool: ReturnType<typeof defineTool>) => void } }): void {
  ctx.tools.register(defineTool({
    name: 'mermaid_render',
    description: 'Validate Mermaid diagram source. Returns the source; the web client renders it as a diagram.',
    parameters: {
      diagram: {
        type: 'string',
        description: 'The Mermaid diagram source code.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {
          diagram: { type: 'string' },
          type: { type: 'string' },
        },
      },
      render: (_args, value) => [{
        type: 'text' as const,
        text: typeof value.diagram === 'string' && value.diagram.length > 0
          ? `\`\`\`mermaid\n${value.diagram}\n\`\`\``
          : '',
      }],
    },
    execute(args) {
      const diagram = String(args.diagram)
      if (diagram.trim().length === 0) throw new Error('mermaid_render: diagram must not be empty')
      return Promise.resolve({ diagram, type: detectDiagramType(diagram) })
    },
    presentCall: args => ({
      card: 'generic',
      title: 'Render Mermaid diagram',
      kind: 'other',
      rawInput: String(args.diagram),
    }),
  }))
}
