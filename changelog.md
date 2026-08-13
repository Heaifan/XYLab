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

## R2-06 · Seeded Random —— CLOSED（R2 · Simulation Runtime 整体 CLOSED）

- **阶段**：R2 最后一轮（R2-01 Loader → R2-02 State → R2-03 Expression → R2-04 Tick → R2-05 状态机+控制 → R2-06 随机，全部关闭）
- **任务**：seed 合同 + 确定性 PRNG + Runtime random 状态 + random() 内置 + Reset seed 恢复 + 错误边界 + 四档速度联合确定性
- **变更**：新增 `src/runtime/random/prng.ts`（mulberry32，DEFAULT_SEED=1，禁 Math.random）；RuntimeState 增加 rng 域（Reset 经重建回 seed 初始态）；random() 进入 03C 白名单（0 参 → number）；EvaluationContext 增加 random 注入；Tick 层 rng 草稿拷贝 + Batch Commit 原子写回；tests/runtime/random 4 文件 13 用例；Knowledge 入库 decisions/seeded-random.md
- **验证**：`npm run verify` 全绿（GOVERNANCE PASS 85 文件 + tsc 0 error + 225/225）；grep 确认 src 无 Math.random（仅注释提及）；Guard 拦截 2 个超线文件并压缩（evaluator 收紧、integration 拆分 atomic）；git diff --check PASS
- **测试**：13 项新增 = PRNG 5（同 seed 同序列/异 seed 异序列/[0,1) 范围/重跑一致/DEFAULT_SEED）+ 集成 3（两次独立运行一致/异 seed 不同/Reset 回 seed 初态重跑一致）+ 原子与边界 3（random(1) 语义拒绝/失败 Tick 随机域零推进/未消费不推进）+ 四档联合确定性 2（x1=x10=x100=max、Reset 重跑 max 与首次 x1 一致）
- **Commit**：`2ee4f3e`（实现）+ 本条目补记提交
- **决策**：随机域属于 Batch Commit 原子域（草稿推进、成功才提交）；PRNG 按调用序列推进与速度档解耦；Reset 的随机语义 = 回到 seed 初始态；random() 上下文注入保持求值器纯函数（详见 knowledge/decisions/seeded-random.md）
- **R2 整体**：`R2 · Simulation Runtime CLOSED` —— JSON → Loader → RuntimeState → Expression Engine → Seeded Random → Tick Engine → Controller（Run/Pause/Resume/Step/Stop/Reset + x1/x10/x100/MAX）。按用户冻结顺序，下一步直接进入 UI/Frontend，不再新增任何 R2 阶段。
- **Knowledge**：UPDATED —— 新 decisions/seeded-random.md（确定性随机合同）

## R2-05BC · Runtime Controls Complete —— CLOSED

- **阶段**：R2-05 完整关闭（按用户裁定不再拆 B/C，一次完成）
- **任务**：Run/Pause/Resume/Stop + 单 active loop + stale-loop cancellation + x1/x10/x100/MAX
- **变更**：controller 子层扩展为 5 文件（types/transitions/advance/loop/controller）；新增 tickOnce 单一推进点与 generation 代际取消 runLoop；错误码统一 INVALID_RUNTIME_TRANSITION（05A 的 ILLEGAL_TRANSITION 按新规范改名，05A 测试同步）；tests/runtime/controls 4 文件 17 用例；Knowledge 入库 decisions/run-loop-cancellation.md
- **验证**：`npm run verify` 全绿（GOVERNANCE PASS 81 文件 + tsc 0 error + 212/212）；Guard 拦截 2 个超线文件并 SRP 拆分/压缩（deniedOutcome 下沉 transitions、ControllerOptions 单行、测试 helper 内联）；git diff --check PASS
- **测试**：17 项新增 = 转换 8（Run/Pause/Resume/Stop×2、ready 三禁、stopped 全禁+Reset 复活、Resume 连续性 100 tick）+ stale-loop 5（单循环拒绝、Pause 零尾随 Tick、Reset 后旧循环苏醒零写入、Pause→Resume 无双循环旧循环贡献 0、Stop 取消循环）+ 速度 4（四档最终结果完全一致、Speed≠dt、completed 自动停、failed 自动停+lastError 保留）
- **Commit**：`a3c6813`（实现）+ 本条目补记提交
- **决策**：运行代际取消（每次 Run/Resume/Pause/Stop/Reset 递增 generation，loop 每 Tick 检查）；单 active loop（Run 仅 ready）；Speed ≠ dt 铁律（速度只改 batchSize/delayMs）；MAX batch 1000 + delay 0 仍走 setTimeout 主动 yield；x1/x10/x100 的 delay = tick×1000ms；Run 返回 done Promise；调度器可注入（测试用手动/瞬时调度器精确控制苏醒时机）
- **遗留问题**：Seeded Random（R2-06）；UI 未开工
- **Knowledge**：UPDATED —— 新 decisions/run-loop-cancellation.md（代际取消 + Speed≠dt 调度合同）

## R2-05A · Runtime State Machine + Step/Reset —— CLOSED

- **阶段**：R2-05 第一子轮（05B Run Loop / 05C 速度档未开工）
- **任务**：把运行状态机做成权威合同（A1 RuntimeStatus / A2 Transition Guard / A3 Controller 边界 / A4 Step / A5 判定 / A6 Reset）
- **目标**：Controller 只组织 R2-04 Tick Engine，不复制 Tick 逻辑；Web/手机/桌面 UI 未来消费同一状态机
- **变更**：新增 `src/runtime/controller/`（types/transitions/controller）；runtime/types 六态 + RuntimeFailure + lastError；tick.ts 提取 canAdvance（duration 边界单一权威，executeTick 与 Controller 共用）；tests/runtime/controller 4 文件 18 用例；Knowledge 入库 decisions/runtime-state-machine.md
- **验证**：`npm run verify` 全绿（GOVERNANCE PASS 75 文件 + tsc 0 error + 195/195）；git diff --check PASS
- **测试**：18 项新增 = Step 基础 5（初始 ready/ready→paused/paused→paused/单 Tick/time+tickIndex）+ completed 边界 3（最后合法 Tick、非整除 10/6 止于 6、Definition 全程不变）+ 失败与 Reset 6（failed/原 State 保留/lastError 三字段/重建新对象/清 lastError/回到 ready）+ 守卫 4（completed 禁 Step/六态守卫表/failed 禁 Step 不覆盖 lastError/非法转换明确失败）
- **Commit**：`8e39dfa`（实现）+ 本条目补记提交
- **决策**：六态 ready/running/paused/completed/stopped/failed；Step 仅 ready/paused（成功→paused 或 completed，失败→failed+lastError）；Reset 唯一完整重建（resetRuntimeState）；Stop ≠ Pause（stopped 终态，调度属 05B）；ILLEGAL_TRANSITION 以 discriminated union 返回不抛异常（详见 knowledge/decisions/runtime-state-machine.md）
- **突发事件**：外部并行会话写入 controller/guard/types 等文件并提交推送 `0248eaa`（越界实现 run/pause/resume/stop = 05B 内容，错误码 INVALID_RUNTIME_TRANSITION）。用户裁定：以本轮执行 Agent 实现为唯一权威，禁止合并外部实现。执行 `git reset --hard 77c0df4` 硬回滚，重写全部 05A 实现，后续将 force-push 覆盖远端 `0248eaa`。
- **Knowledge**：UPDATED —— 新 decisions/runtime-state-machine.md（Web/手机/桌面共用的状态权威合同）

## R2-04 · Tick Engine —— CLOSED

- **阶段**：R2（单次确定性 Tick；运行循环属 R2-05）
- **任务**：实现一次 Tick 到底发生什么，并把公式结果权威地提交进 RuntimeState（T1 输入 / T2 快照 / T3 批量求值 / T4 原子提交 / T5 时间推进）
- **目标**：XYLab 从「表达式计算器」变成「模拟器」——公式会算了，现在会按 Tick 驱动整个实验
- **变更**：新增 `src/runtime/tick/`（types / evaluate-batch / commit / tick）；tests/runtime 新增 tick 子域 5 文件 24 用例；Knowledge 入库 decisions/tick-batch-commit.md
- **原因**：同 Tick 公式必须观察同一世界状态，否则公式排列顺序会悄悄影响所有机制结果
- **验证**：`npm run verify` 全绿（GOVERNANCE PASS + tsc 0 error + 177/177）；Guard 拦截 2 个超线测试文件并 SRP 拆分（basic/batch/safety/values/duration）；git diff --check PASS
- **测试**：24 项新增 = 基础 4（黄金 fatigue 10→10.4 + dt 接 timeline）+ 批量与快照 5（交换 A/B、后公式读旧值、ChangeSet、无变化不产生 change）+ 原子失败 7（A 不得变 100、time/tickIndex 零变化、Definition 不变、就地提交合同、实体 target 拒绝、语义错误包装）+ 值守卫 5（boolean/integer 接受、小数拒绝、重复 target）+ 边界 3（第 11 次拒绝、直接构造 10/6 拒绝、非整除无 partial tick）
- **Commit**：`3aab4cd`（实现）+ 本条目补记提交
- **遗留问题**：Run/Pause/Step/Stop/Reset 控制与状态机属 R2-05；实体路径 target 写回随实体表达式协议扩展
- **决策**：Snapshot Read → Evaluate All → Batch Commit + Atomic Tick（详见 knowledge/decisions/tick-batch-commit.md）；dt 唯一取自 timeline.tick；不自动 clamp（min/max 是 UI 约束非模拟规则）；integer target 不接受小数；changes 只含实际变化；成功就地提交同一 state（遵守 R2-02 mutable 合同）
- **Knowledge**：UPDATED —— 新 decisions/tick-batch-commit.md（此后所有模拟机制依赖的核心语义）

## R2-03D · Expression Evaluator —— CLOSED（R2-03 Expression Engine 整体 CLOSED）

- **阶段**：R2（Expression Engine 最后一段：03A Tokenizer → 03B Parser → 03C Semantic → 03D Evaluator 全部关闭）
- **任务**：实现 ValidatedExpression + EvaluationContext → RuntimeValue 的无副作用求值层（D1 上下文 / D2 字面量与标识符 / D3 一元二元与短路 / D4 内置函数 / D5 运行期错误边界）
- **目标**：第一次让 `fatigue + move_speed * fatigue_rate * dt` 真正算出一个值（10.4）
- **变更**：新增 `src/expression/evaluation/`（types / errors / builtins / evaluator）；tests/expression 新增 evaluation 子域，38 项专项（D01~D38）；Knowledge 入库 float-assertions 陷阱
- **原因**：Evaluator 必须保持纯函数——target 写回是 R2-04 Tick Engine 的权威职责，否则多公式顺序会悄悄影响结果
- **验证**：`npm run verify` 全绿（GOVERNANCE PASS + tsc 0 error + 153/153）；Guard 拦截 evaluator.ts 103 行并消除 finite 重复实现；git diff --check PASS
- **测试**：38 项新增 = 基础与黄金 14（疲劳=10.4 且 context 不变、clamp=0 且 hp 不变、布尔条件=true）+ 逻辑与短路 6（hp=0 时 `hp > 0 && 100/hp > 2` → false 不除零）+ 函数 11（clamp 逆区间拒绝、sqrt(-1) → DOMAIN_ERROR）+ 运行期安全 7（除零/模零/缺值/类型不匹配/NON_FINITE/context 与 AST 不可变）
- **Commit**：`1d984b7`（实现）+ 本条目补记提交
- **遗留问题**：target 写回与多公式结算顺序属 R2-04 Tick Engine
- **决策**：除零/模零/非 finite 一律硬失败（Infinity/NaN 会污染整个实验）；== 严格相等（=== 语义，无 coercion）；&&/|| 短路求值；clamp 下限>上限不自动交换（掩盖定义错误）；sqrt 负定义域 DOMAIN_ERROR；MISSING_RUNTIME_VALUE 为运行期防御边界（03C 已保证但 context 可能不完整）；span 全程保留至运行期错误（R4 公式编辑器标红的基础）
- **Knowledge**：UPDATED —— 新 pitfalls/float-assertions.md（IEEE754 下 0.08×5≠0.4，数值断言必须 toBeCloseTo，未来每轮数值测试都会踩）

## R2-03C · Expression Semantic Validation —— CLOSED

- **阶段**：R2
- **任务**：建立 AST → ValidatedExpression 的静态语义验证层（C1 符号表 / C2 标识符 / C3 运算符类型 / C4 函数白名单与签名 / C5 target 兼容）
- **目标**：公式错误尽量在运行前暴露；未知标识符绝不默认值；禁一切隐式类型转换
- **变更**：新增 `src/expression/semantic/`（types / errors / context / infer / validator）；tests/expression 新增 semantic 子域，36 项专项（C01~C31 + 黄金样例）
- **原因**：03B 判断「语法对不对」，03C 判断「这句话在这个实验里有没有意义」——banana(a) 03B PASS 而 03C 必须 UNKNOWN_FUNCTION，层次互不越界
- **验证**：`npm run verify` 全绿（GOVERNANCE PASS + tsc 0 error + 115/115）；git diff --check PASS
- **测试**：36 项新增 = 符号表 7（dt 唯一 builtin、string/enum → UNSUPPORTED_SYMBOL_TYPE）+ 运算符 15（含 !number 拒绝、跨类型相等拒绝）+ 函数 7（min 变参、clamp/abs 数量错误、abs(boolean) 类型错误）+ Formula 7（boolean↔boolean 成立、integer target 只要求 numeric、string/enum target 明确拒绝、两个黄金样例）
- **Commit**：`611087c`（实现）+ 本条目补记提交
- **遗留问题**：实体路径 target（entityId.stateKey）的结果类型兼容需实体表达式协议扩展后再做静态检查（本轮跳过不报错，存在性已由 Loader 保证）；Evaluator 属 R2-03D
- **决策**：语义类型仅 number/boolean/unsupported（number+integer 统一为 number；integer target 静态只要求 numeric，不假装能证明整数值）；builtin 仅 dt（random 属 R2-06 禁止提前进入）；函数白名单 min/max/clamp/abs/floor/ceil/round/sqrt/pow，min/max 变参 ≥2；相等仅同类型，逻辑仅 boolean×boolean，无 truthy/falsy；Validator 只读 AST（不 constant fold/不重写/不计算）；SemanticError 统一 code/message/span/identifier
- **Knowledge**：N/A —— 本轮设计全部来自冻结规格，无新事故、根因或跨轮可复用模式

## R2-03B · Expression Parser + AST —— CLOSED

- **阶段**：R2
- **任务**：把 R2-03A 的 Token[] 解析成结构明确、优先级正确、带 span 的 AST（纯语法，无任何语义）
- **目标**：为 R2-03C 语义校验与 R2-03D 求值提供唯一输入；错误能指到具体字符位置
- **变更**：新增 `src/expression/syntax/`（ast / parse-error / parse-operators / parse-primary / parser）；tests/expression 按 tokenizer/parser 子域分层（5 规则触顶触发），新增 32 项 Parser 专项（B01~B12 / C01~C09 / E01~E11）
- **原因**：Parser 只回答「语法合法吗」——banana(a) 也必须 PASS，白名单属 R2-03C；变量存在性同理
- **验证**：`npm run verify` 全绿（GOVERNANCE PASS + tsc 0 error + 79/79）；Guard 首轮真实拦截 124 行测试文件并完成 SRP 拆分；git diff --check PASS
- **测试**：32 项新增 = 结构 12（含左结合专项、两个黄金样例树形断言、span 传播）+ 调用 9（含 banana 白名单边界）+ 错误 11（五类 ParseError 全命中 + `1 + * 2` span 指向 `*`）
- **Commit**：`56482da`（实现）+ 本条目补记提交
- **遗留问题**：R2-03C 语义校验（变量存在性/函数白名单/参数数量）；R2-03D Evaluator
- **决策**：优先级冻结 `|| → && → ==/!= → 比较 → 加减 → 乘除模 → 一元 → primary/call`；全部二元左结合（递归传 prec+1）；AST 六类节点统一 NodeBase.span；分组不产生节点（span 由外层并集覆盖）；parse-operators 与 parse-primary 刻意互递归（ESM 函数声明提升保证安全）

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
