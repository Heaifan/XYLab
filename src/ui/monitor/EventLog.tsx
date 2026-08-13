// UI-F1 · 事件日志：UI 层 diff 投影出的日志行（未来对应 R3 Event Log / 战场弹幕）。
import type { LogLine } from './useMonitor';

export function EventLog({ log }: { log: LogLine[] }) {
  return (
    <section className="panel log-panel">
      <h2>日志</h2>
      <div className="log" role="log">
        {log.length === 0 && <p className="muted">暂无事件。加载实验后点击 Run 或 Step。</p>}
        {log.map((l) => (
          <div key={l.id} className={`log-line level-${l.level}`}>
            {l.text}
          </div>
        ))}
      </div>
    </section>
  );
}
