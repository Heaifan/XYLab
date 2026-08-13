// XYLab 实验协议 0.1 —— Runtime 内部可信类型（ExperimentDefinition）。
// 外部 JSON 是协议格式；本文件定义的是通过 Loader 全部校验后的内部可信格式。
// Runtime 后续（R2-02 起）不再怀疑字段。未经校验的输入形状见 ./raw-types.ts。

export const SCHEMA_VERSION = 'xylab-experiment@0.1' as const;

export type VariableType = 'number' | 'integer' | 'boolean' | 'enum' | 'string';
export type WatchMode = 'value' | 'change' | 'threshold';
export type ComparisonOperator = '>=' | '>' | '<=' | '<' | '==' | '!=';
export type EventLevel = 'trace' | 'info' | 'notice' | 'warning' | 'critical';

export interface ExperimentInfo {
  id: string;
  name: string;
  description?: string;
  category?: string;
  version?: string;
  tags?: string[];
  author?: string;
  createdAt?: string; // 协议 created_at（snake_case → 内部 camelCase）
}

export interface VariableDefinition {
  name: string;
  type: VariableType;
  value: number | boolean | string;
  label: string; // Normalize 保证存在（缺省 = 变量名）
  unit?: string;
  min?: number; // UI 提示，非运行时钳制
  max?: number;
  step?: number;
  options?: unknown[]; // enum 专属
}

export interface EntityDefinition {
  id: string;
  name?: string;
  type?: string;
  state: Record<string, number>;
}

export interface FormulaDefinition {
  id: string;
  target: string; // 变量名或实体路径 entityId.stateKey
  expression: string;
}

export interface TimelineDefinition {
  mode: 'fixed_tick';
  tick: number;
  duration: number;
  totalTicks: number; // Normalize 计算 = duration / tick（正整数）
}

export interface WatchDefinition {
  target: string;
  mode: WatchMode;
  threshold?: number;
  operator?: ComparisonOperator; // threshold 模式缺省 Normalize 为 '>='
}

export interface EventDefinition {
  id: string;
  when: string;
  message: string; // Normalize 保证存在（缺省 = id）
  level: EventLevel; // Normalize 保证存在（缺省 = 'info'）
  repeat: boolean; // Normalize 保证存在（缺省 = false，上升沿触发一次）
}

export interface ChartDefinition {
  x: string;
  y: string;
}

export interface OutputDefinition {
  summary: string[];
  charts: ChartDefinition[];
}

export interface RandomDefinition {
  seed: number;
}

export interface ExperimentDefinition {
  schemaVersion: typeof SCHEMA_VERSION;
  experiment: ExperimentInfo;
  variables: Record<string, VariableDefinition>;
  entities: EntityDefinition[];
  formulas: FormulaDefinition[];
  timeline: TimelineDefinition;
  watch: WatchDefinition[];
  events: EventDefinition[];
  output?: OutputDefinition;
  random?: RandomDefinition;
}
