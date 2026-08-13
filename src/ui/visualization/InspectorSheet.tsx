// FE-A-R2 · Chart Inspector（XYUI-8 ChartInspector 语义：时间锁定联动 / Series 读值 / 锁定时间文字必显）。
// 移动端不依赖 Hover：Tap 锁定 → 本检查器读目标时间 series；「跟随实时」解锁回到 Live。
import type { ExperimentDefinition } from '../../protocol/types';
import type { MonitorSnapshot } from '../../monitor/types';
import { formatNumber, formatValue } from '../format';
import { valueAtTime } from './LineChart';

interface Props {
  snap: MonitorSnapshot | null;
  definition: ExperimentDefinition | null;
  lockTime: number | null;
  onUnlock: () => void;
  variant: 'sheet' | 'panel';
}

function WarnIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2.2 14.6 13.4H1.4L8 2.2Z" />
      <path d="M8 6.4v3.2M8 11.6v.2" strokeLinecap="round" />
    </svg>
  );
}

export function InspectorSheet({ snap, definition, lockTime, onUnlock, variant }: Props) {
  if (!snap) {
    return variant === 'panel' ? (
      <section className="panel">
        <h2>检查器</h2>
        <p className="muted">加载实验后显示。</p>
      </section>
    ) : null;
  }
  const t = lockTime ?? snap.session.lastTime;
  const seen = new Set<string>();
  const rows = snap.watches
    .filter((w) => (seen.has(w.target) ? false : (seen.add(w.target), true)))
    .map((w) => {
      const p = valueAtTime(snap.series[w.target] ?? [], t);
      const stats = snap.statistics[w.target];
      const detail = stats?.kind === 'numeric' ? `Δ ${stats.delta >= 0 ? '+' : ''}${formatNumber(stats.delta)}` : stats?.kind === 'boolean' ? `${stats.changeCount} 次变化` : '';
      return { target: w.target, label: definition?.variables[w.target]?.label ?? w.target, value: p ? formatValue(p.value) : '—', detail };
    });
  const alert = [...snap.logs].reverse().find((l) => l.kind === 'event' && (l.level === 'warning' || l.level === 'critical'));
  return (
    <section className={variant === 'sheet' ? 'inspector inspector-sheet' : 'panel inspector'}>
      <div className="inspector-head">
        <h2>
          {formatNumber(t)}s · 检查器{lockTime !== null ? '（已锁定）' : ''}
        </h2>
        {lockTime !== null && <button onClick={onUnlock}>跟随实时</button>}
      </div>
      {rows.map((r) => (
        <div className="inspector-row" key={r.target}>
          <span>{r.label}</span>
          <b>{r.value}</b>
          <span className="muted">{r.detail}</span>
        </div>
      ))}
      {alert && (
        <div className={`inspector-alert level-${alert.level}`}>
          <WarnIcon />
          <span>
            [{formatNumber(alert.time)}s] {alert.message}
          </span>
        </div>
      )}
    </section>
  );
}
