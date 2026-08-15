// BATCH-3/MSV-1 · 已校验 batch 外部结构 → Runtime 可信结构；保持输入不可变。
import type { BatchDefinition, BatchDimensionDefinition, BatchValue } from './types';
type RawRange = { start?: unknown; end?: unknown; step?: unknown };
type RawBatch = {
  mode?: unknown;
  dimensions?: Array<{ variable?: unknown; values?: unknown[]; range?: RawRange }>;
  tick_limit?: unknown; seeds?: RawRange;
};
function range(raw: RawRange): { start: number; end: number; step: number } {
  return { start: raw.start as number, end: raw.end as number, step: raw.step as number };
}
export function normalizeBatch(raw: unknown): BatchDefinition | undefined {
  if (raw === undefined) return undefined;
  const source = raw as RawBatch;
  const dimensions: BatchDimensionDefinition[] = (source.dimensions ?? []).map((item) => {
    const next: BatchDimensionDefinition = { variable: item.variable as string };
    if (item.values) next.values = [...item.values] as BatchValue[];
    if (item.range) next.range = range(item.range);
    return next;
  });
  const batch: BatchDefinition = { dimensions, mode: source.mode === 'sweep' ? 'sweep' : 'matrix' };
  if (source.tick_limit !== undefined) batch.tickLimit = source.tick_limit as number;
  if (source.seeds) batch.seeds = range(source.seeds);
  return batch;
}
