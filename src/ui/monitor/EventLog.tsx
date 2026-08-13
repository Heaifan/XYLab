// FE-A-R1 · 正式事件日志：只消费 MonitorSnapshot.logs（R3 协议日志：change/event/runtime）。
// UI diff 伪日志已废除；数据合同（time/tickIndex/level/kind/source/target/message/前后值）原样投影，不重新解析 message。
import type { MonitorLogEntry, MonitorSnapshot } from '../../monitor/types';

function EntryLine({ l }: { l: MonitorLogEntry }) {
  const body =
    l.kind === 'change' && l.previousValue !== undefined
      ? `${l.target ?? ''} ${String(l.previousValue)} → ${String(l.currentValue)}`
      : l.message;
  const tail = l.kind !== 'change' && l.target ? `${l.source} · ${l.target}` : l.source;
  return (
    <div className={`log-line level-${l.level}`}>
      <span className="muted">
        [t={l.time} #{l.tickIndex}]
      </span>{' '}
      {body}{' '}
      <span className="muted">
        {l.kind}/{tail}
      </span>
    </div>
  );
}

export function EventLog({ snap }: { snap: MonitorSnapshot | null }) {
  const logs = snap?.logs ?? [];
  return (
    <section className="panel log-panel">
      <h2>事件日志</h2>
      <div className="log" role="log">
        {logs.length === 0 && <p className="muted">暂无事件。加载实验后点击 Run 或 Step。</p>}
        {logs.map((l) => (
          <EntryLine key={l.id} l={l} />
        ))}
      </div>
    </section>
  );
}
