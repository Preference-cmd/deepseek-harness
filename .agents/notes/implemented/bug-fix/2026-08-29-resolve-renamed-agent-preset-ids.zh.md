# Agent Note: 解析持久化会话头在重命名前记录的 agent preset id

Status: implemented

[English](2026-08-29-resolve-renamed-agent-preset-ids.md) | 中文

## 问题

2026-08-25 的 code-mode→ptc 重命名把随附 preset 的 id 从 `code` 改为 `ptc`,并且按[重命名笔记](../architecture/2026-08-25-rename-code-mode-to-ptc.zh.md)的约定,会话持久化词汇有意保留旧名,直到 `SESSION_FORMAT_VERSION` v0→v1 迁移落地。但持久化会话**头的 `agentPreset` id** 也是该持久化词汇的一部分,而重命名后没有任何机制继续应答它:`agentPresets.resolve('code')` 抛 `UnknownPresetError`,导致所有需要恢复(resume)一个记录为 `code` 的会话的操作都以 `resume failed ... preset "code" not found` 失败。

在 Web 应用中,这一根因呈现为用户报告的三连症状:重命名前创建的空白会话(新会话页的当前会话)无法恢复,预设芯片显示裸 id `code`(未知预设没有显示名),点任何预设都失败;`session/selectModel` 同样失败,模型座保持不变;若 `settings.default` 仍然写 `code`,新建会话也会以同样方式失败。

Web e2e 没有抓住这个问题,因为它们的种子会话与设置只使用当前 id。

## 决策

由拥有 preset 词汇的 `agent-presets` 包在 `resolve()` 中把重命名前的 id 映射到当前拥有该组合的 preset。映射表只包含组合不变的重命名(`code` → `ptc`),且真实存在旧 id 的目录仍然优先,所以 authored preset 可以复用任意名字。组合调用方记录的是映射后的 id(`mount`/`select` 记录解析出的 preset id),因此被切换的遗留会话在日志中写入的是当前名称。

这是被推迟的会话持久化词汇的对偶面:会话日志继续写 `code`,而 `resolve()` 是必须在 v0→v1 迁移改写词汇之前持续应答它的唯一接缝。

## 备选方案

**在会话控制器的 resume 路径恢复无法解析的 preset(让空白会话按部署默认组合)。** 本次修复不采用:那会静默改变被重命名会话的组合(部署默认 `standard` 而非记录的 `code`/`ptc`),空白会话回退是另一个产品问题,与忠实的 id 映射不同。它仍是通用的"preset 被删除"场景的候选方案,本笔记刻意不覆盖该场景。

**在 roster 中列出遗留 id。** 不采用:选择器不应提供任何目录都不存在的 id;映射的存在是为了应答持久化记录,不是为了重新宣传已重命名的 preset。

## 影响

- 记录为 `code` 的会话以 `ptc` 组合恢复;预设切换与模型切换在其上可用;`settings.default: code` 在用户更新前也能用于会话创建。
- `resolve('code')` 成功,authoring 路径(`copy`/`delete`)同样解析重命名后的组合;删除 `code` 会落到随附的 `ptc` 行,被只读守卫拒绝,这是既有的随附 preset 保护。
- 芯片在会话被切换前仍显示裸记录 id `code`;客户端对遗留 id 的命名延迟到重命名词汇迁移。
- 通用场景——会话记录了一个已被部署删除的 preset——仍然按设计大声失败,无法恢复。