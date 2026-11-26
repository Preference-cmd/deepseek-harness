# Agent Note: 把上游 0.2.3-alpha.2 同步进 fork

Status: implemented

[English](2026-11-18-sync-upstream-0-2-3-alpha-2.md) | 中文

## Problem

上游的 `dsh-v0.2.3-alpha.2` 发布（2026-11-22）当时是 `upstream/master` 的顶端。fork 主线站在上游 `0.2.2-rc.1` 发布合并之上，落后 3124 个上游提交，其上有 160 个 fork 独有提交。窗口覆盖 8655 个文件、+408,806 / −122,486 行，以及 `0.2.2-rc.2` 到 `0.2.3-alpha.2` 六个发布标签。`SESSION_FORMAT_VERSION` 保持 4，`SQLITE_SESSION_FORMAT_VERSION` 与之相同，也没有新增 bundle 包，因此会话格式与 bundle 契约沿用。

窗口重排了产品表面。随发行版的 JSONL 持久化后端默认改写带校验和的 Zstandard 帧，同时仍能解码更早世代；可选的 SQLite provider 在首次打开时导入旧 JSONL。Python PTC 运行时、`working_directory` 与 `personalized-recommendations` bundle 离开。Office、Windows 与 MCP 上的 Computer Use、Forge GitLab、飞书、钉钉、企业微信、Linear、Notion 与腾讯系连接器、会话面板与会话状态、timeline、终端面板与桌面发布器进入（新增 37 个包、删除 9 个）。`exit_worktree` 取代 `working_directory`，`subagent` 去掉 `cwd`，`engines.node` 改为 `^24.22.3 || >=26.13.1`，vendored Cordis 从 `4.1.0` 移到 `4.2.0-alpha.1`。

窗口触及四处 fork 工作。上游围绕 `FenceBlocks`、`MarkdownFenceSeat` 与 `renderCode` delegate 重写了 Markdown fence 管线，而 fork 的 Mermaid 渲染器正是上游重写的那条函数里的一个分支。fork 的 `MarkdownLabels` 契约新增了必需的 `mermaid` 成员，于是上游每个构建它的位置都欠这个成员。上游交付了自己的 `RetryPolicyEditor`，替换 fork 的单值 `maxRetries` 输入。其余修复由门禁而非合并本身暴露：两个上游 e2e 规格把 vendored 库 symlink 进脚手架化的 `node_modules/@deepseek-ai`，vendor rescope 的 token 规则把那里的裸目录段当成了包名。

## Decision

本同步把上游的发布合并并入从 fork 主线切出的 `sync/upstream-0.2.3-alpha.2`，由 PR #31 以 merge commit 落到 fork 的 `master`。十处冲突，每一处都对着两侧读，而不是按规则取：

- `docs/web-styling.i18n.yaml` 与 `packages/client/ui-primitives/README.i18n.yaml` 采用上游记录的哈希，随后重新记录，因为两侧改的是同一批小节。
- `packages/client/ui-primitives/README.md` 及其中文版合并两侧描述：fork 的 Mermaid 句子，以及上游的 fence、diff 与 `renderCode` 契约。
- `packages/client/ui-primitives/src/icons/artwork.ts` 采用上游重写后的图形表，并在 `refresh-outline` 之后补回 `zoom-in-outline` 与 `zoom-out-outline`。上游的 `icons.client.spec.tsx` 从该表推导期望名字，因此两个字形回到表里即被覆盖。
- `packages/client/ui-settings-models/package.json` 两侧都留：fork 的 `reicon-react` 与上游的清单。
- `packages/client/ui-settings-models/src/client/ProviderEditor.tsx` 与其 `locales.ts` 采用上游的 `RetryPolicyEditor`；fork 的 `maxRetries` 输入及其 `retryMaxRetriesPlaceholder`、`retryMaxRetriesInvalid` 两个键从八份 locale 记录中移除。
- `pnpm-lock.yaml` 用 `pnpm install --no-frozen-lockfile` 重新生成。
- `scripts/rescope-vendor.ts` 采用上游的 `vendor/README.md` 锚点与跳过列表；fork 的五个 `cordis` 跳过项已是上游的，而上游更宽松的锚点能挺过 `V*` 重编号。

随后有四处修复，每一处都由编译器或门禁暴露，而不是合并本身：

- `packages/client/ui-primitives/src/markdown/render.tsx` 无冲突标记地合并进来却不再编译：上游用 `FenceCodeBlock` 取代 `CodeBlock`，于是 `MermaidBlock` 的兜底改走 `FenceCodeBlock`，并接收整个 `MarkdownCodeLabels` 而不是两段文案。
- 上游新增的四个 `MarkdownLabels` 构建点缺少 fork 的 `mermaid` 成员——Forge 的 `ReviewThreads` 面板、Forge 评审详情页、timeline 的 `Markdown` 正文，以及文档预览的 `SummaryPreview`。四处都补上缩放文案，Forge 与 timeline 的 locale 记录在全部八种语言里各加三个 `mermaid.*` 键。
- `packages/client/ui-settings-models/tests/provider-form.client.spec.tsx` 采用上游的期望，并保留 fork 那行 fixture：给一个模型同时提供文本与图片输入。
- `scripts/rescope-vendor.ts` 把两个 e2e 规格列入 `GENERIC_SKIPS`，`scripts/rescope-vendor.spec.ts` 断言这两个文件零改写。两处改动都随合并提交一起落地，因为离开它们合并后的树过不了自己的门禁。

`packages/` 下有十五个目录留着窗口删除或搬迁的包的 `lib/` 与 `node_modules/` 残留，`pnpm run constraints` 因此把它们读成没有 manifest 的包目录。这些目录已从工作区移除，且从未被跟踪。

### The Mermaid branch

上游的 `render.tsx` 把每个带语言的 fence 都送进 `MarkdownFenceSeat`，那里读取 `ChatView` 通过 keyed hoc slot `conversation.chat.markdown.fence` 提供的 `useMarkdownDelegate().renderCode`。fork 的 Mermaid 分支位于该 seat 之上的一层，因此仍在每个 Markdown 上下文里渲染，而不只是聊天流，也仍产出 web golden 记录的 DOM。本同步把该分支留在原处，只修它的兜底外壳。

### Fork work upstream supersedes

fork 的 provider 重试编辑器来自一个上游从未采纳的、2026-08-22 的 fork 提交。上游的 `RetryPolicyEditor` 从 provider 自己的 `retryPolicy` schema 构建字段，提供模式选择，并从带标签的列表里挑可重试错误码，于是 fork 的单值输入随本同步退役。

fork 保留下来的独有工作是 Mermaid 渲染器及其缩放视口、`llm-pi-ai` 的 `x-opencode-session` 头、`reicon-react` 依赖、`plugins/**` 双语配对排除，以及 `ModelsSection` 的圆角例外。

### Verification

合并后的树由本地门禁矩阵在 Node `v26.13.1` 上验证，因为 fork 的 GitHub Actions 在 2026-10-08 之后不再启动工作流。

- `pnpm install --frozen-lockfile`（422 个 workspace 项目）、`pnpm run build`（10 道门）、`pnpm run typecheck`（5 道门）、`pnpm run build:check`（2 道门）。
- `pnpm run lint`（7697 个文件 0 warning 0 error）、`pnpm run hygiene`（27 道门）、`pnpm run doc-sync`（43 道门）、`pnpm run verify-translation-pairing`（1422 对）。
- `pnpm run rescope-vendor:check` 报告无残留，`pnpm run test:snapshot` 回放 4 个文件、313 个测试通过、2 个跳过，含保留 V3 输入的用例。
- 本同步触及的六个包的聚焦测试：317 个文件、6193 个测试通过。
- `pnpm run duplication` 在 `katex.tsx` 与 `mermaid.tsx` 之间报了 3 处克隆；两个文件本同步未改动，该失败先于本同步存在于 fork 主线。

## Alternatives considered

**保留 fork 的重试策略编辑器，与上游并排。** 否决：两者会从两个编辑器写同一个 schema 字段，而上游的已经覆盖模式、错误码与退避字段，fork 的输入从未提供这些。

**把 Mermaid 渲染器移到 `conversation.chat.markdown.fence` slot。** 否决：这会把图渲染放到插件形态的注册之后，收窄渲染位置，并移动 web golden，而在本次同步中没有收益。

**让插件完全拥有渲染器，删掉 fork 的 fence 分支。** 否决：插件自带的渲染器画图时不带 fork 的缩放视口，而转录里的缩放控件正是 fork 的 web golden 记录的东西。

**把目标定在 `0.2.2-rc.5` 而不是 `0.2.3-alpha.2`。** 否决：rc.5 停在 0.2.2 维护线上，缺少 0.2.3 的工作，同一个窗口会回到下一次同步，fork 会为更小的改动背上两条发布线的分叉。

**保留 fork 更严格的 `vendor/README.md` 锚点。** 否决：上游更宽松的锚点能挺过 `V*` 重编号，而上一次同步已为此修过一次。

## Consequences

- fork 运行在 `0.2.3-alpha.2` 上；`SESSION_FORMAT_VERSION` 保持 4，窗口带来 83 条升级指南（树内合计 201 条）与 7 条持久化变更记录，包数量从 374 移到 402。
- 合并前的 fork 会话经新的 JSONL 读取器打开。写入端已改为带校验和的 Zstandard 帧，更早世代经由保留的读取器解码；快照套件里保留 V3 输入的用例是本地证据。
- fork 的独有工作行为不变：Mermaid fence 分支用同样的缩放视口渲染同样的图，`x-opencode-session` 头在 opencode 路由上仍然优先，`ModelsSection` 的圆角例外照旧。
- 曾设置 fork 的 `maxRetries` 输入的部署，现在通过上游的编辑器编辑 provider 的 `retryPolicy`；描述旧输入的两个 fork locale 键已移除。
- `plugins/dsh-mermaid` 有自己的发布工作。它的版本矩阵止于 `0.2.2-rc.1`，因此还欠 `0.2.2-rc.2` 到 `0.2.3-alpha.2`、能放行 `0.2.3-alpha.2` 与 cordis `4.2.0-alpha.1` 的 peer 区间、指向 `dsh-v0.2.3-alpha.2` 的 `UPSTREAM_RELEASE`，以及与之相符的 README 声明。
- 本同步的证据是本地结果而非 CI 结论：fork 的 Actions 在 2026-10-08 之后不再启动工作流。
- `pnpm run duplication` 在 fork 主线上仍因 `katex.tsx` 与 `mermaid.tsx` 的克隆而失败，本同步既未引入也未改动它们。
