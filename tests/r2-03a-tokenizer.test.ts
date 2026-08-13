// R2-03A Tokenizer 专项测试：A01~A18 为轮次冻结最小集，A19~A21 为数字边界补充。
import { describe, expect, it } from 'vitest';
import { tokenizeExpression } from '../src/expression/tokenizer';
import { ExpressionTokenizeError } from '../src/expression/errors';
import type { TokenType } from '../src/expression/token';

function types(src: string): TokenType[] {
  return tokenizeExpression(src).map((t) => t.type);
}

function pairs(src: string): Array<[TokenType, string]> {
  return tokenizeExpression(src).map((t) => [t.type, t.lexeme]);
}

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

describe('R2-03A Expression Tokenizer', () => {
  it('A01 整数', () => {
    expect(pairs('123')).toEqual([['NUMBER', '123'], ['EOF', '']]);
  });

  it('A02 小数', () => {
    for (const s of ['1.5', '0.08', '100.25']) {
      expect(pairs(s)).toEqual([['NUMBER', s], ['EOF', '']]);
    }
  });

  it('A03 标识符', () => {
    expect(pairs('fatigue')).toEqual([['IDENTIFIER', 'fatigue'], ['EOF', '']]);
  });

  it('A04 下划线标识符', () => {
    expect(pairs('move_speed')).toEqual([['IDENTIFIER', 'move_speed'], ['EOF', '']]);
    expect(pairs('_unit_a')).toEqual([['IDENTIFIER', '_unit_a'], ['EOF', '']]);
  });

  it('A05 true/false 是 BOOLEAN，粘连如 trueX 是 IDENTIFIER', () => {
    expect(pairs('true')).toEqual([['BOOLEAN', 'true'], ['EOF', '']]);
    expect(pairs('false')).toEqual([['BOOLEAN', 'false'], ['EOF', '']]);
    expect(pairs('trueX')).toEqual([['IDENTIFIER', 'trueX'], ['EOF', '']]);
  });

  it('A06 算术运算符', () => {
    expect(types('+ - * / %')).toEqual(['PLUS', 'MINUS', 'STAR', 'SLASH', 'PERCENT', 'EOF']);
  });

  it('A07 比较运算符', () => {
    expect(types('< > <= >= == !=')).toEqual(['LT', 'GT', 'LTE', 'GTE', 'EQ', 'NEQ', 'EOF']);
  });

  it('A08 逻辑运算符', () => {
    expect(types('&& || !')).toEqual(['AND', 'OR', 'NOT', 'EOF']);
  });

  it('A09 括号与逗号', () => {
    expect(types('(a, b)')).toEqual(['LPAREN', 'IDENTIFIER', 'COMMA', 'IDENTIFIER', 'RPAREN', 'EOF']);
  });

  it('A10 空白忽略（space/tab/CR/LF，三种写法等价）', () => {
    const expected = ['IDENTIFIER', 'PLUS', 'IDENTIFIER', 'EOF'];
    expect(types('a+b')).toEqual(expected);
    expect(types('a + b')).toEqual(expected);
    expect(types('a    +\t\nb')).toEqual(expected);
  });

  it('A11 双字符运算符 longest-match（>= <= == !=）', () => {
    expect(pairs('>= <= == !=')).toEqual([
      ['GTE', '>='],
      ['LTE', '<='],
      ['EQ', '=='],
      ['NEQ', '!='],
      ['EOF', ''],
    ]);
  });

  it('A12 && || 单 token；单个 & | 非法', () => {
    expect(pairs('&& ||')).toEqual([
      ['AND', '&&'],
      ['OR', '||'],
      ['EOF', ''],
    ]);
    expectError('&', 'INVALID_CHARACTER', 0);
    expectError('|', 'INVALID_CHARACTER', 0);
  });

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

  it('A17 fatigue + move_speed * fatigue_rate * dt 完整 token 序列与 span', () => {
    const ts = tokenizeExpression('fatigue + move_speed * fatigue_rate * dt');
    expect(pairs('fatigue + move_speed * fatigue_rate * dt')).toEqual([
      ['IDENTIFIER', 'fatigue'],
      ['PLUS', '+'],
      ['IDENTIFIER', 'move_speed'],
      ['STAR', '*'],
      ['IDENTIFIER', 'fatigue_rate'],
      ['STAR', '*'],
      ['IDENTIFIER', 'dt'],
      ['EOF', ''],
    ]);
    expect(ts[0]?.span).toEqual({ start: 0, end: 7 });
    expect(ts[1]?.span).toEqual({ start: 8, end: 9 });
    expect(ts[2]?.span).toEqual({ start: 10, end: 20 });
  });

  it('A18 clamp(hp - damage, 0, 100) 完整 token 序列', () => {
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

  it('A20 1e3 → INVALID_NUMBER（不支持科学计数法，明确失败而非拆成 1 e3）', () => {
    expectError('1e3', 'INVALID_NUMBER', 0);
  });

  it('A21 .5 → INVALID_CHARACTER（不支持省略前导 0 的写法）', () => {
    expectError('.5', 'INVALID_CHARACTER', 0);
  });
});
