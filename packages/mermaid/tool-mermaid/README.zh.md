# @deepseek-ai/dsh-tool-mermaid

[English](README.md) | 中文

DeepSeek Harness 的 Mermaid 图表生成工具。

## 概述

本包提供一个 Cordis 插件，注册一个 Mermaid 图表渲染工具。
它接受 Mermaid 图表源代码并将其渲染为 SVG、PNG 或 PDF 格式。

## 支持的图表类型

- 流程图（graph、flowchart）
- 时序图（sequenceDiagram）
- 类图（classDiagram）
- 状态图（stateDiagram）
- 实体关系图（erDiagram）
- 甘特图（gantt）
- 饼图（pie）
- Git 图（gitgraph）
- 思维导图（mindmap）
- 时间线（timeline）
- 块图（block）

## 模型体验

本工具面向模型。模型可以使用它从 Mermaid 语法生成图表。

## 已知限制和待处理工作

- 完整的 Mermaid 渲染需要运行时安装 @mermaid-js/mermaid-cli
- 未安装 CLI 依赖时，返回占位 SVG
- PDF 输出格式尚未支持EOF
