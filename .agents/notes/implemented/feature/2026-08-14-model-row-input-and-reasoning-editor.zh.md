# Agent Note: Edit input modalities and reasoning levels on a custom-provider model

Status: implemented

[English](2026-08-14-model-row-input-and-reasoning-editor.md) | 中文

## Problem

`settings.yaml` 本就能声明手工声明 pi-ai 模型的 `input`（[[2026-08-12-pi-ai-route-default-input-modalities]]）与 `reasoningEfforts`（[[2026-08-08-pi-ai-per-model-reasoning-declarations]]），但 Models 页的逐行编辑器只写 `id`、`name` 和两个容量。因此，通过 Web UI 添加自定义提供方的用户既无法把一个视觉模型标成可收图，也无法声明模型支持的推理档位：这类模型被物化为纯文本、非推理，图片在准入处被拒且无处补救，输入框也不提供档位选择器。

## Decision

每条 pi-ai 模型行的折叠区现在以共享 `Pill` 原语上的芯片编辑输入模态与推理档位；模态芯片带一个 Reicon 图标，推理芯片带文字：

- **输入模态**是两个图标芯片：一个锁定的 `Text` 芯片（文本始终被接受，因此禁用且不可切换）和一个 `Image` 切换按钮，选中时写 `input: [text, image]`，未选中时写 `input: [text]`。
- **输出模态**是一个锁定的 `Text` 图标芯片：聊天输出始终是文本，因此该组只作展示、不写入任何字段。
- 六个推理档位芯片（`minimal` 到 `max`）：按选中的档位把 `reasoningEfforts` 写成 `{ off: null, <档位>: <档位> }`。`off` 从不作为芯片提供：对推理模型它是隐式的（`off: null`，即「支持、发空」），对非推理模型则毫无意义。一个档位都不选中的行写 `reasoningEfforts: false`——即非推理模型——而绝不是一个解析器会拒绝的空字典。
- 线值拼写固定为档位名，这是大多数 OpenAI 兼容网关作为 `reasoning_effort` 接受的值；逐档重命名与 `compat.supportsReasoningEffort`/`thinkingFormat` 仍留在 `settings.yaml`。
- 折叠区按钮的文案由**容量**改为**更多**，因为该折叠区现在承载的不只是两个 token 数。

这单独反转了 [[2026-08-12-pi-ai-route-default-input-modalities]] 中「没有任何配置界面编辑 `input`」这一句（限于 `input` 与 `reasoningEfforts`），并把 [[2026-08-08-pi-ai-per-model-reasoning-declarations]] 的声明暴露到 GUI。那些 note 所拥有的解析链不变——按钮写入的正是手写文档会写入的值。

## Alternatives considered

**复选框，如最初所交付。** 被用户拒绝，用户要求按钮样式的可选中 chips；`Pill` 原语已经提供了 active/hover 外观，输入框也用同样的切换习惯选择档位。

**把模态图标手绘进 `ic_ds_*` 集合。** 拒绝：该集合没有 image/audio/pdf 图标，而从 Figma 新提取比这项决策所值的更费工。本页转而引入 `reicon-react` 来取所需的两个图标（`Text`、`Image`）；Reicon 的目录也覆盖了暂缓的 `video`/`audio`/`pdf`，留待后端词汇扩展时使用。

**逐档的线值拼写编辑器。** 作为范围外拒绝：拼写 = 档位名已覆盖常见的 `reasoning_effort` 场景，逐档暴露拼写字段会挤占折叠区，并重新引入配置 note 刻意隐藏的 pi-ai 映射语义。

**把 `off` 作为独立按钮提供。** 拒绝：`off` 是推理模型的常量，而非模型提供的档位；提供它会允许一行读作「零档位推理」，那正是 `false` 已经表示的状态。

**改为路由级的 input 或推理控件。** 拒绝：两者都是按模型的能力；让路由 `reasoning` 默认值不进卡片的那条理由在此同样适用。

## Consequences

- 纯 GUI 用户可逐模型声明视觉与推理；`resolveModelInfo` 通过既有 seam 上报它们，因此输入框的档位面板与图片准入门无需改动即可点亮。
- 图片与推理控件在首次触碰时写入显式值；一旦触碰，覆盖的内置目录模型不会靠「全不选」回到「继承」——`false` 与 `[text]` 才是诚实的显式拼写，恢复继承靠的是整数组的重置按钮。
- `compat`（线方言）与逐档拼写仍是 settings 文档专属；一个 `reasoning_effort` 词汇与 pi 档位名不同的私有网关，仍需 `settings.yaml`。
