# BATCH-2 · JSON-Driven Scenario Generator

## 决策

XYLab Batch V2 在现有 `xylab-experiment@0.1` 顶层增加**可选、向后兼容** `batch` 扩展；不建立第二实验协议、第二 Runtime 或 UI 私有方案格式。

## 合同

- `batch.dimensions[]` 是唯一方案生成描述。
- 每个 dimension 指定 `variable`，并二选一：`values[]` 或数值 `range { start, end, step }`。
- 一个 dimension 自然是 sweep；多个 dimension 按声明顺序确定性笛卡尔积，不额外引入冗余 `mode=sweep/matrix`。
- `batch.tick_limit` 可选，表示每场景模拟 Tick 上限。
- range 仅用于 number/integer；`step>0`、`end>=start`，integer 变量必须产生整数值。
- values 必须匹配目标变量类型/enum；未知变量、重复 dimension 都在 Loader 语义层拒绝。
- 方案基数在 Runtime 前计算，硬上限 `MAX_BATCH_SCENARIOS=1000`，禁止 JSON 意外展开造成运行爆炸。
- 生成场景 ID 按展开顺序稳定为 `json-1...`；名称由变量 label/value/unit 构成。

## 执行边界

`src/ui/batch/generator/expand.ts` 只负责生成 Scenario，不执行模拟。所有场景继续通过 `src/ui/batch/runner.ts` 创建隔离 Definition/Runtime/Monitor，禁止 Batch 自建模拟核心。

## JSON Round-trip

内部可信 Definition 与外部协议不是同一形状。复制/恢复 JSON 必须经过 `src/protocol/serialize/index.ts`：

- `schemaVersion → schema`
- 去掉 variable 内部 `name`
- 去掉 timeline 内部 `totalTicks`
- `createdAt → created_at`
- `batch.tickLimit → batch.tick_limit`
- 空 formulas 不输出，避免违反外部 Schema `minItems=1`

禁止直接 `JSON.stringify(ExperimentDefinition)`，否则会产生看似 JSON、实际无法再次 Loader 的第二真值。

## UI / XYUI

- JSON Batch 显示自动生成数量与方案预览；存在 `batch` 时不要求用户手工维护方案。
- CRUD/Run/Copy/Download 使用 XYUI-4 ActionFeedback；真正破坏性 Delete 使用 XYUI-7 Compact Confirm。
- Clipboard 只有在 API/fallback 实际成功时才能显示成功。
- 不新建 BATCH 专属配色/反馈体系，继续消费 XYUI。

## 版本说明

本轮选择保留 `xylab-experiment@0.1` 并做可选字段扩展，优点是旧 JSON 零迁移；代价是 0.1 的机器合同发生了向后兼容增量。未来若协议进入对外稳定发布或需要不兼容变化，应正式评估升级 `@0.2`，不能把当前选择伪装成“Schema 一字节未变”。
