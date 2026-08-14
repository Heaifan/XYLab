# Runtime Speed + Simulation Count · 2026-08-14

状态：IMPLEMENTED · WAITING FOR CI / USER ACCEPTANCE

## 用户需求

1. 修复运行区 `x1 / x10 / x100 / MAX` 倍速切换不生效的问题。
2. 允许运行前直接输入本轮模拟次数，例如 `100`、`1000`、`10000`。
3. 模拟次数是运行参数，不受实验 JSON `timeline.totalTicks` 上限约束。
4. 保留快捷次数入口：`100`、`1000`、`1万`。
5. 输出一份无需开发服务器、可直接本地打开的单文件 HTML。

## 实现裁定

- `timeline.tick` 仍然只表达单 Tick 的模拟时间；倍速只改变现实调度，不改变公式 dt。
- 运行中切换倍速会递增 Controller generation，旧循环失效，新循环立即按新速度档继续。
- `setTickLimit()` 接受任意 `>= 1` 的安全整数，不再 clamp 到 JSON `totalTicks`。
- Controller 为本轮执行构造运行时 timeline 视图，使底层 duration / totalTicks 边界与本轮模拟次数一致；原始 ExperimentDefinition 不修改。
- UI 在加载新 Runtime 时以 JSON `totalTicks` 作为初始建议值，但用户可改成更大或更小的本轮次数。
- 运行中锁定次数输入，避免同一运行代际中途改变终点；Pause 后可继续沿当前终点 Resume。

## 影响文件

- `src/runtime/controller/controller.ts`
- `src/ui/monitor/RunPanel.tsx`
- 本需求记录

## 验收重点

- x1 → x10 → x100 → MAX：运行中切换后速度应立即发生明显变化。
- JSON totalTicks=100 时输入 1000：应能运行至 1000 Tick，而不是在 100 Tick 自动完成。
- 输入 100 / 1000 / 10000：分别在对应 Tick 完成本轮。
- Reset 后 Runtime 状态清零；本轮次数配置保持 UI 当前值，重新加载实验则恢复该实验 JSON 的建议值。
