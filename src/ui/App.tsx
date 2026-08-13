// F2 · App：MonitoredRuntime 句柄 + ViewState（聚焦/对比/固定/隐藏/模式）权威持有 + 移动优先四页签装配。
// Load/Apply/Reset → 全新重建或联合重置并清视图状态与时间锁；数据合同仍只有 MonitorSnapshot。
import { useCallback, useState } from 'react';
import { createMonitoredRuntime } from '../monitor/session';
import type { ExperimentDefinition } from '../protocol/types';
import { useBreakpoint } from './shell/useBreakpoint';
import { TopBar } from './shell/TopBar';
import { Layout } from './shell/Layout';
import type { LabTab } from './shell/BottomNav';
import { ExperimentPanel } from './experiment/ExperimentPanel';
import { VariablesPanel } from './experiment/VariablesPanel';
import { withInitialValues, type DraftOverrides } from './experiment/draft';
import { RunPanel } from './monitor/RunPanel';
import { ValuesPanel } from './monitor/ValuesPanel';
import { EventLog } from './monitor/EventLog';
import { useMonitor, type MonitoredRuntime } from './monitor/useMonitor';
import { ExperimentActions } from './actions/ExperimentActions';
import { VisualizationPanel, resolveChartTargets } from './visualization/VisualizationPanel';
import { InspectorSheet } from './visualization/InspectorSheet';
import { SaveRunSheet } from './history/SaveRunSheet';
import { RunHistory } from './history/RunHistory';
import { loadRuns } from './history/runStore';
import type { SavedRun } from './history/types';
import { VIEW_INIT, viewFocus, viewToggleCompare, viewToggleHide, viewTogglePin, type ViewState } from './viewState';

export function App() {
  const breakpoint = useBreakpoint();
  const [definition, setDefinition] = useState<ExperimentDefinition | null>(null);
  const [runtime, setRuntime] = useState<MonitoredRuntime | null>(null);
  const [overrides, setOverrides] = useState<DraftOverrides>({});
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<LabTab>('monitor');
  const [lockTime, setLockTime] = useState<number | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [runs, setRuns] = useState<SavedRun[]>(() => loadRuns(window.localStorage));
  const [view, setView] = useState<ViewState>(VIEW_INIT);
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const bridge = useMonitor(runtime);
  const resolved = resolveChartTargets(definition, bridge.snap);

  function rebuild(next: ExperimentDefinition) {
    setDefinition(next);
    setRuntime(createMonitoredRuntime(next)); // Load/Apply = 全新重建（监控历史同时重新开始）
    setOverrides({});
    setLockTime(null);
    setView(VIEW_INIT);
    refresh();
  }

  const handle = runtime
    ? { controller: runtime.controller, session: runtime.session, reset: () => { runtime.reset(); setLockTime(null); setView(VIEW_INIT); refresh(); } }
    : null;

  return (
    <div className="app">
      <TopBar definition={definition} status={runtime ? bridge.status : null} time={bridge.time} />
      <Layout
        breakpoint={breakpoint}
        tab={tab}
        onTab={setTab}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        experiment={<ExperimentPanel onLoaded={(next) => { rebuild(next); setTab('monitor'); }} definition={definition} />}
        variables={
          definition && handle ? (
            <VariablesPanel definition={definition} controller={handle.controller} overrides={overrides} onOverride={(n, v) => setOverrides({ ...overrides, [n]: v })} onApply={() => rebuild(withInitialValues(definition, overrides))} />
          ) : (
            <section className="panel"><h2>参数</h2><p className="muted">加载实验后显示。</p></section>
          )
        }
        actions={<ExperimentActions definition={definition} onSave={() => setSaveOpen(true)} />}
        run={<RunPanel runtime={handle} bridge={bridge} breakpoint={breakpoint} refresh={refresh} />}
        viz={<VisualizationPanel definition={definition} snap={bridge.snap} lockTime={lockTime} onLock={setLockTime} view={view} setView={setView} resolved={resolved} />}
        inspector={<InspectorSheet snap={bridge.snap} definition={definition} lockTime={lockTime} onUnlock={() => setLockTime(null)} variant={breakpoint === 'compact' ? 'sheet' : 'panel'} />}
        values={
          <ValuesPanel def={definition} snap={bridge.snap} lockTime={lockTime} view={view} resolved={resolved} onFocus={(t) => setView(viewFocus(view, t))}
            onToggleCompare={(t) => setView(viewToggleCompare(view, t))} onTogglePin={(t) => setView(viewTogglePin(view, t, resolved))} onToggleHide={(t) => setView(viewToggleHide(view, t))} />
        }
        log={<EventLog snap={bridge.snap} />}
        history={<RunHistory runs={runs} />}
      />
      <SaveRunSheet
        open={saveOpen}
        definition={definition}
        snap={bridge.snap}
        runtimeStatus={bridge.status}
        time={bridge.time}
        tickIndex={bridge.tickIndex}
        onClose={() => setSaveOpen(false)}
        onSaved={() => setRuns(loadRuns(window.localStorage))}
      />
    </div>
  );
}
