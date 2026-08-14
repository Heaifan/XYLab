// XYLab 实验协议 0.1 —— Loader 全部校验后的 Runtime 内部可信类型。
import type { BatchDefinition } from './batch/types';
export const SCHEMA_VERSION = 'xylab-experiment@0.1' as const;
export type VariableType = 'number' | 'integer' | 'boolean' | 'enum' | 'string';
export type WatchMode = 'value' | 'change' | 'threshold';
export type ComparisonOperator = '>=' | '>' | '<=' | '<' | '==' | '!=';
export type EventLevel = 'trace' | 'info' | 'notice' | 'warning' | 'critical';
export interface ExperimentInfo {
  id: string; name: string; description?: string; category?: string; version?: string;
  tags?: string[]; author?: string; createdAt?: string;
}
export interface VariableDefinition {
  name: string; type: VariableType; value: number | boolean | string; label: string;
  unit?: string; min?: number; max?: number; step?: number; options?: unknown[];
}
export interface EntityDefinition { id: string; name?: string; type?: string; state: Record<string, number>; }
export interface FormulaDefinition { id: string; target: string; expression: string; }
export interface TimelineDefinition { mode: 'fixed_tick'; tick: number; duration: number; totalTicks: number; }
export interface WatchDefinition {
  target: string; mode: WatchMode; threshold?: number; operator?: ComparisonOperator;
}
export interface EventDefinition {
  id: string; when: string; message: string; level: EventLevel; repeat: boolean;
}
export interface ChartDefinition { x: string; y: string; }
export interface OutputDefinition { summary: string[]; charts: ChartDefinition[]; }
export interface RandomDefinition { seed: number; }
export interface ExperimentDefinition {
  schemaVersion: typeof SCHEMA_VERSION; experiment: ExperimentInfo;
  variables: Record<string, VariableDefinition>; entities: EntityDefinition[];
  formulas: FormulaDefinition[]; timeline: TimelineDefinition; watch: WatchDefinition[];
  events: EventDefinition[]; output?: OutputDefinition; random?: RandomDefinition; batch?: BatchDefinition;
}
