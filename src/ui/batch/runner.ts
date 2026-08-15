// Batch Runner · 每方案新建 MonitoredRuntime；MSV-1 允许场景覆盖 random.seed。
import { createMonitoredRuntime } from '../../monitor/session';
import type { ExperimentDefinition } from '../../protocol/types';
import type { RuntimeState, RuntimeValue } from '../../runtime/types';
import { withInitialValues } from '../experiment/draft';
import type { BatchResult, BatchScenario } from './types';
import { scenarioTargets } from './types';
function readTarget(state: RuntimeState, target: string): RuntimeValue | null {
  if (target in state.variables) return state.variables[target];
  const dot = target.indexOf('.'); if (dot < 1) return null;
  const entity = state.entities[target.slice(0, dot)], key = target.slice(dot + 1);
  return entity && key in entity.state ? entity.state[key] : null;
}
function scenarioDefinition(definition: ExperimentDefinition, scenario: BatchScenario): ExperimentDefinition {
  const next = withInitialValues(definition, scenario.overrides);
  return scenario.seed === undefined ? next : { ...next, random: { seed: scenario.seed } };
}
export async function runBatchScenario(
  definition: ExperimentDefinition, scenario: BatchScenario, tickLimit: number,
): Promise<BatchResult> {
  const runtime = createMonitoredRuntime(scenarioDefinition(definition, scenario));
  runtime.controller.setTickLimit(tickLimit);
  const started = runtime.controller.run('max');
  if (!started.ok) return {
    scenarioId: scenario.id, name: scenario.name, status: started.status, values: {},
    snapshot: runtime.session.snapshot(), error: started.message,
  };
  await started.done;
  const values: Record<string, RuntimeValue | null> = {};
  for (const target of scenarioTargets(definition)) values[target] = readTarget(runtime.controller.state, target);
  const failure = runtime.controller.state.lastError;
  return {
    scenarioId: scenario.id, name: scenario.name, status: runtime.controller.status, values,
    snapshot: runtime.session.snapshot(), error: failure?.message,
  };
}
export async function runBatch(
  definition: ExperimentDefinition, scenarios: BatchScenario[], tickLimit: number,
  onResult?: (result: BatchResult, index: number) => void,
): Promise<BatchResult[]> {
  const out: BatchResult[] = [];
  for (let i = 0; i < scenarios.length; i += 1) {
    const result = await runBatchScenario(definition, scenarios[i], tickLimit);
    out.push(result); onResult?.(result, i);
  }
  return out;
}
