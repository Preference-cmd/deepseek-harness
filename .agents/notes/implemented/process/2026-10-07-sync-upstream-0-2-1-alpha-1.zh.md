# Agent Note：把上游 0.2.1-alpha.1 同步进 fork

Status: implemented

[English](2026-10-07-sync-upstream-0-2-1-alpha-1.md) | 中文

## Problem

上游发布 `0.2.1-alpha.1`，落在 fork 的 `0.2.0-rc.2` 基线之后 266 个提交，该发布 tag 正是上游 `master` 的头提交。这个窗口落地了 `session-inspector` 与内嵌 Chrome DevTools、带 Web band 的 Claude Code mods 桥接、Schedule 的提醒工具从已下线的 bundle 迁入预设自有的 `@deepseek-ai/dsh-tool-schedule`、流式工具参数设上界并在调用准备中呈现、API 侧 Session 列表分片、独立的 npm 发布渠道，以及一批 Web 与插件修复。

其中四项变更对外可见，且各自带有升级指南。`@deepseek-ai/dsh-invariants`、所有 `<package>/invariant` 子路径导出与 `runtime-diagnostics/invariants` 包被移除；`sdk-minimal` profile 少了挂载它们的 5 行。「自动化任务」bundle 下线，改由 Web 组合自行挂载 `schedule` 与 `ui-schedule`。子路径插件的展示文案改从 `<subpath>/locale/*.json` 读取、图片改读 `<subpath>/icon`，不再读 `<subpath>/package.json`。`SignInErrorCode` 新增 `no-response`，用于 fetch 在返回 Response 之前失败的情形。

不变式系统的移除正是上一次同步推迟的问题：那个提交落在 `dsh-v0.2.0-rc.2` 之后，因此 fork 保留了它并把该决定记为待办。它在本次发布之内，所以 fork 采纳它。

## Decision

合并把上游 `0.2.1-alpha.1` 以双父提交并入 `sync/upstream-0.2.1-alpha.1`，两个父提交分别是 fork 主干与上游发布点。`git merge-tree --write-tree --name-only` 空跑预测 8 处冲突，输出落盘统计而非管道统计。

- `packages/client/ui-sidebar-documentpreview/src/client/markdown/MarkdownBody.tsx` 是唯一冲突的代码。两侧改动的是同一个 `useMemo` 中互不相交的部分：fork 增加 `mermaid` 标签项，上游增加 `splitFrontmatter` memo 及其两行派生文本。两者都保留。
- `docs/config-catalog.md`、`docs/config-catalog.zh.md`、`docs/module-graph.md` 与 `docs/module-graph.zh.md` 取上游文本后重新生成。`gen-config-catalog` 与 `gen-module-graph` 各自从工作区写出两种语言，因而恢复了上游从未携带的 fork `tool-mermaid` 行。
- `docs/tool-catalog.i18n.yaml`、`docs/web-styling.i18n.yaml` 与 `packages/client/ui-primitives/README.i18n.yaml` 取上游记录，并在确认合并后内容后重新记录，因为两侧改动了同一批段落，合并后的文本与两侧记录的哈希都不匹配。

三项 fork 侧修复，每项都由门禁而非合并暴露：

- `packages/mermaid/tool-mermaid/package.json` 升到 `0.2.1-alpha.1`。家族版本规则要求如此，且没有上游提交会为它不拥有的包升版本。
- `scripts/rescope-vendor.ts` 为名字 `cordis` 新增 13 条 `GENERIC_SKIPS`。Schedule 迁入预设后，`cordis` 这个 agent-preset id、`cordis_inspect_*` 工具 id 与 `cordis.patch.yml` 文件名进入了 Schedule 子系统与用户文档、已下线 bundle 的升级指南、Web bundle patch、插件创建名册及其测试。这些出现处都是产品数据，与上一次同步加入的条目同类。只有 `rescope-vendor` 门禁会报告它们。
- `scripts/snapshots/python-sdk-single-exe/**` 与录制会话的 sidecar 保留各自的 `mermaid_render` 条目。上游本窗口没有触碰这两棵树，因此无需恢复；核查确认 fork 主干上带有该条目的 17 个单文件运行时录制与 67 个录制会话 sidecar 全部仍然带有，位置同样在 `job_output` 与 `run_code` 之间。

## Alternatives considered

**改合并 `upstream/master` 而非 tag。** 本窗口这不是一个区分点：发布 tag 就是上游 `master` 的头提交，两者指向同一个提交。fork 仍以 tag 为同步目标，因为此前每一次 fork 同步都在合并标题与 `dsh-fork-` 标签中标注一个上游发布。

**保留不变式系统。** 不可行：移除就在本次同步的 tag 之内，保留会让 fork 偏离它所声称跟踪的发布。合并会删除 `packages/runtime-diagnostics/invariants`、工作区中约 104 个 `src/invariant.ts` 及测试文件、以及 `scripts/*invariant*` 生成器，且零冲突，因为上游删除了同样的路径。

**翻译恢复回来的中文目录行。** 不需要：`gen-config-catalog` 与 `gen-module-graph` 都会把生成区域拼接到中文副本中，因此这些行来自生成器而非手写翻译。只有显式调用 `dsh-translate-docs` 才产出新的翻译内容。

**重录录制会话场景。** 不需要：上游没有触碰录制树，合并两侧也没有工具清单变化。重录需要 API key，且会为无差异而重写跨平台基线。

## Consequences

- fork 运行在 `0.2.1-alpha.1`；`SESSION_FORMAT_VERSION` 保持 4。
- fork 存活的独有工作不变：`tool-mermaid` 包及其 Web 渲染与可缩放视口、`ui-settings-models` 的 `maxRetries` 控件与按模型推理等级、`llm-pi-ai` 的 `x-opencode-session` 头、`agent-preset-registry` 中改名前的预设 id 映射，以及 `reicon-react` 这个浏览器 devDependency。
- 在完成本同步的主机上 `pnpm install` 无法完成，因此门禁套件的大部分无法本地运行。`@deepseek-ai/dsh-experimental-inspector` 新增了 `chrome-devtools-frontend`，该包自带 `.gitmodules` 文件；该主机的 agent 沙箱拒绝创建任何 `.git*` 路径，于是物化该包时以 `EPERM` 失败，并把 `node_modules` 留在部分链接状态：workspace 链接存在，外部依赖缺失。去掉这一个依赖可以让解析走完，但随后的链接阶段会无限期停滞，因此无法在本地修复这棵树。每个 shell out 到 `pnpm run` 的门禁都因随之而来的依赖检查而失败，类型感知的 oxlint 规则则在依赖未链接处报告 `error` 类型值。这些全部是环境失败，结果交由 CI 判定。
- 在没有完整安装的情况下已核验的部分：`rescope-vendor:check` 在 8816 个跟踪文件上报告无残留，`verify-translation-pairing` 报告全部 884 对一致。`oxlint` 解析了整棵树并报告零个非类型错误，其中包括本同步手工解决的那一个文件。
- `test:snapshot` 与 `test:expected` 在本主机上没有可信结果，原因见上一次同步笔记中记录的沙箱约束，其结果交由 CI 判定。
- `scripts/smoke-python-runtime.py` 拥有录制工具清单，是报告 fork 条目缺失的门禁。本地未运行它，因为 `--installed-wheel` 需要构建出的 wheel 与干净虚拟环境，只有 CI 能提供。上面的核查是本地替代手段，未发现缺口。