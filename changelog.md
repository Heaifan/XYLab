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

## XYLAB-AUDIT-BACKFILL-2026-08-14 · PWA / Runtime / Scatter / Batch Experiment —— IMPLEMENTED（审计补记）

- **阶段**：XYLAB-UI-F2-UA1 审计同步 `5c5431d` 之后的快速迭代补记；本条只恢复审计事实，不把未做用户验收的能力伪标为 CLOSED。
- **范围**：`5c5431d..c8b8f21`，Git 对比确认 `main` 前进 24 个提交；最早为 `c352ec4` PWA Packaging，当前最新为 `c8b8f21` Scatter Compatibility Test。
- **任务**：把 2026-08-14 实际已经落库、但未同步进 changelog 的手机部署、表达式/Runtime 控制、JSON 操作、散点图与 Batch Experiment 能力补回正式时间轴。
- **变更**：
  - PWA / Mobile：新增 manifest、service worker、应用图标与 GitHub Pages workflow；SW 导航改 network-first；localStorage 被禁用或抛错时降级为内存存储，并增加启动错误可见面与 noscript 提示，避免 hostile environment 白屏。
  - Expression / Runtime：加入 `sin` / `cos` / `PI`；PI 注入 Tick 表达式上下文；运行速度与 Tick 上限实时生效；模拟次数从实验 timeline horizon 解耦，并在 UI 支持任意模拟运行次数；新增速度与模拟次数需求文档。
  - JSON 工作流：实验面板增加清空与恢复 JSON 操作，降低手机端反复复制粘贴实验定义的成本。
  - Scatter：增加坐标辅助线与参考圆；参考圆不再依赖当前指标选择；修复二维散布可视化与 sigma 校验；兼容性与 X/Y 轴选择改为支持从多指标集合中显式选轴，并补对应测试。
  - Batch Experiment：新增 XYUI 风格 BatchPanel / ScenarioEditor / runner / types / batch.css；支持多方案比较、场景结果检查与移动端场景可视化；`knowledge/decisions/batch-experiment-v1.md` 已落库。
  - CI：Pages 构建链保留 XYLab `dist` 构建产物。
- **审计证据**：Git Compare 对 `5c5431d..main` 返回 `ahead_by=24 / behind_by=0`；变更涉及 PWA、expression、runtime、batch UI、scatter、tests、requirements、file-tree 与 knowledge；当前远端 tip 为 `c8b8f21`。
- **验证事实**：`56226c1` 提交信息记录当时测试为 322/322；其后继续新增/修改 expression、runtime、batch runner、scatter catalog/chart-model 测试，最新 `c8b8f21` 专门补 Scatter compatibility 与 axis-selection 对齐测试。当前 GitHub 未返回独立 combined-status，故本次补记不伪造“最新全量 verify 已跑”的结论。
- **三位一体对账**：`file-tree.md` 已在该 24 提交范围内同步；经验位已有 `knowledge/decisions/batch-experiment-v1.md`；本次缺口集中在审计位 `changelog.md`，因此只补时间轴，不重复制造第二份事实源。
- **遗留问题**：本条为审计补记，不代替这些快速迭代各自的用户真机验收；Batch 多距离方案、Scatter 二维散布与手机工作流仍以后续用户验收结果决定是否进入正式 CLOSED。
- **Commit 范围**：`c352ec4` → `c8b8f21`（24 commits）+ 本条审计补记提交。

## XYLAB-UI-F2-UA1 · Multi-Series + Visualization Picker（选择集 / 21 类目录 / 兼容引擎 / 11 类实现） —— IMPLEMENTED（自动门全绿 · 待用户真机验收，未 CLOSED）

- **阶段**：XYLAB-UI-F2-UA1 单轮（用户裁定「最后一轮」：A 多序列监控选择 + B XYUI-8 可视化选择器一次交付；F2/R1/R2 保持 IMPLEMENTED，真机验收并入本轮清单）
- **任务**：① Metric Row 普通点击 = Selection Toggle（Set 多选，无 Ctrl/Shift；Detail 展开与选择解耦）② 选中指标→兼容裁决→Picker→可视化；绝对值/相对变化按量纲自动仲裁 ③ 21 类目录全量注册，可用性由 Compatibility Engine 裁决，不支持 = Disabled+Reason（不删入口不伪造数据）④ Line/Area/Step/Bar/HBar/Delta/Scatter/Gauge/Range/Timeline/Table 共 11 类真实实现
- **变更**：
  - 重写 `src/ui/viewState.ts` = VisualizationSelectionState 纯函数层（selected Set / pinned≠selected / hidden / mode / viz / scatter 指派；仅 Load 重置并按 output.charts 初始化；Pause/Resume/Step/Stop/Reset/锁定一律不清；异量纲加入 → 绝对自动切相对 + 一次轻提示）
  - 新增 `src/ui/viz/` 5 文件：catalog.ts（21 类 × 8 分类 + XYUI-8 编号可追溯）/ compat.ts（Compatibility Engine + recommend 推荐规则）/ picker.tsx（桌面下拉 + Compact Bottom Sheet；推荐置顶 + 分类分组）/ VizHost.tsx（画布调度 + Legend 统一渲染 = Selection Toggle 单源 + Temporal Cursor）/ shared.ts（画布常量/宽度观测/相对基线/范围钳制）
  - 新增 `src/ui/charts/` 5 文件（LineChart 替代删除）：trend.tsx（line/area/step 三变体 + 双模式 + Tap Lock）/ bars.tsx（垂直柱/横向条/Delta 中心零线；读取时间点 = lockTime??实时）/ scatter.tsx（X/Y 指派 + ⇄ 交换 + 同 Tick 配对）/ state.tsx（gauge 阈值带 + range 区间 + tband 仅 threshold；线性语义禁仪表盘）/ misc.tsx（Timeline 事件点击 → 锁定 + Advanced Table 五列采样）
  - 重写 ValuesPanel（行点击 = Toggle；Detail chevron 与选择解耦；已选计数 + 清空头）/ VisualizationPanel（Picker + 模式 seg + 已选计数 + toast + ctx 构建）/ InspectorSheet（行点击 = toggle 选择，与图例同源）/ MetricStrip（卡片点击 = toggle；Pinned≠Selected）/ App.tsx（toast 轻提示 + Load 初始化选择 + Apply 保留选择 + Reset 仅清时间锁）
  - Icons.tsx 新增 7 个分类图标（18→25，同一冻结风格权宜 glyph，XYUI1-GAP-001 语义延续）；metricModel.cmp 导出（threshold 判定单源，State 族消费）；visualization.css UA1 样式块（89 行内：Picker/Sheet/toast/area 填充/hbar-Delta 零线/gauge 轨道/vtable/timeline/选中态统一 inset 2px accent）
  - 核心四层（protocol/expression/runtime/monitor）零改动；vendor/xyui/ 零改动；experiment.schema.json / xylab-experiment@0.1 / MonitorSnapshot 数据合同零改动；无新依赖；无第二套 XYUI 可视化规范、无第二套 IconFont
- **冻结语义**：选择 = UI 工作状态（仅新实验 Load 重置；运行控制/锁定/跟随实时绝不清空）；绝对值只许同单位；相对模式起始值 = 100%，基线 0/非数值一律跳过并提示（禁 NaN/Infinity/假 100%）；Bar/State/Table 统一消费 Temporal Cursor（Locked → 锁定 Tick 值）；Timeline 事件点击 = 锁定（XYUI-8 联动合同）；当前可视化不可用时画布如实显示 Disabled+Reason，绝不自动切换、绝不伪造数据
- **验证**：`npm run verify` 全绿（GOVERNANCE PASS 153 文件 + tsc 0 error + 321/321 = 298 零回退 + 23 新增）；`npm run build` PASS；Guard 本轮真实拦截 ValuesPanel.tsx（103 行）并压缩至 99 行；dev server HTTP 200；真机验收清单待用户执行（场景 A~G × 三断点）
- **测试**：23 项新增（tests/ui/ua1/ 4 文件）= selection 5（初始化 output.charts 优先 / fallback / Set toggle / 纯函数组 / hidden 过滤）+ arbitration 5（同单位不切换 / 异量纲自动相对 + toast / 不重复提示不移出回切 / 显式回切再触发 / 无单位不误切）+ catalog 7（21 类完整性 / data≠series Disabled / 数量上下限与 tband / 混单位提示 / 相对模式限制 / 推荐规则四组）+ chart-model 6（barRows 时间点/相对/Delta / Zero Baseline 三重防护 / relSkipped / scatterPairs 同 Tick 配对）；f2-view-model 7 项更新至 UA1 语义（focusTargets/viewToggleCompare 废除 → selectToggle/selectedTargets，断言编号不变）
- **Commit**：`929e0a1`（实现）+ 本条目补记提交（单一正式轮，≤2）
- **遗留问题**：真机验收（A 双部队同单位绝对值 / B 多 % 指标 / C 异量纲自动相对 / D Scatter 疲劳 vs 战力 / E 锁定 44s + Bar 读点 / F 取消选择立即生效 / G battle-metrics 12 watch 全目录 × 三断点 × Picker Sheet）通过后才可 CLOSED；目录中其余条目（组成/分布/热力/Event Track/依赖图）保持 Disabled+Reason，待数据形态升级后按 Catalog 接入而非另起炉灶
- **决策**：选择与可视化解耦为唯一状态源（Inspector/Legend/Chart/监控值行同源消费 VisualizationSelectionState）；可视化可用性集中在 compat.ts 裁决，禁止 UI 散落 if chart===；Pinned 与 Selected 两概念不绑死；Scatter X/Y 自动指派 + 显式改派 + 交换共存

## XYLAB-UI-F2 · Monitoring UI 收口（图标接管 + Metric Row 重排 + 图表 Focus/Compare/相对） —— IMPLEMENTED（自动门全绿 · 待用户真机验收，未 CLOSED）

- **阶段**：XYLAB-UI-F2 单轮（用户裁定：一轮一次解决三件事不拆轮；FE-A-R1/R2 保持 IMPLEMENTED，其真机验收并入本轮验收清单）
- **任务**：① 图标正式接管操作图标（Unicode ▶ ⏸ → ■ ↺ 换 Foundation.Icon 冻结风格内联 SVG，不造第二套 IconFont）② 监控值 Inspector 重排（废三列表格 → Compact Metric Row）③ 多指标不同量纲挤同一 Y 轴（Focus 默认 + Compare + 相对变化）
- **变更**：
  - 新增 `src/ui/icons/Icons.tsx`（18 个内联 SVG：Outline / stroke 1.5 / round cap·join / viewBox 16，即 Foundation.Icon 0.15 冻结风格；glyph 注册表上游缺失 = XYUI1-GAP-001 消费层权宜，不立 glyph 命名权威）；RunPanel 六个操作按钮全部换图标、保持 Icon+Text
  - 新增 `src/ui/monitor/metricModel.ts`（MetricRow 唯一模型：valueAtTime/nearestTime/metricStatus/buildRows/resolveMetrics 收敛于此；锁定值与实时值统一 formatMetric，Tap Lock 切换不再跳格式）
  - 新增 `src/ui/viewState.ts`（纯函数层：selected/pinned≤6/hidden/绝对·相对 mode；状态本体 App 持有，Load/Apply/Reset 重置）
  - 重写 ValuesPanel = Compact Metric Row（label 优先三层优先级：值→变化→统计；Detail 展开才有初值 + 聚焦/对比/固定/隐藏操作；>8 行 Dense 单行；行点击 = 图表聚焦；零横向滚动硬门）
  - 重写 MetricStrip = Pinned Cards（≤6，移动端横滚，点击聚焦；与全量 Watch 列表分工明确）；重写 LineChart = Focus 默认 + Compare（绝对值只许同单位，异单位排除并提示改用相对变化）+ 相对变化（运行开始值 = 100%，基线 0/非数值跳过并提示；threshold 线仅绝对模式绘制）
  - InspectorSheet：valueAtTime/WarnIcon 改用共享层与图标层；行 grid minmax(0,1fr)+ellipsis；values 列表进入 Compact/Medium 监控屏（此前仅 Wide 可见）；Wide 右栏 minmax(280,420)
  - 新增 `examples/battle-metrics.json`（12 watch 混单位验收样例：人/分/%/吨/m·s + threshold + boolean）
  - 核心四层（protocol/expression/runtime/monitor）零改动；vendor/xyui/ 零改动；MonitorSnapshot 数据合同零改动；无新依赖
- **冻结语义**：继承 R1/R2 —— MonitorSnapshot 唯一数据合同（Second Truth 禁令）；状态只认结构化 threshold，绝不解析事件表达式；Tap Lock 语义不变（锁定读数/跟随实时）；移动端不依赖 Hover；零横向滚动为本轮硬门
- **验证**：`npm run verify` 全绿（GOVERNANCE PASS + tsc 0 error + 298/298 = 289 零回退 + 9 新增）；`npm run build` PASS；Guard 本轮真实拦截 App.tsx（107 行）与 LineChart（107/102 行）两次并压缩至合规；dev server HTTP 200；真机验收清单待用户执行
- **测试**：9 项新增（tests/ui/f2/）= f2-view-model 7（Focus 默认首个解析目标 / Compare 增删·hidden 只隐藏不删 watch / 同单位限制排除 / Pin 上限与 resolved 过滤 / MetricRow 三层信息与统计块 / boolean 变化次数不伪造统计 / 锁定时刻读取）+ f2-samples 2（examples 两件经真实 Loader 加载成功；battle 样例 12 watch、≥4 单位、含 threshold 与 boolean）
- **Commit**：`a121b9c`（实现）+ 本条目补记提交（单一正式轮，≤2）
- **遗留问题**：真机验收（fatigue-basic 单指标 + battle-metrics 12 指标 × 三断点 × Focus/Compare/相对/Tap Lock/Dense 行/Pinned 横滚）通过后才可 CLOSED；图表 Pan/Zoom、Run Compare、Threshold Band 继续推迟
- **Knowledge**：UPDATED —— 新 decisions/f2-monitoring-ui-close.md（图标层权宜边界 / MetricRow 唯一模型 / ViewState 语义 / 图表双模式三冻结规则）；ui-responsive-shell.md F2 修订（监控值行三断点均可见 + Wide 右栏 280~420 + 零横向滚动硬门）

## FE-A-R2 · Mobile-first XYUI Experiment Workbench —— IMPLEMENTED（自动门全绿 · 待用户真机验收，未 CLOSED）

- **阶段**：FE-A 第二轮（用户裁定：R1 保持 IMPLEMENTED 待验收但不再阻塞 R2；原「R2 换皮 → R3 可视化工作区」合并为本轮一次交付，下一轮必须一次出现肉眼可见的成果；R2-A → R2-B → R2-C 三块连续执行）
- **任务**：把暗色原型改造为 Light XYUI + 手机竖屏优先（390×844 冻结主目标）+ PC/平板自适应 + XYUI-8 实时曲线 + Metric + Bottom Sheet Inspector + 复制 JSON + Save Run + Note + History
- **变更**：
  - 新增 `src/ui/theme/light-consumer.css`（B 类 Light 消费层：`--xylab-*` 前缀冻结值 app #F3F6F8 / panel #F8FAFB / surface #FFFFFF / border #D5DEE4 / text #243744 / secondary #6F828C / accent #326F8A / accent-soft #E7F0F3；warning/critical 只在 theme 定义；曲线色板 = XYUI8-GAP-001 权宜、主按钮文字 #fff = XYUI3-GAP-001 权宜，均注释登记）
  - 新增 `src/ui/visualization/` 5 文件：VisualizationPanel（图表目标解析：output.charts 优先，回退前 2~4 numeric watch）/ MetricStrip（statistics 投影 + 仅结构化 threshold 判 warning，双通道文字+色）/ LineChart（纯 SVG：弱网格/X=时间/Y 自动量程/实时追加/Fit/跟随实时/Tap 锁定十字线/结构化 threshold 线/事件 marker）/ InspectorSheet（锁定时刻检查器，sheet/panel 双形态）/ visualization.css
  - 新增 `src/ui/history/` 5 文件：types（SavedRun V1 = runId/savedAt/experimentId+Name/definitionSnapshot 必含/runtimeStatus/time/tickIndex/monitorSnapshot/note）/ runStore（localStorage `xylab.runs.v1`，可注入存储，失败明确报错不假装成功）/ SaveRunSheet（XYUI-7 Bottom Sheet：备注 + [保存实验结果] + [保存并复制 JSON]）/ RunHistory（最新在前，展开详情 + 复制该 Run 的 JSON）/ history.css
  - 新增 `src/ui/actions/`（ExperimentActions [复制 JSON][保存结果] 一等可见 + clipboard 兜底实现）与 `src/ui/format.ts`（浮点噪音消除：integer 0 位 / float ≤4 位，仅显示层）；新增 `src/ui/shell/BottomNav.tsx`（shell 第 5 文件：实验/监控/日志/历史，手绘 SVG 图标）
  - 重写：Layout（三断点新组合：Compact 底导航+单列+Bottom Sheet，Medium 可折叠辅助栏，Wide 左实验参数/中运行可视化/右检查器当前值/底日志）/ TopBar（LIVE 状态芯片 + 时间）/ styles.css（全 Light 化，旧暗色整体替代）/ App.tsx（tab/lockTime/saveOpen/runs 状态；Load/Apply/Reset 清锁定）；main.tsx 加两处 css 引入；index.html viewport-fit=cover（iOS 安全区）
  - 核心四层（protocol/expression/runtime/monitor）零改动；vendor/xyui/ 零改动；createMonitoredRuntime 数据链零重建
- **冻结语义**：MonitorSnapshot 唯一数据合同（Second Truth 禁令继承）；复制 JSON = 当前生效 Definition（含已应用参数、不含草稿）；Save Run 仅手动触发（无自动保存/云同步）；Metric/Threshold 只认协议结构化字段——绝不反解析事件表达式（事件只作时间轴 marker + Inspector 告警行）；移动端 Tap Lock 优先（禁依赖 Hover）；Load/Apply/Reset 清锁定
- **验证**：`npm run verify` 全绿（GOVERNANCE PASS 131 文件 + tsc 0 error + 289/289 = 268 零回退 + 21 新增）；`npm run build` PASS；dev server 390×844 冒烟 HTTP 200；Guard 本轮真实拦截 SaveRunSheet（114 行）与 LineChart（127 行）并完成 SRP 压缩（buildRun 归位 runStore / 图表组件瘦身）；真机验收 M01~M12 待用户执行
- **测试**：21 项新增（tests/ui/r2/）= r2-format 5（T15 浮点噪音消除 0.1+0.2→0.3、99.75999999999999→99.76、integer 0 位、formatMetric、NaN/Infinity 安全直通）+ r2-chart-model 5（T02 图表目标回退与 output.charts 优先/非法声明跳过/超 4 截断、T16 valueAtTime·nearestTime 锁定读取、metricStatus 仅结构化 threshold）+ r2-run-store 5（T09/T10 buildRun 含 definitionSnapshot+monitorSnapshot、T11/T12 备注往返与刷新持久、T13 最新在前、T14 Quota 失败明确报错 + 损坏数据兜底）+ r2-workflow 6（T01 Metric+Chart 非空、T03/T04 Pause 冻结·旧循环零写入·Resume 连续 201 点、T05 Reset 回 time=0 单点、T06 Apply 全新句柄零残留、T07/T08 复制 JSON = 新参数 Definition 且不含草稿值）
- **Commit**：`106607f`（实现）+ 本条目补记提交（单一正式轮，≤2）
- **遗留问题**：真机验收 M01~M12（三断点 × Light/曲线/锁定联动/保存/历史）通过后才可 CLOSED；Run Compare、图表 Pan/Zoom、Threshold Band、云同步、图像导出均明确推迟（禁做半成品）
- **Knowledge**：UPDATED —— 新 decisions/r2-light-consumer-workbench.md（B 类消费层归属 + GAP 权宜登记 + 结构化状态禁解析表达式 + 可视化消费规则 + Save Run V1 边界）；ui-responsive-shell.md 修订为 FE-A-R2 权威版（三断点新组合 + Tap Lock 联动 + 实验循环合同 + 数值格式规范）

## XYLAB-XYUI-CONSUMER-INTAKE · XYUI 消费引入与宪法修订 —— CLOSED

- **阶段**：治理轮（执行用户 2026-08-13 Consumer Intake 裁定；FE-A-R1 保持 IMPLEMENTED 待真机验收不受本轮影响；FE-A-R2 待正式实现令）
- **任务**：批准 XYUI Core Pack 为 XYLab UI 设计权威；把未跟踪的根目录 `xyui/`（70 件建设过程物料）裁剪为 Consumer Pack 迁入 `vendor/xyui/`；锁定上游 provenance 与实测 SHA；宪法解除 UI Constitution RESERVED
- **变更**：
  - 新增 `vendor/xyui/` 33 件 = packs/core-0.1/**（manifest/AGENT-GUIDE/README/gaps）+ registry/foundation/foundation-registry.json + tokens/architecture/{token-canonical-map.json, token-architecture.json} + specs/XYUI1~8 ×（canonical/mapping/gaps）24 件 + audit/cross-audit.md + 新建 UPSTREAM-PIN.json
  - 排除项（不入 vendor，随根目录 xyui/ 移出仓库）：source/**、audit/XYUI*/**、governance/**、registry 辅助件（examples/schema/identity-map/relationship-map/validation-report/README）、tokens/architecture/token-architecture.md、tokens/audit/**
  - UPSTREAM-PIN.json：XuanYuEngine-XYUI / feat/XYUI-A / 5f288e6 / pack 0.1.0 / manifest SHA `c0ebe74b…4bf3a` / localMutation=0；含全部 33 件实测 SHA256 与 9 处上游 manifest SHA 不符的如实登记（原因未知，UPSTREAM-UNKNOWN）
  - 宪法 Article 5：RESERVED → RATIFIED（XYUI Core Pack = 批准 UI 设计权威；Foundation/组件/可视化冲突以 vendored Canonical 为准；vendor 只读，变更经 XYUI_GAP 回流上游；XYLab 只做项目组合不私设第二套视觉规范；Light/Dark Token Source 暂停期禁止伪造 canonical，缺失 Light 标量走 B 类消费层/GAP）；同步术语行与 Article 13 报告块
  - 根目录 `xyui/` 移出仓库至 QoderWork 工作区 `.trash/XYLab-root-xyui-20260813`（本环境系统回收站对目录不可用，已验证 70 件完整可恢复）
- **原因**：未跟踪的 xyui/ 建设过程物料不可原样入库；消费侧只需权威契约（Canonical/Registry/Token Map/Manifest/GAP），且来源可溯、内容可校验、永久只读
- **验证**：`npm run verify` 全绿（GOVERNANCE PASS 116 文件 + tsc 0 error + 268/268 零回退）；`npm run build` PASS；`git diff --check` PASS；vendored 文件与交付件逐字节一致（逐件实测 SHA256）
- **测试**：268/268 零变化（本轮无源码改动，vendor/ 在 governance-guard 扫描根之外）
- **Commit**：`97d6aa6`（vendor + 宪法 + knowledge）+ 本条目补记提交（单一正式轮，≤2）
- **遗留问题**：上游 manifest 9 处 SHA 与交付件不符已登记 UPSTREAM-PIN.manifest_sha_discrepancies，待上游解释；FE-A-R2（Light Consumer Token 层 + 手机竖屏实验工作台 + XYUI-8 可视化 + Save Run/Note/Copy JSON）等待正式实现令
- **决策**（用户裁定，长期生效）：
  - 产品方向冻结：Light First · Mobile Portrait First · 低饱和 · 紧凑/高信息密度 · XYUI-8 Visualization First；Mobile Portrait = Primary Design Target，Desktop/Tablet = Adaptive Expansion；移动核心工作流 = JSON → 参数 → Run → 可视化 → Save Run → Note → History → Copy JSON；一等操作 = 复制当前生效 JSON / 保存运行结果 / 备注 / 历史
  - Dark 档参考值不是 XYLab 目标皮肤（用户纠偏：不得把 Dark Foundation 色当新主题）
  - 标准消费流程（后续每轮必经）：读 AGENT-GUIDE → 读 Manifest → 读 Foundation → 按当前任务读相关 Canonical → 查 Mapping/GAP → 实现；移动端层级映射 = 主规范 XYUI-8 / 布局 XYUI-5 / 输入 XYUI-2 / 状态 XYUI-4 / 文本 XYUI-1 / 数据 XYUI-6 / 导航 XYUI-3 / 浮层 XYUI-7 / 基础 XYUI-0
- **Knowledge**：UPDATED —— 新 decisions/xyui-consumer-intake.md（UI 权威批准 + vendor 只读纪律 + A/B 分类 + 消费流程）

## FE-A-R1 · Monitoring Bridge —— IMPLEMENTED（自动门全绿 · 待用户真机验收，未 CLOSED）

- **阶段**：FE-A 第一轮（XYUI Integration & Monitoring Workspace；路线：R1 Monitoring Bridge ← → R2 XYUI Foundation Integration → R3 Visualization Workspace）
- **任务**：把 CLOSED 的 R3 Monitoring Core 正式接入现有 Web Shell：数据链从「Controller→controller.state→UI 100ms 轮询→UI 自造 diff 日志」改为「createMonitoredRuntime()→{Controller+MonitorSession}→MonitorSnapshot→UI」
- **变更**：App.tsx 状态收敛为 MonitoredRuntime 句柄（Load/Apply 均经 createMonitoredRuntime）；useMonitor 降级为纯投影器（readBridge + 100ms 轮询，UI diff 日志生成代码删除）；RunPanel Reset 改 handle.reset() 联合重置；ValuesPanel 改吃 snap.watches/series/statistics（协议序渲染，数值 Δ/min/max/avg/样本数/初值，布尔变化次数，其余仅 series）；EventLog 改吃 snap.logs（change 用结构化 previousValue/currentValue，不再解析 message）；核心四层（protocol/expression/runtime/monitor）零改动
- **Second Truth 废除**：UI 不再自造任何模拟事实——监控值/统计/事件全部来自 MonitorSnapshot；tick 级采集属核心 Session，UI 100ms 轮询仅是显示投影
- **验证**：`npm run verify` 全绿（GOVERNANCE PASS 116 文件 + tsc 0 error + 268/268 = 254 零回退 + 14 新增）；`npm run build` PASS；git diff --check PASS；真机验收 M01~M09（三断点 IPO）待用户执行
- **测试**：14 项新增 = tests/ui/r1-monitor-bridge 8 项（T01 Load 同生命周期 / T04 Series 随 Tick 增长 / T02+T13 Apply 全新句柄不继承旧 Series·Log·Statistics / T09+T10 Pause 冻结·旧循环苏醒零写入·Resume 连续 101 点 / T11 Stop 保留证据 / T12 联合 Reset / T14 Failed 保留失败前证据 / T15 transitions 守卫零回退）+ r1-monitor-projection 6 项（T03 watches 协议序 / T05 数值统计投影 / T06 布尔统计投影 / T07+T08 日志域收敛·结构化前后值·边缘触发单次·无 UI 自造来源 / 非数值仅 series / readBridge EMPTY 与镜像）
- **Commit**：`1998983`（实现）+ 本条目补记提交
- **遗留问题**：真机验收 M01~M09 通过后才可 CLOSED；Chart/Series 曲线、Statistics 工作区、Export、Recent、XYUI 组件属 FE-A-R2/R3（本轮明确禁止）
- **Knowledge**：UPDATED —— ui-responsive-shell.md 修订为 FE-A-R1 权威版（MonitorSnapshot 唯一数据合同 + 句柄与联合 Reset + Second Truth 废除 + 监控投影显示规范）

## R3 · Monitoring —— CLOSED（一次整轮完成，不拆子阶段）

- **阶段**：R3 数据监控核心（路线：R2 ✅ → UI-F1 ✅ → R4-F1 ✅ → R3 ← → R4-F2 Monitoring UI → Mobile/Deploy）
- **任务**：Watch Registry + bounded Series/History + 统一 Event/Change Log + Statistics + Monitoring Session Lifecycle 五能力一次完成
- **变更**：新增 `src/monitor/` 5 文件（types/registry/accumulators/events/session）；Controller 新增 `observer?: TickObserver` 观察钩子（advance 单一推进点后同步回调 TickObservation——纯输出投影，零语义变化，on/off 不影响模拟）；tests/monitor 5 文件 21 用例；Knowledge 入库 2 决策（monitoring-observer-only + event-edge-trigger）
- **冻结语义**：Observer Only（监控绝不回写 RuntimeState，Event 条件不注入 PRNG）；false→true 边缘触发（持续 true 不重复、回落重武装可再触发、repeat 字段 R3 不产生行为差异）；Bounded Series 默认 10000 点保最新（log 同 10000 封顶）；Reset = Runtime + Session 一起重建（清系列/日志/统计/edge-state 并重记 time=0 初始点）；Pause/Resume/Stop/Completed/Failed 全保留证据；Runtime Failure 入统一日志（kind runtime / level critical）；未知 watch target 与非法事件条件构建期警告 + 禁用（不静默，Loader 为第一道、registry/compile 为第二道）
- **验证**：`npm run verify` 全绿（GOVERNANCE PASS 110 文件 + tsc 0 error + 254/254 = 233 零回退 + 21 新增）；Guard 拦截并压缩 session（106→100）与 3 个测试文件；`npm run build` PASS；diff-check PASS
- **测试**：21 项 = G1 黄金案例（Series(0,10)(1,10.4)(2,10.8)(3,11.2) + change 日志 + 统计 initial 10/current 11.2/delta 1.2/avg 10.6/sampleCount 4）+ G2 value 模式 + G3 未知 target 第二道防御 + G4 threshold watch 边缘触发（tickIndex 2/4）+ E1~E5（单次触发不刷屏/重武装再触发/未知标识符与非布尔条件防御/失败日志）+ S1~S3（数值全统计/布尔 changeCount/string 仅 series）+ H1 cap=5 保最新（16~20）+ H2 Reset 重建初始点 + L1~L5（Completed/Failed/Pause-Resume 连续 101 点/Stop 零追加/Reset 事件再触发）+ D1 on/off 模拟一致 + D2 四档监控一致
- **Commit**：`a09428d`（实现）+ 本条目补记提交
- **遗留问题**：Watch/Log/Chart/Statistics UI、Export、Recent、Downsampling、Event cooldown/once、entity.hp 全部移交后续轮次（R3 明确禁止）；React 暂不消费 MonitorSnapshot（R4-F2 接线）
- **Knowledge**：UPDATED —— 新 decisions/monitoring-observer-only.md（单向数据流 + on/off 与四档确定性）+ decisions/event-edge-trigger.md（边缘触发语义 + repeat 未来扩展）

## R4-F1 · Experiment Workflow & Runtime Bridge —— CLOSED

- **阶段**：R4 功能轮（按用户裁定跳过 R3；路线冻结 R2 ✅ → UI-F1 ✅ → R4-F1 ← → R3 Monitoring → R4-F2 → Mobile/Deploy）
- **任务**：一次打通 JSON→粘贴/Open→Loader→自动参数 UI→Runtime→Run/Pause/Resume/Step/Stop/Reset→x1/x10/x100/MAX→实时变量值；React 只消费 Controller/API
- **变更**：新增 draft.ts（草稿守卫 + withInitialValues）、RunPanel.tsx（运行区+Compact 主次控制条）、ValuesPanel.tsx（当前值）；TopBar 改实验名/描述（控制下沉）；ExperimentPanel 加 Open JSON + 名称描述头部；VariablesPanel 改草稿+应用重建；useMonitor 加控制器切换重置；Layout 升级 Wide 三栏/Medium 折叠/Compact 条+页签；移除 MonitorPanel.tsx；tests/ui/r4-f1-draft 5 用例；Knowledge 修订 ui-responsive-shell.md
- **参数边界（本轮核心）**：禁止 React 直写模拟内部状态——参数修改 = 草稿 → withInitialValues（integer 拒小数/number 拒 NaN/非法覆盖静默忽略）→ createController 正式重建；原始 Definition 不可变；旧 Controller 零影响；应用仅 ready 态可用
- **验证**：`npm run verify` 全绿（GOVERNANCE PASS 104 文件 + tsc 0 error + 233/233）；`npm run build` PASS；真机浏览器全流程：内置示例名/描述显示 → 改 fatigue_rate 0.08 → 应用 → Step fatigue=0.4 → Reset 恢复 → MAX completed（fatigue=240/time=600）→ 粘贴自定义实验四档全跑完且完全一致（a=10/b=20/time=10/completed）→ 非法 JSON 报 Loader 错误且不破坏已加载实验 → 390px compact（主次控制条+页签，按钮可操作）/800px medium（折叠）/1280px wide（三栏）布局自动切换
- **Commit**：`30f5d03`（实现）+ 本条目补记提交
- **遗留问题**：Watch/History/Event Log/Chart/Statistics/Export/Recent 全部移交 R3/R4 Monitoring（本轮明确禁止）；Open JSON 为按钮式文件选择（拖拽不做）；x1 全速跑完 600 tick 需 10 分钟（验收用小实验四档验证，速度确定性另有 R2-05BC D01 测试锁定）
- **Knowledge**：UPDATED —— ui-responsive-shell.md 修订为 R4-F1 权威版（草稿重建边界 + 运行区布局合同 + 真机验收记录）

## UI-F1 · Responsive Web Shell —— CLOSED

- **阶段**：R4 第一轮（按用户裁定：R2 CLOSED 后直接进入 UI，TypeScript+React+Vite）
- **任务**：可运行响应式 Shell——Wide/Medium/Compact 三模式，覆盖 PC 横屏/平板横竖屏/手机横竖屏；React 只做 UI/状态投影，模拟核心零语义改动
- **变更**：新增 `src/ui/`（shell 4 / experiment 4 / monitor 3 / 根 3 文件）+ index.html + vite.config.ts；tsconfig 加 jsx/resolveJsonModule/DOM lib；scripts 加 dev/build；tests/ui/breakpoints 3 用例；Knowledge 入库 decisions/ui-responsive-shell.md + pitfalls/vite-dev-ipv4-bind.md
- **前置兼容修复**：protocol/validator.ts 的 Schema 加载由 node:fs 改为打包器 JSON 内联（字节不变；R2-01 原注释已预告 R4 需此改动）——src 现无 node:* 依赖，Loader Node/浏览器同行为
- **验证**：`npm run verify` 全绿（GOVERNANCE PASS 101 文件 + tsc 0 error + 228/228）+ `npm run build` 产物正常 + 真实浏览器冒烟：加载内置示例 → 参数面板自动生成（滑杆/数值/单位标签）→ MAX 运行 600 Tick → completed，time=600，fatigue=150（5×0.05×600），日志含变化行与状态行
- **决策**：三断点冻结（Wide≥1024/Medium≥640/Compact<640，纯函数单测）；轮询投影合同（100ms 轮询 + UI 层 diff，Run Loop 不发事件）；参数编辑 = ready 态直写 state.variables（R2-02 mutable 合同），运行中只读；按钮可用性由 transitions 守卫投影；单一 Controller 权威持有；组件按实际需求拆分不提前建 XYUI 组件库；视觉仅基础暗色不扩展新规范
- **Commit**：`0d0f611`（实现）+ 本条目补记提交
- **遗留问题**：图表区为占位（R3/R4 后续接入）；MAX 速度下轮询日志只呈现首末状态（x1/x10 可见增量，未来 R3 快照历史解决）；Medium/Compact 断点已单测但未真机浏览器尺寸验证（R6 验证轮）
- **Knowledge**：UPDATED —— 新 decisions/ui-responsive-shell.md（UI/Runtime 投影边界合同）+ pitfalls/vite-dev-ipv4-bind.md（Windows vite IPv6 绑定坑）

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