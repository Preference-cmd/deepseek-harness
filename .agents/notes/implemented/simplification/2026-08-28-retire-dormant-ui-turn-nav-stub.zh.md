# Agent Note: Remove the dormant ui-turn-nav stub

Status: implemented

[English](2026-08-28-retire-dormant-ui-turn-nav-stub.md) | 中文

## Problem

本 fork 曾以 `packages/client/ui-turn-nav` 承载回合导航栏,彼时上游没有该功能。上游 dsh-0.1.2-alpha.1 版本(2026-08-28 同步进 master)重写了 web 客户端并自带这一能力:`packages/client/ui-chat` 渲染导航栏(`TurnNavigator`,已接线 `ChatView`)。master 上残留的只是 PR #3 的占位 stub——`apply()` 是空操作——这个包却占着 web-app bundle 条目、bundle 依赖声明、`tsconfig.client.json` 项目引用和 lockfile 体积,而没有贡献任何行为。更完整的左侧栏实现在已退役的分支 `fix/bypass-ui-conversation` 上,其代码面向的是重写前的客户端架构(`@deepseek-ai/dsh-client-runtime`、`conversation.rail` slot 点),这些在 master 上已不存在。

## Decision

master 不再携带 `ui-turn-nav`。本次删除移除该包、web-app bundle 条目与依赖声明、client-face 项目引用,并重新生成 `pnpm-lock.yaml`。回合导航由 `packages/client/ui-chat` 提供;`apps/web` 的 e2e 覆盖通过 `Turn navigation` navigation role 定位导航栏,该名称由 ui-chat 的 locale 提供,因此该覆盖不依赖被删除的包。

## Alternatives considered

**保留 stub 不动。** 否决:它为一个空操作插件占着 bundle 接线、项目引用和 lockfile 体积,且包名容易与 ui-chat 的在用实现混淆。

**现在把分支的左侧栏设计移植到新实现上。** 就本次变更而言否决:上游导航栏握有全部集成点(chat-view 渲染、快照回合项),移植是真实的产品开发且没有现存需求。已退役分支将设计留作历史;未来若移植,应在 ui-chat 的 `TurnNavigator` 上扩展,而不是复活这个包。

## Consequences

- web 客户端只保留上游唯一的回合导航实现;在本 fork 的 master 上,本次删除同时让 client UI i18n gate 恢复通过。
- 重新引入 fork 侧导航栏变体意味着扩展 ui-chat 的 `TurnNavigator`;被删除路径上没有任何可供复用的残留。
