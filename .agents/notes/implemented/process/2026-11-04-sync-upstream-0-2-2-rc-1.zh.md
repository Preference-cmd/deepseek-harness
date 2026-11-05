# Agent Note: 把上游 0.2.2-rc.1 同步进 fork

Status: implemented

[English](2026-11-04-sync-upstream-0-2-2-rc-1.md) | 中文

## Problem

上游在 2026-11-04 发布了 `0.2.2-rc.1`，比 fork 的 `0.2.2-alpha.2` 基线多一个 `0.2.2-alpha.3` 发布。fork 主线落后该发布 1277 个上游提交，merge base 是上游自己的 `dsh-v0.2.2-alpha.2` 发布提交，其上是 157 个 fork 独有提交。

这个窗口大到足以重排产品表面。`agent-team` 从 `packages/experimental/` 迁出，成为新的 `packages/team/` 包组，旁边还多出 `fs/fs-patch` 与 `mcp/mcp-manager`。Computer Use 成为可选 bundle，其 macOS helper 带共享开发签名并经公证交付。Forge 得到统一的评审/worktree 入口，配上 diff 文件树与行内评审评论。Schedule 的独立任务并入 WebUI，其工具改为基于 RRULE 与目标的模型（`schedule_create`、`schedule_list`、`schedule_view`、`schedule_edit`）。`apply_patch` 以可选开关的形式进入 `tool-fs`，同时 `fs-observation-policy` 行默认禁用，于是写入与编辑不再要求先读。SDK 的 `run()` 接受原生命令，网页 Search 默认从按模型计费的 Messages 搜索改为 DeepSeek Search API，Exa 与 Perplexity 包被移除，Desktop 获得可切换的更新通道与分阶段发布，会话投影改为每个已提交事件发一帧。

其中三处改动触及 fork 自己的表面。Web `cordis` 预设 id 在随发行版交付的工具目录里拼写相同，vendor rescope 门禁会把它读成包引用。`apply_patch` 那一行正是 fork 自己的样式契约与 `fs-observation-policy` 升级指南所描述的内容。而 fork 为自己的 Mermaid 渲染扩展过的 `MarkdownLabels` 契约新增了一个必填成员，因此每个构造它的上游位置现在都欠这个成员。

fork 的 `vendor/` 仍是 `0.2.1-rc.2` 快照——cordis `4.0.6-alpha.1`、schemastery `3.18.6-alpha.1`、logger-console `1.0.6-alpha.1`——而上游已把 vendored 集合推进到 cordis `4.1.0`、schemastery `3.19.0`、logger-console `1.1.0`。

当时有一个同步 PR（#29）开向 fork 主线，其基线是 2026-10-31 的上游 `master`，已经落后 tip 926 个提交。

## Decision

本次同步把上游 `master`（即 rc.1 发布）并入 fork 主线上的 `sync/upstream-0.2.2-rc.1`，并以新分支取代 PR #29，而不是合并它。6 个文件冲突，每个解法都对着两侧读过再定，而不是按规则取某一边：

- `.gitignore` 在上游生成的 CUA 发布记录旁边保留 fork 自己的 `.zcode/` 条目。
- `docs/web-styling.i18n.yaml` 与 `packages/client/ui-primitives/README.i18n.yaml` 取上游记录的哈希，之后重新记录，因为两侧改了同一批段落。
- `packages/client/ui-primitives/tests/icons.client.spec.tsx` 取上游的动态断言，取代 fork 写死的字形数量。fork 新增了两个 zoom 字形，而上游的断言从图形表推导期望名字，因此它已经覆盖了这两个。
- `packages/llm/llm-pi-ai/src/adapter.ts` 两侧都留：上游的 `requestHeaders` 现在接收请求选项、base URL 与插件提供的 `prepareHeaders` 钩子，fork 的 `opencodeSessionHeaders` 仍给 opencode 路由加上 `x-opencode-session`。fork 的辅助函数在上游构建器之后运行，因此部署配置或插件准备的同名头仍然优先。
- `scripts/rescope-vendor.ts` 取上游的 `listRescopeFiles` 辅助函数，它提高了 spawn 缓冲区，并与其它 vendor 脚本共用。

另有四处 fork 侧决策紧随合并之后，都由门禁而非合并本身暴露：

- `packages/preset/agent-preset-registry` 里的重命名前预设 id 映射被丢弃。该映射靠把持久化的 `code` id 解析成 `ptc` 来回答它；上游的 `session-format-v0-to-v1` 迁移在读取该记录时已经改写这套词汇，而 fork 早在本次同步之前就已带着那个迁移。这个映射是一个临时补丁，其声明的前提——"直到 v0→v1 会话格式迁移改写词汇表"——已经成立，上游也是同样的理由把它移除。
- 仍带区间压缩 `sourceEventSeqs` 的 6 份录制会话快照改随上游的展开列表。产生压缩形式的投影代码是上游的，而上游已把编码改回去；保留 fork 的录制会把 fork 钉在一个已退役的编码上。
- `scripts/tests/ci-release-selfhosted.spec.ts` 跟随上游。fork 的版本允许 vendor 发布作业用 failover 表达式，但那个工作流是上游自己的，从未采用该表达式，因此这份宽松没有覆盖到任何东西。
- `scripts/rescope-vendor.ts` 做两处修复。上游给 vendored README 换上了稳定的 `V*` id，这使脚本里 `vendor/README.md` 的 postcondition 仍在命名一个已退役的列表位置；同时有 5 个命名 Web `cordis` 预设 id 的文件不在跳过列表里：`docs/tool-catalog.md`、`docs/tool-catalog.zh.md`、`fs-observation-policy-default-off` 指南及其中文侧，以及 `scripts/gen-tool-catalog.ts`。postcondition 的 token 改为 `V17` 那一条，这 5 个文件则并入早已在保留该预设 id 的 `GENERIC_SKIPS` 条目。

两处更小的修复同形：上游新增的 `packages/client/ui-chat/tests/context-menu.client.spec.tsx` 构造了一个没有 fork 契约所要求的 `mermaid` 成员的 `MarkdownLabels`，因此该测试现在补上它；fork 携带的 3 个缺尾换行的文件按仓库规则补上尾换行。

## Alternatives considered

**合并 PR #29 之后再同步一次。** 否决：它的基线是 2026-10-31 的上游 `master`，已落后该发布 926 个提交，合并它等于对同一个发布做两次同步。

**以 `upstream/master` 为基线开分支，而不是并入 fork 主线。** 否决：此前每一次 fork 同步都是把上游并入 fork 主线，那 157 个 fork 独有提交记录着每次早期同步需要做哪些调整。

**保留重命名前的预设 id 映射。** 否决：它服务的持久记录场景已由 fork 早已随发行交付的会话格式迁移回答，而上游不带这个映射发布同一份注册表。保留它会让 fork 去解析一个上游刻意不再解析的 id。

**保留区间压缩的录制会话。** 否决：那种编码的产生者已不在树里，这些录制将不再描述任何可运行的行为。

**保留 fork 原有的 vendor 树。** 否决：上游更新的 vendored 集合随本次同步到达，而 rescope 门禁正是把 fork 自己的 `cordis` 预设 id 保留在其中的机制。

## Consequences

- fork 运行在 `0.2.2-rc.1` 上；`SESSION_FORMAT_VERSION` 仍是 4。
- fork 存活的独属工作是带可缩放视口的客户端 Mermaid 渲染、`llm-pi-ai` 的 `x-opencode-session` 头、`ui-settings-models` 的芯片圆角工作及其 `reicon-react` 依赖，以及把独立插件检出挡在双语配对语料之外的 `plugins/**` 排除项。
- 重命名前的预设 id 映射离开 fork。`settings.default` 仍写着 `code` 的部署会失去 fork 的兜底，需要自行更新那个 id。
- Web `cordis` 预设 id 在随发行版交付的工具目录与 `fs-observation-policy` 升级指南里保持原拼写，撑住它的是 rescope 的跳过条目。
- `0.2.0-rc.2` 的同步笔记曾用哈希点名一个上游提交，这在上游收紧后的仓库引用规则下不再成立，现改为点名上游 PR #5517。该笔记留下的开放问题——fork 是否保留运行时 invariant 体系——在 fork 接手上游 alpha.2 基线时就已经有答案，本次同步予以确认。
- fork 的 GitHub Actions 自 2026-10-08 起不再启动工作流，此后开出的 PR 都没有任何 check run。因此本次同步的实质依据是上面这套本地门禁矩阵，而不是 CI 结论。
- 在合并后的树上验证过：typecheck（5 个门禁）、lint、`build:artifacts`（8 个门禁）与 `build:check`（2 个门禁）、`hygiene`（23 个门禁）、`doc-sync`（43 个门禁），以及覆盖整个语料的 `verify-translation-pairing`。
