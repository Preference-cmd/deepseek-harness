# Agent Note: 将上游 master (0.1.7-alpha.1) 同步至本 fork

Status: implemented

[English](2026-09-22-sync-upstream-0-1-7-alpha-1.md) | 中文

## 问题

上游相对 fork 的 0.1.6-alpha.2 基线前进了 1299 个提交，并发布了 `0.1.7-alpha.1`。这一窗口把 Session writer 提升到 V4，退休了四个包、新增二十个包，并重写了桌面端、账号、语音输入、jobs 与 shell 等界面。

其中三项改动直接落在 fork 独有工作上。`packages/preset/agent-presets` —— fork 的重命名前 preset id 映射原本所在之处 —— 被拆分为 `preset/agent-preset`（YAML 声明的组成组件）与 `preset/agent-preset-registry`（注册表服务），该映射因此失去了原有宿主包。`ui-settings-models` 卡片在与 fork 的每模型推理档位、`maxRetries` 控件相同的文件上被重写。`packages/client/ui-primitives/src/markdown/render.tsx`（fork 挂载 Mermaid 渲染器之处）把 `LinkIcon` 导出改名为 `LinkIconMedium`。

Python SDK single-exe 夹具新增了 V4 代，而 `scripts/smoke-python-runtime.py` 会按会话角色选取最高代，因此 fork 的工具现在必须出现在 V4 录制中，而不只是上次同步修补过的 V3。

## 决策

合并将上游 `0.1.7-alpha.1` 引入 `sync/upstream-0.1.7-alpha.1` 分支，形成双父级 merge commit，父提交分别为 fork 主干与上游发布。共 16 个文件冲突。生成的目录文档一律由各自的生成器重写解决，录制夹具一律以「取上游录制、再回贴 fork 增量」解决，两者都不手改录制字节。

- `packages/preset/agent-presets`（fork 有修改、上游已删除）：该包删除。其 `RENAMED_PRESET_IDS` 映射迁入 `packages/preset/agent-preset-registry/src/index.ts`：私有方法 `currentId()` 先在定义表中查找请求的 id，仅当没有任何定义提供该 id 时才回落到映射；`resolve()` 与 `retain()` 都调用它。`retain()` 是 `mount()` 与 `select()` 背后的激活路径，因此以重命名前 id 记录的会话既能被解析、也能被启动 —— 这正是该映射要防止的故障。
- `packages/client/ui-settings-models`：以上游的图标名（`IconChevronDownOutlineRegular`、`IconChevronRightOutlineRegular`、`IconTrashOutlineRegular`）与其 `customNeedsBaseUrl` 文案替换 fork 的版本；fork 的三个 `retryMaxRetries` 键与上游的三个 `protocol*` 标签在两种语言中同时保留。`ProviderEditor` 头部注释保留上游的 `cordis.patch.yml` 命名，以及 fork 关于「每模型能力位于该卡片所编辑的模型行」的陈述。
- `packages/client/ui-primitives/src/markdown/render.tsx`：fork 的 `useMermaidDiagram` 导入与上游的 `LinkIconMedium` 导入同时保留，与合并取用的上游 `LinkIconMedium` 调用点一致。
- `packages/core/tools/tests/gen-tool-catalog.spec.ts`：上游的 `load_workspace_dependencies` 与 fork 的 `mermaid_render` 按字母序合并为一份期望。
- `packages/session/session-persistence-jsonl/package.json`：上游的 `@deepseek-ai/dsh-session-format-v3-to-v4` 依赖取代 `dsh-session-format-v2-to-v3`，并删除 fork 重复声明的 `@deepseek-ai/dsh-llm` 键。
- `packages/host/plugin-inventory/tests/inventory.spec.ts`：以上游版本为准。fork 的改动只是改写了一个测试标题，而上游的标题陈述了该断言所检查的性质。
- `snapshots/session/ptc-python-turn/system-prompt.expected.md`：取上游的 `list_agents` docstring，并把 fork 的 `mermaid_render` 方法放回排序位置。
- `docs/config-catalog.md`、`docs/module-graph.*`：用 `scripts/gen-config-catalog.ts` 与 `scripts/gen-module-graph.ts` 重新生成，恢复 fork 的 `tool-mermaid` 行并重录双语配对。
- `scripts/snapshots/python-sdk-single-exe/{advanced,restart}/session*.v4.jsonl`：在每条录制的工具列表中，把 `mermaid_render` 插入 `job_output` 与 `run_code` 之间，与 V3 录制已有的排序插入一致。

## 备选方案

**在取代它的新包之外保留 `agent-presets`。** 否决：上游把一份词汇表拆成组件与注册表，保留第二个注册表会让 preset id 的含义出现两种定义。

**只移植 `resolve()`，照搬旧补丁的字面形态。** 否决：上游把激活路径移到 `retain()`，由 `mount()` 与 `select()` 直接调用；只在 `resolve()` 上映射会让以 `code` 记录的会话无法启动 —— 正是该映射要防止的故障。

**像上次同步那样只修补 V3 single-exe 录制。** 否决：smoke 脚本按角色选取最高代，因此 V4 录制现在才是被比对的那一份，V3 已成历史。

**手工合并生成的目录文档与配对记录。** 否决：这些内容由生成器拥有，它们在写入时同时重录配对哈希。

## 后果

- fork 运行在 `0.1.7-alpha.1`，`SESSION_FORMAT_VERSION` 为 4。该窗口新增 `docs/persistence-changes/2026-09-16-session-format-v4.*`、V4 定稿检查点与 `packages/session/session-format-v3-to-v4`；V3 转入历史格式。
- fork 存续的独有工作是带 Web 渲染的 `tool-mermaid` 包、settings-models 的 `maxRetries` 控件与每模型推理档位、`llm-pi-ai` 的 `x-opencode-session` 头，以及重命名前的 preset id 映射（现位于 `agent-preset-registry`）。
- `packages/client/ui-settings-unarchive-sessions`、`packages/experimental/agent-team-web-profile`、`packages/settings/settings-file`、`packages/preset/agent-presets` 均已移除；fork 承接上游的替代者，包括 `preset/agent-preset`、`preset/agent-preset-registry`、`session/session-format-v3-to-v4` 与 `skill/tool-workspace-dependencies`。
- 上游新增的 `AGENTS.md` 规则适用于 fork 的后续工作：不得新增指向 `unknown` 的断言，以及统一的 `dev:web` / `dev:desktop` 与 `make web|desktop|build` 启动命令。
