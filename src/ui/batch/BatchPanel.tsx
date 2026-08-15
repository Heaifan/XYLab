// Batch Experiment BATCH-3 · Sweep Group / Matrix + 可靠复制/CRUD/运行反馈；可视化消费 XYUI-8。
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ExperimentDefinition } from '../../protocol/types';
import { copyText } from '../actions/clipboard';
import { ActionFeedback, type FeedbackState } from '../feedback/ActionFeedback';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import { withInitialValues } from '../experiment/draft';
import { formatNumber } from '../format';
import { useBreakpoint } from '../shell/useBreakpoint';
import { VIEW_INIT, initSelection, selectToggle, viewClearSelect, type ViewState } from '../viewState';
import { resolveChartTargets, VisualizationPanel } from '../visualization/VisualizationPanel';
import { BatchGroupCompare } from './compare/BatchGroupCompare';
import { BatchPreview } from './generator/BatchPreview';
import { expandBatchScenarios } from './generator/expand';
import { runBatch } from './runner';
import { ScenarioEditor } from './ScenarioEditor';
import { batchResultExport, scenarioResultExport, scenarioTargets, type BatchResult, type BatchScenario } from './types';
interface Props { definition: ExperimentDefinition | null; }
function makeScenario(index: number): BatchScenario { return { id: `scenario-${Date.now()}-${index}`, name: `方案 ${String.fromCharCode(65 + index)}`, overrides: {} }; }
function numeric(v: unknown): v is number { return typeof v === 'number' && Number.isFinite(v); }
function jsonText(data: unknown) { return JSON.stringify(data, null, 2); }
function downloadJson(name: string, data: unknown) { const url = URL.createObjectURL(new Blob([jsonText(data)], { type: 'application/json;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }
function baselineScenario(definition: ExperimentDefinition, scenarios: BatchScenario[]) {
  if (definition.batch?.mode !== 'sweep') return scenarios[0];
  return scenarios.find((scenario) => definition.batch!.dimensions.every((dim) => Object.is(scenario.overrides[dim.variable] ?? definition.variables[dim.variable].value, definition.variables[dim.variable].value))) ?? scenarios[0];
}
export function BatchPanel({ definition }: Props) {
  const breakpoint = useBreakpoint(), detailRef = useRef<HTMLDivElement | null>(null);
  const [scenarios, setScenarios] = useState<BatchScenario[]>([]), [baselineId, setBaselineId] = useState('');
  const [results, setResults] = useState<BatchResult[]>([]), [running, setRunning] = useState(false), [count, setCount] = useState(1000);
  const [chartTarget, setChartTarget] = useState(''), [detailId, setDetailId] = useState(''), [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [view, setView] = useState<ViewState>(VIEW_INIT), [lockTime, setLockTime] = useState<number | null>(null), [toast, setToast] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  function note(text: string, ok = true) { setFeedback({ text, ok }); window.setTimeout(() => setFeedback(null), 2400); }
  useEffect(() => { if (detailId) detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [detailId]);
  useEffect(() => { if (!definition) { setScenarios([]); return; } const generated = expandBatchScenarios(definition); const next = generated.length ? generated : [makeScenario(0), makeScenario(1)]; setScenarios(next); setBaselineId(baselineScenario(definition, next)?.id ?? ''); setResults([]); setDetailId(''); setCount(definition.batch?.tickLimit ?? 1000); if (generated.length) setFeedback({ text: `JSON 已生成 ${generated.length} 个唯一场景`, ok: true }); }, [definition]);
  const targets = useMemo(() => definition ? scenarioTargets(definition).filter((t) => ['number', 'integer'].includes(definition.variables[t]?.type)) : [], [definition]);
  const activeTarget = targets.includes(chartTarget) ? chartTarget : (targets[0] ?? ''), baseline = results.find((r) => r.scenarioId === baselineId), sweep = definition?.batch?.mode === 'sweep';
  const rows = results.filter((r) => numeric(r.values[activeTarget])).map((r) => ({ id: r.scenarioId, name: r.name, value: r.values[activeTarget] as number }));
  const max = Math.max(1e-9, ...rows.map((r) => Math.abs(r.value))), detail = results.find((r) => r.scenarioId === detailId), scenario = scenarios.find((s) => s.id === detailId);
  const detailDef = definition && scenario ? withInitialValues(definition, scenario.overrides) : null, resolved = resolveChartTargets(detailDef, detail?.snapshot ?? null);
  function invalidate(next: BatchScenario[]) { setScenarios(next); setResults([]); setDetailId(''); }
  function change(i: number, next: BatchScenario) { invalidate(scenarios.map((s, n) => n === i ? next : s)); note('方案已更新'); }
  function add() { invalidate([...scenarios, makeScenario(scenarios.length)]); note('方案已创建'); }
  function removeConfirmed() { if (pendingDelete === null) return; const gone = scenarios[pendingDelete], next = scenarios.filter((_, n) => n !== pendingDelete); invalidate(next); if (gone?.id === baselineId) setBaselineId(next[0]?.id ?? ''); setPendingDelete(null); note('方案已删除'); }
  async function runAll() { if (!definition || !scenarios.length) return; setRunning(true); setResults([]); setDetailId(''); try { const out = await runBatch(definition, scenarios, count, (result) => setResults((old) => [...old, result])); const failed = out.filter((r) => r.error).length; note(failed ? `运行完成：${out.length - failed} 成功，${failed} 失败` : `运行完成：${out.length} 个场景`, failed === 0); } catch { note('运行失败，请检查实验配置', false); } finally { setRunning(false); } }
  function inspect(id: string) { if (!definition) return; const s = scenarios.find((item) => item.id === id); if (!s) return; setDetailId(id); setView({ ...VIEW_INIT, selected: initSelection(withInitialValues(definition, s.overrides)) }); setLockTime(null); }
  async function copy(data: unknown) { const ok = await copyText(jsonText(data)); note(ok ? '结果 JSON 已复制' : '复制失败，请重试', ok); }
  if (!definition) return <section className="panel"><h2>方案实验</h2><p className="muted">加载实验后可创建或由 JSON 自动生成方案。</p></section>;
  const batchJson = batchResultExport(definition, scenarios, results, baselineId, count, activeTarget), scenarioJson = detail && scenario ? scenarioResultExport(definition, scenario, detail, count) : null;
  return <section className="panel batch-panel"><div className="batch-title"><h2>方案实验</h2><span className="muted">BATCH-3 · XYUI</span></div>
    {definition.batch && <BatchPreview definition={definition} scenarios={scenarios} />}
    <div className="row batch-actions"><label>每场景模拟 <input type="number" min={1} value={count} disabled={running || !!definition.batch?.tickLimit} onChange={(e) => setCount(Math.max(1, Math.floor(Number(e.target.value) || 1)))} /></label>{!definition.batch && <button disabled={running} onClick={add}>+ 添加方案</button>}<button className="primary" disabled={running || !scenarios.length} onClick={runAll}>{running ? `运行中 ${results.length}/${scenarios.length}` : `运行全部 ${scenarios.length} 个场景`}</button><ActionFeedback feedback={feedback} /></div>
    {!definition.batch && <div className="batch-list">{scenarios.map((s, i) => <ScenarioEditor key={s.id} definition={definition} scenario={s} baseline={s.id === baselineId} disabled={running} onChange={(n) => change(i, n)} onBaseline={() => { setBaselineId(s.id); note('基准方案已更新'); }} onRemove={() => setPendingDelete(i)} />)}</div>}
    {!!results.length && <div className="batch-results"><div className="batch-result-head"><b>{sweep ? '实验组指标比较' : '方案对比'}</b><div className="row"><button onClick={() => copy(batchJson)}>复制对比 JSON</button><button onClick={() => { downloadJson(`${definition.experiment.id}-batch-result.json`, batchJson); note('结果 JSON 已下载'); }}>下载 JSON</button></div></div>
      {!!targets.length && <div className="row"><label className="muted">趋势指标</label><select value={activeTarget} onChange={(e) => setChartTarget(e.target.value)}>{targets.map((t) => <option key={t} value={t}>{definition.variables[t]?.label ?? t}</option>)}</select></div>}
      {sweep ? <BatchGroupCompare definition={definition} scenarios={scenarios} results={results} targets={targets} chartTarget={activeTarget} onInspect={inspect} /> : <>{!!rows.length && <div className="hbars">{rows.map((r, i) => <div className="hbar-row" key={r.id}><button className="batch-result-link" onClick={() => inspect(r.id)}>{r.name}</button><span className="hbar-track"><span className={`hbar-fill s-${i % 4 + 1}`} style={{ width: `${Math.abs(r.value) / max * 100}%` }} /></span><b className="hbar-value">{formatNumber(r.value)}</b></div>)}</div>}
      <div className="batch-table-wrap"><table className="vtable batch-table"><thead><tr><th>方案</th><th>参数</th><th>状态</th><th>{definition.variables[activeTarget]?.label ?? activeTarget}</th></tr></thead><tbody>{results.map((r) => { const s = scenarios.find((item) => item.id === r.scenarioId), v = r.values[activeTarget], bv = baseline?.values[activeTarget], delta = numeric(v) && numeric(bv) ? v - bv : null; const params = s ? Object.entries(s.overrides).map(([k, x]) => `${definition.variables[k]?.label ?? k}=${String(x)}${definition.variables[k]?.unit ?? ''}`).join(' · ') : '—'; return <tr key={r.scenarioId}><td><button className="batch-result-link" onClick={() => inspect(r.scenarioId)}>{r.name} · 查看</button></td><td>{params || '基准参数'}</td><td>{r.error ? '失败' : r.status === 'completed' ? '完成' : r.status}</td><td><b>{numeric(v) ? formatNumber(v) : String(v ?? '—')}</b>{delta !== null && r.scenarioId !== baselineId && <small className={delta >= 0 ? 'delta-up' : 'delta-down'}>{delta >= 0 ? '+' : ''}{formatNumber(delta)}</small>}</td></tr>; })}</tbody></table></div></>}
      {detail && detailDef && scenarioJson && <div ref={detailRef} className="batch-detail"><div className="batch-result-head"><b>{detail.name} · 单场景详情</b><div className="row"><button onClick={() => copy(scenarioJson)}>复制方案 JSON</button><button onClick={() => { downloadJson(`${definition.experiment.id}-${detail.name}-result.json`, scenarioJson); note('方案 JSON 已下载'); }}>下载 JSON</button><button onClick={() => setDetailId('')}>关闭</button></div></div><VisualizationPanel definition={detailDef} snap={detail.snapshot} lockTime={lockTime} onLock={setLockTime} view={view} setView={setView} resolved={resolved} breakpoint={breakpoint} toast={toast} onToggleSelect={(t) => { const n = selectToggle(view, detailDef, t); setView(n.view); setToast(n.toast); }} onClear={() => setView(viewClearSelect(view))} /></div>}
    </div>}
    <ConfirmDialog open={pendingDelete !== null} title="删除方案" message="此操作会移除该方案及尚未保存的方案结果；没有自动恢复。" confirmText="删除" onCancel={() => setPendingDelete(null)} onConfirm={removeConfirmed} />
  </section>;
}
