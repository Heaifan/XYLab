# XYLab — 玄域机制公式实验台

XYLab 是玄域引擎**机制公式的通用 Web 实验环境**。不是「某个公式测试网页」，而是以后所有机制公式的统一实验平台。

```
JSON → 实验 UI → 模拟 → 监控 → 结果
```

一份 Experiment JSON 自动生成参数面板、加载公式、Tick 模拟，实时显示数值 / 曲线 / 事件日志 / 状态变化 / 最终结果。

## 当前状态

| 阶段 | 名称 | 状态 |
| --- | --- | --- |
| R1 | Experiment Protocol（实验协议） | ✅ CLOSED（基线 `8474543`） |
| R2 | Simulation Runtime（模拟运行核心） | ✅ CLOSED（基线 `2ee4f3e`，R2-01~R2-06 全关闭） |
| R3 | Data & Monitoring（数据监控） | ✅ CLOSED（基线待填，Watch/Series/Log/Statistics/Lifecycle 一次完成） |
| R4 | XYUI Web Shell（实验台 UI） | 🔶 进行中（R4-F1 Runtime Bridge 完成，真机验收通过） |
| R5 | Experiment Workflow（完整工作流） | ⬜ 待开工 |
| R6 | Validation & Mobile（验证与手机适配） | ⬜ 待开工 |

技术栈：TypeScript + Vite（Web）；Runtime 不依赖 UI 框架，未来可复用于 Web / Desktop / Mobile / XuanYu Editor。

## 目录

```
XYLab/
├─ schema/
│  ├─ experiment.schema.json   # 协议机器校验（draft-07，R1 冻结）
│  └─ README.md
├─ examples/
│  └─ fatigue-basic.json       # XYLab Hello World
├─ docs/
│  └─ experiment-protocol-0.1.md  # 人类可读协议契约（R1 冻结）
├─ src/protocol/
│  ├─ types.ts                 # ExperimentDefinition 内部可信格式
│  ├─ validator.ts             # Schema 校验（ajv draft-07）
│  ├─ semantic-validator.ts    # 语义校验（错误码见协议 §10）
│  ├─ normalize.ts             # 协议明定的默认值归一化
│  └─ loader.ts                # loadExperiment 入口
├─ src/runtime/
│  ├─ types.ts                 # RuntimeState 可变世界类型
│  ├─ create-runtime-state.ts  # Definition → Runtime 初始化（深隔离）
│  └─ state.ts                 # resetRuntimeState（Reset 基础能力）
├─ src/expression/
│  ├─ token.ts                 # Token 类型（词法层）
│  ├─ tokenizer.ts             # tokenizeExpression（受限表达式词法）
│  └─ errors.ts                # ExpressionTokenizeError
└─ tests/
   ├─ r2-01-loader.test.ts     # R2-01 测试 T01~T12 + 聚合用例
   ├─ r2-02-runtime-state.test.ts  # R2-02 测试 T01~T10
   └─ r2-03a-tokenizer.test.ts # R2-03A 测试 A01~A21
```

验证：`npm run verify`（tsc --noEmit + vitest run）。

## 协议入口

- 协议文档：[docs/experiment-protocol-0.1.md](docs/experiment-protocol-0.1.md)
- 机器校验：[schema/experiment.schema.json](schema/experiment.schema.json)
- 示例实验：[examples/fatigue-basic.json](examples/fatigue-basic.json)
