// UA1 · Visualization Container（XYUI-8 8-01 消费组合）：Pinned Cards(SnapshotRail) + Toolbar(Picker+模式+计数) + Canvas(VizHost)。
// Inspector/Legend/Chart 同源消费 VisualizationSelectionState（App 持有）；候选解析规则不变（output.charts 优先）。
import type { ExperimentDefinition } from '../../protocol/types';
import type { MonitorSnapshot } from '../../monitor/types';
import type { Breakpoint } from '../shell/breakpoints';
import { effectivePinned, mixedUnits, selectedTargets, type ViewState } from '../viewState';
import { MetricStrip } from './MetricStrip';
import { VizHost } from '../viz/VizHost';
import { VizPicker } from '../viz/picker';
import type { VizCtx } from '../viz/compat';

export function resolveChartTargets(definition: ExperimentDefinition | null, snap: MonitorSnapshot | null): string[] {
  if (!snap) return [];
  const declared = (definition?.output?.charts ?? []).filter((c) => c.x === 'time' && snap.series[c.y] !== undefined);
  if (declared.length > 0) return [...new Set(declared.map((c) => c.y))];
  const numeric = snap.watches.filter((w) => w.type === 'number' || w.type === 'integer').map((w) => w.target);
  return [...new Set(numeric)].slice(0, 4);
}

interface Props {
  definition: ExperimentDefinition | null;
  snap: MonitorSnapshot | null;
  lockTime: number | null;
  onLock: (t: number | null) => void;
  view: ViewState;
  setView: (v: ViewState) => void;
  resolved: string[];
  breakpoint: Breakpoint;
  toast: string | null;
  onToggleSelect: (t: string) => void;
  onClear: () => void;
}

export function VisualizationPanel(p: Props) {
  if (!p.snap) {
    return (
      <section className="panel">
        <h2>可视化</h2>
        <p className="muted">加载实验后显示。</p>
      </section>
    );
  }
  const pinned = effectivePinned(p.view, p.resolved);
  const targets = selectedTargets(p.view, p.resolved);
  const ctx: VizCtx = {
    count: targets.length,
    mixedUnits: mixedUnits(p.definition, targets),
    mode: p.view.mode,
    hasThreshold: p.snap.watches.some((w) => targets.includes(w.target) && w.mode === 'threshold'),
    hasEvents: p.snap.logs.some((l) => l.kind === 'event'),
  };
  return (
    <section className="panel viz-panel">
      <MetricStrip def={p.definition} snap={p.snap} lockTime={p.lockTime} pinned={pinned} onToggle={p.onToggleSelect} />
      <div className="viz-toolbar">
        <VizPicker ctx={ctx} current={p.view.viz} compact={p.breakpoint === 'compact'} onPick={(id) => p.setView({ ...p.view, viz: id })} />
        <div className="seg" role="radiogroup" aria-label="比较模式">
          <button className={p.view.mode === 'absolute' ? 'on' : ''} disabled={ctx.mixedUnits} title={ctx.mixedUnits ? '单位不一致，请使用相对变化' : ''} onClick={() => p.setView({ ...p.view, mode: 'absolute' })}>绝对值</button>
          <button className={p.view.mode === 'relative' ? 'on' : ''} onClick={() => p.setView({ ...p.view, mode: 'relative' })}>相对变化</button>
        </div>
        <span className="muted">已选 {targets.length} / {p.resolved.length}</span>
        <button onClick={p.onClear} disabled={targets.length === 0}>清空</button>
      </div>
      {p.toast !== null && <p className="viz-toast" role="status">{p.toast}</p>}
      <VizHost def={p.definition} snap={p.snap} view={p.view} targets={targets} ctx={ctx} lockTime={p.lockTime} onLock={p.onLock} onToggleSelect={p.onToggleSelect} setView={p.setView} />
    </section>
  );
}
