// UI-F1 · App：单一 Controller 权威持有 + 状态投影装配。
// React 只做投影：加载→定义→Controller；控制与参数编辑全部落在既有 Runtime 合同上，模拟核心零改动。
import { useCallback, useState } from 'react';
import { createController } from '../runtime/controller/controller';
import type { Controller } from '../runtime/controller/controller';
import type { ExperimentDefinition } from '../protocol/types';
import { useBreakpoint } from './shell/useBreakpoint';
import { TopBar } from './shell/TopBar';
import { Layout } from './shell/Layout';
import { ExperimentPanel } from './experiment/ExperimentPanel';
import { VariablesPanel } from './experiment/VariablesPanel';
import { MonitorPanel } from './monitor/MonitorPanel';
import { EventLog } from './monitor/EventLog';
import { useMonitor } from './monitor/useMonitor';

export function App() {
  const breakpoint = useBreakpoint();
  const [definition, setDefinition] = useState<ExperimentDefinition | null>(null);
  const [controller, setController] = useState<Controller | null>(null);
  const [, setTick] = useState(0);
  const [section, setSection] = useState<'params' | 'monitor' | 'log'>('monitor');
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const snap = useMonitor(controller);

  function load(next: ExperimentDefinition) {
    setDefinition(next);
    setController(createController(next));
    setSection('monitor');
    refresh();
  }

  return (
    <div className="app">
      <TopBar controller={controller} refresh={refresh} />
      <Layout
        breakpoint={breakpoint}
        section={section}
        onSection={setSection}
        experiment={<ExperimentPanel onLoaded={load} />}
        variables={definition && controller ? <VariablesPanel definition={definition} controller={controller} forceRefresh={refresh} /> : <section className="panel"><h2>参数</h2><p className="muted">加载实验后显示。</p></section>}
        monitor={<MonitorPanel snap={snap} />}
        log={<EventLog log={snap.log} />}
      />
    </div>
  );
}
