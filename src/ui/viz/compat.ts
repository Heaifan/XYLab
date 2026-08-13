// UA1 · Compatibility Engine + 自动推荐：Catalog 全部存在，本层裁决当前是否可用（禁止 UI 里散落 if chart === …）。
// 推荐规则（指令十五）：1 指标→Line/Range/Gauge；同单位多序列→Line/Bar/Delta；异量纲两项→Scatter(+相对 Line)；有 threshold→Threshold Band/Range。
import { CATALOG, byId, type VizDef } from './catalog';
import type { VizMode } from '../viewState';

export interface VizCtx {
  count: number; // 当前选择（且有效）指标数
  mixedUnits: boolean; // 选择内单位不一致
  mode: VizMode;
  hasThreshold: boolean; // 选择内含 threshold Watch
  hasEvents: boolean;
}

export interface VizCheck {
  ok: boolean;
  reason: string;
}

export function checkViz(d: VizDef, ctx: VizCtx): VizCheck {
  if (d.data !== 'series') return { ok: false, reason: d.reason };
  if (d.thresholdOnly && !ctx.hasThreshold) return { ok: false, reason: '选中项无 threshold Watch（需阈值模式）' };
  if (ctx.count < d.min) return { ok: false, reason: d.min === 0 ? '无可用数据' : `需至少选择 ${d.min} 个指标` };
  if (ctx.count > d.max) return { ok: false, reason: `最多支持 ${d.max} 个指标` };
  if (!(ctx.mode === 'absolute' ? d.abs : d.rel)) return { ok: false, reason: ctx.mode === 'absolute' ? '不支持绝对值模式' : '不支持相对变化模式' };
  if (d.sameUnitAbs && ctx.mode === 'absolute' && ctx.mixedUnits) return { ok: false, reason: '单位不一致——请切换「相对变化」' };
  return { ok: true, reason: '' };
}

export function checkVizById(id: string, ctx: VizCtx): VizCheck {
  const d = byId(id);
  return d ? checkViz(d, ctx) : { ok: false, reason: '未知可视化' };
}

// 自动推荐：只返回语义匹配 id（可用性仍由 checkViz 裁决；Picker 会把不可用的显示为 Disabled+Reason）
export function recommend(ctx: VizCtx): string[] {
  const ids: string[] = [];
  if (ctx.count === 1) ids.push('line', 'range', 'gauge');
  else if (ctx.count >= 2 && ctx.mixedUnits) {
    ids.push('line');
    if (ctx.count === 2) ids.push('scatter');
  } else if (ctx.count >= 2) ids.push('line', 'bar', 'delta');
  if (ctx.hasThreshold) ids.push('tband', 'range');
  if (ctx.count === 0) ids.push('timeline');
  return [...new Set(ids)].filter((id) => byId(id) !== undefined);
}

export function catalogSize(): number {
  return CATALOG.length;
}
