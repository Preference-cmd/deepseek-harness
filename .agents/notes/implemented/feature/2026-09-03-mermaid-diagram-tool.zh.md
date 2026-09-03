# Agent Note: 带浏览器端渲染的 Mermaid 图表工具

Status: implemented

English | [中文](2026-09-03-mermaid-diagram-tool.md)

## Problem

fork 自带面向模型的 `mermaid_render` 工具（`packages/mermaid/tool-mermaid`），但从未通过仓库门禁：manifest 缺 `license`、`repository` 与合规的 `exports`/`files`；`src/invariant.ts` 是 invariant 规则拒绝的空伴生；工具不在 tool-catalog 启动 manifest 里；示例 `cordis.yml` 用已退役的 map 形态；README 缺 model-context 条目。该工具也未接入：没有任何 bundle 挂载它，所以没有任何 shipped profile 提供它。执行器返回占位 SVG（灰底加前五行源码），不是真正的图。

## Decision

工具现已合规并真实渲染。主机端校验图表源码非空，按首关键字识别类型，原样返回源码；面向模型的结果是一个 `mermaid` 围栏代码块。包删除空 invariant 伴生（含 README 省略句），声明 MIT，加入 tool catalog、base bundle 与生成的 composition/module 图。渲染在网页客户端：`packages/client/ui-primitives` 对已落定的 `mermaid` 围栏调用 `mermaid` 引擎（懒加载，`securityLevel: 'strict'`），经与 KaTeX 相同的 DOM 解析路径把输出的 SVG 映射为 React 元素，并剥离 `on*` 属性与 `javascript:` URL。引擎加载失败或源码不可解析时保留代码块降级；流式围栏落定前保持代码形态。

## Alternatives considered

**主机端用 @mermaid-js/mermaid-cli 渲染。** 不采纳：它要调起 headless Chromium，主机沙箱模型不能假设其存在；浏览器本就负责图形排版。

**主机端在 jsdom 下跑 mermaid 包。** 不采纳：为本属客户端的展示关切，在每个主机上背 84MB 引擎加 DOM 垫片。

**为 mermaid_render 结果做专用 toolview 卡。** 本次不采纳：围栏结果走现有 markdown 渲染器，手写与工具返回的 mermaid 围栏渲染一致，无需新 slot 或卡片。将来需要按调用 chrome 时再做不迟。

## Consequences

- `mermaid_render` 由 base 系 profile 提供；快照 lane 不受影响（不涉及 session 事件）。
- `mermaid-diagram` web e2e 钉住两个落定围栏（流程图、时序图）渲染为内联 SVG 且零页面错误。
- 无网页客户端的主机部署只能拿到校验过的源码、看不到图；已在包的 Known Limitations 声明。
- 将来重做服务端导出（PNG/PDF）是带自己沙箱故事的新执行路径，不是改这次的分工。
