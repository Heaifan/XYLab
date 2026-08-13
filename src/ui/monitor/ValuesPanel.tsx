// R4-F1 · 当前值面板：实时变量值表（轮询投影）。
import type { MonitorSnapshot } from './useMonitor';

export function ValuesPanel({ snap }: { snap: MonitorSnapshot }) {
  return (
    <section className="panel">
      <h2>当前值</h2>
      <table className="values">
        <thead>
          <tr>
            <th>变量</th>
            <th>当前值</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(snap.values).length === 0 && (
            <tr>
              <td colSpan={2} className="muted">
                加载实验后显示。
              </td>
            </tr>
          )}
          {Object.entries(snap.values).map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td className="num">{String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
