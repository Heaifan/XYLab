# Monitoring is Observer Only（监控只观察，绝不回写模拟）

- 类别：decisions
- 入库条件：③ 重要架构决策
- 日期：2026-08-13

## 背景

R3 引入 Monitoring Core。核心风险：监控逻辑（Watch/Event/统计）若混入模拟管线，会改变模拟结果或破坏确定性。必须建立硬边界。

## 决策

**单向数据流（R3 冻结）**：

```text
Simulation Runtime → TickResult → Monitoring（只消费）→ MonitorSnapshot → UI
```

1. **Controller 观察钩子（纯输出投影）**：`ControllerOptions.observer?: TickObserver`，在 step/runLoop 的单一推进点（advance）后同步回调 `TickObservation`（status/result/error/time/tickIndex/values 浅拷贝快照）。观察者存在与否不得改变模拟结果——由 D1 测试锁定（on/off 最终 state 逐位一致）。
2. **监控禁止触碰**：RuntimeState / Expression / Tick / Random / Controller 语义。Event 条件不注入 PRNG（random() 在事件里抛错），保证监控零消费随机序列。
3. **监控确定性**：同 JSON+seed 在 x1/x10/x100/MAX 下 Series/Logs/Statistics 完全一致（D2 测试锁定）——速度只改现实耗时。
4. **统一输出**：UI 只拿 `MonitorSnapshot{watches, series, logs, statistics, session}`，禁止翻 Runtime 历史。
5. **React 不做监控核心**：useEffect 不算 average、不判 threshold、不维护事件状态——全部在 src/monitor（纯 TS，框架无关）。

## 影响

- 未来换 UI 框架，监控核心零改动。
- 复现实验：同 seed → 同模拟 + 同监控证据链。

## 验证方式

r3-determinism（D1 on/off 一致、D2 四档一致）+ r3-lifecycle（L1~L5）+ 全部 254/254 全绿。
