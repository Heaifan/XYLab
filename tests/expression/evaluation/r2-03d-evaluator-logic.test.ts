// R2-03D Evaluator 测试（逻辑与短路）：D14~D19。
import { describe, expect, it } from 'vitest';
import { evalExpr } from './helpers';

describe('R2-03D Evaluator · 逻辑与短路', () => {
  it('D14 比较', () => {
    expect(evalExpr('70 >= 50')).toBe(true);
    expect(evalExpr('50 < 50')).toBe(false);
    expect(evalExpr('50 <= 50')).toBe(true);
    expect(evalExpr('51 > 50')).toBe(true);
  });

  it('D15 相等（严格 ===，无 JS coercion）', () => {
    expect(evalExpr('10 == 10')).toBe(true);
    expect(evalExpr('10 != 5')).toBe(true);
    expect(evalExpr('true == true')).toBe(true);
    expect(evalExpr('true != false')).toBe(true);
  });

  it('D16 逻辑与', () => {
    expect(evalExpr('true && false')).toBe(false);
    expect(evalExpr('true && true')).toBe(true);
  });

  it('D17 逻辑或', () => {
    expect(evalExpr('false || true')).toBe(true);
    expect(evalExpr('false || false')).toBe(false);
  });

  it('D18 && 短路：右侧不求值（hp=0 不触发除零）', () => {
    expect(evalExpr('hp > 0 && 100 / hp > 2', { hp: 'number' }, { hp: 0 })).toBe(false);
  });

  it('D19 || 短路：右侧不求值', () => {
    expect(evalExpr('hp <= 0 || 100 / hp > 2', { hp: 'number' }, { hp: 0 })).toBe(true);
  });
});
