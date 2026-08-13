// UI-F1 · 监控面板：时间 / tickIndex / 状态 / 变量当前值 / 最近变化。
import type { MonitorSnapshot } from './useMonitor';

export function MonitorPanel({ snap }: { snap: MonitorSnapshot }) {
  return (
    <section className="panel">
      <h2>监控</h2>
      <div className="stats">
        <span>
          时间 <b>{snap.time}</b>
        </span>
        <span>
          Tick <b>{snap.tickIndex}</b>
        </span>
        <span>
          状态 <b className={`status status-${snap.status}`}>{snap.status}</b>
        </span>
      </div>
      {snap.lastError && <div className="error-banner">最近错误：{snap.lastError}</div>}
      <table className="values">
        <thead>
          <tr>
            <th>变量</th>
            <th>当前值</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(snap.values).map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td className="num">{String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">曲线图区（R3/R4 后续轮次接入，本轮为响应式 Shell 占位）</p>
    </section>
  );
}
