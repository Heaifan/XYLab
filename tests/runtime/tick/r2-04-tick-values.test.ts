// R2-04 Tick 测试（值守卫）：T13~T17。
import { describe, expect, it } from 'vitest';
import { createRuntimeState } from '../../../src/runtime/create-runtime-state';
import { executeTick } from '../../../src/runtime/tick/tick';
import { makeTickDef } from '../fixtures';

describe('R2-04 Tick · 值守卫', () => {
  it('T13 number target 接受有限数值', () => {
    const def = makeTickDef({ variables: { a: { type: 'number', value: 1 } }, formulas: [{ id: 'f', target: 'a', expression: 'a + 0.5' }] });
    expect(executeTick(def, createRuntimeState(def)).status).toBe('success');
  });

  it('T14 boolean target 接受布尔结果', () => {
    const def = makeTickDef({
      variables: { hp: { type: 'number', value: 5 }, alive: { type: 'boolean', value: false } },
      formulas: [{ id: 'f', target: 'alive', expression: 'hp > 0' }],
    });
    const state = createRuntimeState(def);
    expect(executeTick(def, state).status).toBe('success');
    expect(state.variables.alive).toBe(true);
  });

  it('T15 integer target 接受整数结果', () => {
    const def = makeTickDef({
      variables: { count: { type: 'integer', value: 0 } },
      formulas: [{ id: 'f', target: 'count', expression: 'count + 1' }],
    });
    const state = createRuntimeState(def);
    expect(executeTick(def, state).status).toBe('success');
    expect(state.variables.count).toBe(1);
  });

  it('T16 integer target 拒绝小数结果（不 round/截断）', () => {
    const def = makeTickDef({
      variables: { count: { type: 'integer', value: 0 } },
      formulas: [{ id: 'f', target: 'count', expression: '3.7' }],
    });
    const out = executeTick(def, createRuntimeState(def));
    expect(out.status).toBe('failed');
    if (out.status === 'failed') expect(out.error.code).toBe('INTEGER_TARGET_REQUIRES_INTEGER');
  });

  it('T17 重复 target → DUPLICATE_FORMULA_TARGET', () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [
        { id: 'f1', target: 'a', expression: '1' },
        { id: 'f2', target: 'a', expression: '2' },
      ],
    });
    const out = executeTick(def, createRuntimeState(def));
    expect(out.status).toBe('failed');
    if (out.status === 'failed') expect(out.error.code).toBe('DUPLICATE_FORMULA_TARGET');
  });
});
