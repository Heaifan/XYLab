// F2 · SVG LineChart：Focus/Compare + 绝对/相对双模式（相对 = 运行开始值为 100%，基线 0/非数值跳过并提示）。
// XYUI-8 8.06 语义不变：弱 Grid / X=Time / Y 自动范围 / 实时追加 / Tap Lock / 跟随实时；数据唯一来源 MonitorSnapshot.series。
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { MonitorLogEntry, SeriesPoint, WatchRecord } from '../../monitor/types';
import { formatNumber } from '../format';
import { nearestTime, valueAtTime } from '../monitor/metricModel';

const H = 220;
const PAD = { l: 40, r: 8, t: 8, b: 22 };
const F = [0.25, 0.5, 0.75];
const relBase = (pts: SeriesPoint[]): number | null => {
  const p = pts.find((q) => typeof q.value === 'number'); // 运行开始值 = 首个数值点
  return p ? (p.value as number) : null;
};

interface Props {
  series: Record<string, SeriesPoint[]>;
  targets: string[];
  mode: 'absolute' | 'relative';
  watches: WatchRecord[];
  events: MonitorLogEntry[];
  emphasis: string | null;
  lockTime: number | null;
  onLock: (t: number | null) => void;
  onFocus: (t: string) => void;
}

export function LineChart({ series, targets, mode, watches, events, emphasis, lockTime, onLock, onFocus }: Props) {
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
  const bases = new Map(targets.map((tg) => [tg, relBase(series[tg] ?? [])]));
  const skipped = mode === 'relative' ? targets.filter((tg) => { const b = bases.get(tg); return b === null || b === 0; }) : [];
  const drawn = targets.filter((tg) => !skipped.includes(tg));
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
  if (!Number.isFinite(lo)) { lo = 0; hi = 1; } if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
  const yMin = lo - (hi - lo) * 0.08, yMax = hi + (hi - lo) * 0.08;
  const X = (t: number) => PAD.l + (t / xMax) * (w - PAD.l - PAD.r);
  const Y = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);
  const path = (tg: string, pts: SeriesPoint[]) =>
    pts.filter((p) => typeof p.value === 'number').map((p, i) => `${i === 0 ? 'M' : 'L'}${X(p.time).toFixed(1)} ${Y(val(tg, p.value as number)).toFixed(1)}`).join('');
  const tap = (e: RPointerEvent<SVGSVGElement>) => {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    onLock(nearestTime(lists, Math.max(0, Math.min(xMax, ((x - PAD.l) / (w - PAD.l - PAD.r)) * xMax))));
  };
  const fmtY = (v: number) => (mode === 'relative' ? `${formatNumber(v)}%` : formatNumber(v));
  const thresholds = mode === 'absolute' ? watches.filter((wd) => wd.mode === 'threshold' && wd.threshold !== undefined && drawn.includes(wd.target)) : [];
  return (
    <div className="chart-wrap" ref={ref}>
      <div className="chart-head">
        <div className="legend">
          {drawn.map((tg, i) => <button key={tg} className={`legend-item legend-btn s-${(i % 4) + 1}${emphasis === tg ? ' emph' : ''}`} onClick={() => onFocus(tg)}><i />{tg}</button>)}
        </div>
        {lockTime !== null ? <button onClick={() => onLock(null)}>跟随实时</button> : <span className="muted">Tap 曲线锁定检查点</span>}
      </div>
      <svg width="100%" height={H} onPointerDown={tap} role="img" aria-label="实时趋势图">
        {F.map((f) => <line key={`h${f}`} x1={PAD.l} x2={w - PAD.r} y1={PAD.t + f * (H - PAD.t - PAD.b)} y2={PAD.t + f * (H - PAD.t - PAD.b)} className="chart-grid" />)}
        {F.map((f) => <line key={`v${f}`} x1={PAD.l + f * (w - PAD.l - PAD.r)} x2={PAD.l + f * (w - PAD.l - PAD.r)} y1={PAD.t} y2={H - PAD.b} className="chart-grid" />)}
        <text x={2} y={PAD.t + 4} className="chart-axis">{fmtY(hi)}</text>
        <text x={2} y={H - PAD.b} className="chart-axis">{fmtY(lo)}</text>
        <text x={w - PAD.r} y={H - 6} textAnchor="end" className="chart-axis">{formatNumber(xMax)}s</text>
        {thresholds.map((wd) => (
          <g key={`th-${wd.target}-${wd.threshold}`}>
            <line x1={PAD.l} x2={w - PAD.r} y1={Y(wd.threshold!)} y2={Y(wd.threshold!)} className="chart-threshold" /><text x={w - PAD.r} y={Y(wd.threshold!) - 2} textAnchor="end" className="chart-axis">{wd.target} {wd.operator} {formatNumber(wd.threshold!)}</text>
          </g>
        ))}
        {drawn.map((tg, i) => <path key={tg} d={path(tg, lists[i])} className={`chart-line s-${(i % 4) + 1}${emphasis === tg ? ' emph' : ''}`} />)}
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
