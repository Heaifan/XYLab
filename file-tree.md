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
│  └─ fatigue-basic.json            ← XYLab Hello World（R1-09）
│
├─ docs/
│  ├─ experiment-protocol-0.1.md    ← 人类可读协议契约（R1 冻结，§10 错误码目录）
│  └─ governance/
│     └─ XYLab-Development-Constitution.md  ← 一体 · 开发宪法（GOV-01）
│
├─ knowledge/                       ← 经验位
│  ├─ README.md                     ← 分类/入库门槛/条目模板
│  ├─ decisions/loader-trust-boundary.md     ← 决策：可信边界/Runtime 无 UI/深隔离
│  └─ pitfalls/ajv-strictRequired-if-then.md ← 陷阱：if/then 条件必填 vs ajv strictRequired
│
├─ scripts/
│  └─ governance-guard.mjs          ← 底线位自动门禁（5 + 100；SRP 人工）
│
├─ src/                             ← 全部源码 ≤100 行/文件，实现目录 ≤5 文件
│  ├─ ui/                           ← R4/UI-F1 React 投影层（模拟核心零依赖）
│  │  ├─ main.tsx                   ←   入口
│  │  ├─ App.tsx                    ←   单一 Controller 权威持有 + 装配
│  │  ├─ styles.css                 ←   基础暗色 + 三断点布局
│  │  ├─ shell/                     ←   响应式壳
│  │  │  ├─ breakpoints.ts          ←     getBreakpoint 纯函数（Wide≥1024/Medium≥640/Compact）
│  │  │  ├─ useBreakpoint.ts        ←     matchMedia/resize 监听
│  │  │  ├─ TopBar.tsx              ←     状态徽章 + 控制按钮 + 速度档（守卫投影）
│  │  │  └─ Layout.tsx              ←     三模式布局容器（Compact 页签）
│  │  ├─ experiment/                ←   实验装载
│  │  │  ├─ parse.ts                ←     parseExperimentText（Loader 包装）
│  │  │  ├─ ExperimentPanel.tsx     ←     粘贴 JSON / 内置示例 / 错误
│  │  │  ├─ VariablesPanel.tsx      ←     自动参数面板（ready 态可编辑）
│  │  │  └─ VariableControl.tsx     ←     单变量控件（number/integer/boolean/enum/string）
│  │  └─ monitor/                   ←   监控投影
│  │     ├─ useMonitor.ts           ←     100ms 轮询 + UI 层 diff 日志
│  │     ├─ MonitorPanel.tsx        ←     时间/Tick/状态/变量值
│  │     └─ EventLog.tsx            ←     日志行
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
│  │     └─ controller.ts           ←     createController（status 唯一写入者 + 控制 API）
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
   └─ ui/                           ← UI-F1 断点纯函数（3 用例）
      └─ breakpoints.test.ts        ←   Wide/Medium/Compact 边界
```

## 职责边界速查

| 问题 | 答案 |
| --- | --- |
| JSON 进哪里？ | `src/protocol/loader.ts`（唯一入口） |
| 哪些字段可信？ | Loader 输出的 `ExperimentDefinition`（`types.ts`） |
| 运行时可变状态在哪？ | `src/runtime/`（与 Definition 深隔离；Tick 见 `src/runtime/tick/`；状态机见 `src/runtime/controller/`） |
| 表达式怎么解析？ | `src/expression/`（Tokenizer → Parser → 语义 → Evaluator，R2-03 闭环） |
| 底线怎么守？ | `npm run verify` 第一步 `scripts/governance-guard.mjs` |
