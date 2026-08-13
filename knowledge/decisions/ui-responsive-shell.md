# UI-F1 · 响应式 Shell 与 UI/Runtime 投影边界合同

- 类别：decisions
- 入库条件：③ 重要架构决策
- 日期：2026-08-13

## 背景

UI-F1 建立 Web Shell：React 只负责 UI 与状态投影，模拟核心（Protocol/Runtime/Expression/Tick/Controller）保持纯 TypeScript 框架无关。必须第一版同时支持 PC 横屏 / 平板横竖屏 / 手机横竖屏。

## 决策

**三模式断点冻结**（纯函数 getBreakpoint，可单测）：

```text
Wide    ≥1024  → 左(实验+参数) | 中(监控) | 底(日志)    PC 横屏 / 平板横屏
Medium  ≥640   → 上(实验+参数) | 中(监控) | 底(日志)    平板竖屏 / 手机横屏
Compact <640   → 页签切换（参数/监控/日志）             手机竖屏
```

**UI/Runtime 投影边界**：

1. **轮询投影合同**：Run Loop 不对外发事件，UI 以 100ms 轮询 + UI 层 diff（tickIndex/变量值/状态变化）生成日志行——核心零改动。
2. **参数编辑 = ready 态直写 state.variables**（R2-02 mutable 合同），运行中只读；integer 控件只接受整数。
3. **按钮可用性由 transitions 守卫投影**（canRun/canPause/…），UI 不做第二套状态判断。
4. **单一 Controller 权威持有**在 App；加载新实验 → 新 Controller。
5. **组件只按实际需求拆分**（Shell/Experiment/Monitor 三组 10 文件），不提前建设 XYUI 组件库；视觉仅用基础暗色与既有约定，不扩展新规范。

**前置兼容修复**：`protocol/validator.ts` 的 Schema 加载由 node:fs 改为打包器 JSON 内联（字节不变，R2-01 原注释即预告 R4 需此改动）——src 现无任何 node:* 内置模块依赖，Loader 在 Node 与浏览器同行为。

## 影响

- 后续 R4 功能（图表/日志过滤）直接挂载在三个面板上，无需重排布局。
- 手机端第一版即可用（Compact 页签），不后补。
- 未来 XYUI 组件库可逐步替换 Shell 组件而不动 Runtime 合同。

## 验证方式

- 断点纯函数 3 项测试（228/228 全绿）。
- 真实浏览器冒烟：加载内置示例 → 参数面板自动生成 → MAX 运行 600 Tick → completed，time=600，fatigue=150（5×0.05×600），日志含变化与状态行。
