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
│  ├─ protocol/                     ← 加载边界（R2-01）
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
│  │  └─ state.ts                   ←   resetRuntimeState（Reset 基础能力）
│  │
│  └─ expression/                   ← 受限表达式语言（R2-03A 词法层）
│     ├─ token.ts                   ←   TokenType / Token（span 保留位置）
│     ├─ lexical-rules.ts           ←   运算符表 + 字符分类（词法规则）
│     ├─ tokenizer.ts               ←   tokenizeExpression（扫描算法，无 eval）
│     └─ errors.ts                  ←   ExpressionTokenizeError
│
└─ tests/                           ← 验证层（按领域分目录，每文件 ≤100 行）
   ├─ loader/                       ← R2-01（13 用例：T01~T12 + 聚合）
   │  ├─ fixtures.ts                ←   共享夹具 base()
   │  ├─ r2-01-loader-load.test.ts       ← T01~T03 加载
   │  ├─ r2-01-loader-targets.test.ts    ← T04~T08 目标引用
   │  └─ r2-01-loader-semantic.test.ts   ← T09~T12 类型语义 + 聚合
   ├─ runtime/                      ← R2-02（10 用例：T01~T10）
   │  ├─ fixtures.ts                ←   共享夹具 defOf/defWithEntities
   │  ├─ r2-02-runtime-state.test.ts     ← T01~T06 初始化
   │  └─ r2-02-runtime-isolation.test.ts ← T07~T10 隔离与 Reset
   ├─ expression/                   ← R2-03A（21 用例：A01~A21）
   │  ├─ helpers.ts                 ←   共享工具 types/pairs
   │  ├─ r2-03a-tokenizer-lexical.test.ts ← A01~A12 词法基础
   │  └─ r2-03a-tokenizer-numbers.test.ts ← A13~A21 数字边界与序列
   └─ governance/                   ← GOV-01 专项
      └─ governance-guard.test.ts   ←   底线位回归（5/100/Guard 自身）
```

## 职责边界速查

| 问题 | 答案 |
| --- | --- |
| JSON 进哪里？ | `src/protocol/loader.ts`（唯一入口） |
| 哪些字段可信？ | Loader 输出的 `ExperimentDefinition`（`types.ts`） |
| 运行时可变状态在哪？ | `src/runtime/`（与 Definition 深隔离） |
| 表达式怎么解析？ | `src/expression/`（Tokenizer → Parser(R2-03B) → 语义(R2-03C) → Evaluator(R2-03D)） |
| 底线怎么守？ | `npm run verify` 第一步 `scripts/governance-guard.mjs` |
