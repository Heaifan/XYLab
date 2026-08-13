// F2 · 工作台视图状态（纯函数层：聚焦/对比/Pin/隐藏/比较模式；状态本体由 App 持有）。
// 语义冻结：selected 空 → 图表自动聚焦首个解析目标（Focus 默认）；pinned=null → 自动 Pin 解析目标前 6；
// 绝对值对比只允许同单位 Series（不同单位 → 提示改用相对变化）；hidden 仅从图表隐藏，不删除 Watch。
import type { ExperimentDefinition } from '../protocol/types';

export interface ViewState {
  selected: string[];
  pinned: string[] | null; // null = 自动（解析目标前 PIN_CAP 个）
  hidden: string[];
  mode: 'absolute' | 'relative';
}

export const VIEW_INIT: ViewState = { selected: [], pinned: null, hidden: [], mode: 'absolute' };
export const PIN_CAP = 6;

export function unitOf(def: ExperimentDefinition | null, target: string): string {
  return def?.variables[target]?.unit ?? '';
}

export function effectivePinned(view: ViewState, resolved: string[]): string[] {
  const base = view.pinned ?? resolved;
  return base.filter((t) => resolved.includes(t)).slice(0, PIN_CAP);
}

// 图表实际聚焦目标：选中（或默认首个）减去隐藏；resolved 之外的一律忽略
export function focusTargets(view: ViewState, resolved: string[]): string[] {
  const chosen = view.selected.length > 0 ? view.selected.filter((t) => resolved.includes(t)) : resolved.slice(0, 1);
  return chosen.filter((t) => !view.hidden.includes(t));
}

// 绝对值比较的单位兼容组：以首个目标的单位为准，其余单位不同的被排除（由调用方提示改用相对变化）
export function sameUnitGroup(def: ExperimentDefinition | null, targets: string[]): { shown: string[]; excluded: string[] } {
  if (targets.length <= 1) return { shown: targets, excluded: [] };
  const u = unitOf(def, targets[0]);
  const shown = targets.filter((t) => unitOf(def, t) === u);
  return { shown, excluded: targets.filter((t) => !shown.includes(t)) };
}

export function viewFocus(view: ViewState, t: string): ViewState {
  return { ...view, selected: [t] };
}

export function viewToggleCompare(view: ViewState, t: string): ViewState {
  const next = view.selected.includes(t) ? view.selected.filter((x) => x !== t) : [...view.selected, t];
  return { ...view, selected: next };
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
