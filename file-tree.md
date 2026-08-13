# XYLab · File Tree（审计位 · 空间地图）

回答「现在这个项目到底长什么样」。每个目录/文件注明职责。与 [changelog.md](changelog.md)（时间轴）互为表里。

```text
XYLab/
├─ changelog.md                     ← 审计位 · 时间轴（每 CLOSED 轮记录）
├─ file-tree.md                     ← 审计位 · 空间地图（本文件）
├─ package.json                     ← scripts: verify = governance + typecheck + test
├─ tsconfig.json                    ← strict + ESNext/Bundler + allowJs（供 Guard .mjs 导入）
├─ .gitignore                       ← node_modules/dist/coverage
│
├─ schema/
│  └─ experiment.schema.json        ← 协议机器校验（draft-07，R1 冻结，一字节不动）
│
├─ examples/
│  ├─ fatigue-basic.json            ← XYLab Hello World（R1-09）
│  └─ battle-metrics.json           ← F2 验收样例（12 watch 混单位：人/分/%/吨/m·s + threshold + boolean）
│
├─ docs/
│  ├─ experiment-protocol-0.1.md    ← 人类可读协议契约（R1 冻结，§10 错误码目录）
│  ├─ experiment-json-guide.md      ← 实验 JSON 编写指南（模板/字段速查/错误码对照/使用流程；总结性文档，以协议为准）
│  └─ governance/
│     └─ XYLab-Development-Constitution.md  ← 一体 · 开发宪法（GOV-01）
│
├─ knowledge/                       ← 经验位
│  ├─ README.md                     ← 分类/入库门槛/条目模板
│  ├─ decisions/loader-trust-boundary.md     ← 决策：可信边界/Runtime 无 UI/深隔离
│  ├─ decisions/runtime-state-machine.md     ← 决策：六态状态机合同 + Step/Reset 转换规则
│  ├─ decisions/run-loop-cancellation.md     ← 决策：Run Loop 代际取消 + Speed ≠ dt 调度合同
│  ├─ decisions/tick-batch-commit.md         ← 决策：Tick 快照批量求值 + 原子提交
│  ├─ decisions/seeded-random.md             ← 决策：mulberry32 确定性随机（禁 Math.random）
│  ├─ decisions/monitoring-observer-only.md  ← 决策：R3 Observer Only（监控绝不回写 Runtime）
│  ├─ decisions/event-edge-trigger.md        ← 决策：事件边缘触发语义
│  ├─ decisions/ui-responsive-shell.md       ← 决策：FE-A-R2 权威版（三断点新组合/Tap Lock 联动/实验循环合同/数值格式规范）
│  ├─ decisions/r2-light-consumer-workbench.md ← 决策：B 类 Light 消费层 + 结构化状态禁解析表达式 + 可视化消费规则 + Save Run V1
│  ├─ decisions/xyui-consumer-intake.md      ← 决策：XYUI 权威批准 + vendor 只读 + A/B 分类 + 消费流程
│  ├─ decisions/f2-monitoring-ui-close.md    ← 决策：F2 图标层权宜边界 + MetricRow 唯一模型 + ViewState 语义 + 图表双模式冻结规则
│  ├─ patterns/test-dir-layering.md          ← 模式：测试按领域分目录 + helpers 复用
│  └─ pitfalls/ajv-strictRequired-if-then.md ← 陷阱：if/then 条件必填 vs ajv strictRequired
│  └─ pitfalls/float-assertions.md           ← 陷阱：浮点断言用 toBeCloseTo
│  └─ pitfalls/vite-dev-ipv4-bind.md         ← 陷阱：Windows vite dev 需显式 --host 127.0.0.1
│
├─ scripts/
│  └─ governance-guard.mjs          ← 底线位自动门禁（5 + 100；SRP 人工）
│
├─ vendor/                          ← 外部权威物料（只读；不在 guard 扫描根 src/tests/scripts 内）
│  └─ xyui/                         ← XYUI Core Pack Consumer Pack（UI 设计权威，宪法 Article 5 批准）
│     ├─ UPSTREAM-PIN.json          ←   上游锁定：XuanYuEngine-XYUI / feat/XYUI-A / 5f288e6 / 0.1.0 / manifest SHA / localMutation=0 + 33 件实测 SHA + 9 处上游差异登记
│     ├─ packs/core-0.1/            ←   消费入口：AGENT-GUIDE（消费法）→ manifest（包锁）→ gaps（12 非阻塞 GAP）→ README
│     ├─ registry/foundation/       ←   foundation-registry.json（44 Foundation 项，JSON = 唯一 Source of Truth）
│     ├─ tokens/architecture/       ←   token-canonical-map.json（426 canonical token）+ token-architecture.json（层级结构）
│     ├─ specs/XYUI1~8/             ←   canonical.md + mapping.json + gaps.json ×8（文本/视觉/导航/状态反馈/布局/集合/浮层/可视化）
│     └─ audit/cross-audit.md       ←   上游交叉审计结论（0 重复 owner / 0 broken ref / 12 GAP NON-BLOCKING / READY）
│
├─ src/                             ← 全部源码 ≤100 行/文件，实现目录 ≤5 文件
│  ├─ ui/                           ← React 投影层（模拟核心零依赖；FE-A-R2 Light 工作台 + F2 Monitoring UX）
│  │  ├─ main.tsx                   ←   入口（styles + visualization.css + history.css）
│  │  ├─ App.tsx                    ←   句柄 + ViewState 权威持有 + 草稿/重建 + tab/锁定/保存/历史装配
│  │  ├─ styles.css                 ←   Light 全局样式（全引 --xylab-* 变量 + 三断点布局 + Sheet + Metric Row）
│  │  ├─ format.ts                  ←   数值显示纠偏（integer 0 位/float ≤4 位，仅显示层不取整底层）
│  │  ├─ viewState.ts               ←   F2 视图状态纯函数（聚焦/对比/固定≤6/隐藏/绝对·相对模式）
│  │  ├─ icons/                     ←   F2 图标层（glyph 注册表 = XYUI1-GAP-001 权宜，不立命名权威）
│  │  │  └─ Icons.tsx               ←     18 内联 SVG（Foundation.Icon 冻结风格：Outline/1.5/round/16）
│  │  ├─ theme/                     ←   FE-A-R2 Light 消费层
│  │  │  └─ light-consumer.css      ←     B 类 --xylab-* 冻结值（非 canonical；GAP 权宜注释登记）
│  │  ├─ shell/                     ←   响应式壳
│  │  │  ├─ breakpoints.ts          ←     getBreakpoint 纯函数（Wide≥1024/Medium≥640/Compact）
│  │  │  ├─ useBreakpoint.ts        ←     matchMedia/resize 监听
│  │  │  ├─ TopBar.tsx              ←     标题 + 实验名/描述 + LIVE 状态芯片（状态+时间）
│  │  │  ├─ Layout.tsx              ←     三断点组合（Wide 四区/Medium 折叠/Compact 底导航+单列）
│  │  │  └─ BottomNav.tsx           ←     Compact 底部导航（实验/监控/日志/历史，SVG 图标）
│  │  ├─ experiment/                ←   实验装载与参数
│  │  │  ├─ parse.ts                ←     parseExperimentText（Loader 包装）
│  │  │  ├─ draft.ts                ←     参数草稿 + withInitialValues（正式重建边界）
│  │  │  ├─ ExperimentPanel.tsx     ←     粘贴 / Open JSON / 内置示例 / 名称描述 / 错误
│  │  │  ├─ VariablesPanel.tsx      ←     自动参数面板 + 应用并重新初始化
│  │  │  └─ VariableControl.tsx     ←     单变量控件（number/integer/boolean/enum/string）
│  │  ├─ actions/                   ←   FE-A-R2 一等操作
│  │  │  ├─ clipboard.ts            ←     copyText（clipboard API + execCommand 兜底）+ definitionJson
│  │  │  └─ ExperimentActions.tsx   ←     [复制 JSON][保存结果]（生效 Definition，轻重反馈）
│  │  ├─ visualization/             ←   FE-A-R2 XYUI-8 可视化（数据源唯一 MonitorSnapshot，纯 SVG）
│  │  │  ├─ VisualizationPanel.tsx  ←     目标解析（output.charts 优先→numeric 回退≤4）+ Focus/Compare 编排 + 绝对/相对切换
│  │  │  ├─ MetricStrip.tsx         ←     Pinned Cards（≤6 横滚，点击聚焦；模型 = metricModel.buildRows）
│  │  │  ├─ LineChart.tsx           ←     实时曲线（弱网格/自动量程/Tap 锁定/事件 marker/阈值线仅绝对）+ 相对模式（起点=100%，0 基线跳过）
│  │  │  ├─ InspectorSheet.tsx      ←     锁定时刻检查器（Bottom Sheet / 侧栏面板双形态；零横向滚动）
│  │  │  └─ visualization.css       ←     Metric/图表/Inspector 样式（色板=XYUI8-GAP-001 权宜）
│  │  ├─ history/                   ←   FE-A-R2 实验闭环（Save Run V1，手动触发，localStorage）
│  │  │  ├─ types.ts                ←     SavedRun V1（definitionSnapshot + monitorSnapshot 必含）
│  │  │  ├─ runStore.ts             ←     buildRun + 持久化（xylab.runs.v1；失败明确报错不假装成功）
│  │  │  ├─ SaveRunSheet.tsx        ←     保存 Bottom Sheet（备注 + 保存 / 保存并复制 JSON）
│  │  │  ├─ RunHistory.tsx          ←     历史列表（最新在前，详情展开，复制该 Run JSON）
│  │  │  └─ history.css             ←     历史/保存样式
│  │  └─ monitor/                   ←   监控投影
│  │     ├─ useMonitor.ts           ←     纯投影器 readBridge + 100ms 轮询（diff 日志已废除）
│  │     ├─ RunPanel.tsx            ←     运行区（状态/时间/Tick/全控制 + 联合 Reset，Compact 主次分层；图标 = Icons 层）
│  │     ├─ ValuesPanel.tsx         ←     F2 监控值 Compact Metric Row（label 优先三层优先级/Dense/Detail/行点击聚焦；三断点均可见）
│  │     ├─ metricModel.ts          ←     F2 MetricRow 唯一模型（valueAtTime/nearestTime/metricStatus/buildRows/resolveMetrics）
│  │     └─ EventLog.tsx            ←     协议事件日志（消费 snap.logs 结构化字段）
│  ├─ monitor/                      ← R3 监控核心（Observer Only，绝不回写 Runtime）
│  │  ├─ types.ts                   ←   SeriesPoint/MonitorLogEntry/WatchRecord/Statistics/Snapshot
│  │  ├─ registry.ts                ←   Watch Registry（未知 target 第二道防御）
│  │  ├─ accumulators.ts            ←   BoundedSeries(10000) + 数值/布尔统计累积器
│  │  ├─ events.ts                  ←   协议事件编译 + 边缘触发 + threshold watch 触发
│  │  └─ session.ts                 ←   Session 生命周期 + createMonitoredRuntime（Reset 联动）
│  └─ protocol/                      ← 协议层（R1/R2-01，UI-F1 起 Schema 打包器内联）
│  │  ├─ types.ts                   ←   ExperimentDefinition 可信契约类型
│  │  ├─ raw-types.ts               ←   未校验输入形状（Raw*，管线内部专用）
│  │  ├─ loader-types.ts            ←   LoadError 错误码 / LoadResult 结果
│  │  ├─ validator.ts               ←   Schema 校验（ajv draft-07，严格模式）
│  │  ├─ loader.ts                  ←   loadExperiment 唯一入口（Parse→Schema→语义→Normalize）
│  │  ├─ normalize/                 ←   归一化子层
│  │  │  ├─ index.ts                ←     结构复制（variables/entities/formulas/experiment）
│  │  │  └─ apply-defaults.ts       ←     协议默认值规则（totalTicks/operator/message…）
│  │  └─ semantic/                  ←   语义校验子层
│  │     ├─ semantic-validator.ts   ←     validateSemantics 编排（聚合全部错误）
│  │     ├─ resolve-target.ts       ←     目标解析（变量/实体路径）
│  │     ├─ variable-rules.ts       ←     变量域规则（保留字/类型匹配）
│  │     └─ reference-rules.ts      ←     引用域规则（公式/watch/output/时间线）
│  │
│  ├─ runtime/                      ← 可变世界（R2-02，不依赖 UI）
│  │  ├─ types.ts                   ←   RuntimeState/RuntimeValue/RuntimeEntity
│  │  ├─ create-runtime-state.ts    ←   Definition → RuntimeState（structuredClone 深隔离）
│  │  ├─ state.ts                   ←   resetRuntimeState（Reset 基础能力）
│  │  ├─ random/                    ←   R2-06 确定性随机子层
│  │  │  └─ prng.ts                 ←     mulberry32 + DEFAULT_SEED + nextRandom（禁 Math.random）
│  │  └─ tick/                      ←   R2-04 单次确定性 Tick 子层
│  │     ├─ types.ts                ←     TickResult/Change/TickError/TickOutcome
│  │     ├─ evaluate-batch.ts       ←     快照 + 公式批量求值（全读快照）
│  │     ├─ commit.ts               ←     原子提交 + 运行时值守卫（integer 严格）
│  │     └─ tick.ts                 ←     executeTick 编排 + canAdvance 边界（R2-05A 共用）
│  │  └─ controller/                ←   R2-05A 状态机 + R2-05BC 控制子层
│  │     ├─ types.ts                ←     StepOutcome/ControlOutcome/RunSpeed（x1/x10/x100/max）
│  │     ├─ transitions.ts          ←     六守卫（Step/Run/Pause/Resume/Stop）+ deniedOutcome
│  │     ├─ advance.ts              ←     tickOnce 单一推进点（step/loop 共用）
│  │     ├─ loop.ts                 ←     runLoop（代际取消+批量 yield）+ speedProfile（Speed≠dt）
│  │     └─ controller.ts           ←     createController（status 唯一写入者 + 控制 API + R3 TickObserver 投影）
│  │
│  └─ expression/                   ← 受限表达式语言（R2-03A 词法 / R2-03B 语法）
│     ├─ token.ts                   ←   TokenType / Token（span 保留位置）
│     ├─ lexical-rules.ts           ←   运算符表 + 字符分类（词法规则）
│     ├─ tokenizer.ts               ←   tokenizeExpression（扫描算法，无 eval）
│     ├─ errors.ts                  ←   ExpressionTokenizeError
│     └─ syntax/                    ←   R2-03B Parser 子层
│        ├─ ast.ts                  ←     AST 六类节点（span 全程传播）
│        ├─ parse-error.ts          ←     ExpressionParseError（五类错误码）
│        ├─ parse-operators.ts      ←     优先级爬升 + 一元前缀（左结合）
│        ├─ parse-primary.ts        ←     字面量/标识符/分组/函数调用
│        └─ parser.ts               ←     parseExpression 入口（纯语法）
│     └─ semantic/                  ←   R2-03C 语义验证子层（只读 AST）
│        ├─ types.ts                ←     number/boolean 语义类型 + SemanticContext
│        ├─ errors.ts               ←     ExpressionSemanticError（八类错误码）
│        ├─ context.ts              ←     符号表 + 函数白名单/签名（dt 唯一 builtin）
│        ├─ infer.ts                ←     类型推导（禁隐式转换）
│        └─ validator.ts            ←     validateExpression/validateFormula 入口
│     └─ evaluation/                ←   R2-03D 求值子层（纯函数）
│        ├─ types.ts                ←     EvalValue(number/boolean) + EvaluationContext
│        ├─ errors.ts               ←     ExpressionEvaluationError（九类错误码）
│        ├─ builtins.ts             ←     九函数实现（finite/domain/clamp 保护）
│        └─ evaluator.ts            ←     evaluate 递归求值（短路、无副作用）
│
└─ tests/                           ← 验证层（按领域分目录，每文件 ≤100 行）
   ├─ loader/                       ← R2-01（13 用例：T01~T12 + 聚合）
   │  ├─ fixtures.ts                ←   共享夹具 base()
   │  ├─ r2-01-loader-load.test.ts       ← T01~T03 加载
   │  ├─ r2-01-loader-targets.test.ts    ← T04~T08 目标引用
   │  └─ r2-01-loader-semantic.test.ts   ← T09~T12 类型语义 + 聚合
   ├─ runtime/                      ← R2-02（10 用例）+ R2-04（24 用例）
   │  ├─ fixtures.ts                ←   共享夹具 defOf/defWithEntities/makeTickDef/runOnce
   │  ├─ r2-02-runtime-state.test.ts     ← T01~T06 初始化
   │  ├─ r2-02-runtime-isolation.test.ts ← T07~T10 隔离与 Reset
   │  └─ tick/                      ←   Tick 子域
   │     ├─ r2-04-tick-basic.test.ts     ← T01~T04 单 Tick 基础与 dt
   │     ├─ r2-04-tick-batch.test.ts     ← T05~T07、T11~T12 批量/快照/ChangeSet
   │     ├─ r2-04-tick-safety.test.ts    ← T08~T10、T21~T22 原子失败与不可变
   │     ├─ r2-04-tick-values.test.ts    ← T13~T17 值守卫与重复 target
   │     └─ r2-04-tick-duration.test.ts  ← T18~T20 duration 边界
   │  └─ controller/                ←   R2-05A 控制器子域（18 用例）
   │     ├─ r2-05a-step-basic.test.ts    ← A01~A05 Step 基础
   │     ├─ r2-05a-step-boundary.test.ts ← A06/A07/A18 completed 边界与 Definition 不可变
   │     ├─ r2-05a-reset-safety.test.ts  ← A08~A13 失败与 Reset
   │     └─ r2-05a-guard.test.ts         ← A14~A17 转换守卫
   │  └─ controls/                  ←   R2-05BC 控制子域（17 用例）
   │     ├─ helpers.ts              ←     瞬时/手动调度器 + drain
   │     ├─ r2-05bc-controls-transitions.test.ts  ← B01~B05/B07/B10/B11 转换与 Resume 连续性
   │     ├─ r2-05bc-controls-stale-loop.test.ts   ← B06 单循环 + S01~S04 三危险场景
   │     └─ r2-05bc-controls-speed.test.ts        ← D01~D04 四档确定性与自动停
   │  └─ random/                    ←   R2-06 随机子域（13 用例）
   │     ├─ r2-06-random-prng.test.ts         ← P01~P05 PRNG 单元
   │     ├─ r2-06-random-integration.test.ts  ← I01~I03 Tick 集成与 Reset 重跑
   │     ├─ r2-06-random-atomic.test.ts       ← I04~I06 错误边界与原子性
   │     └─ r2-06-random-determinism.test.ts  ← D01~D02 四档速度联合确定性
   ├─ expression/                   ← R2-03A（21 用例）+ R2-03B（32 用例）
   │  ├─ tokenizer/                 ←   词法子域
   │  │  ├─ helpers.ts              ←     共享工具 types/pairs
   │  │  ├─ r2-03a-tokenizer-lexical.test.ts ← A01~A12 词法基础
   │  │  └─ r2-03a-tokenizer-numbers.test.ts ← A13~A21 数字边界与序列
   │  └─ parser/                    ←   语法子域
   │     ├─ helpers.ts              ←     共享工具 ast/expectParseError
   │     ├─ r2-03b-parser-structure.test.ts  ← B01~B07 结构
   │     ├─ r2-03b-parser-precedence.test.ts ← B08~B12 优先级与 span
   │     ├─ r2-03b-parser-calls.test.ts      ← C01~C09 调用与黄金样例
   │     └─ r2-03b-parser-errors.test.ts     ← E01~E11 错误边界
   │  └─ semantic/                  ←   语义子域（R2-03C，36 用例）
   │     ├─ helpers.ts              ←     共享工具 makeDefinition/check/expectSemanticError
   │     ├─ r2-03c-semantic-symbols.test.ts    ← C01~C04 符号表/dt/unsupported
   │     ├─ r2-03c-semantic-operators.test.ts  ← C05~C19 运算符类型规则
   │     ├─ r2-03c-semantic-functions.test.ts  ← C20~C26 函数白名单与签名
   │     └─ r2-03c-semantic-formula.test.ts    ← C27~C31 target 兼容 + 黄金样例
   │  └─ evaluation/                ←   求值子域（R2-03D，38 用例）
   │     ├─ helpers.ts              ←     共享工具 evalExpr/expectEvalError
   │     ├─ r2-03d-evaluator-basic.test.ts     ← D01~D11 基础 + 黄金 D36~D38
   │     ├─ r2-03d-evaluator-logic.test.ts     ← D14~D19 逻辑与短路
   │     ├─ r2-03d-evaluator-functions.test.ts ← D20~D30 内置函数
   │     └─ r2-03d-evaluator-errors.test.ts    ← D12~D13、D31~D35 运行期安全
   ├─ governance/                   ← GOV-01 专项
   │  └─ governance-guard.test.ts   ←   底线位回归（5/100/Guard 自身）
   ├─ ui/                           ← UI 断点（3）+ R4-F1 草稿（5）+ FE-A-R1 监控桥（14）+ FE-A-R2 工作台（21）+ F2（9）
   │  ├─ breakpoints.test.ts        ←   Wide/Medium/Compact 边界
   │  ├─ r4-f1-draft.test.ts        ←   草稿守卫/不可变/重建边界集成
   │  ├─ r1-monitor-bridge.test.ts  ←   Handle 生命周期（T01/T02/T04/T09~T15 语义）
   │  ├─ r1-monitor-projection.test.ts ← MonitorSnapshot 投影（T03/T05~T08 语义）
   │  ├─ r2/                        ←   FE-A-R2 子域（21 用例）
   │  │  ├─ r2-format.test.ts       ←     浮点噪音消除/格式分层/安全直通（5）
   │  │  ├─ r2-chart-model.test.ts  ←     图表目标解析/valueAtTime·nearestTime/结构化 Metric 状态（5）
   │  │  ├─ r2-run-store.test.ts    ←     SavedRun 快照完整/备注往返/排序/失败反馈（5）
   │  │  └─ r2-workflow.test.ts     ←     Metric+Chart 非空/冻结-连续/Reset/Apply/复制 JSON（6）
   │  └─ f2/                        ←   F2 子域（9 用例）
   │     ├─ f2-view-model.test.ts   ←     ViewState 纯函数 + MetricRow 三层信息/锁定读取（7）
   │     └─ f2-samples.test.ts      ←     examples 两件真实 Loader 加载取证（2）
   └─ monitor/                      ← R3 监控专项（21 用例）
      ├─ r3-watch-series.test.ts    ←   G1~G4 黄金案例/模式/防御/threshold 触发
      ├─ r3-events.test.ts          ←   E1~E5 边缘触发/重武装/防御/失败日志
      ├─ r3-statistics.test.ts      ←   S1~S3 统计 + H1~H2 有界历史与 Reset
      ├─ r3-lifecycle.test.ts       ←   L1~L5 生命周期对齐
      └─ r3-determinism.test.ts     ←   D1~D2 on/off 与四档确定性
```

## 职责边界速查

| 问题 | 答案 |
| --- | --- |
| JSON 进哪里？ | `src/protocol/loader.ts`（唯一入口） |
| 哪些字段可信？ | Loader 输出的 `ExperimentDefinition`（`types.ts`） |
| 运行时可变状态在哪？ | `src/runtime/`（与 Definition 深隔离；Tick 见 `src/runtime/tick/`；状态机见 `src/runtime/controller/`） |
| 表达式怎么解析？ | `src/expression/`（Tokenizer → Parser → 语义 → Evaluator，R2-03 闭环） |
| 底线怎么守？ | `npm run verify` 第一步 `scripts/governance-guard.mjs` |
| UI 设计依据在哪？ | `vendor/xyui/`（只读权威；消费从 `packs/core-0.1/AGENT-GUIDE.md` 开始；来源锁定见 `UPSTREAM-PIN.json`） |
| 曲线/Metric 从哪来？ | `src/ui/visualization/`（数据源唯一 = MonitorSnapshot；目标解析 output.charts 优先；禁解析事件表达式） |
| 操作图标从哪来？ | `src/ui/icons/Icons.tsx`（Foundation.Icon 冻结风格内联 SVG；glyph 注册表缺失 = XYUI1-GAP-001 权宜，禁建第二套 IconFont） |
| 监控值行模型在哪？ | `src/ui/monitor/metricModel.ts`（MetricRow 唯一模型；Pinned 卡与监控值列表共用） |
| Focus/Compare/相对规则？ | `src/ui/viewState.ts`（纯函数）+ `src/ui/visualization/VisualizationPanel.tsx`（编排）；绝对值对比只许同单位，相对模式运行开始值 = 100% |
| 保存的 Run 在哪？ | 浏览器 localStorage `xylab.runs.v1`（读写仅 `src/ui/history/runStore.ts`；SavedRun 必含 definitionSnapshot） |
| Light 色值在哪？ | `src/ui/theme/light-consumer.css`（B 类消费层 `--xylab-*`，非 canonical；GAP 权宜有注释登记） |
