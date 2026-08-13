// R2-02/R2-04 测试共享夹具（非 test 文件，避免 vitest 重复注册用例）。
import { loadExperiment } from '../../src/protocol/loader';
import { createRuntimeState } from '../../src/runtime/create-runtime-state';
import { executeTick } from '../../src/runtime/tick/tick';
import type { ExperimentDefinition, VariableType } from '../../src/protocol/types';
import type { RawEntity, RawExperiment, RawVariable } from '../../src/protocol/raw-types';

export function defOf(raw: RawExperiment | string): ExperimentDefinition {
  const r = loadExperiment(raw);
  if (!r.ok) throw new Error(`加载失败：${r.errors.map((e) => e.message).join('; ')}`);
  return r.definition;
}

// R2-04 共享夹具：可定制变量初值 / 实体 / 公式 / 时间线（经真实 Loader）
export function makeTickDef(opts: {
  variables?: Record<string, { type: VariableType; value?: number | boolean }>;
  entities?: RawEntity[];
  formulas?: Array<{ id: string; target: string; expression: string }>;
  tick?: number;
  duration?: number;
}): ExperimentDefinition {
  const variables: Record<string, RawVariable> = {};
  for (const [name, d] of Object.entries(opts.variables ?? {})) {
    variables[name] = { type: d.type, value: d.value ?? (d.type === 'boolean' ? false : 0) };
  }
  return defOf({
    schema: 'xylab-experiment@0.1',
    experiment: { id: 't-tick', name: 'T' },
    variables,
    entities: opts.entities ?? [],
    ...(opts.formulas ? { formulas: opts.formulas } : {}),
    timeline: { mode: 'fixed_tick', tick: opts.tick ?? 1, duration: opts.duration ?? 10 },
  });
}

// R2-04 共享：执行 ticks 次并返回定义/状态/末次结果
export function runOnce(opts: Parameters<typeof makeTickDef>[0], ticks = 1) {
  const def = makeTickDef(opts);
  const state = createRuntimeState(def);
  let last: ReturnType<typeof executeTick> | null = null;
  for (let i = 0; i < ticks; i++) last = executeTick(def, state);
  return { def, state, last };
}

export function defWithEntities(): ExperimentDefinition {
  return defOf({
    schema: 'xylab-experiment@0.1',
    experiment: { id: 't-entity', name: '实体实验' },
    variables: { fatigue: { type: 'number', value: 0 } },
    entities: [
      { id: 'unit-a', name: '步兵A', type: 'infantry', state: { hp: 100, fatigue: 0 } },
      { id: 'unit-b', state: { hp: 80, morale: 60 } },
      { id: 'unit-c', state: { hp: 999 } },
    ],
    timeline: { mode: 'fixed_tick', tick: 1, duration: 10 },
  });
}
