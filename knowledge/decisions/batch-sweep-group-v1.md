# BATCH-3 · Sweep Group / Compare View

- **日期**：2026-08-15
- **状态**：RATIFIED
- **问题**：多维 `batch.dimensions` 直接做笛卡尔积，会把“距离、散布、射速分别产生什么影响”的单因素问题扩成 45 个组合；结果 UI 再把所有 Scenario 平铺，导致实验意图被组合数量淹没。

## 决策

Batch 正式区分两种模式：

- `mode: "sweep"`：单因素实验。每次只改变一个 dimension，其他 dimension 固定为变量定义中的基准 `value`；共享基准场景按完整输入去重，只执行一次，但在每个实验组中都可参与比较。
- `mode: "matrix"`：多因素组合。保持原有 dimensions 笛卡尔积语义，用于研究联合作用与交互效应。
- 未声明 `mode` 的旧 JSON 继续按 `matrix` 解释，避免已有实验静默改变语义。

## UI 合同

Sweep 结果默认采用三级结构：

1. 实验组（按 dimension 划分，例如距离影响/散布影响/射速影响）。
2. 指标比较（组内表格同时展示 summary 数值；选中指标显示 XYUI-8 Line 趋势）。
3. 单场景详情（点击组内某一水平后进入既有 VisualizationPanel）。

Scenario 仍是唯一执行与结果真值；Group/Compare 只是对正式 Scenario/Result 的投影，不建立第二套 Runtime、统计或结果存储。

## 典型规模

`5 距离 × 3 散布 × 3 射速`：

- Matrix：45 个场景。
- Sweep：界面显示 5+3+3=11 个实验水平；共享 `100m + 1mrad + 30rpm` 基准去重后实际只运行 9 个唯一场景。
