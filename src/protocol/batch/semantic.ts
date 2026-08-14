// BATCH-2 · Batch 引用、值域、重复维度与方案数量语义校验。
import type { LoadError } from '../loader-types';
import type { RawExperiment, RawVariable } from '../raw-types';
import { MAX_BATCH_SCENARIOS } from './types';
type RawDimension = { variable: string; values?: unknown[]; range?: { start: number; end: number; step: number } };
function valueOk(def: RawVariable, value: unknown): boolean {
  if (def.type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (def.type === 'integer') return typeof value === 'number' && Number.isInteger(value);
  if (def.type === 'boolean') return typeof value === 'boolean';
  if (def.type === 'string') return typeof value === 'string';
  if (def.type === 'enum') return (def.options ?? []).includes(value);
  return false;
}
function rangeCount(range: NonNullable<RawDimension['range']>): number {
  if (!(range.step > 0) || range.end < range.start) return 0;
  return Math.floor((range.end - range.start) / range.step + 1e-9) + 1;
}
export function checkBatch(raw: RawExperiment, errors: LoadError[]): void {
  if (!raw.batch) return;
  const dimensions = raw.batch.dimensions as RawDimension[];
  const seen = new Set<string>(); let total = 1;
  dimensions.forEach((dim, i) => {
    const base = `/batch/dimensions/${i}`, variable = dim.variable, def = raw.variables?.[variable];
    if (seen.has(variable)) errors.push({ code: 'BATCH_VARIABLE_DUPLICATE', path: `${base}/variable`, message: `Batch 变量重复：${variable}` });
    seen.add(variable);
    if (!def) { errors.push({ code: 'BATCH_VARIABLE_NOT_FOUND', path: `${base}/variable`, message: `Batch 变量不存在：${variable}` }); return; }
    if (dim.values) {
      if (dim.values.some((value) => !valueOk(def, value))) errors.push({ code: 'BATCH_VALUE_INVALID', path: `${base}/values`, message: `Batch values 与变量 ${variable} 类型或枚举域不匹配` });
      total *= dim.values.length;
      return;
    }
    const range = dim.range!; const numeric = def.type === 'number' || def.type === 'integer'; const count = rangeCount(range);
    const integerRange = def.type !== 'integer' || [range.start, range.end, range.step].every(Number.isInteger);
    if (!numeric || count < 1 || !integerRange) errors.push({ code: 'BATCH_RANGE_INVALID', path: `${base}/range`, message: `Batch range 仅支持合法递增 number/integer 范围` });
    else total *= count;
  });
  if (total > MAX_BATCH_SCENARIOS) errors.push({ code: 'BATCH_SCENARIO_LIMIT_EXCEEDED', path: '/batch/dimensions', message: `Batch 将生成 ${total} 个方案，超过上限 ${MAX_BATCH_SCENARIOS}` });
}
