// Batch Experiment V1 · 隔离运行器：每方案新建 MonitoredRuntime，以 MAX 顺序执行。
import { createMonitoredRuntime } from '../../monitor/session';
import type { ExperimentDefinition } from '../../protocol/types';
import type { RuntimeState, RuntimeValue } from '../../runtime/types';
import { withInitialValues } from '../experiment/draft';
import type { BatchResult, BatchScenario } from './types';
import { scenarioTargets } from './types';

function readTarget(state: RuntimeState, target: string): RuntimeValue | null {
  if (target in state.variables) return state.variables[target];
  const dot = target.indexOf('.');
  if (dot < 1) return null;
  const entity = state.entities[target.slice(0, dot)];
  const key = target.slice(dot + 1);
  return entity && key in entity.state ? entity.state[key] : null;
}

export async function runBatchScenario(
  definition: ExperimentDefinition,
  scenario: BatchScenario,
  tickLimit: number,
): Promise<BatchResult> {
  const next = withInitialValues(definition, scenario.overrides);
  const runtime = createMonitoredRuntime(next);
  runtime.controller.setTickLimit(tickLimit);
  const started = runtime.controller.run('max');
  if (!started.ok) {
    return {
      scenarioId: scenario.id, name: scenario.name, status: started.status, values: {},
      snapshot: runtime.session.snapshot(), error: started.message,
    };
  }
  await started.done;
  const values: Record<string, RuntimeValue | null> = {};
  for (const target of scenarioTargets(next)) values[target] = readTarget(runtime.controller.state, target);
  const failure = runtime.controller.state.lastError;
  return {
    scenarioId: scenario.id, name: scenario.name, status: runtime.controller.status, values,
    snapshot: runtime.session.snapshot(), error: failure?.message,
  };
}

export async function runBatch(
  definition: ExperimentDefinition,
  scenarios: BatchScenario[],
  tickLimit: number,
  onResult?: (result: BatchResult, index: number) => void,
): Promise<BatchResult[]> {
  const out: BatchResult[] = [];
  for (let i = 0; i < scenarios.length; i += 1) {
    const result = await runBatchScenario(definition, scenarios[i], tickLimit);
    out.push(result);
    onResult?.(result, i);
  }
  return out;
}
