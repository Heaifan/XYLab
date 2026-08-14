// UA1 · App：MonitoredRuntime 句柄 + VisualizationSelectionState 权威持有 + 移动优先四页签装配。
// 选择是 UI 工作状态：仅 Load（新实验）重置并按 output.charts 初始化；Apply 重建 Runtime 不清选择；Reset 仅清时间锁。
import { useCallback, useRef, useState } from 'react';
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
import { loadRuns, safeStorage } from './history/runStore';
import type { SavedRun } from './history/types';
import { BatchPanel } from './batch/BatchPanel';
import { VIEW_INIT, initSelection, selectToggle, viewClearSelect, viewFocus, viewToggleHide, viewTogglePin, type ViewState } from './viewState';

export function App() {
  const breakpoint = useBreakpoint();
  const [definition, setDefinition] = useState<ExperimentDefinition | null>(null);
  const [runtime, setRuntime] = useState<MonitoredRuntime | null>(null);
  const [overrides, setOverrides] = useState<DraftOverrides>({});
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<LabTab>('monitor');
  const [lockTime, setLockTime] = useState<number | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [runs, setRuns] = useState<SavedRun[]>(() => loadRuns(safeStorage()));
  const [view, setView] = useState<ViewState>(VIEW_INIT);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef(0);
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const bridge = useMonitor(runtime);
  const resolved = resolveChartTargets(definition, bridge.snap);

  function rebuild(next: ExperimentDefinition) {
    setDefinition(next);
    setRuntime(createMonitoredRuntime(next)); // Load/Apply = 全新重建（监控历史同时重新开始）
    setOverrides({});
    setLockTime(null);
    refresh();
  }

  function notify(msg: string) {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  const toggleSelect = (t: string) => {
    const r = selectToggle(view, definition, t);
    setView(r.view);
    if (r.toast !== null) notify(r.toast);
  };
  const handle = runtime
    ? { controller: runtime.controller, session: runtime.session, reset: () => { runtime.reset(); setLockTime(null); refresh(); } }
    : null;
  return (
    <div className="app">
      <TopBar definition={definition} status={runtime ? bridge.status : null} time={bridge.time} />
      <Layout
        breakpoint={breakpoint} tab={tab} onTab={setTab} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)}
        experiment={<ExperimentPanel onLoaded={(next) => { rebuild(next); setView({ ...VIEW_INIT, selected: initSelection(next) }); setTab('monitor'); }} definition={definition} />}
        variables={
          definition && handle ? (
            <VariablesPanel definition={definition} controller={handle.controller} overrides={overrides} onOverride={(n, v) => setOverrides({ ...overrides, [n]: v })} onApply={() => rebuild(withInitialValues(definition, overrides))} />
          ) : (
            <section className="panel"><h2>参数</h2><p className="muted">加载实验后显示。</p></section>
          )
        }
        actions={<ExperimentActions definition={definition} onSave={() => setSaveOpen(true)} />}
        run={<><RunPanel runtime={handle} bridge={bridge} breakpoint={breakpoint} refresh={refresh} /><BatchPanel definition={definition} /></>}
        viz={<VisualizationPanel definition={definition} snap={bridge.snap} lockTime={lockTime} onLock={setLockTime} view={view} setView={setView} resolved={resolved} breakpoint={breakpoint} toast={toast} onToggleSelect={toggleSelect} onClear={() => setView(viewClearSelect(view))} />}
        inspector={<InspectorSheet snap={bridge.snap} definition={definition} lockTime={lockTime} onUnlock={() => setLockTime(null)} variant={breakpoint === 'compact' ? 'sheet' : 'panel'} selected={view.selected} onToggleSelect={toggleSelect} />}
        values={
          <ValuesPanel def={definition} snap={bridge.snap} lockTime={lockTime} view={view} resolved={resolved} onToggleSelect={toggleSelect} onSolo={(t) => setView(viewFocus(view, t))}
            onTogglePin={(t) => setView(viewTogglePin(view, t, resolved))} onToggleHide={(t) => setView(viewToggleHide(view, t))} onClear={() => setView(viewClearSelect(view))} />
        }
        log={<EventLog snap={bridge.snap} />}
        history={<RunHistory runs={runs} />}
      />
      <SaveRunSheet open={saveOpen} definition={definition} snap={bridge.snap} runtimeStatus={bridge.status} time={bridge.time} tickIndex={bridge.tickIndex}
        onClose={() => setSaveOpen(false)} onSaved={() => setRuns(loadRuns(safeStorage()))} />
    </div>
  );
}
