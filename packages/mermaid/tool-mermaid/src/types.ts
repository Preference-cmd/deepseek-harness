/** Supported Mermaid diagram types */
export type MermaidDiagramType =
  | 'flowchart'
  | 'sequence'
  | 'class'
  | 'state'
  | 'er'
  | 'gantt'
  | 'pie'
  | 'git'
  | 'mindmap'
  | 'timeline'
  | 'block'

/** Configuration for rendering a Mermaid diagram */
export interface MermaidRenderConfig {
  /** The Mermaid diagram source code */
  diagram: string
  /** The diagram type hint */
  type?: MermaidDiagramType
  /** Output format: 'svg' | 'png' | 'pdf' */
  format?: 'svg' | 'png' | 'pdf'
  /** Custom theme */
  theme?: 'default' | 'forest' | 'dark' | 'neutral'
  /** Width of the output image */
  width?: number
  /** Background color */
  backgroundColor?: string
}

/** Result of rendering a Mermaid diagram */
export interface MermaidRenderResult {
  /** The rendered output as a string (SVG) or base64 (PNG/PDF) */
  output: string
  /** The output format used */
  format: 'svg' | 'png' | 'pdf'
  /** Any warnings from the rendering process */
  warnings?: string[]
}

/** Supported diagram type keywords for the tool */
export const DIAGRAM_TYPE_KEYWORDS: Record<string, MermaidDiagramType> = {
  flowchart: 'flowchart',
  flow: 'flowchart',
  diagram: 'flowchart',
  sequence: 'sequence',
  seq: 'sequence',
  class: 'class',
  classdiagram: 'class',
  state: 'state',
  statediagram: 'state',
  er: 'er',
  erdiagram: 'er',
  gantt: 'gantt',
  pie: 'pie',
  piechart: 'pie',
  git: 'git',
  gitgraph: 'git',
  mindmap: 'mindmap',
  timeline: 'timeline',
  block: 'block',
  blockdiagram: 'block',
}
