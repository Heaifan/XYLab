// BATCH-2 · Loader 通过后可直接消费的 JSON 驱动方案合同。
export const MAX_BATCH_SCENARIOS = 1000;
export type BatchValue = number | boolean | string;
export interface BatchRangeDefinition { start: number; end: number; step: number; }
export interface BatchDimensionDefinition {
  variable: string;
  values?: BatchValue[];
  range?: BatchRangeDefinition;
}
export interface BatchDefinition {
  dimensions: BatchDimensionDefinition[];
  tickLimit?: number;
}
