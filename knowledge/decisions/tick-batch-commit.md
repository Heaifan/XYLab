# Tick 语义：Snapshot Read → Evaluate All → Batch Commit

- 类别：decisions
- 入库条件：③ 重要架构决策
- 日期：2026-08-13

## 背景

R2-04 需要裁定「同一 Tick 内多个公式如何读取与写入状态」。若公式逐个即时写回，公式排列顺序会悄悄影响结果（A=B、B=A 时 A、B 都变成 B 的旧值），所有机制公式的结果都将依赖 JSON 里的公式顺序。

## 决策

同一 Tick 语义冻结为：

```text
Tick Start
  → 读取 Tick-start 完整快照
  → 所有公式基于同一快照求值（互不可见写入）
  → 全部成功后一次性提交
  → time += dt，tickIndex += 1
```

配套裁定：

1. **Atomic Tick**：任一公式失败（语义/求值/值守卫）→ 整个 Tick 失败，state/time/tickIndex 零变化。绝不出现「A 已改、B 失败」的半更新世界。
2. **无顺序依赖**：快照语义下公式排列顺序不影响结果（A=B、B=A → A=20、B=10）。
3. **重复 target 硬拒绝**：DUPLICATE_FORMULA_TARGET，不规定「后写覆盖」。
4. **无 partial final tick**：下一完整 Tick 将超过 duration 则不执行（Loader 层已保证 duration/tick 为整数 tick 数，此规则兜底直接构造的定义）。
5. **不自动 clamp**：Variable min/max 是参数编辑约束（UI 范围），不是模拟规则；需要钳制必须在公式里显式写 clamp()。
6. **integer target 严格**：小数结果不得写入 integer target（不 round/截断），INTEGER_TARGET_REQUIRES_INTEGER。
7. **TickResult.changes 只含实际变化**：{target, previousValue, currentValue}，为 R3 Watch/Event 提供直接输入。

## 影响

- R2-05 运行循环（Run N ticks）建立在单 Tick 原子上，无需重复处理原子性。
- R3 Watch/Event 消费 TickResult.changes，无需自行 diff State。
- 所有未来机制公式默认观察同一世界状态——这是 XYLab 作为实验系统的基础语义。

## 验证方式

T06（后公式读旧值）、T07（交换 A/B）、T08~T10（原子失败零写入）、T18~T20（duration 边界）全绿。
