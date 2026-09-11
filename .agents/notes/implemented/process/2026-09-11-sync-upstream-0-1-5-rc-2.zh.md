# Agent Note: 同步上游 master（0.1.5-rc.2）到 fork

Status: implemented

[English](2026-09-11-sync-upstream-0-1-5-rc-2.md) | 中文

## 问题

上游相对 fork 的 0.1.5-alpha.2 基线前进了 90 个 first-parent PR 合并（`b2e3b2a012` 到 `c291e7961a`）：0.1.5-rc.1/rc.2 两个发布、composer-plus-menu 与 sidebar/document-preview/composer-preview UI 浪潮（含新增的 `ui-sidebar-documentpreview` 包）、feedback-dialog 交付物回搬、agent-preset 模式选择门控、DeepSeek V41 Flash 默认目录、`dshCachePath` home-paths 变更、新增的 `test-support/remote-mock` 组装层，以及 CI/构建可靠性工作（Blacksmith 托管镜像、macOS 并行公证、bundle-speed）。fork 侧存活的独有工作（`tool-mermaid` 包及其网页渲染与 e2e、settings-models 编辑器、preset 改名回退）必须在合并中存活，且不能破坏门禁。另有一个麻烦：alpha.2 同步是以单 parent 提交落地的，因此朴素 merge-base 回退到 `c389f96bf3` 并报出 795 个冲突；相对 alpha.2 树真正分叉的只有 18 个文件。

## 决策

同步先恢复真正的 alpha.2 祖先关系（本地 `git replace` graft，给 squash 提交补上上游 parent，仅本地使用、绝不推送），再合并 `upstream/master`，2 个真实冲突按融合解决。`packages/preset/agent-presets/src/index.ts` 在上游模式选择设置（`modeSelectionEnabled`、`selectionPolicy`）旁边保留 fork 的 `RENAMED_PRESET_IDS`（`code` 到 `ptc`）回退；`scripts/repo-files.ts` 整体接受上游 `expandGlob` walker 并退役 fork 的 `safeGlob` ENOTDIR workaround，因为两者修复的是同一个 Node 24 glob 故障，而上游 walker 自带 spec 覆盖与更严格的分段校验。剩下 16 个重叠文件自动合并、两侧 intact（`cordis.patch.yml`、tsconfigs、`gen-tool-catalog.ts` 中的 `tool-mermaid` 接线；`devDependencies` 中的 `mermaid`/`reicon-react`；`python-sdk-single-exe` 的 `mermaid_render` 行）。fork 独有的 `tool-mermaid` manifest 跟随 dsh 家族共享版本（`0.1.5-alpha.2` 到 `0.1.5-rc.2`）：release 家族要求每个 `packages/*/` 成员版本统一，掉队的版本通不过 `release:verify`。`pnpm install` 后锁文件零改动；`THIRD_PARTY_NOTICES.md`、tool catalog 与 translation pairing 全部干净通过，无需重生成。

## 备选方案

**逐个解决 795 个朴素冲突。** 否决：其中 777 个是 squash 破坏 merge-base 产生的幻影冲突，fork 侧与 alpha.2 树逐字节一致；逐个手合恰恰会引入本次合并本要避免的意外 fork 漂移。

**保留 fork 的 `safeGlob` workaround 而不用上游 walker。** 否决：两者修复同一个 Node 24 `ENOTDIR` glob 故障，上游 walker 自带 spec 覆盖与更严格的分段校验；保留 fork 独有的影子实现只会让每次同步在同一文件继续冲突。

## 后果

- fork 运行在 0.1.5-rc.2，带有新的 composer/sidebar/document-preview UI、preset 模式选择门控、V41 Flash 默认目录与 `remote-mock` 测试层。
- mermaid 工具及其网页渲染、e2e、settings-models 编辑器与 preset 改名回退仍是 fork 独有，且通过合并后的门禁（`verify-tool-catalog`、`verify-tsconfig-paths`、`verify-third-party-notices`、translation pairing、typecheck、lint、`release:verify`、全量 build、`doc-sync` 34/34）。
- 未来同步必须保留双 parent 合并历史（绝不把同步 squash 进 master），否则同样的幻影冲突膨胀会重演；此处使用的 graft 仅限本地，绝不推送。
