// R2-02 测试共享夹具（非 test 文件，避免 vitest 重复注册用例）。
import { loadExperiment } from '../../src/protocol/loader';
import type { ExperimentDefinition } from '../../src/protocol/types';
import type { RawExperiment } from '../../src/protocol/raw-types';

export function defOf(raw: RawExperiment | string): ExperimentDefinition {
  const r = loadExperiment(raw);
  if (!r.ok) throw new Error(`加载失败：${r.errors.map((e) => e.message).join('; ')}`);
  return r.definition;
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
