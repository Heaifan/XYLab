// FE-A-R2 · App：MonitoredRuntime 句柄权威持有 + 移动优先四页签工作台（实验/监控/日志/历史）装配。
// Load/Apply → createMonitoredRuntime 全新重建；Reset = handle.reset() 联合重置并清时间锁；
// 数据合同仍只有 MonitorSnapshot；页签/锁定/保存均为纯 UI 编排，不产生第二套状态。
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
import { VisualizationPanel } from './visualization/VisualizationPanel';
import { InspectorSheet } from './visualization/InspectorSheet';
import { SaveRunSheet } from './history/SaveRunSheet';
import { RunHistory } from './history/RunHistory';
import { loadRuns } from './history/runStore';
import type { SavedRun } from './history/types';

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
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const bridge = useMonitor(runtime);

  function load(next: ExperimentDefinition) {
    setDefinition(next);
    setRuntime(createMonitoredRuntime(next));
    setOverrides({});
    setLockTime(null);
    setTab('monitor');
    refresh();
  }

  function applyParams() {
    if (!definition || !runtime) return;
    const next = withInitialValues(definition, overrides);
    setDefinition(next);
    setRuntime(createMonitoredRuntime(next)); // 参数 Apply = 实验重新初始化（监控历史同时重新开始）
    setOverrides({});
    setLockTime(null);
    refresh();
  }

  const handle = runtime ? { controller: runtime.controller, session: runtime.session, reset: () => { runtime.reset(); setLockTime(null); refresh(); } } : null;

  return (
    <div className="app">
      <TopBar definition={definition} status={runtime ? bridge.status : null} time={bridge.time} />
      <Layout
        breakpoint={breakpoint}
        tab={tab}
        onTab={setTab}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        experiment={<ExperimentPanel onLoaded={load} definition={definition} />}
        variables={
          definition && handle ? (
            <VariablesPanel definition={definition} controller={handle.controller} overrides={overrides} onOverride={(n, v) => setOverrides({ ...overrides, [n]: v })} onApply={applyParams} />
          ) : (
            <section className="panel"><h2>参数</h2><p className="muted">加载实验后显示。</p></section>
          )
        }
        actions={<ExperimentActions definition={definition} onSave={() => setSaveOpen(true)} />}
        run={<RunPanel runtime={handle} bridge={bridge} breakpoint={breakpoint} refresh={refresh} />}
        viz={<VisualizationPanel definition={definition} snap={bridge.snap} lockTime={lockTime} onLock={setLockTime} />}
        inspector={
          <InspectorSheet snap={bridge.snap} definition={definition} lockTime={lockTime} onUnlock={() => setLockTime(null)} variant={breakpoint === 'compact' ? 'sheet' : 'panel'} />
        }
        values={<ValuesPanel snap={bridge.snap} />}
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
