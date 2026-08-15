# MSV-1 · Multi-Seed Statistical Validation

## 决策

多 Seed 验证继续使用现有 Batch Runner + STAT-1，不建立第二随机执行器。Seed 是实验随机源参数，不伪装成普通 variable。

## JSON

`batch.seeds = { start, end, step }` 为可选整数递增范围。存在时与 `batch.dimensions` 做确定性笛卡尔积，场景顺序为：先 dimension 展开顺序，再 seed 升序。

例如 `distance=[100]`、`seeds=1943..1952` 生成 10 个独立场景；`distance=[100,200,300,400,500]` 则生成 50 个场景。两者共同计入 `MAX_BATCH_SCENARIOS=1000`。

## Runtime 边界

每个生成的 `BatchScenario` 可携带 `seed`。Runner 先应用普通变量 overrides，再仅对该场景替换 `ExperimentDefinition.random.seed`，随后仍通过正式 `createMonitoredRuntime()` 执行。基础 Definition 不被修改。

同 seed + 同输入必须得到完全相同序列；不同 seed 应改变随机序列。结果 JSON 必须记录每个场景的有效 seed，避免外部分析失去可复现性。

## 统计解释

MSV-1 的目的不是让单次样本必然等于理论值，而是检查多次独立重复下：Mean 是否围绕 0、样本 σ 是否围绕目标 σ 波动，以及工程验收带通过率。距离维度与 seed 维度必须区分：同 seed 的不同距离只是尺度变换，不算独立随机重复。
