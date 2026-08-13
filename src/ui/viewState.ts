// UA1 · VisualizationSelectionState（纯函数层）：selectedMetricIds = Set 语义多选集合 + visualizationType + compareMode。
// 冻结语义：选择是 UI 工作状态——仅 Load（新实验）重置并按 output.charts 初始化；Pause/Resume/Step/Stop/Reset/锁定一律不清。
// 异量纲加入 → Absolute 自动切 Relative 并返回一次轻提示；绝对值对比只允许同单位（F2 冻结延续）。
import type { ExperimentDefinition } from '../protocol/types';

export type VizMode = 'absolute' | 'relative';

export interface ViewState {
  selected: string[]; // Set<MetricId>：有序去重集合（不是 active+compare 二元结构）
  pinned: string[] | null; // null = 自动（解析目标前 PIN_CAP 个）；Pinned ≠ Selected，两概念不绑死
  hidden: string[];
  mode: VizMode;
  viz: string; // Catalog 可视化 id（默认 line）
  scatterX: string | null; // Scatter X/Y 指派（null = 自动：选中前两项）
  scatterY: string | null;
}

export const VIEW_INIT: ViewState = { selected: [], pinned: null, hidden: [], mode: 'absolute', viz: 'line', scatterX: null, scatterY: null };
export const PIN_CAP = 6;

export function unitOf(def: ExperimentDefinition | null, target: string): string {
  return def?.variables[target]?.unit ?? '';
}

export function effectivePinned(view: ViewState, resolved: string[]): string[] {
  const base = view.pinned ?? resolved;
  return base.filter((t) => resolved.includes(t)).slice(0, PIN_CAP);
}

// 图表目标 = 选择 ∩ resolved − hidden；Load 保证初始化，空选择不再回退首个
export function selectedTargets(view: ViewState, resolved: string[]): string[] {
  return view.selected.filter((t) => resolved.includes(t) && !view.hidden.includes(t));
}

// 绝对值比较的单位兼容组：以首个目标的单位为准（F2 冻结延续）
export function sameUnitGroup(def: ExperimentDefinition | null, targets: string[]): { shown: string[]; excluded: string[] } {
  if (targets.length <= 1) return { shown: targets, excluded: [] };
  const u = unitOf(def, targets[0]);
  const shown = targets.filter((t) => unitOf(def, t) === u);
  return { shown, excluded: targets.filter((t) => !shown.includes(t)) };
}

export function mixedUnits(def: ExperimentDefinition | null, targets: string[]): boolean {
  return sameUnitGroup(def, targets).excluded.length > 0;
}

// 新实验初始化：优先 output.charts（x=time）声明的数值目标；无声明 → 第一个 numeric value watch
export function initSelection(def: ExperimentDefinition | null): string[] {
  const numeric = (t: string): boolean => {
    const ty = def?.variables[t]?.type;
    return ty === 'number' || ty === 'integer';
  };
  const declared = (def?.output?.charts ?? []).filter((c) => c.x === 'time' && numeric(c.y)).map((c) => c.y);
  if (declared.length > 0) return [...new Set(declared)];
  const watches = (def?.watch ?? []).map((w) => w.target).filter(numeric);
  return [...new Set(watches)].slice(0, 1);
}

export function viewFocus(view: ViewState, t: string): ViewState {
  return { ...view, selected: [t] };
}

export function viewClearSelect(view: ViewState): ViewState {
  return { ...view, selected: [] };
}

export function viewSetViz(view: ViewState, id: string): ViewState {
  return { ...view, viz: id };
}

// Scatter 指派交换：未显式指派时以当前自动指派（a/b）为底做交换
export function viewSwapScatter(view: ViewState, a: string, b: string): ViewState {
  const x = view.scatterX ?? a;
  const y = view.scatterY ?? b;
  return { ...view, scatterX: y, scatterY: x };
}

// 选择 Toggle + 量纲仲裁：加入后单位混合且处于绝对值 → 自动切相对变化并给一次轻提示
export function selectToggle(view: ViewState, def: ExperimentDefinition | null, t: string): { view: ViewState; toast: string | null } {
  const has = view.selected.includes(t);
  const selected = has ? view.selected.filter((x) => x !== t) : [...view.selected, t];
  let mode = view.mode;
  let toast: string | null = null;
  if (!has && mode === 'absolute' && mixedUnits(def, selected)) {
    mode = 'relative';
    toast = '不同量纲，已切换到相对变化';
  }
  return { view: { ...view, selected, mode }, toast };
}

export function viewTogglePin(view: ViewState, t: string, resolved: string[]): ViewState {
  const cur = view.pinned ?? resolved.slice(0, PIN_CAP);
  const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
  return { ...view, pinned: next };
}

export function viewToggleHide(view: ViewState, t: string): ViewState {
  const hidden = view.hidden.includes(t) ? view.hidden.filter((x) => x !== t) : [...view.hidden, t];
  return { ...view, hidden };
}
