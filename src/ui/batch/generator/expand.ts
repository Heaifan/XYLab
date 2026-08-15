// BATCH-2/MSV-1 · dimensions × seeds → 确定性笛卡尔积方案；不执行模拟。
import type { BatchDimensionDefinition, BatchRangeDefinition, BatchValue } from '../../../protocol/batch/types';
import type { ExperimentDefinition } from '../../../protocol/types';
import type { BatchScenario } from '../types';
function rangeValues(range: BatchRangeDefinition): number[] {
  const out: number[] = [], count = Math.floor((range.end - range.start) / range.step + 1e-9) + 1;
  for (let i = 0; i < count; i += 1) out.push(range.start + range.step * i);
  return out;
}
function dimensionValues(dimension: BatchDimensionDefinition): BatchValue[] {
  return dimension.values ? [...dimension.values] : rangeValues(dimension.range!);
}
function scenarioName(definition: ExperimentDefinition, overrides: Record<string, BatchValue>, seed?: number): string {
  const parts = Object.entries(overrides).map(([key, value]) => {
    const variable = definition.variables[key];
    return `${variable?.label ?? key}=${String(value)}${variable?.unit ?? ''}`;
  });
  if (seed !== undefined) parts.push(`Seed=${seed}`);
  return parts.join(' · ');
}
export function expandBatchScenarios(definition: ExperimentDefinition): BatchScenario[] {
  if (!definition.batch) return [];
  let rows: Array<Record<string, BatchValue>> = [{}];
  for (const dimension of definition.batch.dimensions) {
    const values = dimensionValues(dimension), next: Array<Record<string, BatchValue>> = [];
    for (const row of rows) for (const value of values) next.push({ ...row, [dimension.variable]: value });
    rows = next;
  }
  const seeds = definition.batch.seeds ? rangeValues(definition.batch.seeds) : [undefined];
  const scenarios: BatchScenario[] = [];
  for (const row of rows) for (const seed of seeds) scenarios.push({
    id: `json-${scenarios.length + 1}`, name: scenarioName(definition, row, seed), overrides: row, seed,
  });
  return scenarios;
}
