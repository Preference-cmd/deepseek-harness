# Agent Note: 将上游 master (0.1.7-rc.1) 同步至本 fork

Status: implemented

[English](2026-09-24-sync-upstream-0-1-7-rc-1.md) | 中文

## 问题

上游相对 fork 的 0.1.7-alpha.1 基线前进了 318 个提交，先后发布 `0.1.7-alpha.2` 与 `0.1.7-rc.1`。这一窗口把每次工具调用拆分为 preparing、start、result 三个阶段，为已安装插件强制执行 DSH peer 兼容性校验，重写了 Web 端代码卡片与 agent-team 头部面板，在致命恢复对话框之前写入桌面端崩溃报告，并把内部 DSH 工作区引用统一收紧为 `workspace:*` 与 `workspace:~`。

其中两项改动直接落在 fork 独有工作上。`packages/bundle/base/package.json` 与 `packages/client/ui-settings-models/package.json` 正是 fork 注册 `@deepseek-ai/dsh-tool-mermaid`、声明 `reicon-react` 浏览器 devDependency 的文件，而上游重写了这两个依赖块中的全部工作区区间。`snapshots/session/office-skills` 不再与 `text-turn` 共用伴随文件：上游让该场景自持 `system-prompt.expected.md` 与 `tool-schemas.expected.json`，把 `office-skills-no-renderer` 指向它们，并删除 fork 继承来的符号链接。这两个伴随文件记录的是上游的工具目录，因此必须回贴 fork 的 `mermaid_render` 条目。

## 决策

合并将上游 `0.1.7-rc.1` 引入 `sync/upstream-0.1.7-rc-1` 分支，形成双父级 merge commit，父提交分别为 fork 主干与上游发布。两个文件发生内容冲突，另有两个文件发生类型变更。生成的目录文档一律由各自的生成器重写解决，录制的工具 schema 伴随文件一律以「回贴 fork 的 `mermaid_render` 条目到其名称排序位置」解决，两者都不手改录制字节。

- `packages/bundle/base/package.json`：以上游的依赖块为准（含其工作区区间），并把 `@deepseek-ai/dsh-tool-mermaid` 放回 `dsh-tool-goal` 与 `dsh-tool-pwsh` 之间。
- `packages/client/ui-settings-models/package.json`：`dsh-client-ui-renderer`、`dsh-util-values`、`dsh-remote-mock` 取上游的 `workspace:*` 区间，同时保留 fork 的 `reicon-react` devDependency。
- `snapshots/session/office-skills/tool-schemas.expected.json` 与 `snapshots/session/multimodal-spill-ends/tool-schemas.expected.json`：取 `text-turn` 的规范 `mermaid_render` 条目，插入其排序位置，工具数分别为 23 → 24、25 → 26。`office-skills-no-renderer` 以 `office-skills` 作为其伴随文件来源，`multimodal-spill-middle` 与前者共用 `multimodal-spill` 这一 class pin，因此这两个场景比较的是同一批文件。
- `pwsh-tool-turn`（20 → 21）与 `persistent-pwsh-tool-turn`（17 → 18）采用同样的插入：它们的组合在 headless profile 上打补丁且未禁用 `tool-mermaid`，因此承载的是 fork 那份更大的工具目录。执行本次合并的机器上没有 `pwsh`，这两处改动没有本机运行记录；`test:snapshot` 在本机跳过这两个场景。
- `docs/tool-catalog.*`、`docs/config-catalog.*`、`docs/module-graph.*`、`THIRD_PARTY_NOTICES.md` 与组成参考包清单分别来自 `gen-tool-catalog`、`gen-config-catalog`、`gen-module-graph`、`gen-third-party-notices`、`gen-plugin-packages`、`gen-client-catalog`、`gen-dependency-catalog`。每个生成器重写出的内容都与合并结果完全一致，因此解决冲突后只有 `pnpm-lock.yaml` 需要二次写入。

## 备选方案

**让 `office-skills` 的伴随文件继续与 `text-turn` 共用。** 否决：上游自持的伴随文件记录的是一份与 `text-turn` 不同的 23 工具目录，共用文件会断言一个该场景已不具备的相等关系。

**pwsh 伴随文件沿用上游录制字节。** 否决：这两个组合都在启用了 `tool-mermaid` 的 headless profile 上打补丁，其录制内容恰好少 fork 的那一个条目，应适用同样的回贴。

**重录伴随文件而不是插入单个条目。** 否决：`test:snapshot` 的 refresh 只重写 stdout 预期输出，录制则需要 API key。所插入条目与 `text-turn` 中的条目逐字节一致，而后者正是四个已通过场景的比较基准。

## 影响

- fork 运行在 `0.1.7-rc.1`，`SESSION_FORMAT_VERSION` 保持 4。本窗口新增 app-boot 的插件兼容性预检、桌面端崩溃报告、voice-input 与 plugin-manager 的下载镜像选择，以及 cordis 4.0.4 的 vendor 升级。
- fork 现存的独有工作为：`tool-mermaid` 包及其 Web 渲染、`ui-settings-models` 的 `maxRetries` 控件与每模型推理档位、`llm-pi-ai` 的 `x-opencode-session` 请求头、`agent-preset-registry` 中的重命名前 preset id 映射，以及 `reicon-react` 浏览器 devDependency。
- fork 早先对检索包的退役无需重新施加：两侧都不再包含这些路径。
- 已在合并后的树上验证：typecheck、lint、`doc-sync`（42 门）、`test:expected`（106 个用例）、`test:snapshot`（173 个场景中 169 个通过、2 个跳过）。
- 有两个快照场景只在本机失败：`snapshots/acp` 的 `escalation-approved` 与 `snapshots/session/fs-delete-recreate`，其 bash 工具结果的录制文本为 `(no output)`，而本机 `rm` 会打印 `mavis-trash: moved to trash: …`。本次合并并未改动这两个场景，其录制字节保持不变。
