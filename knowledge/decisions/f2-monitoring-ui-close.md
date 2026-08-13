# F2 Monitoring UI 收口：图标层权宜边界 + MetricRow 唯一模型 + 图表双模式冻结规则

- 类别：decisions
- 入库条件：③ 做出重要架构决策
- 日期：2026-08-14

## 背景

F2 一轮要同时收三件事：操作图标还在用 Unicode 符号（▶ ⏸ → ■ ↺）；监控值面板是信息密度失衡的三列表格；多指标不同量纲挤在同一 Y 轴互相压扁。XYUI Foundation.Icon 的**风格**已冻结（Outline / Stroke 1.5 DIP / Round Cap·Join / Size 14·16·20），但 glyph 注册表上游缺失（XYUI1-GAP-001，NON-BLOCKING）——既要用冻结风格，又没有权威字形名可引用。

## 决策 / 正确做法

1. **图标层 = 消费层权宜，不是第二套 IconFont。** `src/ui/icons/Icons.tsx` 内联 SVG 严格按冻结风格实现（viewBox 16 / stroke 1.5 / round），文件头登记 XYUI1-GAP-001 权宜来源。glyph 命名只是代码导出名，不构成命名权威；上游注册表落地后按注册表回流替换。按钮保持 Icon+Text，图标 aria-hidden、语义由文字承担。
2. **MetricRow 唯一模型。** `src/ui/monitor/metricModel.ts` 收敛 valueAtTime/nearestTime/metricStatus/buildRows/resolveMetrics：Pinned Cards 与监控值 Compact Metric Row 共用同一模型，锁定值与实时值统一 formatMetric（Tap Lock 切换不跳格式）。禁止任何组件再各自投影 statistics。
3. **ViewState = 纯函数 + App 持有。** selected/pinned/hidden/mode 的增删改全部走 `src/ui/viewState.ts` 纯函数；Load/Apply/Reset 重置为 VIEW_INIT。视图状态不是第二数据源——它只影响「看哪个」，不改变 MonitorSnapshot。
4. **图表双模式三冻结规则。** ① Focus 默认（selected 空 → 首个解析目标）；② Compare 绝对值只许同单位（sameUnitGroup 以首目标单位为准排除异单位并提示改用相对变化）；③ 相对变化 = 运行开始值（首个数值点）为 100%，基线为 0 或非数值 → 跳过该 Series 并文字提示。threshold 线只在绝对模式绘制（阈值是绝对量纲）。
5. **布局分工。** Pinned Cards（≤6，移动端横滚）= 速览；监控值 Compact Metric Row（label 优先三层优先级：值→变化→统计；初值只在 Detail 展开）= 全量管理（聚焦/对比/固定/隐藏）；>8 行自动 Dense 单行。InspectorSheet 保留 Live/Locked 检查点语义。零横向滚动是硬门（minmax(0,1fr) + ellipsis + min-width:0）。

## 禁止

- 禁止建第二套 IconFont 或 glyph 命名规范（等上游注册表回流）。
- 禁止相对模式对 0 基线 Series 伪造百分比（必须跳过 + 提示）。
- 禁止绝对值对比混合单位 Series。
- 禁止组件绕过 metricModel 各自读 statistics/series 重建行模型。
- 禁止把阈值线画进相对模式图表。

## 验证方式

`npm run verify`（governance → typecheck → test，298/298）+ tests/ui/f2/（ViewState 纯函数 7 + 样例取证 2）；真机验收清单 = fatigue-basic（单指标）+ battle-metrics（12 watch 混单位）× 三断点 × Focus/Compare/相对/Tap Lock/Dense/Pinned 横滚。
