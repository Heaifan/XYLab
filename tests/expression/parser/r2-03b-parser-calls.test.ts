// R2-03B Parser 测试（函数调用与黄金样例）。banana(a) 也必须 PASS —— 白名单属 R2-03C。
import { describe, expect, it } from 'vitest';
import { ast } from './helpers';

describe('R2-03B Parser · 函数调用', () => {
  it('C01 foo() 零参数', () => {
    expect(ast('foo()')).toMatchObject({ type: 'CallExpression', callee: 'foo', arguments: [] });
  });

  it('C02 foo(a) 单参数', () => {
    expect(ast('foo(a)')).toMatchObject({
      type: 'CallExpression',
      callee: 'foo',
      arguments: [{ type: 'Identifier', name: 'a' }],
    });
  });

  it('C03 foo(a, b, c) 多参数', () => {
    const n = ast('foo(a, b, c)');
    expect(n).toMatchObject({ type: 'CallExpression', callee: 'foo' });
    if (n.type !== 'CallExpression') throw new Error('expected call');
    expect(n.arguments).toHaveLength(3);
  });

  it('C04 参数可以是任意表达式：min(a, b + 1)', () => {
    expect(ast('min(a, b + 1)')).toMatchObject({
      type: 'CallExpression',
      callee: 'min',
      arguments: [
        { type: 'Identifier', name: 'a' },
        {
          type: 'BinaryExpression',
          operator: '+',
          left: { type: 'Identifier', name: 'b' },
          right: { type: 'NumberLiteral', value: 1 },
        },
      ],
    });
  });

  it('C05 嵌套调用：min(max(a, b), c)', () => {
    expect(ast('min(max(a, b), c)')).toMatchObject({
      type: 'CallExpression',
      callee: 'min',
      arguments: [
        {
          type: 'CallExpression',
          callee: 'max',
          arguments: [{ type: 'Identifier', name: 'a' }, { type: 'Identifier', name: 'b' }],
        },
        { type: 'Identifier', name: 'c' },
      ],
    });
  });

  it('C06 banana(a) 语法合法 → Parser PASS（白名单属 R2-03C）', () => {
    expect(ast('banana(a)')).toMatchObject({ type: 'CallExpression', callee: 'banana' });
  });

  it('C07 黄金样例 · 疲劳：fatigue + move_speed * fatigue_rate * dt', () => {
    expect(ast('fatigue + move_speed * fatigue_rate * dt')).toMatchObject({
      type: 'BinaryExpression',
      operator: '+',
      left: { type: 'Identifier', name: 'fatigue' },
      right: {
        type: 'BinaryExpression',
        operator: '*',
        left: {
          type: 'BinaryExpression',
          operator: '*',
          left: { type: 'Identifier', name: 'move_speed' },
          right: { type: 'Identifier', name: 'fatigue_rate' },
        },
        right: { type: 'Identifier', name: 'dt' },
      },
    });
  });

  it('C08 黄金样例 · 伤害钳制：clamp(hp - damage, 0, 100)', () => {
    expect(ast('clamp(hp - damage, 0, 100)')).toMatchObject({
      type: 'CallExpression',
      callee: 'clamp',
      arguments: [
        {
          type: 'BinaryExpression',
          operator: '-',
          left: { type: 'Identifier', name: 'hp' },
          right: { type: 'Identifier', name: 'damage' },
        },
        { type: 'NumberLiteral', value: 0 },
        { type: 'NumberLiteral', value: 100 },
      ],
    });
  });

  it('C09 调用与一元 span 传播', () => {
    expect(ast('min(a, b)').span).toEqual({ start: 0, end: 9 });
    expect(ast('-a').span).toEqual({ start: 0, end: 2 });
  });
});
