# Agent Note: 把上游 master（0.2.0-rc.1）同步进 fork

Status: implemented

[English](2026-09-29-sync-upstream-0-2-0-rc-1.md) | 中文

## Problem

上游在 fork 的 0.1.7-rc.2 基线上又前进了 261 个提交，并发布了 `0.2.0-rc.1`。版本跨过次版本位，所以这是 fork 第一次同步到 `0.2` 的树。这个窗口落地了 OpenTelemetry 子系统（一个共享的 `dsh-otel` Cordis service，把常规产品事件与字节受限的 Session 日志通道拆开，其 `host-product-telemetry-otel` 与 `session-telemetry-otel` provider，一个 `client/product-analytics` 采集器，以及新的 `docs/subsystems/otel` 页面）、把 Schedule 开关做成可选 bundle、聊天转录里的运行态鲸尾与恢复的完整状态行、plugin-manager 的安装与注册表交互工作、DeepSeek 联网搜索的账号 token 路由，以及一处「失败步骤关闭前先结算 pending tool 结果」的修复。

窗口内有两处改动触及 fork 自己的表面。持久化类型清单被压缩（#5191），把 `docs/persistence-schema.json` 从 97057 行改写为 25277 行而 root 数保持 62 个——窗口 diff 里那 75173 行删除正是这次改写，不是内容丢失，且 fork 从未改过该文件。窗口的 plugin-manager 与 chat 工作落在 `packages/client/ui-primitives`，而 fork 的可缩放 Mermaid 视口改的也是该包的 README 组件目录。

## Decision

合并把上游 `0.2.0-rc.1` 并入 `sync/upstream-0.2.0-rc.1`，落成一个双父合并提交，两个父分别是 fork 主干与上游发布点。两个文件冲突。动手前用 `git merge-tree` 空跑得出的就是这个数字，远低于两侧独立 diff 的共有路径数（18 个）：共有路径都能自动合并，而仅凭 diff 重叠估出来的数字并不是冲突数。

- `packages/client/ui-settings-models/package.json` 取两侧依赖的并集——上游的 `@deepseek-ai/dsh-client-product-analytics` 与 fork 的 `reicon-react`。两侧各往同一个列表尾部追加了一项。
- `packages/client/ui-primitives/README.i18n.yaml` 重新录制，而不是判给某一侧。两侧都改了同一个 `component-catalog` 章节，合并后的正文与两边记录的哈希都不匹配；`verify-translation-pairing --write packages/client/ui-primitives/README.md` 重算两种语言，随后全量校验报告 1173 个配对全部一致。

两处 fork 侧修复，都是门禁暴露而非合并冲突：

- `packages/mermaid/tool-mermaid/package.json` 跟到 `0.2.0-rc.1`。家族版本规则要求如此，上游没有任何提交会动它没有的包，而跨次版本位使这是一次次版本递增而不是又一个候选版递增。
- `packages/client/ui-theme/tests/expected/radius-exceptions.expected.json` 补上 `ModelsSection` 的圆角条目。越界圆角门禁把每个客户端样式表与一份精确的期望清单比对，`ModelsSection.module.css` 在切换芯片上设了 6px 圆角以压过原语的取值，而这个例外从未登记——所以 `radius-styles` 自那个样式表落地起就在 fork 的 master 上失败，早于本窗口。6px 不匹配任何 `--dsw-radius-*` token（阶梯是 4、8、12、16、20、28），所以这个值该落在例外清单里，而不是换成会改变渲染尺寸的 token。

## Alternatives considered

**手工编辑配对记录、采用上游的哈希。** 否决：合并后的章节与两侧正文都不同，任一哈希都是错的，配对门禁会报出一个它无法担保的配对。记录是派生产物，重新录制正是校验器给出的操作。

**把圆角改到共享 token 上。** 本窗口否决：它改的是上游拥有的样式表，把渲染出的芯片尺寸从 6px 变成 4px 或 8px，还要为一次本同步没做的改动重录快照。例外清单正是这个测试为这种情况提供的机制。

**重录被改动的录制场景。** 不需要也没有尝试：本窗口唯一触及 fork 的工具描述改动经由 `mermaid_render` 到达，而上游没有这个工具，fork 的条目在每个合并后的 sidecar 里都存活。重录需要 API key，还会为没有差异的内容改写跨平台基线。

## Consequences

- fork 运行在 `0.2.0-rc.1`；`SESSION_FORMAT_VERSION` 保持 4。窗口的持久化改动是表示层的，`verify-persistence-changes` 报告 62 个 root 全部匹配 7 条历史记录，因此 fork 不新增自己的确认。
- fork 存活的独有工作不变：`tool-mermaid` 包及其 Web 渲染与随后的可缩放视口、`ui-settings-models` 的 `maxRetries` 控件与每模型推理档位、`llm-pi-ai` 的 `x-opencode-session` 头、`agent-preset-registry` 里改名前的 preset id 映射，以及 `reicon-react` 浏览器开发依赖。
- 上游在本窗口把 Koffi 钉到一个已验证的原生版本。`Pack npm tarballs` 作业从注册表而非 lockfile 解析依赖，因此一次在缺少匹配预编译产物的 Node 版本下失败的 Koffi 源码构建会让该作业变红，且与任何分支无关；`koffi@3.3.2` 在 fork 上一次打包变绿之后发布，就是当前的实例。
- 合并后的树上已验证：typecheck、lint、build、`hygiene`（18 个门）、`doc-sync`（42 个门）、`verify-persistence-changes`、`test:expected`（108 个测试）与 `test:snapshot`（175 通过、2 跳过）。登记上述例外后 `radius-styles` 单测通过。
- `snapshots/acp` 的 `escalation-approved` 与 `snapshots/session/fs-delete-recreate` 在本机失败：两段录制都捕获了 shell `rm`，而本机运行时把 `rm` 路由为可恢复删除，给录制的 stdout 多加了一行 `mavis-trash: moved to trash:`。重录会把主机特有的行固化进跨平台基线。
- `pnpm run test` 另外报出两处失败，`hooks-claude-code` 的 `coverage-stop` 与 `ptc-runtime-python` 的 `runtime`，都是 5 秒超时，单独跑该文件即通过；本机跑全量套件比这两处允许的预算更慢。
- `scripts/smoke-python-runtime.py` 未在本地运行：`--installed-wheel` 需要构建好的 wheel 与干净的虚拟环境，只有 CI 作业提供。这是本窗口检查清单里唯一没有本地证据覆盖的门禁。
