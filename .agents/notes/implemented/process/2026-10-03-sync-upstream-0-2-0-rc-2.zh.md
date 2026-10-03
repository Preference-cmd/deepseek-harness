# Agent Note: 把上游 0.2.0-rc.2 同步进 fork

Status: implemented

[English](2026-10-03-sync-upstream-0-2-0-rc-2.md) | 中文

## Problem

上游发布了 `0.2.0-rc.2`，比 fork 的 `0.2.0-rc.1` 基线前进 187 个提交。这个窗口落地了 Desktop 打包的 `dsh` 命令启动与安装守卫、从原生菜单管理该命令、composer 模型选择器在统一分组排序加粘性表头之上获得模糊搜索、从侧栏文件树打开工作区、用户提问的超时等待与迟到回复、到期的 Schedule 提醒被表述为定时用户消息，以及一批性能工作——Session 列表分片、流式工具参数处理设上界、降低长会话渲染开销。

窗口内有两处改动触及 fork 自己的表面。`ask_user_question` 新增 `mode: timed` 选项，因此 fork 工具目录里该包的条目在双语两侧都会变。新的 `@deepseek-ai/dsh-tool-schedule` 包贡献 `schedule_create`、`schedule_delete`、`schedule_list`、`schedule_update` 四个 model 可见工具，而 fork 的 recorded-session 与 Python 单文件工具清单会枚举它们。

上游 `master` 此后又比该 tag 前进了 258 个提交。本次同步以发布 tag 为目标，与此前每一次 fork 同步一致，因此这些提交被有意排除。其中 `f028f25667` 移除了运行时 invariant 插件与 `packages/runtime-diagnostics/invariants` 包，并删除了 `AGENTS.md` 中对应的规则。因为它落在 tag 之后，fork 保留该体系与那条规则；这个问题只在下次同步越过它时才重新出现。

## Decision

本次合并把上游 `0.2.0-rc.2` 并入 `sync/upstream-0.2.0-rc.2`，形成一个双父提交，两父分别是 fork 主线与上游发布。4 个文件冲突，全部是生成或派生的文档。在动工作树之前用 `git merge-tree` 空跑确立了这个数，而且输出必须落盘而不是接管道：接进 `head` 会提前关闭管道，`git merge-tree` 收到 SIGPIPE，被截断的那次运行多报了冲突数。

- `docs/tool-catalog.md`、`docs/tool-catalog.zh.md` 与 `docs/tool-catalog.i18n.yaml` 取上游文本后重新生成。两侧都改了 `ask_user_question` 那一行，所以两边记录的文本都不再成立。`gen-tool-catalog` 从工作区重写英文目录，这会恢复上游从未有过的 fork `mermaid_render` 行。中文目录是生成器不写的译文，因此 fork 此前已确认的 `mermaid_render` 表格行与详情段从合并前文本恢复，而不是新译。
- `packages/client/ui-primitives/README.i18n.yaml` 重新记录而不取某一边。两侧改了同一个 `component-catalog` 段，合并后的文本与两个记录的哈希都不匹配。

另有四处 fork 侧修复，都由门禁而非合并暴露：

- `packages/mermaid/tool-mermaid/package.json` 升到 `0.2.0-rc.2`。家族版本规则要求如此，且没有上游提交会去升一个上游没有的包。
- `scripts/rescope-vendor.ts` 新增三条 `GENERIC_SKIPS`：`packages/extensions/cordis-host-runner/tests/inspect-registry.spec.ts` 与两个 `snapshots/session/cordis-inspect-*/client-fixture.mjs` 夹具。三处命名的都是 `cordis/inspect-*` 事件域与 `cordisInspect` 服务，属 wire id 而非包引用，与已有的 `docs/event-producer-consumer.md` 条目同类。只有 `rescope-vendor` 门禁会报出它们。
- `scripts/snapshots/python-sdk-single-exe/scheduler-recovery/session.v3.jsonl` 与 `session.v4.jsonl` 的录制请求工具清单补上 `mermaid_render` 条目。该场景使用 advanced profile patch，fork 正是在那里注册自己的工具，而两条录制的头部都漏了它。只有 `python runtime / release-shaped matrix` 作业会断言这些清单，因为它拥有构建出的单文件运行时；同一作业在 `node24-linux-x64` 与 `node24-win-x64` 上失败，工具数组是它唯一的差异。其它场景的 v2 录制同样没有该条目，保持原样，因为harness按角色只比对最高世代。
- `docs/tool-catalog.i18n.yaml` 在恢复中文 mermaid 段之后第二次重新记录，因为恢复的段在被记录前属于未确认的译文。

## Alternatives considered

**合并 `upstream/master` 而非 tag。** 否决：会带入 258 个未发布提交，包括 invariant 移除，且 fork 的发布点将不再对应一个上游发布。此前每一次 fork 同步都在合并标题里写明上游发布版本，并据此打 `dsh-fork-` 标签。

**现在就删除 invariant 体系，跟随上游 `master`。** 本窗口否决：该移除不在本次同步的 tag 里，采用它会让 fork 与它声称跟踪的发布分叉。fork 的 `packages/runtime-diagnostics/invariants` 与 38 处 `./invariant` 导出保留。

**手写中文 `mermaid_render` 译文。** 否决：fork 已经带着这一行经过确认的译文，合并前文本就是那份译文。只有显式调用 `dsh-translate-docs` 才产出新的译文。

**重录 recorded-session 场景。** 不需要：唯一触及 fork 的工具清单变化是上游没有的 `mermaid_render` 条目，合并在每个录制件中都保留了它。重录需要 API key，且会为无变化的 delta 重写跨平台基线。

## Consequences

- fork 运行在 `0.2.0-rc.2`；`SESSION_FORMAT_VERSION` 保持 4。窗口的持久化清单变化是表示层面的，fork 不新增自己的确认。
- fork 存活的自有工作不变：`tool-mermaid` 包及其 Web 渲染与可缩放视口、`ui-settings-models` 的 `maxRetries` 控件与按模型的推理档位、`llm-pi-ai` 的 `x-opencode-session` 头、`agent-preset-registry` 中重命名前的 preset id 映射，以及 `reicon-react` 的 browser devDependency。
- 在合并后的树上已验证：typecheck、lint、build、`hygiene`（18 个门禁）与 `doc-sync`（43 个门禁）。`verify-tool-catalog` 报告重新生成的英文目录为最新，`verify-translation-pairing` 报告 1181 对全部一致。
- `test:snapshot` 与 `test:expected` 在执行本次同步的这台主机上没有产出可信结果，其结论交给 CI。两条约束互相冲突：仓库外的临时目录会让 vitest 报 `EPERM: operation not permitted, rename`，因为 agent 沙箱拒绝工作区之外的写入；仓库内的临时目录会让 `findProjectRoot` 向上找到仓库自己的 `.agents/skills`，把技能目录注入每个被启动应用的系统提示词，产生 148 个与本次合并无关的失败。在临时基目录放 `.git` 标记能修好技能污染那类，却会破坏依赖项目根发现一路走到文件系统根再回落到场景目录的夹具。这台主机自身的差异也在：`rm` 会被本地可恢复删除运行时回显一行 `mavis-trash: moved to trash:`，这是 `escalation-approved` 与 `fs-delete-recreate` 两处不匹配的已知成因，不构成重录的理由。
- `scripts/smoke-python-runtime.py` 掌管录制的工具清单，也是报出缺失 fork 条目的那个门禁。它没有在执行本次同步的主机上运行，因为 `--installed-wheel` 需要构建好的 wheel 与干净虚拟环境，只有 CI 作业提供；上面那条 `scheduler-recovery` 缺口由 CI 报出，修复所补条目的确切位置取自该作业自己的 diff。
- 运行时 invariant 的问题现在是下次同步的待办，而不是本次的悬而未决。
