# Agent Note: 同步上游 master（0.1.5-alpha.2）到 fork

Status: implemented

[English](2026-09-10-sync-upstream-0-1-5-alpha-2.md) | 中文

## 问题

上游相对 fork 的 0.1.3-alpha.2 基线前进了 692 个提交（`c389f96bf3` 到 `b2e3b2a012`）：Session Log V3 格式发布（`SESSION_FORMAT_VERSION` 从 2 到 3，含 canonical envelopes、content-admission 修复与 migration coverage）、Sidebar 与交付文件栈重构（sidebarfeat、leftsideslot、artifact file actions、图片预览）、上线后又整体回滚的 Mermaid/Graphviz/SVG/HTML chat 预览、experimental Agent Teams 发布、新增 `tool-present` 交付工具、code-dispatch 到 ptc-dispatch 事件改名、客户端浏览器依赖约定迁移（运行时 `dependencies` 并入 `devDependencies`，通过随产品发布的打包器配置解析），以及 0.1.5-alpha.1/alpha.2 两个发布。fork 侧存活的独有工作（`tool-mermaid` 包及其网页渲染与 e2e、settings-models 编辑器）必须在合并中存活，且不能破坏收紧后的门禁。

## 决策

同步分支整体接受上游，8 个合并冲突按规则解决。每个冲突都是 fork 加法插入与上游加法变更相邻，因此两侧都保留：`tsconfig.base.json` 与 `pnpm-lock.yaml` 在新增的 `dsh-tool-present` 条目旁保留 `dsh-tool-mermaid` 条目；`gen-tool-catalog.spec.ts` 同时期望 `mermaid_render` 与 `present`；`docs/tool-catalog.md` 及其中文版保留 fork 的 mermaid 行，同时 `run_code` 行跟随上游的 `ptc-dispatch` 事件改名；`packages/client/ui-primitives/package.json` 遵循上游浏览器依赖约定，把 `mermaid` 声明在 `devDependencies`（浏览器输入通过打包器配置解析，与声明章节无关）；`docs/tool-catalog.i18n.yaml` 在 owner 文件合并后用 `verify-translation-pairing --write` 重录。`THIRD_PARTY_NOTICES.md` 以重生成代替手合：`mermaid` 只保留一条 Runtime 行（浏览器打包输入），纯类型的 `micromark-util-types` 只保留一条 Development 行。

## 备选方案

**按 fork 组合重录上游快照。** 否决：上游生成物是格式与行为变更，不是 fork 行为变更；重录只会为零行为差异分叉全部 fixture。

**保留 fork 旧的 `dependencies` 位置放 `mermaid`。** 否决：上游约定迁移是全仓行为且有机械门禁；浏览器 notices 生成器本就通过随产品发布的配置解析输入，保留 fork 独有的声明章节只会在每次同步时与门禁冲突。

## 后果

- fork 运行在 0.1.5-alpha.2，带有 Session Log V3、重构后的 Sidebar 与交付文件栈，以及 `present` 交付工具。
- mermaid 工具及其网页渲染、e2e 与 settings-models 编辑器仍是 fork 独有，且通过合并后的门禁（`verify-tool-catalog`、`verify-tsconfig-paths`、`verify-third-party-notices`、translation pairing、typecheck、lint）。
- fork 独有的浏览器图标输入 `reicon-react`（仅 `ModelListEditor.tsx` 使用，Host 侧是空 `apply()`）在 `ui-settings-models` 中从 `dependencies` 搬到 `devDependencies`，与 `mermaid` 遵循同一上游浏览器依赖约定；旧位置由 `Dependency layout` CI 门禁捕获。
- `pnpm run test` 为 22127 通过、1 个失败（`scripts/browser-bundled-externals.spec.ts` 的 "follows shell workspace aliases"）；该失败在干净上游树上可复现（Vite 对 macOS `/private/var` 临时目录的路径断言），因此归上游所有，不归本次同步。
