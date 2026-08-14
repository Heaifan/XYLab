// Scatter：连续 X/Y 配对；启动样本不计弹着点；支持 σ 参考圈与参考/全量范围。
import { useState } from 'react';
import type { SeriesPoint } from '../../monitor/types';
import type { ExperimentDefinition } from '../../protocol/types';
import { formatNumber } from '../format';
import { valueAtTime } from '../monitor/metricModel';
import { H, PAD, labelOf, useWidth } from '../viz/shared';
import { unitOf } from '../viewState';

type ScatterPoint = { x: number; y: number };
type RangeMode = 'reference' | 'all';
interface Props {
  series: Record<string, SeriesPoint[]>; def: ExperimentDefinition | null; targets: string[]; xT: string; yT: string;
  onAssign: (field: 'x' | 'y', t: string) => void; onSwap: () => void;
}

export function scatterPairs(series: Record<string, SeriesPoint[]>, xT: string, yT: string): ScatterPoint[] {
  const out: ScatterPoint[] = [], ys = series[yT] ?? [];
  for (const p of series[xT] ?? []) {
    const q = valueAtTime(ys, p.time);
    if (p.tickIndex === 0 || q?.tickIndex === 0) continue;
    if (typeof p.value === 'number' && q?.time === p.time && typeof q.value === 'number') out.push({ x: p.value, y: q.value });
  }
  return out;
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

export function scatterExtent(pts: ScatterPoint[], sigma: number | null, mode: RangeMode): number {
  let extent = sigma ? sigma * 3 : 0;
  if (mode === 'all' || !sigma) for (const p of pts) extent = Math.max(extent, Math.abs(p.x), Math.abs(p.y));
  return extent > 0 ? extent * 1.08 : 1;
}

export function scatterOutsideReference(pts: ScatterPoint[], sigma: number | null): number {
  if (!sigma) return 0;
  const limit = sigma * 3;
  return pts.filter((p) => Math.abs(p.x) > limit || Math.abs(p.y) > limit).length;
}

export function ScatterChart({ series, def, targets, xT, yT, onAssign, onSwap }: Props) {
  const [ref, w] = useWidth(), pts = scatterPairs(series, xT, yT);
  const [range, setRange] = useState<RangeMode>('reference'), [showSigma, setShowSigma] = useState(true);
  const sameUnit = unitOf(def, xT) === unitOf(def, yT), sigma = sameUnit ? referenceSigma(def, series) : null;
  const activeRange: RangeMode = sigma ? range : 'all', outliers = activeRange === 'reference' ? scatterOutsideReference(pts, sigma) : 0;
  const limit = sigma ? sigma * 3 : Infinity;
  const visible = activeRange === 'reference' ? pts.filter((p) => Math.abs(p.x) <= limit && Math.abs(p.y) <= limit) : pts;
  const half = scatterExtent(pts, sigma, activeRange), plotW = Math.max(1, w - PAD.l - PAD.r), plotH = H - PAD.t - PAD.b;
  const side = Math.min(plotW, plotH), cx = PAD.l + plotW / 2, cy = PAD.t + plotH / 2, scale = side / (2 * half);
  const left = cx - side / 2, right = cx + side / 2, top = cy - side / 2, bottom = cy + side / 2;
  const X = (v: number) => cx + v * scale, Y = (v: number) => cy - v * scale;
  const axisLabel = (t: string) => `${labelOf(def, t)}${unitOf(def, t) ? ` (${unitOf(def, t)})` : ''}`;
  return <div ref={ref}>
    <div className="legend" aria-label="散点图图例">
      <span className="legend-item"><b aria-hidden="true">●</b>弹着点</span>
      <span className="legend-item"><b aria-hidden="true">⊕</b>瞄准中心</span>
      {sigma && <span className="legend-item"><b aria-hidden="true">○</b>1σ / 2σ / 3σ</span>}
    </div>
    <div className="scatter-ctl row"><label>X <select value={xT} onChange={(e) => onAssign('x', e.target.value)}>{targets.map(t => <option key={t} value={t}>{labelOf(def,t)}</option>)}</select></label>
      <label>Y <select value={yT} onChange={(e) => onAssign('y', e.target.value)}>{targets.map(t => <option key={t} value={t}>{labelOf(def,t)}</option>)}</select></label>
      <button onClick={onSwap}>⇄ 交换</button>
      {sigma && <><div className="seg" role="radiogroup" aria-label="散点显示范围"><button className={range === 'reference' ? 'on' : ''} onClick={() => setRange('reference')}>参考范围 ±3σ</button><button className={range === 'all' ? 'on' : ''} onClick={() => setRange('all')}>全部数据</button></div><button onClick={() => setShowSigma(v => !v)}>σ辅助圈 {showSigma ? '开' : '关'}</button></>}
      <span className="muted">{pts.length} 发{outliers > 0 ? ` · 超界 ${outliers} 发` : ''}</span></div>
    {pts.length === 0 ? <p className="muted">无配对数据。</p> : <svg width="100%" height={H} role="img" aria-label="二维弹着散点图">
      <line x1={left} x2={right} y1={cy} y2={cy} className="chart-grid"/><line x1={cx} x2={cx} y1={top} y2={bottom} className="chart-grid"/>
      {showSigma && sigma && [1, 2, 3].map(n => <circle key={n} cx={cx} cy={cy} r={n*sigma*scale} fill="none" className="chart-grid"/>)}
      <g><circle cx={cx} cy={cy} r={4} className="chart-dot s-1"/><line x1={cx-6} x2={cx+6} y1={cy} y2={cy} className="chart-lock"/><line x1={cx} x2={cx} y1={cy-6} y2={cy+6} className="chart-lock"/></g>
      <text x={left} y={top+10} className="chart-axis">{formatNumber(half)}</text><text x={left} y={bottom} className="chart-axis">-{formatNumber(half)}</text>
      <text x={left} y={H-6} className="chart-axis">-{formatNumber(half)}</text><text x={right} y={H-6} textAnchor="end" className="chart-axis">{formatNumber(half)}</text>
      {visible.map((p,i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={2.5} className="scatter-dot"/>)}
    </svg>}
    <p className="muted chart-note">X = {axisLabel(xT)} · Y = {axisLabel(yT)} · X/Y 等比例 · ⊕ = 瞄准中心{sigma ? ` · σ = ${formatNumber(sigma)}${unitOf(def, xT) ? ` ${unitOf(def, xT)}` : ''}` : ''}</p>
  </div>;
}
