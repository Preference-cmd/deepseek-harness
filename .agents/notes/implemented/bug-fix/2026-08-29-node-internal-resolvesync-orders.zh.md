# Agent Note: Resolve the Node-internal resolveSync across its parameter orders

Status: implemented

[English](2026-08-29-node-internal-resolvesync-orders.md) | 中文

## Problem

在 Node 24.11 上,`dsh web` 下发的 `window.__DSH_BOOT__` graph 是空的——`"entries":[],"batches":[]`——浏览器因此报 "Failed to load plugins: client-modules: HTML did not preload `@deepseek-ai/dsh-client-modules/client.js`"。`ClientModuleRegistry` 把 119 个已解析包全部归类为"永久不是 client 行"。链条是:`locatePkgJson` 经 Node 内部 loader 解析行包名,而 `ModuleLoader.fromInternal` 在所有 Node ≥ 24 上都给裸内部对象打 `v2` 标签;Node 24.11 的这个对象实现的仍是标签声称已被替换的旧 `(specifier, parentURL, attributes)` 参数序,且实现依赖接收者——于是 v2 形状的调用对每个包名都抛错,包括那些明明能加载的包。

## Decision

`resolveInternalModuleUrl` 先按标签参数序尝试、再按另一参数序尝试,并且每次都把 `resolveSync` 作为内部 loader 的方法调用——把函数提取出来会丢失接收者,连正确参数序也会跟着失效。两个参数序都拒绝时仍返回 `undefined`,真正无法解析的包名保持既有的"永久不是 client 行"分类。带接收者校验的 fake 覆盖了"标签参数序 × 实际参数序"矩阵。

## Alternatives considered

**在 `vendor/loader` 的 `fromInternal` 里规范版本标签。** 否决:这是对 vendored 源的修改,影响所有 loader 消费方,而需求只来自一个调用方;签名探测同样要遵守接收者规则才算诚实。

**放弃内部解析器,改用 `createRequire` 走查。** 否决:内部解析器遵循 Loader 当前生效的 ESM hooks,与该行自身 import 使用的解析一致;`require` 走查的判定结果会和实际加载行为分叉。

## Consequences

- Node 24.11 上 boot graph 恢复组合(45 个 client 条目、bootstrap 与 application 两个批次),web 外壳能收到它等待的模块注册。
- 未来某个 Node 版本若恢复了新参数序,依然工作:标签参数序先行,回退只在必要时运行。
- 上游带着同样的缺陷;在此之前这是 fork 本地修复。

## Related

同一"同步后修复"系列的另一篇见 [fork 客户端代码再对齐](../bug-fix/2026-08-28-realign-fork-client-code-after-upstream-sync.zh.md)。
