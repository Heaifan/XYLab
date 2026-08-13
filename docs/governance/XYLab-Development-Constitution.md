# XYLab 开发宪法（Development Constitution）

- **地位**：三位一体治理中的「一体」——XYLab 开发与代码的最高规则，高于任何单轮指令。
- **版本**：1.0 · 生效日期 2026-08-13 · 由 XYLAB-GOV-01 正式启用
- **适用范围**：XYLab 仓库全部手写源码（TypeScript/Web/Simulation Runtime/Expression/Protocol/Monitoring/UI），不涉及 C#/Avalonia/Vulkan 等玄域引擎专属条款。
- **术语**：「三位一体治理」是 XY 系列项目默认工程治理基线，含义固定为：审计位 + 经验位 + 底线位，一体 = 本宪法（+ 未来 UI 宪法）。

```text
                    一体
         ┌─────────────────────┐
         │ 开发宪法 + UI宪法   │  最高规则 / 总纲
         └──────────┬──────────┘
       ┌────────────┼────────────┐
       ↓            ↓            ↓
     审计位        经验位        底线位
 changelog.md     knowledge/   5 + 100 + SRP
 file-tree.md
```

---

## Article 1 · 三位一体治理

任何正式项目必须先建立三位一体治理，才允许业务开发。顺序固定：建仓库 → 三位一体初始化 → 治理门禁通过 → 业务开发。缺失任何一位，即为 **Governance FAIL**，不是「文档以后补」。

## Article 2 · 审计位

- `changelog.md`：时间轴。每个正式 CLOSED 轮必须留下：阶段/任务/目标/变更/原因/验证/测试/Commit/遗留问题/决策。
- `file-tree.md`：空间地图。记录当前正式目录及每个文件的职责。
- 禁止伪造历史：只记录有真实证据（提交、测试输出、验证输出）的内容。

## Article 3 · 经验位

- `knowledge/` 知识库体系，分类：`decisions/`（架构与重要技术决策）、`incidents/`（事故/Bug/根因）、`patterns/`（已验证可复用模式）、`pitfalls/`（已知陷阱/禁止事项）。
- 入库门槛：满足以下至少一条才入 Knowledge，否则只进 changelog——
  ① 发生过真实事故 ② 找到隐藏根因 ③ 做出重要架构决策 ④ 形成可重复解决方法 ⑤ 出现容易再次踩中的坑 ⑥ 多项目可复用经验。
- Changelog = 全历史；Knowledge = 高价值经验。两者不混。禁止政治作秀式建空壳条目。
- 每轮结束必须做入库判断：有 → `Knowledge: UPDATED`；无 → `Knowledge: N/A`；禁止「忘了检查」。

## Article 4 · 底线位

**5 + 100 + SRP 是一个整体**，不是三条零散规定：

| 规则 | 控制什么 | 定义 |
| --- | --- | --- |
| 100 | 文件体积 | 手写源码（.ts/.tsx/.js/.jsx/.mjs/.css）物理行数 ≤ 100，含测试与脚本 |
| 5 | 目录复杂度 | 职责实现目录内手写实现文件 ≤ 5，第 6 个出现前必须先审职责边界（分层） |
| SRP | 职责复杂度 | 由人工硬门禁判定；100 发现危险，SRP 判断拆分是否合理 |

- **禁止**：allowlist、grandfather、永久 exception 绕过存量违规；禁止压成一行/删空格/塞长表达式等压缩作弊。
- 5 规则排除：生成物（dist/coverage/generated）、依赖（node_modules）、lock 文件、schema 数据、示例数据、知识文档、资源文件。
- SRP 判定写入每轮报告：`SRP: PASS/FAIL` + 新增职责是什么、为什么属于该文件/目录。

## Article 5 · 一体

本宪法（Development Constitution）为当前「一体」唯一生效文件。UI Constitution 状态：**RESERVED / NOT YET RATIFIED**——未经批准，任何轮次禁止自行设计或引用其内容；批准后成为与本宪法并列的最高 UI 规则（Token/Layout/Density/Spacing/Interaction/Selection/Feedback/Navigation/Responsive/Accessibility/XYUI Component Contract）。

## Article 6 · 任务冻结与范围控制

- 每轮任务由用户指令冻结；执行时必须逐字对照，禁止自作主张替换或扩缩范围。
- 治理轮不是业务重构轮：允许拆文件/移动纯类型/移动辅助函数/保持公共 API；禁止改行为、改语法、改 Schema、改 Runtime 语义、新增功能、顺手优化。
- 原则：**行为零变化，结构合规**。

## Article 7 · 架构边界

- 分层：`protocol`（加载边界）→ `runtime`（可变世界）→ `expression`（受限求值）→ `monitoring`（R3）→ `ui`（R4）。
- Runtime 不知道 UI（React/DOM/组件/按钮/图表）。
- Loader 是唯一信任边界：外部 JSON 是协议格式，`ExperimentDefinition` 是 Runtime 内部可信格式。
- 禁止任意 JS 执行：表达式引擎禁用 `eval`/`Function`/JS 全局访问，永远保持 tokenizer→parser→AST→validate→evaluate 链路。

## Article 8 · 验证门禁

- 固定命令：`npm run verify` = `governance`（5+100 自动检查）→ `typecheck`（tsc --noEmit 0 error）→ `test`（全量 Vitest）。
- 每轮收口条件（全部满足才 CLOSED）：Governance PASS；tsc 0 error；全量测试 PASS；`git diff --check` PASS；changelog/file-tree 已同步；Knowledge 完成入库判断；工作区 clean；commit 已推送；HEAD == origin/main。
- 单一正式 Commit（必要时最多 2 个），Commit 信息必须标明轮次。

## Article 9 · 审计同步

每轮 CLOSED 前必须同步 `changelog.md` 与 `file-tree.md`。改动目录结构、新增/删除文件的轮次必须更新 file-tree.md。

## Article 10 · 知识沉淀

事故修复流程固定：Bug → Root Cause → 修复 → 验证 → 入库判断 →（YES）Knowledge。第一次事故是成本，第二次同类事故是违规。

## Article 11 · 失败停止条件

- 门禁失败 → 停止并上报，禁止继续推进业务主线。
- 能力缺失 → 按方案条款「停止并上报」，禁止用近似功能冒充。
- 底线违规不得用 allowlist/grandfather/exception 掩饰。

## Article 12 · 临时文件清理

临时验证脚本、调试脚本用后即删，禁止留在仓库；正式验证脚本一律进 `scripts/` 并受 100 红线约束。

## Article 13 · 每轮报告治理状态块

所有正式轮次报告固定包含：

```text
治理状态
────────
开发宪法：PASS
UI宪法：N/A / PASS（当前恒 N/A，未批准）
5：PASS
100：PASS
SRP：PASS
changelog：UPDATED
file-tree：UPDATED
Knowledge：N/A / UPDATED
```
