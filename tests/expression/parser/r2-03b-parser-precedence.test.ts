// R2-03B Parser 测试（优先级与 span）：B08~B12。
import { describe, expect, it } from 'vitest';
import { ast } from './helpers';

describe('R2-03B Parser · 优先级', () => {
  it('B08 比较优先于逻辑：a > b && c < d', () => {
    expect(ast('a > b && c < d')).toMatchObject({
      type: 'BinaryExpression',
      operator: '&&',
      left: {
        type: 'BinaryExpression',
        operator: '>',
        left: { type: 'Identifier', name: 'a' },
        right: { type: 'Identifier', name: 'b' },
      },
      right: {
        type: 'BinaryExpression',
        operator: '<',
        left: { type: 'Identifier', name: 'c' },
        right: { type: 'Identifier', name: 'd' },
      },
    });
  });

  it('B09 相等优先级低于比较：a == b < c 即 a == (b < c)', () => {
    expect(ast('a == b < c')).toMatchObject({
      type: 'BinaryExpression',
      operator: '==',
      left: { type: 'Identifier', name: 'a' },
      right: {
        type: 'BinaryExpression',
        operator: '<',
        left: { type: 'Identifier', name: 'b' },
        right: { type: 'Identifier', name: 'c' },
      },
    });
  });

  it('B10 一元高于二元：-a + b', () => {
    expect(ast('-a + b')).toMatchObject({
      type: 'BinaryExpression',
      operator: '+',
      left: { type: 'UnaryExpression', operator: '-', operand: { type: 'Identifier', name: 'a' } },
      right: { type: 'Identifier', name: 'b' },
    });
  });

  it('B11 乘法右侧一元：a * -b', () => {
    expect(ast('a * -b')).toMatchObject({
      type: 'BinaryExpression',
      operator: '*',
      left: { type: 'Identifier', name: 'a' },
      right: { type: 'UnaryExpression', operator: '-', operand: { type: 'Identifier', name: 'b' } },
    });
  });

  it('B12 span 传播：整体与左右子树', () => {
    expect(ast('a + b').span).toEqual({ start: 0, end: 5 });
    const n = ast('a + b');
    if (n.type !== 'BinaryExpression') throw new Error('expected binary');
    expect(n.left.span).toEqual({ start: 0, end: 1 });
    expect(n.right.span).toEqual({ start: 4, end: 5 });
  });
});
