# UI 投影边界合同（UI-F1 建立，R4-F1 修订，FE-A-R1 修订）

- 类别：decisions
- 入库条件：③ 重要架构决策
- 日期：2026-08-13（FE-A-R1 修订）

## 背景

UI-F1 建立 Web Shell：React 只负责 UI 与状态投影，模拟核心（Protocol/Runtime/Expression/Tick/Controller）保持纯 TypeScript 框架无关。必须第一版同时支持 PC 横屏 / 平板横竖屏 / 手机横竖屏。FE-A-R1 将 CLOSED 的 R3 Monitoring Core 正式接入 Shell：UI 数据链收敛为 createMonitoredRuntime → MonitorSnapshot。

## 决策

**三模式断点冻结**（纯函数 getBreakpoint，可单测）：

```text
Wide    ≥1024  → 左(实验+参数) | 中(监控) | 底(日志)    PC 横屏 / 平板横屏
Medium  ≥640   → 上(实验+参数) | 中(监控) | 底(日志)    平板竖屏 / 手机横屏
Compact <640   → 页签切换（参数/监控/日志）             手机竖屏
```

**UI/Runtime 投影边界（FE-A-R1 修订后权威版）**：

1. **MonitorSnapshot 唯一数据合同（FE-A-R1 修订）**：UI 只消费 session.snapshot() 的 MonitorSnapshot（watches/series/logs/statistics/session）。UI-F1 的「UI 层 diff 日志」彻底废除——UI 不再生成任何模拟事实（Second Truth 废除）。tick 级采集属核心 Session（每次成功 Tick 精确落账），UI 100ms 轮询仅是显示投影，二者不得混淆。
2. **Monitored Runtime 句柄（FE-A-R1 修订）**：App 权威持有 createMonitoredRuntime(definition) 返回的 { controller, session, reset() } 句柄。Load/Apply 均创建全新句柄；Reset = handle.reset() 联合重置（Runtime + Session 一起重建：清系列/日志/统计/edge-state 并重记 time=0 初始点），禁止只调 controller.reset()。
3. **参数修改 = 草稿 → 正式重建边界（R4-F1 建立，FE-A-R1 句柄升级）**：禁止 React 直写模拟内部状态。控件只写 DraftOverrides → 「应用并重新初始化」→ withInitialValues（类型守卫：integer 拒绝小数、number 拒绝 NaN，非法覆盖静默忽略）生成新 Definition → createMonitoredRuntime 重建。原始 Definition 永不修改（RS-01）；旧句柄零影响（含全部监控历史）；应用仅在 ready 态可用。
4. **按钮可用性由 transitions 守卫投影**（canRun/canPause/…），UI 不做第二套状态判断。
5. **组件只按实际需求拆分**（Shell/Experiment/Monitor 三组），不提前建设 XYUI 组件库；视觉仅用基础暗色与既有约定，不扩展新规范。
6. **R4-F1 运行区布局合同**：Wide = 左(实验/参数) 中(运行区) 右(当前值) 底(日志)；Medium = 辅助面板(可折叠) + 主区(运行+当前值)；Compact = 顶部紧凑控制条 + 页签(参数/当前值/日志)。Compact 主次层级：Run/Pause/Resume + 速度直显，Step/Stop/Reset 入「更多」——禁止十键横排。
7. **监控投影显示规范（FE-A-R1）**：Watch 表按协议声明顺序渲染；number/integer watch 显示 Δ/min/max/avg/样本数/初值；boolean watch 显示变化次数 + 初值；其余类型仅 series 不假装统计；EventLog 对 change 条目渲染结构化 previousValue/currentValue，绝不反解析 message；日志容量由核心 logCap 封顶，UI 不自设上限。

**前置兼容修复**：`protocol/validator.ts` 的 Schema 加载由 node:fs 改为打包器 JSON 内联（字节不变，R2-01 原注释即预告 R4 需此改动）——src 现无任何 node:* 内置模块依赖，Loader 在 Node 与浏览器同行为。

## 影响

- 后续可视化（Series 曲线 / Statistics 工作区，FE-A-R3）直接消费同一 MonitorSnapshot，数据链零改动。
- 未来 XYUI 组件库可逐步替换 Shell 组件而不动 Runtime 合同。
- 手机端第一版即可用（Compact 页签），不后补。

## 验证方式

- 断点纯函数 3 项 + 草稿 5 项 + FE-A-R1 监控桥/投影 14 项（tests/ui/r1-monitor-bridge、r1-monitor-projection）全绿。
- R4-F1 真机验收全流程（真实浏览器）：内置示例显示「步兵基础疲劳测试」→ 改 fatigue_rate 0.05→0.08 → 应用重建 → Step fatigue 0→0.4 → Reset 恢复 → Run MAX completed（fatigue=240，time=600）→ 粘贴自定义实验 x1/x10/x100/max 四档全部 completed 且 a=10/b=20 完全一致 → 非法 JSON 显示 Loader 错误且不破坏已加载实验 → 模拟 390px（compact 主次控制条 + 页签，Run/Reset 可操作）→ 800px（medium 折叠）→ 1280px（wide 三栏）。
- FE-A-R1 真机验收清单 M01~M09（三断点 IPO）待用户执行——自动门全绿但未 CLOSED。
