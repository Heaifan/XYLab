// R2-04 Tick 测试（批量与快照语义）：T05~T07、T11、T12。
import { describe, expect, it } from 'vitest';
import { runOnce } from '../fixtures';

describe('R2-04 Tick · 批量与快照', () => {
  it('T05 多公式批量提交', () => {
    const { state, last } = runOnce({
      variables: { a: { type: 'number', value: 0 }, b: { type: 'number', value: 0 } },
      formulas: [
        { id: 'fa', target: 'a', expression: 'a + 1' },
        { id: 'fb', target: 'b', expression: 'b + 2' },
      ],
    });
    expect(state.variables.a).toBe(1);
    expect(state.variables.b).toBe(2);
    expect(last?.status === 'success' && last.result.changes).toHaveLength(2);
  });

  it('T06 快照读语义：后公式读旧值', () => {
    const { state } = runOnce({
      variables: { a: { type: 'number', value: 10 }, b: { type: 'number', value: 0 } },
      formulas: [
        { id: 'fa', target: 'a', expression: 'a + 1' },
        { id: 'fb', target: 'b', expression: 'a' },
      ],
    });
    expect(state.variables.a).toBe(11);
    expect(state.variables.b).toBe(10); // 读到快照中的旧 a
  });

  it('T07 交换黄金：A=B、B=A → A=20、B=10（无顺序依赖）', () => {
    const { state } = runOnce({
      variables: { a: { type: 'number', value: 10 }, b: { type: 'number', value: 20 } },
      formulas: [
        { id: 'fa', target: 'a', expression: 'b' },
        { id: 'fb', target: 'b', expression: 'a' },
      ],
    });
    expect(state.variables.a).toBe(20);
    expect(state.variables.b).toBe(10);
  });

  it('T11 ChangeSet：fatigue 10 → 10.4', () => {
    const { last } = runOnce({
      variables: { fatigue: { type: 'number', value: 10 } },
      formulas: [{ id: 'f', target: 'fatigue', expression: 'fatigue + 0.4' }],
    });
    if (last?.status !== 'success') throw new Error('expected success');
    expect(last.result.changes[0]?.target).toBe('fatigue');
    expect(last.result.changes[0]?.previousValue).toBe(10);
    expect(last.result.changes[0]?.currentValue).toBeCloseTo(10.4, 10);
  });

  it('T12 值未变化不产生 change（仍成功推进时间）', () => {
    const { state, last } = runOnce({
      variables: { a: { type: 'number', value: 5 } },
      formulas: [{ id: 'f', target: 'a', expression: 'a * 1' }],
    });
    expect(last?.status).toBe('success');
    if (last?.status === 'success') expect(last.result.changes).toEqual([]);
    expect(state.time).toBe(1);
  });
});
