// R2-03A Tokenizer 测试（数字边界与完整序列）：A13~A21。词法基础见 r2-03a-tokenizer-lexical.test.ts。
import { describe, expect, it } from 'vitest';
import { tokenizeExpression } from '../../../src/expression/tokenizer';
import { ExpressionTokenizeError } from '../../../src/expression/errors';
import { pairs } from './helpers';

function expectError(src: string, code: 'INVALID_CHARACTER' | 'INVALID_NUMBER', position: number): void {
  try {
    tokenizeExpression(src);
    throw new Error(`预期失败但成功: ${JSON.stringify(src)}`);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('预期失败但成功')) throw e;
    expect(e).toBeInstanceOf(ExpressionTokenizeError);
    const te = e as ExpressionTokenizeError;
    expect(te.code).toBe(code);
    expect(te.position).toBe(position);
  }
}

describe('R2-03A Tokenizer · 数字边界与序列', () => {
  it('A13 单独 = 明确拒绝', () => {
    expectError('=', 'INVALID_CHARACTER', 0);
    expectError('a = 1', 'INVALID_CHARACTER', 2);
  });

  it('A14 非法字符明确失败并携带 position', () => {
    expectError('a $ 1', 'INVALID_CHARACTER', 2);
  });

  it('A15 1.2.3 → INVALID_NUMBER', () => {
    expectError('1.2.3', 'INVALID_NUMBER', 0);
  });

  it('A16 空串 → 仅 EOF', () => {
    expect(pairs('')).toEqual([['EOF', '']]);
    expect(pairs('   \t\n')).toEqual([['EOF', '']]);
  });

  it('A17 fatigue + move_speed * fatigue_rate * dt 完整序列与 span', () => {
    const src = 'fatigue + move_speed * fatigue_rate * dt';
    expect(pairs(src)).toEqual([
      ['IDENTIFIER', 'fatigue'],
      ['PLUS', '+'],
      ['IDENTIFIER', 'move_speed'],
      ['STAR', '*'],
      ['IDENTIFIER', 'fatigue_rate'],
      ['STAR', '*'],
      ['IDENTIFIER', 'dt'],
      ['EOF', ''],
    ]);
    const ts = tokenizeExpression(src);
    expect(ts[0]?.span).toEqual({ start: 0, end: 7 });
    expect(ts[1]?.span).toEqual({ start: 8, end: 9 });
    expect(ts[2]?.span).toEqual({ start: 10, end: 20 });
  });

  it('A18 clamp(hp - damage, 0, 100) 完整序列', () => {
    expect(pairs('clamp(hp - damage, 0, 100)')).toEqual([
      ['IDENTIFIER', 'clamp'],
      ['LPAREN', '('],
      ['IDENTIFIER', 'hp'],
      ['MINUS', '-'],
      ['IDENTIFIER', 'damage'],
      ['COMMA', ','],
      ['NUMBER', '0'],
      ['COMMA', ','],
      ['NUMBER', '100'],
      ['RPAREN', ')'],
      ['EOF', ''],
    ]);
  });

  it('A19 5. → INVALID_NUMBER（小数点后必须有数字）', () => {
    expectError('5.', 'INVALID_NUMBER', 0);
  });

  it('A20 1e3 → INVALID_NUMBER（科学计数法明确失败而非拆成 1 e3）', () => {
    expectError('1e3', 'INVALID_NUMBER', 0);
  });

  it('A21 .5 → INVALID_CHARACTER（不支持省略前导 0）', () => {
    expectError('.5', 'INVALID_CHARACTER', 0);
  });
});
