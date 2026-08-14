// Batch Experiment V1-F2 · 比较绑定、移动端直达方案结果、可分享结果 JSON。
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ExperimentDefinition } from '../../protocol/types';
import { withInitialValues } from '../experiment/draft';
import { formatNumber } from '../format';
import { useBreakpoint } from '../shell/useBreakpoint';
import { VIEW_INIT, initSelection, selectToggle, viewClearSelect, type ViewState } from '../viewState';
import { resolveChartTargets, VisualizationPanel } from '../visualization/VisualizationPanel';
import { runBatch } from './runner';
import { ScenarioEditor } from './ScenarioEditor';
import { batchResultExport, scenarioResultExport, scenarioTargets, type BatchResult, type BatchScenario } from './types';

interface Props { definition: ExperimentDefinition | null; }
function makeScenario(index: number): BatchScenario { return { id: `scenario-${Date.now()}-${index}`, name: `方案 ${String.fromCharCode(65 + index)}`, overrides: {} }; }
function numeric(v: unknown): v is number { return typeof v === 'number' && Number.isFinite(v); }
function jsonText(data: unknown) { return JSON.stringify(data, null, 2); }
function downloadJson(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([jsonText(data)], { type: 'application/json;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
async function copyText(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement('textarea'); area.value = text; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
}

export function BatchPanel({ definition }: Props) {
  const breakpoint = useBreakpoint(), detailRef = useRef<HTMLDivElement | null>(null);
  const [scenarios, setScenarios] = useState<BatchScenario[]>(() => [makeScenario(0), makeScenario(1)]);
  const [baselineId, setBaselineId] = useState(() => scenarios[0].id), [results, setResults] = useState<BatchResult[]>([]);
  const [running, setRunning] = useState(false), [count, setCount] = useState(1000);
  const [chartTarget, setChartTarget] = useState(''), [detailId, setDetailId] = useState('');
  const [view, setView] = useState<ViewState>(VIEW_INIT), [lockTime, setLockTime] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (detailId) detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [detailId]);
  const targets = useMemo(() => definition ? scenarioTargets(definition).filter((t) => ['number', 'integer'].includes(definition.variables[t]?.type)) : [], [definition]);
  const activeTarget = targets.includes(chartTarget) ? chartTarget : (targets[0] ?? '');
  const baseline = results.find((r) => r.scenarioId === baselineId);
  const rows = results.filter((r) => numeric(r.values[activeTarget])).map((r) => ({ id: r.scenarioId, name: r.name, value: r.values[activeTarget] as number }));
  const max = Math.max(1e-9, ...rows.map((r) => Math.abs(r.value)));
  const detail = results.find((r) => r.scenarioId === detailId), scenario = scenarios.find((s) => s.id === detailId);
  const detailDef = definition && scenario ? withInitialValues(definition, scenario.overrides) : null;
  const resolved = resolveChartTargets(detailDef, detail?.snapshot ?? null);
  function invalidate(next: BatchScenario[]) { setScenarios(next); setResults([]); setDetailId(''); }
  function change(i: number, next: BatchScenario) { invalidate(scenarios.map((s, n) => n === i ? next : s)); }
  function add() { invalidate([...scenarios, makeScenario(scenarios.length)]); }
  function remove(i: number) { const gone = scenarios[i], next = scenarios.filter((_, n) => n !== i); invalidate(next); if (gone.id === baselineId) setBaselineId(next[0]?.id ?? ''); }
  async function runAll() { if (!definition || !scenarios.length) return; setRunning(true); setResults([]); setDetailId(''); try { await runBatch(definition, scenarios, count, (result) => setResults((old) => [...old, result])); } finally { setRunning(false); } }
  function inspect(id: string) { if (!definition) return; const s = scenarios.find((item) => item.id === id); if (!s) return; setDetailId(id); setView({ ...VIEW_INIT, selected: initSelection(withInitialValues(definition, s.overrides)) }); setLockTime(null); }
  async function copy(data: unknown) { await copyText(jsonText(data)); setToast('结果 JSON 已复制，可直接发给 ChatGPT 分析'); }
  if (!definition) return <section className="panel"><h2>方案实验</h2><p className="muted">加载实验后可创建多个方案。</p></section>;
  const batchJson = batchResultExport(definition, scenarios, results, baselineId, count, activeTarget), scenarioJson = detail && scenario ? scenarioResultExport(definition, scenario, detail, count) : null;
  return <section className="panel batch-panel">
    <div className="batch-title"><h2>方案实验</h2><span className="muted">Batch Experiment V1 · XYUI</span></div>
    <div className="row batch-actions"><label>每方案模拟 <input type="number" min={1} value={count} disabled={running} onChange={(e) => setCount(Math.max(1, Math.floor(Number(e.target.value) || 1)))} /></label><button disabled={running} onClick={add}>+ 添加方案</button><button className="primary" disabled={running || !scenarios.length} onClick={runAll}>{running ? `运行中 ${results.length}/${scenarios.length}` : '运行全部方案'}</button></div>
    <div className="batch-list">{scenarios.map((s, i) => <ScenarioEditor key={s.id} definition={definition} scenario={s} baseline={s.id === baselineId} disabled={running} onChange={(n) => change(i, n)} onBaseline={() => setBaselineId(s.id)} onRemove={() => remove(i)} />)}</div>
    {!!results.length && <div className="batch-results"><div className="batch-result-head"><b>方案对比</b><div className="row"><button onClick={() => copy(batchJson)}>复制对比 JSON</button><button onClick={() => downloadJson(`${definition.experiment.id}-batch-result.json`, batchJson)}>下载 JSON</button></div></div>
      {!!targets.length && <div className="row"><label className="muted">比较指标</label><select value={activeTarget} onChange={(e) => setChartTarget(e.target.value)}>{targets.map((t) => <option key={t} value={t}>{definition.variables[t]?.label ?? t}</option>)}</select></div>}
      {!!rows.length && <div className="hbars">{rows.map((r, i) => <div className="hbar-row" key={r.id}><button className="batch-result-link" onClick={() => inspect(r.id)}>{r.name}</button><span className="hbar-track"><span className={`hbar-fill s-${i % 4 + 1}`} style={{ width: `${Math.abs(r.value) / max * 100}%` }} /></span><b className="hbar-value">{formatNumber(r.value)}</b></div>)}</div>}
      <div className="batch-table-wrap"><table className="vtable batch-table"><thead><tr><th>方案</th><th>参数</th><th>状态</th><th>{definition.variables[activeTarget]?.label ?? activeTarget}</th></tr></thead><tbody>{results.map((r) => { const s = scenarios.find((item) => item.id === r.scenarioId), v = r.values[activeTarget], bv = baseline?.values[activeTarget], delta = numeric(v) && numeric(bv) ? v - bv : null; const params = s ? Object.entries(s.overrides).map(([k, x]) => `${definition.variables[k]?.label ?? k}=${String(x)}${definition.variables[k]?.unit ?? ''}`).join(' · ') : '—'; return <tr key={r.scenarioId}><td><button className="batch-result-link" onClick={() => inspect(r.scenarioId)}>{r.name} · 查看</button></td><td>{params || '基准参数'}</td><td>{r.error ? '失败' : r.status === 'completed' ? '完成' : r.status}</td><td><b>{numeric(v) ? formatNumber(v) : String(v ?? '—')}</b>{delta !== null && r.scenarioId !== baselineId && <small className={delta >= 0 ? 'delta-up' : 'delta-down'}>{delta >= 0 ? '+' : ''}{formatNumber(delta)}</small>}</td></tr>; })}</tbody></table></div>
      {detail && detailDef && scenarioJson && <div ref={detailRef} className="batch-detail"><div className="batch-result-head"><b>{detail.name} · 结果可视化</b><div className="row"><button onClick={() => copy(scenarioJson)}>复制方案 JSON</button><button onClick={() => downloadJson(`${definition.experiment.id}-${detail.name}-result.json`, scenarioJson)}>下载 JSON</button><button onClick={() => setDetailId('')}>关闭</button></div></div><VisualizationPanel definition={detailDef} snap={detail.snapshot} lockTime={lockTime} onLock={setLockTime} view={view} setView={setView} resolved={resolved} breakpoint={breakpoint} toast={toast} onToggleSelect={(t) => { const n = selectToggle(view, detailDef, t); setView(n.view); setToast(n.toast); }} onClear={() => setView(viewClearSelect(view))} /></div>}
    </div>}
  </section>;
}
