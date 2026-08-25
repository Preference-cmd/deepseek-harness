# @deepseek-ai/dsh-tool-mermaid

English | [中文](README.zh.md)

Mermaid diagram generation tool for the DeepSeek Harness.

## Overview

This package provides a Cordis plugin that registers a mermaid diagram rendering tool.
It accepts Mermaid diagram source code and renders it to SVG, PNG, or PDF format.

## Supported Diagram Types

- Flowchart (graph, flowchart)
- Sequence Diagram (sequenceDiagram)
- Class Diagram (classDiagram)
- State Diagram (stateDiagram)
- Entity Relationship Diagram (erDiagram)
- Gantt Chart (gantt)
- Pie Chart (pie)
- Git Graph (gitgraph)
- Mind Map (mindmap)
- Timeline (timeline)
- Block Diagram (block)

## Model Experience

This tool is model-facing. The model can use it to generate diagrams from Mermaid syntax.

## Known Limitations and Deferred Work

- Full Mermaid rendering requires @mermaid-js/mermaid-cli at runtime
- Without the CLI dependency, a placeholder SVG is returned
- PDF output format is not yet supportedEOF
