// BATCH-3/MSV-1 · Batch 引用、值域、模式、Seed Sweep 与方案数量语义校验。
import type { LoadError } from '../loader-types';
import type { RawExperiment, RawVariable } from '../raw-types';
import { MAX_BATCH_SCENARIOS } from './types';
type RawDimension = { variable: string; values?: unknown[]; range?: { start: number; end: number; step: number } };
type Range = NonNullable<RawDimension['range']>;
function valueOk(def: RawVariable, value: unknown): boolean {
  if (def.type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (def.type === 'integer') return typeof value === 'number' && Number.isInteger(value);
  if (def.type === 'boolean') return typeof value === 'boolean';
  if (def.type === 'string') return typeof value === 'string';
  if (def.type === 'enum') return (def.options ?? []).includes(value);
  return false;
}
function rangeCount(range: Range): number {
  if (![range.start, range.end, range.step].every(Number.isFinite) || !(range.step > 0) || range.end < range.start) return 0;
  return Math.floor((range.end - range.start) / range.step + 1e-9) + 1;
}
function rangeValues(range: Range): number[] {
  const count = rangeCount(range);
  return Array.from({ length: count }, (_, i) => range.start + range.step * i);
}
function sweepCount(raw: RawExperiment, dimensions: RawDimension[]): number {
  const baseline = dimensions.map((dim) => raw.variables?.[dim.variable]?.value);
  const unique = new Set<string>();
  dimensions.forEach((dim, index) => {
    const values = dim.values ?? rangeValues(dim.range!);
    values.forEach((value) => { const vector = [...baseline]; vector[index] = value; unique.add(JSON.stringify(vector)); });
  });
  return unique.size;
}
export function checkBatch(raw: RawExperiment, errors: LoadError[]): void {
  if (!raw.batch) return;
  const dimensions = raw.batch.dimensions as RawDimension[], seen = new Set<string>(), counts: number[] = [];
  dimensions.forEach((dim, i) => {
    const base = `/batch/dimensions/${i}`, variable = dim.variable, def = raw.variables?.[variable];
    if (seen.has(variable)) errors.push({ code: 'BATCH_VARIABLE_DUPLICATE', path: `${base}/variable`, message: `Batch 变量重复：${variable}` });
    seen.add(variable);
    if (!def) { errors.push({ code: 'BATCH_VARIABLE_NOT_FOUND', path: `${base}/variable`, message: `Batch 变量不存在：${variable}` }); counts.push(0); return; }
    if (dim.values) {
      if (dim.values.some((value) => !valueOk(def, value))) errors.push({ code: 'BATCH_VALUE_INVALID', path: `${base}/values`, message: `Batch values 与变量 ${variable} 类型或枚举域不匹配` });
      counts.push(dim.values.length); return;
    }
    const r = dim.range!, numeric = def.type === 'number' || def.type === 'integer', count = rangeCount(r);
    const integerRange = def.type !== 'integer' || [r.start, r.end, r.step].every(Number.isInteger);
    if (!numeric || count < 1 || !integerRange) errors.push({ code: 'BATCH_RANGE_INVALID', path: `${base}/range`, message: `Batch range 仅支持合法递增 number/integer 范围` });
    counts.push(count);
  });
  let total = raw.batch.mode === 'sweep' ? sweepCount(raw, dimensions) : counts.reduce((n, count) => n * count, 1);
  if (raw.batch.seeds) {
    const s = raw.batch.seeds as Range, count = rangeCount(s), integers = [s.start, s.end, s.step].every(Number.isInteger);
    if (count < 1 || !integers) errors.push({ code: 'BATCH_RANGE_INVALID', path: '/batch/seeds', message: 'Batch seeds 必须是合法递增整数范围' });
    else total *= count;
  }
  if (total > MAX_BATCH_SCENARIOS) errors.push({ code: 'BATCH_SCENARIO_LIMIT_EXCEEDED', path: '/batch', message: `Batch 将生成 ${total} 个方案，超过上限 ${MAX_BATCH_SCENARIOS}` });
}
