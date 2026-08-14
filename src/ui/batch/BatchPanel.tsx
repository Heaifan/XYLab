// Batch Experiment V1 · XYUI 批量实验面板：多方案、基准 Δ、逐项回填与指标比较。
import { useMemo, useState } from 'react';
import type { ExperimentDefinition } from '../../protocol/types';
import { formatNumber } from '../format';
import { runBatch } from './runner';
import { ScenarioEditor } from './ScenarioEditor';
import { scenarioTargets, type BatchResult, type BatchScenario } from './types';

interface Props { definition: ExperimentDefinition | null; }
function makeScenario(index: number): BatchScenario { return { id: `scenario-${Date.now()}-${index}`, name: `方案 ${String.fromCharCode(65 + index)}`, overrides: {} }; }
function numeric(v: unknown): v is number { return typeof v === 'number' && Number.isFinite(v); }

export function BatchPanel({ definition }: Props) {
  const [scenarios, setScenarios] = useState<BatchScenario[]>(() => [makeScenario(0), makeScenario(1)]);
  const [baselineId, setBaselineId] = useState(() => scenarios[0].id);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(1000);
  const [chartTarget, setChartTarget] = useState('');
  const targets = useMemo(() => definition ? scenarioTargets(definition) : [], [definition]);
  const activeTarget = targets.includes(chartTarget) ? chartTarget : targets[0];
  const baseline = results.find((r) => r.scenarioId === baselineId);
  const chartRows = results.filter((r) => numeric(r.values[activeTarget])).map((r) => ({ id: r.scenarioId, name: r.name, value: r.values[activeTarget] as number }));
  const chartMax = Math.max(1e-9, ...chartRows.map((r) => Math.abs(r.value)));
  function invalidate(next: BatchScenario[]) { setScenarios(next); setResults([]); }
  function changeScenario(index: number, next: BatchScenario) { invalidate(scenarios.map((s, i) => i === index ? next : s)); }
  function addScenario() { invalidate([...scenarios, makeScenario(scenarios.length)]); }
  function removeScenario(index: number) {
    const removed = scenarios[index];
    const next = scenarios.filter((_, i) => i !== index);
    invalidate(next);
    if (removed.id === baselineId) setBaselineId(next[0]?.id ?? '');
  }
  async function runAll() {
    if (!definition || scenarios.length === 0) return;
    setRunning(true); setResults([]);
    try { await runBatch(definition, scenarios, count, (result) => setResults((old) => [...old, result])); }
    finally { setRunning(false); }
  }
  if (!definition) return <section className="panel"><h2>方案实验</h2><p className="muted">加载实验后可创建多个方案。</p></section>;
  return (
    <section className="panel batch-panel">
      <div className="batch-title"><h2>方案实验</h2><span className="muted">Batch Experiment V1 · XYUI</span></div>
      <div className="row batch-actions">
        <label>每方案模拟 <input type="number" min={1} step={1} value={count} disabled={running} onChange={(e) => setCount(Math.max(1, Math.floor(Number(e.target.value) || 1)))} /></label>
        <button disabled={running} onClick={addScenario}>+ 添加方案</button>
        <button className="primary" disabled={running || scenarios.length === 0} onClick={runAll}>{running ? `运行中 ${results.length}/${scenarios.length}` : '运行全部方案'}</button>
      </div>
      <div className="batch-list">{scenarios.map((s, i) => <ScenarioEditor key={s.id} definition={definition} scenario={s} baseline={s.id === baselineId} disabled={running}
        onChange={(n) => changeScenario(i, n)} onBaseline={() => setBaselineId(s.id)} onRemove={() => removeScenario(i)} />)}</div>
      {results.length > 0 && <div className="batch-results">
        <div className="batch-result-head"><b>方案对比</b><span className="muted">Δ 相对基准方案；正负数值显式显示</span></div>
        {targets.length > 0 && <div className="row"><label className="muted">比较指标</label><select value={activeTarget} onChange={(e) => setChartTarget(e.target.value)}>{targets.map((t) => <option key={t} value={t}>{definition.variables[t]?.label ?? t}</option>)}</select></div>}
        {chartRows.length > 0 && <div className="hbars">{chartRows.map((r, i) => <div className="hbar-row" key={r.id}><span className="hbar-label">{r.name}</span><span className="hbar-track"><span className={`hbar-fill s-${(i % 4) + 1}`} style={{ width: `${Math.abs(r.value) / chartMax * 100}%` }} /></span><b className="hbar-value">{formatNumber(r.value)}</b></div>)}</div>}
        <div className="batch-table-wrap"><table className="vtable batch-table"><thead><tr><th>方案</th><th>状态</th>{targets.map((t) => <th key={t}>{definition.variables[t]?.label ?? t}</th>)}</tr></thead><tbody>
          {results.map((r) => <tr key={r.scenarioId}><td>{r.name}</td><td>{r.error ? '失败' : r.status}</td>{targets.map((t) => { const v = r.values[t], bv = baseline?.values[t]; const delta = numeric(v) && numeric(bv) ? v - bv : null; return <td key={t}><b>{numeric(v) ? formatNumber(v) : String(v ?? '—')}</b>{delta !== null && r.scenarioId !== baselineId && <small className={delta >= 0 ? 'delta-up' : 'delta-down'}>{delta >= 0 ? '+' : ''}{formatNumber(delta)}</small>}</td>; })}</tr>)}
        </tbody></table></div>
      </div>}
    </section>
  );
}
