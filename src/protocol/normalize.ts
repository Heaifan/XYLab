// R2-01 · Normalize：外部协议 JSON → Runtime 内部可信格式。
// 规则：只补充「协议明文允许」的默认值（见 docs/experiment-protocol-0.1.md），绝不猜测语义。
// 全程新建对象，绝不修改输入（T08 守护）。

import {
  SCHEMA_VERSION,
  type ComparisonOperator,
  type EntityDefinition,
  type EventDefinition,
  type EventLevel,
  type ExperimentDefinition,
  type ExperimentInfo,
  type FormulaDefinition,
  type RawExperiment,
  type TimelineDefinition,
  type VariableDefinition,
  type VariableType,
  type WatchDefinition,
  type WatchMode,
} from './types';

export function normalize(raw: RawExperiment): ExperimentDefinition {
  // ---- variables：label 缺省 = 变量名（协议 §2）----
  const variables: Record<string, VariableDefinition> = {};
  for (const [name, def] of Object.entries(raw.variables ?? {})) {
    const v: VariableDefinition = {
      name,
      type: def.type as VariableType,
      value: def.value as number | boolean | string,
      label: (def.label as string | undefined) ?? name,
    };
    if (def.unit !== undefined) v.unit = def.unit as string;
    if (def.min !== undefined) v.min = def.min as number;
    if (def.max !== undefined) v.max = def.max as number;
    if (def.step !== undefined) v.step = def.step as number;
    if (def.options !== undefined) v.options = [...(def.options as unknown[])];
    variables[name] = v;
  }

  // ---- entities：state 复制，name/type 保持可选（协议未定默认）----
  const entities: EntityDefinition[] = (raw.entities ?? []).map((e) => {
    const def: EntityDefinition = {
      id: e.id as string,
      state: { ...((e.state ?? {}) as Record<string, number>) },
    };
    if (e.name !== undefined) def.name = e.name as string;
    if (e.type !== undefined) def.type = e.type as string;
    return def;
  });

  const formulas: FormulaDefinition[] = (raw.formulas ?? []).map((f) => ({
    id: f.id as string,
    target: f.target as string,
    expression: f.expression as string,
  }));

  // ---- timeline：totalTicks = duration / tick（协议 §5）----
  const t = raw.timeline!;
  const tick = t.tick as number;
  const duration = t.duration as number;
  const totalTicks = Math.round((duration / tick) * 1e9) / 1e9;
  const timeline: TimelineDefinition = { mode: 'fixed_tick', tick, duration, totalTicks };

  // ---- watch：threshold 模式 operator 缺省 '>='（协议 §6）----
  const watch: WatchDefinition[] = (raw.watch ?? []).map((w) => {
    const def: WatchDefinition = { target: w.target as string, mode: w.mode as WatchMode };
    if (w.threshold !== undefined) def.threshold = w.threshold as number;
    if (w.mode === 'threshold') def.operator = (w.operator as ComparisonOperator | undefined) ?? '>=';
    return def;
  });

  // ---- events：message=id、level='info'、repeat=false（协议 §7）----
  const events: EventDefinition[] = (raw.events ?? []).map((e) => ({
    id: e.id as string,
    when: e.when as string,
    message: (e.message as string | undefined) ?? (e.id as string),
    level: (e.level as EventLevel | undefined) ?? 'info',
    repeat: (e.repeat as boolean | undefined) ?? false,
  }));

  // ---- experiment：snake_case(created_at) → camelCase(createdAt)----
  const info = raw.experiment!;
  const experiment: ExperimentInfo = { id: info.id as string, name: info.name as string };
  if (typeof info.description === 'string') experiment.description = info.description;
  if (typeof info.category === 'string') experiment.category = info.category;
  if (typeof info.version === 'string') experiment.version = info.version;
  if (Array.isArray(info.tags)) experiment.tags = info.tags.map(String);
  if (typeof info.author === 'string') experiment.author = info.author;
  if (typeof info.created_at === 'string') experiment.createdAt = info.created_at;

  const definition: ExperimentDefinition = {
    schemaVersion: SCHEMA_VERSION,
    experiment,
    variables,
    entities,
    formulas,
    timeline,
    watch,
    events,
  };

  // ---- output / random：可选，原样结构复制，不发明默认值 ----
  if (raw.output) {
    definition.output = {
      summary: Array.isArray(raw.output.summary) ? raw.output.summary.map(String) : [],
      charts: Array.isArray(raw.output.charts)
        ? (raw.output.charts as Array<{ x: unknown; y: unknown }>).map((c) => ({ x: String(c.x), y: String(c.y) }))
        : [],
    };
  }
  if (raw.random) definition.random = { seed: raw.random.seed as number };

  return definition;
}
