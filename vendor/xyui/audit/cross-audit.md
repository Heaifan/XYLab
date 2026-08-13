# XYUI Core Cross-Audit 0~8 / 全局交叉审计

- 阶段：`XYUI-PILOT-R7 · FAST-CLOSE + XYUI CORE CROSS-AUDIT · T12~T15`
- 范围：XYUI-0 / 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8（当前不要求 XYUI-9/10）
- 依据：全部 canonical + mapping + gaps + audit 产物；Foundation Registry（VALIDATED + AMEND-A/B）+ A3-R2 Token Architecture
- 方法：Ownership Matrix → Reference Integrity → Second Truth → GAP Registry → Source Integrity → XYLab Readiness

## 第一层 · Ownership Matrix（唯一所有权）

| 核心语义域 | Canonical Owner | 其他模块引用方式 | 重复 owner |
|---|---|---|---|
| Foundation（Token/ZIndex/Opacity/Shadow/DragDrop/ResizeSplitter/Focus 视觉/Host 体系） | XYUI-0 | REF / Value | 0 |
| Text / Information（含 Tooltip 基础合同 + XY.Tooltip.\*） | XYUI-1 | REF（7.03 base、8.15 TooltipBase 等） | 0 |
| Controls（Button/Input/Search） | XYUI-2 | REF（7.01/7.02/7.10 等） | 0 |
| Navigation / Menu 结构 / CommandPalette 命令契约 | XYUI-3 | REF（7.04→3.03、7.10→3.18） | 0 |
| Selection / Feedback / Loading 视觉 | XYUI-4 | REF（7.05/7.12、8.04/8.10 等） | 0 |
| Layout / Dock / Workspace 拓扑 / OverlayLayout Planes / Portal | XYUI-5 | REF（7.08→5.12+5.04、7.16→5.07+5.17） | 0 |
| Data Collections（列表/虚拟化/状态语义） | XYUI-6 | REF（7.10/7.11/7.15、8.01） | 0 |
| Overlays / Windows（presentation & behavior） | XYUI-7 | REF（8.15 浮层基础仍 REF XYUI-1/XY.Tooltip.\*） | 0 |
| Visualization | XYUI-8 | REF（7.03/7.09 交互继承） | 0 |

- 结论：**duplicate canonical owner = 0**。每个核心语义有且只有一个 canonical owner；其余模块全部 REF / COMPOSE。

## 第二层 · Reference Integrity

```text
XYUI-7 mapping          134 refs 全解析（CANONICAL_REF 38 / NAMESPACE_REF 33 / COMPONENT_SPECIFIC 57 / COMPOSE 5 / GAP 1）
XYUI-8 mapping          132 refs（既有记录，Broken Ref = 0）
跨模块组件引用逐项核对（本轮抽查全通过）：
  XYUI-1 1.19 Tooltip ✓（XY.Tooltip.MaxWidth=280 DIP / ShowDelay=400 ms 数值一致）
  XYUI-3 3.03 ContextMenu ✓ / 3.18 CommandPalette ✓
  XYUI-4 4.14 LoadingIndicator ✓ / 4.16 ProgressBar ✓ / 4.17 ProgressRing ✓
  XYUI-5 5.04 Dock ✓ / 5.07 OverlayLayout ✓ / 5.12 WorkspaceLayout ✓ / 5.16 ViewportContainer ✓ / 5.17 PortalHost ✓
  XYUI-6 6.19 Collection State ✓
  XYUI-8 8.15 Chart Tooltip & Crosshair ✓ / 8.16 Visualization Interaction ✓
Foundation Token 族逐项核对：
  XY.Overlay.ContentHost/OverlayHost/DragHost/ModalHost/TooltipHost(+Priority/Above) ✓
  XY.ZIndex（Mode=ContextStack / DirectValue=Forbidden / MagicNumber=Forbidden）✓
  XY.Opacity.Backdrop=0.28 / Hidden=0.18 / Overlay=0.92 ✓（与 XYUI-7 canonical 引用值一致）
  XY.Shadow.Tooltip/Popup/DragPreview/Panel/Control ✓
  XYUI.Foundation.DragDrop ✓（AMEND-B Entry=Handle|DirectTarget）/ ResizeSplitter ✓
  XY.Focus.\* ✓ / XY.Semantic.Info/Warning/Error ✓ / XY.State.ComposeMode ✓
  XY.Motion.Fast/Normal ✓ / XY.Font.UI ✓ / XY.Editor.Grid.Minor + XY.Editor.Guide ✓
结论：Broken Ref = 0，Invalid Ref = 0
```

## 第三层 · Second Truth（Foundation 第二真值）

```text
全部 canonical + mapping 扫描：
#hex 硬编码          0（唯一 6 处命中均在 XYUI-4，且全部为「原稿 #XXXXXX」溯源注记，
                     显式收敛为 Foundation Token 或登记 GAP：XYUI4-GAP-001；非 Canonical 值）
rgb / rgba / hsl    0
旧字体名            0
旧命名空间          0（全部使用 token-canonical-map.json 的 canonical_token_id）
重复 State 合同     0（AMEND-A 双轴模型统一消费 XY.State.ComposeMode）
重复 Focus 合同     0（视觉=Foundation.Focus + XYUI-4；Trap/Restore 生命周期=7.16 独有）
重复 Drag 合同      0（机制=XYUI.Foundation.DragDrop；Drop 语义=7.14；拖放反馈=XYUI-4 4.11/4.12）
重复 Layout 合同    0（静态拓扑=XYUI-5；运行时重组=7.08）
重复 Tooltip 合同   0（基础=XYUI-1 + XY.Tooltip.*；7.03/8.15 只增加语境语义）
重复虚拟化合同      0（集合虚拟化=XYUI-6）
结论：Foundation Second Truth = 0
```

## 第四层 · GAP Registry（全量汇总）

```text
总数 12 项（11 既有 + XYUI7-GAP-001），全部唯一 ID、owner 正确、blocking=false：
XYUI1-GAP-001  Icon glyph registry                                   MISSING_TOKEN（glyph 家族）
XYUI2-GAP-001  XY.Size.Switch 子属性访问                             MISSING_TOKEN
XYUI2-GAP-002  TextArea.MaxHeight=SceneToken                          REQUIRES_DECISION
XYUI2-GAP-003  Inspector SharedPropertyColumnRule                     REQUIRES_DECISION
XYUI3-GAP-001  ContrastForeground（OnAccent）                         MISSING_TOKEN（contrast 家族）
XYUI4-GAP-001  CONTRAST_SEPARATION_FOREGROUND（4.09）                 MISSING_TOKEN（contrast 家族）
XYUI4-GAP-002  FOCUS_RING_OFFSET（4.04）                              MISSING_TOKEN
XYUI4-GAP-003  MARQUEE_LASSO_FILL_OPACITY（4.07/4.08）                REQUIRES_DECISION
XYUI4-GAP-004  CONDITIONAL_DROP_SEMANTIC（4.12）                      MISSING_TOKEN
XYUI6-GAP-001  SORT_INDICATOR_SEMANTIC                                MISSING_TOKEN（glyph 家族）
XYUI8-GAP-001  CHART_SERIES_PALETTE                                   MISSING_TOKEN（glyph 家族）
XYUI7-GAP-001  WINDOW_CHROME_METRIC（7.07）                           MISSING_TOKEN（尺寸家族）
GAP 家族关系（不合并不同需求）：
  glyph 家族：XYUI1-001 / XYUI6-001 / XYUI8-001（均待 Token Source 阶段补 glyph 注册表与色板）
  contrast 家族：XYUI3-001 / XYUI4-001（OnAccent / Separation 前景语义）
  其余为独立缺口
结论：unique ID ✓ / owner ✓ / source ✓ / status ✓ / 无重复登记 / pack 条目齐全（本轮同步后 12 项）
      blocking 标记准确：全部 NON-BLOCKING（无一阻塞 XYLab 前端实现）
```

## 第五层 · Source Integrity

```text
9 份 Source 全部 present + immutable（工作区冻结文件与已提交 blob 双口径核验）：
  XYUI-0  blob SHA e564a4b4… = manifest pin ✓
  XYUI-1  blob SHA 9709a4fd… = manifest pin ✓
  XYUI-2  blob SHA fa1b393f… = manifest pin ✓
  XYUI-3  blob SHA 4c91ba6a… = manifest pin ✓
  XYUI-4  blob SHA 1d92ca14… = manifest pin ✓（工作区 CRLF 文件哈希不同，属 text=auto 正常转换；以 blob 为真）
  XYUI-5  blob SHA 45734e3f… = manifest pin ✓（manifest source_bytes 252543 为 CRLF 口径，blob 实为 252471，本轮修正）
  XYUI-6  blob SHA 15dcf491… = manifest pin ✓
  XYUI-7  blob SHA 8fb6be6c…（冻结 SHA；提交后按 committed blob 口径在 manifest pin，记录见下）
  XYUI-8  blob SHA 4a5a36cc… = manifest pin ✓（provenance = 消息附件转录；无原始外部文件 SHA，保持已登记状态；不重跑管线）
provenance：全部记录于各模块 source-audit.md（XYUI-7 为真实磁盘文件来源 + .hermes 附件副本字节级一致）
结论：source integrity = 9/9；SHA pin 全部有效（blob 口径）
```

## 第六层 · XYLab Readiness

```text
XYLab Agent 开始前端实现所需能力覆盖：
typography              XYUI-1 ✓（XY.Font.UI / 层级 / 数值 XY.Font.Mono）
buttons / input         XYUI-2 ✓（Button/Input/Search/Switch/Property 等 24 项）
navigation              XYUI-3 ✓（MenuBar/Sidebar/DockTabs/TreeNavigation/Steps/ContextMenu/CommandPalette 等 24 项）
selection / feedback    XYUI-4 ✓（Hover/Selected/Marquee/Lasso/Progress/Spinner/Skeleton/InlineFeedback/EmptyState 等 20 项）
layout                  XYUI-5 ✓（Stack/Grid/Dock/SplitPane/OverlayLayout/WorkspaceLayout/ViewportContainer/PortalHost 等 20 项）
data collections        XYUI-6 ✓（List/Table/DataGrid/PropertyGrid/Hierarchy/Sorting/Filtering/VirtualizedCollection 等 20 项）
overlay / window        XYUI-7 ✓（Dialog/Popover/Tooltip/ContextMenu/Toast/Drawer/Window/Docking/Lightbox/CommandPalette/
                          Notification/TaskProgress/Coachmark/DragDrop/Picker/OverlayStack 共 16 项）
visualization           XYUI-8 ✓（Container/Metric/Sparkline/Line/Area/Bar/Distribution/Scatter/Heatmap/Timeline/Gauge/
                          Legend/ChartInspector/Interaction 等 16 项）
responsive              XYUI-1~8 各模块内置 deviceMode 合同 ✓
mobile interaction      全局「移动端不依赖 Hover」规则 + 各模块 Long Press/Tap/Bottom Sheet/Placement 等价入口 ✓
density                 紧凑/高信息密度/低空白全局纪律 + XY.Size.* 档位 ✓
loading / error / empty XYUI-4 LoadingIndicator/ProgressBar/EmptyState + XYUI-7 TaskProgress/Toast/Notification ✓
realtime data           XYUI-8 FollowLive/锁定联动 + XYUI-6 状态语义（PartialFailure/Offline/Stale）✓
chart interaction       XYUI-8 8.16（Direct Manipulation + Compact Interaction Bar + Responsive）✓
BLOCKING GAP           0（12 项 GAP 全部 NON-BLOCKING；Token Source 阶段可后补）
结论：XYUI-0~8 已足够 XYLab Agent 开始前端实现；不要求 XYUI-9/10；普通设计系统扩展进 backlog
```

## 状态

```text
XYUI-0  VALIDATED（AMEND-A/B）      XYUI-5  CLOSED
XYUI-1  CLOSED                      XYUI-6  CLOSED
XYUI-2  CLOSED                      XYUI-7  CANONICAL_COMPLETE → READY FOR USER ACCEPTANCE
XYUI-3  CLOSED                      XYUI-8  CLOSED（用户最终验收 2026-08-13）
XYUI-4  CLOSED

ownership conflicts     0
duplicate contracts     0
second truth            0
broken refs             0
GAP total               12（全部 NON-BLOCKING）
blocking GAP            0
source integrity        9/9（blob 口径 pin 有效）
pack integrity          同步后 9 份规范 + 12 项 GAP（见 packs/core-0.1/）
XYLab readiness         READY
```
