// FE-A-R2 · Metric Strip（XYUI-8 8.02/8.03 语义：数值优先、名称次之、Δ 与状态辅助；平面弱边框紧凑排布）。
// 数据唯一来源 MonitorSnapshot（锁定模式读锁定时间 series）；状态 = 结构化 threshold watch 比较，
// 绝不解析 event expression 发明 threshold；状态文字+颜色双通道（ColorOnlyState Forbidden）。
import type { ComparisonOperator, ExperimentDefinition } from '../../protocol/types';
import type { MonitorSnapshot } from '../../monitor/types';
import { formatMetric, formatValue } from '../format';
import { valueAtTime } from './LineChart';

export interface MetricModel {
  target: string;
  label: string;
  unit: string;
  value: string;
  detail: string;
  status: 'normal' | 'warning';
}

function cmp(a: number, op: ComparisonOperator, b: number): boolean {
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

export function resolveMetrics(def: ExperimentDefinition | null, snap: MonitorSnapshot | null, lockTime: number | null): MetricModel[] {
  if (!snap) return [];
  const seen = new Set<string>();
  const out: MetricModel[] = [];
  for (const w of snap.watches) {
    if (seen.has(w.target)) continue;
    seen.add(w.target);
    const stats = snap.statistics[w.target];
    const pts = snap.series[w.target] ?? [];
    const locked = lockTime !== null ? valueAtTime(pts, lockTime) : null;
    let value = '—';
    if (locked) value = formatValue(locked.value);
    else if (stats) value = typeof stats.current === 'number' ? formatMetric(stats.current) : String(stats.current);
    else if (pts.length > 0) value = formatValue(pts[pts.length - 1].value);
    let detail = '仅 Series';
    if (stats?.kind === 'numeric') detail = `Δ ${stats.delta >= 0 ? '+' : ''}${formatMetric(stats.delta)}`;
    else if (stats?.kind === 'boolean') detail = `${stats.changeCount} 次变化`;
    out.push({
      target: w.target,
      label: def?.variables[w.target]?.label ?? w.target,
      unit: def?.variables[w.target]?.unit ?? '',
      value,
      detail,
      status: metricStatus(snap, w.target),
    });
  }
  return out;
}

export function MetricStrip({ def, snap, lockTime }: { def: ExperimentDefinition | null; snap: MonitorSnapshot | null; lockTime: number | null }) {
  const metrics = resolveMetrics(def, snap, lockTime);
  if (metrics.length === 0) {
    return <p className="muted">未声明 watch 或未加载实验。</p>;
  }
  return (
    <div className="metric-strip" role="list">
      {metrics.map((m) => (
        <div key={m.target} className={`metric status-${m.status}`} role="listitem">
          <div className="metric-label">{m.label}</div>
          <div className="metric-value">
            {m.value}
            {m.unit !== '' && <span className="metric-unit">{m.unit}</span>}
          </div>
          <div className="metric-sub">
            <span>{m.detail}</span>
            {m.status === 'warning' && <span className="metric-flag">WARNING</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
