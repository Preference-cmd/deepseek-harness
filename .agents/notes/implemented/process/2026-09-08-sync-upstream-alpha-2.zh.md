# Agent Note: 同步上游 master（0.1.3-alpha.2）到 fork

Status: implemented

[English](2026-09-08-sync-upstream-alpha-2.md) | 中文

## 问题

上游相对 fork 的 0.1.3-alpha.1 基线前进了 449 个提交（`d347e70390` 到 `c389f96bf3`）：Sidebar 工作区文件栈（dockkit、resources、workspace-files、sidebar-files/textpreview/right、open-in-app、deliverables）、Electron 桌面端、subprocess 原生隔离、session 流式迁移加一系列性能优化、durable inbox 恢复、0.1.3-alpha.2 发布，以及 pi-ai 0.85.1 和默认 `str_replace_editor` 移除。fork 侧存活的独有工作（mermaid 工具及客户端渲染、settings-models 编辑器、preset 改名兼容、Node 24.11 `resolveSync` 修复）必须在合并中存活，且不能破坏收紧后的门禁。

## 决策

同步分支整体接受上游，2 个合并冲突按规则解决：`THIRD_PARTY_NOTICES.md` 文本冲突取上游 hunk，再重生成文件，让 fork 的 `mermaid`/`reicon-react` 运行时行回到所属分层，同时保留上游的 `msgpackr`/Electron 行；`2026-08-28-subprocess-native-containment.i18n.yaml` 的重命名误判冲突取上游 sidecar，因为 fork 的 pi-ai sidecar 编辑已通过归档改名进入合并树。归档的 pi-ai 三元组恢复成与上游逐字节一致，因为归档内容是冻结历史，被覆盖的 fork 段落仍活在 settings-models 编辑器 note 里。fork 指向归档改名 note 的过期 `implemented/architecture` 链接在中英两侧一起改指到 `archived/`。

## 备选方案

**按 fork 组合重录上游快照。** 否决：上游生成物是格式与行为变更，不是 fork 行为变更；重录只会为零行为差异分叉全部 fixture。

**保留 fork 改过的归档 pi-ai 三元组。** 否决：归档 note 是冻结历史，归档门禁封存其哈希；fork 的编辑器 rationale 保存在自己的 active note 里。

## 后果

- fork 运行在 0.1.3-alpha.2，带有 Sidebar 文件栈、桌面端、原生隔离和 durable inbox 恢复。
- mermaid 工具与渲染、settings-models 编辑器、preset 改名兼容仍是 fork 独有，且通过合并后的门禁。
- `scripts/repo-files.ts` 新增 symlink 安全的星号展开回退，因为 Node 24 原生 glob 在既有 symlink `snapshots/acp/image-compaction/system-prompt.expected.md` 上以 ENOTDIR 崩溃；该崩溃在干净上游树上可复现，因此在上游修脚本之前由本仓持有该修复。
