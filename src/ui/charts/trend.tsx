// UA1 · Trend 族（XYUI-8 8-06 Line / 8-07 Area 消费）：line/area/step 三变体共享坐标与双模式语义。
// 相对模式 = 运行起始值 100%；基线 0/非数值 → 跳过并提示（Zero Baseline 防护，F2 冻结延续）；Tap Lock 联动不变。
import type { PointerEvent as RPointerEvent } from 'react';
import type { MonitorLogEntry, SeriesPoint, WatchRecord } from '../../monitor/types';
import { formatNumber } from '../format';
import { nearestTime, valueAtTime } from '../monitor/metricModel';
import { GRID, H, PAD, labelOf, padRange, relBase, relSkipped, useWidth } from '../viz/shared';
import type { ExperimentDefinition } from '../../protocol/types';
import type { VizMode } from '../viewState';

interface Props {
  series: Record<string, SeriesPoint[]>;
  targets: string[];
  mode: VizMode;
  watches: WatchRecord[];
  events: MonitorLogEntry[];
  lockTime: number | null;
  onLock: (t: number | null) => void;
  def: ExperimentDefinition | null;
  variant: 'line' | 'area' | 'step';
}

export function TrendChart({ series, targets, mode, watches, events, lockTime, onLock, def, variant }: Props) {
  const [ref, w] = useWidth();
  const skipped = relSkipped(mode, targets, series);
  const drawn = targets.filter((tg) => !skipped.includes(tg));
  const bases = new Map(targets.map((tg) => [tg, relBase(series[tg] ?? [])]));
  const lists = drawn.map((tg) => series[tg] ?? []);
  const val = (tg: string, v: number) => (mode === 'relative' ? (v / (bases.get(tg) as number)) * 100 : v);
  let xMax = 1, lo = Infinity, hi = -Infinity;
  for (let i = 0; i < lists.length; i++) {
    for (const p of lists[i]) {
      if (typeof p.value !== 'number') continue;
      const v = val(drawn[i], p.value);
      xMax = Math.max(xMax, p.time);
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
  }
  ({ lo, hi } = padRange(lo, hi));
  const yMin = lo - (hi - lo) * 0.08, yMax = hi + (hi - lo) * 0.08;
  const X = (t: number) => PAD.l + (t / xMax) * (w - PAD.l - PAD.r);
  const Y = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);
  const linePath = (tg: string, pts: SeriesPoint[]) =>
    pts.filter((p) => typeof p.value === 'number').map((p, i) => `${i === 0 ? 'M' : 'L'}${X(p.time).toFixed(1)} ${Y(val(tg, p.value as number)).toFixed(1)}`).join('');
  const stepPath = (tg: string, pts: SeriesPoint[]) => {
    let d = '', prev: number | null = null;
    for (const p of pts) {
      if (typeof p.value !== 'number') continue;
      const y = Y(val(tg, p.value)).toFixed(1);
      d += prev === null ? `M${X(p.time).toFixed(1)} ${y}` : `H${X(p.time).toFixed(1)} V${y}`;
      prev = p.time;
    }
    return d;
  };
  const path = variant === 'step' ? stepPath : linePath;
  const baseY = Y(Math.max(yMin, Math.min(0, yMax))); // area 填充基线（0 在范围内取 0，否则取下沿）
  const tap = (e: RPointerEvent<SVGSVGElement>) => {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    onLock(nearestTime(lists, Math.max(0, Math.min(xMax, ((x - PAD.l) / (w - PAD.l - PAD.r)) * xMax))));
  };
  const fmtY = (v: number) => (mode === 'relative' ? `${formatNumber(v)}%` : formatNumber(v));
  const thresholds = mode === 'absolute' ? watches.filter((wd) => wd.mode === 'threshold' && wd.threshold !== undefined && drawn.includes(wd.target)) : [];
  return (
    <div ref={ref}>
      <svg width="100%" height={H} onPointerDown={tap} role="img" aria-label="趋势图">
        {GRID.map((f) => <line key={`h${f}`} x1={PAD.l} x2={w - PAD.r} y1={PAD.t + f * (H - PAD.t - PAD.b)} y2={PAD.t + f * (H - PAD.t - PAD.b)} className="chart-grid" />)}
        {GRID.map((f) => <line key={`v${f}`} x1={PAD.l + f * (w - PAD.l - PAD.r)} x2={PAD.l + f * (w - PAD.l - PAD.r)} y1={PAD.t} y2={H - PAD.b} className="chart-grid" />)}
        <text x={2} y={PAD.t + 4} className="chart-axis">{fmtY(hi)}</text>
        <text x={2} y={H - PAD.b} className="chart-axis">{fmtY(lo)}</text>
        <text x={w - PAD.r} y={H - 6} textAnchor="end" className="chart-axis">{formatNumber(xMax)}s</text>
        {thresholds.map((wd) => (
          <g key={`th-${wd.target}-${wd.threshold}`}>
            <line x1={PAD.l} x2={w - PAD.r} y1={Y(wd.threshold!)} y2={Y(wd.threshold!)} className="chart-threshold" /><text x={w - PAD.r} y={Y(wd.threshold!) - 2} textAnchor="end" className="chart-axis">{labelOf(def, wd.target)} {wd.operator} {formatNumber(wd.threshold!)}</text>
          </g>
        ))}
        {variant === 'area' && drawn.map((tg, i) => {
          const d = linePath(tg, lists[i]);
          const nums = lists[i].filter((p) => typeof p.value === 'number');
          return nums.length > 0 ? <path key={`a-${tg}`} d={`${d}L${X(nums[nums.length - 1].time).toFixed(1)} ${baseY.toFixed(1)}L${X(nums[0].time).toFixed(1)} ${baseY.toFixed(1)}Z`} className={`chart-area s-${(i % 4) + 1}`} /> : null;
        })}
        {drawn.map((tg, i) => <path key={tg} d={path(tg, lists[i])} className={`chart-line s-${(i % 4) + 1}`} />)}
        {events.filter((l) => l.kind === 'event').map((l) => (
          <circle key={l.id} cx={X(l.time)} cy={H - PAD.b + 8} r={3} className={`chart-evt level-${l.level}`}>
            <title>{`t=${formatNumber(l.time)} [${l.level}] ${l.message}`}</title>
          </circle>
        ))}
        {lockTime !== null && <line x1={X(lockTime)} x2={X(lockTime)} y1={PAD.t} y2={H - PAD.b} className="chart-lock" />}
        {lockTime !== null && drawn.map((tg, i) => {
          const p = valueAtTime(lists[i], lockTime);
          return p && typeof p.value === 'number' ? <circle key={`dot-${tg}`} cx={X(p.time)} cy={Y(val(tg, p.value))} r={3.5} className={`chart-dot s-${(i % 4) + 1}`} /> : null;
        })}
      </svg>
      {skipped.length > 0 && <p className="muted chart-note">相对模式跳过：{skipped.join(', ')}（基线为 0 或非数值）</p>}
    </div>
  );
}
