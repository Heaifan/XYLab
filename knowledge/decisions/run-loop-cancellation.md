# Run Loop 代际取消 + Speed ≠ dt 调度合同

- 类别：decisions
- 入库条件：③ 重要架构决策
- 日期：2026-08-13

## 背景

R2-05BC 需要一次解决运行控制的三个危险场景：Pause 后旧循环复活、Reset 后旧循环复活、Pause→Resume 后双循环。同时 x1/x10/x100/MAX 四档速度必须不改变模拟结果。

## 决策

**运行代际（generation）取消**：

```text
generation：每次 Run/Resume 递增；每次 Pause/Stop/Reset 也递增
loop 每 Tick 前检查：gen === generation && status === 'running'
不匹配 → 永久退出
```

- Pause/Stop/Reset 使旧循环永久失效——旧循环苏醒后先查代际，绝不修改新 Runtime。
- Resume 开启新代际，成为唯一权威循环；旧循环零贡献。
- 单 active loop：Run 仅允许 ready（running 时重复 Run 直接 INVALID_RUNTIME_TRANSITION）。

**tickOnce 单一推进点**：step() 与 runLoop 共用 advance.tickOnce（内部落账 completed/failed/lastError），禁止各自复制推进逻辑；status 的唯一写入者收敛在 controller。

**Speed ≠ dt 铁律**：

```text
dt 永远 = definition.timeline.tick
速度只决定现实调度：batchSize / delayMs
x1    batch 1     delay tick×1000ms（模拟 ≈ 现实）
x10   batch 10    delay tick×1000ms
x100  batch 100   delay tick×1000ms
max   batch 1000  delay 0（仍走 setTimeout，主动 yield，绝不阻塞事件循环）
```

同一实验四档跑到 completed：final variables / time / tickIndex / 状态完全一致——速度只改变「多久跑完」，不改变「算出什么」。

## 影响

- 手机端 MAX 不会卡死事件循环（批量 + yield + 每批后检查取消）。
- R2-06 随机数与速度档解耦验收依赖此合同：PRNG 按调用序列推进，与调度速度无关。
- UI 层（R4）只需消费 Controller API + status，无需自行实现调度。

## 验证方式

B01~B12、S01~S04、D01~D04 全绿（212/212）：单循环拒绝、Pause 零尾随 Tick、Reset 后旧循环苏醒零写入、Pause→Resume 无双循环（旧循环贡献 0）、四档最终结果一致、Speed ≠ dt（dt 恒为 tick）、completed/failed 自动停 + lastError 保留。
