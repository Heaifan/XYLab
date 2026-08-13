// R2-03C 测试（函数白名单与签名）：C20~C26。
import { describe, expect, it } from 'vitest';
import { check, expectSemanticError } from './helpers';

describe('R2-03C Semantic · 函数', () => {
  it('C20 abs(number) 合法', () => {
    expect(check('abs(fatigue)', { fatigue: 'number' }).resultType).toBe('number');
  });

  it('C21 clamp(x, 0, 100) 合法', () => {
    expect(check('clamp(x, 0, 100)', { x: 'number' }).resultType).toBe('number');
  });

  it('C22 pow(a, 2) 合法', () => {
    expect(check('pow(a, 2)', { a: 'number' }).resultType).toBe('number');
  });

  it('C23 min 变参（≥2）合法', () => {
    expect(check('min(a, b, c)', { a: 'number', b: 'number', c: 'number' }).resultType).toBe('number');
  });

  it('C24 未知函数 → UNKNOWN_FUNCTION（03B 已 PASS，分层证明）', () => {
    expectSemanticError('banana(a)', { a: 'number' }, 'UNKNOWN_FUNCTION', 'banana');
  });

  it('C25 参数数量错误 → INVALID_ARGUMENT_COUNT', () => {
    expectSemanticError('clamp(x)', { x: 'number' }, 'INVALID_ARGUMENT_COUNT');
    expectSemanticError('abs(a, b)', { a: 'number', b: 'number' }, 'INVALID_ARGUMENT_COUNT');
    expectSemanticError('min(a)', { a: 'number' }, 'INVALID_ARGUMENT_COUNT');
  });

  it('C26 参数类型错误 → INVALID_ARGUMENT_TYPE', () => {
    expectSemanticError('abs(alive)', { alive: 'boolean' }, 'INVALID_ARGUMENT_TYPE');
  });
});
