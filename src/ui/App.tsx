// R4-F1 · App：单一 Controller 权威持有 + 状态投影装配。
// React 只投影：加载/重建 → 新 Controller；控制全部经 Controller API；参数修改走草稿→重建边界。
import { useCallback, useState } from 'react';
import { createController } from '../runtime/controller/controller';
import type { Controller } from '../runtime/controller/controller';
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

export function App() {
  const breakpoint = useBreakpoint();
  const [definition, setDefinition] = useState<ExperimentDefinition | null>(null);
  const [controller, setController] = useState<Controller | null>(null);
  const [overrides, setOverrides] = useState<DraftOverrides>({});
  const [collapsed, setCollapsed] = useState(false);
  const [, setTick] = useState(0);
  const [section, setSection] = useState<'params' | 'values' | 'log'>('values');
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const snap = useMonitor(controller);

  function load(next: ExperimentDefinition) {
    setDefinition(next);
    setController(createController(next));
    setOverrides({});
    setSection('values');
    refresh();
  }

  function applyParams() {
    if (!definition || !controller) return;
    const next = withInitialValues(definition, overrides);
    setDefinition(next);
    setController(createController(next));
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
          definition && controller ? (
            <VariablesPanel definition={definition} controller={controller} overrides={overrides} onOverride={(n, v) => setOverrides({ ...overrides, [n]: v })} onApply={applyParams} />
          ) : (
            <section className="panel">
              <h2>参数</h2>
              <p className="muted">加载实验后显示。</p>
            </section>
          )
        }
        run={<RunPanel controller={controller} snap={snap} breakpoint={breakpoint} refresh={refresh} />}
        values={<ValuesPanel snap={snap} />}
        log={<EventLog log={snap.log} />}
      />
    </div>
  );
}
