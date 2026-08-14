# STAT-1 · Runtime Statistics

## 决策

XYLab 的运行统计属于 Monitor Observer 层，不进入 Formula/Runtime 状态，也不由 UI 从历史序列重复计算轴统计。

## 统计语义

- `series` 继续保留 `time=0 / tickIndex=0` 初始化点，供曲线、锁定和初值展示使用。
- `NumericStatistics.sampleCount` 只统计成功 Tick；1000 Tick = 1000 个模拟样本，不再是 1001。
- `average / min / max / sampleStdDev` 只基于成功 Tick 样本。
- `initial` 单独保存初始化值；`delta = current - initial`。
- `sampleStdDev` 使用样本标准差（N-1）；N<2 返回 `null`，禁止伪造 0。
- 在线算法使用 Welford `(count, mean, M2)`，避免大数求和平方造成的数值不稳定。
- Series 即使因 `seriesCap` 截断，统计仍覆盖本 Session 的全部成功 Tick，不随显示历史截断。

## UI / XYUI

- Metric Row 展开态显示 `mean / σ / n`，统计来源唯一为 `MonitorSnapshot.statistics`。
- Scatter 的 Mean X/Y 与样本 σX/σY 直接消费同一统计源；只从已经排除初始化点的 X/Y 配对样本派生平均半径与最大半径。
- 不把 Kar98k 或 `current_sigma_x_cm` 等业务变量名写入统计核心。
- 目标值对比属于后续显式实验元数据能力；没有协议映射时不猜目标变量。
- 继续消费现有 XYUI Light/Metric/Visualization 语义，不创建第二套统计卡片视觉体系。

## 验收基准

固定向量 `[1,2,3,4,5]`：`count=5`、`mean=3`、`min=1`、`max=5`、`sampleStdDev=sqrt(2.5)`。
