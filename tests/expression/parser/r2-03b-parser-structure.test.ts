// R2-03B Parser 测试（结构与一元）：B01~B07。优先级/结合性见 r2-03b-parser-precedence.test.ts。
import { describe, expect, it } from 'vitest';
import { ast } from './helpers';

describe('R2-03B Parser · 结构', () => {
  it('B01 数字字面量（含小数）', () => {
    expect(ast('42')).toMatchObject({ type: 'NumberLiteral', value: 42 });
    expect(ast('1.5')).toMatchObject({ type: 'NumberLiteral', value: 1.5 });
  });

  it('B02 布尔字面量', () => {
    expect(ast('true')).toMatchObject({ type: 'BooleanLiteral', value: true });
    expect(ast('false')).toMatchObject({ type: 'BooleanLiteral', value: false });
  });

  it('B03 标识符', () => {
    expect(ast('fatigue')).toMatchObject({ type: 'Identifier', name: 'fatigue' });
  });

  it('B04 括号分组不产生节点', () => {
    expect(ast('(a)')).toMatchObject({ type: 'Identifier', name: 'a' });
  });

  it('B05 一元 - / !', () => {
    expect(ast('-a')).toMatchObject({
      type: 'UnaryExpression',
      operator: '-',
      operand: { type: 'Identifier', name: 'a' },
    });
    expect(ast('!b')).toMatchObject({
      type: 'UnaryExpression',
      operator: '!',
      operand: { type: 'Identifier', name: 'b' },
    });
  });

  it('B06 乘法优先于加法', () => {
    expect(ast('a + b * c')).toMatchObject({
      type: 'BinaryExpression',
      operator: '+',
      left: { type: 'Identifier', name: 'a' },
      right: {
        type: 'BinaryExpression',
        operator: '*',
        left: { type: 'Identifier', name: 'b' },
        right: { type: 'Identifier', name: 'c' },
      },
    });
  });

  it('B07 左结合：10 - 3 - 2 = (10-3)-2（专项）', () => {
    expect(ast('10 - 3 - 2')).toMatchObject({
      type: 'BinaryExpression',
      operator: '-',
      left: {
        type: 'BinaryExpression',
        operator: '-',
        left: { type: 'NumberLiteral', value: 10 },
        right: { type: 'NumberLiteral', value: 3 },
      },
      right: { type: 'NumberLiteral', value: 2 },
    });
  });
});
