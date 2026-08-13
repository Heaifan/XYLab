// F2 · Visualization 容器：Pinned Cards + Focus/Compare 曲线（XYUI-8 VisualizationContainer 组合）。
// Series 解析规则不变：output.charts 声明优先（x 必须 = time）；无声明 → fallback Watch 前 2~4 个 Numeric Series。
// Focus 默认（selected 空 → 首个解析目标）；Compare = selected ≥2；绝对值只许同单位，异单位提示改用相对变化。
import type { ExperimentDefinition } from '../../protocol/types';
import type { MonitorSnapshot } from '../../monitor/types';
import { effectivePinned, focusTargets, sameUnitGroup, type ViewState } from '../viewState';
import { MetricStrip } from './MetricStrip';
import { LineChart } from './LineChart';

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
}

export function VisualizationPanel({ definition, snap, lockTime, onLock, view, setView, resolved }: Props) {
  if (!snap) {
    return (
      <section className="panel">
        <h2>可视化</h2>
        <p className="muted">加载实验后显示。</p>
      </section>
    );
  }
  const pinned = effectivePinned(view, resolved);
  const focus = focusTargets(view, resolved);
  const group = focus.length > 1 && view.mode === 'absolute' ? sameUnitGroup(definition, focus) : { shown: focus, excluded: [] };
  const emphasis = view.selected.length > 0 && group.shown.includes(view.selected[view.selected.length - 1]) ? view.selected[view.selected.length - 1] : group.shown[0] ?? null;
  const focusOne = (t: string) => setView({ ...view, selected: [t] });
  return (
    <section className="panel viz-panel">
      <MetricStrip def={definition} snap={snap} lockTime={lockTime} pinned={pinned} onFocus={focusOne} />
      <div className="viz-toolbar">
        <div className="seg" role="radiogroup" aria-label="比较模式">
          <button className={view.mode === 'absolute' ? 'on' : ''} onClick={() => setView({ ...view, mode: 'absolute' })}>绝对值</button>
          <button className={view.mode === 'relative' ? 'on' : ''} onClick={() => setView({ ...view, mode: 'relative' })}>相对变化</button>
        </div>
        {focus.length > 1 ? <span className="muted">对比 {group.shown.length} 项</span> : <span className="muted">聚焦</span>}
      </div>
      {group.excluded.length > 0 && <p className="muted hint">单位不同：{group.excluded.join(', ')}——建议改用「相对变化」</p>}
      {group.shown.length > 0 ? (
        <LineChart series={snap.series} targets={group.shown} mode={view.mode} watches={snap.watches} events={snap.logs} emphasis={emphasis} lockTime={lockTime} onLock={onLock} onFocus={focusOne} />
      ) : (
        <p className="muted">无可绘制的数值 Series。</p>
      )}
    </section>
  );
}
