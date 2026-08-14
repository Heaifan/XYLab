// R2-04 Tick 测试（单 Tick 基础）。
import { describe, expect, it } from 'vitest';
import { runOnce } from '../fixtures';

describe('R2-04 Tick · 基础', () => {
  it('T01 单公式黄金：fatigue 10 → 10.4，time=1，tickIndex=1', () => {
    const { state, last } = runOnce({
      variables: {
        fatigue: { type: 'number', value: 10 },
        speed: { type: 'number', value: 5 },
        rate: { type: 'number', value: 0.08 },
      },
      formulas: [{ id: 'fatigue-growth', target: 'fatigue', expression: 'fatigue + speed * rate * dt' }],
    });
    expect(last?.status).toBe('success');
    if (last?.status !== 'success') throw new Error('expected success');
    expect(state.variables.fatigue).toBeCloseTo(10.4, 10);
    expect(last.result.previousTime).toBe(0);
    expect(last.result.currentTime).toBe(1);
    expect(last.result.previousTickIndex).toBe(0);
    expect(last.result.currentTickIndex).toBe(1);
  });

  it('T02 time 每 Tick 推进 dt', () => {
    const { state } = runOnce({ variables: { t0: { type: 'number', value: 0 } }, formulas: [{ id: 'f', target: 't0', expression: 'dt' }] });
    expect(state.time).toBe(1);
  });

  it('T03 tickIndex 每 Tick +1', () => {
    const { state } = runOnce({ variables: { a: { type: 'number', value: 0 } }, formulas: [{ id: 'f', target: 'a', expression: 'a + 1' }] }, 3);
    expect(state.tickIndex).toBe(3);
    expect(state.variables.a).toBe(3);
  });

  it('T04 dt 取自 timeline.tick', () => {
    const { state } = runOnce({
      variables: { x: { type: 'number', value: 0 } },
      formulas: [{ id: 'f', target: 'x', expression: 'x + dt' }],
      tick: 0.5,
    });
    expect(state.variables.x).toBeCloseTo(0.5, 10);
    expect(state.time).toBeCloseTo(0.5, 10);
  });

  it('T05 PI / sin / cos 可穿过完整 Tick 管线', () => {
    const { state, last } = runOnce({
      variables: {
        x: { type: 'number', value: 0 },
        y: { type: 'number', value: 0 },
      },
      formulas: [
        { id: 'fx', target: 'x', expression: 'cos(PI) * 10' },
        { id: 'fy', target: 'y', expression: 'sin(PI / 2) * 10' },
      ],
    });
    expect(last?.status).toBe('success');
    expect(state.variables.x).toBeCloseTo(-10, 10);
    expect(state.variables.y).toBeCloseTo(10, 10);
  });
});
