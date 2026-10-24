/** Markdown implementation labels and primitive chrome. */
export const zh = {
  'viewer.label': 'Markdown',
  'code.copy': '复制',
  'code.copied': '已复制',
  'footnotes': '脚注',
  'mermaid.zoomIn': '放大',
  'mermaid.zoomOut': '缩小',
  'mermaid.reset': '重置缩放',
} satisfies Record<string, string>

/** Markdown namespace keys. */
export type MarkdownPreviewKey = keyof typeof zh

/** English labels, paired with the Chinese key set. */
export const en = {
  'viewer.label': 'Markdown',
  'code.copy': 'Copy',
  'code.copied': 'Copied',
  'footnotes': 'Footnotes',
  'mermaid.zoomIn': 'Zoom in',
  'mermaid.zoomOut': 'Zoom out',
  'mermaid.reset': 'Reset zoom',
} satisfies Record<MarkdownPreviewKey, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Markdown document renderer and its code/footnote controls. */
    documentMarkdown: MarkdownPreviewKey
  }
}

/** Japanese copy, checked against the English keys. */
export const ja = {
  'viewer.label': 'Markdown',
  'code.copy': 'コピー',
  'code.copied': 'コピーしました',
  'footnotes': '脚注',
  'mermaid.zoomIn': '拡大',
  'mermaid.zoomOut': '縮小',
  'mermaid.reset': 'ズームをリセット',
} satisfies Record<keyof typeof en, string>

/** Spanish dictionary, checked against the English keys. */
export const es = {
  'viewer.label': 'Markdown',
  'code.copy': 'Copiar',
  'code.copied': 'Copiado',
  'footnotes': 'Notas a pie de página',
  'mermaid.zoomIn': 'Acercar',
  'mermaid.zoomOut': 'Alejar',
  'mermaid.reset': 'Restablecer zoom',
} satisfies Record<keyof typeof en, string>

/** French dictionary, checked against the English keys. */
export const fr = {
  'viewer.label': 'Markdown',
  'code.copy': 'Copier',
  'code.copied': 'Copié',
  'footnotes': 'Notes de bas de page',
  'mermaid.zoomIn': 'Zoomer',
  'mermaid.zoomOut': 'Dézoomer',
  'mermaid.reset': 'Réinitialiser le zoom',
} satisfies Record<keyof typeof en, string>

/** German dictionary, checked against the English keys. */
export const de = {
  'viewer.label': 'Markdown',
  'code.copy': 'Kopieren',
  'code.copied': 'Kopiert',
  'footnotes': 'Fußnoten',
  'mermaid.zoomIn': 'Vergrößern',
  'mermaid.zoomOut': 'Verkleinern',
  'mermaid.reset': 'Zoom zurücksetzen',
} satisfies Record<keyof typeof en, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'viewer.label': 'Markdown',
  'code.copy': 'Копировать',
  'code.copied': 'Скопировано',
  'footnotes': 'Сноски',
  'mermaid.zoomIn': 'Увеличить',
  'mermaid.zoomOut': 'Уменьшить',
  'mermaid.reset': 'Сбросить масштаб',
} satisfies Record<keyof typeof en, string>

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  'viewer.label': 'Markdown',
  'code.copy': 'Copiar',
  'code.copied': 'Copiado',
  'footnotes': 'Notas de rodapé',
  'mermaid.zoomIn': 'Ampliar',
  'mermaid.zoomOut': 'Reduzir',
  'mermaid.reset': 'Redefinir zoom',
} satisfies Record<keyof typeof en, string>
