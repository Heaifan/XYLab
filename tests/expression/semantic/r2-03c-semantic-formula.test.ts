// R2-03C 测试（Formula target 兼容 + 黄金样例）：C27~C30。
import { describe, expect, it } from 'vitest';
import { check, checkFormula, expectFormulaError } from './helpers';

describe('R2-03C Semantic · Formula', () => {
  it('C27 number 结果 → number target PASS', () => {
    expect(checkFormula('fatigue + rate * dt', 'fatigue', { fatigue: 'number', rate: 'number' }).resultType).toBe('number');
  });

  it('C28 boolean 结果 → boolean target PASS', () => {
    const r = checkFormula('alive && hp > 0', 'combat_capable', { alive: 'boolean', hp: 'number', combat_capable: 'boolean' });
    expect(r.resultType).toBe('boolean');
  });

  it('C29 number 结果 → boolean target 拒绝', () => {
    expectFormulaError('fatigue + 1', 'alive', { fatigue: 'number', alive: 'boolean' }, 'FORMULA_RESULT_TYPE_MISMATCH');
  });

  it('C30 string/enum target 明确拒绝', () => {
    expectFormulaError('1 + 2', 'note', { note: 'string' }, 'UNSUPPORTED_FORMULA_TARGET_TYPE');
    expectFormulaError('1 + 2', 'stance', { stance: 'enum' }, 'UNSUPPORTED_FORMULA_TARGET_TYPE');
  });

  it('C31 integer target 只要求 numeric（静态不证明整数值）', () => {
    expect(checkFormula('fatigue + 1', 'count', { fatigue: 'number', count: 'integer' }).resultType).toBe('number');
  });

  it('黄金样例 · 疲劳公式完整 PASS → number', () => {
    const r = checkFormula('fatigue + move_speed * fatigue_rate * dt', 'fatigue', {
      fatigue: 'number',
      move_speed: 'number',
      fatigue_rate: 'number',
    });
    expect(r.resultType).toBe('number');
  });

  it('黄金样例 · 事件条件式 PASS → boolean（为 R3 Events 铺路）', () => {
    const r = check('fatigue >= 70 && hp > 0', { fatigue: 'number', hp: 'number' });
    expect(r.resultType).toBe('boolean');
  });
});
