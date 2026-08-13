// FE-A-R1 · App：单一 Monitored Runtime Handle（Controller + MonitorSession 同生命周期）+ 状态投影装配。
// Load/Apply → createMonitoredRuntime 全新重建（旧 Controller 与旧 Session 一起退出，监控历史不带入新实验）；
// 控制全部经 Controller API；Reset 走 handle.reset()（Runtime + Session 联合重置）；参数修改走草稿→重建边界。
import { useCallback, useState } from 'react';
import { createMonitoredRuntime } from '../monitor/session';
import type { ExperimentDefinition } from '../protocol/types';
import { useBreakpoint } from './shell/useBreakpoint';
import { TopBar } from './shell/TopBar';
import { Layout } from './shell/Layout';
import { ExperimentPanel } from './experiment/ExperimentPanel';
import { VariablesPanel } from './experiment/VariablesPanel';
import { withInitialValues } from './experiment/draft';
import type { DraftOverrides } from './experiment/draft';
import { RunPanel } from './monitor/RunPanel';
import { ValuesPanel } from './monitor/ValuesPanel';
import { EventLog } from './monitor/EventLog';
import { useMonitor } from './monitor/useMonitor';
import type { MonitoredRuntime } from './monitor/useMonitor';

export function App() {
  const breakpoint = useBreakpoint();
  const [definition, setDefinition] = useState<ExperimentDefinition | null>(null);
  const [runtime, setRuntime] = useState<MonitoredRuntime | null>(null);
  const [overrides, setOverrides] = useState<DraftOverrides>({});
  const [collapsed, setCollapsed] = useState(false);
  const [, setTick] = useState(0);
  const [section, setSection] = useState<'params' | 'values' | 'log'>('values');
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const bridge = useMonitor(runtime);

  function load(next: ExperimentDefinition) {
    setDefinition(next);
    setRuntime(createMonitoredRuntime(next));
    setOverrides({});
    setSection('values');
    refresh();
  }

  function applyParams() {
    if (!definition || !runtime) return;
    const next = withInitialValues(definition, overrides);
    setDefinition(next);
    setRuntime(createMonitoredRuntime(next)); // 参数 Apply = 实验重新初始化（监控历史同时重新开始）
    setOverrides({});
    refresh();
  }

  return (
    <div className="app">
      <TopBar definition={definition} />
      <Layout
        breakpoint={breakpoint}
        section={section}
        onSection={setSection}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        experiment={<ExperimentPanel onLoaded={load} definition={definition} />}
        variables={
          definition && runtime ? (
            <VariablesPanel definition={definition} controller={runtime.controller} overrides={overrides} onOverride={(n, v) => setOverrides({ ...overrides, [n]: v })} onApply={applyParams} />
          ) : (
            <section className="panel">
              <h2>参数</h2>
              <p className="muted">加载实验后显示。</p>
            </section>
          )
        }
        run={<RunPanel runtime={runtime} bridge={bridge} breakpoint={breakpoint} refresh={refresh} />}
        values={<ValuesPanel snap={bridge.snap} />}
        log={<EventLog snap={bridge.snap} />}
      />
    </div>
  );
}
