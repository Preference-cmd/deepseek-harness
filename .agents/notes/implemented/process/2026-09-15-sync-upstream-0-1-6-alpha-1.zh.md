# Agent Note: 将上游 master (0.1.6-alpha.1) 同步至本 fork

Status: implemented

[English](2026-09-15-sync-upstream-0-1-6-alpha-1.md) | 中文

## 问题

上游相对 fork 的 0.1.5-rc.2 基线前进了 666 个提交（0.1.5-rc.2 到 0.1.6-alpha.1）：0.1.6-alpha.1 版本发布、typert schema 首次使用时按需物化、运行时加速与原生依赖按需延迟解析、Electron asar 运行时解析、实验性 MCP 资源工具与 Stagehand 浏览器工具、图片卸载压缩，以及在基础 cordis.patch.yml 中将 tool-ralph 默认停用。fork 侧存活的独有工作（`tool-mermaid` 包及其网页渲染与 e2e、settings-models 中的重试与模态编辑器、preset 改名回退、plugin-inventory 启停开关，以及 llm-pi-ai opencode 会话头）必须在合并中存活，且不能破坏仓库门禁。

## 决策

合并将上游 0.1.6-alpha.1 引入 `sync/upstream-0.1.6-alpha.1` 分支，形成双父级 merge commit。冲突通过融合解决：
- `packages/client/ui-settings-models/src/client/locales.ts` 在中英文词典中同时保留上游 DeepSeek 地址提示与 fork 专有的 `retryMaxRetries` 及模型模态配置。
- `packages/core/tools/tests/gen-tool-catalog.spec.ts` 按字母序合并上游 MCP 和 Stagehand 工具与 fork 的 `mermaid_render` 工具。
- `packages/mermaid/tool-mermaid/package.json` 从 0.1.5-rc.2 推进至 0.1.6-alpha.1，保持工作区版本一致性。
- `docs/tool-catalog.md`、`docs/module-graph.md` 及其对应的中文文件将上游 MCP/Stagehand 工具与 `mermaid_render` 共同纳入，并通过双语配对验证重新记录。
- 会话与 SDK 快照预期对齐：`mermaid_render` 继续保留在公布的工具列表中，而 `ralph` 遵循上游 `cordis.patch.yml` 默认规则移除。
- 意外残留的编辑器跟踪文件（`.zcode`）已从 git 跟踪中清除并在 `.gitignore` 中忽略。

## 备选方案

**将同步 squash 为单父级提交。** 否决：squash 合并会破坏 merge-base 祖先链路，导致后续同步产生数百个虚假冲突。

**在 fork 默认工具中继续启用 tool-ralph。** 否决：上游因完成度为未经独立评估的 worker 自行汇报而默认停用，需要时可通过 overlay 配置行按需重新开启。

## 结果

- fork 运行在 0.1.6-alpha.1 之上，具备全部上游改进（快速启动、typert schema 延迟加载、asar 解析、MCP 资源、Stagehand 工具、图片卸载）。
- mermaid 工具、网页渲染、e2e、settings-models 编辑器、preset 回退、opencode 会话头以及 plugin-inventory 启停功能完好保留并通过仓库门禁。
