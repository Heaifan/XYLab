// R2-03C 测试（运算符类型规则）：C05~C19。禁一切隐式转换。
import { describe, expect, it } from 'vitest';
import { check, expectSemanticError } from './helpers';

describe('R2-03C Semantic · 运算符', () => {
  it('C05 数值 +', () => {
    expect(check('a + b', { a: 'number', b: 'number' }).resultType).toBe('number');
  });

  it('C06 数值 *（字面量混合）', () => {
    expect(check('a * 2', { a: 'number' }).resultType).toBe('number');
    expect(check('1 + 2', {}).resultType).toBe('number');
  });

  it('C07 boolean + 拒绝', () => {
    expectSemanticError('a + b', { a: 'boolean', b: 'boolean' }, 'INVALID_OPERAND_TYPE');
  });

  it('C08 一元 - 数值合法', () => {
    expect(check('-a', { a: 'number' }).resultType).toBe('number');
  });

  it('C09 一元 - boolean 拒绝', () => {
    expectSemanticError('-a', { a: 'boolean' }, 'INVALID_OPERAND_TYPE');
  });

  it('C10 ! boolean 合法', () => {
    expect(check('!a', { a: 'boolean' }).resultType).toBe('boolean');
  });

  it('C11 ! number 拒绝（无 truthy/falsy）', () => {
    expectSemanticError('!a', { a: 'number' }, 'INVALID_OPERAND_TYPE');
  });

  it('C12 数值比较 → boolean', () => {
    expect(check('a >= 70', { a: 'number' }).resultType).toBe('boolean');
  });

  it('C13 比较类型非法拒绝', () => {
    expectSemanticError('a > b', { a: 'boolean', b: 'boolean' }, 'INVALID_OPERAND_TYPE');
  });

  it('C14 数值相等 → boolean', () => {
    expect(check('a == b', { a: 'number', b: 'number' }).resultType).toBe('boolean');
  });

  it('C15 布尔相等 → boolean', () => {
    expect(check('a == b', { a: 'boolean', b: 'boolean' }).resultType).toBe('boolean');
  });

  it('C16 跨类型相等拒绝（禁 1 == true）', () => {
    expectSemanticError('a == b', { a: 'number', b: 'boolean' }, 'INVALID_OPERAND_TYPE');
  });

  it('C17 boolean && → boolean', () => {
    expect(check('a && b', { a: 'boolean', b: 'boolean' }).resultType).toBe('boolean');
  });

  it('C18 boolean || → boolean', () => {
    expect(check('a || b', { a: 'boolean', b: 'boolean' }).resultType).toBe('boolean');
  });

  it('C19 number && 拒绝', () => {
    expectSemanticError('a && b', { a: 'number', b: 'number' }, 'INVALID_OPERAND_TYPE');
  });
});
