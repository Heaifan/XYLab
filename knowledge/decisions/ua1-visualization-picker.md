# UA1 Multi-Series + Visualization Picker：选择唯一状态源 + Catalog/兼容引擎分工 + Temporal Cursor 统一消费

- 类别：decisions
- 入库条件：③ 做出重要架构决策
- 日期：2026-08-14

## 背景

F2 的 Focus/Compare 是二元结构（active + compare 各一项），多序列监控必须升级为 Set<MetricId> 多选；图表类型只有折线一种，而 XYUI-8 canonical 定义了 16 个可视化组件的权威语义。指令要求：选择交互（普通点击 = Toggle，无修饰键）、21 类可视化目录全量注册但诚实标注可用性、绝对值/相对变化按量纲自动仲裁，同时冻结 Experiment Definition 与 Runtime 边界——这一切都只能在 UI View State 层完成。

## 决策 / 正确做法

1. **VisualizationSelectionState = 唯一选择状态源。** `src/ui/viewState.ts` 纯函数持有 selected（Set 语义有序数组）/pinned/hidden/mode/viz/scatterX·Y；App 持有本体。监控值行、Inspector 行、Legend、Pinned 卡四处点击全部路由到同一个 `selectToggle`——单源消费，禁止任何组件私藏选择副本。选择是 **UI 工作状态**：仅新实验 Load 重置并按 `output.charts`（x=time 数值目标）初始化；Pause/Resume/Step/Stop/Reset/锁定/跟随实时一律不清。Apply（参数重建）也保留选择。
2. **Catalog 与 Compatibility Engine 分工。** `src/ui/viz/catalog.ts` 只做注册（21 类 × 8 分类，每条带 XYUI-8 编号可追溯）；可用性全部由 `src/ui/viz/compat.ts` 集中裁决（data 形态/数量上下限/模式支持/同单位约束/threshold 前置）。UI 里禁止散落 `if chart ===`。不可用 = Disabled + 可见理由，**不删入口、不伪造数据、不自动切换**；当前可视化不可用时画布如实显示理由。
3. **量纲仲裁只在一个方向自动。** 绝对值模式下加入异单位指标 → 自动切相对变化 + 一次轻 toast「不同量纲，已切换到相对变化」；移出不自动切回、相对模式下不重复提示——模式回切是用户显式动作。绝对值永远只许同单位（F2 冻结延续）。
4. **Zero Baseline 统一防护。** 相对模式基线 = 运行起始首个数值点 = 100%；基线为 0 或非数值的目标在 Trend/Bar/Delta 一律跳过并文字提示，绝不产生 NaN/Infinity/假 100%。Delta 基线 0 同样跳过（统一规则，不开特例）。
5. **Temporal Cursor 统一消费。** Bar/State/Table 读哪个时刻 = `lockTime ?? 实时`（Live 读当前 Tick，Locked 读锁定 Tick）；Timeline 事件点击 = 锁定该时刻（XYUI-8 联动合同），「跟随实时」解锁。锁定线/锁定读数/锁定列高亮全部来自同一状态。
6. **Pinned ≠ Selected。** 固定卡（SnapshotRail 速览）与图表选择是两个独立概念，不绑死；卡片点击参与选择只是同源交互的便利，不构成状态绑定。

## 禁止

- 禁止修改 experiment.schema.json / xylab-experiment@0.1 / Formula Engine / Tick Engine / Watch 语义 / 事件协议来实现可视化需求。
- 禁止第二套 XYUI 可视化规范与第二套 IconFont（消费 XYUI-8 canonical + Icons.tsx 权宜 glyph）。
- 禁止运行控制（Pause/Resume/Step/Stop/Reset）或时间锁定清空选择。
- 禁止给 Disabled 目录项编造假数据让它"能画"，或悄悄删掉入口。
- 禁止相对模式伪造基线（0/非数值必须跳过 + 提示）。

## 验证方式

`npm run verify`（governance → typecheck → test，321/321）+ tests/ui/ua1/（selection 5 + arbitration 5 + catalog 7 + chart-model 6）；真机验收清单 = 场景 A~G（双部队同单位 / 多 % 指标 / 异量纲自动相对 / Scatter 指派交换 / 锁定 + Bar 读点 / 取消选择立即生效 / battle-metrics 12 watch 全目录 × 三断点 × Picker Bottom Sheet）。
