# XYUI Core Pack 0.1 · AGENT-GUIDE

> 给 XYLab Agent 的消费指南。做任何 UI 前先读本文件。

## 1. 强制流程

1. **做 UI 前先查 XYUI Core Pack**（本 pack）。
2. **Foundation 视觉值不得自行硬编码**——颜色/字号/字重/行高/间距/圆角/边框/Surface/State 色/Icon/Motion/Focus/HitTarget/DPI 一律引用 XYUI-0 Canonical Token。
3. **已有 XYUI Component Spec 时不得另造视觉语言**——XYUI-1 的 24 个文本组件已有 canonical spec（`xyui/specs/XYUI1/XYUI-1.canonical.md`）。
4. **缺组件时记录 `XYUI_GAP`**——不要在 XYLab 私自形成长期 UI 规范。
5. **允许项目临时实现行为**，但长期视觉规范必须回流 XYUI。

## 2. 优先级（0.1 Design Principles，冲突时高覆盖低）

```text
Correctness > SemanticClarity > EditingEfficiency > InformationDensity > VisualConsistency > Decoration
```

## 3. 禁止项（Guard 将检查）

```text
Cardification       禁止无意义 Card 套 Card
RandomSpacing       禁止零散间距（只用 XY.Space.* 档位）
MagicNumber         禁止未经 Token 化的硬编码数值
ColorOnlyState      禁止仅靠颜色表达状态（Error/Warning/Status 必须文字+颜色双通道）
DecorativeMotion    禁止装饰性动效（Motion 必须承担职责）
ArbitraryOverride   禁止绕过 Foundation Token 的任意覆盖
```

## 4. Canonical Token 引用规则

- 只能引用 `token-canonical-map.json` 中的 **canonical_token_id**。
- 旧命名已废弃（如 `XY.Border.Strong` 作为颜色 → 现为 `XY.Border.Color.Strong`；`XY.Border.Subtle` → `XY.Border.Color.Subtle`）。
- `canonical_token_id = null` 的条目是 Composite Rule（如 0.10 的 Border 结构规则），不是 Scalar Token，不得作为值引用。
- 组件独有参数必须用组件 Token 命名（如 `XY.Text.Default.FontSize`），不得伪装成 Foundation Token。

## 5. 当前可用资源

```text
XYUI-0 Foundation     ✅ VALIDATED（44 项，426 token；AMEND-A/B 状态组合/Drag 入口修订）
XYUI-1 Text&Info      ✅ canonical（24 组件）
XYUI-2 Controls       ✅ canonical（24 控件：Button/Input/Slider/Property 等）
XYUI-3 Navigation     ✅ canonical（24 导航组件：MenuBar/Sidebar/DockTabs/TreeNavigation 等）
XYUI-4 Selection      ✅ CLOSED 20/20（Hover/Selected/Active/Focus/MultiSelection/Group/
                        Marquee/Lasso/Outline/BoundingBox/DragFeedback/Drop/Insertion/
                        Loading/Spinner/ProgressBar/Ring/Skeleton/InlineFeedback/EmptyState；
                        4 项 GAP 见 gaps.json；A 类冲突 0；第二真值 0）
XYUI-5 Layout         ✅ CLOSED 20/20（Stack/Grid/Wrap/Dock/ScrollArea/SplitPane/OverlayLayout/
                        AspectContainer/AnchorLayout/StickyRegion/AdaptiveLayout/WorkspaceLayout/
                        LayoutPersistence/VirtualizedLayout/CanvasLayout/ViewportContainer/
                        PortalHost/MasonryLayout/LayoutDiagnostics/LayoutCompositionRules；
                        0 GAP；A 类冲突 0；第二真值 0）
XYUI-6 Data&Coll      ✅ CLOSED 20/20（List/Table/DataGrid/PropertyGrid/Hierarchy/ItemView/
                        AssetGrid/CollectionHeader/CollectionToolbar/Column/Row/Cell/Sorting/
                        Filtering/Grouping/ExpandableRow/InlineEditing/BulkOperations/
                        CollectionState/VirtualizedCollection；
                        1 项 GAP 见 gaps.json；A 类冲突 0；第二真值 0；Broken Ref 0）
XYUI-7 Overlay&Window  ✅ canonical 16/16（Dialog/Popover/Tooltip/ContextMenu/Toast/Drawer/Window/
                        Docking&WindowManagement/Lightbox&FullscreenPreview/CommandPalette/
                        NotificationCenter/ProgressOverlay&TaskMonitor/Spotlight&Coachmark/
                        Drag&DropOverlay/FileDialog&ResourcePicker/OverlayStack&FocusManagement；
                        关键裁定：菜单结构 REF XYUI-3 3.03、命令搜索 REF XYUI-3 3.18、
                        布局拓扑 REF XYUI-5 5.12/5.04、Overlay 层级映射 Foundation 五 Host；
                        1 项 GAP 见 gaps.json；A 类冲突 0；第二真值 0；Broken Ref 0；
                        待用户验收）
XYUI-8 Visualization  ✅ CLOSED 16/16（VisualizationContainer/Metric/MetricGroup/ProgressRange/
                        Sparkline/LineChart/AreaChart/BarChart/DistributionChart/ScatterPlot/
                        Heatmap/Timeline/Gauge/Legend/ChartInspector/VisualizationInteraction；
                        交互合同 = Direct Manipulation + Compact Interaction Bar + Responsive Interaction，
                        Contextual Interaction 仅低频辅助；移动端禁依赖 Hover；
                        1 项 GAP 见 gaps.json；A 类冲突 0；第二真值 0；Broken Ref 0）

Pack Status: READY_FOR_XYLAB_PILOT（0~6 + 8 全部 CLOSED + 7 canonical 完成待验收）
```

## 6. 已知 GAP

```text
XYUI1-GAP-001  Icon glyph registry 未建立（glyph 名暂用组件级常量，如 InfoCircle）
XYUI2-GAP-001  XY.Size.Switch 复合 token 子属性访问待 A3 定义
XYUI2-GAP-002  TextArea.MaxHeight=SceneToken（待裁定）
XYUI2-GAP-003  Inspector SharedPropertyColumnRule 未在 Foundation 定义
XYUI3-GAP-001  ContrastForeground（OnAccent）未定义（待后续 Token Source 裁决）
XYUI4-GAP-001  CONTRAST_SEPARATION_FOREGROUND（4.09，与 XYUI3-GAP-001 同家族）
XYUI4-GAP-002  FOCUS_RING_OFFSET（4.04）
XYUI4-GAP-003  MARQUEE_LASSO_FILL_OPACITY（4.07/4.08，需裁定）
XYUI4-GAP-004  CONDITIONAL_DROP_SEMANTIC（4.12）
XYUI6-GAP-001  SORT_INDICATOR_SEMANTIC（排序方向指示符；与 XYUI1-GAP-001 同家族）
XYUI7-GAP-001  WINDOW_CHROME_METRIC（Window chrome 尺寸档：标题栏高度/边框/Resize Handle 命中区；与 XYUI1-GAP-001/XYUI3-GAP-001 同家族）
XYUI8-GAP-001  CHART_SERIES_PALETTE（Series 色板 + Heatmap 低→高色阶；与 XYUI1-GAP-001 同家族）
```

## 7. 版本与溯源

- Foundation Registry SHA：`33c2bd8b…`（manifest 中固定）
- 本 pack git commit：以 `xyui/packs/core-0.1/manifest.json` 的 `git_commit` 为准
- 所有规则可经 Registry → Evidence → Source 反查（broken provenance = 0）
