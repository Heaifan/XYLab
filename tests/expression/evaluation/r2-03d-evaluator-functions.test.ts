// R2-03D Evaluator 测试（内置函数）：D20~D30。
import { describe, expect, it } from 'vitest';
import { evalExpr, expectEvalError } from './helpers';

describe('R2-03D Evaluator · 内置函数', () => {
  it('D20 min', () => {
    expect(evalExpr('min(3, 5)')).toBe(3);
    expect(evalExpr('min(3, 5, 1)')).toBe(1);
  });

  it('D21 max', () => {
    expect(evalExpr('max(3, 5)')).toBe(5);
    expect(evalExpr('max(3, 5, 9)')).toBe(9);
  });

  it('D22 clamp', () => {
    expect(evalExpr('clamp(120, 0, 100)')).toBe(100);
    expect(evalExpr('clamp(-5, 0, 100)')).toBe(0);
    expect(evalExpr('clamp(50, 0, 100)')).toBe(50);
  });

  it('D23 clamp 下限 > 上限 → INVALID_CLAMP_RANGE（不自动交换）', () => {
    expectEvalError('clamp(5, 10, 0)', {}, {}, 'INVALID_CLAMP_RANGE');
  });

  it('D24 abs', () => {
    expect(evalExpr('abs(-5)')).toBe(5);
  });

  it('D25 floor', () => {
    expect(evalExpr('floor(3.7)')).toBe(3);
  });

  it('D26 ceil', () => {
    expect(evalExpr('ceil(3.2)')).toBe(4);
  });

  it('D27 round', () => {
    expect(evalExpr('round(3.5)')).toBe(4);
  });

  it('D28 sqrt', () => {
    expect(evalExpr('sqrt(9)')).toBe(3);
  });

  it('D29 sqrt 负定义域 → DOMAIN_ERROR（NaN 不得传播）', () => {
    expectEvalError('sqrt(-1)', {}, {}, 'DOMAIN_ERROR');
  });

  it('D30 pow', () => {
    expect(evalExpr('pow(2, 3)')).toBe(8);
  });
});
