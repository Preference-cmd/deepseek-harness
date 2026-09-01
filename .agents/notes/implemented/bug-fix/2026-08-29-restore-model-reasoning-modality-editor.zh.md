# Agent Note: 恢复在 upstream 同步合并中丢失的逐模型推理与模态编辑器

Status: implemented

[English](2026-08-29-restore-model-reasoning-modality-editor.md) | 中文

## 问题

2026-08-28 的上游同步合并(`65ca80f16c`,dsh-0.1.2-alpha.1)采用了上游重写后的 `ModelListEditor.tsx`,覆盖了 fork 的逐行 disclosure——它原本编辑自定义 provider 模型的输入模态与推理档位([特性笔记](../feature/2026-08-14-model-row-input-and-reasoning-editor.zh.md))。周边词表幸存——locale key、chips 的 CSS、`Pill` 原语与组件测试都在——但编辑器本体及其 `reicon-react` 依赖丢失了,模型设置页再次只能声明 `id`、`name` 与两个容量。三个幸存的测试变红;在真实 GUI 中,自定义 provider 的视觉与推理声明无法再编辑(无法标记视觉模型,部署配置声明的模型也不出现推理档位选择)。

## 决策

把丢失的编辑器移植回当前(重写后)的 `ModelListEditor.tsx`:

- disclosure 恢复输入模态 chips(锁定文本 + 图像开关)、只读的输出模态 chip,以及六个推理档位 chips(`minimal`…`max`),写入 `reasoningEfforts = { off: null, <level>: <level> }`,全不选时存 `false`(非推理模型)——与原决策的 wire 拼写完全一致。
- `patch` 放宽为 `Record<string, unknown>`,因为 chips 写入数组、字典与布尔值,而不只是标量文本。
- `reicon-react@^1.2.0` 依赖恢复到包清单与 lockfile,与原始特性提交一致;`Pill` 接口与两个图标导出均未变。

合并还留下一个过期 golden:上游的 `models-settings/declared-edit.expected.md` 丢掉了 fork 的 `ProviderEditor` 仍渲染的 `retryPolicy.maxRetries` 字段。该文件已按当前渲染刷新(三行),models-settings web e2e 随之转绿。

## 备选方案

**让编辑器继续缺失。** 拒绝:上游没有逐模型推理/模态编辑器,若不恢复,仅用 GUI 的用户将永久失去为自定义 provider 声明视觉与推理的唯一入口。

**用内联 SVG 字形替代 `reicon-react` 重新引入控件。** 拒绝:原始决策已选定 Reicon 提供两个字形(Figma 的 `ic_ds_*` 集没有文本/图像字形),恢复同一依赖让移植与已评审特性保持字节级接近,而非重新争论字形来源。

## 影响

- 模型页的 disclosure 再次编辑自定义 provider 模型的输入模态与推理档位;composer 的推理档位选择与图片准入通过既有 `resolveModelInfo` 接缝自然生效,无需改动。
- 随合并变红的三个组件测试重新转绿;`ui-settings-models` 全套(232 个测试)通过,models-settings 与 default-model 两个 web e2e 在 replay 模式下通过。
- 本次移植是该同步后恢复的第二个 fork 特性,紧随预设 id 解析修复之后;未来的上游合并应把 `ModelListEditor.tsx` 与 `ProviderEditor.tsx` 视为 fork 自有文件。