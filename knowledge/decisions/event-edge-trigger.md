# Event False→True Edge Trigger（事件边缘触发语义）

- 类别：decisions
- 入库条件：③ 重要架构决策
- 日期：2026-08-13

## 背景

协议事件 `{ "when": "fatigue >= 70" }` 若每 Tick 求值为 true 就记录，会从 Tick 100 刷屏到 Tick 300。需要冻结事件触发语义。

## 决策

**False→True 边缘触发（R3 冻结，协议事件与 threshold watch 同套语义）**：

```text
69 → 70  false → true  触发一次
70 → 71  true  → true  不重复
降到 60   true  → false 重武装（rearm）
再升到 70 false → true  可再次触发
```

1. 条件求值复用现有 Expression Engine 全管线（tokenize→parse→语义推导→求值）；条件结果必须 boolean（否则构建期警告 + 事件禁用）。
2. 求值严格布尔（`value === true`），无 truthy 转换。
3. 求值上下文不含 random（监控绝不消费 PRNG）。
4. **repeat 字段 R3 不产生行为差异**（一律边缘触发）；once/cooldown/every_tick 属未来协议扩展，R3 明确不做。
5. edge-state（wasTrue）随 Monitoring Session Reset 清空——Reset 后事件可重新触发。

## 影响

- 事件日志天然稀疏（只在跨越时刻出现），直接支撑「战场弹幕」等 UI。
- 事件求值失败（构建期已把关）跳过本 Tick，不产生刷屏。

## 验证方式

r3-events（E1 单次触发/E2 重武装再触发/E3~E4 构建防御）+ r3-watch-series（G4 threshold watch 同语义）+ r3-lifecycle（L5 Reset 后再次触发）。
