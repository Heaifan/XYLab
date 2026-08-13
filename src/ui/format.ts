// FE-A-R2 · 数值显示格式化（只格式化显示，底层值不 Round）。
// 冻结规则：整数 → 0 位；一般浮点 → 最多 4 位（去尾零）；Metric 强调值 → 固定 2 位。
// 禁止把 JS float 原样扔 UI（99.75999999999999 / 1.2000000000000002 必须消失）。
import type { RuntimeValue } from '../runtime/types';

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 10000) / 10000);
}

export function formatMetric(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  return n.toFixed(2);
}

export function formatValue(v: RuntimeValue): string {
  return typeof v === 'number' ? formatNumber(v) : String(v);
}
