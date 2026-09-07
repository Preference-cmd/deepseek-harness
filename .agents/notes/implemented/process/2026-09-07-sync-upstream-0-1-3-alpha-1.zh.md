# Agent Note: 同步上游 0.1.3-alpha.1 到 fork

Status: implemented

English | [中文](2026-09-07-sync-upstream-0-1-3-alpha-1.md)

## Problem

上游在 fork 的 alpha.5 基点之后前进了 292 个提交（`49a606bc5b` 到 `d347e70390`）：session format v2（含迁移链与内嵌 assistant streams）、通用文件上传、代理收敛为 util 库、skill 模糊搜索、可点击链接统一、session 写租约、测试 tmp 清理。fork 的 60 个独有提交（mermaid 工具与客户端渲染、settings-models 编辑器、preset 重命名兼容、Node 24.11 `resolveSync` 修复）必须在合并后存活，且不能破坏收紧后的门禁。

## Decision

同步分支整体接受上游，113 个合并冲突按规则消解：107 个 v2 快照取上游的新一代格式，3 个删改冲突接受上游的删除，`pnpm-lock.yaml` 为 fork 独有依赖重生。两处真正的代码碰撞采用融合而非二选一：`render.tsx` 在上游 `LinkIcon` 改动旁保留 fork 的 mermaid 引入，preset 测试合并两侧的 `node:fs/promises` 引入。合并后的门禁修复让 fork 代码适配新契约：mermaid e2e 的 assistant message 补上 `stream: []`，tool 去掉 lint 拒绝的 `String()` 转换，inventory CSS 改为 hairline，catalog 与 inventory 测试覆盖 fork 的 `mermaid_render` 工具和 `toggle` 方法。

## Alternatives considered

**按 fork composition 重录 v2 快照。** 拒绝：v2 是上游的格式变更，不是 fork 的行为变更；重录只会让每个 fixture 分叉而无行为差异。

**保留被删的旧格式快照。** 拒绝：上游在格式 rollout 中删除了它们，harness 已不再拥有旧布局的读取器。

## Consequences

- fork 运行在 session format v2 之上；未来的快照工作都针对 v2 fixture。
- mermaid 工具与渲染、settings-models 编辑器、preset 重命名兼容仍是 fork 独有，且已满足 0.1.3-alpha.1 门禁。
- spill 边界测试在上游本身就对时间敏感，高负载下间歇失败；与本次同步无关。
