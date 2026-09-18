# Agent Note: 将上游 master (0.1.6-alpha.2) 同步至本 fork

Status: implemented

[English](2026-09-18-sync-upstream-0-1-6-alpha-2.md) | 中文

## 问题

上游相对 fork 的 0.1.6-alpha.1 基线前进了 882 个提交，并发布了 `0.1.6-alpha.2`。这一窗口主导的是产品面而非核心循环：桌面端从 100 个文件增长到 291 个，插件管理成为一级架构接缝，动态 Cordis 工具集被大幅裁撤，上游还替换了 profile 的模块解析方式。

其中三项改动直接落在 fork 独有工作上。`packages/boot/plugin-manager` 与 `packages/client/ui-plugin-manager` 现在承担插件启停，而一个未完成的 fork WIP 恰好伸向这里。`ui-settings-models` 卡片围绕共享的 `ModelRow` 重写，而 fork 的每模型推理声明就落在这里。present 工具从 `fs` 分组迁入 `packages/deliverables/tool-present`，而 fork 的工具目录与路径映射都引用了它。

## 决策

合并将上游 `0.1.6-alpha.2` 引入 `sync/upstream-0.1.6-alpha.2` 分支，形成双父级 merge commit，父提交分别为 fork 主干与上游发布。共 16 个文件冲突；生成的目录文档与录制夹具一律以「取上游录制、再回贴 fork 增量」解决，从不手改录制字节。

- `packages/client/ui-settings-models`：以上游的 `ModelRow` 与 `ModelInputTypes` 为基底。fork 的推理档位声明移入 `ModelRow`，作为可选的 `reasoningLevels` 控件，仅由 pi-ai 目录编辑器传入，因此 DeepSeek 编辑器的标记与上游完全一致。fork 的静态输出模态展示被删除：它是一枚永远禁用、永远按下的胶囊，指向模型草稿并不携带的字段，既不声明任何内容，也没有可融合的上游对应物。
- `packages/core/tools/tests/gen-tool-catalog.spec.ts`：上游的 `plugin_manager` 与 fork 的 `mermaid_render` 按字母序合并为一份期望。
- `tsconfig.base.json`：fork 的 `@deepseek-ai/dsh-tool-mermaid` 路径与上游迁移后的 `@deepseek-ai/dsh-tool-present` 路径同时保留。
- `packages/client/ui-primitives/package.json`：同时保留 fork 的 `mermaid` 依赖与上游的 `simple-icons`。
- `packages/experimental/webworker-packer/tests/image-loadable.spec.ts`：以上游更严格的 `pluginPackages` 断言取代 fork 的宽松 getter，因为它钉住了解析器必须执行的查询名。
- `docs/config-catalog.*`：上游的 `tool-cordis` 依赖行（不再有 `dynamicCordisRunner`）加上 fork 的 `mermaid` 行，并重新记录双语配对。
- `scripts/snapshots/python-sdk-single-exe/*`：以上游刷新后的录制为基底，按排序位置回插 `mermaid_render`。这些夹具由 CI 中的 `scripts/smoke-python-runtime.py` 比对，无法在本地重新生成，因此插入采用文本方式并保留录制格式。

随同步一并落地两项 fork 侧清理：

- 删除孤立的插件启停 WIP。其主机侧 `pluginInventory.toggle` Remote 方法、`.toggleButton` 样式与 `enable`/`disable`/`toggling` 三个 locale 键都没有消费方：fork 的客户端对齐提交删掉了调用 `toggle(entryId)` 的设置页 UI，却留下了主机侧代码，而 2026-09-15 同步 note 中「该功能完好保留」的说法并不准确。上游的 `pluginManager` 服务现已承担该能力，因此这些残留被删除，而非合并进重写后的网关。
- 上游刷新的请求期望与本 fork 工具目录重新对齐：五个 `tool-schemas.expected.json` 与 `minimal-preset` 内联快照补上 `mermaid_render`。`test:snapshot:refresh` 写入 `writer.expected.jsonl` 的纯时间戳变动被还原，因为那些值是录制时钟而非内容。

## 考虑过的替代方案

**在上游重写后的网关上保留 fork 的 `pluginInventory.toggle`。** 否决：没有调用方，上游的 `pluginManager` 以服务、模型工具与网页 UI 覆盖同一操作，保留第二条启停路径会让同一条生命周期存在两个真相。

**在共享的 `ModelRow` 中恢复 fork 的输出模态胶囊。** 否决：该胶囊始终 `disabled` 且始终按下，模型草稿也没有输出模态字段，它展示常量而非编辑任何内容。

**保留 webworker-packer 夹具中 fork 的宽松 `get: () => undefined`。** 否决：上游版本断言解析器按名称查询 `pluginPackages`，而这正是 fork 上一次同步提交添加该 getter 所要保护的行为；较弱的写法在查询消失后仍会通过。

**手工合并 python-sdk 录制夹具。** 否决：它们按名称与位置与实时的 Python 单文件可执行程序运行结果比对，录制才是权威，只回插 fork 的工具名。

## 影响

- fork 运行在 0.1.6-alpha.2。`SESSION_FORMAT_VERSION` 仍为 3，窗口内没有破坏性提交，因此不需要 session 日志迁移。
- fork 存活的独有工作为：`tool-mermaid` 包及其网页渲染、settings-models 的最大重试次数控件与每模型推理档位，以及 `llm-pi-ai` 的 `x-opencode-session` 头。
- `packages/deliverables/`、`packages/document/office-to-pdf`、`packages/skill/skill-office`、`packages/boot/hmr` 与 `packages/client/ui-plugin-manager` 对 fork 而言是新增；动态 Cordis 工具集已移除，持久化插件编写改走 bundle 与 `plugin_manager`。
- 以默认源码模式运行快照车道（`DSH_EXAMPLE_MODE` 未设置的 `pnpm run test:snapshot`）会报 `Cannot read properties of undefined (reading 'prepare')`：上游新的解析模式从 `lib` 加载插件，而 tsx 仍把这些插件内对 `@deepseek-ai/dsh-tools` 的导入重写到 `src`，于是运行中的 `ToolRuntime` 与 agent loop 持有不同的 `TOOL_RUNTIME_SCHEDULER` 符号。上游自身的 0.1.6-alpha.2 代码树表现完全相同，因此这不是合并缺陷；门禁车道会设置 `DSH_EXAMPLE_MODE=lib`（`scripts/run-gates.ts`）并通过。fork 是继承而非引入了该行为，修复归属上游。
- 合并树上已验证：typecheck、build、`doc-sync`（41 个门禁）、lib 模式下的 `test:snapshot` 与 `test:expected`、lint，以及受影响包的聚焦单元测试。
