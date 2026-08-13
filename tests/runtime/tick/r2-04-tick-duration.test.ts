// R2-04 Tick 测试（duration 边界）：T18~T20。
import { describe, expect, it } from 'vitest';
import { createRuntimeState } from '../../../src/runtime/create-runtime-state';
import { executeTick } from '../../../src/runtime/tick/tick';
import { makeTickDef } from '../fixtures';
import type { ExperimentDefinition } from '../../../src/protocol/types';

// 绕过 Loader 直接构造非整除定义（Loader 按协议拒绝 duration/tick 非整数，见 R2-01 T09）
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

describe('R2-04 Tick · duration 边界', () => {
  it('T18 duration 到达后不再执行（第 11 次拒绝）', () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      tick: 1,
      duration: 10,
    });
    const state = createRuntimeState(def);
    for (let i = 0; i < 10; i++) expect(executeTick(def, state).status).toBe('success');
    expect(state.tickIndex).toBe(10);
    expect(executeTick(def, state).status).toBe('duration-reached');
    expect(state.time).toBe(10);
  });

  it('T19 下一 Tick 将超过 duration → 拒绝（直接构造 10/6）', () => {
    const def = directDef(6, 10);
    const state = createRuntimeState(def);
    expect(executeTick(def, state).status).toBe('success'); // time 6
    expect(state.time).toBe(6);
    expect(executeTick(def, state).status).toBe('duration-reached'); // 6+6=12 > 10
    expect(state.time).toBe(6);
  });

  it('T20 非整除 duration 无 partial tick：直接构造止于 6；Loader 合法路径止于 9', () => {
    const direct = directDef(6, 10);
    const s1 = createRuntimeState(direct);
    executeTick(direct, s1);
    executeTick(direct, s1);
    expect(s1.time).toBe(6);
    const loaderDef = makeTickDef({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      tick: 3,
      duration: 9,
    });
    const s2 = createRuntimeState(loaderDef);
    for (let i = 0; i < 3; i++) expect(executeTick(loaderDef, s2).status).toBe('success');
    expect(s2.time).toBe(9);
    expect(executeTick(loaderDef, s2).status).toBe('duration-reached');
  });
});
