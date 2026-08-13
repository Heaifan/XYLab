# Loader 信任边界：协议格式 vs 可信格式

- 类别：decisions
- 入库条件：③ 重要架构决策
- 日期：2026-08-13

## 背景

R2-01 设计 Experiment Loader 时，确定「外部 JSON 与 Runtime 内部对象」的关系。

## 决策

1. **外部 JSON 是协议格式，`ExperimentDefinition` 是 Runtime 内部可信格式。** Loader 是唯一信任边界：Parse → Schema Validation → Semantic Validation → Normalize → Definition。Runtime 后续代码（R2-02 起）永远不怀疑字段：有没有、什么类型、默认值是否已补。
2. **非法实验 → 明确 FAIL，绝不静默纠错。** 公式测试最怕「fatigue_rate 不存在 → 自动当成 0」式的静默纠错。
3. **Normalize 只补充协议明文允许的默认值**（label=变量名、event.level=info、threshold operator=>= 等），绝不猜测语义。
4. **Definition 不可变，RuntimeState 可变，二者深度隔离**（structuredClone），Reset = 从 Definition 重建初始状态。
5. **Runtime 不知道 UI**：runtime/ 不依赖 React/DOM/组件，未来可复用于 Web/Desktop/Editor。

## 影响

- 所有 R2+ 代码基于可信类型编写，不需要防御性字段检查。
- 协议演进只影响 Loader 一层；Runtime 语义稳定。
- 测试模式：T08「原始输入对象不得被 Loader 修改」成为固定回归项。

## 验证方式

R2-01 13 项测试（错误码分层 + 不可变性）+ R2-02 10 项测试（深隔离 + Reset 可复现）全绿。
