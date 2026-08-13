# UI 投影边界合同（UI-F1 建立，R4-F1 修订，FE-A-R1 修订，FE-A-R2 修订）

- 类别：decisions
- 入库条件：③ 重要架构决策
- 日期：2026-08-14（FE-A-R2 修订）

## 背景

UI-F1 建立 Web Shell：React 只负责 UI 与状态投影，模拟核心（Protocol/Runtime/Expression/Tick/Controller）保持纯 TypeScript 框架无关。FE-A-R1 将 R3 Monitoring Core 接入 Shell：数据链收敛为 createMonitoredRuntime → MonitorSnapshot。FE-A-R2 将 Shell 改造为浅色移动优先实验工作台：Metric + SVG 实时曲线 + Tap Lock Inspector + Copy JSON + Save Run/Note/History。

## 决策

**三模式断点冻结（断点值不变，组合位置 FE-A-R2 修订）**：

```text
Wide    ≥1024  → 左(实验+参数) | 中(动作+运行+可视化) | 右(Inspector+明细表) | 底(日志)
Medium  ≥640   → 辅助栏(实验+参数,可折叠) | 主区(动作+运行+可视化+Inspector) | 底(日志)
Compact <640   → 单栏 + Bottom Nav（实验/监控/日志/历史），手机竖屏 = 主设计目标（390×844 冻结）
```

组件不换、语义不换，只改组合位置。参数不再独占一级导航（归入「实验」页签）。

**UI/Runtime 投影边界（FE-A-R1 建立，继续有效）**：

1. **MonitorSnapshot 唯一数据合同**：UI 只消费 session.snapshot()（watches/series/logs/statistics/session）。UI diff 日志已废除（Second Truth 废除）；tick 级采集属核心 Session，UI 100ms 轮询仅是显示投影。
2. **Monitored Runtime 句柄**：App 权威持有 { controller, session, reset() }。Load/Apply 均创建全新句柄；Reset = handle.reset() 联合重置（FE-A-R2 起同时清空时间锁）。
3. **参数修改 = 草稿 → 正式重建边界**：控件只写 DraftOverrides → withInitialValues → 新句柄。原始 Definition 永不修改；应用仅在 ready 态可用。
4. **按钮可用性由 transitions 守卫投影**，UI 不做第二套状态判断。

**FE-A-R2 新增合同**：

5. **可视化数据链**：Metric/Chart/Inspector 全部只读 MonitorSnapshot。Series 解析：output.charts 声明优先（x 必须 = time）；无声明 → fallback Watch 中前 2~4 个 Numeric Series。禁止解析 event expression 发明 threshold——阈值线只画协议结构化 threshold watch；Metric 状态只由结构化阈值比较判定，且文字+颜色双通道（ColorOnlyState Forbidden）。
6. **时间锁（Tap Lock）联动**：移动端禁依赖 Hover；Tap = 锁定最近采样时间，锁定后 Metric/Chart/Inspector 同步读锁定时间 series（valueAtTime = ≤t 最后一点），锁定时间文字必显；「跟随实时」解锁；Load/Apply/Reset 清锁。Pan/Zoom 本轮不做，不做半成品。
7. **实验闭环**：一级动作 [复制 JSON][保存结果] 手机/PC 直显，禁藏菜单。复制 = 当前有效 Definition（JSON.stringify，含 Apply 后新参数；草稿永不入 JSON）。Save Run V1 = Definition Snapshot + MonitorSnapshot 全量落盘 localStorage，只手动保存、成败明确不假装；History newest first。
8. **数值显示格式化**：整数 0 位 / 一般浮点 ≤4 位（去尾零）/ Metric 强调值固定 2 位；只格式化显示，底层值不 Round。
9. **Light Consumer Layer（B 类消费层）**：视觉值集中于 theme/light-consumer.css（色值冻结自用户裁定），组件禁散落硬编码。Series 色板 = XYUI8-GAP-001 消费层临时回答；OnAccent = XYUI3-GAP-001 消费层临时回答——回流 XYUI 前不得私扩。Dark 档不是目标皮肤。

## 影响

- R3 可视化工作区（FE-A-R3）在本轮已提前落地核心（Metric/Series 曲线/Inspector），后续扩展 = Compare/Pan/Zoom/Statistics 工作区。
- 云同步/用户账户/导出图片明确推迟；localStorage 是 V1 权宜，升级时换 runStore 实现即可（storage 可注入）。

## 验证方式

- tests/ui/r2/ 21 项（format 5 / chart-model 5 / run-store 5 / workflow 6）+ R1 桥/投影 14 项 + 断点 3 项 + 草稿 5 项全绿；289/289 总绿。
- FE-A-R2 真机验收清单 M01~M12（390px 浅色无横向滚动 / 粘 JSON / Apply / 复制 / Run 联动 / Pause-Resume / Tap 锁定 / 保存+备注 / 刷新后历史 / 打开历史 Run / Reset 联动 / PC 工作台）待用户执行——自动门全绿但未 CLOSED。
