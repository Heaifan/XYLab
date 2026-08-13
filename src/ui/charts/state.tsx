// UA1 · State 族（XYUI-8 8-13 Gauge / 8-04 Progress&Range 消费）：线性阈值语义，禁汽车仪表盘；阈值文字+颜色双通道。
// gauge=阈值仪表（阈值带+当前 Marker）；range=观测区间（min~max 轨道）；tband=只列 threshold Watch 的阈值带视图。
import type { SeriesPoint, WatchRecord, WatchStatistics } from '../../monitor/types';
import type { ExperimentDefinition } from '../../protocol/types';
import { formatMetric, formatNumber } from '../format';
import { cmp, valueAtTime } from '../monitor/metricModel';
import { labelOf } from '../viz/shared';
import { unitOf } from '../viewState';

interface Props {
  series: Record<string, SeriesPoint[]>;
  targets: string[];
  watches: WatchRecord[];
  stats: Record<string, WatchStatistics | undefined>;
  def: ExperimentDefinition | null;
  lockTime: number | null;
  lastTime: number;
  variant: 'gauge' | 'range' | 'tband';
}

export function StateCharts({ series, targets, watches, stats, def, lockTime, lastTime, variant }: Props) {
  const t = lockTime ?? lastTime;
  const rows = targets
    .map((tg) => {
      const p = valueAtTime(series[tg] ?? [], t);
      const cur = p && typeof p.value === 'number' ? p.value : null;
      const st = stats[tg];
      const lo = st?.kind === 'numeric' ? Math.min(st.min, cur ?? st.min) : cur ?? 0;
      const hi = st?.kind === 'numeric' ? Math.max(st.max, cur ?? st.max) : cur ?? 1;
      const ths = watches.filter((wd) => wd.target === tg && wd.mode === 'threshold' && wd.threshold !== undefined);
      return { tg, cur, lo, hi, ths };
    })
    .filter((r) => (variant === 'tband' ? r.ths.length > 0 : true));
  if (rows.length === 0) return <p className="muted">{variant === 'tband' ? '选中项无 threshold Watch。' : '无可读数值。'}</p>;
  return (
    <div className="grow">
      <p className="muted">读取时间 {formatNumber(t)}s{lockTime !== null ? '（已锁定）' : '（实时）'}</p>
      {rows.map((r) => {
        const span = r.hi - r.lo || 1;
        const pos = (v: number) => `${Math.max(0, Math.min(100, ((v - r.lo) / span) * 100)).toFixed(1)}%`;
        const cur = r.cur;
        const breached = cur !== null && r.ths.some((th) => cmp(cur, th.operator, th.threshold!));
        return (
          <div className="grow-row" key={r.tg}>
            <span className="hbar-label" title={r.tg}>{labelOf(def, r.tg)}</span>
            <span className="grow-track">
              {variant !== 'range' && r.ths.map((th) => {
                const beyond = th.operator === '>=' || th.operator === '>' ? { left: pos(th.threshold!), right: 0 } : { left: 0, right: `calc(100% - ${pos(th.threshold!)})` };
                return <span key={`${th.operator}${th.threshold}`} className="grow-band" style={beyond} />;
              })}
              {r.ths.map((th) => <span key={`m${th.operator}${th.threshold}`} className="grow-th" style={{ left: pos(th.threshold!) }} title={`${th.operator} ${th.threshold}`} />)}
              {r.cur !== null && <span className="grow-marker" style={{ left: pos(r.cur) }} />}
            </span>
            <b className={`hbar-value${breached ? ' grow-warn' : ''}`}>
              {r.cur !== null ? formatMetric(r.cur) : '—'}
              {unitOf(def, r.tg) !== '' ? ` ${unitOf(def, r.tg)}` : ''}
              {variant !== 'range' && r.ths.length > 0 ? (breached ? ' 超阈值' : ' 安全') : ''}
            </b>
            {variant === 'range' && <span className="muted grow-minmax">{formatNumber(r.lo)} ~ {formatNumber(r.hi)}</span>}
            {variant !== 'range' && r.ths.map((th) => <span key={`t${th.operator}${th.threshold}`} className="muted grow-thlabel">{labelOf(def, r.tg)} {th.operator} {formatNumber(th.threshold!)}</span>)}
          </div>
        );
      })}
    </div>
  );
}
