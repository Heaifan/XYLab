// STAT-1 · Scatter：二维配对只含成功 Tick；轴统计消费 MonitorSnapshot，径向统计由配对点派生。
import { useState } from 'react';
import type { NumericStatistics, SeriesPoint, WatchStatistics } from '../../monitor/types';
import type { ExperimentDefinition } from '../../protocol/types';
import { formatNumber } from '../format';
import { valueAtTime } from '../monitor/metricModel';
import { H, PAD, labelOf, useWidth } from '../viz/shared';
import { unitOf } from '../viewState';

type Pt = { x: number; y: number };
export type ScatterRangeMode = 'reference' | 'all';
interface Props {
  series: Record<string, SeriesPoint[]>; stats: Record<string, WatchStatistics>; def: ExperimentDefinition | null;
  targets: string[]; xT: string; yT: string; onAssign: (field: 'x' | 'y', t: string) => void; onSwap: () => void;
}
export function scatterPairs(series: Record<string, SeriesPoint[]>, xT: string, yT: string): Pt[] {
  const out: Pt[] = [], ys = series[yT] ?? [];
  for (const p of series[xT] ?? []) {
    const q = valueAtTime(ys, p.time);
    if (p.tickIndex !== 0 && q?.tickIndex !== 0 && typeof p.value === 'number' && q?.time === p.time && typeof q.value === 'number') out.push({ x: p.value, y: q.value });
  }
  return out;
}
export function scatterExtent(pts: Pt[], sigma: number | null, mode: ScatterRangeMode): number {
  let extent = sigma ? sigma * 3 : 0;
  if (mode === 'all' || !sigma) for (const p of pts) extent = Math.max(extent, Math.abs(p.x), Math.abs(p.y));
  return extent > 0 ? extent * 1.08 : 1;
}
export function scatterOutsideReference(pts: Pt[], sigma: number | null): number {
  return sigma ? pts.filter((p) => Math.hypot(p.x, p.y) > sigma * 3).length : 0;
}
export function scatterDotVisual(count: number) {
  if (count >= 1000) return { r: 1.7, opacity: 0.62 };
  if (count >= 500) return { r: 2, opacity: 0.72 };
  if (count >= 200) return { r: 2.2, opacity: 0.8 };
  return { r: 2.5, opacity: 0.9 };
}
export function scatterRadiusStats(pts: Pt[]) {
  let sum = 0, max = 0;
  for (const p of pts) { const r = Math.hypot(p.x, p.y); sum += r; if (r > max) max = r; }
  return { meanRadius: pts.length ? sum / pts.length : 0, maxRadius: max };
}
function numeric(stats: Record<string, WatchStatistics>, target: string): NumericStatistics | null {
  const s = stats[target]; return s?.kind === 'numeric' ? s : null;
}
function referenceSigma(def: ExperimentDefinition | null, series: Record<string, SeriesPoint[]>): number | null {
  for (const key of ['dispersion_sigma_m', 'sigma_m', 'dispersion_radius_m']) {
    const live = series[key]?.at(-1)?.value, fixed = def?.variables[key]?.value;
    if (typeof live === 'number' && live > 0) return live;
    if (typeof fixed === 'number' && fixed > 0) return fixed;
  }
  const d = def?.variables.distance_m?.value, m = def?.variables.dispersion_mrad?.value;
  return typeof d === 'number' && typeof m === 'number' && d > 0 && m > 0 ? d * m / 1000 : null;
}
const showStat = (v: number | null) => v === null ? '—' : formatNumber(v);

export function ScatterChart({ series, stats, def, targets, xT, yT, onAssign, onSwap }: Props) {
  const [ref, w] = useWidth(), pts = scatterPairs(series, xT, yT);
  const [range, setRange] = useState<ScatterRangeMode>('reference'), [showSigma, setShowSigma] = useState(true);
  const sameUnit = unitOf(def, xT) === unitOf(def, yT), sigma = sameUnit ? referenceSigma(def, series) : null;
  const active: ScatterRangeMode = sigma ? range : 'all', limit = sigma ? sigma * 3 : Infinity;
  const visible = active === 'reference' ? pts.filter((p) => Math.hypot(p.x, p.y) <= limit) : pts;
  const out = scatterOutsideReference(pts, sigma), dot = scatterDotVisual(pts.length), half = scatterExtent(pts, sigma, active);
  const xs = numeric(stats, xT), ys = numeric(stats, yT), radial = scatterRadiusStats(pts);
  const n = Math.min(pts.length, xs?.sampleCount ?? pts.length, ys?.sampleCount ?? pts.length);
  const plotW = Math.max(1, w - PAD.l - PAD.r), plotH = H - PAD.t - PAD.b, side = Math.min(plotW, plotH);
  const cx = PAD.l + plotW / 2, cy = PAD.t + plotH / 2, scale = side / (2 * half);
  const left = cx - side / 2, right = cx + side / 2, top = cy - side / 2, bottom = cy + side / 2;
  const X = (v: number) => cx + v * scale, Y = (v: number) => cy - v * scale;
  const axis = (t: string) => `${labelOf(def, t)}${unitOf(def, t) ? ` (${unitOf(def, t)})` : ''}`;
  return <div ref={ref}>
    <div className="legend" aria-label="散点图图例"><span className="legend-item"><b>●</b>弹着点</span><span className="legend-item"><b>⊕</b>瞄准中心</span>{sigma && <span className="legend-item"><b>○</b>1σ / 2σ / 3σ</span>}</div>
    <div className="scatter-ctl row"><label>X <select value={xT} onChange={(e) => onAssign('x', e.target.value)}>{targets.map((t) => <option key={t} value={t}>{labelOf(def, t)}</option>)}</select></label>
      <label>Y <select value={yT} onChange={(e) => onAssign('y', e.target.value)}>{targets.map((t) => <option key={t} value={t}>{labelOf(def, t)}</option>)}</select></label><button onClick={onSwap}>⇄ 交换</button>
      {sigma && <><div className="seg"><button className={range === 'reference' ? 'on' : ''} onClick={() => setRange('reference')}>参考范围 ±3σ</button><button className={range === 'all' ? 'on' : ''} onClick={() => setRange('all')}>全部数据</button></div><button onClick={() => setShowSigma((v) => !v)}>σ辅助圈 {showSigma ? '开' : '关'}</button></>}
      <span className="muted">{pts.length} 发{sigma ? ` · 3σ圆外 ${out} 发` : ''}</span></div>
    {xs && ys && <div className="stats muted"><strong>STAT-1 · N {n}</strong><span>Mean X {formatNumber(xs.average)} · Y {formatNumber(ys.average)}</span><span>样本σ X {showStat(xs.sampleStdDev)} · Y {showStat(ys.sampleStdDev)}</span>{sameUnit && <span>平均半径 {formatNumber(radial.meanRadius)} · 最大半径 {formatNumber(radial.maxRadius)}</span>}</div>}
    {pts.length === 0 ? <p className="muted">无配对数据。</p> : <svg width="100%" height={H} role="img" aria-label="二维弹着散点图">
      <line x1={left} x2={right} y1={cy} y2={cy} className="chart-grid"/><line x1={cx} x2={cx} y1={top} y2={bottom} className="chart-grid"/>
      {showSigma && sigma && [1, 2, 3].map((k) => <circle key={k} cx={cx} cy={cy} r={k * sigma * scale} fill="none" className="chart-grid"/>)}
      <g><circle cx={cx} cy={cy} r={4} className="chart-dot s-1"/><line x1={cx - 6} x2={cx + 6} y1={cy} y2={cy} className="chart-lock"/><line x1={cx} x2={cx} y1={cy - 6} y2={cy + 6} className="chart-lock"/></g>
      <text x={left} y={top + 10} className="chart-axis">{formatNumber(half)}</text><text x={left} y={bottom} className="chart-axis">-{formatNumber(half)}</text><text x={left} y={H - 6} className="chart-axis">-{formatNumber(half)}</text><text x={right} y={H - 6} textAnchor="end" className="chart-axis">{formatNumber(half)}</text>
      {visible.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={dot.r} opacity={dot.opacity} className="scatter-dot"/>)}
    </svg>}
    <p className="muted chart-note">X = {axis(xT)} · Y = {axis(yT)} · X/Y 等比例 · 统计不含 time=0 初始化点{sigma ? ` · 参考σ = ${formatNumber(sigma)} ${unitOf(def, xT)}` : ''}</p>
  </div>;
}
