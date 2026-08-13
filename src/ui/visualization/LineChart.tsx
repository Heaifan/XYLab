// FE-A-R2 · SVG LineChart（XYUI-8 8.06 语义：弱 Grid / X=Time / Y 自动范围 / 实时追加 / 自动 Fit / Follow Live / Tap Lock）。
// 不加图表库；移动端禁依赖 Hover（Tap=锁定检查点，「跟随实时」解锁）；数据唯一来源 MonitorSnapshot.series。
// 时间域纯函数 valueAtTime/nearestTime 供 Metric/Inspector 共用（锁定点读取目标时间 Series）。
import { useEffect, useRef, useState } from 'react';
import type { MonitorLogEntry, SeriesPoint, WatchRecord } from '../../monitor/types';
import { formatNumber } from '../format';
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
const H = 220;
const PAD = { l: 36, r: 8, t: 8, b: 22 };
const F = [0.25, 0.5, 0.75];
interface Props {
  series: Record<string, SeriesPoint[]>;
  targets: string[];
  watches: WatchRecord[];
  events: MonitorLogEntry[];
  lockTime: number | null;
  onLock: (t: number | null) => void;
}

export function LineChart({ series, targets, watches, events, lockTime, onLock }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(340);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(200, el.clientWidth)));
    ro.observe(el);
    setW(Math.max(200, el.clientWidth));
    return () => ro.disconnect();
  }, []);
  const lists = targets.map((tg) => series[tg] ?? []);
  let xMax = 1, lo = Infinity, hi = -Infinity;
  for (const pts of lists) for (const p of pts) {
    if (typeof p.value !== 'number') continue;
    xMax = Math.max(xMax, p.time);
    lo = Math.min(lo, p.value);
    hi = Math.max(hi, p.value);
  }
  if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
  if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
  const yMin = lo - (hi - lo) * 0.08, yMax = hi + (hi - lo) * 0.08;
  const X = (t: number) => PAD.l + (t / xMax) * (w - PAD.l - PAD.r);
  const Y = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);
  const path = (pts: SeriesPoint[]) =>
    pts.filter((p) => typeof p.value === 'number').map((p, i) => `${i === 0 ? 'M' : 'L'}${X(p.time).toFixed(1)} ${Y(p.value as number).toFixed(1)}`).join('');
  function tap(e: React.PointerEvent<SVGSVGElement>) {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    onLock(nearestTime(lists, Math.max(0, Math.min(xMax, ((x - PAD.l) / (w - PAD.l - PAD.r)) * xMax))));
  }
  const thresholds = watches.filter((wd) => wd.mode === 'threshold' && wd.threshold !== undefined && targets.includes(wd.target));
  return (
    <div className="chart-wrap" ref={ref}>
      <div className="chart-head">
        <div className="legend">
          {targets.map((tg, i) => <span key={tg} className={`legend-item s-${(i % 4) + 1}`}><i />{tg}</span>)}
        </div>
        {lockTime !== null ? <button onClick={() => onLock(null)}>跟随实时</button> : <span className="muted">Tap 曲线锁定检查点</span>}
      </div>
      <svg width="100%" height={H} onPointerDown={tap} role="img" aria-label="实时趋势图">
        {F.map((f) => <line key={`h${f}`} x1={PAD.l} x2={w - PAD.r} y1={PAD.t + f * (H - PAD.t - PAD.b)} y2={PAD.t + f * (H - PAD.t - PAD.b)} className="chart-grid" />)}
        {F.map((f) => <line key={`v${f}`} x1={PAD.l + f * (w - PAD.l - PAD.r)} x2={PAD.l + f * (w - PAD.l - PAD.r)} y1={PAD.t} y2={H - PAD.b} className="chart-grid" />)}
        <text x={2} y={PAD.t + 4} className="chart-axis">{formatNumber(hi)}</text>
        <text x={2} y={H - PAD.b} className="chart-axis">{formatNumber(lo)}</text>
        <text x={w - PAD.r} y={H - 6} textAnchor="end" className="chart-axis">{formatNumber(xMax)}s</text>
        {thresholds.map((wd) => (
          <g key={`th-${wd.target}-${wd.threshold}`}>
            <line x1={PAD.l} x2={w - PAD.r} y1={Y(wd.threshold!)} y2={Y(wd.threshold!)} className="chart-threshold" />
            <text x={w - PAD.r} y={Y(wd.threshold!) - 2} textAnchor="end" className="chart-axis">{wd.target} {wd.operator} {formatNumber(wd.threshold!)}</text>
          </g>
        ))}
        {targets.map((tg, i) => <path key={tg} d={path(lists[i])} className={`chart-line s-${(i % 4) + 1}`} />)}
        {events.filter((l) => l.kind === 'event').map((l) => (
          <circle key={l.id} cx={X(l.time)} cy={H - PAD.b + 8} r={3} className={`chart-evt level-${l.level}`}>
            <title>{`t=${formatNumber(l.time)} [${l.level}] ${l.message}`}</title>
          </circle>
        ))}
        {lockTime !== null && <line x1={X(lockTime)} x2={X(lockTime)} y1={PAD.t} y2={H - PAD.b} className="chart-lock" />}
        {lockTime !== null && targets.map((tg, i) => {
          const p = valueAtTime(lists[i], lockTime);
          return p && typeof p.value === 'number' ? <circle key={`dot-${tg}`} cx={X(p.time)} cy={Y(p.value)} r={3.5} className={`chart-dot s-${(i % 4) + 1}`} /> : null;
        })}
      </svg>
    </div>
  );
}
