// Scatter：连续 X/Y 配对；提供原点十字、等比例坐标与可选参考圆辅助判断。
import { useState } from 'react';
import type { SeriesPoint } from '../../monitor/types';
import type { ExperimentDefinition } from '../../protocol/types';
import { formatNumber } from '../format';
import { valueAtTime } from '../monitor/metricModel';
import { H, PAD, labelOf, useWidth } from '../viz/shared';
import { unitOf } from '../viewState';
interface Props { series: Record<string, SeriesPoint[]>; def: ExperimentDefinition | null; targets: string[]; xT: string; yT: string;
  onAssign: (field: 'x' | 'y', t: string) => void; onSwap: () => void; }
export function scatterPairs(series: Record<string, SeriesPoint[]>, xT: string, yT: string) {
  const out: { x: number; y: number }[] = [], ys = series[yT] ?? [];
  for (const p of series[xT] ?? []) { const q = valueAtTime(ys, p.time);
    if (typeof p.value === 'number' && q?.time === p.time && typeof q.value === 'number') out.push({ x: p.value, y: q.value }); }
  return out;
}
export function ScatterChart({ series, def, targets, xT, yT, onAssign, onSwap }: Props) {
  const [ref, w] = useWidth(), pts = scatterPairs(series, xT, yT), [showCircle, setShowCircle] = useState(true);
  const radiusTarget = targets.find((t) => t === 'dispersion_radius_m');
  const radiusSeries = radiusTarget ? series[radiusTarget] ?? [] : [];
  const rv = radiusSeries.at(-1)?.value, radius = typeof rv === 'number' && rv > 0 ? rv : null;
  let extent = radius ?? 0;
  for (const p of pts) extent = Math.max(extent, Math.abs(p.x), Math.abs(p.y));
  extent = extent > 0 ? extent * 1.08 : 1;
  const plotW = Math.max(1, w - PAD.l - PAD.r), plotH = H - PAD.t - PAD.b;
  const half = Math.max(extent, extent * plotW / plotH), scale = Math.min(plotW, plotH) / (2 * half);
  const cx = PAD.l + plotW / 2, cy = PAD.t + plotH / 2, X = (v: number) => cx + v * scale, Y = (v: number) => cy - v * scale;
  const axisLabel = (t: string) => `${labelOf(def, t)}${unitOf(def, t) ? ` (${unitOf(def, t)})` : ''}`;
  return <div ref={ref}>
    <div className="scatter-ctl row"><label>X <select value={xT} onChange={(e) => onAssign('x', e.target.value)}>{targets.map(t => <option key={t} value={t}>{labelOf(def,t)}</option>)}</select></label>
      <label>Y <select value={yT} onChange={(e) => onAssign('y', e.target.value)}>{targets.map(t => <option key={t} value={t}>{labelOf(def,t)}</option>)}</select></label>
      <button onClick={onSwap}>⇄ 交换</button>{radius && <button onClick={() => setShowCircle(v => !v)}>参考圆 {showCircle ? '开' : '关'}</button>}
      <span className="muted">{pts.length} 个配对点</span></div>
    {pts.length === 0 ? <p className="muted">无配对数据。</p> : <svg width="100%" height={H} role="img" aria-label="散点图">
      <line x1={PAD.l} x2={w-PAD.r} y1={cy} y2={cy} className="chart-grid"/><line x1={cx} x2={cx} y1={PAD.t} y2={H-PAD.b} className="chart-grid"/>
      {showCircle && radius && <circle cx={cx} cy={cy} r={radius*scale} fill="none" className="chart-grid"/>}
      <circle cx={cx} cy={cy} r={3} className="scatter-dot"/>
      <text x={2} y={PAD.t+4} className="chart-axis">{formatNumber(half)}</text><text x={2} y={H-PAD.b} className="chart-axis">-{formatNumber(half)}</text>
      <text x={PAD.l} y={H-6} className="chart-axis">-{formatNumber(half)}</text><text x={w-PAD.r} y={H-6} textAnchor="end" className="chart-axis">{formatNumber(half)}</text>
      {pts.map((p,i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={2.5} className="scatter-dot"/>)}
    </svg>}
    <p className="muted chart-note">X = {axisLabel(xT)} · Y = {axisLabel(yT)} · X/Y 等比例 · 十字线 = 原点{radius ? ` · 参考圆 = ${formatNumber(radius)}` : ''}</p>
  </div>;
}
