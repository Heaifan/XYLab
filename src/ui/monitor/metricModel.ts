// F2 · Metric 模型层：MonitorSnapshot → MetricRow（Pinned 卡与 WatchInspector 共用唯一模型）。
// valueAtTime/nearestTime 时间域纯函数（R2 冻结语义迁入）；metricStatus 只认结构化 threshold watch，
// 绝不解析事件表达式。锁定模式读目标时刻 series；数据唯一来源 MonitorSnapshot（Second Truth 禁令）。
import type { ComparisonOperator, ExperimentDefinition } from '../../protocol/types';
import type { MonitorSnapshot, SeriesPoint } from '../../monitor/types';
import { formatMetric, formatNumber, formatValue } from '../format';

export function valueAtTime(pts: SeriesPoint[], t: number): SeriesPoint | null {
  if (pts.length === 0) return null;
  let best = pts[0];
  for (const p of pts) {
    if (p.time > t) break; // series 按 time 升序追加
    best = p;
  }
  return best;
}

export function nearestTime(ptsLists: SeriesPoint[][], t: number): number | null {
  let best: number | null = null;
  for (const pts of ptsLists) for (const p of pts) {
    if (best === null || Math.abs(p.time - t) < Math.abs(best - t)) best = p.time;
  }
  return best;
}

export function cmp(a: number, op: ComparisonOperator, b: number): boolean {
  if (op === '>=') return a >= b;
  if (op === '>') return a > b;
  if (op === '<=') return a <= b;
  if (op === '<') return a < b;
  if (op === '==') return a === b;
  return a !== b;
}

export function metricStatus(snap: MonitorSnapshot, target: string): 'normal' | 'warning' {
  const stats = snap.statistics[target];
  if (!stats || stats.kind !== 'numeric') return 'normal';
  for (const w of snap.watches) {
    if (w.target === target && w.mode === 'threshold' && w.threshold !== undefined && cmp(stats.current, w.operator, w.threshold)) return 'warning';
  }
  return 'normal';
}

export interface MetricRow {
  target: string;
  label: string;
  unit: string;
  modeText: string;
  value: string;
  deltaText: string; // '+14.50' / '-10.43' / boolean 变化次数
  deltaDir: 'up' | 'down' | 'none';
  detail: string; // 卡片 sub 行（Δ… / N 次变化 / 仅 Series）
  stats: { initial: string; min: string; max: string; average: string; samples: number } | null;
  status: 'normal' | 'warning';
}

export function buildRows(def: ExperimentDefinition | null, snap: MonitorSnapshot | null, lockTime: number | null): MetricRow[] {
  if (!snap) return [];
  const seen = new Set<string>();
  const out: MetricRow[] = [];
  for (const w of snap.watches) {
    if (seen.has(w.target)) continue;
    seen.add(w.target);
    const stats = snap.statistics[w.target];
    const pts = snap.series[w.target] ?? [];
    const locked = lockTime !== null ? valueAtTime(pts, lockTime) : null;
    let value = '—';
    if (locked) value = typeof locked.value === 'number' ? formatMetric(locked.value) : String(locked.value);
    else if (stats) value = typeof stats.current === 'number' ? formatMetric(stats.current) : String(stats.current);
    else if (pts.length > 0) value = formatValue(pts[pts.length - 1].value);
    let deltaText = '';
    let deltaDir: MetricRow['deltaDir'] = 'none';
    let detail = '仅 Series';
    let statsBlock: MetricRow['stats'] = null;
    if (stats?.kind === 'numeric') {
      deltaText = `${stats.delta >= 0 ? '+' : ''}${formatMetric(stats.delta)}`;
      deltaDir = stats.delta > 0 ? 'up' : stats.delta < 0 ? 'down' : 'none';
      detail = `Δ ${deltaText}`;
      statsBlock = { initial: formatNumber(stats.initial), min: formatNumber(stats.min), max: formatNumber(stats.max), average: formatNumber(stats.average), samples: stats.sampleCount };
    } else if (stats?.kind === 'boolean') {
      deltaText = `${stats.changeCount}`;
      detail = `${stats.changeCount} 次变化`;
    }
    const modeText = w.mode === 'threshold' ? `threshold ${w.operator} ${String(w.threshold)}` : w.mode === 'value' ? '实时值' : '变化时';
    out.push({
      target: w.target, label: def?.variables[w.target]?.label ?? w.target, unit: def?.variables[w.target]?.unit ?? '',
      modeText, value, deltaText, deltaDir, detail, stats: statsBlock, status: metricStatus(snap, w.target),
    });
  }
  return out;
}

export interface MetricModel { target: string; label: string; unit: string; value: string; detail: string; status: 'normal' | 'warning'; }

// R2 兼容形状（SaveRunSheet 摘要等消费）
export function resolveMetrics(def: ExperimentDefinition | null, snap: MonitorSnapshot | null, lockTime: number | null): MetricModel[] {
  return buildRows(def, snap, lockTime).map((r) => ({ target: r.target, label: r.label, unit: r.unit, value: r.value, detail: r.detail, status: r.status }));
}
