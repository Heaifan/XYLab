// BATCH-3/MSV-1 · Matrix 笛卡尔积 / Sweep 单因素去重展开；不执行模拟。
import type { BatchDimensionDefinition, BatchRangeDefinition, BatchValue } from '../../../protocol/batch/types';
import type { ExperimentDefinition } from '../../../protocol/types';
import type { BatchScenario } from '../types';
function rangeValues(range: BatchRangeDefinition): number[] {
  const count = Math.floor((range.end - range.start) / range.step + 1e-9) + 1;
  return Array.from({ length: count }, (_, i) => range.start + range.step * i);
}
export function dimensionValues(dimension: BatchDimensionDefinition): BatchValue[] {
  return dimension.values ? [...dimension.values] : rangeValues(dimension.range!);
}
function matrixRows(definition: ExperimentDefinition): Array<Record<string, BatchValue>> {
  let rows: Array<Record<string, BatchValue>> = [{}];
  for (const dimension of definition.batch!.dimensions) {
    const next: Array<Record<string, BatchValue>> = [];
    for (const row of rows) for (const value of dimensionValues(dimension)) next.push({ ...row, [dimension.variable]: value });
    rows = next;
  }
  return rows;
}
function sweepRows(definition: ExperimentDefinition): Array<Record<string, BatchValue>> {
  const dimensions = definition.batch!.dimensions, rows: Array<Record<string, BatchValue>> = [], seen = new Set<string>();
  for (const dimension of dimensions) for (const value of dimensionValues(dimension)) {
    const row = { [dimension.variable]: value } as Record<string, BatchValue>;
    const key = JSON.stringify(dimensions.map((d) => row[d.variable] ?? definition.variables[d.variable].value));
    if (!seen.has(key)) { seen.add(key); rows.push(row); }
  }
  return rows;
}
function matrixName(definition: ExperimentDefinition, overrides: Record<string, BatchValue>): string {
  return Object.entries(overrides).map(([key, value]) => {
    const variable = definition.variables[key]; return `${variable?.label ?? key}=${String(value)}${variable?.unit ?? ''}`;
  }).join(' · ');
}
function sweepName(definition: ExperimentDefinition, overrides: Record<string, BatchValue>): string {
  const changed = Object.entries(overrides).find(([key, value]) => !Object.is(definition.variables[key]?.value, value));
  if (!changed) return '基准方案';
  const [key, value] = changed, variable = definition.variables[key];
  return `${variable?.label ?? key}影响 · ${String(value)}${variable?.unit ?? ''}`;
}
export function expandBatchScenarios(definition: ExperimentDefinition): BatchScenario[] {
  if (!definition.batch) return [];
  const sweep = definition.batch.mode === 'sweep';
  const rows = sweep ? sweepRows(definition) : matrixRows(definition);
  const seeds = definition.batch.seeds ? rangeValues(definition.batch.seeds) : [undefined];
  const scenarios: BatchScenario[] = [];
  for (const row of rows) for (const seed of seeds) {
    const baseName = sweep ? sweepName(definition, row) : matrixName(definition, row);
    scenarios.push({ id: `json-${scenarios.length + 1}`, name: seed === undefined ? baseName : `${baseName} · Seed=${seed}`, overrides: row, seed });
  }
  return scenarios;
}
