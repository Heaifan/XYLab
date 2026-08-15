// Batch Experiment · 方案覆盖、Seed、结果快照与可分享 JSON 合同。
import type { MonitorSnapshot } from '../../monitor/types';
import type { ExperimentDefinition } from '../../protocol/types';
import type { RuntimeStatus, RuntimeValue } from '../../runtime/types';
export interface BatchScenario {
  id: string; name: string; overrides: Record<string, RuntimeValue>; seed?: number;
}
export interface BatchResult {
  scenarioId: string; name: string; status: RuntimeStatus; values: Record<string, RuntimeValue | null>;
  snapshot: MonitorSnapshot; error?: string;
}
export function scenarioTargets(definition: ExperimentDefinition): string[] {
  const summary = definition.output?.summary ?? [];
  return summary.length > 0 ? summary : definition.watch.map((w) => w.target);
}
export function coerceVariableValue(definition: ExperimentDefinition, name: string, raw: string): RuntimeValue {
  const def = definition.variables[name]; if (!def) return raw;
  if (def.type === 'boolean') return raw === 'true';
  if (def.type === 'number' || def.type === 'integer') { const n = Number(raw); return def.type === 'integer' ? Math.trunc(n) : n; }
  return raw;
}
export function scenarioInputs(definition: ExperimentDefinition, scenario: BatchScenario): Record<string, RuntimeValue> {
  const out: Record<string, RuntimeValue> = {};
  for (const [name, def] of Object.entries(definition.variables)) out[name] = scenario.overrides[name] ?? def.value;
  return out;
}
function metricMeta(definition: ExperimentDefinition, targets: string[]) {
  return Object.fromEntries(targets.map((target) => {
    const def = definition.variables[target];
    return [target, { label: def?.label ?? target, unit: def?.unit ?? null, type: def?.type ?? null }];
  }));
}
export function batchResultExport(
  definition: ExperimentDefinition, scenarios: BatchScenario[], results: BatchResult[],
  baselineScenarioId: string, tickLimit: number, comparisonTarget: string,
) {
  const targets = scenarioTargets(definition);
  return {
    schemaVersion: 'xylab-batch-result@0.1', generatedAt: new Date().toISOString(),
    experiment: definition.experiment, random: definition.random ?? null,
    batch: { baselineScenarioId, tickLimit, comparisonTarget }, metrics: metricMeta(definition, targets),
    scenarios: results.map((result) => {
      const scenario = scenarios.find((item) => item.id === result.scenarioId);
      return {
        id: result.scenarioId, name: result.name, overrides: scenario?.overrides ?? {}, seed: scenario?.seed ?? definition.random?.seed ?? null,
        inputs: scenario ? scenarioInputs(definition, scenario) : {}, status: result.status,
        error: result.error ?? null, summary: result.values, statistics: result.snapshot.statistics,
      };
    }),
  };
}
export function scenarioResultExport(
  definition: ExperimentDefinition, scenario: BatchScenario, result: BatchResult, tickLimit: number,
) {
  const targets = Object.keys(result.snapshot.series), seed = scenario.seed ?? definition.random?.seed;
  return {
    schemaVersion: 'xylab-scenario-result@0.1', generatedAt: new Date().toISOString(),
    experiment: definition.experiment, random: seed === undefined ? null : { seed },
    scenario: { id: scenario.id, name: scenario.name, overrides: scenario.overrides, seed: scenario.seed ?? null },
    tickLimit, inputs: scenarioInputs(definition, scenario), metrics: metricMeta(definition, targets),
    status: result.status, error: result.error ?? null, summary: result.values,
    statistics: result.snapshot.statistics, series: result.snapshot.series,
    events: result.snapshot.logs.filter((log) => log.kind === 'event' || log.level === 'warning' || log.level === 'critical'),
    session: result.snapshot.session,
  };
}
