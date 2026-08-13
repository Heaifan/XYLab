# XYUI Core Pack 0.1

> XYUI-PILOT 产物：供 XYLab Agent 消费的 Core Pack。
> 状态：**`READY_FOR_XYLAB_PILOT`**（XYUI-0/1/2/3/4/5/6/8 全部 CLOSED；XYUI-7 canonical 完成，待用户验收）。

## 内容

```text
xyui/packs/core-0.1/
├─ manifest.json     ← pack 元数据 + 全部固定 SHA + git commit
├─ AGENT-GUIDE.md    ← XYLab Agent 消费指南（强制流程）
├─ README.md         ← 本文件
└─ gaps.json         ← 全 pack 已知缺口汇总（12 项，均非阻塞）
```

## 九份规范

| Spec | 内容 | 状态 | 关键产物 |
|---|---|---|---|
| XYUI-0 | Foundation Registry（44 项）+ A3-R2 Token Architecture（426 条） | VALIDATED（AMEND-A/B） | `xyui/registry/foundation/` + `xyui/tokens/architecture/` |
| XYUI-1 | Text & Information（24 组件） | CLOSED | `xyui/specs/XYUI1/` |
| XYUI-2 | Controls（24 控件） | CLOSED | `xyui/specs/XYUI2/` |
| XYUI-3 | Navigation（24 导航组件） | CLOSED | `xyui/specs/XYUI3/` |
| XYUI-4 | Selection & Feedback（20 项） | CLOSED | `xyui/specs/XYUI4/` |
| XYUI-5 | Layout & Containers（20 项） | CLOSED | `xyui/specs/XYUI5/` |
| XYUI-6 | Data & Collections（20 项） | CLOSED | `xyui/specs/XYUI6/` |
| XYUI-7 | Overlays & Windows（16 项） | CANONICAL_COMPLETE（待用户验收） | `xyui/specs/XYUI7/` |
| XYUI-8 | Visualization（16 项） | CLOSED（用户验收 2026-08-13） | `xyui/specs/XYUI8/` |

## 已知缺口（12 项，均非阻塞）

```text
XYUI1-GAP-001  Icon glyph registry（0.15 未定义）        MISSING_TOKEN
XYUI2-GAP-001  XY.Size.Switch 子属性访问                  MISSING_TOKEN
XYUI2-GAP-002  TextArea.MaxHeight=SceneToken              REQUIRES_DECISION
XYUI2-GAP-003  Inspector SharedPropertyColumnRule         REQUIRES_DECISION
XYUI3-GAP-001  ContrastForeground（OnAccent）未定义       MISSING_TOKEN（待后续 Token Source 裁决）
XYUI4-GAP-001  CONTRAST_SEPARATION_FOREGROUND（4.09）     MISSING_TOKEN
XYUI4-GAP-002  FOCUS_RING_OFFSET（4.04）                  MISSING_TOKEN
XYUI4-GAP-003  MARQUEE_LASSO_FILL_OPACITY（4.07/4.08）    REQUIRES_DECISION
XYUI4-GAP-004  CONDITIONAL_DROP_SEMANTIC（4.12）          MISSING_TOKEN
XYUI6-GAP-001  SORT_INDICATOR_SEMANTIC（排序方向指示符）   MISSING_TOKEN（与 XYUI1-GAP-001 同家族）
XYUI7-GAP-001  WINDOW_CHROME_METRIC（Window chrome 尺寸档） MISSING_TOKEN（与 XYUI1-GAP-001/XYUI3-GAP-001 同家族）
XYUI8-GAP-001  CHART_SERIES_PALETTE（Series 色板+Heatmap 色阶） MISSING_TOKEN（与 XYUI1-GAP-001 同家族）
```

## 禁止事项（对 XYLab Agent）

- 不进入 A3-R3、XYUI-9
- 不修改 A2 Registry / A3-R2 Architecture
- 不生成 AXAML / C#
- 不得以 GAP 为由自行发明全局 Token——GAP 需后续正式裁决

## 版本与提交

- Pack 固定 commit：见 `manifest.json` → `git_commit`
- 所有 SHA 固定在 manifest：source / canonical / registry / architecture 四类
