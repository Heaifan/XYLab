# XYLab · Changelog（审计位 · 时间轴）

回答「我们到底干过什么」。每个正式 CLOSED 轮留下：阶段 / 任务 / 目标 / 变更 / 原因 / 验证 / 测试 / Commit / 遗留问题 / 决策。只记录有真实证据的内容。

- 配套空间地图：[file-tree.md](file-tree.md)
- 治理规则：[docs/governance/XYLab-Development-Constitution.md](docs/governance/XYLab-Development-Constitution.md)

---

## GOV-01 · 三位一体治理初始化 —— CLOSED

- **阶段**：GOV（治理轮，插在 R2-03A 与 R2-03B 之间；R2-03B 冻结直至本轮通过）
- **任务**：建立 XY 系列默认工程治理基线「三位一体」并清零存量违规
- **目标**：治理是正式开发的前置条件，不是出事故后再补的安全带
- **变更**：
  - 一体：`docs/governance/XYLab-Development-Constitution.md`（Article 1~13；UI Constitution 标记 RESERVED / NOT YET RATIFIED）
  - 审计位：`changelog.md`（本文件，回填 R1~R2-03A）+ `file-tree.md`（终态空间地图）
  - 经验位：`knowledge/README.md` + 2 条真实入库（decisions/loader-trust-boundary、pitfalls/ajv-strictRequired-if-then）
  - 底线位：`scripts/governance-guard.mjs`（5+100 自动检查，无 allowlist/grandfather/exception）；`verify` 升级为 governance → typecheck → test
  - 存量清零：7 个超线文件最小 SRP 拆分（protocol 分 types/raw-types/loader-types + normalize/ + semantic/ 子层；expression 分 lexical-rules；3 个测试文件按领域分目录）
- **原因**：100 红线不是口号；第一天就开后门最危险。第 6 个文件出现前必须先审职责边界（5 规则），拆分合理性由 SRP 判定
- **验证**：`npm run verify` 一次全绿（GOVERNANCE PASS + tsc 0 error + vitest 47/47）；git diff --check PASS；行为零变化（原 44 用例编号全部保留并全绿）
- **测试**：47 项 = 原 44 项（R2-01 13 + R2-02 10 + R2-03A 21，编号不变）+ 治理专项 3 项（G-100/G-5/G-own）
- **Commit**：`bf1628a`（治理落地）+ 本条目补记提交
- **遗留问题**：R2-03B Parser+AST 冻结解除后启动；UI Constitution 未批准，任何轮次禁止自行设计
- **决策**：5 规则适用范围 = src/tests/scripts 下全部职责目录（tests 按领域分目录后同样合规，不设豁免）；100 规则覆盖含测试与脚本的全部手写源码；SRP 为人工硬门禁写入每轮报告；Knowledge 入库判断每轮必做

## R1 · Experiment Protocol —— CLOSED

- **阶段**：R1
- **任务**：定义一份 JSON 如何完整描述一次实验（R1-01~R1-09 全过）
- **目标**：协议冻结即契约，后续一切功能（加载/自动 UI/模拟/监控/导出）的公共契约
- **变更**：新增 `schema/experiment.schema.json`（draft-07 严格模式）、`examples/fatigue-basic.json`（Hello World）、`docs/experiment-protocol-0.1.md`（人类可读契约）、`README.md`；本地克隆空仓库并推送
- **原因**：先把实验定义标准化，再做运行器，最后做 UI；避免「先 UI 后改 JSON 全重做」
- **验证**：Python jsonschema（draft-07）1 正例 + 4 负例全部按预期（未知字段拒绝、enum 缺 options 拒绝、threshold 模式缺 threshold 拒绝、非法变量名拒绝）；工作区与 HEAD blob 逐字节一致
- **测试**：schema 校验正/负例（无测试套件，R1 无代码）
- **Commit**：`8474543`
- **遗留问题**：表达式内部引用校验（UNKNOWN_EVENT_TARGET / UNKNOWN_IDENTIFIER）依赖表达式解析器，留 R2-03C；浏览器端 schema 加载方式留 R4
- **决策**：严格模式（未知字段报错）；enum→options、threshold 模式→threshold 条件必填；变量名 snake_case；time/dt 保留字；实体路径 id.stateKey；min/max/step 为 UI 提示非运行时钳制

## R2-01 · Experiment Loader —— CLOSED

- **阶段**：R2
- **任务**：建立 JSON → 可信 ExperimentDefinition 的加载边界（不执行公式）
- **目标**：外部 JSON 是协议格式，Definition 是 Runtime 内部可信格式；非法实验明确 FAIL，绝不静默纠错
- **变更**：新增 `src/protocol/`（types / validator / semantic-validator / normalize / loader）、`package.json`、`tsconfig.json`、`.gitignore`、`tests/r2-01-loader.test.ts`；技术栈 TypeScript + vitest + ajv
- **原因**：Runtime 后续代码不应反复怀疑字段；三类错误分层（Parse/Schema/Semantic）
- **验证**：`npm run verify`（tsc 0 error + vitest）；git diff --check；推送后 HEAD == origin/main
- **测试**：13 项（T01~T12 + 聚合用例）：T01 合法加载 / T02 INVALID_JSON / T03 SCHEMA_VALIDATION_FAILED / T04 FORMULA_TARGET_NOT_FOUND / T05 WATCH_TARGET_NOT_FOUND / T06 DUPLICATE_ENTITY_ID / T07 Normalize 默认值 / T08 输入不可变 / T09 INVALID_TIMELINE_RANGE / T10 RESERVED_NAME / T11-T12 VARIABLE_TYPE_INVALID / 聚合收集
- **Commit**：`477e065`
- **遗留问题**：表达式内部标识符校验、事件 when 引用校验属 R2-03C
- **决策**：语义错误一次聚合全部（不 fail-fast）；Normalize 只补协议明文默认值；错误码见协议 §10（INVALID_JSON / SCHEMA_VALIDATION_FAILED + 7 个语义码）；ajv strictRequired 关闭（见 knowledge/pitfalls/ajv-strictRequired-if-then.md）

## R2-02 · Runtime State —— CLOSED

- **阶段**：R2
- **任务**：把实验定义与运行中可变状态彻底分开（RS-01~RS-05 五条不变量）
- **目标**：为 Tick / Reset / Step / Pause 提供可靠基础：安全、独立、确定性的可变世界
- **变更**：新增 `src/runtime/`（types / create-runtime-state / state）、`tests/r2-02-runtime-state.test.ts`
- **原因**：`value=0` 是初始定义不是永远值；Definition 不可变、Runtime 可变、深隔离、Reset 可复现
- **验证**：`npm run verify`（tsc 0 error + vitest 23/23）；git diff --check；HEAD == origin/main
- **测试**：10 项（T01~T10）：初始化 status=ready / 变量映射 / 变量不污染 Definition / Entity 初始化 / Entity 深拷贝隔离 / time=0&tickIndex=0 冻结 / 双 Runtime 互隔离 / Reset 深度一致且新对象 / 五类变量 / array→record 无遗漏
- **Commit**：`4089ed3`
- **遗留问题**：状态机切换（running/paused/completed/stopped）属 R2-05；读取者级隔离待 Runtime API 成型
- **决策**：variables 运行态只存值不复制 UI 定义；entities 用 ID 索引（Record<id, ...>）；structuredClone 深隔离；metadata 不含真实时间戳（确定性 > 装饰性）；status 本轮只产生 ready

## R2-03A · Expression Tokenizer —— CLOSED

- **阶段**：R2
- **任务**：受限表达式语言的词法分析（字符 → Token），不涉及 Parser/AST/语义
- **目标**：把字符串公式安全地拆成带位置的 Token 流，为 Parser（R2-03B）提供唯一输入
- **变更**：新增 `src/expression/`（token / tokenizer / errors）、`tests/r2-03a-tokenizer.test.ts`
- **原因**：表达式引擎是 XYLab 最关键核心，按 03A Tokenizer → 03B Parser → 03C 语义 → 03D Evaluator 拆分，避免一次做成大黑盒
- **验证**：`npm run verify`（tsc 0 error + vitest 44/44）；git diff --check；HEAD == origin/main
- **测试**：21 项（A01~A21）：整数/小数/标识符/下划线/布尔字面量/三类运算符/括号逗号/空白忽略/longest-match（>= <= == != && ||）/单独 = 拒绝/非法字符带 position/1.2.3 与 1e3 与 5. 与 .5 明确失败/空串仅 EOF/两段完整公式序列与 span
- **Commit**：`c12e9e9`
- **遗留问题**：Parser+AST 属 R2-03B（当前 FROZEN，待 GOV-01 完成后启动）；变量存在性属 R2-03C；Evaluator 属 R2-03D
- **决策**：不支持 .5 / 5. / 1e3 / 0xFF / NaN / Infinity（数字两侧必须完整）；不支持 ^（幂统一 pow()）；true/false 识别为 BOOLEAN；Token 带 span {start,end}；错误统一 ExpressionTokenizeError（INVALID_CHARACTER / INVALID_NUMBER）；绝不使用 eval / Function
