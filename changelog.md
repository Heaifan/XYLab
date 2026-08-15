# XYLab · Changelog（审计位 · 时间轴）

回答「我们到底干过什么」。当前账本记录最近正式收口轮；此前完整历史**原 blob 零改动归档**于：

- [历史 Changelog（截至 BATCH-2 / STAT-1 收口前）](docs/audit/changelog-through-2026-08-14.md)
- 配套空间地图：[file-tree.md](file-tree.md)
- 治理规则：[docs/governance/XYLab-Development-Constitution.md](docs/governance/XYLab-Development-Constitution.md)

> 归档策略只改变审计文档组织方式，不删除、改写历史事实。每个新 CLOSED 轮继续写入本文件；达到适合归档的体量时再按同样规则冻结。

---

## BATCH-3 · Sweep Group / Compare View —— CLOSED

- **阶段**：BATCH-3（单因素实验组 + 指标比较视图）
- **目标**：修复多维 Batch 把单因素问题过早展开成全组合、并将全部 Scenario 平铺的问题；正式区分 Sweep Group 与 Matrix。
- **协议**：`batch.mode` 新增 `sweep | matrix`。旧 JSON 未声明 mode 时继续按 `matrix` 解释，保持向后兼容。
- **Sweep 语义**：每次仅改变一个 dimension，其余 dimension 固定为变量定义中的基准 `value`；完整输入相同的共享基准只执行一次。`5×3×3` 的示例从 Matrix 45 场景收缩为 Sweep 9 个唯一场景，同时 UI 保留 5+3+3 个组内实验水平。
- **结果 UI**：Sweep 默认改为「实验组 → 指标比较 → 单场景详情」。每组先显示全部 summary 指标表，再对当前趋势指标绘制 XYUI-8 Line 语义折线；方案详情继续复用既有 `VisualizationPanel`。
- **Matrix**：原有笛卡尔积、平铺对比与 Seed Sweep 保持可用；不删除 45 组合能力，只将其放回多因素交互研究用途。
- **实现提交**：`2acb9f07` `feat(batch): add sweep group compare view`。
- **自动验证**：`GOVERNANCE PASS：175 个源码文件 ≤ 100 行；职责目录 ≤ 5 文件`；TypeScript 0 error；`60/60` Test Files、`341/341` Tests PASS；Vite `263 modules`、`built in 1.93s`；dist artifact 成功生成。GitHub Actions 最终仅在 `actions/configure-pages@v5` 因仓库 Pages 未启用返回 Not Found，与代码门禁无关。
- **Knowledge**：`knowledge/decisions/batch-sweep-group-v1.md`。
- **结论**：**CLOSED**。Sweep 用于回答单因素影响规律；Matrix 保留用于多因素交互研究。Scenario/Runtime/Statistics 仍保持单一真值。

## BATCH-2 · JSON-Driven Scenario Generation —— CLOSED

- **阶段**：BATCH-2（JSON 自动方案生成 + CRUD/复制反馈）
- **目标**：用户只提供一份实验 JSON，由 JSON 决定方案数量；例如 `100~500m / step=100m` 自动展开为 5 个方案，一键运行全部，不再手工逐项建方案。
- **实现**：
  - `xylab-experiment@0.1` 增加向后兼容可选 `batch` 字段；无 `batch` 的旧 JSON 保持原工作流。
  - `batch.dimensions[]` 支持 `values` 或数值 `range(start/end/step)`；多维按声明顺序做确定性笛卡尔积。
  - `tick_limit` 控制每方案模拟次数；Loader 语义层校验未知变量、重复维度、类型/枚举、非法 range，并在 Runtime 前限制总方案数 `<=1000`。
  - UI 自动生成 `json-1...` 场景、预览总数/前几项并一键运行；手工模式保持兼容。
  - 修复“复制运行 JSON”第二真值问题：内部 `schemaVersion/name/totalTicks/camelCase` 不再直接泄漏，统一通过 `src/protocol/serialize/` 输出 Loader 可再次读取的外部 JSON。
  - Clipboard 成功/失败按真实 Promise/fallback 结果反馈；Load/Create/Update/Delete/Run/Copy/Download 都有 XYUI 语义反馈，危险删除用 Compact Confirm。
- **实现提交**：`c264b553` `feat(batch): add JSON-driven scenario generation`。
- **自动验证**：该提交 CI 的 governance/typecheck/test/build 均通过；Pages 配置步骤因仓库 Pages 未启用返回 Not Found，不属于代码门禁失败。
- **用户真机验收（2026-08-15）**：同一 JSON 自动产生 `100/200/300/400/500m` 五方案，全部 `completed`，每方案 `tickLimit=1000`；`current_sigma_x_cm=2.5/5/7.5/10/12.5`、`current_sigma_y_cm=3.2/6.4/9.6/12.8/16`，距离比例 `1:2:3:4:5` 正确。
- **Knowledge**：`knowledge/decisions/batch-experiment-v1.md` + `knowledge/decisions/batch-json-generator-v2.md`。
- **结论**：**CLOSED**。后续统计能力复用同一 Batch Runner，不建立第二 Runtime。

## STAT-1 · Runtime Statistics —— CLOSED

- **阶段**：STAT-1（Tick-only Runtime Statistics）
- **目标**：将“1000 发却统计成 1001”纠正为真正的 1000 模拟样本，并提供可复用 `count/mean/min/max/sampleStdDev`。
- **统计合同**：
  - Series 继续保留 `time=0/tickIndex=0` 初始化点，用于曲线、初值和时间锁定；**Statistics 不把它算作模拟样本**。
  - 数值统计只消费成功 Tick；`sampleStdDev` 使用 N-1 样本标准差，N<2 返回 `null`。
  - 数值累积器采用 Welford `(count, mean, M2)`；Series 即使被显示 cap 截断，统计仍覆盖本 Session 的全部成功 Tick。
  - Scatter 的 Mean X/Y 与样本 σX/σY 直接消费 `MonitorSnapshot.statistics`；平均/最大半径只由排除初始化点后的二维配对样本派生。
- **实现提交**：`fac421a7` `feat(stat): add tick-only runtime statistics`；`f589bb95` `test(stat): align regressions with tick-only samples`。
- **门禁过程**：第一次 CI governance 与 typecheck PASS，但 5 条旧测试仍断言“初始化点属于统计样本”，因此全量测试按治理规则阻断；未回退实现，而是更新这些明确受新统计合同影响的旧断言。
- **最终自动验证**：`GOVERNANCE PASS：172 个源码文件 ≤100 行；职责目录 ≤5`；TypeScript 0 error；`59/59` Test Files、`337/337` Tests PASS；Vite `261 modules`、`built in 1.84s`；dist artifact 成功生成。Pages 外部配置仍为 Not Found，与代码门禁无关。
- **用户真机验收（2026-08-15）**：5 个距离均 `sampleCount=1000`。100m：`Mean X=+0.020872cm`、`Mean Y=-0.073158cm`、`sample σX=2.438782cm` 对目标 2.5cm（-2.45%）、`sample σY=3.323673cm` 对目标 3.2cm（+3.86%）；通过既定 ±8% 工程验收带，中心无显著漂移。200~500m 使用同一 seed，样本 σ 严格按距离倍增，验证角度→线性尺度转换。
- **Knowledge**：`knowledge/decisions/runtime-statistics-v1.md`。
- **结论**：**CLOSED**。当前验证证明“一个固定 seed 的 1000 样本 + 距离尺度变化”成立；不同 seed 的稳健性进入下一轮，不把 5 个距离误称为 5 次独立随机验证。

## NEXT · MSV-1 · Multi-Seed Statistical Validation —— NOT STARTED

- **目标**：用多 seed 独立重复同一统计实验，验证中心性和样本 σ 的稳定性，而不是只验证 seed 1943。
- **边界**：优先做通用 Seed Sweep / 统计汇总，不把 Kar98k 参数写进 Runtime 核心；继续复用 Batch/STAT，不建立第二执行器。
