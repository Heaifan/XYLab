// R2-03D Evaluator 测试（基础与黄金样例）：D01~D11、D36~D38。
import { describe, expect, it } from 'vitest';
import { evalExpr } from './helpers';

describe('R2-03D Evaluator · 基础', () => {
  it('D01 number literal', () => {
    expect(evalExpr('42')).toBe(42);
  });

  it('D02 boolean literal', () => {
    expect(evalExpr('true')).toBe(true);
    expect(evalExpr('false')).toBe(false);
  });

  it('D03 number identifier', () => {
    expect(evalExpr('fatigue', { fatigue: 'number' }, { fatigue: 10 })).toBe(10);
  });

  it('D04 boolean identifier', () => {
    expect(evalExpr('alive', { alive: 'boolean' }, { alive: true })).toBe(true);
  });

  it('D05 一元负号', () => {
    expect(evalExpr('-x', { x: 'number' }, { x: 5 })).toBe(-5);
  });

  it('D06 一元非', () => {
    expect(evalExpr('!a', { a: 'boolean' }, { a: true })).toBe(false);
  });

  it('D07 加法', () => {
    expect(evalExpr('a + b', { a: 'number', b: 'number' }, { a: 10, b: 5 })).toBe(15);
  });

  it('D08 减法', () => {
    expect(evalExpr('10 - 5')).toBe(5);
  });

  it('D09 乘法', () => {
    expect(evalExpr('10 * 5')).toBe(50);
  });

  it('D10 除法', () => {
    expect(evalExpr('10 / 5')).toBe(2);
  });

  it('D11 模', () => {
    expect(evalExpr('10 % 3')).toBe(1);
  });

  it('D36 黄金 · 疲劳公式 = 10.4 且 context 不变', () => {
    const values = { fatigue: 10, move_speed: 5, fatigue_rate: 0.08 };
    const r = evalExpr(
      'fatigue + move_speed * fatigue_rate * dt',
      { fatigue: 'number', move_speed: 'number', fatigue_rate: 'number' },
      values,
      { dt: 1 },
    );
    expect(r).toBeCloseTo(10.4, 10); // IEEE754：0.08*5 非精确 0.4，数值断言用 toBeCloseTo
    expect(values.fatigue).toBe(10); // 求值不写回
  });

  it('D37 黄金 · 伤害钳制 = 0 且 hp 不变', () => {
    const values = { hp: 20, damage: 35 };
    expect(evalExpr('clamp(hp - damage, 0, 100)', { hp: 'number', damage: 'number' }, values)).toBe(0);
    expect(values.hp).toBe(20);
  });

  it('D38 黄金 · 布尔条件 = true（Event condition 基础）', () => {
    expect(evalExpr('fatigue >= 70 && hp > 0', { fatigue: 'number', hp: 'number' }, { fatigue: 80, hp: 40 })).toBe(true);
  });
});
