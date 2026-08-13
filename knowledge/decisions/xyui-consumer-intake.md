# XYUI Consumer Intake：UI 权威批准、vendor 只读纪律与 A/B 分类

- 类别：decisions
- 入库条件：③ 重要架构决策（宪法 Article 5 修订，长期生效）
- 日期：2026-08-13

## 决策

1. **UI 权威批准**：XYUI Core Pack（`vendor/xyui/`，XYUI-Core-0.1 / 0.1.0 / 上游 commit 5f288e6）是 XYLab 唯一批准的 UI 设计依据。Foundation/组件/可视化冲突时以 vendored XYUI Canonical 为准（JSON registry/spec = 唯一 Source of Truth）。
2. **vendor 只读**：`vendor/xyui/**` 任何轮次不得修改；规范缺口以 XYUI_GAP 回流上游，重新出包后才更新 vendor；`UPSTREAM-PIN.json.localMutation` 恒为 0；实测 SHA（PIN 内 measured 节）是完整性权威基准。
3. **A/B 分类（关键纠偏）**：A 类 = 现有 canonical 契约可直接消费；B 类 = 缺失项（尤其 Light Scalar Tokens——A3-R3 Light/Dark Token Source 暂停）。B 类必须以消费层/GAP 显式表达，**禁止伪造 Foundation Canonical Tokens、禁止冒充 canonical**。Dark 档参考值不是 XYLab 目标皮肤。
4. **产品方向冻结**：Light First · Mobile Portrait First · 低饱和 · 紧凑/高信息密度 · XYUI-8 Visualization First；Mobile Portrait = Primary Design Target，Desktop/Tablet = Adaptive Expansion；移动核心工作流 = JSON → 参数 → Run → 可视化 → Save Run → Note → History → Copy JSON。
5. **职责边界**：XYLab 可做页面组合/实验工作流/数据绑定/响应式组合/Mobile Bottom Sheet/IA；不得重定义 Foundation 颜色、状态语义、组件视觉契约、XYUI-8 可视化交互语义。

## 标准消费流程（每轮必经）

读 `AGENT-GUIDE.md` → 读 `manifest.json` → 读 Foundation（registry + token-canonical-map）→ 按任务读相关 Canonical → 查 Mapping/GAP → 实现。移动端层级映射：主规范 XYUI-8 / 布局 XYUI-5 / 输入 XYUI-2 / 状态 XYUI-4 / 文本 XYUI-1 / 数据 XYUI-6 / 导航 XYUI-3 / 浮层 XYUI-7 / 基础 XYUI-0。

## 已知上游事实

- 12 GAP 全部 NON-BLOCKING（如 XYUI8-GAP-001 多系列色板、XYUI3-GAP-001 OnAccent、XYUI4-GAP-002 focus offset）——消费时遇缺口登记 GAP，不脑补。
- 上游 manifest 9 处 SHA 与交付件实测不符（PIN 已登记，原因 UPSTREAM-UNKNOWN）；source_sha256 抽查与 XYUI-7 canonical 一致，证明哈希机制本身有效。
- 上游仓库本机不可见（XYUI-PLAN-U002）；provenance 事实源为治理文档 §2（未随包保留，PIN 是 XYLab 侧唯一记录）。
