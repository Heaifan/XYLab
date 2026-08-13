// R2-06 Random 测试（错误边界与原子性）：I04~I06。
import { describe, expect, it } from 'vitest';
import { createRuntimeState } from '../../../src/runtime/create-runtime-state';
import { executeTick } from '../../../src/runtime/tick/tick';
import { makeTickDef } from '../fixtures';

describe('R2-06 Random · 错误边界与原子性', () => {
  it('I04 random(1) 语义拒绝：INVALID_ARGUMENT_COUNT', () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + random(1)' }],
      random: { seed: 1 },
    });
    const out = executeTick(def, createRuntimeState(def));
    expect(out.status).toBe('failed');
    if (out.status === 'failed') {
      expect(out.error.code).toBe('FORMULA_SEMANTIC_ERROR');
      expect(out.error.causeCode).toBe('INVALID_ARGUMENT_COUNT');
    }
  });

  it('I05 失败 Tick 不推进 rng（原子 Tick 含随机域）', () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 0 }, b: { type: 'number', value: 0 } },
      formulas: [
        { id: 'f1', target: 'a', expression: 'a + random()' },
        { id: 'f2', target: 'b', expression: '1 / b' },
      ],
      random: { seed: 42 },
    });
    const state = createRuntimeState(def);
    const before = state.rng.state;
    const out = executeTick(def, state);
    expect(out.status).toBe('failed');
    expect(state.rng.state).toBe(before); // 随机域零推进
    expect(state.variables.a).toBe(0); // 变量域零写入
  });

  it('I06 消费 random() 的 Tick 推进 rng；未消费则不推进', () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + random()' }],
      random: { seed: 9 },
    });
    const state = createRuntimeState(def);
    const before = state.rng.state;
    expect(executeTick(def, state).status).toBe('success');
    expect(state.rng.state).not.toBe(before); // 消费后推进

    const def2 = makeTickDef({
      variables: { a: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
      random: { seed: 9 },
    });
    const state2 = createRuntimeState(def2);
    const before2 = state2.rng.state;
    expect(executeTick(def2, state2).status).toBe('success');
    expect(state2.rng.state).toBe(before2); // 未消费不推进
  });
});
