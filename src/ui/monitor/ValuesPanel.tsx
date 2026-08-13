// FE-A-R1 · 监控值面板：只消费 MonitorSnapshot（watches/series/statistics），顺序以协议声明为准。
// numeric → 完整统计项；boolean → 当前值/变化次数；其他类型 → 仅 Series 最新值（绝不伪造统计）。
import type { MonitorSnapshot, WatchRecord, WatchStatistics } from '../../monitor/types';

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10000) / 10000);
}

function latestSeriesValue(snap: MonitorSnapshot, target: string): string {
  const pts = snap.series[target];
  return pts && pts.length > 0 ? String(pts[pts.length - 1].value) : '—';
}

function currentValue(snap: MonitorSnapshot, w: WatchRecord): string {
  const stats = snap.statistics[w.target];
  return stats ? String(stats.current) : latestSeriesValue(snap, w.target);
}

function statsText(stats: WatchStatistics | undefined): string {
  if (!stats) return '仅 Series · 无统计';
  if (stats.kind === 'numeric') {
    return `Δ${fmt(stats.delta)} · min ${fmt(stats.min)} · max ${fmt(stats.max)} · avg ${fmt(stats.average)} · n ${stats.sampleCount} · 初值 ${fmt(stats.initial)}`;
  }
  return `变化 ${stats.changeCount} 次 · 初值 ${String(stats.initial)}`;
}

function modeText(w: WatchRecord): string {
  return w.mode === 'threshold' ? `threshold ${w.operator} ${String(w.threshold)}` : w.mode;
}

export function ValuesPanel({ snap }: { snap: MonitorSnapshot | null }) {
  return (
    <section className="panel">
      <h2>监控值</h2>
      {!snap && <p className="muted">加载实验后显示。</p>}
      {snap && snap.watches.length === 0 && <p className="muted">该实验未声明 watch。</p>}
      {snap && snap.watches.length > 0 && (
        <table className="values">
          <thead>
            <tr>
              <th>监控目标</th>
              <th>当前值</th>
              <th>统计</th>
            </tr>
          </thead>
          <tbody>
            {snap.watches.map((w) => (
              <tr key={`${w.target}:${w.mode}:${String(w.threshold ?? '')}`}>
                <td>
                  {w.target} <span className="muted">{modeText(w)}</span>
                </td>
                <td className="num">{currentValue(snap, w)}</td>
                <td className="muted">{statsText(snap.statistics[w.target])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
