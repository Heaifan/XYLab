// R2-03B Parser 测试（错误边界）：五类 ParseError + span 定位。
import { describe, expect, it } from 'vitest';
import { tokenizeExpression } from '../../../src/expression/tokenizer';
import { parseExpression } from '../../../src/expression/syntax/parser';
import { ExpressionParseError } from '../../../src/expression/syntax/parse-error';
import { expectParseError } from './helpers';

describe('R2-03B Parser · 错误边界', () => {
  it('E01 空表达式 "" → EXPECTED_EXPRESSION', () => {
    expectParseError('', 'EXPECTED_EXPRESSION');
  });

  it('E02 未闭合 "(" → EXPECTED_EXPRESSION', () => {
    expectParseError('(', 'EXPECTED_EXPRESSION');
  });

  it('E03 孤 ")" → UNEXPECTED_TOKEN', () => {
    expectParseError(')', 'UNEXPECTED_TOKEN');
  });

  it('E04 "1 +" → EXPECTED_EXPRESSION', () => {
    expectParseError('1 +', 'EXPECTED_EXPRESSION');
  });

  it('E05 "1 + * 2" → EXPECTED_EXPRESSION 且 span 指向 *', () => {
    try {
      parseExpression(tokenizeExpression('1 + * 2'));
      throw new Error('预期解析失败但成功');
    } catch (e) {
      if (e instanceof Error && e.message === '预期解析失败但成功') throw e;
      const pe = e as ExpressionParseError;
      expect(pe.code).toBe('EXPECTED_EXPRESSION');
      expect(pe.span).toEqual({ start: 4, end: 5 });
    }
  });

  it('E06 "(1 + 2" → EXPECTED_RPAREN', () => {
    expectParseError('(1 + 2', 'EXPECTED_RPAREN');
  });

  it('E07 "1 2" → TRAILING_TOKEN', () => {
    expectParseError('1 2', 'TRAILING_TOKEN');
  });

  it('E08 "1 + 2)" → TRAILING_TOKEN', () => {
    expectParseError('1 + 2)', 'TRAILING_TOKEN');
  });

  it('E09 "foo(," → EXPECTED_EXPRESSION', () => {
    expectParseError('foo(,', 'EXPECTED_EXPRESSION');
  });

  it('E10 "foo(a," → EXPECTED_EXPRESSION', () => {
    expectParseError('foo(a,', 'EXPECTED_EXPRESSION');
  });

  it('E11 "foo(a b)" → EXPECTED_COMMA_OR_RPAREN', () => {
    expectParseError('foo(a b)', 'EXPECTED_COMMA_OR_RPAREN');
  });
});
