# FE-A-R2 · Light Consumer Workbench（B 类消费层 + 结构化状态 + 可视化消费边界）

- 类别：decisions
- 入库条件：③ 重要架构决策
- 日期：2026-08-14

## 背景

XYUI Core Pack 已批准为 UI 设计权威（宪法 Article 5 RATIFIED），但 Light/Dark Token Source 处于暂停期——Light 标量禁止伪造 canonical。FE-A-R2 同时要求把暗色原型改造成 Light、手机竖屏优先（390×844 冻结主目标）、带实时曲线与实验闭环（Copy JSON / Save Run / Note / History）的工作台。本轮因此建立三条长期有效的消费边界：Light 消费层的归属、可视化如何消费 MonitorSnapshot、以及「状态/告警」证据的唯一来源。

## 决策

**1. Light Consumer Layer = B 类消费层，不是新 XYUI Canonical。**

- `src/ui/theme/light-consumer.css` 使用 `--xylab-*` 前缀，与 canonical token 命名空间隔离；全部值为用户裁定的 B 类冻结值（app #F3F6F8 / panel #F8FAFB / surface #FFFFFF / border #D5DEE4 / text #243744 / secondary #6F828C / accent #326F8A / accent-soft #E7F0F3；warning/critical 只在 theme 层定义，组件不散落硬编码颜色）。
- canonical 缺失处以 GAP 替代并如实登记：曲线色板四色 = XYUI8-GAP-001 消费层权宜；主按钮文字色 #fff = XYUI3-GAP-001 权宜。两处均在 CSS 注释标注来源，不伪装成 XYUI 出处。
- Dark 参考值不是 XYLab 目标皮肤；旧暗色壳层（#0f1115 系）由本轮 Light 层整体替代，不再复活。
- 上游未来补齐 Light canonical 时，逐项替换 `--xylab-*` 引用即可；消费层本身永不成为权威。

**2. 状态与告警证据只来自结构化字段，禁止解析事件表达式。**

- Metric 状态只有 ok/warning 两态：warning 仅当协议声明了 threshold watch 且 statistics.current 满足其结构化阈值比较时产生。
- 协议事件（如 `fatigue >= 70`）只以图表时间轴 marker + Inspector 告警行呈现；绝不反解析 expression 文本来伪造 Threshold Band。
- 颜色不作为唯一通道：warning Metric 同时给出文字标记（XYUI-4 ColorOnlyState Forbidden）。

**3. 可视化消费规则（XYUI-8 管辖）。**

- 数据源唯一 = MonitorSnapshot：曲线吃 snap.series，Metric 吃 snap.statistics，告警吃 snap.logs；UI 不产生任何模拟事实（Second Truth 禁令，R1 继承）。
- 图表目标解析优先级：先取 `output.charts` 中 x='time' 且 y 在 series 中实际存在的声明；否则回退前 2~4 个 numeric watch。协议未声明 charts 时不虚构曲线组合。
- 纯 SVG 绘制，禁止引入图表库；移动端交互 Tap Lock 优先（点击曲线 → nearestTime 吸附最近样本时刻 → Metric/Inspector/图表十字线联动），Hover 只是桌面增强；锁定值读取语义 = valueAtTime（time ≤ t 的最后一个样本点）；Load/Apply/Reset 清除锁定。
- 数值显示纠偏：integer 0 位小数、float ≤4 位小数（99.75999999999999 → 99.76、1.2000000000000002 → 1.2），格式化只作用于显示层，底层数值永不取整。

**4. Save Run V1 = 手动、本地、证据完整。**

- 仅 [保存结果] 按钮触发；无自动保存、无云同步、无账户。
- SavedRun 必含 definitionSnapshot（可复现性权威）与 monitorSnapshot（现场证据）；存储介质 = 浏览器 localStorage（key `xylab.runs.v1`），不引入存储库。
- 成功仅在真实写入后给出明确反馈；Quota/损坏数据等失败明确报错，绝不假装成功。

## 禁止（本轮及后续消费红线）

- 禁止在消费层使用 canonical 命名空间或为缺失 canonical 私补数值（只能 GAP 登记或标 UNRESOLVED）。
- 禁止反解析事件/公式表达式文本获取阈值、条件或任何语义。
- 禁止可视化层引入图表库、UI 框架库或任何新第三方依赖。
- 禁止 UI 自产模拟事实（Second Truth 禁令）。
- 禁止把 [复制 JSON] / [保存结果] 藏进次级菜单——一等操作必须在手机与 PC 同时可见。

## 验证方式

- tests/ui/r2/ 四文件 21 项：r2-format（浮点噪音消除/格式分层/安全直通）、r2-chart-model（目标解析优先级与回退/valueAtTime·nearestTime/metricStatus 仅结构化阈值）、r2-run-store（快照完整性/备注往返/最新在前/Quota 失败反馈/损坏数据兜底）、r2-workflow（Metric+Chart 非空/Pause 冻结·Resume 连续/Reset 回初值/Apply 零残留/复制 JSON = 生效 Definition 且不含草稿）。
- `npm run verify` 289/289（268 零回退 + 21 新增）；GOVERNANCE PASS 131 文件；build PASS。
- 真机验收清单 M01~M12（三断点 × Light/曲线/锁定联动/保存/历史）待用户执行。
