// Loader 内部原始形状（未经校验，一切 unknown）。
// 只供 protocol 加载管线内部使用；对外契约一律用 ./types.ts 的可信类型。

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
