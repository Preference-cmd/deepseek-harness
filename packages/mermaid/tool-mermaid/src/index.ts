import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'tool-mermaid'
export const inject = ['tools']

export function apply(ctx: { tools: { register: (tool: ReturnType<typeof defineTool>) => void } }): void {
  ctx.tools.register(defineTool({
    name: 'mermaid_render',
    description: 'Return Mermaid diagram source unchanged for the web client to render. Rejects an empty diagram.',
    parameters: {
      diagram: {
        type: 'string',
        required: true,
        description: 'The Mermaid diagram source code.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {
          diagram: { type: 'string' },
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
      const diagram = args.diagram
      if (diagram.trim().length === 0) throw new Error('mermaid_render: diagram must not be empty')
      return Promise.resolve({ diagram })
    },
    presentCall: args => ({
      card: 'generic',
      title: 'Render Mermaid diagram',
      kind: 'other',
      rawInput: args.diagram,
    }),
  }))
}
