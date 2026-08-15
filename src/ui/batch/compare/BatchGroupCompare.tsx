// BATCH-3 · Sweep Group → 指标比较 → 单方案详情；图形消费 XYUI-8 Line 语义与现有 chart classes。
import type { ExperimentDefinition } from '../../../protocol/types';
import { formatNumber } from '../../format';
import type { BatchResult, BatchScenario } from '../types';
import { buildSweepGroups, resultMean, type SweepRow } from './model';
interface Props {
  definition: ExperimentDefinition;
  scenarios: BatchScenario[];
  results: BatchResult[];
  targets: string[];
  chartTarget: string;
  onInspect: (id: string) => void;
}
function MiniLine({ rows, target, label }: { rows: SweepRow[]; target: string; label: string }) {
  const points = rows.map((row, index) => ({ x: typeof row.value === 'number' ? row.value : index, y: resultMean(row.results, target), label: String(row.value) }))
    .filter((point): point is { x: number; y: number; label: string } => point.y !== null);
  if (points.length < 2) return null;
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y), w = 520, h = 150, px = 34, py = 18;
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const X = (x: number) => px + ((x - x0) / (x1 - x0 || 1)) * (w - px * 2);
  const Y = (y: number) => py + (1 - (y - y0) / (y1 - y0 || 1)) * (h - py * 2);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join('');
  return <div className="batch-sweep-chart"><div className="muted">{label}</div><svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${label}单因素趋势`}>
    {[0, .5, 1].map((f) => <line key={f} x1={px} x2={w - px} y1={py + f * (h - py * 2)} y2={py + f * (h - py * 2)} className="chart-grid" />)}
    <path d={path} className="chart-line s-1" />
    {points.map((p) => <circle key={`${p.x}-${p.label}`} cx={X(p.x)} cy={Y(p.y)} r={3.5} className="chart-dot s-1"><title>{`${p.label}: ${formatNumber(p.y)}`}</title></circle>)}
    <text x={px} y={h - 3} className="chart-axis">{points[0].label}</text><text x={w - px} y={h - 3} textAnchor="end" className="chart-axis">{points[points.length - 1].label}</text>
    <text x={2} y={py + 4} className="chart-axis">{formatNumber(y1)}</text><text x={2} y={h - py} className="chart-axis">{formatNumber(y0)}</text>
  </svg></div>;
}
export function BatchGroupCompare({ definition, scenarios, results, targets, chartTarget, onInspect }: Props) {
  const groups = buildSweepGroups(definition, scenarios, results), metric = definition.variables[chartTarget];
  return <div className="batch-groups">{groups.map((group) => <section className="batch-group" key={group.variable}>
    <div className="batch-group-head"><b>{group.label}</b><span className="muted">{group.rows.length} 个水平</span></div>
    <div className="batch-table-wrap"><table className="vtable batch-table batch-group-table"><thead><tr><th>{definition.variables[group.variable]?.label ?? group.variable}</th>{targets.map((target) => <th key={target}>{definition.variables[target]?.label ?? target}</th>)}<th>详情</th></tr></thead>
      <tbody>{group.rows.map((row) => <tr key={String(row.value)}><td><b>{String(row.value)}{group.unit ?? ''}</b></td>{targets.map((target) => { const value = resultMean(row.results, target); return <td key={target}><b>{value === null ? '—' : formatNumber(value)}</b>{row.results.length > 1 && <small>n={row.results.length}</small>}</td>; })}<td>{row.scenarios[0] ? <button className="batch-result-link" onClick={() => onInspect(row.scenarios[0].id)}>查看</button> : '—'}</td></tr>)}</tbody>
    </table></div>
    <MiniLine rows={group.rows} target={chartTarget} label={`${metric?.label ?? chartTarget} × ${definition.variables[group.variable]?.label ?? group.variable}`} />
  </section>)}</div>;
}
