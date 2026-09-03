# Agent Note: 退役 fork 的 web-search-manager 与 tool-search 包

Status: implemented

English | [中文](2026-09-03-retire-fork-search-packages.md)

## Problem

fork 带有两个上游从未有过的搜索包：`packages/web/web-search-manager`（DeepSeek/Exa/Perplexity 统一提供方管理器）与 `packages/tool-search/tool-search`（面向模型的 `tool_search` 发现工具）。两者在仓库门禁上都有长期失败：manager 的提供方注册测试失败，因为 schemastery 会把缺失的提供方节展开成全默认对象，单配 Exa 时报 `WEB_PROVIDER_AMBIGUOUS`；tool-search 的索引测试失败，因为 `createSearchIndex()` 返回 `ready: false`，而测试期望 `true`。manager 还与录制会话快照存在结构性冲突：fork 的 base bundle 禁用了直连 `web-search-deepseek` 行、改由 manager 注册提供方，而 `web-search-endpoint-guidance` 快照 composition 按直连提供方行配置 `apiKey: snapshot-key` 录制，回放时得到 `WEB_PROVIDER_CREDENTIAL_MISSING` 而非录制的 401。两个包除 fork 自己的 bundle 行外，没有任何 shipped profile 引用；manager 的设置卡（`WebSearchManagerCard`）从未被挂载，实际 shipped 的只有直连 `WebSearchCard`。

## Decision

fork 不再携带这两个包。删除 `packages/web/web-search-manager` 与 `packages/tool-search/tool-search`，连同它们的 bundle 行、bundle 依赖行、`tsconfig.host.json` / `tsconfig.client.json` 工程引用，以及从未挂载的 manager 设置卡（`WebSearchManagerCard`、`ProviderCard`、`ToggleSwitch`、各自的 controller、样式与 locale key），并重新生成 `pnpm-lock.yaml`。base bundle 的 `web-search-deepseek` 行恢复上游形态（`apiKeyEnv: DEEPSEEK_API_KEY`），`searchProvider: deepseek-official` 重新经直连提供方解析。

## Alternatives considered

**修复而不是删除。** 本次不采纳：manager 需要围绕 schemastery 默认展开语义重写 `syncProviders` 的存在性检查，tool-search 需要修正 index-ready 约定，快照 composition 需要 manager 感知的变体。三处是彼此独立、且没有现实需求的产品修复；直连提供方与上游工具集已覆盖搜索能力。

**保留但停用。** 不采纳：两个包占着 bundle 接线、工程引用与 lockfile 体积，而它们为之服务的快照回放与设置卡面恰恰被它们自己破坏。

## Consequences

- 网页搜索经直连 `web-search-deepseek` 提供方、走上游配置路径解析；`web-search-endpoint-guidance` 快照重新对录制端点回放。
- 归因于这两个包的 fork 门禁失败（`verify-tool-catalog`、`verify-tsconfig-paths`、`verify-cordis-config`、package-invariant）清除；其余 fork 债（mermaid、settings-models）不受影响。
- 未来重做多提供方管理，应是针对当前 `ctx.web` 选择语义与 manager 感知快照 composition 的新包，而非复活已删代码。
