// UA1 · Compare 族（XYUI-8 8-08 Bar 消费）：bar 垂直柱 / hbar 横向条（XYUI 横向默认优先）/ delta 中心零线偏差。
// 读取时间点 = 统一 Temporal Cursor：Locked → 锁定 Tick；Live → 当前 Tick。Delta 正负数值必须显示（不只靠颜色）。
import type { SeriesPoint, WatchRecord } from '../../monitor/types';
import type { ExperimentDefinition } from '../../protocol/types';
import { formatNumber } from '../format';
import { valueAtTime } from '../monitor/metricModel';
import { labelOf, relBase, useWidth } from '../viz/shared';
import type { VizMode } from '../viewState';

interface Props {
  series: Record<string, SeriesPoint[]>;
  targets: string[];
  mode: VizMode;
  watches: WatchRecord[];
  def: ExperimentDefinition | null;
  lockTime: number | null;
  lastTime: number;
  variant: 'bar' | 'hbar' | 'delta';
}

interface BarRow { tg: string; v: number; unit: string; }

export function barRows(series: Props['series'], targets: string[], mode: VizMode, def: Props['def'], t: number, variant: Props['variant']): BarRow[] {
  const out: BarRow[] = [];
  for (const tg of targets) {
    const pts = series[tg] ?? [];
    const p = valueAtTime(pts, t);
    if (!p || typeof p.value !== 'number') continue;
    const base = relBase(pts);
    let v: number | null = p.value;
    if (mode === 'relative') v = base ? (p.value / base) * 100 : null;
    if (variant === 'delta') v = base !== null && base !== 0 ? (mode === 'relative' ? (p.value / base - 1) * 100 : p.value - base) : null;
    if (v === null || !Number.isFinite(v)) continue; // Zero Baseline 防护：不产生 NaN/Infinity
    out.push({ tg, v, unit: mode === 'relative' ? '%' : def?.variables[tg]?.unit ?? '' });
  }
  return out;
}

export function BarCharts({ series, targets, mode, def, lockTime, lastTime, variant }: Props) {
  const [ref, w] = useWidth();
  const t = lockTime ?? lastTime;
  const rows = barRows(series, targets, mode, def, t, variant);
  if (rows.length === 0) return <p className="muted">无可读数值（相对/Delta 模式基线为 0 或非数值时跳过）。</p>;
  const caption = <p className="muted">读取时间 {formatNumber(t)}s{lockTime !== null ? '（已锁定）' : '（实时）'}</p>;
  if (variant === 'bar') {
    const max = Math.max(...rows.map((r) => Math.abs(r.v)), 1e-9);
    const lo = Math.min(0, ...rows.map((r) => r.v)), hi = Math.max(0, ...rows.map((r) => r.v));
    const Hb = 190, pad = 18, bw = Math.min(56, ((w - pad * 2) / rows.length) * 0.6);
    const Y = (v: number) => 10 + (1 - (v - lo) / (hi - lo || 1)) * (Hb - 40);
    return (
      <div ref={ref}>
        {caption}
        <svg width="100%" height={Hb} role="img" aria-label="柱状比较">
          <line x1={pad} x2={w - pad} y1={Y(0)} y2={Y(0)} className="chart-grid" />
          {rows.map((r, i) => {
            const cx = pad + ((i + 0.5) / rows.length) * (w - pad * 2);
            return (
              <g key={r.tg}>
                <rect x={cx - bw / 2} y={Math.min(Y(r.v), Y(0))} width={bw} height={Math.max(2, Math.abs(Y(r.v) - Y(0)))} className={`bar-fill s-${(i % 4) + 1}`} />
                <text x={cx} y={Y(r.v) - 4} textAnchor="middle" className="chart-axis">{formatNumber(r.v)}{r.unit}</text>
                <text x={cx} y={Hb - 6} textAnchor="middle" className="chart-axis">{labelOf(def, r.tg).slice(0, 6)}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }
  const max = Math.max(...rows.map((r) => Math.abs(r.v)), 1e-9);
  const isDelta = variant === 'delta';
  return (
    <div className="hbars">
      {caption}
      {rows.map((r, i) => (
        <div className="hbar-row" key={r.tg}>
          <span className="hbar-label">{labelOf(def, r.tg)}</span>
          <span className={`hbar-track${isDelta ? ' zero' : ''}`}>
            <span className={`hbar-fill s-${(i % 4) + 1}${isDelta ? (r.v >= 0 ? ' pos' : ' neg') : ''}`} style={{ width: `${(Math.abs(r.v) / max) * (isDelta ? 50 : 100)}%` }} />
          </span>
          <b className="hbar-value">{r.v >= 0 && isDelta ? '+' : ''}{formatNumber(r.v)}{r.unit}</b>
        </div>
      ))}
    </div>
  );
}
