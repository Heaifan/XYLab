// R2-04 Tick 测试（原子失败与不可变性）：T08~T10、T21、T22 + 补充。
import { describe, expect, it } from 'vitest';
import { createRuntimeState } from '../../../src/runtime/create-runtime-state';
import { executeTick } from '../../../src/runtime/tick/tick';
import { makeTickDef } from '../fixtures';

describe('R2-04 Tick · 原子失败', () => {
  it('T08 任一公式失败 → 整个 Tick 零写入（A 不得变 100）', () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 10 }, b: { type: 'number', value: 0 } },
      formulas: [
        { id: 'fa', target: 'a', expression: '100' },
        { id: 'fb', target: 'b', expression: '10 / b' },
      ],
    });
    const state = createRuntimeState(def);
    const before = JSON.stringify(state);
    const out = executeTick(def, state);
    expect(out.status).toBe('failed');
    if (out.status !== 'failed') throw new Error('expected failure');
    expect(out.error.code).toBe('FORMULA_EVALUATION_ERROR');
    expect(out.error.causeCode).toBe('DIVISION_BY_ZERO');
    expect(out.error.formulaId).toBe('fb');
    expect(JSON.stringify(state)).toBe(before);
  });

  it('T09 失败时 time 不变', () => {
    const def = makeTickDef({
      variables: { b: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'b', expression: '1 / b' }],
    });
    const state = createRuntimeState(def);
    const out = executeTick(def, state);
    expect(out.status).toBe('failed');
    if (out.status !== 'failed') throw new Error('expected failure');
    expect(state.time).toBe(0);
    expect(out.time).toBe(0);
  });

  it('T10 失败时 tickIndex 不变', () => {
    const def = makeTickDef({
      variables: { b: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'b', expression: '1 / b' }],
    });
    const state = createRuntimeState(def);
    executeTick(def, state);
    expect(state.tickIndex).toBe(0);
  });

  it('T21 Definition 在成功与失败 Tick 后均不变', () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 1 }, b: { type: 'number', value: 0 } },
      formulas: [
        { id: 'fa', target: 'a', expression: 'a + 1' },
        { id: 'fb', target: 'b', expression: '1 / b' },
      ],
    });
    const before = JSON.stringify(def);
    executeTick(def, createRuntimeState(def));
    expect(JSON.stringify(def)).toBe(before);
  });

  it('T22 状态合同：成功就地提交同一 state；失败/越界不写', () => {
    const def = makeTickDef({
      variables: { a: { type: 'number', value: 1 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }],
    });
    const state = createRuntimeState(def);
    const out = executeTick(def, state);
    expect(out.status).toBe('success');
    if (out.status === 'success') expect(out.result.state).toBe(state); // 同一引用（R2-02 mutable 合同）
    expect(state.variables.a).toBe(2);
  });

  it('补充：实体路径 target → UNSUPPORTED_TARGET_KIND（明确失败，不静默跳过）', () => {
    const def = makeTickDef({
      variables: { x: { type: 'number', value: 1 } },
      entities: [{ id: 'u1', state: { hp: 10 } }],
      formulas: [{ id: 'f', target: 'u1.hp', expression: 'x + 1' }],
    });
    const out = executeTick(def, createRuntimeState(def));
    expect(out.status).toBe('failed');
    if (out.status === 'failed') expect(out.error.code).toBe('UNSUPPORTED_TARGET_KIND');
  });

  it('补充：语义错误包装 → FORMULA_SEMANTIC_ERROR + causeCode', () => {
    const def = makeTickDef({
      variables: { x: { type: 'number', value: 1 } },
      formulas: [{ id: 'f', target: 'x', expression: 'x + unknown_var' }],
    });
    const out = executeTick(def, createRuntimeState(def));
    expect(out.status).toBe('failed');
    if (out.status === 'failed') {
      expect(out.error.code).toBe('FORMULA_SEMANTIC_ERROR');
      expect(out.error.causeCode).toBe('UNKNOWN_IDENTIFIER');
    }
  });
});
