// R2-01 测试共享夹具（非 test 文件，避免 vitest 重复注册用例）。
import type { RawExperiment } from '../../src/protocol/raw-types';

export function base(): RawExperiment {
  return {
    schema: 'xylab-experiment@0.1',
    experiment: { id: 't-basic', name: 'T 实验' },
    variables: { a: { type: 'number', value: 1 } },
    formulas: [{ id: 'f1', target: 'a', expression: 'a + 1' }],
    timeline: { mode: 'fixed_tick', tick: 1, duration: 10 },
  };
}
