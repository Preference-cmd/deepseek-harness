---
description: "返回 Mermaid 图表源码，由浏览器端渲染。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-mermaid-bundle

[English](README.md) | 中文

## Summary

为 profile 加上面向模型的 `mermaid_render` 工具。该工具校验图表非空后原样返回其源码；网页客户端把返回的围栏源码渲染为可缩放图表。该 bundle 默认关闭，选中后启用。

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitensions-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

安装与组合是分开的两件事：安装本包不会挂载它，profile 必须先选中该 bundle，之后才能配置它插入的行。

```sh
dsh plugin --profile web add @deepseek-ai/dsh-mermaid-bundle
```

选中该 bundle 的 profile 之后，可以按 id 覆盖插入的行。未选中它的 profile 永远不会注册该工具。

启用或停用该 bundle 会在运行中的 Host 里注册或移除 `mermaid_render`，因此每个 Agent 都会在下一次请求时看到这一变化。

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>实现细节 —— 点击展开</summary>

[`cordis.patch.yml`](cordis.patch.yml) 插入行 `optional-mermaid-diagrams`，把工具插件装载进全局工具层。[profile composer](../../boot/app-boot/README.zh.md) 负责 patch 的顺序与错误。

本 bundle 自身不含运行期代码；[`src/index.ts`](src/index.ts) 是空的，因为所有运行期条目都声明在 patch 里。

网页渲染器**不属于**本 bundle。`mermaid.tsx` 位于 [`ui-primitives`](../../client/ui-primitives/README.zh.md)，因为 harness 没有让插件贡献客户端 UI 的接缝。因此已落定的 ```mermaid 围栏无论是否选中本 bundle，都会在网页客户端里渲染；本 bundle 只决定模型能否主动索取图表。

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

[能力实现](../tool-mermaid/README.zh.md)

-----

<a id="model-experience"></a>
## Model Experience

间接通过[能力实现](../tool-mermaid/README.zh.md)体现，由它拥有模型上下文与结果。

#### KV Cache 影响

该层不直接添加任何请求内容；由能力实现拥有工具、提示与结果带来的缓存效应。切换 bundle 会改变运行中 Session 的工具列表，从而使它们的缓存请求前缀失效一次。

## Known Limitations and Deferred Work

<a id="known-limitensions-and-deferred-work"></a>

- 网页渲染器仍在 `ui-primitives`。在 harness 获得客户端 UI 插件接缝之前，本 fork 仍需补丁该包，所以此特性的渲染器那一半仍然承担与上游合并的成本。
- 图表源码在 Host 上从不被解析。语法非法的图表会抵达客户端，由客户端在图表位置渲染出语法错误。

-----

<a id="dev-note"></a>
### Dev Note

<details>
<summary>维护者上下文 —— 点击展开</summary>

包名保留 `@deepseek-ai/dsh-` 前缀，因为 `scripts/gen-tsconfig-paths.ts` 只为该前缀生成 `tsconfig.base.json` 的路径别名，而 `scripts/check-workspace-constraints.ts` 也据此应用 `@deepseek-ai/cordis` 的 peer 规则。若要以 fork 自有的 npm scope 发布，就需要重命名本包，并为 fork 补上所需的别名生成。

</details>