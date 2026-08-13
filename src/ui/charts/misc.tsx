// UA1 · Process/Advanced（XYUI-8 8-12 Timeline compact 消费 + Advanced Table）：事件点击 → 锁定该时刻（统一 Temporal Cursor）；
// 表格按时间采样读 series（0/25/50/75/100%），锁定列高亮。只显示有分析价值的事件，不塞全部日志（8-12 禁令）。
import type { MonitorLogEntry, SeriesPoint } from '../../monitor/types';
import type { ExperimentDefinition } from '../../protocol/types';
import { formatMetric, formatNumber } from '../format';
import { nearestTime, valueAtTime } from '../monitor/metricModel';
import { labelOf, useWidth } from '../viz/shared';

interface Props {
  kind: 'timeline' | 'table';
  series: Record<string, SeriesPoint[]>;
  targets: string[];
  events: MonitorLogEntry[];
  def: ExperimentDefinition | null;
  lockTime: number | null;
  onLock: (t: number | null) => void;
  lastTime: number;
}

export function MiscCharts({ kind, series, targets, events, def, lockTime, onLock, lastTime }: Props) {
  const [ref, w] = useWidth();
  if (kind === 'timeline') {
    const evs = events.filter((l) => l.kind === 'event');
    const xMax = Math.max(lastTime, ...evs.map((e) => e.time), 1);
    const X = (t: number) => 10 + (t / xMax) * (w - 20);
    return (
      <div ref={ref}>
        {evs.length === 0 ? (
          <p className="muted">暂无事件（运行产生 event 后显示于此）。</p>
        ) : (
          <svg width="100%" height={88} role="img" aria-label="事件时间轴">
            <line x1={10} x2={w - 10} y1={44} y2={44} className="tl-axis" />
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <g key={f}>
                <line x1={X(f * xMax)} x2={X(f * xMax)} y1={41} y2={47} className="tl-axis" />
                <text x={X(f * xMax)} y={62} textAnchor="middle" className="chart-axis">{formatNumber(f * xMax)}s</text>
              </g>
            ))}
            {evs.map((l) => (
              <circle key={l.id} cx={X(l.time)} cy={44} r={4.5} className={`tl-evt level-${l.level}`} onClick={() => onLock(l.time)}>
                <title>{`t=${formatNumber(l.time)} [${l.level}] ${l.message}（点击锁定）`}</title>
              </circle>
            ))}
            {lockTime !== null && <line x1={X(lockTime)} x2={X(lockTime)} y1={28} y2={60} className="chart-lock" />}
          </svg>
        )}
        <p className="muted chart-note">点击事件 → 锁定到该时刻：Inspector / 图表 / 监控值同步（XYUI-8 联动合同）。</p>
      </div>
    );
  }
  const end = Math.max(lastTime, 1);
  const cols = [0, 0.25, 0.5, 0.75, 1].map((f) => f * end);
  const lockedCol = lockTime !== null ? nearestTime([cols.map((c) => ({ time: c, tickIndex: 0, value: 0 }))], lockTime) : null;
  return (
    <div ref={ref}>
      <table className="vtable">
        <thead>
          <tr>
            <th scope="col">指标</th>
            {cols.map((c) => <th key={c} scope="col" className={lockedCol === c ? 'on' : ''}>{formatNumber(c)}s</th>)}
          </tr>
        </thead>
        <tbody>
          {targets.map((tg) => (
            <tr key={tg}>
              <td className="vtable-label" title={tg}>{labelOf(def, tg)}</td>
              {cols.map((c) => {
                const p = valueAtTime(series[tg] ?? [], c);
                return <td key={c} className={lockedCol === c ? 'on' : ''}>{p && typeof p.value === 'number' ? formatMetric(p.value) : '—'}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted chart-note">采样 0~{formatNumber(end)}s 五列；锁定时刻所在列高亮。</p>
    </div>
  );
}
