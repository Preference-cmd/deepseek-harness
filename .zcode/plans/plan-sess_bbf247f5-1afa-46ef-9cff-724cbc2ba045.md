# 分布合并计划：fork `alpha.3` → 上游 `alpha.4`（297 commits 分 7 批）

## 0. 基线与目标

- **当前 fork** `origin/master@12a77dc8bb` 已含 `alpha.3 (dd6322d604)` + 3 个 fork 修复（`tool-search` oxlint、`typecheck` 对齐）
- **上游目标** `upstream/master@4e84901e64` = `release/dsh-0.1.2-alpha.4`，领先 297 commits / 2371 files / +29k-21k
- **目标**：按上游 first-parent 的 13 个 Merge PR 收敛为 7 批，逐批合入、逐批过门禁，保留 5 个 fork 独有包不受损，最终 master 与上游语义一致且 `pnpm run check:all` 绿
- **非目标**：不处理跨 fork 的 `gh stack` 官方栈（同仓要求不满足），不改访客可见文案

## 1. 分批依据（first-parent 线性链）

```
dd6322d604 (alpha.3)
  5dd876025d #2907 session-log-read-api        } 批1
  9d15938073 #1148 code-runtime-python          } 批2
  714bec1316 #3367 omit-unneeded-invariants    } 批3
  52af48f808 #3250 steer-service                } 批4a  } 批4合并
  68488c552a #3403 model-discovery-headers      } 批4b  }
  dead2b2324 #3382 sdk-default-web-fetch       } 批5a  } 批5合并（内含 breaking 切分点）
  4bc0b000f5 #3411 smooth-corners              } 批5b  }
  876a3e0414 #3346 session-format-02-seq-brands } 批5c breaking }
  3efd4b51e0 #3415 turn-rail-preview            } 批6a  } 批6合并
  c3e5bd7dae #3418 ptc-note                     } 批6b  }
  1f694c88ab #3391 chatperf (27 commits)       } 批6c  }
  3c5b7097ae #3425 ptc-disable-workflow         } 批7a  } 批7合并
  4e84901e64 #3427 release alpha.4             } 批7b  }
```

收敛为 **7 个落地分支**（每批一个 PR，链式 base）：`sync/alpha4-01` ← `02` ← … ← `07`，用 `merge-forward`（`git merge <upstream-oid>`）而非 rebase，避免重写 fork 独有历史。`docs/AGENTS.md` 与 `dsh-merging-stacked-prs` 的“合并前验证、重写后重审”原则适用，但 `gh stack link/merge` 不适用（跨 fork）。

## 2. 分支与操作流

```sh
git fetch upstream --prune
git checkout -b sync/alpha4-01-session-log origin/master   # 批1底座
git merge 5dd876025d --no-ff -m "merge(upstream): #2907 session-log-read-api"
# 解决冲突 → pnpm install → 校验 → push → gh pr create --base master --head sync/alpha4-01-...

# 批2起每批以“上一批分支”为 base 创建
git checkout -b sync/alpha4-02-python sync/alpha4-01-session-log
git merge 9d15938073 --no-ff -m "merge(upstream): #1148 code-runtime-python"
# 同上…

# 依此类推至 sync/alpha4-07-release，顶层 PR 目标为 master，中间层 PR 目标为下一层分支头
```

- 每批 **提交信息保留上游 merge OID** 便于追溯
- 每批推前打 tag `backup/pre-alpha4-<n>` 便于回滚
- 冲突文件用 `git diff --name-only --diff-filter=U` 清单化解决，不做批量 `ours/theirs`

## 3. 逐批内容、风险与保留清单

| 批 | 上游范围 | 核心文件 | 风险 | fork 保留动作 |
|---|---|---|---|---|
| **01 session-log** | `dd6322d6..5dd87602` 265 files | `packages/core/session`, `typert`, `session-query`, `snapshots` | 低（纯增量 API） | 无冲突；跑 `test:snapshot` 归档 |
| **02 python** | `5dd87602..9d159380` ~180 commits | `packages/experimental/code-runtime-python`（后迁自 `packages/code-runtime-python`）、`tsconfig.base.json:paths`、`pnpm-lock.yaml`、third-party notices | 高（最大包、lockfile） | 保留 `reicon-react@1.2.0`、5 个 fork 包不被 `invariant` 巡检误删；合并后 `pnpm install` 取两端 lock 并集 |
| **03 invariants** | `9d159380..714bec13` 1432 files 1984+ /11468- | `packages/*/*/src/invariant.ts` 全量、`constraints`, `package-invariants` 门禁 | 中（扫仓删除） | 检查 fork 的 5 包 `invariant.ts` 是否被误删（`packages/mermaid`, `tool-search`, `web-search-manager`, `ui-settings-*`），误删则 `git checkout origin/master -- <file>` 恢复 |
| **04 steer+headers** | `714bec13..68488c55` 187+29 files | `packages/subagent/subagent/continuation.ts`(272行重写)、`internal.ts`、`tool-subagent-*`、`packages/llm/llm-pi-ai` headers | 高（fork 曾修 `reasoningEffort`） | 上游实现更广，丢弃 fork 的 `74a1d57d93` 补丁，以上游为准；确认 `ModelListEditor` 的 `reasoningEfforts` 写入仍经 `patch:Record<string,unknown>` |
| **05 web+format** | `dead2b232..876a3e04` | `packages/bundle/base/cordis.patch.yml`、`packages/bundle/web-app/cordis.patch.yml`、`session-format-02` 的 `SessionSeq`/`LogOffset` branded、`superellipse` 圆角/elevation | **最高**（唯一 `!` breaking + web patch） | 内部分两步提交：`05a web-fetch+smooth-corners` 先合，`05c session-format` 单独提交以隔离 `SESSION_FORMAT_VERSION` 语义变更；解决 `bundle/base` 的 `web-search-manager` 行（保留 `disabled:true` 的 `web-search-deepseek` 与 manager 行）与 `bundle/web-app` 的 `tool-search` insert 顺序 |
| **06 chatperf** | `876a3e04..1f694c88` ~27 perf | `packages/client/ui-chat`, `ui-conversation`, `conversation`, `trajectory`, `ui-primitives` | 中（fork 的 `ModelListEditor`/`ProviderEditor` 热区） | 按 `.agents/notes/implemented/bug-fix/2026-08-29-restore-model-reasoning-modality-editor.md` 为 oracle 保留 `REASONING_LEVELS`、`Pill` 芯片、`maxRetries` 字段；同步保留 `apps/web/tests/expected/models-settings/declared-edit.expected.md` 的 `retryPolicy.maxRetries` 行 |
| **07 ptc+release** | `1f694c88..4e84901e` | `packages/preset/agent-presets` (PTC 去 `workflow`)、`package.json` version、`config-catalog` | 低 | 无 |

**全局保留清单（每批合后核对）**
- `packages/mermaid/tool-mermaid/**`（未接线，防静默丢失；如需启用再另 PR 接 `bundle/base`）
- `packages/tool-search/tool-search/**` + `bundle/web-app/cordis.patch.yml:tool-search` 行 + `bundle/web-app/package.json:workspace:^`
- `packages/web/web-search-manager/**` + `bundle/base/cordis.patch.yml:web-search-manager` 行 + `bundle/base/package.json:3个 provider` + `dsh-web-search-manager`
- `packages/client/ui-settings-plugins/src/client/WebSearch*Card*`（保留 `WebSearchCard` 与 `WebSearchManagerCard` 双卡共存）
- `packages/client/ui-settings-models/src/client/ModelListEditor.tsx` 的 `input`/`reasoningEfforts` 芯片段 + `ProviderEditor.tsx` 的 `maxRetries` 段 + `reicon-react` 依赖
- `pnpm-lock.yaml` 的 `reicon-react@1.2.0` 两条目
- `.agents/notes/implemented/bug-fix/2026-08-28-realign-*` 与 `2026-08-29-restore-*` 两篇 note 视为合并 oracle

## 4. 每批校验（匹配 `docs/testing.md` 与 `scripts/run-gates.ts`）

- **必跑（<5min）**：`pnpm run typecheck`（`build:lib:host` + `typecheck:contracts-ready`）、`pnpm run lint`（oxlint）
- **按面跑**：
  - 动了 `packages/*/*/src` → `pnpm exec vitest run <changed package>`（不默认全量）
  - 动了 `session`/`typert`/`agent-loop`/`api/remotes` → `pnpm run build && pnpm run test:snapshot` + `test:expected`（会话可见即落盘）
  - 动了 `docs/*.md`/`*.i18n.yaml` → `pnpm run test:docs`（14 quick 门）；动了生成器 → 对应 `doc-sync` 单叶
  - 动了 `lib` 消费者（`client/*`, `host/webserver`）→ `verify-built-package-invariants` + `built-bin-smoke` 子集
- **批边界校验**（推前）：`pnpm run check:ci:static`（11 static + docSync 不含 build）与 `pnpm run test:coverage` 分区冒烟（`DSH_COVERAGE_PARTITIONS=2` 本地）；`05c` breaking 批额外 `test:snapshot:refresh` 与 Python SDK `scripts/snapshots/python-sdk-single-exe` 投影核对
- **全栈收口**（07 后）：`pnpm run check:all`（`run-gates check-all` 4 并发）+ `pnpm run hygiene` + `pnpm run build && pnpm run test:snapshot && pnpm run test:web:ci`（需 `DSH_SNAPSHOT=replay`），再开 PR 让 CI 的 9 路 `all-checks-passed` 绿

## 5. 冲突解决指引（热区）

- `tsconfig.base.json` / `pnpm-workspace.yaml` / `pnpm-lock.yaml`：手工合并，保留两端新增 `paths` 与 `importers` 条目，冲突后 `pnpm install --no-frozen-lockfile` 再提交
- `bundle/base|web-app/cordis.patch.yml`：以 `id` 为键三路比对，保留 fork 的 `web-search-manager` 与 `tool-search` 行，上游新增的 `ui-chat`/`ui-conversation` 行插入其间而非覆盖
- `ui-settings-models`：若上游改 `ProbeTarget`/`formatCapacity`/`pathOps`，仅置换外围，内部 `toggleImageInput`/`toggleReasoningLevel`/`setRetryMaxRetries` 逻辑原样保留
- `session` branded 迁移：`SessionSeq` vs `LogOffset` 的类型替换需全量跟随上游，fork 不自建别名；`SESSION_FORMAT_VERSION` 仍为 0 但语义已分叉，旧盘格式直接拒绝属预期

## 6. 回滚与接续

- 每批前 `git tag backup/pre-alpha4-<n>`；单批失败 `git reset --hard backup/pre-alpha4-<n>` + `git push --delete origin sync/alpha4-<n>`
- 若 `gh stack sync` 式重写触发，立即 `pnpm run typecheck && pnpm run test` 重审受影响层，未绿不宣称就绪；`Registrations are effects` 与 `Host/Client Context` 分离（`tsconfig.host.json` vs `tsconfig.client.json`）不得混入同一 Program

## 7. 产出与 PR 描述

- 7 个链式 PR，标题 `merge(upstream): alpha.4 — <batch name> (<upstream OID 范围>)`，正文附 `git diff --shortstat`、保留清单核对、门禁结果
- 顶层 PR 聚合 `docs/subsystems/*` 与 `config-catalog` 的生成物 diff，附 `Agent Notes` 索引（上游 63 篇 docs/note 已含，无需为合入补 note；仅 fork 保留段落引 oracle note）
