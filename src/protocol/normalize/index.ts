// R2-01 · Normalize 入口：外部协议 JSON → Runtime 内部可信格式（结构复制）。
// 全程新建对象，绝不修改输入（T08 守护）。协议默认值规则见 ./apply-defaults。

import { SCHEMA_VERSION } from '../types';
import type {
  EntityDefinition,
  ExperimentDefinition,
  ExperimentInfo,
  FormulaDefinition,
  VariableDefinition,
  VariableType,
} from '../types';
import type { RawExperiment } from '../raw-types';
import { applyDefaults } from './apply-defaults';

export function normalize(raw: RawExperiment): ExperimentDefinition {
  // variables：label 缺省 = 变量名（协议 §2）
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

  // entities：state 复制；name/type 保持可选（协议未定默认）
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

  // experiment：snake_case(created_at) → camelCase(createdAt)
  const info = raw.experiment!;
  const experiment: ExperimentInfo = { id: info.id as string, name: info.name as string };
  if (typeof info.description === 'string') experiment.description = info.description;
  if (typeof info.category === 'string') experiment.category = info.category;
  if (typeof info.version === 'string') experiment.version = info.version;
  if (Array.isArray(info.tags)) experiment.tags = info.tags.map(String);
  if (typeof info.author === 'string') experiment.author = info.author;
  if (typeof info.created_at === 'string') experiment.createdAt = info.created_at;

  const { timeline, watch, events, output, random } = applyDefaults(raw);

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
  if (output) definition.output = output;
  if (random) definition.random = random;
  return definition;
}
