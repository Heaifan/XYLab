// R2-06 Random 测试（PRNG 单元）：P01~P05。
import { describe, expect, it } from 'vitest';
import { DEFAULT_SEED, nextRandom } from '../../../src/runtime/random/prng';

function drawSequence(seed: number, n: number): number[] {
  let state = seed >>> 0;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const d = nextRandom(state);
    out.push(d.value);
    state = d.nextState;
  }
  return out;
}

describe('R2-06 Random · PRNG', () => {
  it('P01 同 seed ⇒ 同序列', () => {
    expect(drawSequence(12345, 5)).toEqual(drawSequence(12345, 5));
  });

  it('P02 不同 seed ⇒ 序列不同', () => {
    expect(drawSequence(12345, 5)).not.toEqual(drawSequence(54321, 5));
  });

  it('P03 所有值 ∈ [0, 1)', () => {
    for (const v of drawSequence(42, 200)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('P04 从 seed 初始态重跑序列完全一致（Reset 语义基础）', () => {
    const a = drawSequence(7, 10);
    const b = drawSequence(7, 10);
    expect(a).toEqual(b);
  });

  it('P05 DEFAULT_SEED 存在且确定性（未声明 random 块的实验仍可复现）', () => {
    expect(DEFAULT_SEED).toBe(1);
    expect(drawSequence(DEFAULT_SEED, 3)).toEqual(drawSequence(DEFAULT_SEED, 3));
  });
});
