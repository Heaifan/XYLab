// R2-03A Tokenizer 测试（词法基础）：A01~A12。数字边界用例见 r2-03a-tokenizer-numbers.test.ts。
import { describe, expect, it } from 'vitest';
import { tokenizeExpression } from '../../../src/expression/tokenizer';
import { pairs, types } from './helpers';

describe('R2-03A Tokenizer · 词法基础', () => {
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
    expect(() => tokenizeExpression('&')).toThrow();
    expect(() => tokenizeExpression('|')).toThrow();
  });
});
