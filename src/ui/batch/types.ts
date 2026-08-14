// Batch Experiment V1 · 方案覆盖与结果合同。只调度现有 Runtime，不复制模拟语义。
import type { ExperimentDefinition } from '../../protocol/types';
import type { RuntimeStatus, RuntimeValue } from '../../runtime/types';

export interface BatchScenario {
  id: string;
  name: string;
  overrides: Record<string, RuntimeValue>;
}

export interface BatchResult {
  scenarioId: string;
  name: string;
  status: RuntimeStatus;
  values: Record<string, RuntimeValue | null>;
  error?: string;
}

export function scenarioTargets(definition: ExperimentDefinition): string[] {
  const summary = definition.output?.summary ?? [];
  return summary.length > 0 ? summary : definition.watch.map((w) => w.target);
}

export function coerceVariableValue(definition: ExperimentDefinition, name: string, raw: string): RuntimeValue {
  const def = definition.variables[name];
  if (!def) return raw;
  if (def.type === 'boolean') return raw === 'true';
  if (def.type === 'number' || def.type === 'integer') {
    const n = Number(raw);
    return def.type === 'integer' ? Math.trunc(n) : n;
  }
  return raw;
}
