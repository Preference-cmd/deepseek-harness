# Agent Note: Realign fork client code with the upstream client rewrite

Status: implemented

[English](2026-08-28-realign-fork-client-code-after-upstream-sync.md) | 中文

## Problem

2026-08-28 的 upstream 同步(dsh-0.1.2-alpha.1)重写了 web 客户端,合并时共享文件都取了上游版本。fork 自有的客户端代码因此还在说重写前的词汇:从已删除的 `@deepseek-ai/dsh-client-runtime` 导入、fork 加进插件设置 locale 包的 `webSearchManager*` 键在合并后的 locales 里丢失、`PluginEntryId` 从 `@deepseek-ai/dsh-api-remotes/client` 挪到了宿主 plugin-inventory 包、还有一条按重写前控制器与 RPC 信封写的 seat 测试。二十六个类型错误让 `pnpm run typecheck`——pre-push gate——拒绝每一次推送。

## Decision

fork 客户端代码按当前词汇重新对齐。`SettingsScope` 改从 `@deepseek-ai/dsh-client-ui-settings/client` 导入、`SnapshotStore` 改从 `@deepseek-ai/dsh-client-store` 导入;`webSearchManager*` 键以双语回到插件设置 locale 包;`PluginEntryId` 改从 `@deepseek-ai/dsh-host-plugin-inventory` 导入。fork 加的那条 seat 测试被删除而不是移植:它断言的是重写前控制器的 stage 存活语义——宿主接受选择后跨多次 load 保持显示——上游已用"消费一次、此后由 summary 事件驱动显示"取代,该生命周期由上游自己的套件覆盖("spends the stage exactly once"、"applies the stage to the blank session the flow lands on")。

## Alternatives considered

**在 seat 控制器里恢复 stage 存活语义。** 否决:上游是有意重构芯片显示的,而且该测试与上游对同一控制器的既有覆盖相矛盾。

**采用上游的 webSearch 卡片并删除 fork 的管理卡片。** 就本次而言否决:fork 卡片配置三个提供方(DeepSeek、Exa、Perplexity),上游只覆盖一个,fork 表面仍承载能力。两张卡的合并是待有需求再做的产品工作;同一"同步后取代"模式走到删除的案例见 [ui-turn-nav 退役](../simplification/2026-08-28-retire-dormant-ui-turn-nav-stub.zh.md)。

## Consequences

- `pnpm run typecheck` 转绿,pre-push gate 得以运行。
- 插件配置页同时渲染两张 web-search 卡:上游的单提供方卡片与 fork 的多提供方管理卡片。
- 未来若合并两张卡,即取代本 note 记录的键恢复。
