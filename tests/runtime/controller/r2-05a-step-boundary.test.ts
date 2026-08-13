// R2-05A Controller 测试（completed 边界与 Definition 不可变）：A06、A07、A18。
import { describe, expect, it } from 'vitest';
import { createController } from '../../../src/runtime/controller/controller';
import { makeController } from '../fixtures';
import type { ExperimentDefinition } from '../../../src/protocol/types';

// 绕过 Loader 直接构造非整除定义（Loader 按协议拒绝 duration/tick 非整数）
function directDef(tick: number, duration: number): ExperimentDefinition {
  return {
    schemaVersion: 'xylab-experiment@0.1',
    experiment: { id: 't-direct', name: 'T' },
    variables: { x: { name: 'x', type: 'number', value: 0, label: 'x' } },
    entities: [],
    formulas: [{ id: 'f', target: 'x', expression: 'x + 1' }],
    timeline: { mode: 'fixed_tick', tick, duration, totalTicks: Math.round((duration / tick) * 1e9) / 1e9 },
    watch: [],
    events: [],
  };
}

describe('R2-05A Controller · completed 边界', () => {
  it('A06 最后合法 Tick → completed', () => {
    const { controller } = makeController({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      tick: 1,
      duration: 3,
    });
    expect(controller.step().ok).toBe(true);
    expect(controller.status).toBe('paused');
    expect(controller.step().ok).toBe(true);
    expect(controller.status).toBe('paused');
    const last = controller.step();
    expect(last.ok).toBe(true);
    if (!last.ok) throw new Error('expected ok');
    expect(last.status).toBe('completed');
    expect(controller.status).toBe('completed');
    expect(controller.state.time).toBe(3);
  });

  it('A07 非整除 duration（直接构造 10/6）→ 一步后 completed，止于 6', () => {
    const def = directDef(6, 10);
    const controller = createController(def);
    const out = controller.step();
    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error('expected ok');
    expect(out.status).toBe('completed');
    expect(controller.state.time).toBe(6);
  });

  it('A18 Definition 在 Step/Reset 全程不变', () => {
    const { def, controller } = makeController({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      tick: 1,
      duration: 3,
    });
    const before = JSON.stringify(def);
    controller.step();
    controller.step();
    controller.step();
    controller.reset();
    controller.step();
    expect(JSON.stringify(def)).toBe(before);
  });
});
