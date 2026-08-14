# Batch Experiment V1 · 多方案实验调度边界

## 决策

XYLab 多方案实验不新增第二套模拟器。Batch 层只负责把一个已通过 Loader 的 `ExperimentDefinition` 与多个变量覆盖方案组合起来；每个方案都通过现有 `withInitialValues` 生成新的 Definition，并创建独立 `MonitoredRuntime`。

## 运行语义

- 每个方案拥有独立 Runtime / RNG / Monitor Session，不共享可变状态。
- 方案按列表顺序以 `MAX` 执行，避免移动端多个高负载 Runtime 并发争抢主线程。
- 每个方案可独立设置任意数量的变量覆盖；未覆盖变量继承基础实验。
- Batch 层不写回基础 Definition，不修改公式、Tick、Controller 或 Monitor 的既有语义。
- 比较指标优先读取 `output.summary`；未声明 summary 时回退 `watch`。
- 基准方案只影响比较展示的 Δ，不改变任何方案的运行结果。

## XYUI 消费

Batch UI 只组合现有 XYUI Consumer 语义：Light tokens、紧凑 Panel、标准 Button/Input/Select、浅 Accent 选中态、XYUI-8 横向 Bar Compare、显式数值与显式正负 Δ。不得为 Batch 再建立第二套配色、圆角、状态或图表语义。

## 后续边界

V1 解决“手动建立多个方案 → 一键运行 → 表格与图形比较”。自动参数扫描、重复试验统计、相关性/拟合/拐点检测属于后续能力，不在 V1 中伪装实现。
