// R2-03C 测试（符号表）：C01~C04 + dt builtin + unsupported 符号。
import { describe, expect, it } from 'vitest';
import { check, expectSemanticError } from './helpers';

describe('R2-03C Semantic · 符号表', () => {
  it('C01 已知 number 标识符', () => {
    expect(check('fatigue', { fatigue: 'number' }).resultType).toBe('number');
  });

  it('C02 已知 boolean 标识符', () => {
    expect(check('alive', { alive: 'boolean' }).resultType).toBe('boolean');
  });

  it('C03 dt builtin（唯一 builtin，number）', () => {
    expect(check('dt', {}).resultType).toBe('number');
  });

  it('C03b integer 在表达式层视为 number', () => {
    expect(check('count', { count: 'integer' }).resultType).toBe('number');
    expect(check('count + 1.5', { count: 'integer' }).resultType).toBe('number');
  });

  it('C04 未知标识符 → UNKNOWN_IDENTIFIER（携带 identifier 与 span）', () => {
    expectSemanticError('fatigue_rates', { fatigue: 'number' }, 'UNKNOWN_IDENTIFIER', 'fatigue_rates');
  });

  it('C04b string 符号 → UNSUPPORTED_SYMBOL_TYPE', () => {
    expectSemanticError('note + 1', { note: 'string' }, 'UNSUPPORTED_SYMBOL_TYPE', 'note');
  });

  it('C04c enum 符号 → UNSUPPORTED_SYMBOL_TYPE', () => {
    expectSemanticError('stance', { stance: 'enum' }, 'UNSUPPORTED_SYMBOL_TYPE', 'stance');
  });
});
