---
description: "面向模型的 Mermaid 图表工具：校验图表源码并交由浏览器端渲染。"
kind: "package-reference"
---

# @deepseek-ai/dsh-tool-mermaid

[English](README.md) | 中文

## 概述

`tool-mermaid/` 包在 `ctx.tools` 上注册一个面向模型的工具 `mermaid_render`。该工具校验图表源码非空，按首关键字识别其类型，原样返回源码。渲染发生在网页客户端：工具返回的面向模型结果是一个 `mermaid` 围栏代码块，客户端的 markdown 渲染器将其画成图表。主机端不调用任何渲染器，也不持有浏览器依赖。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

把本插件装到工具运行时旁边，即注册带必填 `diagram` 字符串参数的 `mermaid_render`。希望模型能画图的部署挂载本包（例如通过[示例 patch 覆盖层](examples/cordis.yml)），并提供网页客户端，由客户端负责渲染。

| File | Role |
|---|---|
| [`src/index.ts`](src/index.ts) | 插件入口：`Config`、`mermaid_render` 定义、类型识别、围栏结果渲染 |
| [`src/types.ts`](src/types.ts) | `MermaidDiagramType` 与校验后的 `MermaidRenderResult` |

本包不发布运行时 invariant 伴生，因为这个无状态适配器不拥有独立状态与事件协议；执行关系由它调用的工具缝面拥有。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>Implementation internals — click to expand</summary>

本节解释工具背后的设计取舍；可观察行为已在 [Use this package](#use-this-package) 完整覆盖。

### 设计理念

校验在主机，渲染在浏览器。工具只检查源码非空，并为结果元数据分类；语法错误在客户端渲染时报告，由 mermaid 引擎指出出错行。这种分工让主机保持零依赖（无 Chromium、无 jsdom），而本就负责解析与排版图形的浏览器完成绘制。

### 源码地图

| File | Role |
|---|---|
| [`src/index.ts`](src/index.ts) | 插件入口：`Config`、工具组合、`mermaid_render` 执行器 |
| [`src/types.ts`](src/types.ts) | `MermaidDiagramType` 与校验后的 `MermaidRenderResult` |

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

包级约定不够时再读这些页面。

- [Generated tool catalog](../../../docs/tool-catalog.zh.md#deepseek-aidsh-tool-mermaid) — 本包注册的完整 schema。
- [Example patch overlay](examples/cordis.yml) — 在 base 组合上挂载本工具。

-----

<a id="model-experience"></a>
## 模型体验

### 工具 schema

#### 模型看到什么

模型看到生成的 [`mermaid_render` schema](../../../docs/tool-catalog.zh.md#deepseek-aidsh-tool-mermaid)，只有一个必填 `diagram` 字符串参数。作用域工具限制可对单个 agent 移除该定义。

#### Token 影响

该工具视图下每个请求有固定的 schema 开销。

#### KV Cache 影响

可见工具定义与顺序不变时前缀稳定。注册生命周期或作用域限制可能使首个变化的 schema token 之后的复用失效。

### 工具结果

#### 模型看到什么

调用成功返回经校验的源码，以 `mermaid` 围栏代码块包装。空图表以 `mermaid_render: diagram must not be empty` 失败。

#### Token 影响

返回的源码随请求重发直到压缩；大图表与其它工具结果一样按请求计 token。

#### KV Cache 影响

只追加；新可见内容跟在可复用的请求前缀之后，不使已有 KV-cache 条目失效。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- 渲染依赖网页客户端：headless 与纯 API 部署只能拿到源码、看不到图。
- 语法错误在浏览器渲染时报告，不是工具错误；客户端展示引擎报错与出错行。
- 不支持 PNG / PDF 导出；浏览器就地渲染 SVG。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
