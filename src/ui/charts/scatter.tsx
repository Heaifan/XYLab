// UA1 · Scatter（XYUI-8 8-10 消费）：X/Y 两个连续变量关系分析；选中恰两项 → 自动 X=第一 Y=第二，允许 ⇄ 交换与下拉改派。
// 轴 Label+Unit 必显；点为同一 Tick 配对（同时间网格）；不做趋势线因果解释（XYUI-8 禁令）。
import type { SeriesPoint } from '../../monitor/types';
import type { ExperimentDefinition } from '../../protocol/types';
import { formatNumber } from '../format';
import { valueAtTime } from '../monitor/metricModel';
import { H, PAD, labelOf, padRange, useWidth } from '../viz/shared';
import { unitOf } from '../viewState';

interface Props {
  series: Record<string, SeriesPoint[]>;
  def: ExperimentDefinition | null;
  targets: string[];
  xT: string;
  yT: string;
  onAssign: (field: 'x' | 'y', t: string) => void;
  onSwap: () => void;
}

export function scatterPairs(series: Record<string, SeriesPoint[]>, xT: string, yT: string): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const ys = series[yT] ?? [];
  for (const p of series[xT] ?? []) {
    if (typeof p.value !== 'number') continue;
    const q = valueAtTime(ys, p.time);
    if (q && q.time === p.time && typeof q.value === 'number') out.push({ x: p.value, y: q.value });
  }
  return out;
}

export function ScatterChart({ series, def, targets, xT, yT, onAssign, onSwap }: Props) {
  const [ref, w] = useWidth();
  const pts = scatterPairs(series, xT, yT);
  let xLo = Infinity, xHi = -Infinity, yLo = Infinity, yHi = -Infinity;
  for (const p of pts) {
    xLo = Math.min(xLo, p.x); xHi = Math.max(xHi, p.x);
    yLo = Math.min(yLo, p.y); yHi = Math.max(yHi, p.y);
  }
  ({ lo: xLo, hi: xHi } = padRange(xLo, xHi));
  ({ lo: yLo, hi: yHi } = padRange(yLo, yHi));
  const X = (v: number) => PAD.l + ((v - xLo) / (xHi - xLo)) * (w - PAD.l - PAD.r);
  const Y = (v: number) => PAD.t + (1 - (v - yLo) / (yHi - yLo)) * (H - PAD.t - PAD.b);
  const axisLabel = (t: string) => {
    const u = unitOf(def, t);
    return `${labelOf(def, t)}${u !== '' ? ` (${u})` : ''}`;
  };
  return (
    <div ref={ref}>
      <div className="scatter-ctl row">
        <label>
          X
          <select value={xT} onChange={(e) => onAssign('x', e.target.value)} aria-label="X 指标">
            {targets.map((t) => <option key={t} value={t}>{labelOf(def, t)}</option>)}
          </select>
        </label>
        <label>
          Y
          <select value={yT} onChange={(e) => onAssign('y', e.target.value)} aria-label="Y 指标">
            {targets.map((t) => <option key={t} value={t}>{labelOf(def, t)}</option>)}
          </select>
        </label>
        <button onClick={onSwap} aria-label="交换 X/Y">⇄ 交换</button>
        <span className="muted">{pts.length} 个配对点</span>
      </div>
      {pts.length === 0 ? (
        <p className="muted">无配对数据（两个指标需有同一时刻的数值采样）。</p>
      ) : (
        <svg width="100%" height={H} role="img" aria-label="散点图">
          <line x1={PAD.l} x2={w - PAD.r} y1={H - PAD.b} y2={H - PAD.b} className="chart-grid" />
          <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} className="chart-grid" />
          <text x={2} y={PAD.t + 4} className="chart-axis">{formatNumber(yHi)}</text>
          <text x={2} y={H - PAD.b} className="chart-axis">{formatNumber(yLo)}</text>
          <text x={PAD.l} y={H - 6} className="chart-axis">{formatNumber(xLo)}</text>
          <text x={w - PAD.r} y={H - 6} textAnchor="end" className="chart-axis">{formatNumber(xHi)}</text>
          {pts.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={2.5} className="scatter-dot" />)}
        </svg>
      )}
      <p className="muted chart-note">X = {axisLabel(xT)} · Y = {axisLabel(yT)}</p>
    </div>
  );
}
