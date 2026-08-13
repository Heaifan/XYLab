// XYLab 实验协议 0.1 —— Runtime 内部可信类型（ExperimentDefinition）。
// 设计要点：外部 JSON 是协议格式；本文件定义的是通过 Loader 全部校验后的内部格式。
// Runtime 后续（R2-02 起）不再怀疑字段：有没有、什么类型、默认值是否已补。

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
  createdAt?: string; // 协议字段 created_at（snake_case → 内部 camelCase）
}

export interface VariableDefinition {
  name: string; // 变量名（即协议 variables 的键）
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
  tick: number; // 每 tick 推进的模拟秒数
  duration: number; // 模拟总时长（秒）
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

// ---------------- Loader 结果与错误 ----------------

export type LoadErrorCode =
  | 'INVALID_JSON'
  | 'SCHEMA_VALIDATION_FAILED'
  | 'FORMULA_TARGET_NOT_FOUND'
  | 'WATCH_TARGET_NOT_FOUND'
  | 'DUPLICATE_ENTITY_ID'
  | 'UNKNOWN_VARIABLE_REFERENCE'
  | 'INVALID_TIMELINE_RANGE'
  | 'VARIABLE_TYPE_INVALID'
  | 'RESERVED_NAME';

export interface LoadError {
  code: LoadErrorCode;
  message: string;
  path?: string; // JSON Pointer 或字段路径
  keyword?: string; // 仅 Schema 错误
}

export type LoadResult =
  | { ok: true; definition: ExperimentDefinition }
  | { ok: false; errors: LoadError[] };

// ---------------- Loader 内部原始形状（未经校验，一切 unknown） ----------------

export interface RawVariable {
  type?: unknown;
  value?: unknown;
  label?: unknown;
  unit?: unknown;
  min?: unknown;
  max?: unknown;
  step?: unknown;
  options?: unknown[];
}

export interface RawEntity {
  id?: unknown;
  name?: unknown;
  type?: unknown;
  state?: Record<string, unknown>;
}

export interface RawFormula {
  id?: unknown;
  target?: unknown;
  expression?: unknown;
}

export interface RawTimeline {
  mode?: unknown;
  tick?: unknown;
  duration?: unknown;
}

export interface RawWatch {
  target?: unknown;
  mode?: unknown;
  threshold?: unknown;
  operator?: unknown;
}

export interface RawEvent {
  id?: unknown;
  when?: unknown;
  message?: unknown;
  level?: unknown;
  repeat?: unknown;
}

export interface RawExperiment {
  schema?: unknown;
  experiment?: Record<string, unknown>;
  variables?: Record<string, RawVariable>;
  entities?: RawEntity[];
  formulas?: RawFormula[];
  timeline?: RawTimeline;
  watch?: RawWatch[];
  events?: RawEvent[];
  output?: { summary?: unknown; charts?: unknown };
  random?: { seed?: unknown };
}
