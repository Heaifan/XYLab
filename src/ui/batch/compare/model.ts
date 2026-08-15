// BATCH-3 · Sweep Group 投影：复用正式 Scenario/Result，不建立第二套结果真值。
import type { BatchValue } from '../../../protocol/batch/types';
import type { ExperimentDefinition } from '../../../protocol/types';
import { dimensionValues } from '../generator/expand';
import { scenarioInputs, type BatchResult, type BatchScenario } from '../types';
export interface SweepRow {
  value: BatchValue;
  scenarios: BatchScenario[];
  results: BatchResult[];
}
export interface SweepGroup {
  variable: string;
  label: string;
  unit?: string;
  rows: SweepRow[];
}
function matches(definition: ExperimentDefinition, scenario: BatchScenario, variable: string, value: BatchValue): boolean {
  const inputs = scenarioInputs(definition, scenario), dimensions = definition.batch?.dimensions ?? [];
  return dimensions.every((dim) => Object.is(inputs[dim.variable], dim.variable === variable ? value : definition.variables[dim.variable].value));
}
export function buildSweepGroups(definition: ExperimentDefinition, scenarios: BatchScenario[], results: BatchResult[]): SweepGroup[] {
  if (!definition.batch || definition.batch.mode !== 'sweep') return [];
  return definition.batch.dimensions.map((dimension) => {
    const variable = definition.variables[dimension.variable];
    const rows = dimensionValues(dimension).map((value) => {
      const matched = scenarios.filter((scenario) => matches(definition, scenario, dimension.variable, value));
      const ids = new Set(matched.map((scenario) => scenario.id));
      return { value, scenarios: matched, results: results.filter((result) => ids.has(result.scenarioId)) };
    });
    return { variable: dimension.variable, label: `${variable?.label ?? dimension.variable}影响`, unit: variable?.unit, rows };
  });
}
export function resultMean(results: BatchResult[], target: string): number | null {
  const values = results.map((result) => result.values[target]).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}
