# Seeded Random：确定性随机合同

- 类别：decisions
- 入库条件：③ 重要架构决策
- 日期：2026-08-13

## 背景

R2-06 要求实验 JSON 可声明 `random.seed`，同一 Experiment + Seed 每次运行必须得到完全相同的随机序列（复现实验 Bug 的基础）；正式 Runtime 禁止 Math.random。

## 决策

**PRNG**：mulberry32（uint32 状态、纯函数 nextRandom(state) → {value∈[0,1), nextState}）；种子缺省 DEFAULT_SEED=1（未声明 random 块的实验依然全局确定）。

**随机域属于 Batch Commit 原子域**：

```text
Tick 开始：rngState 草稿 = state.rng.state（本地拷贝）
random() 消费只推进草稿
全部公式成功 → 变量与 rngState 一起提交
任一失败 → 变量与 rng 零写入（原子 Tick 含随机域）
```

**Reset 的随机语义**：Reset = resetRuntimeState 重建 = PRNG 回到 seed 初始态（`state = seed >>> 0`），因此 Reset 后重跑结果完全一致。

**与速度档解耦**：PRNG 按 random() 调用序列推进，与调度速度无关——x1/x10/x100/max 四档对同一 seed 得到完全一致的随机序列与最终结果。

**表达式集成**：random() 作为 0 参内置函数进入 03C 白名单（returnType number）；求值层经 EvaluationContext.random 注入 thunk，保持求值器纯函数性质；带参调用（random(1)）语义拒绝 INVALID_ARGUMENT_COUNT。

## 影响

- R2 整体确定性成立：同 JSON + seed + 速度 → 同结果（time/tickIndex/variables/rng 状态）。
- R3 监控记录 rng 状态可完整复现实验。
- UI 层「Seed 输入框 + 复现」直接建立在此合同上。

## 验证方式

P01~P05、I01~I06、D01~D02 全绿（225/225）：同 seed 同序列、Reset 重跑一致、四档速度联合一致、失败 Tick 随机域零推进、src 无 Math.random（grep 验证仅注释提及）。
