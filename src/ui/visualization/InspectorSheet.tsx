// F2 · Chart Inspector：时间锁定联动 / Series 读值 / 锁定时间文字必显（Tap Lock 语义不变）。
// 移动端不依赖 Hover：Tap 锁定 → 读目标时间 series；「跟随实时」解锁回到 Live。
// 零横向滚动硬门：行 grid 用 minmax(0,1fr)，label 省略号收缩。
import type { ExperimentDefinition } from '../../protocol/types';
import type { MonitorSnapshot } from '../../monitor/types';
import { formatNumber, formatValue } from '../format';
import { IconWarn } from '../icons/Icons';
import { valueAtTime } from '../monitor/metricModel';

interface Props {
  snap: MonitorSnapshot | null;
  definition: ExperimentDefinition | null;
  lockTime: number | null;
  onUnlock: () => void;
  variant: 'sheet' | 'panel';
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
          <span className="inspector-label">{r.label}</span>
          <b>{r.value}</b>
          <span className="muted">{r.detail}</span>
        </div>
      ))}
      {alert && (
        <div className={`inspector-alert level-${alert.level}`}>
          <IconWarn size={14} />
          <span>
            [{formatNumber(alert.time)}s] {alert.message}
          </span>
        </div>
      )}
    </section>
  );
}
