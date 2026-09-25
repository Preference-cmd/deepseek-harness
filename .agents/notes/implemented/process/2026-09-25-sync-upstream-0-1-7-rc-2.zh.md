# Agent Note: 将上游 master (0.1.7-rc.2) 同步至本 fork

Status: implemented

[English](2026-09-25-sync-upstream-0-1-7-rc-2.md) | 中文

## 问题

上游相对 fork 的 0.1.7-rc.1 基线前进了 346 个提交，发布 `0.1.7-rc.2`。这一窗口吸收了多条长期分支——桌面 onboarding、快捷键重做、账号 provider 生命周期、Schedule 存储与自动化第一阶段——精简了每个工具描述中的约束文字（#5109），开始发出动态工具更新消息且其录制会枚举完整工具目录（#4844），在默认 Web 组合中禁用 shipped Schedule 与 time-context 插件（#5175），并合入后又回退了 timed-questions 的 UX 对齐（#4868、#5174）。

其中三项改动落在 fork 独有工作上。精简后的工具描述重写了所有携带 fork `mermaid_render` 条目的录制伴随文件，正是上一个窗口教会 fork 打补丁的那批文件。双语配对记录的格式变了（#5036，按标题节 key 化）：上游已迁移它自己的记录，因此剩下格式不合法的二十一份 `.i18n.yaml` 全是 fork 独有的。此外本窗口的新录制把完整工具目录投影进 `request/header` 事件与 SDK notifications，fork 条目因此在五个伴随文件之外又多了约两打插入点。

## 决策

合并将上游 `0.1.7-rc.2` 引入 `sync/upstream-0.1.7-rc.2` 分支，形成双父级 merge commit，父提交分别为 fork 主干与上游发布。十个文件发生冲突：五个生成目录工件、五个录制伴随文件。生成的目录文档一律由各自的生成器重写解决，录制的伴随文件一律取上游字节并把 fork 的 `mermaid_render` 条目回贴到其名称排序位置，两者都不手改录制字节。

- 上一窗口的五个伴随文件（`office-skills`、`multimodal-spill-ends`、`pwsh-tool-turn`、`persistent-pwsh-tool-turn` 的 tool schemas；`ptc-python-turn` 的 system prompt）取上游精简后的描述，`mermaid_render` 条目回到其排序位置。这次回贴保留了字面 UTF-8 长破折号：rc.1 同步的插入脚本曾把那四个 JSON 伴随文件改写成 `\u2014` 转义，而 fork 自身的惯例——`text-turn` 与其余伴随文件记录的都是字面长破折号——从来没有这种转义。
- 七个生成器复现目录：`gen-config-catalog` 补回 fork 的 `tool-mermaid` 行，其余生成器与合并字节逐字一致，`docs/tool-catalog.i18n.yaml` 在生成器收敛后需要 `verify-translation-pairing --write` 重录一次。
- 本窗口的全目录投影采用同样的插入，由关卡而非冲突暴露：`subagent-inheritance` 的 parent 期望（工具清单与 tool-addition 事件）、`dynamic-tool-updates`、`dynamic-tool-prompt-updates`、`plugin-manager-mcp` 的会话日志、SDK `dynamic-tool-updates` 的会话与 notifications 日志，以及 `dynamic-tool-updates` 的 tool schema 伴随文件（initial 与两份 change 快照）。

三项 fork 侧修补，分别由关卡或既有规则暴露：

- `packages/mermaid/tool-mermaid/package.json`：版本更新为 `0.1.7-rc.2`。家族版本规则（`verify-npm-install-layout`、`release:verify --family dsh`）照旧适用，且上游不会有提交去更新它没有的包。
- 二十一份 fork 独有的 `.i18n.yaml` 配对记录——三份 mermaid README 与十八篇 agent notes——经 `verify-translation-pairing --write` 迁移到按标题节 key 化的格式。没有任何配对的内容变化，重录的只是记录模式及其哈希。
- `scripts/rescope-vendor.ts` 本次无需改动：`rescope-vendor:check` 在合并后的树上通过，跳过清单无需新增。

## 备选方案

**重录变更场景而不是插入条目。** 否决：录制需要 API key，且插入的条目与 live fork 运行实际发出的内容——每次关卡失败的 Received 侧——完全一致，已通过场景比较的正是同一份条目。

**沿用 rc.1 留下的 `\u2014` 转义。** 否决：那是上一窗口插入脚本的产物，不是 fork 的惯例；取上游字节并插入纯 ASCII 条目，让这四个文件回到其余伴随文件共有的字面长破折号。

**fork 独有配对记录沿用旧格式。** 否决：检查器会把旧模式报为不合法，解析不了的记录证明不了任何事；迁移只是格式变化，没有需要评审的内容差异。

## 影响

- fork 运行在 `0.1.7-rc.2`，`SESSION_FORMAT_VERSION` 保持 4。
- fork 现存的独有工作不变：`tool-mermaid` 包及其 Web 渲染、`ui-settings-models` 的 `maxRetries` 控件与每模型推理档位、`llm-pi-ai` 的 `x-opencode-session` 请求头、`agent-preset-registry` 中的重命名前 preset id 映射，以及 `reicon-react` 浏览器 devDependency。
- 精简后的工具描述（#5109）与被禁用的 shipped Schedule/time-context 插件（#5175）由 fork 的所有组合与录制继承；被回退的对齐（#5174）让 timed questions 回到对齐前的结算行为。
- 已在合并后的树上验证：typecheck、lint、build、`hygiene`（18 门）、`doc-sync`（42 门）、`test:expected`（108 个用例），以及 `DSH_EXAMPLE_MODE=lib` 车道的 `test:snapshot`（182 通过、2 跳过——本机跳过的仍是那两个 pwsh 场景，本机未安装 `pwsh`）。
- rc.1 时期两个仅本机失败的场景（`snapshots/acp` 的 `escalation-approved`、`snapshots/session/fs-delete-recreate`）在这棵树上通过。
