// BATCH-2 · 已校验 batch 外部结构 → Runtime 可信结构；保持输入不可变。
import type { BatchDefinition, BatchDimensionDefinition, BatchValue } from './types';
type RawBatch = {
  dimensions?: Array<{ variable?: unknown; values?: unknown[]; range?: { start?: unknown; end?: unknown; step?: unknown } }>;
  tick_limit?: unknown;
};
export function normalizeBatch(raw: unknown): BatchDefinition | undefined {
  if (raw === undefined) return undefined;
  const source = raw as RawBatch;
  const dimensions: BatchDimensionDefinition[] = (source.dimensions ?? []).map((item) => {
    const next: BatchDimensionDefinition = { variable: item.variable as string };
    if (item.values) next.values = [...item.values] as BatchValue[];
    if (item.range) next.range = {
      start: item.range.start as number, end: item.range.end as number, step: item.range.step as number,
    };
    return next;
  });
  const batch: BatchDefinition = { dimensions };
  if (source.tick_limit !== undefined) batch.tickLimit = source.tick_limit as number;
  return batch;
}
