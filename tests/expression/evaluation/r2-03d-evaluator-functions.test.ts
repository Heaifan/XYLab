// R2-03D Evaluator 测试（内置函数）。
import { describe, expect, it } from 'vitest';
import { evalExpr, expectEvalError } from './helpers';

describe('R2-03D Evaluator · 内置函数', () => {
  it('min / max', () => {
    expect(evalExpr('min(3, 5, 1)')).toBe(1);
    expect(evalExpr('max(3, 5, 9)')).toBe(9);
  });

  it('clamp', () => {
    expect(evalExpr('clamp(120, 0, 100)')).toBe(100);
    expect(evalExpr('clamp(-5, 0, 100)')).toBe(0);
    expect(evalExpr('clamp(50, 0, 100)')).toBe(50);
  });

  it('clamp 下限 > 上限 → INVALID_CLAMP_RANGE', () => {
    expectEvalError('clamp(5, 10, 0)', {}, {}, 'INVALID_CLAMP_RANGE');
  });

  it('abs / floor / ceil / round', () => {
    expect(evalExpr('abs(-5)')).toBe(5);
    expect(evalExpr('floor(3.7)')).toBe(3);
    expect(evalExpr('ceil(3.2)')).toBe(4);
    expect(evalExpr('round(3.5)')).toBe(4);
  });

  it('sqrt / pow', () => {
    expect(evalExpr('sqrt(9)')).toBe(3);
    expect(evalExpr('pow(2, 3)')).toBe(8);
  });

  it('sqrt 负定义域 → DOMAIN_ERROR', () => {
    expectEvalError('sqrt(-1)', {}, {}, 'DOMAIN_ERROR');
  });

  it('sin / cos 使用弧度', () => {
    expect(evalExpr('sin(PI / 2)', {}, {}, { PI: Math.PI })).toBeCloseTo(1, 12);
    expect(evalExpr('cos(PI)', {}, {}, { PI: Math.PI })).toBeCloseTo(-1, 12);
  });

  it('PI 是数值常量', () => {
    expect(evalExpr('PI', {}, {}, { PI: Math.PI })).toBeCloseTo(Math.PI, 12);
  });
});
