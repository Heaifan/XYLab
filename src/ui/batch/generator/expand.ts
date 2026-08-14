// BATCH-2 · 已校验 BatchDefinition → 确定性笛卡尔积方案；不修改 Definition。
import type { BatchDimensionDefinition, BatchValue } from '../../../protocol/batch/types';
import type { ExperimentDefinition } from '../../../protocol/types';
import type { BatchScenario } from '../types';
function dimensionValues(dimension: BatchDimensionDefinition): BatchValue[] {
  if (dimension.values) return [...dimension.values];
  const range = dimension.range!; const out: number[] = [];
  const count = Math.floor((range.end - range.start) / range.step + 1e-9) + 1;
  for (let i = 0; i < count; i += 1) out.push(range.start + range.step * i);
  return out;
}
function scenarioName(definition: ExperimentDefinition, overrides: Record<string, BatchValue>): string {
  return Object.entries(overrides).map(([key, value]) => {
    const variable = definition.variables[key];
    return `${variable?.label ?? key}=${String(value)}${variable?.unit ?? ''}`;
  }).join(' · ');
}
export function expandBatchScenarios(definition: ExperimentDefinition): BatchScenario[] {
  if (!definition.batch) return [];
  let rows: Array<Record<string, BatchValue>> = [{}];
  for (const dimension of definition.batch.dimensions) {
    const values = dimensionValues(dimension), next: Array<Record<string, BatchValue>> = [];
    for (const row of rows) for (const value of values) next.push({ ...row, [dimension.variable]: value });
    rows = next;
  }
  return rows.map((overrides, index) => ({
    id: `json-${index + 1}`, name: scenarioName(definition, overrides), overrides,
  }));
}
