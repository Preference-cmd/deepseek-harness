/** Diagram families the tool recognizes, by first keyword. */
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

/** The validated source the `mermaid_render` tool returns. */
export interface MermaidRenderResult {
  /** The Mermaid diagram source code, as given. */
  diagram: string
  /** The diagram family detected from the first keyword. */
  type: string
}
